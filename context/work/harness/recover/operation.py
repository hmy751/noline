"""Build a bounded recovery packet and summarize linked receipt freshness."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path, PurePosixPath
from typing import Any

from ..workspace_contract import (
    HarnessError,
    SUPPORTED_VERIFICATION_RECEIPT_SCHEMA_VERSIONS,
    WorkspaceIdentity,
    expect_exact_keys,
    expect_nonempty_string,
    expect_schema_version,
    fail,
    load_state_status,
    read_json_without_symlinks,
    read_text_without_symlinks,
    reject_symlink_components,
    resolve_directory_without_symlinks,
    resolve_inside_root,
    resolve_regular_file_without_symlinks,
    select_workspace,
    state_status_path,
    validate_relative_path,
    validate_workspace_id,
)


RECOVER_CONTRACT_SCHEMA_VERSION = 6
RECOVERY_PACKET_SCHEMA_VERSION = 6
PROJECT_CONTEXT_ROOT = "context/project"
REQUIRED_PROJECT_CONTEXT_PATH = "context/project/README.md"
PROJECT_CONTEXT_CONTENT_LAYERS = frozenset(
    {"common", "current", "guidance", "decisions"}
)
REQUIRED_MEMORY_FILES = (
    "spec/01-problem-goal-scope.md",
    "spec/02-behavior-and-cases.md",
    "spec/03-concepts-and-contracts.md",
    "spec/04-quality-and-completion.md",
    "spec/05-constraints-design-assumptions.md",
    "project-context.md",
    "tickets/index.md",
)


def _recover_contract_path(identity: WorkspaceIdentity) -> str:
    return f"{identity.workspace_path}/recover.json"


def _load_recover_contract(
    project_root: Path,
    work_root: Path,
    identity: WorkspaceIdentity,
) -> dict[str, Any]:
    contract_path = _recover_contract_path(identity)
    contract = read_json_without_symlinks(
        work_root, contract_path, "Workspace recover contract"
    )
    expect_exact_keys(
        contract,
        {"schema_version", "workspace_id", "project_context"},
        "Workspace recover contract",
    )
    expect_schema_version(
        contract["schema_version"],
        RECOVER_CONTRACT_SCHEMA_VERSION,
        "Workspace recover contract",
    )
    if validate_workspace_id(contract["workspace_id"]) != identity.workspace_id:
        fail("recover contract workspace_id does not match the selected workspace")

    project_context = contract["project_context"]
    if not isinstance(project_context, list) or not project_context:
        fail("project_context must be a non-empty JSON array")

    project_context_root = resolve_directory_without_symlinks(
        project_root, PROJECT_CONTEXT_ROOT, "Project context directory"
    )
    validated_context: list[dict[str, str]] = []
    seen_paths: set[str] = set()
    for index, entry in enumerate(project_context):
        if not isinstance(entry, dict):
            fail(f"project_context[{index}] must be a JSON object")
        expect_exact_keys(
            entry, {"path", "reason"}, f"project_context[{index}]"
        )
        path = validate_relative_path(
            entry["path"], f"project_context[{index}].path"
        )
        parts = PurePosixPath(path.replace("\\", "/")).parts
        if parts[:2] != ("context", "project"):
            fail(
                "Project context path must be selected from context/project/"
            )
        if path != REQUIRED_PROJECT_CONTEXT_PATH and (
            len(parts) < 4 or parts[2] not in PROJECT_CONTEXT_CONTENT_LAYERS
        ):
            fail(
                "Project context path must be context/project/README.md or "
                "selected from context/project/common/, current/, guidance/, "
                "or decisions/"
            )
        if PurePosixPath(path).suffix != ".md":
            fail("Project context path must be a .md file")
        if path in seen_paths:
            fail(f"duplicate Project context path: {path}")
        seen_paths.add(path)
        resolved = resolve_regular_file_without_symlinks(
            project_root, path, f"project_context[{index}].path"
        )
        try:
            resolved.relative_to(project_context_root)
        except ValueError as exc:
            raise HarnessError(
                "Project context path must resolve inside context/project/"
            ) from exc
        reason = expect_nonempty_string(
            entry["reason"], f"project_context[{index}].reason"
        )
        validated_context.append({"path": path, "reason": reason})

    if REQUIRED_PROJECT_CONTEXT_PATH not in seen_paths:
        fail(
            "project_context must select context/project/README.md"
        )

    return {
        "schema_version": RECOVER_CONTRACT_SCHEMA_VERSION,
        "workspace_id": identity.workspace_id,
        "project_context": validated_context,
    }


def _load_memory(
    work_root: Path, identity: WorkspaceIdentity
) -> tuple[dict[str, str], list[dict[str, str]]]:
    directory_relative = f"{identity.workspace_path}/current/memory"
    directory = resolve_directory_without_symlinks(
        work_root, directory_relative, "Workspace memory directory"
    )
    spec_directory = resolve_directory_without_symlinks(
        work_root, f"{directory_relative}/spec", "Workspace Spec directory"
    )
    resolve_directory_without_symlinks(
        work_root, f"{directory_relative}/tickets", "Workspace Ticket directory"
    )
    index_path = f"{directory_relative}/index.md"
    memory_index = {
        "path": index_path,
        "path_base": "work_root",
        "content": read_text_without_symlinks(
            work_root, index_path, "Workspace memory index"
        ),
    }

    missing_required = [
        name
        for name in REQUIRED_MEMORY_FILES
        if not (directory / name).is_file()
    ]
    if missing_required:
        fail(
            "Workspace memory is missing required files: "
            + ", ".join(missing_required)
        )

    entries: list[dict[str, str]] = []
    # Spec is the default work definition. Ticket bodies are selected by the
    # reader from the index; arbitrary nested memory is not recursively loaded.
    candidates = [
        f"spec/{path.name}"
        for path in sorted(spec_directory.iterdir(), key=lambda path: path.name)
        if path.name.endswith(".md")
    ]
    candidates.extend(
        path.name
        for path in sorted(directory.iterdir(), key=lambda path: path.name)
        if path.name != "index.md" and path.name.endswith(".md")
    )
    candidates.append("tickets/index.md")
    for name in candidates:
        relative_path = f"{directory_relative}/{name}"
        entries.append(
            {
                "path": relative_path,
                "path_base": "work_root",
                "content": read_text_without_symlinks(
                    work_root,
                    relative_path,
                    f"Workspace memory context {name}",
                ),
            }
        )
    return memory_index, entries


def _load_output_index(
    work_root: Path, identity: WorkspaceIdentity
) -> dict[str, str]:
    """Load only the Workspace goal-output map, never artifact bodies."""

    directory_relative = f"{identity.workspace_path}/output"
    resolve_directory_without_symlinks(
        work_root, directory_relative, "Workspace output directory"
    )
    index_path = f"{directory_relative}/index.md"
    return {
        "path": index_path,
        "path_base": "work_root",
        "content": read_text_without_symlinks(
            work_root, index_path, "Workspace output index"
        ),
    }


def _validate_receipt_snapshot_list(
    receipt: dict[str, Any], field: str
) -> list[dict[str, Any]]:
    value = receipt.get(field)
    if not isinstance(value, list) or not value:
        fail(f"verification receipt {field} must be a non-empty JSON array")

    snapshots: list[dict[str, Any]] = []
    seen_paths: set[str] = set()
    for index, entry in enumerate(value):
        label = f"verification receipt {field}[{index}]"
        if not isinstance(entry, dict):
            fail(f"{label} must be a JSON object")
        expect_exact_keys(entry, {"path", "sha256", "size"}, label)
        path = validate_relative_path(entry["path"], f"{label}.path")
        if path in seen_paths:
            fail(f"duplicate verification receipt {field} path: {path}")
        seen_paths.add(path)
        sha256 = expect_nonempty_string(entry["sha256"], f"{label}.sha256")
        if len(sha256) != 64 or any(
            character not in "0123456789abcdef" for character in sha256
        ):
            fail(f"{label}.sha256 must be a lowercase SHA-256 hex digest")
        size = entry["size"]
        if isinstance(size, bool) or not isinstance(size, int) or size < 0:
            fail(f"{label}.size must be a nonnegative integer")
        snapshots.append({"path": path, "sha256": sha256, "size": size})
    return snapshots


def _compare_project_file_to_snapshot(
    project_root: Path, snapshot: dict[str, Any], label: str
) -> str:
    """Return matched/changed/missing/unavailable; reject unsafe paths."""

    relative_path = snapshot["path"]
    reject_symlink_components(project_root, relative_path, label)
    resolved_root = project_root.resolve(strict=True)
    try:
        path = (resolved_root / relative_path).resolve(strict=True)
    except FileNotFoundError:
        return "missing"
    except OSError:
        return "unavailable"
    try:
        path.relative_to(resolved_root)
    except ValueError as exc:
        raise HarnessError(f"{label} resolves outside Project root") from exc
    if not path.is_file():
        return "unavailable"

    digest = hashlib.sha256()
    size = 0
    try:
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                size += len(chunk)
                digest.update(chunk)
    except OSError:
        return "unavailable"
    if size == snapshot["size"] and digest.hexdigest() == snapshot["sha256"]:
        return "matched"
    return "changed"


def _receipt_freshness(
    project_root: Path, receipt: dict[str, Any]
) -> dict[str, int | str]:
    schema_version = receipt["schema_version"]
    empty_counts = {
        "snapshot_file_count": 0,
        "changed_file_count": 0,
        "missing_file_count": 0,
        "unavailable_file_count": 0,
    }
    if schema_version == 1:
        return {"status": "unknown_legacy", **empty_counts}

    expect_nonempty_string(receipt.get("claim"), "verification receipt claim")
    snapshots_by_field: dict[str, list[dict[str, Any]]] = {}
    snapshots: list[tuple[str, dict[str, Any]]] = []
    for field in ("canonical_basis_files", "evidence_files"):
        validated = _validate_receipt_snapshot_list(receipt, field)
        snapshots_by_field[field] = validated
        snapshots.extend((field, entry) for entry in validated)

    snapshot_sha256 = expect_nonempty_string(
        receipt.get("snapshot_sha256"),
        "verification receipt snapshot_sha256",
    )
    if len(snapshot_sha256) != 64 or any(
        character not in "0123456789abcdef"
        for character in snapshot_sha256
    ):
        fail(
            "verification receipt snapshot_sha256 must be a lowercase "
            "SHA-256 hex digest"
        )
    serialized_snapshots = json.dumps(
        snapshots_by_field,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    if hashlib.sha256(serialized_snapshots).hexdigest() != snapshot_sha256:
        fail(
            "verification receipt snapshot_sha256 does not match its "
            "declared snapshots"
        )

    counts = {
        "matched": 0,
        "changed": 0,
        "missing": 0,
        "unavailable": 0,
    }
    for index, (field, snapshot) in enumerate(snapshots):
        result = _compare_project_file_to_snapshot(
            project_root,
            snapshot,
            f"verification receipt {field}[{index}].path",
        )
        counts[result] += 1
    stale_count = counts["changed"] + counts["missing"] + counts["unavailable"]
    return {
        "status": "fresh" if stale_count == 0 else "stale",
        "snapshot_file_count": len(snapshots),
        "changed_file_count": counts["changed"],
        "missing_file_count": counts["missing"],
        "unavailable_file_count": counts["unavailable"],
    }


def _validate_linked_receipt(
    project_root: Path,
    work_root: Path,
    identity: WorkspaceIdentity,
    status: dict[str, Any],
) -> tuple[str | None, dict[str, int | str]]:
    """Validate the linked receipt and return path plus bounded freshness."""

    if status["receipt"] is None:
        return None, {
            "status": "not_applicable",
            "snapshot_file_count": 0,
            "changed_file_count": 0,
            "missing_file_count": 0,
            "unavailable_file_count": 0,
        }

    receipt_relative = status["receipt"]
    records_relative = f"{identity.workspace_path}/records"
    records_dir = resolve_directory_without_symlinks(
        work_root, records_relative, "Workspace records directory"
    )
    reject_symlink_components(
        work_root, receipt_relative, "state status receipt"
    )
    receipt_path = resolve_inside_root(
        work_root, receipt_relative, "state status receipt"
    )
    try:
        receipt_path.relative_to(records_dir)
    except ValueError as exc:
        raise HarnessError(
            "state status receipt must resolve inside this Workspace's records/"
        ) from exc
    if not receipt_path.is_file():
        fail("state status receipt must be a regular file")

    receipt = read_json_without_symlinks(
        work_root, receipt_relative, "state status receipt"
    )
    for field in ("schema_version", "workspace_id", "result", "finished_at"):
        if field not in receipt:
            fail(f"state status receipt is missing {field}")
    receipt_schema_version = receipt["schema_version"]
    if (
        type(receipt_schema_version) is not int
        or receipt_schema_version
        not in SUPPORTED_VERIFICATION_RECEIPT_SCHEMA_VERSIONS
    ):
        fail(
            "unsupported verification receipt schema_version: "
            f"{receipt_schema_version!r}"
        )
    if receipt["workspace_id"] != identity.workspace_id:
        fail("state status and receipt workspace_id do not match")
    if receipt["result"] != status["result"]:
        fail("state status and receipt result do not match")
    if receipt["finished_at"] != status["finished_at"]:
        fail("state status and receipt finished_at do not match")
    return receipt_relative, _receipt_freshness(project_root, receipt)


def build_recovery_packet(
    project_root: Path,
    work_root: Path,
    explicit_workspace_id: str | None = None,
) -> dict[str, Any]:
    """Build a packet without verify.json or exposing receipt body content."""

    identity = select_workspace(work_root, explicit_workspace_id)
    recover_contract_path = _recover_contract_path(identity)
    contract = _load_recover_contract(project_root, work_root, identity)
    memory_index, memory_entries = _load_memory(work_root, identity)

    state_directory = f"{identity.workspace_path}/current/state"
    resolve_directory_without_symlinks(
        work_root, state_directory, "Workspace state directory"
    )
    state_index_path = f"{state_directory}/index.md"
    status_path = state_status_path(identity)
    state_index = {
        "path": state_index_path,
        "path_base": "work_root",
        "content": read_text_without_symlinks(
            work_root, state_index_path, "Workspace state index"
        ),
    }
    state_status = load_state_status(work_root, identity)
    linked_receipt, receipt_freshness = _validate_linked_receipt(
        project_root, work_root, identity, state_status
    )
    output_index = _load_output_index(work_root, identity)

    selected_context: list[dict[str, str]] = []
    loaded_paths = [
        {"path_base": "work_root", "path": memory_index["path"]}
    ]
    loaded_paths.extend(
        {"path_base": "work_root", "path": entry["path"]}
        for entry in memory_entries
    )
    loaded_paths.extend(
        [
            {"path_base": "work_root", "path": state_index_path},
            {"path_base": "work_root", "path": status_path},
            {"path_base": "work_root", "path": output_index["path"]},
        ]
    )
    for entry in contract["project_context"]:
        selected_context.append(
            {
                "path": entry["path"],
                "path_base": "project_root",
                "reason": entry["reason"],
                "content": read_text_without_symlinks(
                    project_root,
                    entry["path"],
                    f"selected Project context {entry['path']}",
                ),
            }
        )
        loaded_paths.append(
            {"path_base": "project_root", "path": entry["path"]}
        )

    control_paths = [
        {"path_base": "work_root", "path": identity.identity_path},
        {"path_base": "work_root", "path": recover_contract_path},
    ]
    if identity.index_path is not None:
        control_paths.insert(
            0, {"path_base": "work_root", "path": identity.index_path}
        )
    if linked_receipt is not None:
        control_paths.append(
            {"path_base": "work_root", "path": linked_receipt}
        )

    return {
        "schema_version": RECOVERY_PACKET_SCHEMA_VERSION,
        "workspace_id": identity.workspace_id,
        "workspace": {
            "path_base": "work_root",
            "path": identity.workspace_path,
        },
        "recover_contract": {
            "path_base": "work_root",
            "path": recover_contract_path,
        },
        "control_paths": control_paths,
        "loaded_context_paths": loaded_paths,
        "memory": {"index": memory_index, "entries": memory_entries},
        "state": {
            "index": state_index,
            "status": {
                "path_base": "work_root",
                "path": status_path,
                "receipt_path_base": "work_root",
                "receipt_freshness": receipt_freshness,
                "value": state_status,
            },
        },
        "output": {"index": output_index},
        "project_context": selected_context,
    }


def render_recovery_packet(packet: dict[str, Any]) -> str:
    """Render the recovery packet for a human without verify configuration."""

    lines = [
        f"# Workspace recovery: {packet['workspace_id']}",
        "",
        (
            "Workspace: "
            f"[{packet['workspace']['path_base']}] "
            f"{packet['workspace']['path']}"
        ),
        (
            "Recover contract: "
            f"[{packet['recover_contract']['path_base']}] "
            f"{packet['recover_contract']['path']}"
        ),
        "Control paths read to select the Workspace and validate handoff:",
    ]
    lines.extend(
        f"- [{entry['path_base']}] {entry['path']}"
        for entry in packet["control_paths"]
    )
    lines.extend(["", "Loaded context paths (in recovery order):"])
    lines.extend(
        f"- [{entry['path_base']}] {entry['path']}"
        for entry in packet["loaded_context_paths"]
    )

    memory = packet["memory"]
    lines.extend(
        ["", "## memory/index.md", "", memory["index"]["content"].rstrip()]
    )
    for entry in memory["entries"]:
        lines.extend(
            [
                "",
                (
                    "## Memory context: "
                    f"[{entry['path_base']}] {entry['path']}"
                ),
                "",
                entry["content"].rstrip(),
            ]
        )

    state = packet["state"]
    lines.extend(
        ["", "## state/index.md", "", state["index"]["content"].rstrip()]
    )
    lines.extend(["", "## state/status.json", ""])
    status_fields = ["status", "result", "finished_at", "receipt"]
    if "next_action" in state["status"]["value"]:
        status_fields.append("next_action")
    for field in status_fields:
        value = state["status"]["value"][field]
        rendered = "null" if value is None else str(value)
        suffix = (
            f" [{state['status']['receipt_path_base']}]"
            if field == "receipt" and value is not None
            else ""
        )
        lines.append(f"- {field}: {rendered}{suffix}")
    freshness = state["status"]["receipt_freshness"]
    lines.append(f"- receipt_freshness: {freshness['status']}")
    if freshness["snapshot_file_count"]:
        lines.append(
            "- receipt_snapshot_files: "
            f"{freshness['snapshot_file_count']} "
            f"(changed={freshness['changed_file_count']}, "
            f"missing={freshness['missing_file_count']}, "
            f"unavailable={freshness['unavailable_file_count']})"
        )

    output = packet["output"]
    lines.extend(
        ["", "## output/index.md", "", output["index"]["content"].rstrip()]
    )

    for entry in packet["project_context"]:
        lines.extend(
            [
                "",
                (
                    "## Project context: "
                    f"[{entry['path_base']}] {entry['path']}"
                ),
                "",
                f"Selection reason: {entry['reason']}",
                "",
                entry["content"].rstrip(),
            ]
        )
    return "\n".join(lines) + "\n"
