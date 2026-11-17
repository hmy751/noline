# OTA 방지 규칙을 그대로 두고 확정은 Project context와 연결하기로 함

2026-11-17 오후 5시경, 두 번째 세션에서 커밋(`4c00153e`·`49fd28a3`·`6208cdd1`·`50a4a4a2`)을 마친 뒤의 대화다. 원문은 [source 색인](../source/index.md)의 두 번째 세션 원문에 있다.

## 대화

> "막는 규칙 뭔데"

Main은 `apps/client/scripts/ota/rules.mjs`의 규칙 네 가지를 설명했다.
- 기기 SQLite 구조: `shared/db/`(`utils.ts` 제외)나 DDL은 우회 없이 거부한다.
- 서버 계약: 해당 경로와 요청 클라이언트를 쓰는 파일은 `--server-checked`가 있어야 통과한다.
- 네이티브 설정·의존성: 알리기만 한다.
- EAS에 없는 환경 변수 이름: 거부한다.

이어서 판단이 갈리는 세 곳을 짚었다. 첫째, DB 규칙에 우회 플래그가 없다. 둘째, 서버 계약 범위가 넓어 UI 로직만 고친 파일도 걸린다. 셋째, `--server-checked` 하나가 "서버를 먼저 배포함"과 "서버 변경이 필요 없음"을 함께 뜻한다.

> "확인이 필요한 부분은 이번에 같이 고치자는거야?"

Main은 고치자는 것이 아니라 확인을 받으려던 것이라고 답했다. 그리고 세 곳 모두 그대로 두기를 추천했다. 잘못 막혀도 스토어 빌드나 플래그 한 번으로 지나갈 수 있지만, 잘못 통과하면 기기 DB나 서버 계약을 되돌리기 어렵다는 이유였다. 각 항목을 다시 볼 조건도 함께 제시했다.

> "그래 그대로 두자 다른 context와 같이 연결해서 뭔가 정하는게 좋을 것 같아"

## 정한 것

- 규칙은 바꾸지 않고 지금대로 운영한다. 코드 변경은 없다.
- 규칙의 최종 확정은 [Ticket 03](../current/memory/tickets/03-project-context-reflection.md)에서 다른 Project context와 연결해 정한다. Main은 사용자의 말을 이렇게 해석했다. 규칙을 Work 안에서 따로 확정하지 않고, 기존 Project 계약과 맞춘 뒤 확정한다는 뜻으로 읽었다.
- 그래서 Spec 02의 "(규칙 후보)" 표시는 Ticket 03까지 그대로 둔다.

## 대조할 Project context

Main이 확인한 범위다.
- [API 계약](../../../../project/guidance/api-contracts.md)은 편집 표식 변경에서 "DB 구조 → 서버 → 새 앱" 배포 순서를 이미 정했다. 서버 계약 규칙과 `--server-checked`의 뜻은 이 순서와 맞춘다.
- [저장·동기화 기준](../../../../project/guidance/data-lifecycle/INDEX.md)은 구버전 요청 처리를 다룬다. 앱이 먼저 바뀔 때 생기는 어긋남이 서버 계약 규칙의 근거다.
- 기기 DB migration을 소유하는 Project 본문은 없다. [앱 실행·세션](../../../../project/current/app-runtime/README.md)은 DB migration을 소유하지 않는다고 밝힌다. DB 규칙을 둘 곳도 Ticket 03에서 정한다.

## 이 기록으로 고친 current

Ticket 02(상태, 규칙 절), Ticket 03(반영할 의미), Spec 02(규칙 후보 설명), state, recover, README, records 색인
