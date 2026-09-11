from __future__ import annotations

import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from context.work.harness.maintain.codex_session import CodexMaintainSession
from context.work.harness.workspace_contract import HarnessError


THREAD_ID = "0198-maintain-thread"


def grounding(**overrides: object) -> dict[str, object]:
    value: dict[str, object] = {
        "schema_version": 1,
        "workspace_id": "007-clean-room",
        "status": "grounded",
        "starting_state": "bounded current was understood",
        "unresolved": [],
        "question": None,
    }
    value.update(overrides)
    return value


def no_change_decision(**overrides: object) -> dict[str, object]:
    value: dict[str, object] = {
        "schema_version": 1,
        "workspace_id": "007-clean-room",
        "outcome": "no_change",
        "importance": "none",
        "summary": "No durable context change.",
        "changes": [],
        "evidence": ["Main response only explained existing state."],
        "unresolved": [],
        "question": None,
    }
    value.update(overrides)
    return value


class ScriptedRunner:
    def __init__(self, scripts: list[dict[str, object]]) -> None:
        self.scripts = list(scripts)
        self.calls: list[tuple[list[str], dict[str, object]]] = []

    def __call__(self, command: list[str], **kwargs: object):
        self.calls.append((command, kwargs))
        script = self.scripts.pop(0)
        output = script.get("last_message")
        if output is not None:
            output_path = Path(
                command[command.index("--output-last-message") + 1]
            )
            raw = output if isinstance(output, str) else json.dumps(output)
            output_path.write_text(raw, encoding="utf-8")
        return subprocess.CompletedProcess(
            command,
            int(script.get("returncode", 0)),
            stdout=str(script.get("stdout", "")),
            stderr=str(script.get("stderr", "")),
        )


class CodexMaintainSessionTests(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.temp_root = Path(temporary.name)
        self.project_root = self.temp_root / "project"
        self.project_root.mkdir()

    def new_session(self, runner: ScriptedRunner) -> CodexMaintainSession:
        return CodexMaintainSession(
            self.project_root,
            "007-clean-room",
            runner=runner,
            codex_executable="fixture-codex",
        )

    @staticmethod
    def started(thread_id: str = THREAD_ID) -> str:
        return (
            json.dumps({"type": "thread.started", "thread_id": thread_id})
            + "\n"
            + json.dumps({"type": "turn.completed"})
            + "\n"
        )

    def test_starts_once_with_read_only_bounded_prompt(self) -> None:
        runner = ScriptedRunner(
            [{"stdout": self.started(), "last_message": grounding()}]
        )
        session = self.new_session(runner)
        output_path = self.temp_root / "grounding.json"
        bootstrap = {
            "schema_version": 6,
            "workspace_id": "007-clean-room",
            "starting_marker": "BOUNDED_BOOTSTRAP_MARKER",
        }

        result = session.start(bootstrap, output_path=output_path)

        self.assertEqual(result, grounding())
        self.assertEqual(session.thread_id, THREAD_ID)
        command, options = runner.calls[0]
        module_root = Path(__file__).resolve().parents[1]
        self.assertEqual(
            command,
            [
                "fixture-codex",
                "exec",
                "--json",
                "--sandbox",
                "read-only",
                "--ignore-user-config",
                "-C",
                str(self.project_root.resolve()),
                "-c",
                "features.hooks=false",
                "--output-schema",
                str(module_root / "grounding.schema.json"),
                "--output-last-message",
                str(output_path),
                "-",
            ],
        )
        self.assertTrue(options["text"])
        self.assertTrue(options["capture_output"])
        self.assertFalse(options["check"])
        prompt = str(options["input"])
        readme = (module_root / "README.md").read_text(encoding="utf-8")
        self.assertIn("Explicit workspace_id: 007-clean-room", prompt)
        self.assertIn(readme, prompt)
        self.assertIn(
            (module_root.parents[1] / "workspaces" / "SPEC-AND-TICKETS.md")
            .read_text(encoding="utf-8"),
            prompt,
        )
        self.assertIn("BOUNDED_BOOTSTRAP_MARKER", prompt)
        self.assertIn("Do not call tools", prompt)
        self.assertIn("run tests or evals", prompt)
        self.assertIn("access external systems", prompt)

        with self.assertRaisesRegex(HarnessError, "already been grounded"):
            session.start(bootstrap, output_path=self.temp_root / "again.json")
        self.assertEqual(len(runner.calls), 1)

    def test_resume_reuses_exact_thread_id_and_decision_schema(self) -> None:
        runner = ScriptedRunner(
            [
                {"stdout": self.started(), "last_message": grounding()},
                {
                    "stdout": self.started(),
                    "last_message": no_change_decision(),
                },
            ]
        )
        session = self.new_session(runner)
        session.start(
            {"workspace_id": "007-clean-room"},
            output_path=self.temp_root / "grounding.json",
        )
        delta = {
            "user_message": "existing guidance",
            "main_response": "RESPONSE_DELTA_MARKER",
            "evidence": [],
        }

        result = session.resume(
            delta, output_path=self.temp_root / "decision.json"
        )

        self.assertEqual(result, no_change_decision())
        command, options = runner.calls[1]
        module_root = Path(__file__).resolve().parents[1]
        self.assertEqual(
            command,
            [
                "fixture-codex",
                "exec",
                "resume",
                THREAD_ID,
                "--json",
                "--ignore-user-config",
                "-c",
                "features.hooks=false",
                "--output-schema",
                str(module_root / "decision.schema.json"),
                "--output-last-message",
                str(self.temp_root / "decision.json"),
                "-",
            ],
        )
        prompt = str(options["input"])
        self.assertIn("Explicit workspace_id: 007-clean-room", prompt)
        self.assertIn(
            (module_root / "README.md").read_text(encoding="utf-8"), prompt
        )
        self.assertIn("RESPONSE_DELTA_MARKER", prompt)
        self.assertIn("read-only local inspection", prompt)
        self.assertIn("relevant existing Context Owner", prompt)
        self.assertIn("current/ for documents that directly repeat", prompt)
        self.assertIn("`기록해 달라`는 요청만으로 그 원문을 current에 옮기지 않는다", prompt)
        self.assertIn("Do not explore other Workspaces", prompt)
        self.assertIn("Do not write files", prompt)

    def test_resolves_symlink_when_real_codex_has_sibling_tool_host(self) -> None:
        bundle = self.temp_root / "bundle"
        bundle.mkdir()
        real_codex = bundle / "codex"
        real_codex.write_text("fixture\n", encoding="utf-8")
        real_codex.chmod(0o755)
        sibling_host = bundle / "codex-code-mode-host"
        sibling_host.write_text("fixture\n", encoding="utf-8")
        sibling_host.chmod(0o755)
        linked_codex = self.temp_root / "linked-codex"
        linked_codex.symlink_to(real_codex)
        runner = ScriptedRunner(
            [{"stdout": self.started(), "last_message": grounding()}]
        )
        session = CodexMaintainSession(
            self.project_root,
            "007-clean-room",
            runner=runner,
            codex_executable=str(linked_codex),
        )

        session.start(
            {"workspace_id": "007-clean-room"},
            output_path=self.temp_root / "resolved.json",
        )

        self.assertEqual(
            Path(runner.calls[0][0][0]).resolve(), real_codex.resolve()
        )

    def test_command_and_untrusted_output_fail_closed(self) -> None:
        scripts_and_errors = [
            (
                {"returncode": 7, "stderr": "offline"},
                "Codex command failed with exit 7",
            ),
            (
                {
                    "stdout": json.dumps({"type": "turn.completed"}),
                    "last_message": grounding(),
                },
                "missing thread.started",
            ),
            (
                {"stdout": "not-json\n", "last_message": grounding()},
                "JSONL contains invalid JSON",
            ),
            (
                {"stdout": self.started(), "last_message": "{not-json"},
                "last message is not valid JSON",
            ),
            (
                {
                    "stdout": self.started(),
                    "last_message": grounding(workspace_id="008-other"),
                },
                "does not match the explicit Workspace",
            ),
        ]
        for index, (script, expected) in enumerate(scripts_and_errors):
            with self.subTest(expected=expected):
                runner = ScriptedRunner([script])
                session = self.new_session(runner)
                with self.assertRaisesRegex(HarnessError, expected):
                    session.start(
                        {"workspace_id": "007-clean-room"},
                        output_path=self.temp_root / f"failure-{index}.json",
                    )
                self.assertIsNone(session.thread_id)

    def test_resume_rejects_mismatched_thread_and_invalid_combination(self) -> None:
        cases = [
            (
                self.started("different-thread"),
                no_change_decision(),
                "does not match the grounded thread",
            ),
            (
                self.started(),
                no_change_decision(importance="important"),
                "no_change requires importance=none",
            ),
        ]
        for index, (stdout, last_message, expected) in enumerate(cases):
            with self.subTest(expected=expected):
                runner = ScriptedRunner(
                    [
                        {
                            "stdout": self.started(),
                            "last_message": grounding(),
                        },
                        {"stdout": stdout, "last_message": last_message},
                    ]
                )
                session = self.new_session(runner)
                session.start(
                    {"workspace_id": "007-clean-room"},
                    output_path=self.temp_root / f"grounding-{index}.json",
                )
                with self.assertRaisesRegex(HarnessError, expected):
                    session.resume(
                        {"main_response": "delta"},
                        output_path=self.temp_root / f"decision-{index}.json",
                    )
                self.assertEqual(session.thread_id, THREAD_ID)

    def test_resume_requires_successful_grounding(self) -> None:
        session = self.new_session(ScriptedRunner([]))

        with self.assertRaisesRegex(HarnessError, "grounded before resume"):
            session.resume(
                {"main_response": "delta"},
                output_path=self.temp_root / "decision.json",
            )

    def test_restore_reuses_a_validated_persisted_thread(self) -> None:
        runner = ScriptedRunner(
            [{"stdout": self.started(), "last_message": no_change_decision()}]
        )
        session = CodexMaintainSession.restore(
            self.project_root,
            "007-clean-room",
            thread_id=THREAD_ID,
            runner=runner,
        )

        session.resume(
            {"main_response": "delta"},
            output_path=self.temp_root / "restored-decision.json",
        )

        self.assertEqual(session.thread_id, THREAD_ID)
        self.assertEqual(runner.calls[0][0][2:4], ["resume", THREAD_ID])
        with self.assertRaisesRegex(HarnessError, "unsupported characters"):
            CodexMaintainSession.restore(
                self.project_root,
                "007-clean-room",
                thread_id="--last",
                runner=runner,
            )


if __name__ == "__main__":
    unittest.main()
