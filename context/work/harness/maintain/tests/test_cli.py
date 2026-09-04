from __future__ import annotations

import hashlib
import json

from context.work.harness.testing import WorkspaceFixture


class MaintainCliTests(WorkspaceFixture):
    def test_bootstrap_requires_explicit_workspace_and_ignores_active_index(
        self,
    ) -> None:
        (self.work_root / "workspaces" / "index.json").write_text(
            "not-json\n", encoding="utf-8"
        )

        completed = self.run_cli(
            "maintain", "bootstrap", "001-example", "--json"
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        packet = json.loads(completed.stdout)
        self.assertEqual(packet["workspace_id"], "001-example")
        self.assertNotIn("workspaces/index.json", completed.stdout)

    def test_apply_reads_structured_decision_from_file(self) -> None:
        target = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "state"
            / "index.md"
        )
        decision = {
            "schema_version": 1,
            "workspace_id": "001-example",
            "outcome": "update",
            "importance": "quiet",
            "summary": "Update the durable current state.",
            "changes": [
                {
                    "path": "current/state/index.md",
                    "expected_sha256": hashlib.sha256(
                        target.read_bytes()
                    ).hexdigest(),
                    "content": "# state\n\nupdated current description\n",
                    "reason": "The current problem changed.",
                }
            ],
            "evidence": ["fixture user correction"],
            "unresolved": [],
            "question": None,
        }
        decision_path = self.project_root / "decision.json"
        decision_path.write_text(
            json.dumps(decision, ensure_ascii=False), encoding="utf-8"
        )

        completed = self.run_cli(
            "maintain", "apply", "001-example", str(decision_path)
        )

        self.assertEqual(completed.returncode, 0, completed.stderr)
        result = json.loads(completed.stdout)
        self.assertEqual(result["context_status"], "updated")
        self.assertEqual(
            target.read_text(encoding="utf-8"),
            "# state\n\nupdated current description\n",
        )

    def test_apply_rejects_invalid_json_without_writing(self) -> None:
        target = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "state"
            / "index.md"
        )
        before = target.read_bytes()
        decision_path = self.project_root / "invalid-decision.json"
        decision_path.write_text("{bad\n", encoding="utf-8")

        completed = self.run_cli(
            "maintain", "apply", "001-example", str(decision_path)
        )

        self.assertEqual(completed.returncode, 2)
        self.assertIn("not valid JSON", completed.stderr)
        self.assertEqual(target.read_bytes(), before)
