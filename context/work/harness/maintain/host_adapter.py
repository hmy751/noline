"""Codex command-hook lifecycle adapter for Workspace Maintain.

The adapter owns only removable host/session state.  Workspace meaning stays in
the existing Context owners, semantic judgement stays in the persisted Codex
thread, and all Context writes go through :mod:`operation`.  Its process locks
use POSIX ``fcntl``; portability to a non-POSIX Codex host is deliberately not
claimed by this Reference adapter.
"""

from __future__ import annotations

import argparse
from collections.abc import Callable, Mapping
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from typing import Any, Iterator

from .operation import apply_maintain_decision, bootstrap_workspace
from ..workspace_contract import (
    HarnessError,
    expect_exact_keys,
    expect_nonempty_string,
    expect_schema_version,
    fail,
    validate_workspace_id,
)


MAINTAIN_HOST_CONFIG_SCHEMA_VERSION = 2
MAINTAIN_HOST_STATE_SCHEMA_VERSION = 2
_LEGACY_HOST_CONFIG_SCHEMA_VERSION = 1
_LEGACY_HOST_STATE_SCHEMA_VERSION = 1
_CONFIG_V1_KEYS = {"schema_version", "workspace_id"}
_CONFIG_V2_KEYS = {"schema_version", "mode"}
_SESSION_V1_KEYS = {
    "schema_version",
    "workspace_id",
    "thread_id",
    "grounded_at",
}
_SESSION_V2_KEYS = {
    "schema_version",
    "current_generation",
    "bindings",
}
_BINDING_KEYS = {
    "generation",
    "workspace_id",
    "thread_id",
    "grounded_at",
}
_BINDING_SNAPSHOT_KEYS = (
    "binding_generation",
    "workspace_id",
    "thread_id",
)
_STATUS_SNAPSHOT_ATTEMPTS = 5
_HEX_DIGEST = re.compile(r"^[0-9a-f]{64}$")
_HOOK_EVENTS = {
    "session-start": "SessionStart",
    "user-prompt": "UserPromptSubmit",
    "response-end": "Stop",
    "session-end": "SessionEnd",
}


def _hash_identifier(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _reject_existing_symlink_components(path: Path, label: str) -> None:
    if not path.is_absolute():
        fail(f"{label} must be an absolute path")
    current = Path(path.anchor)
    for part in path.parts[1:]:
        current = current / part
        if current.is_symlink():
            fail(f"{label} must not use symlink components")


def _atomic_write_json(path: Path, value: Mapping[str, Any]) -> None:
    _reject_existing_symlink_components(path, "Maintain runtime write path")
    path.parent.mkdir(parents=True, exist_ok=True)
    _reject_existing_symlink_components(path, "Maintain runtime write path")
    descriptor, raw_temporary = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    temporary = Path(raw_temporary)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            descriptor = -1
            json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory_descriptor = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_descriptor)
        finally:
            os.close(directory_descriptor)
    except BaseException:
        if descriptor >= 0:
            os.close(descriptor)
        temporary.unlink(missing_ok=True)
        raise


def _read_json_object(path: Path, label: str) -> dict[str, Any]:
    _reject_existing_symlink_components(path, label)
    try:
        raw = path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise HarnessError(f"{label} is not readable UTF-8 JSON: {exc}") from exc
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HarnessError(f"{label} is not valid JSON: {exc}") from exc
    if not isinstance(value, dict):
        fail(f"{label} must contain a JSON object")
    return value


def _hook_output(
    hook_event_name: str,
    *,
    additional_context: str | None = None,
    system_message: str | None = None,
) -> dict[str, Any]:
    output: dict[str, Any] = {"continue": True}
    if system_message:
        output["systemMessage"] = system_message
    if additional_context:
        output["hookSpecificOutput"] = {
            "hookEventName": hook_event_name,
            "additionalContext": additional_context,
        }
    return output


class MaintainHostAdapter:
    """Bind stable Codex hook fields to one isolated Maintainer session."""

    def __init__(
        self,
        project_root: Path,
        *,
        runtime_root: Path | None = None,
        session_type: type[Any] | None = None,
        runner: Callable[..., Any] = subprocess.run,
        popen: Callable[..., Any] = subprocess.Popen,
        clock: Callable[[], float] = time.time,
        python_executable: str = sys.executable,
        bootstrap: Callable[[Path, Path, str], dict[str, Any]] = (
            bootstrap_workspace
        ),
        apply_decision: Callable[
            [Path, Path, str, Any], dict[str, Any]
        ] = apply_maintain_decision,
    ) -> None:
        lexical_project_root = Path(project_root)
        if not lexical_project_root.is_absolute():
            lexical_project_root = Path.cwd() / lexical_project_root
        try:
            self.project_root = lexical_project_root.resolve(strict=True)
        except OSError as exc:
            raise HarnessError(f"Project root is unavailable: {exc}") from exc
        if not self.project_root.is_dir():
            fail("Project root must be a directory")
        self.work_root = self.project_root / "context" / "work"
        runtime_candidate = (
            Path(runtime_root)
            if runtime_root is not None
            else self.project_root / ".codex" / "maintain-runtime"
        )
        if not runtime_candidate.is_absolute():
            fail("Maintain runtime root must be an absolute path")
        if ".." in runtime_candidate.parts:
            fail("Maintain runtime root must not contain ancestor traversal")
        relative_runtime: Path | None = None
        for project_form in (lexical_project_root, self.project_root):
            try:
                relative_runtime = runtime_candidate.relative_to(project_form)
                break
            except ValueError:
                continue
        if relative_runtime is None:
            fail("Maintain runtime root must be inside the Project root")
        if not relative_runtime.parts:
            fail("Maintain runtime root must be below the Project root")
        # Preserve the runtime's lexical relative path while anchoring it to
        # the already-resolved Project root. This handles platform aliases
        # such as macOS /var -> /private/var without resolving runtime symlinks.
        self.runtime_root = self.project_root / relative_runtime
        self._validate_runtime_path(self.runtime_root, "Maintain runtime root")
        self._session_type_override = session_type
        self._runner = runner
        self._popen = popen
        self._clock = clock
        self._python_executable = expect_nonempty_string(
            python_executable, "Python executable"
        )
        self._bootstrap = bootstrap
        self._apply_decision = apply_decision

    def _session_type(self) -> type[Any]:
        if self._session_type_override is not None:
            return self._session_type_override
        from .codex_session import CodexMaintainSession

        return CodexMaintainSession

    def _validate_host_config(self) -> None:
        path = self.project_root / ".codex" / "maintain.json"
        value = _read_json_object(path, "Maintain host configuration")
        schema_version = value.get("schema_version")
        if schema_version == _LEGACY_HOST_CONFIG_SCHEMA_VERSION:
            # Configuration v1 selected one Workspace for every Main session.
            # It remains readable only so an installed Project can migrate
            # without interrupting already-persisted session bindings.  Its
            # workspace_id is deliberately never used to bind a new session.
            expect_exact_keys(
                value, _CONFIG_V1_KEYS, "Maintain host configuration"
            )
            expect_schema_version(
                schema_version,
                _LEGACY_HOST_CONFIG_SCHEMA_VERSION,
                "Maintain host configuration",
            )
            validate_workspace_id(value["workspace_id"])
            return
        expect_exact_keys(value, _CONFIG_V2_KEYS, "Maintain host configuration")
        expect_schema_version(
            schema_version,
            MAINTAIN_HOST_CONFIG_SCHEMA_VERSION,
            "Maintain host configuration",
        )
        mode = expect_nonempty_string(
            value["mode"], "Maintain host configuration mode"
        )
        if mode != "explicit":
            fail("Maintain host configuration mode must be 'explicit'")

    @staticmethod
    def _payload_string(payload: Mapping[str, Any], key: str) -> str:
        if not isinstance(payload, Mapping):
            fail("Codex hook input must be a JSON object")
        return expect_nonempty_string(payload.get(key), f"Codex hook {key}")

    @staticmethod
    def _check_event(payload: Mapping[str, Any], command: str) -> None:
        actual = payload.get("hook_event_name")
        if actual is not None and actual != _HOOK_EVENTS[command]:
            fail(
                f"{command} received hook_event_name {actual!r}; expected "
                f"{_HOOK_EVENTS[command]!r}"
            )

    def _session_directory(self, session_id: str) -> Path:
        path = self.runtime_root / _hash_identifier(session_id)
        self._validate_runtime_path(path, "Maintain runtime session directory")
        return path

    def _directory_from_key(self, session_key: str) -> Path:
        if not _HEX_DIGEST.fullmatch(session_key):
            fail("Maintain runtime session key must be a SHA-256 digest")
        path = self.runtime_root / session_key
        self._validate_runtime_path(path, "Maintain runtime session directory")
        return path

    def _validate_runtime_path(self, path: Path, label: str) -> None:
        if not path.is_absolute() or ".." in path.parts:
            fail(f"{label} must be an absolute lexical descendant of the Project")
        try:
            relative = path.relative_to(self.project_root)
        except ValueError as exc:
            raise HarnessError(f"{label} must stay inside the Project root") from exc
        if not relative.parts:
            fail(f"{label} must be below the Project root")
        current = self.project_root
        for part in relative.parts:
            current = current / part
            if current.is_symlink():
                fail(f"{label} must not use symlink components")
            if current.exists() and not current.is_dir():
                fail(f"{label} components must be directories")

    def _prepare_session_directory(self, session_directory: Path) -> None:
        self._validate_runtime_path(self.runtime_root, "Maintain runtime root")
        self._validate_runtime_path(
            session_directory, "Maintain runtime session directory"
        )
        try:
            session_directory.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise HarnessError(
                f"Maintain runtime session directory is unavailable: {exc}"
            ) from exc
        self._validate_runtime_path(self.runtime_root, "Maintain runtime root")
        self._validate_runtime_path(
            session_directory, "Maintain runtime session directory"
        )

    @contextmanager
    def _state_lock(self, session_directory: Path) -> Iterator[None]:
        self._prepare_session_directory(session_directory)
        lock_path = session_directory / ".state.lock"
        _reject_existing_symlink_components(lock_path, "Maintain state lock")
        descriptor = os.open(
            lock_path,
            os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0),
            0o600,
        )
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX)
            yield
        finally:
            fcntl.flock(descriptor, fcntl.LOCK_UN)
            os.close(descriptor)

    @contextmanager
    def _drain_lock(self, session_directory: Path) -> Iterator[None]:
        self._prepare_session_directory(session_directory)
        lock_path = session_directory / ".drain.lock"
        _reject_existing_symlink_components(lock_path, "Maintain drain lock")
        descriptor = os.open(
            lock_path,
            os.O_CREAT | os.O_RDWR | getattr(os, "O_NOFOLLOW", 0),
            0o600,
        )
        try:
            # Drain runs only in a detached worker.  Blocking here closes the
            # snapshot race where a later worker could otherwise observe
            # ``busy``, exit, and leave an event added after the first worker's
            # snapshot permanently pending.
            fcntl.flock(descriptor, fcntl.LOCK_EX)
            yield
        finally:
            fcntl.flock(descriptor, fcntl.LOCK_UN)
            os.close(descriptor)

    def _read_session_state(self, session_directory: Path) -> dict[str, Any]:
        path = session_directory / "session.json"
        value = _read_json_object(path, "Maintain runtime session state")
        schema_version = value.get("schema_version")
        if schema_version == _LEGACY_HOST_STATE_SCHEMA_VERSION:
            expect_exact_keys(
                value, _SESSION_V1_KEYS, "Maintain runtime session state"
            )
            expect_schema_version(
                schema_version,
                _LEGACY_HOST_STATE_SCHEMA_VERSION,
                "Maintain runtime session state",
            )
            binding = self._validated_binding(
                {
                    "generation": 1,
                    "workspace_id": value["workspace_id"],
                    "thread_id": value["thread_id"],
                    "grounded_at": value["grounded_at"],
                }
            )
            return {
                "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                "current_generation": 1,
                "bindings": [binding],
                "legacy": True,
            }

        expect_exact_keys(
            value, _SESSION_V2_KEYS, "Maintain runtime session state"
        )
        expect_schema_version(
            schema_version,
            MAINTAIN_HOST_STATE_SCHEMA_VERSION,
            "Maintain runtime session state",
        )
        raw_bindings = value["bindings"]
        if not isinstance(raw_bindings, list) or not raw_bindings:
            fail("Maintain runtime bindings must be a non-empty list")
        bindings = [self._validated_binding(item) for item in raw_bindings]
        generations = [item["generation"] for item in bindings]
        if len(set(generations)) != len(generations):
            fail("Maintain runtime binding generations must be unique")
        if generations != sorted(generations):
            fail("Maintain runtime bindings must be ordered by generation")
        current_generation = value["current_generation"]
        if current_generation is not None and (
            type(current_generation) is not int
            or current_generation not in generations
        ):
            fail(
                "Maintain runtime current_generation must name a persisted "
                "binding or be null"
            )
        return {
            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
            "current_generation": current_generation,
            "bindings": bindings,
            "legacy": False,
        }

    @staticmethod
    def _validated_binding(value: Any) -> dict[str, Any]:
        if not isinstance(value, dict):
            fail("Maintain runtime binding must be a JSON object")
        expect_exact_keys(value, _BINDING_KEYS, "Maintain runtime binding")
        generation = value["generation"]
        if type(generation) is not int or generation < 1:
            fail("Maintain runtime binding generation must be a positive integer")
        grounded_at = value["grounded_at"]
        if not isinstance(grounded_at, (int, float)) or isinstance(
            grounded_at, bool
        ):
            fail("Maintain runtime grounded_at must be a number")
        return {
            "generation": generation,
            "workspace_id": validate_workspace_id(value["workspace_id"]),
            "thread_id": expect_nonempty_string(
                value["thread_id"], "Maintain runtime thread_id"
            ),
            "grounded_at": grounded_at,
        }

    @staticmethod
    def _binding_for_generation(
        state: Mapping[str, Any], generation: int
    ) -> dict[str, Any]:
        for binding in state["bindings"]:
            if binding["generation"] == generation:
                return dict(binding)
        fail(
            f"Maintain runtime event names unknown binding generation {generation}"
        )

    def _current_binding(
        self, state: Mapping[str, Any]
    ) -> dict[str, Any] | None:
        generation = state["current_generation"]
        if generation is None:
            return None
        return self._binding_for_generation(state, generation)

    def _binding_snapshot(
        self,
        value: Mapping[str, Any],
        state: Mapping[str, Any],
        label: str,
    ) -> dict[str, Any]:
        present = [key in value for key in _BINDING_SNAPSHOT_KEYS]
        if not any(present):
            if value.get("schema_version") != _LEGACY_HOST_STATE_SCHEMA_VERSION:
                fail(f"{label} is missing its binding snapshot")
            return self._binding_for_generation(state, 1)
        if not all(present):
            fail(f"{label} has a partial binding snapshot")
        generation = value["binding_generation"]
        if type(generation) is not int or generation < 1:
            fail(f"{label} binding_generation must be a positive integer")
        binding = self._binding_for_generation(state, generation)
        workspace_id = validate_workspace_id(value["workspace_id"])
        thread_id = expect_nonempty_string(value["thread_id"], f"{label} thread_id")
        if (
            workspace_id != binding["workspace_id"]
            or thread_id != binding["thread_id"]
        ):
            fail(f"{label} binding snapshot changed")
        return binding

    @staticmethod
    def _snapshot_fields(binding: Mapping[str, Any]) -> dict[str, Any]:
        return {
            "binding_generation": binding["generation"],
            "workspace_id": binding["workspace_id"],
            "thread_id": binding["thread_id"],
        }

    @staticmethod
    def _persisted_state(state: Mapping[str, Any]) -> dict[str, Any]:
        return {
            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
            "current_generation": state["current_generation"],
            "bindings": state["bindings"],
        }

    def _next_sequence(self, session_directory: Path) -> int:
        path = session_directory / "next-sequence.json"
        if path.exists():
            value = _read_json_object(path, "Maintain runtime sequence state")
            expect_exact_keys(value, {"next"}, "Maintain runtime sequence state")
            next_value = value["next"]
            if type(next_value) is not int or next_value < 1:
                fail("Maintain runtime next sequence must be a positive integer")
        else:
            next_value = 1
        _atomic_write_json(path, {"next": next_value + 1})
        return next_value

    @staticmethod
    def _turn_path(session_directory: Path, turn_key: str) -> Path:
        return session_directory / "turns" / f"{turn_key}.json"

    @staticmethod
    def _event_path(session_directory: Path, turn_key: str) -> Path:
        return session_directory / "events" / f"{turn_key}.json"

    @staticmethod
    def _effect_path(session_directory: Path, turn_key: str) -> Path:
        return session_directory / "effects" / f"{turn_key}.json"

    def activate(self, session_id: str, workspace_id: str) -> dict[str, Any]:
        """Ground ``workspace_id`` for one Main session and future prompts.

        A prompt already captured before this call keeps its own binding
        snapshot, so its later Stop event remains on the predecessor binding.
        """

        self._validate_host_config()
        session_id = expect_nonempty_string(session_id, "Codex session id")
        workspace_id = validate_workspace_id(workspace_id)
        session_directory = self._session_directory(session_id)

        with self._state_lock(session_directory):
            state_path = session_directory / "session.json"
            if state_path.exists():
                state = self._read_session_state(session_directory)
            else:
                state = {
                    "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                    "current_generation": None,
                    "bindings": [],
                    "legacy": False,
                }
            current = self._current_binding(state)
            if current is not None and current["workspace_id"] == workspace_id:
                return {
                    "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                    "status": "already_active",
                    "session_id": session_id,
                    **self._snapshot_fields(current),
                }

            try:
                bounded_bootstrap = self._bootstrap(
                    self.project_root, self.work_root, workspace_id
                )
                session_type = self._session_type()
                semantic_session = session_type(
                    self.project_root,
                    workspace_id,
                    runner=self._runner,
                )
                grounding = semantic_session.start(bounded_bootstrap)
                thread_id = expect_nonempty_string(
                    semantic_session.thread_id,
                    "grounded Maintain thread_id",
                )
            except Exception as exc:
                message = (
                    f"Maintain grounding failed for Workspace `{workspace_id}`: "
                    f"{exc}. The previous session binding was preserved."
                )
                self._write_notice(
                    session_directory,
                    f"activation-{workspace_id}-{int(self._clock() * 1_000_000)}",
                    kind="failure",
                    message=message,
                )
                raise HarnessError(message) from exc

            if grounding.get("status") != "grounded":
                question = grounding.get("question")
                if not isinstance(question, str) or not question.strip():
                    question = "Maintainer grounding requires a user decision."
                message = (
                    f"Maintain could not ground Workspace `{workspace_id}` "
                    f"without a user decision: {question} The previous session "
                    "binding was preserved."
                )
                self._write_notice(
                    session_directory,
                    f"activation-{workspace_id}-{int(self._clock() * 1_000_000)}",
                    kind="ambiguity",
                    message=message,
                )
                raise HarnessError(message)

            generation = max(
                (binding["generation"] for binding in state["bindings"]),
                default=0,
            ) + 1
            binding = {
                "generation": generation,
                "workspace_id": workspace_id,
                "thread_id": thread_id,
                "grounded_at": self._clock(),
            }
            updated_state = {
                "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                "current_generation": generation,
                "bindings": [*state["bindings"], binding],
            }
            _atomic_write_json(state_path, updated_state)

        return {
            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
            "status": "activated",
            "session_id": session_id,
            "previous_workspace_id": (
                current["workspace_id"] if current is not None else None
            ),
            **self._snapshot_fields(binding),
        }

    def deactivate(self, session_id: str) -> dict[str, Any]:
        """Leave future prompts unbound without discarding prior generations."""

        self._validate_host_config()
        session_id = expect_nonempty_string(session_id, "Codex session id")
        session_directory = self._session_directory(session_id)
        state_path = session_directory / "session.json"
        if not session_directory.exists() or not state_path.exists():
            return {
                "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                "status": "already_unbound",
                "session_id": session_id,
                "current_binding": None,
            }
        with self._state_lock(session_directory):
            if not state_path.exists():
                return {
                    "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                    "status": "already_unbound",
                    "session_id": session_id,
                    "current_binding": None,
                }
            state = self._read_session_state(session_directory)
            current = self._current_binding(state)
            if current is None:
                status = "already_unbound"
            else:
                state["current_generation"] = None
                _atomic_write_json(state_path, self._persisted_state(state))
                status = "deactivated"
        return {
            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
            "status": status,
            "session_id": session_id,
            "previous_binding": (
                self._snapshot_fields(current) if current is not None else None
            ),
            "current_binding": None,
        }

    def routing_snapshot(self, session_id: str, turn_id: str) -> dict[str, Any] | None:
        """Return the immutable routing metadata for an admitted turn, without conversation text."""
        self._validate_host_config()
        session_id = expect_nonempty_string(session_id, "session id")
        turn_id = expect_nonempty_string(turn_id, "turn id")
        directory = self._session_directory(session_id)
        if not (directory / "session.json").exists():
            return None
        path = self._turn_path(directory, _hash_identifier(turn_id))
        if not path.exists():
            return None
        state = self._read_session_state(directory)
        turn = _read_json_object(path, "Maintain turn routing")
        binding = self._binding_snapshot(turn, state, "Maintain turn routing")
        return {"workspace_id": binding["workspace_id"],
                "binding_generation": binding["generation"]}

    def status(self, session_id: str) -> dict[str, Any]:
        """Read one Main session binding without creating runtime state."""

        self._validate_host_config()
        session_id = expect_nonempty_string(session_id, "Codex session id")
        session_directory = self._session_directory(session_id)
        state_path = session_directory / "session.json"
        if not session_directory.exists() or not state_path.exists():
            return {
                "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                "status": "unbound",
                "session_id": session_id,
                "current_binding": None,
                "bindings": [],
                "runtime": self._empty_runtime_status(),
            }
        # Runtime files use atomic replacement, so status can stay strictly
        # read-only instead of creating or touching lock files.  Re-reading
        # session state around the runtime scan prevents a newly-committed
        # generation from being interpreted against an older binding list.
        state, runtime = self._stable_status_snapshot(session_directory)
        current = self._current_binding(state)
        bindings = [
            self._snapshot_fields(binding) | {"grounded_at": binding["grounded_at"]}
            for binding in state["bindings"]
        ]
        return {
            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
            "status": "active" if current is not None else "unbound",
            "session_id": session_id,
            "current_binding": (
                self._snapshot_fields(current) if current is not None else None
            ),
            "bindings": bindings,
            "runtime": runtime,
        }

    def _stable_status_snapshot(
        self, session_directory: Path
    ) -> tuple[dict[str, Any], dict[str, Any]]:
        for _ in range(_STATUS_SNAPSHOT_ATTEMPTS):
            before = self._read_session_state(session_directory)
            try:
                runtime = self._runtime_status(session_directory, before)
            except HarnessError:
                after = self._read_session_state(session_directory)
                if after != before:
                    continue
                raise
            after = self._read_session_state(session_directory)
            if after == before:
                return before, runtime
        fail(
            "Maintain runtime changed repeatedly while status was taking a "
            "read-only snapshot; retry status"
        )

    @staticmethod
    def _empty_runtime_status() -> dict[str, Any]:
        return {
            "unresolved_event_count": 0,
            "unresolved_event_keys": [],
            "runnable_event_count": 0,
            "runnable_event_keys": [],
            "failed_effect_count": 0,
            "failed_effect_keys": [],
            "unassigned_failed_effect_count": 0,
            "unassigned_failed_effect_keys": [],
            "blocking_failure_count": 0,
            "blocking_failure_keys": [],
            "open_prompt_count": 0,
            "open_prompt_keys": [],
            "by_generation": [],
        }

    def _runtime_status(
        self,
        session_directory: Path,
        state: Mapping[str, Any],
    ) -> dict[str, Any]:
        events = self._events(session_directory)
        blocking_failure_keys = self._blocking_failure_keys(session_directory)
        blocking_failure_set = set(blocking_failure_keys)
        blocked_generations: set[int] = set()
        event_generations: dict[str, int] = {}
        for turn_key, event in events:
            binding = self._binding_snapshot(
                event, state, "Maintain runtime response-end event"
            )
            event_generations[turn_key] = binding["generation"]
            if turn_key in blocking_failure_set:
                blocked_generations.add(binding["generation"])

        unresolved_event_keys = [
            turn_key
            for turn_key, _ in events
            if not self._effect_path(session_directory, turn_key).exists()
        ]
        runnable_event_keys = [
            turn_key
            for turn_key in unresolved_event_keys
            if event_generations[turn_key] not in blocked_generations
        ]
        failed_effect_keys = self._failed_effect_keys(session_directory)
        failed_effect_generations: dict[str, int] = {}
        unassigned_failed_effect_keys: list[str] = []
        for turn_key in failed_effect_keys:
            if turn_key in event_generations:
                failed_effect_generations[turn_key] = event_generations[turn_key]
                continue
            effect_path = self._effect_path(session_directory, turn_key)
            effect = _read_json_object(
                effect_path, "Maintain runtime effect"
            )
            snapshot_present = [
                key in effect for key in _BINDING_SNAPSHOT_KEYS
            ]
            if any(snapshot_present):
                binding = self._binding_snapshot(
                    effect, state, "Maintain runtime effect"
                )
                failed_effect_generations[turn_key] = binding["generation"]
                continue
            turn_path = self._turn_path(session_directory, turn_key)
            if turn_path.exists():
                turn = _read_json_object(
                    turn_path, "Maintain runtime user-prompt event"
                )
                binding = self._binding_snapshot(
                    turn, state, "Maintain runtime user-prompt event"
                )
                failed_effect_generations[turn_key] = binding["generation"]
                continue
            unassigned_failed_effect_keys.append(turn_key)

        open_prompt_keys: list[str] = []
        open_prompt_generations: dict[str, int] = {}
        turns_directory = session_directory / "turns"
        if turns_directory.exists():
            for path in sorted(turns_directory.glob("*.json")):
                turn_key = path.stem
                if not _HEX_DIGEST.fullmatch(turn_key):
                    fail("Maintain runtime contains an invalid prompt filename")
                if self._event_path(session_directory, turn_key).exists():
                    continue
                if self._effect_path(session_directory, turn_key).exists():
                    continue
                turn = _read_json_object(
                    path, "Maintain runtime user-prompt event"
                )
                binding = self._binding_snapshot(
                    turn, state, "Maintain runtime user-prompt event"
                )
                open_prompt_keys.append(turn_key)
                open_prompt_generations[turn_key] = binding["generation"]

        by_generation: list[dict[str, Any]] = []
        for binding in state["bindings"]:
            generation = binding["generation"]
            generation_events = [
                key
                for key, event_generation in event_generations.items()
                if event_generation == generation
            ]
            generation_failed = [
                key
                for key, effect_generation in failed_effect_generations.items()
                if effect_generation == generation
            ]
            generation_blocking = [
                key for key in generation_events if key in blocking_failure_set
            ]
            generation_unresolved = [
                key for key in unresolved_event_keys if key in generation_events
            ]
            generation_runnable = [
                key for key in runnable_event_keys if key in generation_events
            ]
            generation_open = [
                key
                for key, prompt_generation in open_prompt_generations.items()
                if prompt_generation == generation
            ]
            by_generation.append(
                {
                    **self._snapshot_fields(binding),
                    "unresolved_event_count": len(generation_unresolved),
                    "runnable_event_count": len(generation_runnable),
                    "failed_effect_count": len(generation_failed),
                    "blocking_failure_count": len(generation_blocking),
                    "open_prompt_count": len(generation_open),
                }
            )

        return {
            "unresolved_event_count": len(unresolved_event_keys),
            "unresolved_event_keys": unresolved_event_keys,
            "runnable_event_count": len(runnable_event_keys),
            "runnable_event_keys": runnable_event_keys,
            "failed_effect_count": len(failed_effect_keys),
            "failed_effect_keys": failed_effect_keys,
            "unassigned_failed_effect_count": len(
                unassigned_failed_effect_keys
            ),
            "unassigned_failed_effect_keys": unassigned_failed_effect_keys,
            "blocking_failure_count": len(blocking_failure_keys),
            "blocking_failure_keys": blocking_failure_keys,
            "open_prompt_count": len(open_prompt_keys),
            "open_prompt_keys": open_prompt_keys,
            "by_generation": by_generation,
        }

    def session_start(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        self._check_event(payload, "session-start")
        session_id = self._payload_string(payload, "session_id")
        self._validate_host_config()
        session_directory = self._session_directory(session_id)
        state_path = session_directory / "session.json"
        if not session_directory.exists() or not state_path.exists():
            return _hook_output("SessionStart")
        with self._state_lock(session_directory):
            if not state_path.exists():
                return _hook_output("SessionStart")
            state = self._read_session_state(session_directory)
            current = self._current_binding(state)
        if current is None:
            return _hook_output("SessionStart")
        return _hook_output(
            "SessionStart",
            additional_context=(
                "Workspace Maintain is reusing the already-grounded session "
                f"binding generation {current['generation']} for explicit "
                f"Workspace `{current['workspace_id']}`. No new Context "
                "update or freshness claim was made."
            ),
        )

    def user_prompt(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        self._check_event(payload, "user-prompt")
        session_id = self._payload_string(payload, "session_id")
        turn_id = self._payload_string(payload, "turn_id")
        prompt = self._payload_string(payload, "prompt")
        self._validate_host_config()
        session_directory = self._session_directory(session_id)
        turn_key = _hash_identifier(turn_id)
        state_path = session_directory / "session.json"
        if not session_directory.exists() or not state_path.exists():
            return _hook_output("UserPromptSubmit")

        with self._state_lock(session_directory):
            if not state_path.exists():
                return _hook_output("UserPromptSubmit")
            state = self._read_session_state(session_directory)
            self._fail_orphan_prompts(
                session_directory,
                state,
                exclude_turn_key=turn_key,
            )
            turn_path = self._turn_path(session_directory, turn_key)
            event_path = self._event_path(session_directory, turn_key)
            if turn_path.exists():
                existing = _read_json_object(
                    turn_path, "Maintain runtime user-prompt event"
                )
                if (
                    existing.get("turn_id") != turn_id
                    or existing.get("prompt") != prompt
                ):
                    fail("duplicate Maintain turn_id has different prompt content")
                self._binding_snapshot(
                    existing, state, "Maintain runtime user-prompt event"
                )
            else:
                if event_path.exists():
                    event = _read_json_object(
                        event_path, "Maintain runtime response-end event"
                    )
                    binding = self._binding_snapshot(
                        event, state, "Maintain runtime response-end event"
                    )
                    sequence = event.get("sequence")
                else:
                    binding = self._current_binding(state)
                    if binding is None:
                        return _hook_output("UserPromptSubmit")
                    sequence = self._next_sequence(session_directory)
                if type(sequence) is not int or sequence < 1:
                    fail("Maintain runtime event sequence is invalid")
                _atomic_write_json(
                    turn_path,
                    {
                        "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                        "sequence": sequence,
                        "turn_id": turn_id,
                        "prompt": prompt,
                        "received_at": self._clock(),
                        **self._snapshot_fields(binding),
                    },
                )
                if event_path.exists():
                    if event.get("turn_id") != turn_id:
                        fail("Maintain runtime response-end turn binding changed")
                    event["user_prompt"] = prompt
                    _atomic_write_json(event_path, event)
            notices = self._take_notices(session_directory)
            unresolved = self._unresolved_event_keys(session_directory)
            blocking_failures = self._blocking_failure_keys(session_directory)
            runnable = self._runnable_unresolved_event_keys(
                session_directory, state
            )

        # A previous detached worker may have crashed or lost a launch race.
        # Re-kicking is safe because the per-session drain lock serializes the
        # workers and the effect file makes resolved boundaries effect-once.
        if runnable:
            self._start_detached_drain(session_directory.name)

        if not notices and not unresolved and not blocking_failures:
            return _hook_output("UserPromptSubmit")
        messages = [str(notice["message"]) for notice in notices]
        if unresolved:
            if blocking_failures and not runnable:
                messages.append(
                    f"{len(unresolved)} later Workspace Maintain response-end "
                    "boundary/boundaries remain pending behind a failed "
                    "semantic or apply boundary. They were not applied, do not "
                    "establish fresh or current Context, and will not be "
                    "retried on the affected binding generation."
                )
            else:
                messages.append(
                    f"{len(unresolved)} previously accepted Workspace Maintain "
                    "response-end boundary/boundaries are still pending. They "
                    "are not completed and do not establish fresh or current "
                    "Context; a detached worker was started again."
                )
        elif blocking_failures:
            messages.append(
                "Automatic Workspace Maintain is paused on at least one binding "
                "generation after a failed semantic or apply boundary. No later "
                "Context freshness is claimed for that generation."
            )
        context = "Previous Workspace Maintain results requiring attention:\n- " + (
            "\n- ".join(messages)
        )
        return _hook_output(
            "UserPromptSubmit",
            additional_context=context,
            system_message=(
                "Workspace Maintain has a previous result or pending boundary "
                "requiring attention."
            ),
        )

    def response_end(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        self._check_event(payload, "response-end")
        session_id = self._payload_string(payload, "session_id")
        turn_id = self._payload_string(payload, "turn_id")
        main_response = self._payload_string(
            payload, "last_assistant_message"
        )
        self._validate_host_config()
        session_directory = self._session_directory(session_id)
        session_key = session_directory.name
        turn_key = _hash_identifier(turn_id)
        state_path = session_directory / "session.json"
        if not session_directory.exists() or not state_path.exists():
            return _hook_output("Stop")

        with self._state_lock(session_directory):
            if not state_path.exists():
                return _hook_output("Stop")
            state = self._read_session_state(session_directory)
            turn_path = self._turn_path(session_directory, turn_key)
            event_path = self._event_path(session_directory, turn_key)
            existing_event: dict[str, Any] | None = None
            if event_path.exists():
                existing_event = _read_json_object(
                    event_path, "Maintain runtime response-end event"
                )
            if turn_path.exists():
                turn = _read_json_object(
                    turn_path, "Maintain runtime user-prompt event"
                )
                if turn.get("turn_id") != turn_id:
                    fail("Maintain runtime prompt turn binding changed")
                sequence = turn.get("sequence")
                user_prompt = turn.get("prompt")
                binding = self._binding_snapshot(
                    turn, state, "Maintain runtime user-prompt event"
                )
                if existing_event is not None:
                    existing_binding = self._binding_snapshot(
                        existing_event,
                        state,
                        "Maintain runtime response-end event",
                    )
                    if existing_binding != binding:
                        fail("Maintain runtime prompt and response binding changed")
            elif existing_event is not None:
                sequence = existing_event.get("sequence")
                user_prompt = existing_event.get("user_prompt")
                binding = self._binding_snapshot(
                    existing_event,
                    state,
                    "Maintain runtime response-end event",
                )
            else:
                # Explicit activation can occur inside a Main turn whose
                # UserPromptSubmit was intentionally unbound and therefore
                # wrote no turn snapshot.  Assigning that Stop to the newly
                # activated binding would cross the cutover boundary.  New
                # state therefore accepts only paired Stops; legacy v1 state
                # keeps its historical response-only failure accounting.
                if not state["legacy"]:
                    return _hook_output("Stop")
                binding = self._current_binding(state)
                if binding is None:
                    return _hook_output("Stop")
                sequence = self._next_sequence(session_directory)
                user_prompt = None
            if type(sequence) is not int or sequence < 1:
                fail("Maintain runtime turn sequence is invalid")
            event = {
                "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                "sequence": sequence,
                "turn_id": turn_id,
                "user_prompt": user_prompt,
                "main_response": main_response,
                "accepted_at": self._clock(),
                **self._snapshot_fields(binding),
            }
            if existing_event is not None:
                stable_existing = {
                    key: existing_event.get(key)
                    for key in (
                        "sequence",
                        "turn_id",
                        "user_prompt",
                        "main_response",
                    )
                }
                stable_event = {
                    key: event[key]
                    for key in (
                        "sequence",
                        "turn_id",
                        "user_prompt",
                        "main_response",
                    )
                }
                if stable_existing != stable_event:
                    fail("duplicate Maintain response-end has different content")
            else:
                _atomic_write_json(event_path, event)
            runnable = self._runnable_unresolved_event_keys(
                session_directory, state
            )

        if runnable:
            self._start_detached_drain(session_key)
        return _hook_output("Stop")

    def session_end(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        self._check_event(payload, "session-end")
        session_id = self._payload_string(payload, "session_id")
        self._validate_host_config()
        session_directory = self._session_directory(session_id)
        session_key = session_directory.name
        state_path = session_directory / "session.json"
        if not session_directory.exists() or not state_path.exists():
            return _hook_output("SessionEnd")

        with self._state_lock(session_directory):
            if not state_path.exists():
                return _hook_output("SessionEnd")
            state = self._read_session_state(session_directory)
            orphaned = self._fail_orphan_prompts(session_directory, state)
            unresolved = self._unresolved_event_keys(session_directory)
            failed = self._failed_effect_keys(session_directory)
            blocking_failures = self._blocking_failure_keys(session_directory)
            runnable = self._runnable_unresolved_event_keys(
                session_directory, state
            )
            notices = self._take_notices(session_directory)
            _atomic_write_json(
                session_directory / "session-end.json",
                {
                    "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                    "ended_at": self._clock(),
                    "blocking_failure_keys": blocking_failures,
                    "failed_effect_keys": failed,
                    "orphan_prompt_keys": orphaned,
                    "surfaced_notice_count": len(notices),
                    "unresolved_event_keys": unresolved,
                },
            )
        if runnable:
            self._start_detached_drain(session_key)
        if unresolved or orphaned or failed or notices:
            status_message = (
                f"Maintain session ended with {len(orphaned)} prompt(s) missing "
                f"a response-end and {len(unresolved)} accepted response-end "
                f"event(s) not yet resolved; {len(failed)} effect(s) are "
                "failed, not completed. Completion or freshness is not claimed."
            )
            if runnable:
                status_message += (
                    " A best-effort worker was started for accepted "
                    "response-end events."
                )
            elif unresolved:
                status_message += (
                    " Later events remain pending behind a failed semantic or "
                    "apply boundary on their binding generation and were not "
                    "retried."
                )
            notice_messages = [str(notice["message"]) for notice in notices]
            message = "\n".join([status_message, *notice_messages])
            return _hook_output(
                "SessionEnd",
                additional_context=message,
                system_message=message,
            )
        return _hook_output("SessionEnd")

    def _fail_orphan_prompts(
        self,
        session_directory: Path,
        state: Mapping[str, Any],
        *,
        exclude_turn_key: str | None = None,
    ) -> list[str]:
        """Expose prompts superseded or ended without a matching Stop event."""

        turns_directory = session_directory / "turns"
        if not turns_directory.exists():
            return []
        orphaned: list[str] = []
        for turn_path in sorted(turns_directory.glob("*.json")):
            turn_key = turn_path.stem
            if turn_key == exclude_turn_key:
                continue
            if not _HEX_DIGEST.fullmatch(turn_key):
                fail("Maintain runtime contains an invalid prompt filename")
            if self._event_path(session_directory, turn_key).exists():
                continue
            effect_path = self._effect_path(session_directory, turn_key)
            if effect_path.exists():
                continue
            turn = _read_json_object(
                turn_path, "Maintain runtime user-prompt event"
            )
            binding = self._binding_snapshot(
                turn, state, "Maintain runtime user-prompt event"
            )
            turn_id = turn.get("turn_id")
            message = (
                f"Maintain received prompt turn `{turn_id}` without a matching "
                "response-end before the session advanced. That boundary is "
                "failed and no completion or freshness is claimed."
            )
            self._write_notice(
                session_directory,
                turn_key,
                kind="failure",
                message=message,
            )
            _atomic_write_json(
                effect_path,
                {
                    "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                    "blocks_later_events": False,
                    "status": "failed",
                    "finished_at": self._clock(),
                    "error": "prompt_without_response_end",
                    **self._snapshot_fields(binding),
                },
            )
            orphaned.append(turn_key)
        return orphaned

    def _start_detached_drain(self, session_key: str) -> None:
        command = [
            self._python_executable,
            "-m",
            "context.work.harness.maintain.host_adapter",
            "drain",
            "--project-root",
            str(self.project_root),
            "--runtime-root",
            str(self.runtime_root),
            "--session-key",
            session_key,
        ]
        try:
            self._popen(
                command,
                cwd=self.project_root,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True,
                close_fds=True,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            session_directory = self._directory_from_key(session_key)
            self._write_notice(
                session_directory,
                f"spawn-{int(self._clock() * 1_000_000)}",
                kind="failure",
                message=(
                    "Maintain accepted a response-end but could not start its "
                    f"background worker: {exc}. Completion is not claimed."
                ),
            )

    def _events(self, session_directory: Path) -> list[tuple[str, dict[str, Any]]]:
        events_directory = session_directory / "events"
        if not events_directory.exists():
            return []
        events: list[tuple[str, dict[str, Any]]] = []
        for path in events_directory.glob("*.json"):
            turn_key = path.stem
            if not _HEX_DIGEST.fullmatch(turn_key):
                fail("Maintain runtime contains an invalid event filename")
            event = _read_json_object(path, "Maintain runtime response-end event")
            sequence = event.get("sequence")
            if type(sequence) is not int or sequence < 1:
                fail("Maintain runtime event sequence is invalid")
            events.append((turn_key, event))
        events.sort(key=lambda item: (item[1]["sequence"], item[0]))
        return events

    def _unresolved_event_keys(self, session_directory: Path) -> list[str]:
        return [
            turn_key
            for turn_key, _ in self._events(session_directory)
            if not self._effect_path(session_directory, turn_key).exists()
        ]

    def _failed_effect_keys(self, session_directory: Path) -> list[str]:
        effects_directory = session_directory / "effects"
        if not effects_directory.exists():
            return []
        failed: list[str] = []
        for path in sorted(effects_directory.glob("*.json")):
            if not _HEX_DIGEST.fullmatch(path.stem):
                fail("Maintain runtime contains an invalid effect filename")
            effect = _read_json_object(path, "Maintain runtime effect")
            if effect.get("status") == "failed":
                failed.append(path.stem)
        return failed

    @staticmethod
    def _effect_blocks_later_events(effect: Mapping[str, Any]) -> bool:
        if "blocks_later_events" not in effect:
            # schema v1 effects written before failure ordering was added did
            # not distinguish pairing failures from semantic/apply failures.
            # Treat an old failed effect as blocking rather than risk applying
            # a later event against an uncertain thread/Context relationship.
            return effect.get("status") == "failed"
        blocks_later = effect.get("blocks_later_events")
        if type(blocks_later) is not bool:
            fail("Maintain runtime effect blocking flag must be boolean")
        return blocks_later

    def _blocking_failure_keys(self, session_directory: Path) -> list[str]:
        blocking: list[str] = []
        for turn_key, _ in self._events(session_directory):
            effect_path = self._effect_path(session_directory, turn_key)
            if not effect_path.exists():
                continue
            effect = _read_json_object(
                effect_path, "Maintain runtime effect"
            )
            if (
                effect.get("status") == "failed"
                and self._effect_blocks_later_events(effect)
            ):
                blocking.append(turn_key)
        return blocking

    def _blocking_generations(
        self,
        session_directory: Path,
        state: Mapping[str, Any],
    ) -> set[int]:
        blocking: set[int] = set()
        for turn_key, event in self._events(session_directory):
            effect_path = self._effect_path(session_directory, turn_key)
            if not effect_path.exists():
                continue
            effect = _read_json_object(
                effect_path, "Maintain runtime effect"
            )
            if (
                effect.get("status") == "failed"
                and self._effect_blocks_later_events(effect)
            ):
                binding = self._binding_snapshot(
                    event, state, "Maintain runtime response-end event"
                )
                blocking.add(binding["generation"])
        return blocking

    def _runnable_unresolved_event_keys(
        self,
        session_directory: Path,
        state: Mapping[str, Any],
    ) -> list[str]:
        blocked_generations = self._blocking_generations(
            session_directory, state
        )
        runnable: list[str] = []
        for turn_key, event in self._events(session_directory):
            if self._effect_path(session_directory, turn_key).exists():
                continue
            binding = self._binding_snapshot(
                event, state, "Maintain runtime response-end event"
            )
            if binding["generation"] not in blocked_generations:
                runnable.append(turn_key)
        return runnable

    def _write_notice(
        self,
        session_directory: Path,
        notice_key: str,
        *,
        kind: str,
        message: str,
    ) -> None:
        if kind not in {"important", "ambiguity", "failure"}:
            fail("Maintain notifications are limited to important results and failures")
        safe_key = _hash_identifier(notice_key)
        path = session_directory / "notices" / f"{safe_key}.json"
        _atomic_write_json(
            path,
            {
                "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                "kind": kind,
                "message": expect_nonempty_string(message, "Maintain notice"),
                "created_at": self._clock(),
            },
        )

    def _take_notices(self, session_directory: Path) -> list[dict[str, Any]]:
        notices_directory = session_directory / "notices"
        if not notices_directory.exists():
            return []
        surfaced_directory = session_directory / "surfaced-notices"
        surfaced_directory.mkdir(parents=True, exist_ok=True)
        notices: list[tuple[Path, dict[str, Any]]] = []
        for path in notices_directory.glob("*.json"):
            notice = _read_json_object(path, "Maintain runtime notification")
            if notice.get("kind") not in {"important", "ambiguity", "failure"}:
                fail("Maintain runtime notification kind is invalid")
            if not isinstance(notice.get("created_at"), (int, float)):
                fail("Maintain runtime notification timestamp is invalid")
            expect_nonempty_string(
                notice.get("message"), "Maintain runtime notification message"
            )
            notices.append((path, notice))
        notices.sort(key=lambda item: (item[1]["created_at"], item[0].name))
        for path, _ in notices:
            os.replace(path, surfaced_directory / path.name)
        return [notice for _, notice in notices]

    def _notification_for_result(
        self,
        session_directory: Path,
        turn_key: str,
        result: Mapping[str, Any],
    ) -> None:
        context_status = result.get("context_status")
        importance = result.get("importance")
        workspace_id = result.get("workspace_id")
        summary = result.get("summary")
        if context_status == "needs_user_decision":
            question = result.get("question")
            self._write_notice(
                session_directory,
                turn_key,
                kind="ambiguity",
                message=(
                    f"Maintain needs a decision for Workspace `{workspace_id}`: "
                    f"{question} No related Context write was made."
                ),
            )
        elif context_status == "updated" and importance == "important":
            changed = result.get("changed")
            paths = []
            if isinstance(changed, list):
                paths = [
                    str(item.get("path"))
                    for item in changed
                    if isinstance(item, Mapping) and item.get("path")
                ]
            path_text = f" Changed: {', '.join(paths)}." if paths else ""
            self._write_notice(
                session_directory,
                turn_key,
                kind="important",
                message=(
                    f"Maintain updated Workspace `{workspace_id}`: {summary}."
                    f"{path_text}"
                ),
            )

    def drain(self, session_key: str) -> dict[str, Any]:
        session_directory = self._directory_from_key(session_key)
        self._validate_host_config()
        summary = {
            "session_key": session_key,
            "processed": 0,
            "failed": 0,
            "already_resolved": 0,
            "blocked": 0,
            "busy": False,
        }
        with self._drain_lock(session_directory):
            with self._state_lock(session_directory):
                state = self._read_session_state(session_directory)
                events = self._events(session_directory)
            blocked_generations: set[int] = set()
            for turn_key, event in events:
                binding = self._binding_snapshot(
                    event, state, "Maintain runtime response-end event"
                )
                workspace_id = binding["workspace_id"]
                generation = binding["generation"]
                effect_path = self._effect_path(session_directory, turn_key)
                if effect_path.exists():
                    summary["already_resolved"] += 1
                    effect = _read_json_object(
                        effect_path, "Maintain runtime effect"
                    )
                    if (
                        effect.get("status") == "failed"
                        and self._effect_blocks_later_events(effect)
                    ):
                        blocked_generations.add(generation)
                    continue
                if generation in blocked_generations:
                    summary["blocked"] += 1
                    continue
                user_prompt = event.get("user_prompt")
                turn_id = event.get("turn_id")
                main_response = event.get("main_response")
                if not all(
                    isinstance(value, str) and value.strip()
                    for value in (user_prompt, turn_id, main_response)
                ):
                    message = (
                        "Maintain could not pair a response-end with its stable "
                        "user prompt and turn_id. No completion or freshness is "
                        "claimed."
                    )
                    self._write_notice(
                        session_directory,
                        turn_key,
                        kind="failure",
                        message=message,
                    )
                    _atomic_write_json(
                        effect_path,
                        {
                            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                            "blocks_later_events": False,
                            "status": "failed",
                            "finished_at": self._clock(),
                            "error": message,
                            **self._snapshot_fields(binding),
                        },
                    )
                    summary["failed"] += 1
                    continue
                try:
                    session_type = self._session_type()
                    semantic_session = session_type.restore(
                        self.project_root,
                        workspace_id,
                        thread_id=binding["thread_id"],
                        runner=self._runner,
                    )
                    decision = semantic_session.resume(
                        {
                            "workspace_id": workspace_id,
                            "turn_id": turn_id,
                            "user_prompt": user_prompt,
                            "main_response": main_response,
                        }
                    )
                    result = self._apply_decision(
                        self.project_root,
                        self.work_root,
                        workspace_id,
                        decision,
                    )
                    self._notification_for_result(
                        session_directory, turn_key, result
                    )
                    _atomic_write_json(
                        effect_path,
                        {
                            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                            "status": "resolved",
                            "finished_at": self._clock(),
                            "context_status": result.get("context_status"),
                            "importance": result.get("importance"),
                            **self._snapshot_fields(binding),
                        },
                    )
                    summary["processed"] += 1
                except Exception as exc:
                    message = (
                        f"Maintain failed while processing Workspace "
                        f"`{workspace_id}` response-end: {exc}. The event is "
                        "failed, not completed; inspect actual Context before "
                        "retrying."
                    )
                    self._write_notice(
                        session_directory,
                        turn_key,
                        kind="failure",
                        message=message,
                    )
                    _atomic_write_json(
                        effect_path,
                        {
                            "schema_version": MAINTAIN_HOST_STATE_SCHEMA_VERSION,
                            "blocks_later_events": True,
                            "status": "failed",
                            "finished_at": self._clock(),
                            "error": str(exc),
                            **self._snapshot_fields(binding),
                        },
                    )
                    summary["failed"] += 1
                    blocked_generations.add(generation)
        return summary


def _discover_project_root(start: Path) -> Path:
    try:
        candidate = start.resolve(strict=True)
    except OSError as exc:
        raise HarnessError(f"Codex hook cwd is unavailable: {exc}") from exc
    if candidate.is_file():
        candidate = candidate.parent
    for directory in (candidate, *candidate.parents):
        if (directory / ".codex" / "maintain.json").is_file():
            return directory
    fail("could not find project .codex/maintain.json from Codex hook cwd")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the Codex Maintain host adapter")
    parser.add_argument(
        "command",
        choices=(
            "activate",
            "deactivate",
            "status",
            "session-start",
            "user-prompt",
            "response-end",
            "session-end",
            "drain",
        ),
    )
    parser.add_argument(
        "control_value",
        nargs="?",
        help="Workspace id for positional 'activate WORKSPACE_ID'",
    )
    parser.add_argument("--project-root")
    parser.add_argument("--runtime-root")
    parser.add_argument("--session-key")
    parser.add_argument("--session-id")
    parser.add_argument("--workspace-id")
    return parser


def _stdin_payload() -> dict[str, Any]:
    try:
        value = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        raise HarnessError(f"Codex hook stdin is not valid JSON: {exc}") from exc
    if not isinstance(value, dict):
        fail("Codex hook stdin must contain a JSON object")
    return value


def _control_session_id(explicit_session_id: str | None) -> str:
    candidate = (
        explicit_session_id
        if explicit_session_id is not None
        else os.environ.get("CODEX_SESSION_ID")
    )
    if candidate is None:
        fail(
            "Maintain control command requires --session-id or "
            "CODEX_SESSION_ID"
        )
    return expect_nonempty_string(candidate, "Codex session id")


def main(argv: list[str] | None = None) -> int:
    arguments = _parser().parse_args(argv)
    try:
        payload: dict[str, Any] | None = None
        is_hook_command = arguments.command in _HOOK_EVENTS
        if arguments.project_root:
            project_root = Path(arguments.project_root)
        elif arguments.command == "drain":
            fail("drain requires --project-root")
        elif is_hook_command:
            payload = _stdin_payload()
            project_root = _discover_project_root(
                Path(str(payload.get("cwd", Path.cwd())))
            )
        else:
            project_root = _discover_project_root(Path.cwd())
        adapter = MaintainHostAdapter(
            project_root,
            runtime_root=(
                Path(arguments.runtime_root) if arguments.runtime_root else None
            ),
        )
        if arguments.command == "drain":
            if not arguments.session_key:
                fail("drain requires --session-key")
            if (
                arguments.control_value
                or arguments.session_id
                or arguments.workspace_id
            ):
                fail("drain does not accept session or Workspace control options")
            output = adapter.drain(arguments.session_key)
        elif arguments.command == "activate":
            if arguments.session_key:
                fail("--session-key is only valid for drain")
            if (
                arguments.workspace_id
                and arguments.control_value
                and arguments.workspace_id != arguments.control_value
            ):
                fail("activate received two different Workspace ids")
            workspace_id = arguments.workspace_id or arguments.control_value
            if not workspace_id:
                fail("activate requires WORKSPACE_ID or --workspace-id")
            output = adapter.activate(
                _control_session_id(arguments.session_id),
                workspace_id,
            )
        elif arguments.command == "deactivate":
            if (
                arguments.control_value
                or arguments.session_key
                or arguments.workspace_id
            ):
                fail("deactivate accepts only session selection options")
            output = adapter.deactivate(
                _control_session_id(arguments.session_id)
            )
        elif arguments.command == "status":
            if (
                arguments.control_value
                or arguments.session_key
                or arguments.workspace_id
            ):
                fail("status accepts only session selection options")
            output = adapter.status(_control_session_id(arguments.session_id))
        else:
            if arguments.session_key:
                fail("--session-key is only valid for drain")
            if (
                arguments.control_value
                or arguments.session_id
                or arguments.workspace_id
            ):
                fail("hook commands do not accept session control options")
            if payload is None:
                payload = _stdin_payload()
            handlers = {
                "session-start": adapter.session_start,
                "user-prompt": adapter.user_prompt,
                "response-end": adapter.response_end,
                "session-end": adapter.session_end,
            }
            output = handlers[arguments.command](payload)
        print(json.dumps(output, ensure_ascii=False, sort_keys=True))
        return 0
    except (HarnessError, OSError, ValueError) as exc:
        if arguments.command in {"drain", "activate", "deactivate", "status"}:
            print(f"Maintain {arguments.command} failed: {exc}", file=sys.stderr)
            return 2
        event_name = _HOOK_EVENTS[arguments.command]
        message = (
            f"Workspace Maintain {arguments.command} failed: {exc}. "
            "No success, freshness, or completion is claimed."
        )
        print(
            json.dumps(
                _hook_output(
                    event_name,
                    additional_context=message,
                    system_message=message,
                ),
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
