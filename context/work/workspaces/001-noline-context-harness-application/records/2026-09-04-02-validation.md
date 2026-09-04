# Context Harness application validation

## 확인한 사실

- Noline의 `scripts/check-harness.mjs`가 기존 bridge와 새 Context Harness entrypoint를 함께 검사해 통과했다.
- Claude lifecycle adapter의 unbound no-op·session selector·prompt/Stop pairing·subagent Main-only filtering·runtime symlink 거부 단위 test 5개가 통과했다.
- 최신 전체 Harness suite는 `python3 -m unittest discover -s context/work/harness -t . -p 'test_*.py' -v`로 113개를 실행했다. Claude adapter test 5개를 포함해 112개는 통과했고, inherited descendant-timeout test 1개만 timing failure로 남았다.
- bounded Recover는 `001-noline-context-harness-application`의 current memory·state·output과 선택한 Noline Project context 세 문서만 읽었다.
- `CODEX_SESSION_ID=noline-context-harness-unbound-check`의 wrapper `status`는 `unbound`를 반환했고 `.codex/maintain-runtime/`을 만들지 않았다.
- 최신 Verify는 `node scripts/check-harness.mjs`를 실행해 exit `0`을 기록했고 current machine status를 `verification_passed`로 갱신했다.
- `.claude/settings.json`은 SessionStart·UserPromptSubmit·Stop·SessionEnd를 Claude wrapper에 연결하며, 개인 `.claude/settings.local.json`의 기존 권한 규칙은 수정하지 않았다.

## Durable evidence

- [Harness test receipt](receipts/harness-tests/harness-test-20260904T051401072108Z-cbdcc39d66274ed1af992018a14bce6a.json): `context/` Python source 27개 파일을 실행 전 snapshot하고 108개 test 통과
- [Latest Verify receipt](receipts/verify/verify-20260904T070105935210Z-b470ae607a5945769333e7f5016450be.json): declared canonical basis·evidence snapshot, `node scripts/check-harness.mjs`, exit `0`

## 환경 관찰과 상한

`pnpm harness:check`는 package script 자체가 아니라 현재 Codex pnpm runtime이 dependency 재설치를 no-TTY에서 중단해 실행되지 못했다. package script가 호출하는 같은 Node file을 Verify argv로 직접 실행했으며, 이 변경은 package install·`node_modules` 삭제·재설치를 수행하지 않았다.

실제 explicit activation 뒤 생성될 ignored `.codex/maintain-runtime/`은 Noline harness check에서 optional execution surface로 허용했다. config·hook·skill은 계속 설치 필수 항목이고 runtime directory의 현재 부재는 unbound 상태와 양립한다.

descendant-timeout test는 staging과 target의 첫 전체 실행에서 한 번씩 timing failure가 있었지만, 동일 bytes의 두 번째 target 전체 실행과 durable harness-test receipt 실행에서는 108개 모두 통과했다. 이 record는 timing 안정성의 절대 보장이 아니라 해당 실행 결과와 환경 변동을 함께 남긴다.

Claude adapter 추가 뒤에는 같은 inherited `test_timeout_covers_descendant_after_group_leader_exits`가 111-test full suite 두 번, 이후 Claude hardening 뒤 113-test full suite 한 번에서 모두 실패했다. 앞선 실패 receipt는 [`harness-test-20260904T064831166159Z-665b3f72d490410cbde1fcdedd51daf0.json`](receipts/harness-tests/harness-test-20260904T064831166159Z-665b3f72d490410cbde1fcdedd51daf0.json), [`harness-test-20260904T064905973226Z-e46e2e78b979411b854e9de1086ec721.json`](receipts/harness-tests/harness-test-20260904T064905973226Z-e46e2e78b979411b854e9de1086ec721.json)에 보존했다. 이식 또는 Claude adapter가 아닌 Reference inherited timing test의 원인으로 분리했지만, 현재 전체 suite pass를 주장하지 않는다.

독립 읽기 전용 검토는 Claude subagent event가 Main binding을 건드릴 수 있는 문제와 Claude turn-pair state의 runtime symlink 우회 문제를 P1으로 발견했다. payload의 non-empty `agent_id`를 no-op 처리하고, turn state가 기존 Host adapter의 runtime 검증·lock·atomic writer를 사용하도록 고쳐 test로 확인했다. `recover`·`verify`·`validation` 문서에 남아 있던 Reference/sample 명령 예시는 Noline Project 기준과 `<workspace_id>` 자리표시자로 바로잡았다. descendant-timeout 문제는 이식본의 차이가 아니므로 이번 적용에서 테스트 의미를 바꾸지 않았다. 이 전체 suite를 엄격한 결정적 gate로 쓰려면 Reference 소유 범위에서 별도 안정화가 필요하다.

이 검증은 Noline 앱의 iOS·네트워크·OAuth·지도·PostgreSQL·실제 sync 동작, target-root Codex 또는 Claude Code hook trust, explicit activation 뒤 prompt/Stop event delivery·notice UI, 실제 skill discovery, 사람 acceptance·commit을 확인하지 않는다.
