# 선택한 Project 맥락

OTA 도입을 판단할 때 기대는 Project 본문과 그 이유다. 2026-11-16 논의에서 Main이 이 본문들을 다시 읽지는 않았다. 위험 판단은 실제 코드(`src/shared/db/index.ts`, `app.config.js`, `eas.json`)와 이번 세션의 릴리스 경험에서 나왔다. 구현이나 규칙을 확정할 때는 아래 본문을 처음부터 읽는다.

| 본문 | 이 Work에서 쓰는 부분 |
| --- | --- |
| [제품 기준](../../../../../project/common/product.md) | 네트워크가 없어도 계속 쓸 수 있다는 약속. `fallbackToCacheTimeout: 0`을 필수로 두는 근거다 |
| [데이터 수명](../../../../../project/guidance/data-lifecycle/INDEX.md) | 기기 SQLite와 동기화 계약. 마이그레이션을 OTA로 내지 않는 규칙 후보의 근거다 |
| [앱 실행·세션·데이터 보존](../../../../../project/current/app-runtime/INDEX.md) | 앱 시작 순서(초기화·마이그레이션 실행 시점). OTA 적용 시점이 이 순서와 어떻게 겹치는지 볼 때 읽는다 |
| [현재 구조](../../../../../project/current/architecture.md) | 네이티브 모듈과 앱 구성. Ticket 03의 반영 위치 후보다 |
| [오류 전달](../../../../../project/guidance/error-handling.md) | Sentry 연결과 신호 해석. OTA 번들의 소스맵을 다룰 때 읽는다 |
| [Project 관리 계약](../../../../../project/MAINTENANCE.md) | Ticket 03에서 새 Owner를 만들지 기존 본문에 합칠지 판단하는 기준 |

Project에는 배포·릴리스를 소유하는 본문이 아직 없다. 지금 릴리스 절차의 근거는 Work 007·008의 records다. 이 Work는 생성 시점에 Project 본문을 고치지 않았다.
