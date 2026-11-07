# 선택한 Project 맥락과 적용 범위

이 작업에서 아래 Project 본문을 선택한다. 이 Work에서 Project는 **읽는 근거이며 고칠 대상이 아니다.**

| 본문 | 이 Work에서 쓰는 이유 |
| --- | --- |
| [Project README](../../../../../project/README.md) | 주제별 Owner를 찾는 진입점 |
| [네트워크·조회·화면 복구](../../../../../project/guidance/travel-access/INDEX.md) | Policy·Router·UI의 책임 구분, 기존 제한 안내 패턴 우선, 오류와 제한을 발생한 영역에서 표현한다는 기준, 사유는 사용자 말로 쓰고 내부 구현명을 노출하지 않는다는 기준 |
| [UI 기준](../../../../../project/guidance/development-boundaries/ui.md) | 사용 제한을 `useAppPolicy`·`PolicyErrorDisplay`·`NetworkStatusIndicator`로 연결한다는 기준. 동기화 멈춤은 사용 제한이 아니므로 그대로 적용되지 않는다 |
| [오류 처리](../../../../../project/guidance/error-handling.md) | 공개 문구·진단 정보·정책 제한의 구별, 중앙 오류 장치를 일반 작업에서 새 기본 인프라로 만들지 않는다는 기준. 토스트를 검토할 때 읽는다 |
| [앱 실행·세션](../../../../../project/current/app-runtime/INDEX.md) | 세션 상태별 현재 설명과 로그아웃 미전송 보호. 로그인 화면 구성의 입력 |
| [날짜와 시각](../../../../../project/common/date-and-time.md) | 시간대 없는 여행의 UTC 호환 표시는 확인 필요 안내와 함께 쓴다는 제품 의미. 시간대 안내를 없애거나 옮기려면 이 의미를 함께 판단해야 한다 |
| [제품 의미](../../../../../project/common/product.md) | 로컬 저장 성공과 서버 반영은 다른 완료라는 의미. 미전송 표시의 판단 기준 |
| [데이터 저장·동기화](../../../../../project/guidance/data-lifecycle/INDEX.md) | 미전송 상태와, 정지를 알게 하는 표시가 아직 없다는 현재 공백. Ticket 05에서만 읽는다 |

## 토스트 판단 전에 읽을 것

[네트워크·조회·화면 복구](../../../../../project/guidance/travel-access/INDEX.md)의 갱신 절은 "복구 토스트를 추가하지 않는 선택"을 유지하라고 하고, [형성 맥락](../../../../../project/guidance/travel-access/_background/context.md)은 이를 별도로 보류했다고 적는다. 연결 복구 알림에 관한 판단이라 앱 전체의 토스트 금지는 아니지만, 토스트는 처음 논의하는 형태가 아니다. Ticket 02에서 토스트를 판단하기 전에 두 곳을 읽고 이 선택과의 관계를 밝힌다. 이유를 더 찾으려면 같은 폴더의 `evidence.md`를 본다.

## Project와 다를 수 있는 것

앱 실행 기준은 `restore-failed`를 "복원 재시도 또는 계정 검사를 거치는 로그인으로 해결한다"고 설명한다. 007에서 큐 소유자를 확인하지 못한 경우 재현과 사용자 로그인으로, 다른 계정 데이터가 섞인 경우 코드 읽기로 맞지 않음을 봤다. 처리 방법이 정해지지 않았으므로 이 Work에서 고치지 않는다.

## Project 반영

여러 작업에 적용될 규칙이 나와도 Project 후보일 뿐이다. 동작과 규칙이 확정된 뒤 사용자가 요청할 때 [Project 관리 계약](../../../../../project/MAINTENANCE.md)으로 별도 판단한다. 지금은 Ticket의 결과나 완료 조건에 넣지 않는다.
