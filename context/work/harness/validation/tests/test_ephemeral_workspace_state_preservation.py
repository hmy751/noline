"""Validate the Recover/Verify cycle without mutating product state."""

from __future__ import annotations

import json

from context.work.harness.testing import HARNESS_SOURCE, WorkspaceFixture


class EphemeralWorkspaceStatePreservationTests(WorkspaceFixture):
    def _checked_in_workspace_machine_state(self) -> dict[str, bytes]:
        """Snapshot active product status/receipts without writing to them."""
        reference_work_root = HARNESS_SOURCE.parent
        index = json.loads(
            (reference_work_root / "workspaces" / "index.json").read_text(
                encoding="utf-8"
            )
        )
        workspace_root = (
            reference_work_root
            / "workspaces"
            / index["active_workspace_id"]
        )
        machine_paths = [workspace_root / "current" / "state" / "status.json"]
        receipts_root = workspace_root / "records" / "receipts"
        if receipts_root.is_dir():
            machine_paths.extend(
                path for path in receipts_root.rglob("*") if path.is_file()
            )
        return {
            str(path.relative_to(reference_work_root)): path.read_bytes()
            for path in sorted(machine_paths)
        }

    def test_ephemeral_cycle_preserves_checked_in_machine_state(self) -> None:
        checked_in_before = self._checked_in_workspace_machine_state()
        initial_status = self.read_status()

        first_recover = self.run_cli("recover", "001-example", "--json")
        self.assertEqual(
            first_recover.returncode,
            0,
            first_recover.stdout + first_recover.stderr,
        )
        first_packet = json.loads(first_recover.stdout)
        self.assertEqual(first_packet["workspace_id"], "001-example")
        self.assertEqual(
            first_packet["state"]["status"]["value"], initial_status
        )

        (self.project_root / "src" / "value.txt").write_text(
            "expected\n", encoding="utf-8"
        )
        verify = self.run_cli("verify", "001-example")
        self.assertEqual(verify.returncode, 0, verify.stdout + verify.stderr)
        receipt_files = self.receipt_files()
        self.assertEqual(len(receipt_files), 1)
        self.assertTrue(receipt_files[0].is_relative_to(self.project_root))

        second_recover = self.run_cli("recover", "001-example", "--json")
        self.assertEqual(
            second_recover.returncode,
            0,
            second_recover.stdout + second_recover.stderr,
        )
        second_packet = json.loads(second_recover.stdout)
        status = self.read_status()
        self.assertEqual(status["status"], "verification_passed")
        self.assertEqual(status["result"], "pass")
        self.assertEqual(
            second_packet["state"]["status"]["value"], status
        )
        self.assertIn(
            {"path_base": "work_root", "path": status["receipt"]},
            second_packet["control_paths"],
        )
        self.assertEqual(
            self._checked_in_workspace_machine_state(), checked_in_before
        )


if __name__ == "__main__":
    import unittest

    unittest.main()
