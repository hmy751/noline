# 09 — 일정 저장 이후 경로 준비 책임

## 맡은 결과와 범위

일정 생성·수정 성공 뒤 저장 결과, 최신 일정 목록 조립, 정렬·좌표 변환, route 준비 요청의 책임과 순서를 직접 읽을 수 있게 한다. create/update에 반복된 projection과 500ms timer 의존을 줄이고, 경로 생성 알고리즘과 기존 경로 재사용 규칙을 한 책임에서 수정할 수 있게 한다.

범위는 일정 생성·수정 mutation 성공 처리, `useAutoDownloadRoutes`, `downloadRoutesForSchedules`와 관련 route 저장·조회 코드 및 test다. 화면 입력의 초기화와 picker 의미는 [07번](07-schedule-form-lifecycle.md), 활성화 전체 완료 상태는 [14번](14-activation-readiness.md)이 맡는다.

## 실행 맥락과 접근

현재 생성과 수정은 각각 500ms 뒤 일정 projection·정렬·좌표 변환을 반복한다. 수정에서 새 장소를 선택해도 route 입력은 기존 query의 좌표를 사용할 수 있고, hook과 service에는 유사한 route 생성 흐름이 따로 있다. 한쪽은 기존 route 확인이 없고 다른 쪽은 schedule ID와 profile 중심으로 존재를 판단해 좌표·순서가 달라진 stale route를 재사용할 가능성이 있다.

[07번](07-schedule-form-lifecycle.md)에서 submit되는 좌표의 null/0 의미가 먼저 확정돼야 최신 저장 결과를 안전하게 조립할 수 있다. stale route 처리, 좌표 0과 timer 제거가 실제 결과를 바꾸는 결함이라면 Main은 별도 결함 Work의 기대 결과와 담당을 먼저 정한다. 그 결정 전에도 중복 흐름의 특성화는 가능하지만 최신 경로 보장까지 완료할 수 없다.

## 완료 조건과 확인 방법

- 일정 생성, 시간 변경으로 순서가 바뀌는 수정, 장소 좌표 변경, 좌표 없는 일정, 일부 route 다운로드 실패의 최종 segment와 결과를 비교한다.
- mutation 성공 callback은 저장된 최신 결과를 기준으로 route 준비를 시작하며 임의 지연 시간에 correctness를 의존하지 않는다.
- create/update/activation이 공유하는 route segment 계산과 저장 규칙의 수정 지점이 줄고, 필요한 차이는 호출부에서 드러난다.
- 기존 route의 재사용·교체 조건과 부분 실패 반환이 명시돼 있고 별도 결함 판단이 필요한 조건은 해결 전 완료로 닫지 않는다.
- service Jest와 mutation callback integration fixture, 관련 정적 검사를 실행하고 실제 Mapbox 연결 미확인을 남긴다.

## 현재 상태와 실제 결과

Ticket 문서만 구성했고 제품 구현·검증은 시작하지 않았다. 07의 입력 계약과 stale route 결함 판단이 선행하며 사용자 수락은 없다.
