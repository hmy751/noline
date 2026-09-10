# Verify

`verify`는 선택한 Workspace의 `verify.json`에 명시된 한 가지 claim을 고정 argv로 확인하고, 실행 전에 그 claim의 canonical basis와 제품 evidence를 snapshot한 뒤 receipt와 machine status를 남기는 결정적 실행기다.

## 소유 계약

- `workspace.json`의 정체성과 `verify.json` schema v2의 `claim`, `canonical_basis`, `verification`만 읽는다.
- `claim`은 이번 실행이 무엇을 확인하는지 구체적으로 서술한다. 명령 통과만으로 claim의 의미가 충분히 증명되거나 작업이 완료됐다고 간주하지 않는다.
- `canonical_basis`와 `evidence_paths` 파일의 Project-root 상대 경로, SHA-256, byte size를 명령 실행 전에 모두 확보한다. basis는 판단 기준, evidence는 그 기준을 구현·검사하는 파일이다.
- `canonical_basis`는 Project routing README가 아니라 현재 claim을 실제로 소유하는 normative 문서를 선택한다. `evidence_paths`는 중요해 보이는 표본이 아니라 고정 argv가 claim 범위에서 읽는 tracked 입력을 설명해야 한다. Package script·workspace 설정·lockfile·fixture·generated input처럼 간접 입력이 있으면 이식·계약 검토에서 펼쳐 대조하고, 완전한 input closure를 구성할 수 없으면 argv를 좁히거나 claim과 proof ceiling을 낮춘다.
- argv는 shell 없이 실행하며 shell·`env` trampoline, 절대 경로, path traversal을 거부한다.
- timeout은 제품 timeout 규칙을 판정하는 기능이 아니라 검증 subprocess가 무한히 머무르지 않게 하는 실행 한도다. POSIX에서는 새 process group의 일반 descendant까지 같은 deadline으로 기다리고 초과하면 group을 종료해 exit `124`의 실패로 남긴다. 스스로 새 session으로 분리한 process와 비-POSIX의 descendant 전체 종료는 이 경계가 보장하지 않는다. stdout·stderr는 stream별 상한과 Project-root 정규화를 적용한다.
- 시작 전에 `records/receipts/verify/`가 symlink가 아닌 실제 디렉터리인지 확인한다.
- 성공과 실패 모두 기존 파일을 덮지 않는 schema v2 receipt를 `records/receipts/verify/`에 추가한다. receipt에는 claim, 두 종류의 선확보 snapshot과 이를 함께 식별하는 `snapshot_sha256`, argv·exit·bounded output, timeout 결과, 민감한 환경 변수를 제외한 Python/OS Harness runtime 정보가 들어간다.
- `current/state/status.json`은 schema v3의 `verification_passed` 또는 `verification_failed`와 receipt cursor만 atomic 교체한다.
- `next_actions`를 계약·receipt·status·CLI summary에 두지 않는다. `current/state/index.md`, `recover.json`, 사람용 records를 읽거나 수정하지 않으며 다음 조치, context maintenance, acceptance를 결정하지 않는다.

Project root에서 다음처럼 실행한다.

```bash
python3 -m context.work.harness verify
python3 -m context.work.harness verify <workspace_id>
```

검증 성공 상태는 `verification_passed`다. 이것은 snapshot된 basis/evidence와 기록된 runtime 조건에서 고정 argv가 exit `0`을 반환했다는 기계 사실이다. 사람의 acceptance, claim의 의미적 충분성, `completed` 전이를 뜻하지 않는다.

Verify runtime은 arbitrary argv가 선언 밖에서 읽는 파일을 자동 발견하거나 evidence closure를 증명하지 않는다. Recover가 표시하는 receipt freshness도 선언된 basis/evidence snapshot의 현재 일치만 뜻하며, undeclared command input이나 이후 변경된 claim·argv까지 같다는 뜻은 아니다.

`verify`는 상태 전환이나 인계에서 다시 확인할 필요가 있는 실행 사실을 durable evidence로 남길 때 사용한다. 단순 반복 개발 확인은 직접 test 명령을 사용한다. 실행한 receipt는 결과가 같아도 자동으로 덮거나 합치지 않는다.

과거 schema v1 receipt와 schema v2 status는 연결된 기록을 복구하기 위해 계속 읽을 수 있고, 이전 flat `records/verify-*.json` receipt 경로도 유지한다. 다른 receipt 종류나 임의의 `records/*.json`을 제품 Verify 결과로 연결하지 않는다. 역사 파일은 새 schema로 다시 쓰지 않는다. `next_actions`를 포함하던 `verify.json` schema v1은 실행 책임이 달라졌으므로 schema v2로 명시적으로 이관해야 한다.
