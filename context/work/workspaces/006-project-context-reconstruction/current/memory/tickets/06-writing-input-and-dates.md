# Ticket 06 — 작성·입력·날짜 재구성

상태: 완료. 2026-10-31, 작성·입력과 날짜의 기존 본문·결정을 실제 부모 소비자, 코드와 저장 경계에 대조해 Project로 이관하고 독립 검토·검증을 마쳤다. 이 완료는 문서 이관 범위이며 확인한 제품 차이의 수정, 전체 client·server test나 실제 앱 검증, 006 전체 이관 완료를 뜻하지 않는다. 이번 변경은 아직 커밋하지 않았다.

## 맡은 결과와 범위

현재 Project context에서 작성 초안, 장소 검색·선택, picker의 임시값과 확정값, 제출과 저장 표현, 날짜·시간대 경계의 관계를 이해하고 관련 변경 기준을 선택할 수 있게 한다. 같은 ID와 열린 UI만으로 초안 수명을 일반화하지 않고 부모의 해제·재선택, policy 전환, pending 중 종료, native picker 수명까지 실제 소비 경로에 맞게 구별한다.

날짜와 시각은 ISO 저장·전송 계약, 도시 날짜 경계, DST 공백, client·server 호환 입력과 Local 반환·입수 검증, 지도 만료 metadata의 갱신 범위를 분리해 설명한다. 유효한 책임 표·picker 비교·선택 이유는 보존하되 일부 소비자에서만 성립하는 관찰을 전체 계약으로 확대하지 않는다.

## 실행 맥락과 접근

Ticket 05에서 UI adapter·picker 책임과 폼 전체 수명을 분리한 뒤, 기존 form·manual-input·time 본문과 경비 초안·경비 날짜·여행 도시 시간대 결정 6개를 맡았다. 앞선 002의 일정 생성·경비 날짜·picker 형성 기록과 실제 form 부모, reset·검색 hook, Places API, DatePicker·TimePicker·TimeField, schema·helper·repository·Local·server·입수·만료 경계를 함께 대조했다.

[공통 내용·구성 판단 기준](../spec/04-quality-and-completion.md#후속-ticket의-내용-판단과-리뷰)에 따라 기존 내용의 현재 적합성과 형식의 역할을 판단했다. 초안·후보·임시값·저장값을 구별하는 기존 책임 표와 날짜·시간 picker 비교, Controller 예시는 유지했다. 중복 질문과 체크리스트는 행동 조건 가까이에 통합하고, 작성 수명·장소 선택·picker는 실제 변경 질문에 따라 나눴다. 기존 날짜 Owner는 유지하면서 적용 범위와 형성 근거를 보완했다.

## 완료 조건과 확인 방법

- Drawer·Modal의 `isOpen` 변경과 부모의 조건부 해제·재선택이 초안 reset에 미치는 차이를 설명할 수 있다.
- policy 전환 중 입력 표시·내부 값·임시 picker·자동 제출·명시적 재저장을 각각 확인한다.
- 일정과 경비의 pending 중 중복 제출·닫기 방지 차이를 실제 구현에 대조한다.
- 장소 검색의 initial query, 닫기·재열기와 선택 결과의 수명을 부모 소비자까지 연결한다.
- 도시 날짜 경계와 일반 시각의 DST 공백, client·server 호환 입력, Local 반환과 전체 entity 입수 검증을 구별한다.
- Trip 갱신 경로와 지도 만료 metadata·실제 cleanup 판정의 차이를 설명한다.
- 옛 본문·결정과 archive가 현재 제품 의미를 소유하거나 일반 읽기 경로에 남지 않는다.
- 기존 테스트와 임시 probe가 입증한 범위, 실제 앱·DB·network에서 확인하지 않은 범위를 실제 결과에 남긴다.

제품 결함 수정이나 결제일·사용일, 복수 도시 시간대 같은 열린 제품 선택은 문서 이관 완료로 대신하지 않는다.

## 현재 상태와 실제 결과

[작성·입력 기준](../../../../../../project/guidance/writing-and-input/INDEX.md)은 공통 책임과 초안·장소·picker 본문을 연결하고, [날짜와 시각](../../../../../../project/common/date-and-time.md)은 기존 Owner를 유지하면서 필드·저장 경계와 시간대 의미를 바로잡았다. Ticket 05의 UI 본문도 새 picker·초안 Owner로 직접 연결했다. 상세 판단, 원본 대응과 실행 근거는 [이관 결과](../../../output/ticket-06-result.md)가 맡는다.

경비 수정은 같은 data로 `isOpen`만 바꾸면 편집값을 유지하지만 실제 부모가 닫을 때 선택 항목을 `null`로 만들므로 재열기에서는 원본으로 reset한다. 일정 수정은 같은 data를 유지해도 닫기·재열기로 reset한다. 일정의 offline·unknown policy 전환에서는 입력 영역과 저장 버튼이 숨겨지지만 제어된 제목과 확정 시각은 유지되고 자동 mutation 없이 online 복귀 후 명시적 저장 payload로 전달된다. 열린 TimeField의 임시 선택은 해제된다. 이는 내부 값 보존 관찰이며 입력 표시·편집 계약의 충족을 뜻하지 않는다.

경비는 ref로 중복 제출과 Drawer 닫기를 막지만 일정 수정은 저장·취소 버튼만 잠그고 Drawer 종료를 막지 않는다. 수정 장소 검색은 닫힐 때 부모가 해제되고 `initialQuery`도 Modal에서 사용하지 않아 재열기에서 빈 검색으로 시작한다. 장소 상세 실패 시 0/0 좌표가 남는 문제도 제품 차이로 유지한다.

도시 날짜 시작은 자정이 DST 공백이면 첫 유효 시점을 사용하고 날짜 전체가 없으면 거절한다. 이는 임의 일정 시각의 DST 공백 거절과 다르다. server의 legacy Trip schema는 과거 queue 여부를 판별하지 않고 전체 POST 요청의 누락·`null` 시간대를 수용한다. Local Schedule 반환 검증은 `scheduledAt`에 한정되며 전체 entity 시점 검사는 activation·pull의 별도 경계다. 활성 Trip Local update와 pull·upsert에서 만료 metadata가 갱신되는 범위도 다르고 실제 cleanup은 최신 Trip으로 만료를 다시 계산한다.

옛 form·manual-input·time 본문과 경비 초안·날짜, 여행 도시 시간대 결정 6개는 안내문 뒤 원문을 보존한 archive로 옮겼고 옛 경로는 제거했다. Project·context 지도, client·server·schema·UI guide, 관련 runbook·command와 선택된 live consumer의 읽기 경로는 현재 Owner로 전환했다. 역사 Work 자료를 일괄 최신화하거나 compatibility stub을 만들지는 않았다.

Main 결과 문서에 따르면 중복 실행을 제외한 기존 client 16 suites·175 tests와 server 8 suites·57 tests가 통과했고, 실제 RHF·Policy와 대역 mutation·Drawer·picker를 사용한 임시 probe 4개도 통과했다. 변경 문서 상대 링크 594개, `git diff --check`, 관련 explicit·default Recover와 원본 보존·대표 읽기 검증도 통과했다. 독립 검토·검증은 필수 수정이나 Ticket 06 범위의 blocking 발견을 남기지 않았다.

검사는 전체 client·server suite, 실제 native 앱, PostgreSQL·JWT, 서버 저장 성공이나 실제 network 단절·재접속 sync를 입증하지 않는다. 임시 probe는 저장소의 지속 테스트로 추가되지 않았다. 전체 Harness 검사는 역사 링크 오류 37건 때문에 실패했고 default 001 Verify 선언의 기존 누락 입력 8개도 남아 있다. 제품 코드와 지속 테스트는 변경하지 않았고 Ticket 06 변경은 아직 커밋하지 않았다. 다음 문서 이관은 Ticket 07의 통화·API·오류다.
