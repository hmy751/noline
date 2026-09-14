# Project 작성 지침의 실패 분석과 재시험

날짜: 2026-09-14

## 판단한 원인

첫 초안에서 확인한 네 문제는 관련 원칙이 전혀 없어서 생긴 것으로 보이지 않는다. 기존 지침에는 원자료 통합, 코드 대조, 읽기 경로 확인, `current`의 추가 효용 판단이 이미 있었다. 그러나 그 원칙을 쓰기 전 비교 기준과 쓰기 후 별도 확인으로 연결하지 않아 다음 실패를 안정적으로 걸러내지 못했다.

| 관찰 | 기존 기준과의 관계 | 보강한 행동 |
| --- | --- | --- |
| `current`에 test 개수·EPERM·Docker 미실행 누적 | 실행 결과 복제 제한과 추가 효용 기준은 있었음 | 다음 판단의 변화와 재확인 신호를 요구하고, 관계 없는 일회성 정보는 Work 기록으로 보냄 |
| 통화의 Expense별 선택·코드/기호 표시 누락 | 유효한 원자료 의미 통합 원칙은 있었음 | 초안 전 보존 의미를 잡고 초안 뒤 보존·갱신·의도적 제외를 의미 단위로 대조 |
| client local 입력이 date-only라는 확대 | 실제 코드 대조 원칙은 있었음 | 사실 문장의 범위를 form·request·local·response 등 직접 확인한 경계와 맞춤 |
| 기존 API·날짜 runbook 연결 누락 | 읽을 조건과 소비자 대조 원칙은 있었음 | Project README 외의 대표 active runbook·guide·호환 문서·skill에서 새 Owner까지 추적 |

원실행의 도구 기록은 없어 실행자가 실제로 어떤 문서를 읽고 판단을 생략했는지는 확인하지 못했다. 따라서 원인을 개인의 미준수로 확정하지 않고, 기존 원칙이 관찰 가능한 완료 확인으로 충분히 이어지지 않았다고 판단했다.

## 지침 변경

다음 Owner를 함께 맞췄다.

- `context/project/MAINTENANCE.md`: 초안 전 대조 기준, 초안 후 의미·사실·routing의 분리 확인, current의 판단 효용·재확인 조건
- `context/project/REFERENCE/composition.md`: 근거보다 넓은 사실 금지, 일회성 검증 정보와 current의 구별
- `context/project/REFERENCE/reading.md`: Project README 밖의 실제 진입점 추적과 여러 구현 경계의 확인
- `.claude/skills/update-project-context/SKILL.md`: 위 기준을 실제 갱신 순서와 완료 확인에 연결
- `.claude/skills/read-project-context/SKILL.md`: Owner 변경의 대표 진입점과 사실 범위 확인을 읽기 행동에 연결

각 실패의 금지문이나 고정 checklist 파일은 만들지 않았다. 자세한 선택과 재검토 조건은 [결정 기록](../../../../../.claude/decisions/2026-09-14-project-context-semantic-and-routing-verification.md)이 소유한다.

## 격리 재시험

기준 commit `2937c252a735ecc6edbe1d3516659fcf459da970`에서 `/private/tmp/noline-004-retest-20260914` worktree를 만들고 위 지침 다섯 파일만 적용했다. 별도 ephemeral Codex 실행에는 Workspace 002 Ticket 01–05의 지속 의미를 Project로 옮기고 승인된 Owner 이동을 완료하라는 목표·권한만 주었다. 예상 파일명과 앞선 네 실패의 정답은 제공하지 않았다. 제품 코드, Workspace, 과거 record, machine 상태 수정과 commit은 금지했다.

실행 경로 오류와 잘못된 reasoning 설정으로 산출물 전에 중단한 두 시도는 결과에서 제외했다. 유효한 재시험은 `gpt-6-astra`, high reasoning으로 완료했다.

## 결과 판정

- **기존 의미 보존 — 개선 확인:** 새 통화 본문이 Expense별 통화 선택, 오프라인 입력의 필수 통화, 금액과 코드·기호의 동시 표시를 보존했다.
- **직접 사실의 범위 — 개선 확인:** 날짜 본문이 entity, create/update request, form, local 저장, server 저장·response, activation을 나눠 서로 다른 표현과 제품 미정을 구별했다.
- **실제 읽기 경로 — 개선 확인:** 기존 API·날짜·통화 runbook과 client/server/schema guide 및 호환 문서에서 새 Owner로 이어지게 했다.
- **`current`의 가치 — 개선 확인:** 다음 변경에서 필요한 검사 종류와 재확인 조건을 설명했고, test 개수·EPERM·Docker 미실행은 복제하지 않았다.

재시험은 21개 기존 active 문서를 수정하고 Project 본문 5개를 만들었다. 파일 수나 작성자의 완료 보고는 품질 근거로 쓰지 않았다. 격리 tree에서 허용 범위 밖의 물리 파일 변경이 없고 제품 코드·Workspace·record·machine 상태·HEAD와 기존 사용자 변경이 보존됐음을 확인했다. 344개 local link, `git diff --check`, Workspace 001·002와 기본 Recover는 통과했다. `harness:check`는 기준 tree에 이미 있던 `.claude/README.md`의 `settings.local.json` 누락 링크에서 실패했고 제품 검사는 재실행하지 않았다.

재시험 초안에는 도시 검색·저장 용량처럼 좁은 주제 파일도 생겼다. 이것이 장기적으로 가장 좋은 문서 구성인지는 제품 본문 수락 Ticket에서 별도로 판단해야 한다. 이번 Ticket은 문서 수를 정답으로 채택하지 않고, 앞선 네 실패를 새 실행이 반복하지 않았다는 범위에서 지침 효과를 확인한다.

격리 산출물은 현재 제품 초안으로 복사하지 않았다. 본 작업 트리의 기존 Project 초안과 002 변경도 수정하지 않았다.

## 확인과 한계

- `node scripts/check-harness.mjs`: 지침 변경 직후 통과
- `git diff --check`: 지침 변경 직후 통과
- 격리 실행의 local link 344개와 허용 파일 범위 검사: 통과
- 격리 실행의 Workspace 001·002·기본 Recover: 통과
- 기존 네 실패의 재발 여부: Main이 생성 결과와 원자료·코드 경계를 직접 대조해 모두 개선 확인

이는 지침 보강의 첫 재시험이며 모든 Project 갱신에 대한 일반적 성공 보장은 아니다. 같은 실패가 다음 독립 적용에서도 반복되면 실행 단계의 검증 배치와 독립성 필요를 다시 판단한다.

