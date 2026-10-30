# 현재 상태와 다음 행동

006은 005 종료 뒤 새 방향으로 생성한 Workspace다. 하나의 Spec과 Ticket 01을 구성했으며, 광범위한 자료 조사와 Project 본문 반영은 아직 시작하지 않았다. 생성 결과의 확인은 [기록 색인](../../records/README.md)에서 찾는다.

## 다음 행동

[Ticket 01](../memory/tickets/01-source-map-and-improvement-candidates.md)을 시작한다. 먼저 `.claude` 문서와 현재 Project 본문의 대응·이관 관계를 정리해 옮길 의미, 보존할 근거, 중복·충돌과 본문 보완 기회를 드러낸다. 여기에 002의 전체 작업 축적과 004의 계약 논의·이관 결과를 연결하고, 005와 다른 흩어진 자료로 후보를 넓힌다. `.claude`에 대응 문서가 없는 중요한 내용도 추가하며, 전체 이관 완료를 다른 자료 조사의 선행 조건으로 두지 않는다. 각 exact 경로와 읽을 이유는 Ticket 본문에 있고, 추가 원자료는 [source 색인](../../source/index.md)에서 선택한다. 다른 Workspace 전체를 Recover할 필요는 없다.

첫 결과는 자료 목록과 실질적인 보완 기회, 필요한 검증·제품 논의, 권장 우선순위와 후속 Ticket 묶음이다. 이를 사용자와 논의한 뒤 주제별 실행을 구체화한다. 지금 정해진 것은 문서 중심의 수집·검증·적극적인 본문 재구성 방향과 `.claude`·Project 대응 관계를 먼저 드러내는 조사 순서이며, 최종 주제 수와 아카이브 배치는 아직 정하지 않았다.

## 이어받을 조건

005 결과는 보존된 근거지만 그 작업이 사용자 기대를 달성했다는 판단은 이어받지 않는다. `.claude` 제품 문서는 이관 원자료이며 최종 개선의 중심은 `context/project`다. 현재 파일 구조도 재검토할 수 있다. 스킬·설정·실행 연결은 별도 논의 없이 개편하지 않는다.

## 기계 상태와 사람 판단

`workspace.json`은 identity, `recover.json`은 읽을 Project 문서 선택, `verify.json`은 제한된 검증 명령, [status.json](status.json)은 마지막 Verify 결과와 receipt cursor를 맡는다. 제품 Verify를 실행하지 않아 결과·receipt는 null이다. `ready_for_verification`은 초기 machine 값이며 조사·이관 완료를 뜻하지 않는다. Freshness는 Recover가 계산한다.

006 생성·조사 우선순위·기록은 `e5adab4`에 커밋했다. 실제 자료 조사는 아직 착수 전이다. active index와 session binding은 변경하지 않았다.

## 다른 세션에서 이어갈 때

Project root `/Users/hammyeong-yeon/Desktop/10_work/noline`에서 `python3 -B -m context.work.harness recover 006-project-context-reconstruction`으로 이 Workspace를 명시해 읽는다. 기본 active index는 001이므로 id 없는 Recover로 006을 선택했다고 판단하지 않는다. 현재 branch·HEAD·변경 상태도 확인해 위 커밋 이후의 변경을 구분한다. 인계 점검 당시 `.pnpm-store/`는 기존 untracked 항목이며 이 작업의 산출물이나 정리 대상이 아니다.

Recover 뒤에는 [Ticket 01](../memory/tickets/01-source-map-and-improvement-candidates.md) 본문과 [source 색인](../../source/index.md)을 직접 읽는다. 둘은 Recover에서 링크만 제공될 수 있다. 첫 조사에서는 `.claude` 문서 지도와 현재 Project 본문을 대조하고, 위 순서로 002·004의 자료를 연결한다. 생성·과거 작업을 다시 수행하거나 새 Workspace를 만들 필요는 없다.

이 재진입은 문서를 읽는 동작이다. 새 세션의 자동 기록 연결은 별도의 명시적 Workspace 선택과 [session binding 계약](../../../../harness/maintain/SESSION-BINDING-AND-LIFECYCLE.md)을 따르며, 이 인계 점검으로 새 세션이 활성화됐다고 간주하지 않는다. 전체 Harness 검사의 기존 002·003 역사 링크 오류 8개는 [검증 기록](../../records/2026-10-30-04-priority-verification.md)에 구분되어 있고, Ticket 01의 자료 조사 시작을 막는 오류는 아니다.
