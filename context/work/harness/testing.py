"""Minimal isolated Project/Workspace support shared by Harness tests."""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


HARNESS_SOURCE = Path(__file__).resolve().parent


class WorkspaceFixture(unittest.TestCase):
    maxDiff = None

    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.project_root = Path(self.temporary_directory.name)
        self.work_root = self.project_root / "context" / "work"
        self.work_root.mkdir(parents=True)
        (self.project_root / "context" / "__init__.py").write_text(
            '"""Fixture context package."""\n', encoding="utf-8"
        )
        (self.work_root / "__init__.py").write_text(
            '"""Fixture work context package."""\n', encoding="utf-8"
        )
        shutil.copytree(
            HARNESS_SOURCE,
            self.work_root / "harness",
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
        )
        for directory in (
            "context/project/common",
            "context/project/current",
            "context/project/guidance",
            "context/project/decisions",
            "src",
            "tests",
        ):
            (self.project_root / directory).mkdir(parents=True, exist_ok=True)
        for directory in (
            "workspaces/001-example/current/memory/spec",
            "workspaces/001-example/current/memory/tickets",
            "workspaces/001-example/current/state",
            "workspaces/001-example/source",
            "workspaces/001-example/output",
            "workspaces/001-example/records",
            "workspaces/001-example/records/receipts/verify",
        ):
            (self.work_root / directory).mkdir(parents=True, exist_ok=True)

        shutil.copyfile(
            HARNESS_SOURCE.parent / "workspaces" / "SPEC-AND-TICKETS.md",
            self.work_root / "workspaces" / "SPEC-AND-TICKETS.md",
        )

        (self.project_root / "context" / "project" / "README.md").write_text(
            "PROJECT_ROUTING_CONTEXT\n", encoding="utf-8"
        )
        project_context_root = self.project_root / "context" / "project"
        (project_context_root / "common" / "README.md").write_text(
            "PROJECT_COMMON_ROUTING\n", encoding="utf-8"
        )
        (project_context_root / "common" / "task-context.md").write_text(
            "PROJECT_COMMON_CONTEXT\n", encoding="utf-8"
        )
        (project_context_root / "current" / "README.md").write_text(
            "PROJECT_CURRENT_ROUTING\n", encoding="utf-8"
        )
        (project_context_root / "current" / "task-state.md").write_text(
            "PROJECT_CURRENT_CONTEXT\n", encoding="utf-8"
        )
        (project_context_root / "guidance" / "README.md").write_text(
            "UNSELECTED_PROJECT_GUIDANCE_ROUTING\n", encoding="utf-8"
        )
        (project_context_root / "guidance" / "not-selected.md").write_text(
            "UNSELECTED_PROJECT_GUIDANCE\n", encoding="utf-8"
        )
        (project_context_root / "decisions" / "README.md").write_text(
            "UNSELECTED_PROJECT_DECISIONS_ROUTING\n", encoding="utf-8"
        )
        (self.project_root / "src" / "value.txt").write_text(
            "wrong\n", encoding="utf-8"
        )
        (self.project_root / "tests" / "__init__.py").write_text(
            "", encoding="utf-8"
        )
        (self.project_root / "tests" / "test_behavior.py").write_text(
            "from pathlib import Path\n"
            "import unittest\n\n"
            "class BehaviorTests(unittest.TestCase):\n"
            "    def test_value(self):\n"
            "        self.assertEqual(\n"
            "            Path('src/value.txt').read_text(encoding='utf-8'),\n"
            "            'expected\\n',\n"
            "        )\n",
            encoding="utf-8",
        )
        (self.project_root / "tests" / "test_delete_evidence.py").write_text(
            "from pathlib import Path\n"
            "import unittest\n\n"
            "class DeleteEvidenceTests(unittest.TestCase):\n"
            "    def test_delete_then_fail(self):\n"
            "        Path('src/value.txt').unlink()\n"
            "        self.fail('intentional failure after evidence deletion')\n",
            encoding="utf-8",
        )
        (self.project_root / "tests" / "test_slow.py").write_text(
            "import time\n"
            "import unittest\n\n"
            "class SlowTests(unittest.TestCase):\n"
            "    def test_slow(self):\n"
            "        time.sleep(2)\n",
            encoding="utf-8",
        )
        (self.project_root / "tests" / "test_noisy.py").write_text(
            "from pathlib import Path\n"
            "import sys\n"
            "import unittest\n\n"
            "class NoisyTests(unittest.TestCase):\n"
            "    def test_noisy(self):\n"
            "        roots = str(Path.cwd()) * 50\n"
            "        print(roots + 'X' * 2000)\n"
            "        print(roots + 'Y' * 2000, file=sys.stderr)\n",
            encoding="utf-8",
        )

        records = self.work_root / "workspaces" / "001-example" / "records"
        (records / "old.json").write_text(
            '{"secret": "UNLOADED_RECORD_SECRET"}\n', encoding="utf-8"
        )
        (records / "old.md").write_text(
            "UNLOADED_RECORD_MARKDOWN_SECRET\n", encoding="utf-8"
        )
        source = self.work_root / "workspaces" / "001-example" / "source"
        (source / "index.md").write_text(
            "UNLOADED_SOURCE_INVENTORY_SECRET\n", encoding="utf-8"
        )
        (source / "raw-input.txt").write_text(
            "UNLOADED_SOURCE_RAW_SECRET\n", encoding="utf-8"
        )
        output = self.work_root / "workspaces" / "001-example" / "output"
        (output / "index.md").write_text(
            "WORKSPACE_OUTPUT_INDEX\n\n- [analysis](analysis.md)\n",
            encoding="utf-8",
        )
        (output / "analysis.md").write_text(
            "UNLOADED_OUTPUT_ARTIFACT_SECRET\n", encoding="utf-8"
        )

        self.index = {
            "schema_version": 1,
            "active_workspace_id": "001-example",
        }
        self.identity = {
            "schema_version": 1,
            "workspace_id": "001-example",
        }
        self.recover_contract = {
            "schema_version": 6,
            "workspace_id": "001-example",
            "project_context": [
                {
                    "path": "context/project/README.md",
                    "reason": "fixture의 Project 책임 routing anchor",
                },
                {
                    "path": "context/project/common/task-context.md",
                    "reason": "fixture goal에 지속해서 필요한 Project 기준",
                },
                {
                    "path": "context/project/current/task-state.md",
                    "reason": "fixture goal이 의존하는 현재 Project 상태",
                },
            ],
        }
        self.verify_contract = {
            "schema_version": 2,
            "workspace_id": "001-example",
            "claim": "제품 값이 Project의 기대값과 일치한다.",
            "canonical_basis": ["context/project/common/task-context.md"],
            "verification": {
                "argv": [
                    "python3",
                    "-m",
                    "unittest",
                    "tests.test_behavior",
                    "-v",
                ],
                "evidence_paths": ["src/value.txt", "tests/test_behavior.py"],
            },
        }
        self.write_work_json("workspaces/index.json", self.index)
        self.write_work_json(
            "workspaces/001-example/workspace.json", self.identity
        )
        self.write_work_json(
            "workspaces/001-example/recover.json", self.recover_contract
        )
        self.write_work_json(
            "workspaces/001-example/verify.json", self.verify_contract
        )

        memory = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "memory"
        )
        (memory / "index.md").write_text(
            "WORKSPACE_MEMORY_INDEX\n", encoding="utf-8"
        )
        for name, content in (
            ("01-problem-goal-scope.md", "WORKSPACE_SPEC_GOAL"),
            ("02-behavior-and-cases.md", "WORKSPACE_SPEC_BEHAVIOR"),
            ("03-concepts-and-contracts.md", "WORKSPACE_SPEC_CONTRACTS"),
            ("04-quality-and-completion.md", "WORKSPACE_SPEC_QUALITY"),
            ("05-constraints-design-assumptions.md", "WORKSPACE_SPEC_DESIGN"),
        ):
            (memory / "spec" / name).write_text(content + "\n", encoding="utf-8")
        (memory / "tickets" / "index.md").write_text(
            "WORKSPACE_TICKET_INDEX\n\n- [Example](001-example.md)\n",
            encoding="utf-8",
        )
        (memory / "tickets" / "001-example.md").write_text(
            "UNLOADED_TICKET_BODY\n", encoding="utf-8"
        )
        (memory / "project-context.md").write_text(
            "WORKSPACE_MEMORY_PROJECT_CONTEXT\n", encoding="utf-8"
        )
        (memory / "notes.txt").write_text(
            "UNLOADED_MEMORY_NON_MARKDOWN_SECRET\n", encoding="utf-8"
        )
        (memory / "nested").mkdir()
        (memory / "nested" / "archived.md").write_text(
            "UNLOADED_NESTED_MEMORY_SECRET\n", encoding="utf-8"
        )
        state = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "state"
        )
        (state / "index.md").write_text(
            "# state\n\nhuman-owned current description\n", encoding="utf-8"
        )
        self.write_status()

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def write_work_json(self, relative_path: str, value: object) -> None:
        (self.work_root / relative_path).write_text(
            json.dumps(value, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    def initial_status(self) -> dict[str, object]:
        return {
            "schema_version": 3,
            "workspace_id": "001-example",
            "status": "ready_for_verification",
            "result": None,
            "receipt": None,
            "finished_at": None,
        }

    def write_status(self, status: dict[str, object] | None = None) -> None:
        self.write_work_json(
            "workspaces/001-example/current/state/status.json",
            status or self.initial_status(),
        )

    def run_cli(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-m", "context.work.harness", *arguments],
            cwd=self.project_root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            check=False,
        )

    def read_status(self) -> dict[str, object]:
        return json.loads(
            (
                self.work_root
                / "workspaces"
                / "001-example"
                / "current"
                / "state"
                / "status.json"
            ).read_text(encoding="utf-8")
        )

    def receipt_files(self) -> list[Path]:
        return sorted(
            (
                self.work_root
                / "workspaces"
                / "001-example"
                / "records"
                / "receipts"
                / "verify"
            ).glob("verify-*.json")
        )

    def verified_status(
        self,
        receipt: str,
        *,
        result: str = "pass",
        finished_at: str = "2026-08-13T00:00:00.000Z",
    ) -> dict[str, object]:
        return {
            "schema_version": 3,
            "workspace_id": "001-example",
            "status": (
                "verification_passed"
                if result == "pass"
                else "verification_failed"
            ),
            "result": result,
            "receipt": receipt,
            "finished_at": finished_at,
        }
