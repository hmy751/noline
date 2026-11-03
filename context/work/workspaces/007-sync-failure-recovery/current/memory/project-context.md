# 선택한 Project 맥락과 적용 범위

Recover는 아래 Project 본문을 선택한다. 모두 이 Work가 지키거나 고칠 계약을 직접 담고 있다.

| 본문 | 이 Work에서 쓰는 이유 |
| --- | --- |
| [Project README](../../../../../project/README.md) | 주제별 Owner를 찾는 진입점 |
| [데이터 저장·동기화·정리](../../../../../project/guidance/data-lifecycle/INDEX.md) | queue FIFO, push 상태표, 두 종류의 재시도, push 실패 시 pull 생략, pull upsert의 충돌 미해결. 42행의 "재전송은 별도 확인 대상"과 48–55행의 상태표를 Ticket 01·02가 실제 동작에 맞춰 고친다. 57행의 FIFO 비용 문장은 유지한다. |
| [API 계약](../../../../../project/guidance/api-contracts.md) | 부모 확인 순서(37행), 실제 mutation 조건 `id + userId + deletedAt IS NULL`(39행), 존재를 드러내지 않는 같은 404(42행), Expense 생성의 부모 확인 공백(22·52행). Ticket 01이 재전송 응답을 이 계약 안에서 정하고 문서에 추가한다. |
| [오류 전달](../../../../../project/guidance/error-handling.md) | status를 조용히 바꾸지 않는다(22행). 500·404를 200·409로 바꾸는 변경은 문서와 테스트로 고정한다. |
| [앱 실행·세션·데이터 보존](../../../../../project/current/app-runtime/INDEX.md) | 로그인·로그아웃이 진행 중인 sync를 기다리는 순서(93–96행), 명시적 로그아웃의 미전송 손실(7행). 막힘이 사용자에게 드러나는 유일한 경로와 timeout 연장의 부작용(Ticket 04)을 판단한다. |
| [제품 의미](../../../../../project/common/product.md) | 연결이 끊겨도 핵심 입력을 잃지 않고 복구 뒤 서버와 맞춘다는 약속(11행), 활성 여행 하나의 의미(7·9행). 횟수·시간 기준 폐기를 기각한 근거다. |
| [Selective Local-First 선택](../../../../../project/decisions/0001-selective-local-first.md) | client 생성 ID를 서버가 수용하는 이유. 같은 ID를 재전송 판별 기준으로 쓰는 전제다. |

## 작성 전에 읽을 것

Project 문서를 실제로 고치는 Ticket(01·02)은 고치기 전에 [Project 관리 계약](../../../../../project/MAINTENANCE.md)을 읽고 [context-update](../../../../../../.agents/skills/context-update/SKILL.md)로 반영한다. 문서 반영은 각 Ticket이 자기 변경과 함께 끝내며, 마지막 검증 Ticket으로 미루지 않는다.

## 판단에 쓴 Personal 기준

책임 배치는 [개인 개발 기준](../../../../../personal/development/INDEX.md)과 [계약·수명 기준](../../../../../personal/development/contracts-and-lifetime/INDEX.md)의 세 관점으로 정했다. 누가 무엇을 알아야 하는가, 증상 대응과 원인 수정의 구별, 저장된 상태의 수명이다. Personal은 Recover 선택 대상이 아니므로 판단 근거로만 연결한다. 적용 결과는 [Spec 05](spec/05-constraints-design-assumptions.md#책임을-이렇게-나눈-이유)에 있다.
