# Workspace 작성 지침과 Maintainer 설정 적용

2026-09-11 · Noline Context Harness application Workspace

사용자가 source의 작성 지침·Maintainer 설정 변경을 Noline에도 반영하도록 요청했고, 적용안 제시 뒤 “커밋해 니가 반영한 부분만”이라고 범위를 지정했다. 이 기록은 해당 공통 변경의 적용을 다루며, 별도 session이 진행 중인 Ticket 03 구현·테스트·논의 문서는 수정하거나 커밋 대상으로 포함하지 않는다.

## 적용한 기준과 Noline 적응

Source는 `context-harness`의 commit `5f6db35f82833704e3ffb0cc430fc9da98a4ac62`이며 Reference는 clean이었다. Target baseline은 `refactor/codebase @ 653f8b8ad11c18d6c7eaa4da71ea4bdfcc956225`다. 첫 적용안 이후 다른 작업의 테스트 기반 커밋이 생겼으므로 쓰기 직전 [새 preflight](receipts/preflight/preflight-20260911T125922529377Z-04d13c0075fe4632b2a1b35bb0453a2e.json)로 다시 관찰했다.

[DOCUMENT-WRITING.md](../../DOCUMENT-WRITING.md)를 새 작성 기준 Owner로 두고 기존 Workspace README의 긴 본문을 읽기 경로로 전환했다. 논의·실행·색인 등 각 문서의 목적에 맞는 내용 충분성과 표현을 판단하며, 선택 이유·받아들인 비용·조건·원문 근거를 압축 과정에서 보존하도록 한다. Spec·Ticket, 생성·전환 계약과 Work 진입점에서 직접 읽도록 연결했다.

[역할 설정](../../../harness/maintain/workspace-context-maintainer.toml)에 Sol high를 명시하고 자동 runner가 시작·재개마다 같은 값을 읽도록 했다. 작성 지침은 정본 파일에서 읽은 전체 본문을 각 입력에 한 번 제공하며, 이미 받은 파일을 도구로 다시 읽지 않는다. 설정을 읽을 수 없으면 기본 모델로 대체하지 않고 실패한다. Python 3.11 이상이 필요하다. 다음 호출부터 적용하며 기존 thread identity·read-only·Guard·hook 권한과 실행 중인 호출은 바꾸지 않는다.

공통 파일 6개는 source와 바이트가 같다. Work AGENTS·Maintain README·역할 설정 3개는 source의 해당 변경만 적용하고 Noline 역할 설명, Claude Code의 같은 semantic runner 연결, 증거 수집 경로·제품 경로·검증 명령을 보존했다. 기존 skill·공통 설명 기준·Project layer·root 설정과 hook·wrapper는 변경하지 않았다. Noline 하네스의 결정 기록 경로에는 [짧은 선택 기록](../../../../../.claude/decisions/2026-09-11-workspace-writing-contract.md)을 연결하며, 상세 적용 결과는 이 문서가 소유한다.

## 기존 작업과 기록 보존

Preflight 당시 기존 변경은 저장소 로컬 `.pnpm-store/`, 새 hook 테스트, Workspace 002의 Ticket 03과 output이었다. Receipt는 원자적 snapshot이나 저자 증명이 아니며, 이후 다른 session에서 Ticket·설정·output 등이 계속 바뀌었다. 이번 patch는 그 경로를 포함하지 않았으며 baseline hash가 계속 같다는 주장으로 동시 변경을 덮지 않는다. Stage는 이번 공통 변경과 application Workspace 기록의 exact path에만 수행하고 기존 작업의 변경·삭제·untracked 상태는 그대로 둔다.

이전 날짜별 record·원문과 평가 초안은 다시 쓰거나 이식하지 않는다. Source의 비교 실험은 모델 선택의 배경이지 Noline 실제 host의 검증 결과가 아니다. [Preflight](receipts/preflight/preflight-20260911T125922529377Z-04d13c0075fe4632b2a1b35bb0453a2e.json)는 임시 원본과 같은 바이트로 보존했으며 SHA-256은 `f9fe765ea9045d29c714df49c48030da5f49fd1a681b56afd4dc40385df0dfb7`다.

## 직접 검사와 독립 검토

Noline root에서 다음을 확인했다.

- Maintain 단위 검사 72개 통과: 작성 본문 연결, 모델·추론 설정의 시작·재개·복원 경로, 설정 재읽기와 잘못된 값의 실행 전 거부를 포함한다.
- 전체 Harness 첫 실행은 124개 중 기존 Verify descendant timeout 시험 한 건이 실패했다. 같은 시험은 source에서도 실패 이력이 있고 이번에 변경하지 않았다. 단독 재실행은 통과했다.
- 전체 Harness 재검사 124개 통과. [검사 receipt](receipts/harness-tests/harness-test-20260911T130238067420Z-f9ad931c08604186a6b4861d1f79819c.json)는 실행 전 Python source 27개와 결과를 보존한다. 이 snapshot은 Markdown·TOML을 포함한 전체 입력 closure나 제품 검증이 아니며, 해당 적용 판본은 위 source commit·target diff와 별도 바이트 대조로 식별한다. 임시 Workspace에서 Recover·Verify 연결과 실제 Workspace 상태 보존 검사도 포함됐다.
- `node scripts/check-harness.mjs` 통과. 명시·기본 Recover는 모두 application Workspace의 같은 context 15개를 읽었다. 기존 product Verify는 재실행하지 않았고 마지막 receipt는 stale로 남았다.
- 최종 변경 Markdown의 로컬 링크 123개는 존재·root 경계를 통과했고, 새 작성 기준·역할 설정·적용 기록으로의 연결 의미를 대조했다. 이전 README 작성 절 anchor는 live Work 문서에서 제거됐으며 역사 record는 유지했다. `git diff --check`와 preflight 원본 바이트 일치도 확인했다.

별도 read-only 검토자는 사용자 요청, source commit, target 원자료·실제 diff와 preflight를 직접 대조했다. 적용된 코드·계약에서 새 P1/P2 결함은 발견하지 않았고, Noline의 `decisions/` 기록 요구를 지적해 짧은 연결 기록을 추가했다. 검토자는 제품·private runtime을 읽거나 테스트를 재실행하지 않았으며 위 테스트 실행 결과는 Main이 직접 확인한 것이다.

실제 Noline host의 hook trust·activation·response-end, 유료 모델 재호출과 새 문서 품질·자동 반영은 이번에 검증하지 않았다. 설정 설치·검사 통과를 제품 acceptance나 Workspace 완료로 확대하지 않는다. 커밋은 사용자가 요청한 이번 적용 파일만 대상으로 하며 push는 하지 않는다.
