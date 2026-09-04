from __future__ import annotations

import copy
import hashlib
from pathlib import Path

from context.work.harness.maintain import (
    apply_maintain_decision,
    bootstrap_workspace,
    validate_maintain_decision,
)
from context.work.harness.testing import WorkspaceFixture
from context.work.harness.workspace_contract import HarnessError


class MaintainOperationTests(WorkspaceFixture):
    def decision(
        self,
        outcome: str,
        *,
        importance: str | None = None,
        changes: list[dict[str, object]] | None = None,
        question: str | None = None,
    ) -> dict[str, object]:
        if importance is None:
            importance = {
                "no_change": "none",
                "update": "quiet",
                "needs_user_decision": "important",
            }[outcome]
        return {
            "schema_version": 1,
            "workspace_id": "001-example",
            "outcome": outcome,
            "importance": importance,
            "summary": f"{outcome} fixture decision",
            "changes": changes or [],
            "evidence": ["fixture evidence"],
            "unresolved": [],
            "question": question,
        }

    def relative(self, relative_path: str) -> Path:
        return (
            self.work_root / "workspaces" / "001-example" / relative_path
        )

    def digest(self, path: Path) -> str:
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def workspace_bytes(self) -> dict[str, bytes]:
        workspace = self.work_root / "workspaces" / "001-example"
        return {
            path.relative_to(workspace).as_posix(): path.read_bytes()
            for path in workspace.rglob("*")
            if path.is_file() and not path.is_symlink()
        }

    def apply(self, decision: dict[str, object]) -> dict[str, object]:
        return apply_maintain_decision(
            self.project_root,
            self.work_root,
            "001-example",
            decision,
        )

    def test_bootstrap_is_explicit_and_bounded_by_recover(self) -> None:
        (self.work_root / "workspaces" / "index.json").write_text(
            "not valid json\n", encoding="utf-8"
        )

        packet = bootstrap_workspace(
            self.project_root, self.work_root, "001-example"
        )

        self.assertEqual(packet["workspace_id"], "001-example")
        self.assertNotIn(
            "workspaces/index.json",
            [entry["path"] for entry in packet["control_paths"]],
        )
        serialized = repr(packet)
        for excluded in (
            "UNLOADED_RECORD_SECRET",
            "UNLOADED_RECORD_MARKDOWN_SECRET",
            "UNLOADED_SOURCE_INVENTORY_SECRET",
            "UNLOADED_SOURCE_RAW_SECRET",
            "UNLOADED_OUTPUT_ARTIFACT_SECRET",
            "UNSELECTED_PROJECT_SECRET",
        ):
            self.assertNotIn(excluded, serialized)
        with self.assertRaises(HarnessError):
            bootstrap_workspace(self.project_root, self.work_root, None)  # type: ignore[arg-type]

    def test_no_change_preserves_every_workspace_file_byte_for_byte(self) -> None:
        before = self.workspace_bytes()

        result = self.apply(self.decision("no_change"))

        self.assertEqual(result["context_status"], "no_change")
        self.assertEqual(result["changed"], [])
        self.assertEqual(self.workspace_bytes(), before)

    def test_allowed_existing_update_requires_and_matches_preimage(self) -> None:
        target = self.relative("current/memory/01-goal.md")
        decision = self.decision(
            "update",
            changes=[
                {
                    "path": "current/memory/01-goal.md",
                    "expected_sha256": self.digest(target),
                    "content": (
                        "# Updated goal\n\n"
                        "Continue with the [state](../state/index.md).\n"
                    ),
                    "reason": "The durable goal changed.",
                }
            ],
        )

        result = self.apply(decision)

        self.assertEqual(result["context_status"], "updated")
        self.assertEqual(
            result["changed"],
            [
                {
                    "path": "current/memory/01-goal.md",
                    "reason": "The durable goal changed.",
                }
            ],
        )
        self.assertEqual(
            target.read_text(encoding="utf-8"),
            decision["changes"][0]["content"],
        )

    def test_needs_user_decision_is_zero_write(self) -> None:
        before = self.workspace_bytes()
        decision = self.decision(
            "needs_user_decision",
            question="Which source should be authoritative?",
        )

        result = self.apply(decision)

        self.assertEqual(result["context_status"], "needs_user_decision")
        self.assertEqual(result["question"], decision["question"])
        self.assertEqual(result["changed"], [])
        self.assertEqual(self.workspace_bytes(), before)

    def test_rejects_restricted_machine_product_and_nested_paths(self) -> None:
        cases = (
            "current/state/status.json",
            "workspace.json",
            "recover.json",
            "verify.json",
            "records/receipts/verify/new.md",
            "source/raw-input.md",
            "output/analysis.md",
            "current/memory/nested/note.md",
            "../../src/value.txt",
        )
        for relative_path in cases:
            with self.subTest(relative_path=relative_path):
                decision = self.decision(
                    "update",
                    changes=[
                        {
                            "path": relative_path,
                            "expected_sha256": None,
                            "content": "# forbidden\n",
                            "reason": "Must be rejected.",
                        }
                    ],
                )
                with self.assertRaises(HarnessError):
                    self.apply(decision)

    def test_rejects_symlinked_target_without_touching_target(self) -> None:
        target = self.relative("current/state/index.md")
        outside = self.project_root / "outside.md"
        outside.write_text("OUTSIDE\n", encoding="utf-8")
        target.unlink()
        target.symlink_to(outside)
        decision = self.decision(
            "update",
            changes=[
                {
                    "path": "current/state/index.md",
                    "expected_sha256": self.digest(outside),
                    "content": "# changed\n",
                    "reason": "Must not follow a symlink.",
                }
            ],
        )

        with self.assertRaisesRegex(HarnessError, "symlink"):
            self.apply(decision)

        self.assertEqual(outside.read_text(encoding="utf-8"), "OUTSIDE\n")

    def test_rejects_stale_existing_preimage(self) -> None:
        target = self.relative("current/state/index.md")
        expected = self.digest(target)
        target.write_text("# concurrent change\n", encoding="utf-8")
        decision = self.decision(
            "update",
            changes=[
                {
                    "path": "current/state/index.md",
                    "expected_sha256": expected,
                    "content": "# proposed change\n",
                    "reason": "A stale proposal must not overwrite.",
                }
            ],
        )

        with self.assertRaisesRegex(HarnessError, "stale"):
            self.apply(decision)

        self.assertEqual(
            target.read_text(encoding="utf-8"), "# concurrent change\n"
        )

    def test_creates_only_new_direct_dated_record_with_null_preimage(self) -> None:
        relative_path = "records/2026-08-19-01-first-maintain-result.md"
        records_index = self.relative("records/README.md")
        records_index.write_text(
            "# Records\n\n## 사람이 읽는 기록\n",
            encoding="utf-8",
        )
        new_record = {
            "path": relative_path,
            "expected_sha256": None,
            "content": "# First Maintain result\n\nDurable analysis.\n",
            "reason": "Preserve reusable analysis.",
        }
        with self.assertRaisesRegex(
            HarnessError, "requires.*records/README.md"
        ):
            self.apply(self.decision("update", changes=[new_record]))

        decision = self.decision(
            "update",
            importance="important",
            changes=[
                new_record,
                {
                    "path": "records/README.md",
                    "expected_sha256": self.digest(records_index),
                    "content": (
                        "# Records\n\n"
                        "## 사람이 읽는 기록\n\n"
                        "- [`2026-08-19-01-first-maintain-result.md`]"
                        "(2026-08-19-01-first-maintain-result.md)\n"
                    ),
                    "reason": "Keep the records entry point complete.",
                },
            ],
        )

        result = self.apply(decision)

        self.assertEqual(result["context_status"], "updated")
        self.assertEqual(
            self.relative(relative_path).read_text(encoding="utf-8"),
            decision["changes"][0]["content"],
        )
        self.assertIn(
            "(2026-08-19-01-first-maintain-result.md)",
            records_index.read_text(encoding="utf-8"),
        )

        existing = copy.deepcopy(decision)
        existing["changes"][0]["expected_sha256"] = self.digest(
            self.relative(relative_path)
        )
        with self.assertRaisesRegex(HarnessError, "append-only"):
            self.apply(existing)

    def test_new_file_requires_null_and_existing_file_requires_digest(self) -> None:
        new_memory = self.decision(
            "update",
            changes=[
                {
                    "path": "current/memory/04-new.md",
                    "expected_sha256": "0" * 64,
                    "content": "# New memory\n",
                    "reason": "New durable constraint.",
                }
            ],
        )
        with self.assertRaisesRegex(HarnessError, "must be null"):
            self.apply(new_memory)

        existing = self.decision(
            "update",
            changes=[
                {
                    "path": "source/index.md",
                    "expected_sha256": None,
                    "content": "# Source index\n",
                    "reason": "Update provenance.",
                }
            ],
        )
        with self.assertRaisesRegex(HarnessError, "is required"):
            self.apply(existing)

    def test_new_memory_topic_requires_linked_memory_index_update(self) -> None:
        new_topic = {
            "path": "current/memory/04-new.md",
            "expected_sha256": None,
            "content": "# New memory\n\nDurable constraint.\n",
            "reason": "Preserve a new durable constraint.",
        }
        with self.assertRaisesRegex(
            HarnessError, "requires.*current/memory/index.md"
        ):
            self.apply(self.decision("update", changes=[new_topic]))

        memory_index = self.relative("current/memory/index.md")
        index_content = memory_index.read_text(encoding="utf-8")
        decision = self.decision(
            "update",
            changes=[
                new_topic,
                {
                    "path": "current/memory/index.md",
                    "expected_sha256": self.digest(memory_index),
                    "content": (
                        index_content
                        + "\n- [`04-new.md`](04-new.md): New durable constraint.\n"
                    ),
                    "reason": "Keep the memory entry map complete.",
                },
            ],
        )

        result = self.apply(decision)

        self.assertEqual(result["context_status"], "updated")
        self.assertEqual(
            self.relative("current/memory/04-new.md").read_text(
                encoding="utf-8"
            ),
            new_topic["content"],
        )
        self.assertIn("(04-new.md)", memory_index.read_text(encoding="utf-8"))

    def test_rejects_invalid_record_name_and_markdown_quality(self) -> None:
        invalid_records = (
            "records/2026-02-30-01-impossible.md",
            "records/2026-08-19-00-zero.md",
            "records/2026-08-19-01.md",
            "records/note.md",
        )
        for path in invalid_records:
            with self.subTest(path=path):
                with self.assertRaises(HarnessError):
                    self.apply(
                        self.decision(
                            "update",
                            changes=[
                                {
                                    "path": path,
                                    "expected_sha256": None,
                                    "content": "# record\n",
                                    "reason": "Invalid name.",
                                }
                            ],
                        )
                    )

        target = self.relative("output/index.md")
        for content in (
            "# Missing EOF newline",
            "# Trailing whitespace \n",
            "# Broken link\n\n[missing](missing.md)\n",
        ):
            with self.subTest(content=content):
                with self.assertRaises(HarnessError):
                    self.apply(
                        self.decision(
                            "update",
                            changes=[
                                {
                                    "path": "output/index.md",
                                    "expected_sha256": self.digest(target),
                                    "content": content,
                                    "reason": "Invalid Markdown.",
                                }
                            ],
                        )
                    )

    def test_decision_schema_and_outcome_combinations_are_exact(self) -> None:
        valid_no_change = self.decision("no_change")
        validated = validate_maintain_decision(
            valid_no_change, "001-example"
        )
        self.assertEqual(validated["outcome"], "no_change")

        cases: list[dict[str, object]] = []
        extra = copy.deepcopy(valid_no_change)
        extra["extra"] = True
        cases.append(extra)
        wrong_workspace = copy.deepcopy(valid_no_change)
        wrong_workspace["workspace_id"] = "002-other"
        cases.append(wrong_workspace)
        wrong_no_change = copy.deepcopy(valid_no_change)
        wrong_no_change["importance"] = "quiet"
        cases.append(wrong_no_change)
        empty_update = self.decision("update")
        cases.append(empty_update)
        ambiguous_write = self.decision(
            "needs_user_decision",
            question="Choose one?",
            changes=[
                {
                    "path": "source/index.md",
                    "expected_sha256": None,
                    "content": "# forbidden\n",
                    "reason": "Ambiguity cannot write.",
                }
            ],
        )
        cases.append(ambiguous_write)

        for decision in cases:
            with self.subTest(decision=decision):
                with self.assertRaises(HarnessError):
                    validate_maintain_decision(decision, "001-example")
