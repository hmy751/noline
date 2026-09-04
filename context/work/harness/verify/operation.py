"""Run bounded verification and persist receipt/status handoff artifacts."""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path, PurePosixPath, PureWindowsPath
import platform
import signal
import subprocess
import tempfile
import threading
import time
from typing import Any
import uuid

from ..workspace_contract import (
    HarnessError,
    STATE_STATUS_SCHEMA_VERSION,
    VERIFICATION_RECEIPT_SCHEMA_VERSION,
    WorkspaceIdentity,
    expect_exact_keys,
    expect_nonempty_string,
    expect_schema_version,
    fail,
    load_state_status,
    read_json_without_symlinks,
    resolve_directory_without_symlinks,
    resolve_regular_file_without_symlinks,
    select_workspace,
    state_status_path,
    validate_relative_path,
    validate_workspace_id,
)


VERIFY_CONTRACT_SCHEMA_VERSION = 2
DEFAULT_TIMEOUT_SECONDS = 30.0
MAX_TIMEOUT_SECONDS = 300.0
DEFAULT_MAX_OUTPUT_CHARS = 100_000
MAX_OUTPUT_CHARS = 1_000_000
TIMEOUT_EXIT_CODE = 124
PROCESS_SCOPE_POLL_SECONDS = 0.005
PROCESS_SCOPE_CLEANUP_SECONDS = 1.0
OUTPUT_DRAIN_GRACE_SECONDS = 1.0
# Serialized receipt compatibility: this token has always represented the
# Project root used as the verification cwd, which remains the same directory.
PROJECT_ROOT_TOKEN = "<OUTPUT_ROOT>"
DISALLOWED_COMMANDS = {
    "bash",
    "csh",
    "dash",
    "env",
    "fish",
    "ksh",
    "powershell",
    "pwsh",
    "sh",
    "tcsh",
    "zsh",
}


def _expect_verification_keys(value: dict[str, Any]) -> None:
    required = {"argv", "evidence_paths"}
    allowed = required | {"timeout_seconds", "max_output_chars"}
    actual = set(value)
    missing = sorted(required - actual)
    extra = sorted(actual - allowed)
    if not missing and not extra:
        return
    details = []
    if missing:
        details.append(f"missing={missing}")
    if extra:
        details.append(f"extra={extra}")
    fail(f"invalid verification keys: {', '.join(details)}")


def _utc_now() -> str:
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def _verify_contract_path(identity: WorkspaceIdentity) -> str:
    return f"{identity.workspace_path}/verify.json"


def _validate_argv(value: Any) -> list[str]:
    if not isinstance(value, list) or not value:
        fail("verification.argv must be a non-empty JSON array, not a shell string")
    argv: list[str] = []
    for index, item in enumerate(value):
        argument = expect_nonempty_string(item, f"verification.argv[{index}]")
        candidates = [argument]
        if "=" in argument:
            candidates.append(argument.split("=", 1)[1])
        for candidate in candidates:
            normalized = candidate.replace("\\", "/")
            normalized_path = PurePosixPath(normalized)
            if (
                Path(candidate).is_absolute()
                or normalized_path.is_absolute()
                or PureWindowsPath(candidate).is_absolute()
            ):
                fail(f"verification.argv[{index}] must not be an absolute path")
            if ".." in normalized_path.parts:
                fail(f"verification.argv[{index}] must not contain path traversal")
        argv.append(argument)
    if Path(argv[0]).name.lower() in DISALLOWED_COMMANDS:
        fail("verification.argv must not invoke a shell or env trampoline")
    return argv


def _load_verify_contract(
    project_root: Path,
    work_root: Path,
    identity: WorkspaceIdentity,
) -> dict[str, Any]:
    contract = read_json_without_symlinks(
        work_root,
        _verify_contract_path(identity),
        "Workspace verify contract",
    )
    expect_exact_keys(
        contract,
        {
            "schema_version",
            "workspace_id",
            "claim",
            "canonical_basis",
            "verification",
        },
        "Workspace verify contract",
    )
    expect_schema_version(
        contract["schema_version"],
        VERIFY_CONTRACT_SCHEMA_VERSION,
        "Workspace verify contract",
    )
    if validate_workspace_id(contract["workspace_id"]) != identity.workspace_id:
        fail("verify contract workspace_id does not match the selected workspace")

    claim = expect_nonempty_string(contract["claim"], "verification claim")

    canonical_basis = _validate_snapshot_paths(
        project_root,
        contract["canonical_basis"],
        "canonical_basis",
    )

    verification = contract["verification"]
    if not isinstance(verification, dict):
        fail("verification must be a JSON object")
    _expect_verification_keys(verification)
    argv = _validate_argv(verification["argv"])

    timeout_seconds = verification.get(
        "timeout_seconds", DEFAULT_TIMEOUT_SECONDS
    )
    if (
        isinstance(timeout_seconds, bool)
        or not isinstance(timeout_seconds, (int, float))
        or not math.isfinite(timeout_seconds)
        or timeout_seconds <= 0
        or timeout_seconds > MAX_TIMEOUT_SECONDS
    ):
        fail(
            "verification.timeout_seconds must be a finite number greater "
            f"than zero and at most {MAX_TIMEOUT_SECONDS:g}"
        )
    timeout_seconds = float(timeout_seconds)

    max_output_chars = verification.get(
        "max_output_chars", DEFAULT_MAX_OUTPUT_CHARS
    )
    if (
        isinstance(max_output_chars, bool)
        or not isinstance(max_output_chars, int)
        or max_output_chars <= 0
        or max_output_chars > MAX_OUTPUT_CHARS
    ):
        fail(
            "verification.max_output_chars must be an integer greater than "
            f"zero and at most {MAX_OUTPUT_CHARS}"
        )

    validated_evidence = _validate_snapshot_paths(
        project_root,
        verification["evidence_paths"],
        "verification.evidence_paths",
    )
    return {
        "schema_version": VERIFY_CONTRACT_SCHEMA_VERSION,
        "workspace_id": identity.workspace_id,
        "claim": claim,
        "canonical_basis": canonical_basis,
        "verification": {
            "argv": argv,
            "evidence_paths": validated_evidence,
            "timeout_seconds": timeout_seconds,
            "max_output_chars": max_output_chars,
        },
    }


def _validate_snapshot_paths(
    project_root: Path,
    values: Any,
    field: str,
) -> list[str]:
    if not isinstance(values, list) or not values:
        fail(f"{field} must be a non-empty JSON array")
    validated: list[str] = []
    seen_paths: set[str] = set()
    for index, value in enumerate(values):
        label = f"{field}[{index}]"
        path = validate_relative_path(value, label)
        if path in seen_paths:
            fail(f"duplicate {field} path: {path}")
        seen_paths.add(path)
        resolve_regular_file_without_symlinks(project_root, path, label)
        validated.append(path)
    return validated


def _snapshot_files(
    project_root: Path,
    relative_paths: list[str],
    field: str,
) -> list[dict[str, Any]]:
    snapshots: list[dict[str, Any]] = []
    for index, relative_path in enumerate(relative_paths):
        path = resolve_regular_file_without_symlinks(
            project_root,
            relative_path,
            f"{field}[{index}]",
        )
        digest = hashlib.sha256()
        size = 0
        try:
            with path.open("rb") as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                    size += len(chunk)
                    digest.update(chunk)
        except OSError as exc:
            raise HarnessError(
                f"could not snapshot {field} file {relative_path}: {exc}"
            ) from exc
        snapshots.append(
            {"path": relative_path, "sha256": digest.hexdigest(), "size": size}
        )
    return snapshots


def _runtime_environment() -> dict[str, Any]:
    """Return bounded, non-secret facts needed to interpret the execution."""

    return {
        "command_cwd": PROJECT_ROOT_TOKEN,
        "os_name": os.name,
        "platform_system": platform.system(),
        "platform_machine": platform.machine(),
        "python_implementation": platform.python_implementation(),
        "python_version": platform.python_version(),
        "verify_contract_schema_version": VERIFY_CONTRACT_SCHEMA_VERSION,
        "verification_receipt_schema_version": (
            VERIFICATION_RECEIPT_SCHEMA_VERSION
        ),
    }


def _snapshot_sha256(
    canonical_basis_files: list[dict[str, Any]],
    evidence_files: list[dict[str, Any]],
) -> str:
    serialized = json.dumps(
        {
            "canonical_basis_files": canonical_basis_files,
            "evidence_files": evidence_files,
        },
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(serialized).hexdigest()


class _BoundedStreamCapture:
    """Drain, normalize, and retain only a bounded text prefix."""

    def __init__(self, max_chars: int, project_root_prefix: str) -> None:
        self.max_chars = max_chars
        self.project_root_prefix = project_root_prefix
        self.observed_chars = 0
        self.normalized_chars = 0
        self.stored_chars = 0
        self.root_replacements = 0
        self.parts: list[str] = []
        self.pending = ""
        self.read_error: str | None = None

    def _emit(self, value: str) -> None:
        self.normalized_chars += len(value)
        remaining = self.max_chars - self.stored_chars
        if remaining <= 0:
            return
        kept = value[:remaining]
        self.parts.append(kept)
        self.stored_chars += len(kept)

    def add(self, value: str) -> None:
        self.observed_chars += len(value)
        data = self.pending + value
        safe_start_limit = max(
            0, len(data) - len(self.project_root_prefix) + 1
        )
        cursor = 0
        while cursor < safe_start_limit:
            match = data.find(self.project_root_prefix, cursor)
            if match == -1 or match >= safe_start_limit:
                self._emit(data[cursor:safe_start_limit])
                cursor = safe_start_limit
                break
            self._emit(data[cursor:match])
            self._emit(PROJECT_ROOT_TOKEN)
            self.root_replacements += 1
            cursor = match + len(self.project_root_prefix)
        self.pending = data[cursor:]

    def finish(self) -> None:
        if not self.pending:
            return
        self.root_replacements += self.pending.count(self.project_root_prefix)
        self._emit(
            self.pending.replace(self.project_root_prefix, PROJECT_ROOT_TOKEN)
        )
        self.pending = ""

    def drain(self, stream: Any) -> None:
        try:
            while True:
                chunk = stream.read(4096)
                if not chunk:
                    break
                self.add(chunk)
        except (OSError, ValueError) as exc:
            self.read_error = str(exc)
        finally:
            self.finish()
            try:
                stream.close()
            except (OSError, ValueError):
                pass

    def prefix(self) -> str:
        return "".join(self.parts)


def _capture_result(
    capture: _BoundedStreamCapture,
) -> tuple[str, dict[str, Any], int]:
    persisted = capture.prefix()
    metadata = {
        "observed_chars": capture.observed_chars,
        "persisted_chars": len(persisted),
        "truncated": capture.normalized_chars > capture.max_chars,
        "read_error": (
            capture.read_error.replace(
                capture.project_root_prefix, PROJECT_ROOT_TOKEN
            )
            if capture.read_error is not None
            else None
        ),
    }
    return persisted, metadata, capture.root_replacements


def _posix_process_group_is_alive(process_group_id: int) -> bool:
    """Return whether the verification's POSIX process group still exists."""

    try:
        os.killpg(process_group_id, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        # The group exists even if an unusual platform policy denies signalling.
        return True
    return True


def _kill_timed_out_process(process: subprocess.Popen[str]) -> None:
    try:
        if os.name == "posix":
            os.killpg(process.pid, signal.SIGKILL)
        else:
            process.kill()
    except ProcessLookupError:
        pass
    process.wait()

    if os.name != "posix":
        return

    # The group leader may already have exited while a descendant remains in
    # its process group. Give SIGKILL a short, bounded interval to take effect
    # so Verify does not return while an ordinary descendant is still running.
    cleanup_deadline = time.monotonic() + PROCESS_SCOPE_CLEANUP_SECONDS
    while _posix_process_group_is_alive(process.pid):
        if time.monotonic() >= cleanup_deadline:
            break
        time.sleep(PROCESS_SCOPE_POLL_SECONDS)


def _wait_for_verification_scope(
    process: subprocess.Popen[str], timeout_seconds: float
) -> bool:
    """Wait for the launched verification scope; return whether it timed out."""

    if os.name != "posix":
        # Portable stdlib fallback: bound the direct process. POSIX additionally
        # bounds the new process group, including ordinary descendants.
        try:
            process.wait(timeout=timeout_seconds)
        except subprocess.TimeoutExpired:
            _kill_timed_out_process(process)
            return True
        return False

    deadline = time.monotonic() + timeout_seconds
    while True:
        leader_finished = process.poll() is not None
        group_alive = _posix_process_group_is_alive(process.pid)
        if leader_finished and not group_alive:
            return False

        remaining = deadline - time.monotonic()
        if remaining <= 0:
            _kill_timed_out_process(process)
            return True
        time.sleep(min(PROCESS_SCOPE_POLL_SECONDS, remaining))


def _run_bounded_verification(
    argv: list[str],
    project_root: Path,
    timeout_seconds: float,
    max_output_chars: int,
) -> dict[str, Any]:
    project_root_prefix = str(project_root.resolve(strict=True))
    stdout_capture = _BoundedStreamCapture(
        max_output_chars, project_root_prefix
    )
    stderr_capture = _BoundedStreamCapture(
        max_output_chars, project_root_prefix
    )
    timed_out = False
    process_returncode: int | None = None

    try:
        process = subprocess.Popen(
            argv,
            cwd=project_root,
            shell=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            start_new_session=(os.name == "posix"),
        )
    except OSError as exc:
        exit_code = 127
        stderr_capture.add(f"could not execute verification argv: {exc}\n")
        stderr_capture.finish()
    else:
        if process.stdout is None or process.stderr is None:
            fail("verification process did not expose stdout and stderr pipes")
        stdout_thread = threading.Thread(
            target=stdout_capture.drain, args=(process.stdout,), daemon=True
        )
        stderr_thread = threading.Thread(
            target=stderr_capture.drain, args=(process.stderr,), daemon=True
        )
        stdout_thread.start()
        stderr_thread.start()
        timed_out = _wait_for_verification_scope(process, timeout_seconds)
        process_returncode = process.returncode
        drain_deadline = time.monotonic() + OUTPUT_DRAIN_GRACE_SECONDS
        stdout_thread.join(timeout=max(0.0, drain_deadline - time.monotonic()))
        stderr_thread.join(timeout=max(0.0, drain_deadline - time.monotonic()))
        if stdout_thread.is_alive():
            stdout_capture.read_error = "stdout pipe did not close after process exit"
        if stderr_thread.is_alive():
            stderr_capture.read_error = "stderr pipe did not close after process exit"
        exit_code = TIMEOUT_EXIT_CODE if timed_out else process.returncode

    stdout, stdout_metadata, stdout_replacements = _capture_result(stdout_capture)
    stderr, stderr_metadata, stderr_replacements = _capture_result(stderr_capture)
    return {
        "exit_code": exit_code,
        "process_returncode": process_returncode,
        "timed_out": timed_out,
        "stdout": stdout,
        "stderr": stderr,
        "output_capture": {
            "encoding": "utf-8",
            "errors": "replace",
            "limit_unit": "characters",
            "max_chars_per_stream": max_output_chars,
            "stdout": stdout_metadata,
            "stderr": stderr_metadata,
        },
        "normalization": {
            "output_root_token": PROJECT_ROOT_TOKEN,
            "stdout_replacements": stdout_replacements,
            "stderr_replacements": stderr_replacements,
        },
    }


def _atomic_write_status(path: Path, content: str) -> None:
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{path.name}.", suffix=".tmp", dir=path.parent
    )
    temporary_path = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary_path, path)
    except BaseException:
        try:
            temporary_path.unlink()
        except FileNotFoundError:
            pass
        raise


def _resolve_verify_receipts_directory(
    work_root: Path,
    identity: WorkspaceIdentity,
) -> tuple[str, Path]:
    receipts_relative = (
        f"{identity.workspace_path}/records/receipts/verify"
    )
    receipts_dir = resolve_directory_without_symlinks(
        work_root,
        receipts_relative,
        "Workspace verify receipts directory",
    )
    return receipts_relative, receipts_dir


def _write_receipt(
    receipts_relative: str,
    receipts_dir: Path,
    receipt: dict[str, Any],
) -> str:
    content = json.dumps(
        receipt, ensure_ascii=False, indent=2, sort_keys=True
    ) + "\n"
    descriptor, temporary_name = tempfile.mkstemp(
        prefix=".verify-receipt-", suffix=".tmp", dir=receipts_dir
    )
    temporary_path = Path(temporary_name)
    try:
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
                stream.write(content)
                stream.flush()
                os.fsync(stream.fileno())
        except BaseException:
            raise

        for _ in range(5):
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
            filename = f"verify-{timestamp}-{uuid.uuid4().hex}.json"
            receipt_path = receipts_dir / filename
            try:
                os.link(temporary_path, receipt_path)
            except FileExistsError:
                continue
            return f"{receipts_relative}/{filename}"
        fail("could not allocate a unique append-only verification receipt")
    finally:
        try:
            temporary_path.unlink()
        except FileNotFoundError:
            pass


def verify_workspace(
    project_root: Path,
    work_root: Path,
    explicit_workspace_id: str | None = None,
) -> tuple[int, dict[str, Any]]:
    """Run verify.json only, then append receipt and atomically update status."""

    identity = select_workspace(work_root, explicit_workspace_id)
    contract = _load_verify_contract(project_root, work_root, identity)
    state_directory = f"{identity.workspace_path}/current/state"
    resolve_directory_without_symlinks(
        work_root, state_directory, "Workspace state directory"
    )
    status_relative = state_status_path(identity)
    status_path = resolve_regular_file_without_symlinks(
        work_root, status_relative, "Workspace state status"
    )
    load_state_status(work_root, identity)
    receipts_relative, receipts_dir = _resolve_verify_receipts_directory(
        work_root, identity
    )

    verification = contract["verification"]
    inputs_collected_at = _utc_now()
    canonical_basis_files = _snapshot_files(
        project_root,
        contract["canonical_basis"],
        "canonical_basis",
    )
    evidence_files = _snapshot_files(
        project_root,
        verification["evidence_paths"],
        "verification.evidence_paths",
    )
    snapshot_sha256 = _snapshot_sha256(
        canonical_basis_files, evidence_files
    )
    runtime_environment = _runtime_environment()
    started_at = _utc_now()
    execution = _run_bounded_verification(
        verification["argv"],
        project_root,
        verification["timeout_seconds"],
        verification["max_output_chars"],
    )
    exit_code = execution["exit_code"]
    finished_at = _utc_now()
    result = "pass" if exit_code == 0 else "fail"
    receipt = {
        "schema_version": VERIFICATION_RECEIPT_SCHEMA_VERSION,
        "workspace_id": identity.workspace_id,
        "claim": contract["claim"],
        "started_at": started_at,
        "finished_at": finished_at,
        "argv": verification["argv"],
        "exit_code": exit_code,
        "process_returncode": execution["process_returncode"],
        "result": result,
        "stdout": execution["stdout"],
        "stderr": execution["stderr"],
        "timeout": {
            "timeout_seconds": verification["timeout_seconds"],
            "timed_out": execution["timed_out"],
        },
        "output_capture": execution["output_capture"],
        "normalization": execution["normalization"],
        "runtime_environment": runtime_environment,
        "snapshot_sha256": snapshot_sha256,
        "canonical_basis_collected_at": inputs_collected_at,
        "canonical_basis_capture": "before_verification",
        "canonical_basis_files": canonical_basis_files,
        "evidence_collected_at": inputs_collected_at,
        "evidence_capture": "before_verification",
        "evidence_files": evidence_files,
    }
    receipt_relative = _write_receipt(
        receipts_relative, receipts_dir, receipt
    )

    state_status = {
        "schema_version": STATE_STATUS_SCHEMA_VERSION,
        "workspace_id": identity.workspace_id,
        "status": (
            "verification_passed"
            if result == "pass"
            else "verification_failed"
        ),
        "result": result,
        "receipt": receipt_relative,
        "finished_at": finished_at,
    }
    _atomic_write_status(
        status_path,
        json.dumps(state_status, ensure_ascii=False, indent=2, sort_keys=True)
        + "\n",
    )

    return exit_code, {
        "workspace_id": identity.workspace_id,
        "claim": contract["claim"],
        "result": result,
        "exit_code": exit_code,
        "receipt": receipt_relative,
        "status": state_status["status"],
        "timed_out": execution["timed_out"],
    }
