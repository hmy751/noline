from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import threading
import unittest
from unittest.mock import patch
from typing import Any

from context.work.harness.maintain.host_adapter import (
    MaintainHostAdapter,
    main as host_adapter_main,
)
from context.work.harness.maintain.operation import (
    apply_maintain_decision,
    bootstrap_workspace,
)
from context.work.harness.testing import WorkspaceFixture
from context.work.harness.workspace_contract import HarnessError


def no_change(workspace_id: str = "001-example") -> dict[str, object]:
    return {
        "schema_version": 1,
        "workspace_id": workspace_id,
        "outcome": "no_change",
        "importance": "none",
        "summary": "No durable Workspace Context change.",
        "changes": [],
        "evidence": ["This response only restated existing context."],
        "unresolved": [],
        "question": None,
    }


class FakeSemanticSession:
    starts: list[dict[str, Any]] = []
    restores: list[str] = []
    restore_bindings: list[tuple[str, str]] = []
    deltas: list[dict[str, Any]] = []
    decisions: list[dict[str, object]] = []
    resume_errors: list[Exception] = []

    @classmethod
    def reset(cls) -> None:
        cls.starts = []
        cls.restores = []
        cls.restore_bindings = []
        cls.deltas = []
        cls.decisions = []
        cls.resume_errors = []

    def __init__(
        self,
        project_root: Path,
        workspace_id: str,
        *,
        runner: object,
    ) -> None:
        self.project_root = project_root
        self.workspace_id = workspace_id
        self.runner = runner
        self.thread_id: str | None = None

    @classmethod
    def restore(
        cls,
        project_root: Path,
        workspace_id: str,
        *,
        thread_id: str,
        runner: object,
    ) -> "FakeSemanticSession":
        session = cls(project_root, workspace_id, runner=runner)
        session.thread_id = thread_id
        cls.restores.append(thread_id)
        cls.restore_bindings.append((workspace_id, thread_id))
        return session

    def start(self, bounded_bootstrap: dict[str, Any]) -> dict[str, object]:
        type(self).starts.append(bounded_bootstrap)
        self.thread_id = f"maintain-thread-{len(type(self).starts)}"
        return {
            "schema_version": 1,
            "workspace_id": self.workspace_id,
            "status": "grounded",
            "starting_state": "bounded fixture state",
            "unresolved": [],
            "question": None,
        }

    def resume(self, delta: dict[str, Any]) -> dict[str, object]:
        type(self).deltas.append(delta)
        if type(self).resume_errors:
            raise type(self).resume_errors.pop(0)
        if type(self).decisions:
            return type(self).decisions.pop(0)
        return no_change(self.workspace_id)


class FailingStartSession(FakeSemanticSession):
    def start(self, bounded_bootstrap: dict[str, Any]) -> dict[str, object]:
        raise HarnessError("grounding unavailable")


class FailingSecondWorkspaceSession(FakeSemanticSession):
    def start(self, bounded_bootstrap: dict[str, Any]) -> dict[str, object]:
        if self.workspace_id == "002-other":
            raise HarnessError("successor grounding unavailable")
        return super().start(bounded_bootstrap)


class AmbiguousStartSession(FakeSemanticSession):
    def start(self, bounded_bootstrap: dict[str, Any]) -> dict[str, object]:
        type(self).starts.append(bounded_bootstrap)
        self.thread_id = "uncommitted-ambiguous-thread"
        return {
            "schema_version": 1,
            "workspace_id": self.workspace_id,
            "status": "needs_user_decision",
            "starting_state": "The source authority is ambiguous.",
            "unresolved": ["source authority"],
            "question": "Which source is authoritative?",
        }


class RecordingPopen:
    def __init__(self) -> None:
        self.calls: list[tuple[list[str], dict[str, object]]] = []

    def __call__(self, command: list[str], **options: object) -> object:
        self.calls.append((command, options))
        return object()


class FailingPopen(RecordingPopen):
    def __call__(self, command: list[str], **options: object) -> object:
        self.calls.append((command, options))
        raise OSError("detached worker launch failed")


class IncrementingClock:
    def __init__(self) -> None:
        self.value = 1000.0

    def __call__(self) -> float:
        self.value += 1.0
        return self.value


class MaintainHostAdapterTests(WorkspaceFixture):
    def setUp(self) -> None:
        super().setUp()
        FakeSemanticSession.reset()
        codex_directory = self.project_root / ".codex"
        codex_directory.mkdir()
        (codex_directory / "maintain.json").write_text(
            json.dumps({"schema_version": 2, "mode": "explicit"})
            + "\n",
            encoding="utf-8",
        )
        self.runtime_root = codex_directory / "test-maintain-runtime"
        self.popen = RecordingPopen()
        self.clock = IncrementingClock()
        self.bootstrap_calls = 0
        self.apply_calls: list[dict[str, object]] = []

        def counted_bootstrap(
            project_root: Path, work_root: Path, workspace_id: str
        ) -> dict[str, Any]:
            self.bootstrap_calls += 1
            return bootstrap_workspace(project_root, work_root, workspace_id)

        def recording_apply(
            project_root: Path,
            work_root: Path,
            workspace_id: str,
            decision: Any,
        ) -> dict[str, Any]:
            self.apply_calls.append(decision)
            return apply_maintain_decision(
                project_root, work_root, workspace_id, decision
            )

        self.adapter = MaintainHostAdapter(
            self.project_root,
            runtime_root=self.runtime_root,
            session_type=FakeSemanticSession,
            runner=lambda *args, **kwargs: None,
            popen=self.popen,
            clock=self.clock,
            python_executable="fixture-python",
            bootstrap=counted_bootstrap,
            apply_decision=recording_apply,
        )

    @staticmethod
    def session_start_payload(session_id: str) -> dict[str, object]:
        return {
            "hook_event_name": "SessionStart",
            "session_id": session_id,
            "cwd": "/unused/by-direct-test",
            "source": "startup",
        }

    @staticmethod
    def prompt_payload(
        session_id: str, turn_id: str, prompt: str
    ) -> dict[str, object]:
        return {
            "hook_event_name": "UserPromptSubmit",
            "session_id": session_id,
            "turn_id": turn_id,
            "prompt": prompt,
        }

    @staticmethod
    def stop_payload(
        session_id: str, turn_id: str, response: str
    ) -> dict[str, object]:
        return {
            "hook_event_name": "Stop",
            "session_id": session_id,
            "turn_id": turn_id,
            "last_assistant_message": response,
            "stop_hook_active": False,
        }

    @staticmethod
    def session_key(session_id: str) -> str:
        return hashlib.sha256(session_id.encode("utf-8")).hexdigest()

    def activate_session(
        self,
        session_id: str,
        workspace_id: str = "001-example",
    ) -> dict[str, Any]:
        return self.adapter.activate(session_id, workspace_id)

    def start_bound_session(
        self,
        session_id: str,
        workspace_id: str = "001-example",
    ) -> dict[str, Any]:
        self.activate_session(session_id, workspace_id)
        return self.adapter.session_start(self.session_start_payload(session_id))

    def add_workspace(self, workspace_id: str) -> None:
        source = self.work_root / "workspaces" / "001-example"
        target = self.work_root / "workspaces" / workspace_id
        shutil.copytree(source, target)
        for relative_path in (
            "workspace.json",
            "recover.json",
            "verify.json",
            "current/state/status.json",
        ):
            path = target / relative_path
            value = json.loads(path.read_text(encoding="utf-8"))
            value["workspace_id"] = workspace_id
            path.write_text(
                json.dumps(value, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

    def workspace_bytes(
        self, workspace_id: str = "001-example"
    ) -> dict[str, bytes]:
        workspace = self.work_root / "workspaces" / workspace_id
        return {
            path.relative_to(workspace).as_posix(): path.read_bytes()
            for path in sorted(workspace.rglob("*"))
            if path.is_file()
        }

    def test_unbound_session_hooks_are_quiet_and_write_nothing(self) -> None:
        session_id = "host-session-unbound"
        before = self.workspace_bytes()

        start = self.adapter.session_start(self.session_start_payload(session_id))
        prompt = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-1", "unrelated prompt")
        )
        stop = self.adapter.response_end(
            self.stop_payload(session_id, "turn-1", "unrelated response")
        )
        end = self.adapter.session_end(
            {
                "hook_event_name": "SessionEnd",
                "session_id": session_id,
                "reason": "complete",
            }
        )

        self.assertEqual(start, {"continue": True})
        self.assertEqual(prompt, {"continue": True})
        self.assertEqual(stop, {"continue": True})
        self.assertEqual(end, {"continue": True})
        self.assertEqual(self.bootstrap_calls, 0)
        self.assertEqual(FakeSemanticSession.starts, [])
        self.assertEqual(self.workspace_bytes(), before)
        self.assertFalse(self.runtime_root.exists())

    def test_explicit_activation_grounds_once_and_session_start_reuses(self) -> None:
        session_id = "host-session-a"
        first = self.activate_session(session_id)
        second = self.activate_session(session_id)
        start = self.adapter.session_start(self.session_start_payload(session_id))

        self.assertEqual(first["status"], "activated")
        self.assertEqual(second["status"], "already_active")
        self.assertEqual(self.bootstrap_calls, 1)
        self.assertEqual(len(FakeSemanticSession.starts), 1)
        self.assertIn(
            "reusing",
            start["hookSpecificOutput"]["additionalContext"],
        )

    def test_failed_initial_activation_does_not_commit_binding(self) -> None:
        failing = MaintainHostAdapter(
            self.project_root,
            runtime_root=self.project_root / ".codex" / "failed-runtime",
            session_type=FailingStartSession,
            popen=self.popen,
            clock=self.clock,
        )
        with self.assertRaisesRegex(HarnessError, "previous session binding"):
            failing.activate("host-session-failure", "001-example")

        failed_directory = (
            self.project_root
            / ".codex"
            / "failed-runtime"
            / self.session_key("host-session-failure")
        )
        self.assertFalse((failed_directory / "session.json").exists())

    def test_ambiguous_grounding_never_commits_or_claims_grounded(self) -> None:
        runtime_root = self.project_root / ".codex" / "ambiguous-runtime"
        adapter = MaintainHostAdapter(
            self.project_root,
            runtime_root=runtime_root,
            session_type=AmbiguousStartSession,
            popen=self.popen,
            clock=self.clock,
        )

        with self.assertRaisesRegex(
            HarnessError, "Which source is authoritative?"
        ):
            adapter.activate("host-session-ambiguous", "001-example")
        session_directory = runtime_root / self.session_key(
            "host-session-ambiguous"
        )
        self.assertFalse((session_directory / "session.json").exists())

    def test_drain_reuses_exact_grounded_thread_for_later_turns(self) -> None:
        session_id = "host-session-thread-reuse"
        self.start_bound_session(session_id)

        for number in (1, 2):
            turn_id = f"turn-{number}"
            self.adapter.user_prompt(
                self.prompt_payload(session_id, turn_id, f"prompt {number}")
            )
            self.adapter.response_end(
                self.stop_payload(session_id, turn_id, f"response {number}")
            )
        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(summary["processed"], 2)
        self.assertEqual(
            FakeSemanticSession.restores,
            ["maintain-thread-1", "maintain-thread-1"],
        )
        self.assertEqual(
            [delta["turn_id"] for delta in FakeSemanticSession.deltas],
            ["turn-1", "turn-2"],
        )

    def test_no_change_has_no_workspace_write_or_notification(self) -> None:
        session_id = "host-session-no-change"
        before = self.workspace_bytes()
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-1", "Explain the current state")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-1", "The state is already current")
        )

        summary = self.adapter.drain(self.session_key(session_id))
        prompt_output = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-2", "Continue")
        )

        self.assertEqual(summary["processed"], 1)
        self.assertEqual(len(self.apply_calls), 1)
        self.assertEqual(self.apply_calls[0]["outcome"], "no_change")
        self.assertEqual(self.workspace_bytes(), before)
        self.assertNotIn("hookSpecificOutput", prompt_output)

    def test_prompt_and_response_are_paired_by_stable_turn_id(self) -> None:
        session_id = "host-session-pair"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-pair", "USER_MARKER")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-pair", "RESPONSE_MARKER")
        )

        self.adapter.drain(self.session_key(session_id))

        self.assertEqual(
            FakeSemanticSession.deltas,
            [
                {
                    "workspace_id": "001-example",
                    "turn_id": "turn-pair",
                    "user_prompt": "USER_MARKER",
                    "main_response": "RESPONSE_MARKER",
                }
            ],
        )

    def test_duplicate_response_end_has_one_semantic_and_apply_effect(self) -> None:
        session_id = "host-session-duplicate"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-duplicate", "prompt")
        )
        payload = self.stop_payload(
            session_id, "turn-duplicate", "same response"
        )
        self.adapter.response_end(payload)
        self.adapter.response_end(payload)

        first = self.adapter.drain(self.session_key(session_id))
        second = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(first["processed"], 1)
        self.assertEqual(second["processed"], 0)
        self.assertEqual(second["already_resolved"], 1)
        self.assertEqual(len(FakeSemanticSession.deltas), 1)
        self.assertEqual(len(self.apply_calls), 1)

    def test_two_host_sessions_keep_runtime_and_threads_isolated(self) -> None:
        for session_id in ("host-session-left", "host-session-right"):
            self.start_bound_session(session_id)
            self.adapter.user_prompt(
                self.prompt_payload(session_id, "turn-1", f"prompt {session_id}")
            )
            self.adapter.response_end(
                self.stop_payload(session_id, "turn-1", f"response {session_id}")
            )

        self.adapter.drain(self.session_key("host-session-right"))
        self.adapter.drain(self.session_key("host-session-left"))

        self.assertEqual(
            FakeSemanticSession.restores,
            ["maintain-thread-2", "maintain-thread-1"],
        )
        self.assertEqual(
            {delta["user_prompt"] for delta in FakeSemanticSession.deltas},
            {
                "prompt host-session-left",
                "prompt host-session-right",
            },
        )
        runtime_directories = {
            path.name
            for path in self.runtime_root.iterdir()
            if path.is_dir()
        }
        self.assertEqual(
            runtime_directories,
            {
                self.session_key("host-session-left"),
                self.session_key("host-session-right"),
            },
        )

    def test_concurrent_sessions_bind_different_workspaces_or_remain_unbound(
        self,
    ) -> None:
        self.add_workspace("002-other")
        left = "host-session-workspace-a"
        right = "host-session-workspace-b"
        unrelated = "host-session-unbound-c"

        self.activate_session(left, "001-example")
        self.activate_session(right, "002-other")
        self.adapter.user_prompt(self.prompt_payload(left, "left", "prompt A"))
        self.adapter.response_end(self.stop_payload(left, "left", "response A"))
        self.adapter.user_prompt(self.prompt_payload(right, "right", "prompt B"))
        self.adapter.response_end(
            self.stop_payload(right, "right", "response B")
        )
        self.adapter.user_prompt(
            self.prompt_payload(unrelated, "none", "unrelated prompt")
        )
        self.adapter.response_end(
            self.stop_payload(unrelated, "none", "unrelated response")
        )

        self.adapter.drain(self.session_key(right))
        self.adapter.drain(self.session_key(left))

        self.assertEqual(
            FakeSemanticSession.restore_bindings,
            [
                ("002-other", "maintain-thread-2"),
                ("001-example", "maintain-thread-1"),
            ],
        )
        self.assertEqual(self.adapter.status(left)["status"], "active")
        self.assertEqual(self.adapter.status(right)["status"], "active")
        self.assertEqual(self.adapter.status(unrelated)["status"], "unbound")
        self.assertFalse(
            (self.runtime_root / self.session_key(unrelated)).exists()
        )

    def test_same_session_rebind_keeps_current_turn_on_a_and_next_turn_on_b(
        self,
    ) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-rebind-current-turn"
        self.activate_session(session_id, "001-example")
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-a", "prompt captured on A")
        )

        rebound = self.activate_session(session_id, "002-other")
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-a", "response completed after B")
        )
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-b", "next prompt on B")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-b", "next response on B")
        )
        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(rebound["previous_workspace_id"], "001-example")
        self.assertEqual(rebound["binding_generation"], 2)
        self.assertEqual(summary["processed"], 2)
        self.assertEqual(
            FakeSemanticSession.restore_bindings,
            [
                ("001-example", "maintain-thread-1"),
                ("002-other", "maintain-thread-2"),
            ],
        )
        self.assertEqual(
            [delta["workspace_id"] for delta in FakeSemanticSession.deltas],
            ["001-example", "002-other"],
        )

    def test_failed_successor_grounding_preserves_predecessor_binding(
        self,
    ) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-failed-rebind"
        self.activate_session(session_id, "001-example")
        self.adapter._session_type_override = FailingSecondWorkspaceSession

        with self.assertRaisesRegex(
            HarnessError, "previous session binding was preserved"
        ):
            self.activate_session(session_id, "002-other")

        status = self.adapter.status(session_id)
        self.assertEqual(status["status"], "active")
        self.assertEqual(
            status["current_binding"]["workspace_id"], "001-example"
        )
        self.assertEqual(status["current_binding"]["binding_generation"], 1)
        self.assertEqual(len(status["bindings"]), 1)

    def test_late_predecessor_event_uses_its_snapshotted_thread_after_rebind(
        self,
    ) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-late-predecessor"
        self.activate_session(session_id, "001-example")
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "late-a", "late A prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "late-a", "late A response")
        )
        self.activate_session(session_id, "002-other")

        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(summary["processed"], 1)
        self.assertEqual(
            FakeSemanticSession.restore_bindings,
            [("001-example", "maintain-thread-1")],
        )
        self.assertEqual(
            FakeSemanticSession.deltas[0]["workspace_id"], "001-example"
        )

    def test_failed_predecessor_generation_does_not_block_successor(self) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-generation-local-failure"
        self.activate_session(session_id, "001-example")
        for turn_id in ("a-failure", "a-later"):
            self.adapter.user_prompt(
                self.prompt_payload(session_id, turn_id, f"prompt {turn_id}")
            )
            self.adapter.response_end(
                self.stop_payload(session_id, turn_id, f"response {turn_id}")
            )
        FakeSemanticSession.resume_errors = [HarnessError("A failed")]
        first = self.adapter.drain(self.session_key(session_id))
        runtime_status = self.adapter.status(session_id)["runtime"]

        self.activate_session(session_id, "002-other")
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "b-valid", "prompt B")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "b-valid", "response B")
        )
        second = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(first["failed"], 1)
        self.assertEqual(first["blocked"], 1)
        self.assertEqual(runtime_status["failed_effect_count"], 1)
        self.assertEqual(runtime_status["blocking_failure_count"], 1)
        self.assertEqual(runtime_status["unresolved_event_count"], 1)
        self.assertEqual(runtime_status["runnable_event_count"], 0)
        self.assertEqual(second["processed"], 1)
        self.assertEqual(second["blocked"], 1)
        self.assertEqual(
            FakeSemanticSession.restore_bindings[-1],
            ("002-other", "maintain-thread-2"),
        )
        self.assertEqual(
            FakeSemanticSession.deltas[-1]["workspace_id"], "002-other"
        )

    def test_repeat_rebind_a_to_b_to_a_creates_distinct_generations(self) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-repeat-rebind"

        first = self.activate_session(session_id, "001-example")
        second = self.activate_session(session_id, "002-other")
        third = self.activate_session(session_id, "001-example")

        status = self.adapter.status(session_id)
        self.assertEqual(
            [
                first["binding_generation"],
                second["binding_generation"],
                third["binding_generation"],
            ],
            [1, 2, 3],
        )
        self.assertEqual(status["current_binding"]["workspace_id"], "001-example")
        self.assertEqual(status["current_binding"]["binding_generation"], 3)
        self.assertEqual(
            [binding["workspace_id"] for binding in status["bindings"]],
            ["001-example", "002-other", "001-example"],
        )

    def test_failure_is_effect_once_but_never_recorded_as_completed(self) -> None:
        session_id = "host-session-failure"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-failure", "prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-failure", "response")
        )
        FakeSemanticSession.resume_errors = [HarnessError("semantic crash")]

        first = self.adapter.drain(self.session_key(session_id))
        second = self.adapter.drain(self.session_key(session_id))
        next_prompt = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-after-failure", "what happened?")
        )

        self.assertEqual(first["failed"], 1)
        self.assertEqual(second["already_resolved"], 1)
        self.assertEqual(len(FakeSemanticSession.deltas), 1)
        effect_files = list(
            (
                self.runtime_root
                / self.session_key(session_id)
                / "effects"
            ).glob("*.json")
        )
        self.assertEqual(len(effect_files), 1)
        effect = json.loads(effect_files[0].read_text(encoding="utf-8"))
        self.assertEqual(effect["status"], "failed")
        self.assertNotEqual(effect["status"], "completed")
        notification = next_prompt["hookSpecificOutput"]["additionalContext"]
        self.assertIn("failed, not completed", notification)
        self.assertIn("semantic crash", notification)

    def test_semantic_failure_keeps_later_events_pending_without_rekick(
        self,
    ) -> None:
        session_id = "host-session-blocked-after-semantic-failure"
        self.start_bound_session(session_id)
        before = self.workspace_bytes()

        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-failure", "first prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-failure", "first response")
        )
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-later", "later prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-later", "later response")
        )
        FakeSemanticSession.resume_errors = [HarnessError("semantic crash")]

        first = self.adapter.drain(self.session_key(session_id))
        second = self.adapter.drain(self.session_key(session_id))
        popen_count = len(self.popen.calls)
        attention = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-attention", "what is pending?")
        )

        self.assertEqual(first["failed"], 1)
        self.assertEqual(first["blocked"], 1)
        self.assertEqual(first["processed"], 0)
        self.assertEqual(second["already_resolved"], 1)
        self.assertEqual(second["blocked"], 1)
        self.assertEqual(len(FakeSemanticSession.deltas), 1)
        self.assertEqual(self.apply_calls, [])
        self.assertEqual(self.workspace_bytes(), before)
        self.assertEqual(len(self.popen.calls), popen_count)

        effects_directory = (
            self.runtime_root
            / self.session_key(session_id)
            / "effects"
        )
        failed_key = self.session_key("turn-failure")
        later_key = self.session_key("turn-later")
        failed_effect = json.loads(
            (effects_directory / f"{failed_key}.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertIs(failed_effect["blocks_later_events"], True)
        self.assertFalse((effects_directory / f"{later_key}.json").exists())
        context = attention["hookSpecificOutput"]["additionalContext"]
        self.assertIn("remain pending behind a failed semantic", context)
        self.assertIn("will not be retried on the affected binding", context)

        popen_count = len(self.popen.calls)
        ending = self.adapter.session_end(
            {
                "hook_event_name": "SessionEnd",
                "session_id": session_id,
                "cwd": "/unused/by-direct-test",
                "reason": "complete",
            }
        )
        self.assertEqual(len(self.popen.calls), popen_count)
        end_context = ending["hookSpecificOutput"]["additionalContext"]
        self.assertIn("Later events remain pending", end_context)
        self.assertIn("binding generation and were not retried", end_context)

    def test_apply_failure_blocks_later_event(self) -> None:
        apply_attempts: list[dict[str, object]] = []

        def failing_apply(
            project_root: Path,
            work_root: Path,
            workspace_id: str,
            decision: dict[str, object],
        ) -> dict[str, Any]:
            apply_attempts.append(decision)
            raise HarnessError("guarded apply crash")

        adapter = MaintainHostAdapter(
            self.project_root,
            runtime_root=self.runtime_root,
            session_type=FakeSemanticSession,
            runner=lambda *args, **kwargs: None,
            popen=self.popen,
            clock=self.clock,
            python_executable="fixture-python",
            bootstrap=bootstrap_workspace,
            apply_decision=failing_apply,
        )
        session_id = "host-session-blocked-after-apply-failure"
        adapter.activate(session_id, "001-example")
        adapter.user_prompt(
            self.prompt_payload(session_id, "turn-failure", "first prompt")
        )
        adapter.response_end(
            self.stop_payload(session_id, "turn-failure", "first response")
        )
        adapter.user_prompt(
            self.prompt_payload(session_id, "turn-later", "later prompt")
        )
        adapter.response_end(
            self.stop_payload(session_id, "turn-later", "later response")
        )

        summary = adapter.drain(self.session_key(session_id))

        self.assertEqual(summary["failed"], 1)
        self.assertEqual(summary["blocked"], 1)
        self.assertEqual(len(apply_attempts), 1)
        self.assertEqual(len(FakeSemanticSession.deltas), 1)

    def test_legacy_failed_effect_blocks_later_event_fail_closed(self) -> None:
        session_id = "host-session-legacy-failure"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-failure", "first prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-failure", "first response")
        )
        FakeSemanticSession.resume_errors = [HarnessError("legacy crash")]
        self.adapter.drain(self.session_key(session_id))

        effect_path = (
            self.runtime_root
            / self.session_key(session_id)
            / "effects"
            / f"{self.session_key('turn-failure')}.json"
        )
        legacy_effect = json.loads(effect_path.read_text(encoding="utf-8"))
        del legacy_effect["blocks_later_events"]
        effect_path.write_text(
            json.dumps(legacy_effect) + "\n", encoding="utf-8"
        )

        popen_count = len(self.popen.calls)
        attention = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-later", "later prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-later", "later response")
        )
        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(summary["already_resolved"], 1)
        self.assertEqual(summary["blocked"], 1)
        self.assertEqual(len(FakeSemanticSession.deltas), 1)
        self.assertEqual(len(self.popen.calls), popen_count)
        context = attention["hookSpecificOutput"]["additionalContext"]
        self.assertIn("paused on at least one binding generation", context)

    def test_unpaired_event_failure_does_not_block_later_semantic_event(
        self,
    ) -> None:
        session_id = "host-session-nonblocking-pairing-failure"
        session_directory = self.runtime_root / self.session_key(session_id)
        session_directory.mkdir(parents=True)
        (session_directory / "session.json").write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "workspace_id": "001-example",
                    "thread_id": "legacy-unpaired-thread",
                    "grounded_at": 900.0,
                }
            )
            + "\n",
            encoding="utf-8",
        )
        self.adapter.response_end(
            self.stop_payload(
                session_id,
                "turn-without-prompt",
                "response without a captured prompt",
            )
        )
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-valid", "valid prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-valid", "valid response")
        )

        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(summary["failed"], 1)
        self.assertEqual(summary["processed"], 1)
        self.assertEqual(summary["blocked"], 0)
        self.assertEqual(len(FakeSemanticSession.deltas), 1)
        self.assertEqual(
            FakeSemanticSession.deltas[0]["turn_id"], "turn-valid"
        )
        failed_effect = json.loads(
            (
                self.runtime_root
                / self.session_key(session_id)
                / "effects"
                / f"{self.session_key('turn-without-prompt')}.json"
            ).read_text(encoding="utf-8")
        )
        self.assertIs(failed_effect["blocks_later_events"], False)

    def test_initial_activation_does_not_capture_the_unbound_current_turn(
        self,
    ) -> None:
        session_id = "host-session-initial-cutover"
        self.adapter.user_prompt(
            self.prompt_payload(
                session_id, "turn-unbound", "activate during this response"
            )
        )

        self.activate_session(session_id, "001-example")
        stop = self.adapter.response_end(
            self.stop_payload(
                session_id,
                "turn-unbound",
                "activation command ran in this response",
            )
        )
        session_directory = self.runtime_root / self.session_key(session_id)
        events_directory = session_directory / "events"

        self.assertEqual(stop, {"continue": True})
        self.assertFalse(events_directory.exists())
        self.assertEqual(self.popen.calls, [])

        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-bound", "next prompt")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-bound", "next response")
        )
        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(summary["processed"], 1)
        self.assertEqual(
            [delta["turn_id"] for delta in FakeSemanticSession.deltas],
            ["turn-bound"],
        )

    def test_ambiguity_and_important_update_surface_on_next_prompt(self) -> None:
        session_id = "host-session-notifications"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-ambiguity", "choose source")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-ambiguity", "Which source?")
        )
        FakeSemanticSession.decisions = [
            {
                "schema_version": 1,
                "workspace_id": "001-example",
                "outcome": "needs_user_decision",
                "importance": "important",
                "summary": "Source authority is ambiguous.",
                "changes": [],
                "evidence": ["The user named two possible sources."],
                "unresolved": ["source authority"],
                "question": "Which source is authoritative?",
            }
        ]
        before_ambiguity = self.workspace_bytes()

        self.adapter.drain(self.session_key(session_id))
        ambiguity_output = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-important", "Use source A")
        )

        self.assertEqual(self.workspace_bytes(), before_ambiguity)
        self.assertIn(
            "Which source is authoritative?",
            ambiguity_output["hookSpecificOutput"]["additionalContext"],
        )

        state_path = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "state"
            / "index.md"
        )
        original = state_path.read_bytes()
        new_content = "# state\n\nImportant durable update.\n"
        FakeSemanticSession.decisions = [
            {
                "schema_version": 1,
                "workspace_id": "001-example",
                "outcome": "update",
                "importance": "important",
                "summary": "The current state changed materially.",
                "changes": [
                    {
                        "path": "current/state/index.md",
                        "expected_sha256": hashlib.sha256(original).hexdigest(),
                        "content": new_content,
                        "reason": "Preserve the material current-state change.",
                    }
                ],
                "evidence": ["The user selected source A."],
                "unresolved": [],
                "question": None,
            }
        ]
        self.adapter.response_end(
            self.stop_payload(
                session_id,
                "turn-important",
                "The important state is now recorded.",
            )
        )
        self.adapter.drain(self.session_key(session_id))
        important_output = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-after-update", "continue")
        )

        self.assertEqual(state_path.read_text(encoding="utf-8"), new_content)
        important_context = important_output["hookSpecificOutput"][
            "additionalContext"
        ]
        self.assertIn("updated Workspace", important_context)
        self.assertIn("current/state/index.md", important_context)

    def test_response_end_only_enqueues_and_starts_detached_drain(self) -> None:
        session_id = "host-session-detached"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-detached", "prompt")
        )

        self.adapter.response_end(
            self.stop_payload(session_id, "turn-detached", "response")
        )

        self.assertEqual(FakeSemanticSession.deltas, [])
        self.assertEqual(len(self.popen.calls), 1)
        command, options = self.popen.calls[0]
        self.assertIn("drain", command)
        self.assertTrue(options["start_new_session"])
        event_directory = (
            self.runtime_root
            / self.session_key(session_id)
            / "events"
        )
        self.assertEqual(len(list(event_directory.glob("*.json"))), 1)

    def test_next_prompt_exposes_prior_prompt_without_response_end_once(self) -> None:
        session_id = "host-session-orphan-prompt"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-orphan", "first prompt")
        )

        output = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-next", "next prompt")
        )
        repeated = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-next", "next prompt")
        )

        notification = output["hookSpecificOutput"]["additionalContext"]
        self.assertIn("without a matching response-end", notification)
        self.assertNotIn("hookSpecificOutput", repeated)
        effect_directory = (
            self.runtime_root
            / self.session_key(session_id)
            / "effects"
        )
        effects = [
            json.loads(path.read_text(encoding="utf-8"))
            for path in effect_directory.glob("*.json")
        ]
        self.assertEqual([effect["status"] for effect in effects], ["failed"])
        self.assertEqual(effects[0]["binding_generation"], 1)
        self.assertEqual(effects[0]["workspace_id"], "001-example")
        runtime = self.adapter.status(session_id)["runtime"]
        self.assertEqual(runtime["failed_effect_count"], 1)
        self.assertEqual(runtime["unassigned_failed_effect_count"], 0)
        self.assertEqual(runtime["by_generation"][0]["failed_effect_count"], 1)
        self.assertEqual(FakeSemanticSession.deltas, [])

    def test_session_end_exposes_prompt_without_response_end(self) -> None:
        session_id = "host-session-end-orphan"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-orphan", "prompt")
        )

        output = self.adapter.session_end(
            {
                "hook_event_name": "SessionEnd",
                "session_id": session_id,
                "reason": "other",
            }
        )

        self.assertIn("1 prompt(s) missing", output["systemMessage"])
        session_end = json.loads(
            (
                self.runtime_root
                / self.session_key(session_id)
                / "session-end.json"
            ).read_text(encoding="utf-8")
        )
        self.assertEqual(len(session_end["orphan_prompt_keys"]), 1)
        self.assertEqual(session_end["unresolved_event_keys"], [])

    def test_later_user_prompt_rekicks_an_unresolved_response_end(self) -> None:
        session_id = "host-session-rekick"
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-1", "prompt one")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-1", "response one")
        )
        self.assertEqual(len(self.popen.calls), 1)

        output = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-2", "prompt two")
        )

        self.assertEqual(len(self.popen.calls), 2)
        self.assertIn("systemMessage", output)
        pending_context = output["hookSpecificOutput"]["additionalContext"]
        self.assertIn("still pending", pending_context)
        self.assertIn("not completed", pending_context)
        self.assertIn("do not establish fresh or current Context", pending_context)

    def test_pending_boundary_and_notice_share_one_prompt_context(self) -> None:
        session_id = "host-session-pending-with-notice"
        failing_popen = FailingPopen()
        self.adapter._popen = failing_popen
        self.start_bound_session(session_id)
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-1", "prompt one")
        )
        self.adapter.response_end(
            self.stop_payload(session_id, "turn-1", "response one")
        )

        output = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-2", "prompt two")
        )

        self.assertEqual(
            set(output), {"continue", "systemMessage", "hookSpecificOutput"}
        )
        context = output["hookSpecificOutput"]["additionalContext"]
        self.assertIn("could not start its background worker", context)
        self.assertIn("still pending", context)
        self.assertEqual(context.count("Previous Workspace Maintain results"), 1)
        self.assertEqual(len(failing_popen.calls), 2)

    def test_legacy_v1_state_and_event_continue_as_generation_one(self) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-legacy-v1-continuity"
        session_directory = self.runtime_root / self.session_key(session_id)
        (session_directory / "events").mkdir(parents=True)
        (session_directory / "session.json").write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "workspace_id": "001-example",
                    "thread_id": "legacy-thread-a",
                    "grounded_at": 900.0,
                }
            )
            + "\n",
            encoding="utf-8",
        )
        legacy_turn_id = "legacy-turn-a"
        legacy_turn_key = self.session_key(legacy_turn_id)
        (session_directory / "events" / f"{legacy_turn_key}.json").write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "sequence": 1,
                    "turn_id": legacy_turn_id,
                    "user_prompt": "legacy A prompt",
                    "main_response": "legacy A response",
                    "accepted_at": 901.0,
                }
            )
            + "\n",
            encoding="utf-8",
        )

        rebound = self.activate_session(session_id, "002-other")
        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(rebound["binding_generation"], 2)
        self.assertEqual(summary["processed"], 1)
        self.assertEqual(
            FakeSemanticSession.restore_bindings,
            [("001-example", "legacy-thread-a")],
        )
        state = json.loads(
            (session_directory / "session.json").read_text(encoding="utf-8")
        )
        self.assertEqual(state["schema_version"], 2)
        self.assertEqual(
            [binding["generation"] for binding in state["bindings"]],
            [1, 2],
        )

    def test_deactivate_keeps_captured_turn_on_old_binding_and_future_unbound(
        self,
    ) -> None:
        session_id = "host-session-deactivate"
        self.activate_session(session_id, "001-example")
        self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-before-off", "captured prompt")
        )

        result = self.adapter.deactivate(session_id)
        self.adapter.response_end(
            self.stop_payload(
                session_id,
                "turn-before-off",
                "response after deactivation",
            )
        )
        turns_directory = (
            self.runtime_root / self.session_key(session_id) / "turns"
        )
        before_turn_count = len(list(turns_directory.glob("*.json")))
        next_prompt = self.adapter.user_prompt(
            self.prompt_payload(session_id, "turn-after-off", "unbound prompt")
        )
        after_turn_count = len(list(turns_directory.glob("*.json")))
        summary = self.adapter.drain(self.session_key(session_id))

        self.assertEqual(result["status"], "deactivated")
        self.assertEqual(self.adapter.status(session_id)["status"], "unbound")
        self.assertEqual(next_prompt, {"continue": True})
        self.assertEqual(after_turn_count, before_turn_count)
        self.assertEqual(summary["processed"], 1)
        self.assertEqual(
            FakeSemanticSession.restore_bindings,
            [("001-example", "maintain-thread-1")],
        )

    def test_v1_project_config_never_auto_binds_a_new_session(self) -> None:
        (self.project_root / ".codex" / "maintain.json").write_text(
            json.dumps(
                {"schema_version": 1, "workspace_id": "001-example"}
            )
            + "\n",
            encoding="utf-8",
        )
        session_id = "host-session-v1-config-unbound"

        output = self.adapter.session_start(self.session_start_payload(session_id))

        self.assertEqual(output, {"continue": True})
        self.assertFalse(
            (self.runtime_root / self.session_key(session_id)).exists()
        )
        self.assertEqual(FakeSemanticSession.starts, [])

    def test_status_retries_when_activation_adds_a_generation_mid_scan(
        self,
    ) -> None:
        self.add_workspace("002-other")
        session_id = "host-session-status-generation-race"
        self.activate_session(session_id, "001-example")
        original_runtime_status = self.adapter._runtime_status
        calls = 0

        def racing_runtime_status(
            session_directory: Path,
            state: dict[str, Any],
        ) -> dict[str, Any]:
            nonlocal calls
            calls += 1
            if calls == 1:
                self.activate_session(session_id, "002-other")
                self.adapter.user_prompt(
                    self.prompt_payload(session_id, "turn-b-race", "prompt B")
                )
                self.adapter.response_end(
                    self.stop_payload(
                        session_id, "turn-b-race", "response B"
                    )
                )
            return original_runtime_status(session_directory, state)

        with patch.object(
            self.adapter,
            "_runtime_status",
            side_effect=racing_runtime_status,
        ):
            status = self.adapter.status(session_id)

        self.assertEqual(calls, 2)
        self.assertEqual(status["current_binding"]["workspace_id"], "002-other")
        self.assertEqual(status["current_binding"]["binding_generation"], 2)
        self.assertEqual(status["runtime"]["unresolved_event_count"], 1)
        self.assertEqual(
            status["runtime"]["by_generation"][1]["unresolved_event_count"],
            1,
        )

    def test_status_reports_unattributed_legacy_failure_explicitly(self) -> None:
        session_id = "host-session-unassigned-legacy-failure"
        self.activate_session(session_id, "001-example")
        session_directory = self.runtime_root / self.session_key(session_id)
        effect_key = self.session_key("missing-legacy-boundary")
        effects_directory = session_directory / "effects"
        effects_directory.mkdir()
        (effects_directory / f"{effect_key}.json").write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "status": "failed",
                    "finished_at": 901.0,
                    "error": "legacy failure without event or turn",
                }
            )
            + "\n",
            encoding="utf-8",
        )

        runtime = self.adapter.status(session_id)["runtime"]

        self.assertEqual(runtime["failed_effect_count"], 1)
        self.assertEqual(runtime["unassigned_failed_effect_count"], 1)
        self.assertEqual(runtime["unassigned_failed_effect_keys"], [effect_key])
        self.assertEqual(runtime["by_generation"][0]["failed_effect_count"], 0)

    def test_status_cli_uses_env_or_explicit_session_without_writing(self) -> None:
        env_session = "host-session-from-env"
        explicit_session = "host-session-explicit"
        stdout = io.StringIO()
        before_paths = set(self.project_root.rglob("*"))

        with patch.dict(os.environ, {"CODEX_SESSION_ID": env_session}, clear=False):
            with redirect_stdout(stdout):
                exit_code = host_adapter_main(
                    [
                        "status",
                        "--project-root",
                        str(self.project_root),
                        "--runtime-root",
                        str(self.runtime_root),
                    ]
                )
        env_status = json.loads(stdout.getvalue())
        after_env_paths = set(self.project_root.rglob("*"))

        stdout = io.StringIO()
        with patch.dict(os.environ, {"CODEX_SESSION_ID": env_session}, clear=False):
            with redirect_stdout(stdout):
                explicit_exit_code = host_adapter_main(
                    [
                        "status",
                        "--project-root",
                        str(self.project_root),
                        "--runtime-root",
                        str(self.runtime_root),
                        "--session-id",
                        explicit_session,
                    ]
                )
        explicit_status = json.loads(stdout.getvalue())

        self.assertEqual(exit_code, 0)
        self.assertEqual(explicit_exit_code, 0)
        self.assertEqual(env_status["session_id"], env_session)
        self.assertEqual(explicit_status["session_id"], explicit_session)
        self.assertEqual(env_status["runtime"]["unresolved_event_count"], 0)
        self.assertEqual(after_env_paths, before_paths)
        self.assertFalse(self.runtime_root.exists())

    def test_control_cli_missing_session_is_a_nonzero_failure(self) -> None:
        stderr = io.StringIO()
        with patch.dict(os.environ, {}, clear=True):
            with redirect_stderr(stderr):
                exit_code = host_adapter_main(
                    [
                        "status",
                        "--project-root",
                        str(self.project_root),
                        "--runtime-root",
                        str(self.runtime_root),
                    ]
                )

        self.assertEqual(exit_code, 2)
        self.assertIn("requires --session-id or CODEX_SESSION_ID", stderr.getvalue())

    def test_empty_explicit_session_never_falls_back_to_ambient_session(self) -> None:
        stderr = io.StringIO()
        with patch.dict(
            os.environ,
            {"CODEX_SESSION_ID": "ambient-main-session"},
            clear=True,
        ):
            with patch.object(MaintainHostAdapter, "activate") as activate:
                with redirect_stderr(stderr):
                    exit_code = host_adapter_main(
                        [
                            "activate",
                            "001-example",
                            "--project-root",
                            str(self.project_root),
                            "--runtime-root",
                            str(self.runtime_root),
                            "--session-id",
                            "",
                        ]
                    )

        self.assertEqual(exit_code, 2)
        self.assertIn("Codex session id must be a non-empty string", stderr.getvalue())
        activate.assert_not_called()

    def test_activate_cli_accepts_positional_workspace_and_project_root(self) -> None:
        stdout = io.StringIO()
        result = {
            "schema_version": 2,
            "status": "activated",
            "session_id": "host-session-cli",
            "binding_generation": 1,
            "workspace_id": "001-example",
            "thread_id": "thread-cli",
        }
        with patch.object(
            MaintainHostAdapter, "activate", return_value=result
        ) as activate:
            with redirect_stdout(stdout):
                exit_code = host_adapter_main(
                    [
                        "activate",
                        "001-example",
                        "--project-root",
                        str(self.project_root),
                        "--runtime-root",
                        str(self.runtime_root),
                        "--session-id",
                        "host-session-cli",
                    ]
                )

        self.assertEqual(exit_code, 0)
        activate.assert_called_once_with("host-session-cli", "001-example")
        self.assertEqual(json.loads(stdout.getvalue()), result)

    def test_runtime_root_must_be_an_internal_absolute_lexical_path(self) -> None:
        outside = self.project_root.parent / "outside-maintain-runtime"
        traversal = self.project_root / ".codex" / ".." / "escaped-runtime"
        cases = [
            (Path("relative-runtime"), "absolute path"),
            (outside, "inside the Project root"),
            (traversal, "ancestor traversal"),
        ]

        for runtime_root, expected in cases:
            with self.subTest(runtime_root=runtime_root):
                with self.assertRaisesRegex(HarnessError, expected):
                    MaintainHostAdapter(
                        self.project_root,
                        runtime_root=runtime_root,
                        session_type=FakeSemanticSession,
                        popen=self.popen,
                        clock=self.clock,
                    )

    def test_preexisting_runtime_root_symlink_is_rejected(self) -> None:
        target = self.project_root / ".codex" / "linked-runtime-target"
        target.mkdir()
        linked_runtime = self.project_root / ".codex" / "linked-runtime"
        linked_runtime.symlink_to(target, target_is_directory=True)

        with self.assertRaisesRegex(HarnessError, "symlink components"):
            MaintainHostAdapter(
                self.project_root,
                runtime_root=linked_runtime,
                session_type=FakeSemanticSession,
                popen=self.popen,
                clock=self.clock,
            )

    def test_preexisting_session_directory_symlink_is_rejected(self) -> None:
        runtime_root = self.project_root / ".codex" / "session-link-runtime"
        runtime_root.mkdir()
        target = self.project_root / ".codex" / "linked-session-target"
        target.mkdir()
        session_id = "host-session-linked-directory"
        (runtime_root / self.session_key(session_id)).symlink_to(
            target, target_is_directory=True
        )
        adapter = MaintainHostAdapter(
            self.project_root,
            runtime_root=runtime_root,
            session_type=FakeSemanticSession,
            popen=self.popen,
            clock=self.clock,
        )

        with self.assertRaisesRegex(HarnessError, "symlink components"):
            adapter.session_start(self.session_start_payload(session_id))

    def test_detached_drains_wait_for_the_same_session_lock(self) -> None:
        session_id = "host-session-blocking-lock"
        self.start_bound_session(session_id)
        session_directory = self.adapter._session_directory(session_id)
        entered = threading.Event()
        finished = threading.Event()

        def run_second_drain() -> None:
            entered.set()
            self.adapter.drain(self.session_key(session_id))
            finished.set()

        with self.adapter._drain_lock(session_directory):
            worker = threading.Thread(target=run_second_drain)
            worker.start()
            self.assertTrue(entered.wait(timeout=1.0))
            self.assertFalse(finished.wait(timeout=0.05))
        worker.join(timeout=1.0)

        self.assertFalse(worker.is_alive())
        self.assertTrue(finished.is_set())


if __name__ == "__main__":
    unittest.main()
