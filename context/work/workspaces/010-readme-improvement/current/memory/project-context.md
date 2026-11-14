# README의 근거로 선택한 Project 맥락

README 문장을 쓰거나 고칠 때 근거로 삼은 본문과 그 이유다. 제목을 확인한 것으로 본문 적용을 대신하지 않으며, 현재 동작에 관한 문장은 여기서 끝내지 않고 코드로 확인한다.

대화 원문의 도구 호출로 보면 Main이 이번 작업에서 전체를 읽은 것은 제품 기준, 여행 접근·Policy, 데이터 수명, 여러 기기 편집 기준, 작성·입력, 지도·경로 준비, 현재 구조다. Selective Local-First 결정은 앞부분(1〜36행)과 검색 결과로, 앱 실행·세션·데이터 보존 본문은 제목 목록과 검색 결과로만 보았다. 4번 절의 로그아웃·탈퇴·재인증 문장은 그 형성 자료와 로그아웃 코드를 읽어 맞춘 것이다. 이 두 본문에 기대는 문장을 고칠 때는 본문을 처음부터 읽는다.

| 본문 | README에서 근거가 된 부분 |
| --- | --- |
| [제품 기준](../../../../../project/common/product.md) | 소개, Motivation, 상태별 동작 표, 통화별 관리 |
| [Selective Local-First 결정](../../../../../project/decisions/0001-selective-local-first.md) | 1번 절의 대안 비교와 데이터/서비스 분리의 이유 |
| [여행 접근·Policy](../../../../../project/guidance/travel-access/INDEX.md) | Router와 Policy의 역할, UI State 절의 조회 표시 상태·연결 미확인·작성 계약 |
| [데이터 수명](../../../../../project/guidance/data-lifecycle/INDEX.md) | 2번 절의 전송 규칙과 예외, 4번 절의 사본 정리·삭제 유예 |
| [여러 기기 편집 기준](../../../../../project/guidance/data-lifecycle/edit-reconciliation.md) | 3번 절 전체 |
| [앱 실행·세션·데이터 보존](../../../../../project/current/app-runtime/INDEX.md) | 4번 절의 로그아웃·탈퇴·재인증 |
| [작성·입력](../../../../../project/guidance/writing-and-input/INDEX.md) | UI State 절의 "쓰던 입력을 지우지 않는다" |
| [지도·경로 준비](../../../../../project/guidance/offline-maps-and-routes/INDEX.md) | Features의 지도 설명, 현재 한계의 지도 범위 |
| [현재 구조](../../../../../project/current/architecture.md) | Tech Stack & Structure |

각 주제의 `_background`도 읽는다. 이번 작업에서는 데이터 수명의 맥락·근거, 여행 접근, 지도·경로, 앱 실행의 형성 자료를 읽었다. 과거 문서가 지금 구현보다 강하게 말했던 부분("7일 후 자동 회수" 등)이 거기에 적혀 있어, README가 같은 과장을 되풀이하지 않게 해 준다. 통화, 날짜, API 계약, 작성·입력, 개발 경계의 형성 자료는 README가 다루지 않는 주제라 읽지 않았다.

이 Work는 Project 본문을 고치지 않았다. README와 코드를 대조하다 Project 본문과 코드가 다른 곳을 발견하면 README는 코드에 맞추고, 본문 갱신 필요는 Main에게 알린다.
