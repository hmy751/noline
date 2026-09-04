"""Claude Code lifecycle adapter for the Workspace Maintain host contract.

Claude Code exposes a session id and prompt/response text in hook payloads, but
does not include a turn id shared by ``UserPromptSubmit`` and ``Stop``.  This
adapter keeps that narrow pairing state inside the ignored Claude runtime and
delegates all binding, event, worker and Context-write rules to
``MaintainHostAdapter``.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shlex
import sys
from typing import Any, Mapping, TextIO
import uuid

from ..workspace_contract import HarnessError, expect_nonempty_string, fail
from .host_adapter import (
    MaintainHostAdapter,
    _atomic_write_json,
    _read_json_object as _read_host_json_object,
)


_HOOK_EVENTS = {
    "session-start": "SessionStart",
    "user-prompt": "UserPromptSubmit",
    "response-end": "Stop",
    "session-end": "SessionEnd",
}
_CONTROL_COMMANDS = {"activate", "deactivate", "status"}
_CLAUDE_SESSION_ENV = "NOLINE_MAINTAIN_CLAUDE_SESSION_ID"
_TURN_STATE_SCHEMA_VERSION = 1


def _hook_output(
    event_name: str,
    *,
    additional_context: str | None = None,
    system_message: str | None = None,
) -> dict[str, Any]:
    output: dict[str, Any] = {"continue": True}
    if system_message:
        output["systemMessage"] = system_message
    if additional_context:
        output["hookSpecificOutput"] = {
            "hookEventName": event_name,
            "additionalContext": additional_context,
        }
    return output


class ClaudeHookAdapter:
    """Translate Claude Code hooks without making an implicit Workspace choice."""

    def __init__(
        self,
        project_root: Path,
        *,
        adapter: MaintainHostAdapter | None = None,
        environ: Mapping[str, str] | None = None,
    ) -> None:
        self.project_root = Path(project_root).resolve()
        self.runtime_root = self.project_root / ".claude" / "maintain-runtime"
        self.adapter = adapter or MaintainHostAdapter(
            self.project_root, runtime_root=self.runtime_root
        )
        self.environ = dict(os.environ if environ is None else environ)

    @staticmethod
    def _session_key(session_id: str) -> str:
        return hashlib.sha256(session_id.encode("utf-8")).hexdigest()

    def _turn_state_path(self, session_id: str) -> Path:
        return (
            self.runtime_root
            / self._session_key(session_id)
            / "claude-hook-turn-state.json"
        )

    def _turn_state_session_directory(self, session_id: str) -> Path:
        """Return the same lexical session directory that the host owns."""
        return self.adapter._session_directory(session_id)

    @staticmethod
    def _payload_string(payload: Mapping[str, Any], key: str) -> str:
        if not isinstance(payload, dict):
            fail("Claude hook input must be a JSON object")
        return expect_nonempty_string(payload.get(key), f"Claude hook {key}")

    @staticmethod
    def _is_subagent_payload(payload: Mapping[str, Any]) -> bool:
        """Keep a Main-session binding out of Claude subagent hook events."""
        agent_id = payload.get("agent_id")
        return isinstance(agent_id, str) and bool(agent_id.strip())

    def _base_payload(
        self, payload: Mapping[str, Any], command: str
    ) -> dict[str, Any]:
        actual = payload.get("hook_event_name")
        expected = _HOOK_EVENTS[command]
        if actual != expected:
            fail(
                f"{command} received hook_event_name {actual!r}; expected {expected!r}"
            )
        return {
            "hook_event_name": expected,
            "session_id": self._payload_string(payload, "session_id"),
            "cwd": str(payload.get("cwd") or self.project_root),
        }

    def _write_session_environment(self, session_id: str) -> None:
        environment_file = self.environ.get("CLAUDE_ENV_FILE")
        if not environment_file:
            return
        path = Path(environment_file)
        try:
            with path.open("a", encoding="utf-8") as stream:
                stream.write(
                    f"export {_CLAUDE_SESSION_ENV}={shlex.quote(session_id)}\n"
                )
        except OSError as exc:
            raise HarnessError(
                f"Claude SessionStart could not persist session selector: {exc}"
            ) from exc

    def _read_turn_state(self, session_id: str) -> dict[str, Any] | None:
        path = self._turn_state_path(session_id)
        if not path.exists():
            return None
        value = _read_host_json_object(path, "Claude Maintain turn state")
        if value.get("schema_version") != _TURN_STATE_SCHEMA_VERSION:
            fail("Claude Maintain turn state has an unsupported schema version")
        pending = value.get("pending")
        last_stop = value.get("last_stop")
        for label, candidate in (("pending", pending), ("last_stop", last_stop)):
            if candidate is not None and not isinstance(candidate, dict):
                fail(f"Claude Maintain turn state {label} must be an object or null")
        return value

    def _write_turn_state(self, session_id: str, value: Mapping[str, Any]) -> None:
        session_directory = self._turn_state_session_directory(session_id)
        path = self._turn_state_path(session_id)
        try:
            # Use the host adapter's runtime-root validation, lock, and atomic
            # writer.  A Claude payload must not introduce a weaker file-write
            # path than the persisted binding/event state it accompanies.
            with self.adapter._state_lock(session_directory):
                _atomic_write_json(path, value)
        except OSError as exc:
            raise HarnessError(f"Claude Maintain turn state could not be saved: {exc}") from exc

    def session_start(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if self._is_subagent_payload(payload):
            return _hook_output("SessionStart")
        normalized = self._base_payload(payload, "session-start")
        self._write_session_environment(normalized["session_id"])
        return self.adapter.session_start(normalized)

    def user_prompt(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if self._is_subagent_payload(payload):
            return _hook_output("UserPromptSubmit")
        normalized = self._base_payload(payload, "user-prompt")
        session_id = normalized["session_id"]
        normalized["prompt"] = self._payload_string(payload, "prompt")
        if self.adapter.status(session_id)["status"] != "active":
            return _hook_output("UserPromptSubmit")

        state = self._read_turn_state(session_id)
        pending = state.get("pending") if state else None
        if pending and pending.get("prompt") == normalized["prompt"]:
            turn_id = expect_nonempty_string(
                pending.get("turn_id"), "Claude Maintain pending turn id"
            )
        else:
            turn_id = str(uuid.uuid4())
        normalized["turn_id"] = turn_id
        output = self.adapter.user_prompt(normalized)
        self._write_turn_state(
            session_id,
            {
                "schema_version": _TURN_STATE_SCHEMA_VERSION,
                "pending": {"turn_id": turn_id, "prompt": normalized["prompt"]},
                "last_stop": None,
            },
        )
        return output

    def response_end(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if self._is_subagent_payload(payload):
            return _hook_output("Stop")
        normalized = self._base_payload(payload, "response-end")
        session_id = normalized["session_id"]
        normalized["last_assistant_message"] = self._payload_string(
            payload, "last_assistant_message"
        )
        normalized["stop_hook_active"] = bool(payload.get("stop_hook_active", False))
        if self.adapter.status(session_id)["status"] != "active":
            return _hook_output("Stop")

        state = self._read_turn_state(session_id)
        pending = state.get("pending") if state else None
        last_stop = state.get("last_stop") if state else None
        if pending is not None:
            turn_id = expect_nonempty_string(
                pending.get("turn_id"), "Claude Maintain pending turn id"
            )
        elif (
            last_stop is not None
            and last_stop.get("last_assistant_message")
            == normalized["last_assistant_message"]
        ):
            turn_id = expect_nonempty_string(
                last_stop.get("turn_id"), "Claude Maintain stopped turn id"
            )
        else:
            # A session can be activated during an already-unbound turn.  That
            # turn has no prompt snapshot and must not be retroactively bound.
            return _hook_output("Stop")

        normalized["turn_id"] = turn_id
        output = self.adapter.response_end(normalized)
        self._write_turn_state(
            session_id,
            {
                "schema_version": _TURN_STATE_SCHEMA_VERSION,
                "pending": None,
                "last_stop": {
                    "turn_id": turn_id,
                    "last_assistant_message": normalized["last_assistant_message"],
                },
            },
        )
        return output

    def session_end(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if self._is_subagent_payload(payload):
            return _hook_output("SessionEnd")
        return self.adapter.session_end(self._base_payload(payload, "session-end"))

    def control(
        self, command: str, *, workspace_id: str | None, session_id: str | None
    ) -> dict[str, Any]:
        if command not in _CONTROL_COMMANDS:
            fail(f"unsupported Claude Maintain control command: {command}")
        selected_session_id = session_id or self.environ.get(_CLAUDE_SESSION_ENV)
        selected_session_id = expect_nonempty_string(
            selected_session_id, f"{_CLAUDE_SESSION_ENV} or --session-id"
        )
        if command == "activate":
            if not workspace_id:
                fail("activate requires a Workspace id")
            return self.adapter.activate(selected_session_id, workspace_id)
        if workspace_id:
            fail(f"{command} does not accept a Workspace id")
        if command == "deactivate":
            return self.adapter.deactivate(selected_session_id)
        return self.adapter.status(selected_session_id)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the Claude Maintain adapter")
    parser.add_argument(
        "command",
        choices=(*_HOOK_EVENTS, *_CONTROL_COMMANDS),
    )
    parser.add_argument("workspace_id", nargs="?")
    parser.add_argument("--session-id")
    return parser


def main(
    argv: list[str] | None = None,
    *,
    project_root: Path | None = None,
    stdin: TextIO | None = None,
    stdout: TextIO | None = None,
    environ: Mapping[str, str] | None = None,
) -> int:
    arguments = _parser().parse_args(argv)
    output_stream = stdout or sys.stdout
    root = project_root or Path(__file__).resolve().parents[4]
    adapter = ClaudeHookAdapter(root, environ=environ)
    try:
        if arguments.command in _CONTROL_COMMANDS:
            output = adapter.control(
                arguments.command,
                workspace_id=arguments.workspace_id,
                session_id=arguments.session_id,
            )
        else:
            try:
                payload = json.load(stdin or sys.stdin)
            except json.JSONDecodeError as exc:
                raise HarnessError(f"Claude hook stdin is not valid JSON: {exc}") from exc
            handlers = {
                "session-start": adapter.session_start,
                "user-prompt": adapter.user_prompt,
                "response-end": adapter.response_end,
                "session-end": adapter.session_end,
            }
            output = handlers[arguments.command](payload)
        print(json.dumps(output, ensure_ascii=False, sort_keys=True), file=output_stream)
        return 0
    except (HarnessError, OSError, ValueError) as exc:
        if arguments.command in _CONTROL_COMMANDS:
            print(f"Claude Maintain {arguments.command} failed: {exc}", file=sys.stderr)
            return 2
        event_name = _HOOK_EVENTS[arguments.command]
        message = (
            f"Claude Workspace Maintain {arguments.command} failed: {exc}. "
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
            ),
            file=output_stream,
        )
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
