"""Deterministic bootstrap and guarded apply for Workspace maintenance."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import hashlib
import os
from pathlib import Path, PurePosixPath
import re
import stat
import tempfile
from typing import Any
from urllib.parse import unquote

from ..recover import build_recovery_packet
from ..workspace_contract import (
    HarnessError,
    WorkspaceIdentity,
    expect_exact_keys,
    expect_nonempty_string,
    expect_schema_version,
    fail,
    reject_symlink_components,
    resolve_directory_without_symlinks,
    resolve_regular_file_without_symlinks,
    select_workspace,
    validate_relative_path,
    validate_workspace_id,
)


MAINTAIN_DECISION_SCHEMA_VERSION = 1
_DECISION_KEYS = {
    "schema_version",
    "workspace_id",
    "outcome",
    "importance",
    "summary",
    "changes",
    "evidence",
    "unresolved",
    "question",
}
_CHANGE_KEYS = {"path", "expected_sha256", "content", "reason"}
_SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
_RECORD_PATTERN = re.compile(
    r"^(?P<year>[0-9]{4})-(?P<month>[0-9]{2})-"
    r"(?P<day>[0-9]{2})-(?P<sequence>[0-9]{2})-"
    r"(?P<slug>[^/\\]+)\.md$"
)
_INLINE_LINK_PATTERN = re.compile(r"!?\[[^\]\n]*\]\(([^)\n]*)\)")
_URI_SCHEME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")


@dataclass(frozen=True)
class _PreparedChange:
    relative_path: str
    target: Path
    expected_sha256: str | None
    content: bytes
    reason: str
    exists: bool
    current_mode: int | None


def bootstrap_workspace(
    project_root: Path,
    work_root: Path,
    workspace_id: str,
) -> dict[str, Any]:
    """Build the existing bounded Recover packet for an explicit Workspace."""

    explicit_workspace_id = validate_workspace_id(workspace_id)
    packet = build_recovery_packet(
        project_root,
        work_root,
        explicit_workspace_id,
    )
    if packet["workspace_id"] != explicit_workspace_id:
        fail("Maintain bootstrap Workspace binding changed during recovery")
    if any(
        entry["path_base"] == "work_root"
        and entry["path"] == "workspaces/index.json"
        for entry in packet["control_paths"]
    ):
        fail("Maintain bootstrap must not use the active Workspace index")
    return packet


def _validate_string_list(value: Any, label: str) -> list[str]:
    if not isinstance(value, list):
        fail(f"{label} must be a JSON array")
    return [
        expect_nonempty_string(entry, f"{label}[{index}]")
        for index, entry in enumerate(value)
    ]


def _validate_expected_sha256(value: Any, label: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or not _SHA256_PATTERN.fullmatch(value):
        fail(f"{label} must be null or a lowercase SHA-256 hex digest")
    return value


def _validate_change(value: Any, index: int) -> dict[str, Any]:
    label = f"Maintain decision changes[{index}]"
    if not isinstance(value, dict):
        fail(f"{label} must be a JSON object")
    expect_exact_keys(value, _CHANGE_KEYS, label)
    path = validate_relative_path(value["path"], f"{label}.path")
    if path != path.replace("\\", "/") or PurePosixPath(path).as_posix() != path:
        fail(f"{label}.path must be a canonical POSIX relative path")
    expected_sha256 = _validate_expected_sha256(
        value["expected_sha256"], f"{label}.expected_sha256"
    )
    content = value["content"]
    if not isinstance(content, str):
        fail(f"{label}.content must be a string")
    reason = expect_nonempty_string(value["reason"], f"{label}.reason")
    return {
        "path": path,
        "expected_sha256": expected_sha256,
        "content": content,
        "reason": reason,
    }


def validate_maintain_decision(
    value: Any,
    workspace_id: str,
) -> dict[str, Any]:
    """Validate the exact semantic-agent decision contract."""

    explicit_workspace_id = validate_workspace_id(workspace_id)
    if not isinstance(value, dict):
        fail("Maintain decision must be a JSON object")
    expect_exact_keys(value, _DECISION_KEYS, "Maintain decision")
    expect_schema_version(
        value["schema_version"],
        MAINTAIN_DECISION_SCHEMA_VERSION,
        "Maintain decision",
    )
    decision_workspace_id = validate_workspace_id(value["workspace_id"])
    if decision_workspace_id != explicit_workspace_id:
        fail("Maintain decision workspace_id does not match the binding")

    outcome = value["outcome"]
    if not isinstance(outcome, str) or outcome not in {
        "no_change",
        "update",
        "needs_user_decision",
    }:
        fail(f"invalid Maintain decision outcome: {outcome!r}")
    importance = value["importance"]
    if not isinstance(importance, str) or importance not in {
        "none",
        "quiet",
        "important",
    }:
        fail(f"invalid Maintain decision importance: {importance!r}")
    summary = expect_nonempty_string(
        value["summary"], "Maintain decision summary"
    )
    raw_changes = value["changes"]
    if not isinstance(raw_changes, list):
        fail("Maintain decision changes must be a JSON array")
    changes = [
        _validate_change(change, index)
        for index, change in enumerate(raw_changes)
    ]
    paths = [change["path"] for change in changes]
    if len(paths) != len(set(paths)):
        fail("Maintain decision changes must not contain duplicate paths")
    evidence = _validate_string_list(
        value["evidence"], "Maintain decision evidence"
    )
    unresolved = _validate_string_list(
        value["unresolved"], "Maintain decision unresolved"
    )
    question = value["question"]
    if question is not None:
        question = expect_nonempty_string(
            question, "Maintain decision question"
        )

    if outcome == "no_change":
        if importance != "none" or changes or question is not None:
            fail(
                "no_change requires importance='none', no changes, and "
                "question=null"
            )
    elif outcome == "update":
        if importance not in {"quiet", "important"}:
            fail("update requires importance='quiet' or 'important'")
        if not changes:
            fail("update requires at least one change")
        if question is not None:
            fail("update requires question=null")
    else:
        if importance != "important" or changes or question is None:
            fail(
                "needs_user_decision requires importance='important', no "
                "changes, and a non-empty question"
            )

    return {
        "schema_version": MAINTAIN_DECISION_SCHEMA_VERSION,
        "workspace_id": decision_workspace_id,
        "outcome": outcome,
        "importance": importance,
        "summary": summary,
        "changes": changes,
        "evidence": evidence,
        "unresolved": unresolved,
        "question": question,
    }


def _is_allowed_change_path(relative_path: str) -> tuple[bool, bool]:
    """Return (allowed, append_only_record)."""

    parts = PurePosixPath(relative_path).parts
    if (
        len(parts) == 3
        and parts[:2] == ("current", "memory")
        and parts[2].endswith(".md")
        and parts[2] not in {".md", "..md"}
    ):
        return True, False
    if parts in {
        ("current", "state", "index.md"),
        ("source", "index.md"),
        ("output", "index.md"),
        ("records", "README.md"),
    }:
        return True, False
    if len(parts) != 2 or parts[0] != "records":
        return False, False
    match = _RECORD_PATTERN.fullmatch(parts[1])
    if match is None or match.group("sequence") == "00":
        return False, False
    try:
        date(
            int(match.group("year")),
            int(match.group("month")),
            int(match.group("day")),
        )
    except ValueError:
        return False, False
    return True, True


def _validate_markdown_text(content: str, label: str) -> bytes:
    if "\x00" in content:
        fail(f"{label} must not contain NUL")
    if not content.endswith("\n"):
        fail(f"{label} must end with a newline")
    for line_number, line in enumerate(content.splitlines(), start=1):
        if line.endswith((" ", "\t")):
            fail(f"{label} has trailing whitespace on line {line_number}")
    return content.encode("utf-8")


def _local_link_destination(raw: str, label: str) -> str | None:
    destination = raw.strip()
    if not destination:
        fail(f"{label} has an empty Markdown link destination")
    if destination.startswith("<"):
        closing = destination.find(">")
        if closing < 0:
            fail(f"{label} has an invalid angle-bracket Markdown link")
        destination = destination[1:closing]
    else:
        destination = destination.split(maxsplit=1)[0]
    if destination.startswith("#"):
        return None
    if destination.startswith("//") or _URI_SCHEME_PATTERN.match(destination):
        return None
    return unquote(destination.split("#", 1)[0].split("?", 1)[0])


def _validate_local_markdown_links(
    project_root: Path,
    document_path: Path,
    content: str,
    planned_targets: set[Path],
    label: str,
) -> None:
    resolved_project_root = project_root.resolve(strict=True)
    for candidate in _local_markdown_targets(document_path, content, label):
        try:
            candidate.relative_to(resolved_project_root)
        except ValueError as exc:
            raise HarnessError(
                f"{label} local Markdown link resolves outside Project root: "
                f"{candidate}"
            ) from exc
        if candidate not in planned_targets and not candidate.exists():
            fail(
                f"{label} local Markdown link target does not exist: "
                f"{candidate}"
            )


def _local_markdown_targets(
    document_path: Path,
    content: str,
    label: str,
) -> set[Path]:
    in_fence = False
    visible_lines: list[str] = []
    for line in content.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            in_fence = not in_fence
            continue
        if not in_fence:
            visible_lines.append(line)
    visible_content = "\n".join(visible_lines)
    targets: set[Path] = set()
    for match in _INLINE_LINK_PATTERN.finditer(visible_content):
        destination = _local_link_destination(match.group(1), label)
        if destination is None:
            continue
        if not destination or Path(destination).is_absolute():
            fail(f"{label} local Markdown links must be relative paths")
        targets.add((document_path.parent / destination).resolve(strict=False))
    return targets


def _sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _resolve_project_and_workspace(
    project_root: Path,
    work_root: Path,
    workspace_id: str,
) -> tuple[Path, Path, WorkspaceIdentity]:
    try:
        resolved_project_root = project_root.resolve(strict=True)
        resolved_work_root = work_root.resolve(strict=True)
    except OSError as exc:
        raise HarnessError(f"Maintain root is unavailable: {exc}") from exc
    if not resolved_project_root.is_dir() or not resolved_work_root.is_dir():
        fail("Maintain Project root and Work root must be directories")
    try:
        resolved_work_root.relative_to(resolved_project_root)
    except ValueError as exc:
        raise HarnessError(
            "Maintain Work root must be inside Project root"
        ) from exc
    identity = select_workspace(resolved_work_root, workspace_id)
    workspace_root = resolve_directory_without_symlinks(
        resolved_work_root,
        identity.workspace_path,
        "Maintain Workspace root",
    )
    return resolved_project_root, workspace_root, identity


def _prepare_changes(
    project_root: Path,
    workspace_root: Path,
    changes: list[dict[str, Any]],
) -> list[_PreparedChange]:
    prepared: list[_PreparedChange] = []
    planned_targets = {
        (workspace_root / change["path"]).resolve(strict=False)
        for change in changes
    }

    for index, change in enumerate(changes):
        label = f"Maintain decision changes[{index}]"
        relative_path = change["path"]
        allowed, append_only_record = _is_allowed_change_path(relative_path)
        if not allowed:
            fail(f"{label}.path is outside the Maintain write allowlist")

        parent_relative = PurePosixPath(relative_path).parent.as_posix()
        parent = resolve_directory_without_symlinks(
            workspace_root,
            parent_relative,
            f"{label}.path parent",
        )
        target = parent / PurePosixPath(relative_path).name
        reject_symlink_components(workspace_root, relative_path, f"{label}.path")
        if target.is_symlink():
            fail(f"{label}.path must not use symlink components")
        exists = target.exists()
        if relative_path == "records/README.md" and not exists:
            fail(
                f"{label}.path must identify the existing records entry point"
            )
        expected_sha256 = change["expected_sha256"]
        current_mode: int | None = None
        current_content: bytes | None = None
        if exists:
            target = resolve_regular_file_without_symlinks(
                workspace_root, relative_path, f"{label}.path"
            )
            if append_only_record:
                fail(f"{label}.path identifies an existing append-only record")
            if expected_sha256 is None:
                fail(
                    f"{label}.expected_sha256 is required for an existing "
                    "file"
                )
            try:
                current_content = target.read_bytes()
                current_mode = stat.S_IMODE(target.stat().st_mode)
            except OSError as exc:
                raise HarnessError(f"{label}.path is not readable: {exc}") from exc
            if _sha256(current_content) != expected_sha256:
                fail(f"{label}.path has a stale expected_sha256")
        elif expected_sha256 is not None:
            fail(f"{label}.expected_sha256 must be null for a new file")

        content = _validate_markdown_text(change["content"], f"{label}.content")
        _validate_local_markdown_links(
            project_root,
            target,
            change["content"],
            planned_targets,
            f"{label}.content",
        )
        if current_content == content:
            continue
        prepared.append(
            _PreparedChange(
                relative_path=relative_path,
                target=target,
                expected_sha256=expected_sha256,
                content=content,
                reason=change["reason"],
                exists=exists,
                current_mode=current_mode,
            )
        )

    if not prepared:
        fail("Maintain update must contain at least one material file change")

    new_memory_topics = [
        change
        for change in prepared
        if not change.exists
        and PurePosixPath(change.relative_path).parts[:2]
        == ("current", "memory")
        and change.relative_path != "current/memory/index.md"
    ]
    if new_memory_topics:
        memory_index = next(
            (
                change
                for change in prepared
                if change.relative_path == "current/memory/index.md"
            ),
            None,
        )
        if memory_index is None:
            fail(
                "a new Workspace memory topic requires the same decision to "
                "update current/memory/index.md"
            )
        linked_targets = _local_markdown_targets(
            memory_index.target,
            memory_index.content.decode("utf-8"),
            "Maintain memory index content",
        )
        missing = [
            change.relative_path
            for change in new_memory_topics
            if change.target.resolve(strict=False) not in linked_targets
        ]
        if missing:
            fail(
                "current/memory/index.md must link every new Workspace memory "
                f"topic: {missing}"
            )

    new_records = [
        change
        for change in prepared
        if not change.exists
        and _is_allowed_change_path(change.relative_path)[1]
    ]
    if new_records:
        records_index = next(
            (
                change
                for change in prepared
                if change.relative_path == "records/README.md"
            ),
            None,
        )
        if records_index is None:
            fail(
                "a new dated Workspace record requires the same decision to "
                "update records/README.md"
            )
        linked_targets = _local_markdown_targets(
            records_index.target,
            records_index.content.decode("utf-8"),
            "Maintain records index content",
        )
        missing = [
            change.relative_path
            for change in new_records
            if change.target.resolve(strict=False) not in linked_targets
        ]
        if missing:
            fail(
                "records/README.md must link every new dated Workspace "
                f"record: {missing}"
            )
    return prepared


def _stage_change(change: _PreparedChange) -> Path:
    descriptor, raw_path = tempfile.mkstemp(
        prefix=".maintain-",
        suffix=".tmp",
        dir=change.target.parent,
    )
    staged_path = Path(raw_path)
    try:
        if change.current_mode is not None:
            os.fchmod(descriptor, change.current_mode)
        else:
            os.fchmod(descriptor, 0o644)
        with os.fdopen(descriptor, "wb") as stream:
            descriptor = -1
            stream.write(change.content)
            stream.flush()
            os.fsync(stream.fileno())
    except BaseException:
        if descriptor >= 0:
            os.close(descriptor)
        staged_path.unlink(missing_ok=True)
        raise
    return staged_path


def _precondition_still_holds(
    workspace_root: Path, change: _PreparedChange
) -> None:
    reject_symlink_components(
        workspace_root, change.relative_path, "Maintain write target"
    )
    if change.target.is_symlink():
        fail("Maintain write target must not be a symlink")
    if change.exists:
        target = resolve_regular_file_without_symlinks(
            workspace_root, change.relative_path, "Maintain write target"
        )
        try:
            current = target.read_bytes()
        except OSError as exc:
            raise HarnessError(
                f"Maintain write target is unreadable: {exc}"
            ) from exc
        if _sha256(current) != change.expected_sha256:
            fail(f"Maintain write target became stale: {change.relative_path}")
    elif change.target.exists():
        fail(f"Maintain new write target now exists: {change.relative_path}")


def _commit_prepared_changes(
    workspace_root: Path, prepared: list[_PreparedChange]
) -> list[dict[str, str]]:
    staged: list[tuple[_PreparedChange, Path]] = []
    applied: list[dict[str, str]] = []
    try:
        for change in prepared:
            try:
                staged.append((change, _stage_change(change)))
            except OSError as exc:
                raise HarnessError(
                    "Maintain could not stage the proposed content for "
                    f"{change.relative_path}: {exc}"
                ) from exc
        for change, staged_path in staged:
            try:
                _precondition_still_holds(workspace_root, change)
                if change.exists:
                    os.replace(staged_path, change.target)
                else:
                    os.link(staged_path, change.target)
                    staged_path.unlink()
                if change.target.is_symlink() or not change.target.is_file():
                    fail(
                        "Maintain applied target is not a regular file: "
                        f"{change.relative_path}"
                    )
                if change.target.read_bytes() != change.content:
                    fail(
                        "Maintain applied content does not match the decision: "
                        f"{change.relative_path}"
                    )
                applied.append(
                    {"path": change.relative_path, "reason": change.reason}
                )
            except (OSError, HarnessError) as exc:
                changed = [entry["path"] for entry in applied]
                detail = f"; files already changed: {changed}" if changed else ""
                if isinstance(exc, HarnessError):
                    raise HarnessError(f"{exc}{detail}") from exc
                raise HarnessError(
                    f"Maintain write failed for {change.relative_path}: {exc}{detail}"
                ) from exc
    finally:
        for _, staged_path in staged:
            try:
                staged_path.unlink(missing_ok=True)
            except OSError:
                pass
    return applied


def _result(
    decision: dict[str, Any],
    context_status: str,
    changed: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "context_status": context_status,
        "workspace_id": decision["workspace_id"],
        "changed": changed,
        "importance": decision["importance"],
        "summary": decision["summary"],
        "evidence": decision["evidence"],
        "unresolved": decision["unresolved"],
        "question": decision["question"],
    }


def apply_maintain_decision(
    project_root: Path,
    work_root: Path,
    workspace_id: str,
    decision: Any,
) -> dict[str, Any]:
    """Apply only an exact, explicit and preconditioned Maintain decision."""

    validated = validate_maintain_decision(decision, workspace_id)
    resolved_project_root, workspace_root, identity = (
        _resolve_project_and_workspace(project_root, work_root, workspace_id)
    )
    if identity.workspace_id != validated["workspace_id"]:
        fail("Maintain decision Workspace binding changed before apply")

    if validated["outcome"] == "no_change":
        return _result(validated, "no_change", [])
    if validated["outcome"] == "needs_user_decision":
        return _result(validated, "needs_user_decision", [])

    prepared = _prepare_changes(
        resolved_project_root,
        workspace_root,
        validated["changes"],
    )
    changed = _commit_prepared_changes(workspace_root, prepared)
    return _result(validated, "updated", changed)
