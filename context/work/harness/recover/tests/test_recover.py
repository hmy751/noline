from __future__ import annotations

import copy
import hashlib
import json

from context.work.harness.testing import WorkspaceFixture


class RecoverTests(WorkspaceFixture):
    def project_snapshot(self, relative_path: str) -> dict[str, object]:
        content = (self.project_root / relative_path).read_bytes()
        return {
            "path": relative_path,
            "sha256": hashlib.sha256(content).hexdigest(),
            "size": len(content),
        }

    def snapshot_sha256(
        self,
        canonical_basis_files: list[dict[str, object]],
        evidence_files: list[dict[str, object]],
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

    def test_loads_current_output_map_and_project_context_only(self) -> None:
        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        packet = json.loads(completed.stdout)
        self.assertEqual(packet["schema_version"], 6)
        self.assertEqual(packet["workspace_id"], "001-example")
        self.assertEqual(
            packet["workspace"],
            {"path_base": "work_root", "path": "workspaces/001-example"},
        )
        self.assertEqual(
            packet["recover_contract"],
            {
                "path_base": "work_root",
                "path": "workspaces/001-example/recover.json",
            },
        )
        self.assertEqual(
            packet["control_paths"],
            [
                {"path_base": "work_root", "path": "workspaces/index.json"},
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/workspace.json",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/recover.json",
                },
            ],
        )
        self.assertEqual(
            packet["loaded_context_paths"],
            [
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/index.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/spec/01-problem-goal-scope.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/spec/02-behavior-and-cases.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/spec/03-concepts-and-contracts.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/spec/04-quality-and-completion.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/spec/05-constraints-design-assumptions.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/project-context.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/memory/tickets/index.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/state/index.md",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/current/state/status.json",
                },
                {
                    "path_base": "work_root",
                    "path": "workspaces/001-example/output/index.md",
                },
                {
                    "path_base": "project_root",
                    "path": "context/project/README.md",
                },
                {
                    "path_base": "project_root",
                    "path": "context/project/common/task-context.md",
                },
                {
                    "path_base": "project_root",
                    "path": "context/project/current/task-state.md",
                },
            ],
        )
        self.assertEqual(
            packet["memory"]["index"],
            {
                "path": "workspaces/001-example/current/memory/index.md",
                "path_base": "work_root",
                "content": "WORKSPACE_MEMORY_INDEX\n",
            },
        )
        self.assertEqual(
            packet["memory"]["entries"],
            [
                {
                    "path": "workspaces/001-example/current/memory/spec/01-problem-goal-scope.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_SPEC_GOAL\n',
                },
                {
                    "path": "workspaces/001-example/current/memory/spec/02-behavior-and-cases.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_SPEC_BEHAVIOR\n',
                },
                {
                    "path": "workspaces/001-example/current/memory/spec/03-concepts-and-contracts.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_SPEC_CONTRACTS\n',
                },
                {
                    "path": "workspaces/001-example/current/memory/spec/04-quality-and-completion.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_SPEC_QUALITY\n',
                },
                {
                    "path": "workspaces/001-example/current/memory/spec/05-constraints-design-assumptions.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_SPEC_DESIGN\n',
                },
                {
                    "path": "workspaces/001-example/current/memory/project-context.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_MEMORY_PROJECT_CONTEXT\n',
                },
                {
                    "path": "workspaces/001-example/current/memory/tickets/index.md",
                    "path_base": "work_root",
                    "content": 'WORKSPACE_TICKET_INDEX\n\n- [Example](001-example.md)\n',
                },
            ],
        )
        self.assertEqual(
            packet["state"]["index"]["content"],
            "# state\n\nhuman-owned current description\n",
        )
        self.assertEqual(
            packet["state"]["status"]["value"], self.initial_status()
        )
        self.assertEqual(
            packet["output"]["index"],
            {
                "path": "workspaces/001-example/output/index.md",
                "path_base": "work_root",
                "content": (
                    "WORKSPACE_OUTPUT_INDEX\n\n"
                    "- [analysis](analysis.md)\n"
                ),
            },
        )
        self.assertEqual(
            [entry["path"] for entry in packet["project_context"]],
            [
                "context/project/README.md",
                "context/project/common/task-context.md",
                "context/project/current/task-state.md",
            ],
        )
        self.assertEqual(
            {entry["path_base"] for entry in packet["project_context"]},
            {"project_root"},
        )
        self.assertNotIn("verification", packet)
        self.assertNotIn("verify.json", completed.stdout)
        self.assertIn("PROJECT_ROUTING_CONTEXT", completed.stdout)
        self.assertIn("PROJECT_COMMON_CONTEXT", completed.stdout)
        self.assertIn("PROJECT_CURRENT_CONTEXT", completed.stdout)
        self.assertNotIn("PROJECT_COMMON_ROUTING", completed.stdout)
        self.assertNotIn("PROJECT_CURRENT_ROUTING", completed.stdout)
        self.assertNotIn("UNSELECTED_PROJECT_GUIDANCE", completed.stdout)
        self.assertNotIn("UNSELECTED_PROJECT_DECISIONS_ROUTING", completed.stdout)
        self.assertNotIn("UNLOADED_RECORD_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_RECORD_MARKDOWN_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_SOURCE_INVENTORY_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_SOURCE_RAW_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_OUTPUT_ARTIFACT_SECRET", completed.stdout)
        self.assertFalse(
            any(
                entry["path"].startswith("workspaces/001-example/source/")
                for entry in (
                    packet["control_paths"] + packet["loaded_context_paths"]
                )
            )
        )
        self.assertNotIn("UNLOADED_MEMORY_NON_MARKDOWN_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_NESTED_MEMORY_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_TICKET_BODY", completed.stdout)

    def test_explicit_workspace_does_not_require_or_read_active_index(
        self,
    ) -> None:
        index_path = self.work_root / "workspaces" / "index.json"
        index_path.write_text("{not-json\n", encoding="utf-8")

        malformed = self.run_cli("recover", "001-example", "--json")

        self.assertEqual(malformed.returncode, 0, malformed.stderr)
        packet = json.loads(malformed.stdout)
        self.assertNotIn(
            {"path_base": "work_root", "path": "workspaces/index.json"},
            packet["control_paths"],
        )

        index_path.unlink()
        missing = self.run_cli("recover", "001-example", "--json")

        self.assertEqual(missing.returncode, 0, missing.stderr)
        packet = json.loads(missing.stdout)
        self.assertEqual(packet["workspace_id"], "001-example")
        self.assertNotIn("workspaces/index.json", missing.stdout)

    def test_active_workspace_fallback_still_validates_index(self) -> None:
        index_path = self.work_root / "workspaces" / "index.json"
        index_path.write_text("{not-json\n", encoding="utf-8")

        malformed = self.run_cli("recover")

        self.assertEqual(malformed.returncode, 2)
        self.assertIn("Workspace index is not valid JSON", malformed.stderr)

    def test_requires_workspace_output_index(self) -> None:
        output_index = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "output"
            / "index.md"
        )
        content = output_index.read_text(encoding="utf-8")
        output_index.unlink()
        try:
            completed = self.run_cli("recover")
        finally:
            output_index.write_text(content, encoding="utf-8")

        self.assertEqual(completed.returncode, 2)
        self.assertIn("Workspace output index does not exist", completed.stderr)

    def test_does_not_require_or_inspect_workspace_output_artifacts(self) -> None:
        artifact = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "output"
            / "analysis.md"
        )
        content = artifact.read_text(encoding="utf-8")
        artifact.unlink()
        try:
            completed = self.run_cli("recover", "--json")
        finally:
            artifact.write_text(content, encoding="utf-8")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("[analysis](analysis.md)", completed.stdout)
        self.assertNotIn("UNLOADED_OUTPUT_ARTIFACT_SECRET", completed.stdout)

    def test_rejects_symlinked_workspace_output_index(self) -> None:
        output_index = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "output"
            / "index.md"
        )
        content = output_index.read_text(encoding="utf-8")
        outside = self.project_root / "output-index.md"
        outside.write_text(
            "LINKED_OUTPUT_INDEX_MUST_NOT_LOAD\n", encoding="utf-8"
        )
        output_index.unlink()
        output_index.symlink_to(outside)
        try:
            completed = self.run_cli("recover")
        finally:
            output_index.unlink()
            output_index.write_text(content, encoding="utf-8")

        self.assertEqual(completed.returncode, 2)
        self.assertIn("symlink", completed.stderr)
        self.assertNotIn("LINKED_OUTPUT_INDEX_MUST_NOT_LOAD", completed.stdout)

    def test_rejects_non_regular_workspace_output_index(self) -> None:
        output_index = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "output"
            / "index.md"
        )
        content = output_index.read_text(encoding="utf-8")
        output_index.unlink()
        output_index.mkdir()
        try:
            completed = self.run_cli("recover")
        finally:
            output_index.rmdir()
            output_index.write_text(content, encoding="utf-8")

        self.assertEqual(completed.returncode, 2)
        self.assertIn("must be a regular file", completed.stderr)

    def test_requires_minimum_memory_files(self) -> None:
        memory = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "memory"
        )

        for required_name in (
            'spec/01-problem-goal-scope.md',
            'spec/02-behavior-and-cases.md',
            'spec/03-concepts-and-contracts.md',
            'spec/04-quality-and-completion.md',
            'spec/05-constraints-design-assumptions.md',
            'project-context.md',
            'tickets/index.md',
        ):
            with self.subTest(required_name=required_name):
                required_path = memory / required_name
                content = required_path.read_text(encoding="utf-8")
                required_path.unlink()
                try:
                    completed = self.run_cli("recover")
                    self.assertEqual(completed.returncode, 2)
                    self.assertIn("missing required files", completed.stderr)
                    self.assertIn(required_name, completed.stderr)
                finally:
                    required_path.write_text(content, encoding="utf-8")

    def test_spec_and_ticket_entry_points_reject_symlinks(self) -> None:
        memory = self.work_root / "workspaces/001-example/current/memory"
        for relative in (
            "spec", "tickets", "spec/03-concepts-and-contracts.md",
            "tickets/index.md",
        ):
            with self.subTest(relative=relative):
                target = memory / relative
                moved = target.with_name(target.name + "-original")
                target.rename(moved)
                target.symlink_to(moved, target_is_directory=moved.is_dir())
                try:
                    completed = self.run_cli("recover", "--json")
                    self.assertEqual(completed.returncode, 2)
                    self.assertIn("symlink", completed.stderr)
                finally:
                    target.unlink()
                    moved.rename(target)

    def test_ticket_body_is_selected_later_and_not_required_by_packet(self) -> None:
        body = self.work_root / (
            "workspaces/001-example/current/memory/tickets/001-example.md"
        )
        body.unlink()
        completed = self.run_cli("recover", "--json")
        self.assertEqual(completed.returncode, 0, completed.stderr)
        packet = json.loads(completed.stdout)
        self.assertIn("001-example.md", packet["memory"]["entries"][-1]["content"])
        self.assertNotIn(
            body.relative_to(self.work_root).as_posix(),
            [entry["path"] for entry in packet["loaded_context_paths"]],
        )

    def test_does_not_require_or_inspect_workspace_source(self) -> None:
        source = (
            self.work_root / "workspaces" / "001-example" / "source"
        )
        unavailable_source = source.with_name("source-unavailable")
        source.rename(unavailable_source)
        try:
            completed = self.run_cli("recover", "--json")
        finally:
            unavailable_source.rename(source)

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertNotIn("UNLOADED_SOURCE_INVENTORY_SECRET", completed.stdout)
        self.assertNotIn("UNLOADED_SOURCE_RAW_SECRET", completed.stdout)

    def test_succeeds_when_verify_contract_is_invalid(self) -> None:
        (
            self.work_root / "workspaces" / "001-example" / "verify.json"
        ).write_text(
            '{"verification": "INVALID_VERIFY_CONTRACT_SECRET"\n',
            encoding="utf-8",
        )

        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertNotIn("INVALID_VERIFY_CONTRACT_SECRET", completed.stdout)

    def test_module_help_exposes_recover_maintain_and_verify(self) -> None:
        completed = self.run_cli("--help")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("{recover,maintain,verify}", completed.stdout)
        self.assertIn("recover", completed.stdout)
        self.assertIn("maintain", completed.stdout)
        self.assertIn("verify", completed.stdout)

    def test_keeps_workspace_and_project_context_path_bases_separate(self) -> None:
        decoy_workspaces = self.project_root / "workspaces"
        decoy_workspaces.mkdir()
        (decoy_workspaces / "index.json").write_text(
            '{"invalid": "PROJECT_ROOT_WORKSPACE_DECOY"}\n',
            encoding="utf-8",
        )
        decoy_project_context = self.work_root / "context" / "project"
        decoy_project_context.mkdir(parents=True)
        (decoy_project_context / "README.md").write_text(
            "WORK_ROOT_PROJECT_CONTEXT_DECOY\n", encoding="utf-8"
        )

        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("PROJECT_ROUTING_CONTEXT", completed.stdout)
        self.assertIn("PROJECT_COMMON_CONTEXT", completed.stdout)
        self.assertIn("PROJECT_CURRENT_CONTEXT", completed.stdout)
        self.assertNotIn("PROJECT_ROOT_WORKSPACE_DECOY", completed.stdout)
        self.assertNotIn("WORK_ROOT_PROJECT_CONTEXT_DECOY", completed.stdout)

    def test_plain_output_renders_state_without_verify_configuration(self) -> None:
        completed = self.run_cli("recover")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("## state/status.json", completed.stdout)
        self.assertIn("- status: ready_for_verification", completed.stdout)
        self.assertIn("- result: null", completed.stdout)
        self.assertIn("- finished_at: null", completed.stdout)
        self.assertIn("- receipt: null", completed.stdout)
        self.assertNotIn("- next_action:", completed.stdout)
        self.assertIn("- receipt_freshness: not_applicable", completed.stdout)
        self.assertIn("## output/index.md", completed.stdout)
        self.assertIn("WORKSPACE_OUTPUT_INDEX", completed.stdout)
        self.assertNotIn("UNLOADED_OUTPUT_ARTIFACT_SECRET", completed.stdout)
        self.assertNotIn('"status": "ready_for_verification"', completed.stdout)
        self.assertNotIn("Fixed verification argv", completed.stdout)

    def test_plain_output_preserves_legacy_next_action(
        self,
    ) -> None:
        legacy_status = {
            "schema_version": 2,
            "workspace_id": "001-example",
            "status": "ready_for_verification",
            "result": None,
            "receipt": None,
            "finished_at": None,
            "next_action": "고정 검증을 실행한다.",
        }
        self.write_status(legacy_status)

        completed = self.run_cli("recover")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("- status: ready_for_verification", completed.stdout)
        self.assertIn("- next_action: 고정 검증을 실행한다.", completed.stdout)

    def test_rejects_recover_contract_traversal_absolute_schema_and_id(self) -> None:
        invalid_contracts: list[tuple[dict[str, object], str]] = []

        traversal = copy.deepcopy(self.recover_contract)
        traversal["project_context"][0]["path"] = "../outside.md"
        invalid_contracts.append((traversal, "traverse"))

        absolute = copy.deepcopy(self.recover_contract)
        absolute["project_context"][0]["path"] = "/tmp/outside.md"
        invalid_contracts.append((absolute, "relative"))

        legacy_schema = copy.deepcopy(self.recover_contract)
        legacy_schema["schema_version"] = 1
        invalid_contracts.append((legacy_schema, "schema_version"))

        previous_reference_schema = copy.deepcopy(self.recover_contract)
        previous_reference_schema["schema_version"] = 2
        invalid_contracts.append(
            (previous_reference_schema, "schema_version")
        )

        previous_target_schema = copy.deepcopy(self.recover_contract)
        previous_target_schema["schema_version"] = 3
        invalid_contracts.append((previous_target_schema, "schema_version"))

        previous_overview_anchor_schema = copy.deepcopy(self.recover_contract)
        previous_overview_anchor_schema["schema_version"] = 4
        invalid_contracts.append(
            (previous_overview_anchor_schema, "schema_version")
        )

        previous_flat_path_schema = copy.deepcopy(self.recover_contract)
        previous_flat_path_schema["schema_version"] = 5
        invalid_contracts.append(
            (previous_flat_path_schema, "schema_version")
        )

        wrong_id = copy.deepcopy(self.recover_contract)
        wrong_id["workspace_id"] = "002-other"
        invalid_contracts.append((wrong_id, "does not match"))

        for invalid_contract, expected_error in invalid_contracts:
            with self.subTest(expected_error=expected_error):
                self.write_work_json(
                    "workspaces/001-example/recover.json", invalid_contract
                )
                completed = self.run_cli("recover")
                self.assertEqual(completed.returncode, 2)
                self.assertIn(expected_error, completed.stderr)

    def test_rejects_project_context_outside_boundary_and_symlinks(self) -> None:
        outside_context = copy.deepcopy(self.recover_contract)
        outside_context["project_context"][0]["path"] = "src/value.txt"
        self.write_work_json(
            "workspaces/001-example/recover.json", outside_context
        )

        lexical_outside = self.run_cli("recover")
        self.assertEqual(lexical_outside.returncode, 2)
        self.assertIn("selected from context/project", lexical_outside.stderr)

        record_path = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "records"
            / "old.json"
        )
        link_path = (
            self.project_root
            / "context"
            / "project"
            / "common"
            / "record-link.md"
        )
        link_path.symlink_to(record_path)
        linked_record = copy.deepcopy(self.recover_contract)
        linked_record["project_context"][0]["path"] = (
            "context/project/common/record-link.md"
        )
        self.write_work_json(
            "workspaces/001-example/recover.json", linked_record
        )

        linked = self.run_cli("recover")
        self.assertEqual(linked.returncode, 2)
        self.assertIn("symlink", linked.stderr)
        self.assertNotIn("UNLOADED_RECORD_SECRET", linked.stdout)

    def test_requires_each_selected_project_context_file_to_exist(self) -> None:
        task_context = (
            self.project_root
            / "context"
            / "project"
            / "common"
            / "task-context.md"
        )
        content = task_context.read_text(encoding="utf-8")
        task_context.unlink()
        try:
            missing = self.run_cli("recover")
        finally:
            task_context.write_text(content, encoding="utf-8")

        self.assertEqual(missing.returncode, 2)
        self.assertIn("does not exist", missing.stderr)

    def test_does_not_auto_load_unselected_project_layers(self) -> None:
        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertIn("PROJECT_ROUTING_CONTEXT", completed.stdout)
        self.assertIn("PROJECT_COMMON_CONTEXT", completed.stdout)
        self.assertIn("PROJECT_CURRENT_CONTEXT", completed.stdout)
        self.assertNotIn("UNSELECTED_PROJECT_GUIDANCE", completed.stdout)
        self.assertNotIn("UNSELECTED_PROJECT_DECISIONS_ROUTING", completed.stdout)

    def test_preserves_selected_project_context_order(self) -> None:
        readme_second = copy.deepcopy(self.recover_contract)
        readme_second["project_context"] = [
            readme_second["project_context"][2],
            readme_second["project_context"][0],
            readme_second["project_context"][1],
        ]
        self.write_work_json(
            "workspaces/001-example/recover.json", readme_second
        )

        misplaced = self.run_cli("recover", "--json")

        self.assertEqual(misplaced.returncode, 0, misplaced.stderr)
        packet = json.loads(misplaced.stdout)
        self.assertEqual(
            [entry["path"] for entry in packet["project_context"]],
            [
                "context/project/current/task-state.md",
                "context/project/README.md",
                "context/project/common/task-context.md",
            ],
        )

    def test_requires_project_readme_selection_but_not_first(self) -> None:
        without_readme = copy.deepcopy(self.recover_contract)
        without_readme["project_context"] = without_readme[
            "project_context"
        ][1:]
        self.write_work_json(
            "workspaces/001-example/recover.json", without_readme
        )

        rejected = self.run_cli("recover", "--json")

        self.assertEqual(rejected.returncode, 2)
        self.assertIn(
            "must select context/project/README.md", rejected.stderr
        )
        self.assertNotIn("PROJECT_COMMON_CONTEXT", rejected.stdout)

    def test_accepts_nested_markdown_from_each_project_layer(self) -> None:
        project_context_root = self.project_root / "context" / "project"
        entries = [self.recover_contract["project_context"][0]]
        for layer in ("common", "current", "guidance", "decisions"):
            nested = project_context_root / layer / "nested"
            nested.mkdir()
            path = f"context/project/{layer}/nested/context.md"
            (nested / "context.md").write_text(
                f"SELECTED_{layer.upper()}_NESTED_CONTEXT\n",
                encoding="utf-8",
            )
            entries.append(
                {"path": path, "reason": f"{layer} layer 선택 검증"}
            )
        contract = copy.deepcopy(self.recover_contract)
        contract["project_context"] = entries
        self.write_work_json(
            "workspaces/001-example/recover.json", contract
        )

        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        packet = json.loads(completed.stdout)
        self.assertEqual(
            [entry["path"] for entry in packet["project_context"]],
            [entry["path"] for entry in entries],
        )

    def test_rejects_root_flat_and_unknown_project_context_layers(self) -> None:
        project_context_root = self.project_root / "context" / "project"
        (project_context_root / "legacy-flat.md").write_text(
            "ROOT_FLAT_PROJECT_CONTEXT_MUST_NOT_LOAD\n", encoding="utf-8"
        )
        (project_context_root / "unknown").mkdir()
        (project_context_root / "unknown" / "context.md").write_text(
            "UNKNOWN_LAYER_PROJECT_CONTEXT_MUST_NOT_LOAD\n", encoding="utf-8"
        )

        invalid_paths = (
            "context/project/legacy-flat.md",
            "context/project/unknown/context.md",
        )
        for invalid_path in invalid_paths:
            with self.subTest(path=invalid_path):
                contract = copy.deepcopy(self.recover_contract)
                contract["project_context"][1]["path"] = invalid_path
                self.write_work_json(
                    "workspaces/001-example/recover.json", contract
                )

                completed = self.run_cli("recover", "--json")

                self.assertEqual(completed.returncode, 2)
                self.assertIn("common/, current/, guidance/", completed.stderr)
                self.assertNotIn("MUST_NOT_LOAD", completed.stdout)

    def test_rejects_non_markdown_project_context(self) -> None:
        non_markdown = (
            self.project_root
            / "context"
            / "project"
            / "common"
            / "selected.txt"
        )
        non_markdown.write_text(
            "NON_MARKDOWN_PROJECT_CONTEXT_MUST_NOT_LOAD\n",
            encoding="utf-8",
        )
        contract = copy.deepcopy(self.recover_contract)
        contract["project_context"][0]["path"] = (
            "context/project/common/selected.txt"
        )
        self.write_work_json(
            "workspaces/001-example/recover.json", contract
        )

        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 2)
        self.assertIn("must be a .md file", completed.stderr)
        self.assertNotIn(
            "NON_MARKDOWN_PROJECT_CONTEXT_MUST_NOT_LOAD",
            completed.stdout,
        )

    def test_rejects_workspace_identity_extra_responsibility(self) -> None:
        identity = copy.deepcopy(self.identity)
        identity["project_context"] = []
        self.write_work_json(
            "workspaces/001-example/workspace.json", identity
        )

        completed = self.run_cli("recover")

        self.assertEqual(completed.returncode, 2)
        self.assertIn("Workspace identity keys", completed.stderr)
        self.assertIn("extra", completed.stderr)

    def test_rejects_invalid_state_status(self) -> None:
        legacy_schema = self.initial_status()
        legacy_schema["schema_version"] = 1
        self.write_status(legacy_schema)

        completed = self.run_cli("recover")
        self.assertEqual(completed.returncode, 2)
        self.assertIn("schema_version", completed.stderr)

        inconsistent = self.initial_status()
        inconsistent["status"] = "verification_passed"
        self.write_status(inconsistent)

        completed = self.run_cli("recover")
        self.assertEqual(completed.returncode, 2)
        self.assertIn("inconsistent", completed.stderr)

        wrong_type = self.initial_status()
        wrong_type["status"] = ["ready_for_verification"]
        self.write_status(wrong_type)

        completed = self.run_cli("recover")
        self.assertEqual(completed.returncode, 2)
        self.assertIn("invalid Workspace state status", completed.stderr)

        legacy_with_current_status = {
            "schema_version": 2,
            "workspace_id": "001-example",
            "status": "verification_passed",
            "result": "pass",
            "receipt": "workspaces/001-example/records/verify-existing.json",
            "finished_at": "2026-08-13T00:00:00.000Z",
            "next_action": "receipt를 검토한다.",
        }
        self.write_status(legacy_with_current_status)

        completed = self.run_cli("recover")
        self.assertEqual(completed.returncode, 2)
        self.assertIn("invalid Workspace state status", completed.stderr)

        current_with_legacy_key = {
            "schema_version": 3,
            "workspace_id": "001-example",
            "status": "ready_for_verification",
            "result": None,
            "receipt": None,
            "finished_at": None,
            "next_action": "v3에는 이 필드가 없다.",
        }
        self.write_status(current_with_legacy_key)

        completed = self.run_cli("recover")
        self.assertEqual(completed.returncode, 2)
        self.assertIn("extra=['next_action']", completed.stderr)

    def test_rejects_missing_malformed_and_symlinked_status(self) -> None:
        status_path = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "state"
            / "status.json"
        )
        status_path.unlink()

        missing = self.run_cli("recover")
        self.assertEqual(missing.returncode, 2)
        self.assertIn("does not exist", missing.stderr)

        status_path.write_text("{not-json\n", encoding="utf-8")
        malformed = self.run_cli("recover")
        self.assertEqual(malformed.returncode, 2)
        self.assertIn("not valid JSON", malformed.stderr)

        status_path.unlink()
        outside_status = (
            self.project_root / "context" / "project" / "status.json"
        )
        outside_status.write_text(
            json.dumps(self.initial_status()), encoding="utf-8"
        )
        status_path.symlink_to(outside_status)
        linked = self.run_cli("recover")
        self.assertEqual(linked.returncode, 2)
        self.assertIn("symlink", linked.stderr)

    def test_rejects_symlinked_memory_topic_and_current_directories(self) -> None:
        source = (
            self.project_root / "context" / "project" / "linked-memory.md"
        )
        source.write_text("LINKED_MEMORY_MUST_NOT_LOAD\n", encoding="utf-8")
        link = (
            self.work_root
            / "workspaces"
            / "001-example"
            / "current"
            / "memory"
            / "03-linked.md"
        )
        link.symlink_to(source)

        completed = self.run_cli("recover")
        self.assertEqual(completed.returncode, 2)
        self.assertIn("symlink", completed.stderr)
        self.assertNotIn("LINKED_MEMORY_MUST_NOT_LOAD", completed.stdout)
        link.unlink()

        current = self.work_root / "workspaces" / "001-example" / "current"
        for directory_name in ("memory", "state"):
            with self.subTest(directory=directory_name):
                directory = current / directory_name
                real_directory = current / f"{directory_name}-real"
                directory.rename(real_directory)
                directory.symlink_to(real_directory, target_is_directory=True)
                try:
                    completed = self.run_cli("recover")
                    self.assertEqual(completed.returncode, 2)
                    self.assertIn("symlink", completed.stderr)
                finally:
                    directory.unlink()
                    real_directory.rename(directory)

    def test_validates_linked_receipt_header_without_exposing_body(self) -> None:
        receipt_relative = "workspaces/001-example/records/verify-existing.json"
        status = self.verified_status(receipt_relative)
        self.write_status(status)

        missing = self.run_cli("recover", "--json")
        self.assertEqual(missing.returncode, 2)
        self.assertIn("does not exist", missing.stderr)

        receipt = {
            "schema_version": 1,
            "workspace_id": "001-example",
            "result": "fail",
            "finished_at": status["finished_at"],
            "body_secret": "RECEIPT_BODY_MUST_NOT_ENTER_CONTEXT",
        }
        self.write_work_json(receipt_relative, receipt)
        mismatched = self.run_cli("recover", "--json")
        self.assertEqual(mismatched.returncode, 2)
        self.assertIn("result do not match", mismatched.stderr)

        receipt["result"] = "pass"
        receipt["finished_at"] = "2026-08-13T00:00:01.000Z"
        self.write_work_json(receipt_relative, receipt)
        wrong_time = self.run_cli("recover", "--json")
        self.assertEqual(wrong_time.returncode, 2)
        self.assertIn("finished_at do not match", wrong_time.stderr)

        receipt["finished_at"] = status["finished_at"]
        self.write_work_json(receipt_relative, receipt)
        recovered = self.run_cli("recover", "--json")
        self.assertEqual(recovered.returncode, 0, recovered.stderr)
        packet = json.loads(recovered.stdout)
        receipt_entry = {"path_base": "work_root", "path": receipt_relative}
        self.assertIn(receipt_entry, packet["control_paths"])
        self.assertNotIn(receipt_entry, packet["loaded_context_paths"])
        self.assertEqual(
            packet["state"]["status"]["receipt_freshness"]["status"],
            "unknown_legacy",
        )
        self.assertNotIn("RECEIPT_BODY_MUST_NOT_ENTER_CONTEXT", recovered.stdout)

    def test_accepts_nested_verify_receipt_path(self) -> None:
        receipt_relative = (
            "workspaces/001-example/records/receipts/verify/"
            "verify-existing.json"
        )
        status = self.verified_status(receipt_relative)
        self.write_work_json(
            receipt_relative,
            {
                "schema_version": 1,
                "workspace_id": "001-example",
                "result": "pass",
                "finished_at": status["finished_at"],
            },
        )
        self.write_status(status)

        recovered = self.run_cli("recover", "--json")

        self.assertEqual(recovered.returncode, 0, recovered.stderr)
        packet = json.loads(recovered.stdout)
        self.assertIn(
            {"path_base": "work_root", "path": receipt_relative},
            packet["control_paths"],
        )

    def test_rejects_non_verify_receipt_types_and_malformed_names(self) -> None:
        invalid_receipts = [
            (
                "workspaces/001-example/records/receipts/harness-tests/"
                "verify-harness.json"
            ),
            (
                "workspaces/001-example/records/receipts/preflight/"
                "verify-preflight.json"
            ),
            (
                "workspaces/001-example/records/receipts/other/"
                "verify-other.json"
            ),
            (
                "workspaces/001-example/records/receipts/verify/"
                "harness-result.json"
            ),
            (
                "workspaces/001-example/records/receipts/verify/"
                "verify-.json"
            ),
            (
                "workspaces/001-example/records/receipts/verify/"
                "verify-result.txt"
            ),
            (
                "workspaces/001-example/records/receipts/verify/archive/"
                "verify-result.json"
            ),
        ]
        receipt = {
            "schema_version": 1,
            "workspace_id": "001-example",
            "result": "pass",
            "finished_at": "2026-08-13T00:00:00.000Z",
        }

        for receipt_relative in invalid_receipts:
            with self.subTest(receipt=receipt_relative):
                receipt_path = self.work_root / receipt_relative
                receipt_path.parent.mkdir(parents=True, exist_ok=True)
                self.write_work_json(receipt_relative, receipt)
                self.write_status(self.verified_status(receipt_relative))

                completed = self.run_cli("recover", "--json")

                self.assertEqual(completed.returncode, 2)
                self.assertIn("product Verify receipt", completed.stderr)

    def test_accepts_current_status_and_receipt_schemas(self) -> None:
        receipt_relative = (
            "workspaces/001-example/records/receipts/verify/"
            "verify-current.json"
        )
        finished_at = "2026-08-14T00:00:00.000Z"
        canonical_basis_files = [
            self.project_snapshot("context/project/common/task-context.md")
        ]
        evidence_files = [self.project_snapshot("src/value.txt")]
        self.write_work_json(
            receipt_relative,
            {
                "schema_version": 2,
                "workspace_id": "001-example",
                "claim": "제품 값이 Project 기준과 일치한다.",
                "result": "pass",
                "finished_at": finished_at,
                "snapshot_sha256": self.snapshot_sha256(
                    canonical_basis_files, evidence_files
                ),
                "canonical_basis_files": canonical_basis_files,
                "evidence_files": evidence_files,
            },
        )
        self.write_status(
            {
                "schema_version": 3,
                "workspace_id": "001-example",
                "status": "verification_passed",
                "result": "pass",
                "receipt": receipt_relative,
                "finished_at": finished_at,
            }
        )

        completed = self.run_cli("recover", "--json")

        self.assertEqual(completed.returncode, 0, completed.stderr)
        packet = json.loads(completed.stdout)
        self.assertEqual(
            packet["state"]["status"]["value"]["status"],
            "verification_passed",
        )
        self.assertNotIn(
            "next_action", packet["state"]["status"]["value"]
        )
        self.assertEqual(
            packet["state"]["status"]["receipt_freshness"]["status"],
            "fresh",
        )

    def test_current_receipt_reports_changed_and_missing_files_as_stale(
        self,
    ) -> None:
        receipt_relative = (
            "workspaces/001-example/records/receipts/verify/"
            "verify-freshness.json"
        )
        finished_at = "2026-08-14T00:00:00.000Z"
        canonical_basis_files = [
            self.project_snapshot("context/project/common/task-context.md")
        ]
        evidence_files = [self.project_snapshot("src/value.txt")]
        receipt = {
            "schema_version": 2,
            "workspace_id": "001-example",
            "claim": "제품 값이 Project 기준과 일치한다.",
            "result": "pass",
            "finished_at": finished_at,
            "snapshot_sha256": self.snapshot_sha256(
                canonical_basis_files, evidence_files
            ),
            "canonical_basis_files": canonical_basis_files,
            "evidence_files": evidence_files,
        }
        self.write_work_json(receipt_relative, receipt)
        self.write_status(
            {
                "schema_version": 3,
                "workspace_id": "001-example",
                "status": "verification_passed",
                "result": "pass",
                "receipt": receipt_relative,
                "finished_at": finished_at,
            }
        )
        evidence = self.project_root / "src" / "value.txt"
        evidence.write_text("changed\n", encoding="utf-8")

        changed = self.run_cli("recover", "--json")

        self.assertEqual(changed.returncode, 0, changed.stderr)
        freshness = json.loads(changed.stdout)["state"]["status"][
            "receipt_freshness"
        ]
        self.assertEqual(freshness["status"], "stale")
        self.assertEqual(freshness["changed_file_count"], 1)
        self.assertEqual(freshness["missing_file_count"], 0)
        self.assertNotIn("src/value.txt", changed.stdout)

        evidence.unlink()
        missing = self.run_cli("recover", "--json")

        self.assertEqual(missing.returncode, 0, missing.stderr)
        freshness = json.loads(missing.stdout)["state"]["status"][
            "receipt_freshness"
        ]
        self.assertEqual(freshness["status"], "stale")
        self.assertEqual(freshness["changed_file_count"], 0)
        self.assertEqual(freshness["missing_file_count"], 1)

    def test_rejects_unsafe_current_receipt_snapshot_paths(self) -> None:
        receipt_relative = (
            "workspaces/001-example/records/receipts/verify/"
            "verify-unsafe-snapshot.json"
        )
        finished_at = "2026-08-14T00:00:00.000Z"
        canonical_basis_files = [
            self.project_snapshot("context/project/common/task-context.md")
        ]
        evidence_files = [self.project_snapshot("src/value.txt")]
        receipt = {
            "schema_version": 2,
            "workspace_id": "001-example",
            "claim": "제품 값이 Project 기준과 일치한다.",
            "result": "pass",
            "finished_at": finished_at,
            "snapshot_sha256": self.snapshot_sha256(
                canonical_basis_files, evidence_files
            ),
            "canonical_basis_files": canonical_basis_files,
            "evidence_files": evidence_files,
        }
        self.write_status(
            {
                "schema_version": 3,
                "workspace_id": "001-example",
                "status": "verification_passed",
                "result": "pass",
                "receipt": receipt_relative,
                "finished_at": finished_at,
            }
        )

        receipt["evidence_files"][0]["path"] = "../outside.txt"
        receipt["snapshot_sha256"] = self.snapshot_sha256(
            receipt["canonical_basis_files"], receipt["evidence_files"]
        )
        self.write_work_json(receipt_relative, receipt)
        traversal = self.run_cli("recover")
        self.assertEqual(traversal.returncode, 2)
        self.assertIn("traverse", traversal.stderr)

        linked_path = self.project_root / "src" / "linked-value.txt"
        linked_path.symlink_to(self.project_root / "src" / "value.txt")
        receipt["evidence_files"][0] = {
            **self.project_snapshot("src/value.txt"),
            "path": "src/linked-value.txt",
        }
        receipt["snapshot_sha256"] = self.snapshot_sha256(
            receipt["canonical_basis_files"], receipt["evidence_files"]
        )
        self.write_work_json(receipt_relative, receipt)
        symlink = self.run_cli("recover")
        self.assertEqual(symlink.returncode, 2)
        self.assertIn("symlink", symlink.stderr)

    def test_rejects_receipt_symlink(self) -> None:
        outside_receipt = (
            self.project_root / "context" / "project" / "receipt.json"
        )
        outside_receipt.write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "workspace_id": "001-example",
                    "result": "pass",
                    "finished_at": "2026-08-13T00:00:00.000Z",
                }
            ),
            encoding="utf-8",
        )
        receipt_relative = "workspaces/001-example/records/verify-linked.json"
        (self.work_root / receipt_relative).symlink_to(outside_receipt)
        self.write_status(self.verified_status(receipt_relative))

        completed = self.run_cli("recover")

        self.assertEqual(completed.returncode, 2)
        self.assertIn("symlink", completed.stderr)


if __name__ == "__main__":
    import unittest

    unittest.main()
