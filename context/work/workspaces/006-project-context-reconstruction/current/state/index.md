# 현재 상태와 다음 행동

006은 첫 조사와 Ticket 02–07의 주제별 문서 이관을 마쳤다. 다음 문서 실행은 마지막 Ticket 08의 개발 시작·전체 읽기·검증 선언 점검이다. 남은 혼합 문서·결정과 읽기 경로, Verify evidence 누락 및 확인된 제품 보호 공백을 점검해야 하며 006 전체 완료는 아직 판단하지 않았다. Ticket 06 작업은 `57dd61d`, Workspace 기록은 `6d95e18`로 분리해 커밋했다. Ticket 07 변경은 아직 커밋하지 않았다.

- [01](../memory/tickets/01-source-map-and-improvement-candidates.md): 첫 자료·보완 후보 지도 완료.
- [02](../memory/tickets/02-product-activation-and-travel-access.md): 한정 이관과 내용·구성 교정 완료. 현재 입력 보존 계약과 일정 수정의 구현 차이는 구분해 남겼다.
- [03](../memory/tickets/03-data-storage-sync-and-cleanup.md): 저장부터 계정 종료까지의 문서 이관 완료. 여행별 미전송 판정과 재활성화 정리 보호의 제품 공백은 미해결이다.
- [04](../memory/tickets/04-offline-maps-and-routes.md): 지도 pack·저장 경로의 문서 이관과 독립 검토·제한된 검증 완료. 준비·최신성·표시·정리 공백과 실기기 미확인을 남겼다.
- [05](../memory/tickets/05-structure-layers-ui-schema.md): 구조·계층·UI·schema 문서 이관과 독립 검토·검증 완료. 현재 계층 예외와 타입·검증 보장 한계를 드러냈고 제품 코드는 변경하지 않았다.
- [06](../memory/tickets/06-writing-input-and-dates.md): 초안·장소·picker와 날짜·시간대 설명을 실제 부모·저장 경계에 대조해 이관했다. 입력 표시·종료 보호와 호환·metadata 범위의 제품 차이를 남겼다.
- [07](../memory/tickets/07-currency-api-and-errors.md): 통화 표시·입력·저장과 API·인증·소유권·오류 전달을 실제 구현에 대조해 이관했다. 금액과 접근·공개 안전성의 제품 차이는 수정 완료와 구별했다.
- 08: 개발 시작·전체 읽기·검증 선언 점검.

## 남은 점검에도 적용할 판단

[Spec 04](../memory/spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)에 따라 기존 내용의 현재 적합성과 문서 역할에 맞는 구성을 함께 판단한다. 기존 표·목록·체크리스트가 적합하면 유지할 수 있다. 새 형식으로 통일하거나 원문을 그대로 옮겼다는 사실로 판단을 대신하지 않는다. 재배치 뒤에는 조건·예외·이유·규칙 강도·예시 범위와 주변 읽기 경로를 대조한다.

이관한 주제는 현재 가이드·Project 본문·형성 자료만으로 필요한 뜻과 선택 이유를 이해하게 한다. 옛 제품 자료는 일반 읽기에서 제외되는 archive로 격리하고 역사 조사 접근점과 현재 읽기를 구별한다. 제품 약속과 코드 차이는 드러내며 문서 수정으로 제품 결함이나 구조 예외까지 해결했다고 쓰지 않는다.

## 현재 결과와 확인 한계

02의 실제 산출물·원본 대응은 [이관 결과](../../output/ticket-02-result.md), 내용·구성별 수정과 유지 이유는 [재리뷰](../../output/ticket-02-content-review.md)에 있다.

03의 [데이터 수명 결과](../../output/ticket-03-result.md)는 저장·동기화·정리의 현재 의미와 여행별 미전송·재활성화 보호 공백을, 04의 [지도·경로 결과](../../output/ticket-04-result.md)는 준비·최신성·표시·정리 공백과 실기기 미확인을 남긴다.

05의 [구조·UI·schema 결과](../../output/ticket-05-result.md)는 현재 계층 예외와 타입·검증 보장 한계를, 06의 [작성·입력·날짜 결과](../../output/ticket-06-result.md)는 초안·장소·picker와 날짜·시간대 경계 및 입력 표시·종료 보호 차이를 남긴다.

07의 [통화·API·오류 결과](../../output/ticket-07-result.md)는 화면별 금액 표시, 입력·저장 정밀도, 인증 갱신, 응답 검증·소유권과 오류 공개·client 변환의 실제 차이를 남겼다. client 기존 검사 39개, server 기존 검사 44개와 통화 임시 확인 7개, 변경 문서 상대 링크 293개 및 정적 검사는 통과했다. 실제 network·OAuth·기기 UI, PostgreSQL ownership·JWT·배포나 실제 공격을 검증한 결과는 아니며 임시 확인을 지속 테스트나 새 제품 정책으로 올리지 않았다.

전체 Harness 검사는 현재 산출물과 구별되는 역사·미이관 링크 오류 45건 때문에 실패한다. default 001 Verify 선언의 기존 누락 evidence 입력 8개도 남아 있다. 현재 제품 읽기를 위해 옛 원본이나 compatibility stub을 되살리지 않으며 Ticket 08에서 남은 결정·혼합 문서, 전체 읽기와 검증 선언을 함께 점검한다.

## 다음 행동

08에서 앱 개발 시작 경로와 session 형성 자료, 2026-09 session 결정, 남은 혼합 문서·결정의 현재 의존을 확인한다. 빠진 Project 진입·소비 경로와 archive 연결, Verify evidence 누락 8개와 Harness 오류 45건을 분류하고, 주제별 현재 Owner만으로 대표 개발 질문을 복원할 수 있는지 점검한다. 이 결과를 Spec의 전체 목표와 대조한 뒤에만 006 완료 또는 남은 실행을 판단한다.

제품 후속을 별도로 정한다면 접근·공개 안전성인 Expense 부모 관계, Trip mutation scope와 내부 오류 문구를 기존 003 작업과 먼저 대조한다. 금액은 입력·Local/Server 정밀도·합산·표시의 기대값을 함께 정하고 대표 라벨은 별도 사용자 의미 선택으로 둔다. 이 판단은 앞선 Ticket에서 남긴 데이터·지도·입력·구조 공백과 조율하되 Ticket 08의 문서 점검 완료 조건으로 바꾸지 않는다.
