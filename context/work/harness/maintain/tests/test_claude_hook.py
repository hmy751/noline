from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import unittest

from context.work.harness.maintain.claude_hook import ClaudeHookAdapter
from context.work.harness.maintain.host_adapter import MaintainHostAdapter
from context.work.harness.workspace_contract import HarnessError
from context.work.harness.testing import WorkspaceFixture


class FakeSemanticSession:
    def __init__(
        self, project_root: Path, workspace_id: str, *, runner: object
    ) -> None:
        self.workspace_id = workspace_id
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
        return session

    def start(self, _: dict[str, object]) -> dict[str, object]:
        self.thread_id = "claude-hook-test-thread"
        return {
            "schema_version": 1,
            "workspace_id": self.workspace_id,
            "status": "grounded",
            "starting_state": "fixture",
            "unresolved": [],
            "question": None,
        }

    def resume(self, _: dict[str, object]) -> dict[str, object]:
        return {
            "schema_version": 1,
            "workspace_id": self.workspace_id,
            "outcome": "no_change",
            "importance": "none",
            "summary": "No change.",
            "changes": [],
            "evidence": ["fixture"],
            "unresolved": [],
            "question": None,
        }


class RecordingPopen:
    def __init__(self) -> None:
        self.calls: list[tuple[list[str], dict[str, object]]] = []

    def __call__(self, command: list[str], **options: object) -> object:
        self.calls.append((command, options))
        return object()


class ClaudeHookAdapterTests(WorkspaceFixture):
    def setUp(self) -> None:
        super().setUp()
        codex_directory = self.project_root / ".codex"
        codex_directory.mkdir()
        (codex_directory / "maintain.json").write_text(
            json.dumps({"schema_version": 2, "mode": "explicit"}) + "\n",
            encoding="utf-8",
        )
        self.runtime_root = self.project_root / ".claude" / "maintain-runtime"
        self.popen = RecordingPopen()
        self.adapter = MaintainHostAdapter(
            self.project_root,
            runtime_root=self.runtime_root,
            session_type=FakeSemanticSession,
            runner=lambda *args, **kwargs: None,
            popen=self.popen,
        )

    @staticmethod
    def session_key(session_id: str) -> str:
        return hashlib.sha256(session_id.encode("utf-8")).hexdigest()

    @staticmethod
    def payload(event: str, session_id: str, **extra: object) -> dict[str, object]:
        return {
            "hook_event_name": event,
            "session_id": session_id,
            "cwd": "/not-used-for-selection",
            **extra,
        }

    def test_unbound_events_do_not_create_claude_runtime(self) -> None:
        hook = ClaudeHookAdapter(self.project_root, adapter=self.adapter, environ={})
        session_id = "claude-unbound"

        self.assertEqual(
            hook.session_start(self.payload("SessionStart", session_id)),
            {"continue": True},
        )
        self.assertEqual(
            hook.user_prompt(
                self.payload("UserPromptSubmit", session_id, prompt="hello")
            ),
            {"continue": True},
        )
        self.assertEqual(
            hook.response_end(
                self.payload(
                    "Stop",
                    session_id,
                    last_assistant_message="hello back",
                    stop_hook_active=False,
                )
            ),
            {"continue": True},
        )
        self.assertEqual(
            hook.session_end(self.payload("SessionEnd", session_id)),
            {"continue": True},
        )
        self.assertFalse(self.runtime_root.exists())

    def test_session_start_exports_selector_for_manual_control(self) -> None:
        environment_file = self.project_root / "claude-session.env"
        environment_file.write_text("", encoding="utf-8")
        hook = ClaudeHookAdapter(
            self.project_root,
            adapter=self.adapter,
            environ={"CLAUDE_ENV_FILE": str(environment_file)},
        )

        hook.session_start(self.payload("SessionStart", "claude-selector"))

        self.assertEqual(
            environment_file.read_text(encoding="utf-8"),
            "export NOLINE_MAINTAIN_CLAUDE_SESSION_ID=claude-selector\n",
        )

    def test_bound_prompt_and_stop_use_one_generated_turn_id(self) -> None:
        session_id = "claude-bound"
        self.adapter.activate(session_id, "001-example")
        hook = ClaudeHookAdapter(self.project_root, adapter=self.adapter, environ={})

        hook.user_prompt(
            self.payload("UserPromptSubmit", session_id, prompt="record this")
        )
        hook.response_end(
            self.payload(
                "Stop",
                session_id,
                last_assistant_message="recorded",
                stop_hook_active=False,
            )
        )
        hook.response_end(
            self.payload(
                "Stop",
                session_id,
                last_assistant_message="recorded",
                stop_hook_active=False,
            )
        )

        session_directory = self.runtime_root / self.session_key(session_id)
        events = list((session_directory / "events").glob("*.json"))
        self.assertEqual(len(events), 1)
        event = json.loads(events[0].read_text(encoding="utf-8"))
        self.assertEqual(event["user_prompt"], "record this")
        self.assertEqual(event["main_response"], "recorded")
        self.assertEqual(len(self.popen.calls), 2)

    def test_subagent_lifecycle_events_do_not_touch_main_binding(self) -> None:
        session_id = "claude-main-with-subagent"
        self.adapter.activate(session_id, "001-example")
        environment_file = self.project_root / "claude-subagent.env"
        environment_file.write_text("", encoding="utf-8")
        hook = ClaudeHookAdapter(
            self.project_root,
            adapter=self.adapter,
            environ={"CLAUDE_ENV_FILE": str(environment_file)},
        )
        subagent = {"agent_id": "subagent-1"}

        self.assertEqual(
            hook.session_start(
                self.payload("SessionStart", session_id, **subagent)
            ),
            {"continue": True},
        )
        self.assertEqual(
            hook.user_prompt(
                self.payload("UserPromptSubmit", session_id, prompt="sub work", **subagent)
            ),
            {"continue": True},
        )
        self.assertEqual(
            hook.response_end(
                self.payload(
                    "Stop",
                    session_id,
                    last_assistant_message="sub result",
                    stop_hook_active=False,
                    **subagent,
                )
            ),
            {"continue": True},
        )
        self.assertEqual(
            hook.session_end(self.payload("SessionEnd", session_id, **subagent)),
            {"continue": True},
        )
        self.assertEqual(
            environment_file.read_text(encoding="utf-8"),
            "",
        )
        session_directory = self.runtime_root / self.session_key(session_id)
        self.assertFalse((session_directory / "turns").exists())
        self.assertFalse((session_directory / "events").exists())

    def test_turn_state_rejects_runtime_root_symlink(self) -> None:
        session_id = "claude-runtime-symlink"
        self.adapter.activate(session_id, "001-example")
        hook = ClaudeHookAdapter(self.project_root, adapter=self.adapter, environ={})
        outside = self.project_root / "outside-runtime"
        outside.mkdir()
        shutil.rmtree(self.runtime_root)
        self.runtime_root.symlink_to(outside, target_is_directory=True)

        with self.assertRaises(HarnessError):
            hook._write_turn_state(
                session_id,
                {
                    "schema_version": 1,
                    "pending": None,
                    "last_stop": None,
                },
            )

        self.assertFalse(
            (outside / self.session_key(session_id) / "claude-hook-turn-state.json").exists()
        )


if __name__ == "__main__":
    unittest.main()
