# 제품 규칙과 위험 점검을 주제 본문에 통합

2026-10-31. Workspace 006 Ticket 09에서 기존 제품 기준의 Owner를 전환한 기록이다. 제품의 동작이나 약속을 새로 정한 결정은 아니다.

기존 rule, guard와 Project 본문은 같은 원자성·라우팅·인증 조건을 각각 설명했다. 짧은 규칙만 읽으면 현재 구현 차이와 예외를 놓치고, 수정할 때 세 곳의 권위를 함께 맞춰야 했다. 필요한 역할을 보존하는 것과 기존 위치를 유지하는 것을 구별해, 규칙·위험·변경 시 확인 조건을 대응하는 Project 주제 본문에 합친다.

라우팅과 Policy UI는 여행 접근, 원자성·삭제·생성 ID는 데이터 수명, 타입 계약은 schema 기준, 시점과 달력 날짜는 날짜 본문, 인증·소유권은 API 계약이 맡는다. [개발 기준 안내](../../context/project/guidance/README.md)와 root·경로별 guide는 작업에 맞는 본문을 고르게 한다. 별도 compact rule 사본과 Guard Map은 두지 않는다. 이 선택은 작업자가 주제 본문을 읽는 부담을 받아들이는 대신, 규칙의 조건과 실패 위험을 떨어뜨려 관리하는 비용을 줄인다.

현재 구현이 기준을 충족하지 못하는 부분은 차이로 남긴다. 예를 들어 미전송 queue 보존은 PENDING만 확인하는 현재 cleanup 구현에 맞춰 약화하지 않으며, 일반 조회의 삭제 숨김을 sync pull에도 적용하지 않는다. 상세 의미와 구현 차이는 각 제품 본문에서 확인한다.

이 결정은 [앞선 제품 context 전환](2026-10-31-project-product-context-ownership.md) 당시 rules·guards를 유지했던 범위를 이어 변경한다. runbooks·commands·공유 실행층의 남은 정리는 후속 Ticket이 판단한다. 과거 결정을 지금의 설명으로 덮어쓰지 않는다.

원본 9개는 `.claude/_archive/2026-10-31-project-context-reconstruction/ticket-09/`에 바이트와 SHA-256을 대조해 보존했다. 원본은 역사 조사·복구용이며 현재 읽기의 필수 경로가 아니다. 원문별 의미 대응, 실제 변경과 검증 한계는 [006 결과](../../context/work/workspaces/006-project-context-reconstruction/output/index.md)에서 찾는다. 향후 새 독자가 주제 본문에서 적용 조건을 찾지 못하면 해당 본문의 진입과 구성을 먼저 개선하며, 독립 정책 사본을 자동으로 되살리지 않는다.
