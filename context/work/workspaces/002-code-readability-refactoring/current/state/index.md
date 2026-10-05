# 현재 상태와 다음 행동

## 현재 위치

제품 브랜치는 `refactor/app-startup-lifecycle`이다. Ticket 06의 홈 요약(`e54fe42`)·앱 복귀 재확인(`d588a19`)에 이어, 새 여행 생성 경로와 목록 갱신 책임을 `ef47b87`에 저장했다. 날짜 비교를 새 데이터로 확인하던 중 드러난 생성·수정·삭제 연결 결함을 해결한 결과다. Ticket 06과 Workspace 전체는 진행 중이다.

현재 실행 정의와 결과는 [Ticket 06](../memory/tickets/06-app-startup-lifecycle.md), 이번 설계 교정·검증 한계는 [여행 생성·목록 기록](../../records/2026-10-05-01-trip-list-routing-and-query-lifecycle.md)에 있다.

## 현재 결과와 확인 범위

- 새 Trip은 Router의 인증·실제 online·debug 쓰기 제한을 통과해 Server에서 생성한다. 기존 활성 여행의 Local 조회·변경과 큐 계약은 유지한다. 수정 HTTP 요청은 서버 PUT에 맞췄다.
- 온라인 목록 조회가 서버 사본을 갱신하며 활성 여행과 미전송 Trip·Schedule·Expense 작업의 부모를 보호한다. 성공한 remote/mixed 목록으로 삭제된 선택을 정리한다. 서버 빈 목록은 HTTP 200이다.
- useGetTrips는 단일 key·기존 5분 staleTime으로 조회하고 application/useTripListRefresh가 network/auth 변화 때 갱신을 한 번 연결한다. Router가 접근·저장소를 판단하며 Entity hook에 조건을 복제하지 않는다. 성공한 mutation 뒤에는 기존 취소·무효화 helper를 사용한다.
- 최신 client 전체 검사는 52 suites / 583 passed / 1 skipped다. 변경 파일의 형식·lint 오류는 없고 기존 경고 1개가 남는다. useGetTrips 선언 생성 오류는 해결했으나 client 타입·선언 검사의 기존 7건과 server Places Language 타입 오류는 남는다. server 빈 목록 검사·build는 통과했다. 제품 Verify receipt는 생성하지 않았다.
- 시뮬레이터의 Repository 생성·수정·삭제와 mixed 목록·선택 복귀는 추가 취소/네트워크 수정 전 버전에서 확인했다. 최종 수정의 연결 전환·API 장애·캐시 보존은 자동 검사 근거이며 최종 native 전체 흐름을 확인한 것은 아니다.

홈 요약의 공동 제한·부분 실패 표시와 기존 조회 결과 재사용은 유지한다. foreground는 Network Store의 기존 세션이 복귀를 구독해 refresh를 실행한다. 두 차례 시뮬레이터 복귀에서 각각 1회 호출한 근거와 실제 단절 미확인은 [복귀 기록](../../records/2026-10-04-02-foreground-network-refresh.md)에 있다. 홈·비활성 목록·상세·picker 부분 관찰은 [홈 기록](../../records/2026-10-04-01-home-summary-policy-and-ux-review.md)을 따른다.

## 다음 행동과 명시적 보류

다음은 원래 확인하던 **Trip 기간의 날짜 의미와 홈·목록 표시 차이**를 이어 판단하는 것이다. 파리의 홈 9/30~10/2와 목록 9/29~10/1은 같은 timestamp의 현지/UTC 해석 차이다. 생성·목록 수정으로 날짜 문제가 해결됐다고 보지 않는다. 입력·대표 여행·활성 만료와 함께 의미를 정한 뒤 관련 표시를 맞춘다.

실제 단절 Local 저장, 열린 폼의 연결 전환, 최종 Trip 생성/수정 폼 전체, 일정 전체 native 작성·picker와 새 activation 전체 검증은 남는다. 서버에서 사라진 활성 여행의 충돌 해결과 생성 응답 유실 후 중복 방지까지 이번 목록 변경의 보장으로 확대하지 않는다. 남은 범위·검증 한계·보류를 종합해 06 종료를 판단하며 바로 07로 넘어가지 않는다.

경비 삭제 실패 이유 유실·상세의 특정 재시도 불일치는 사용자 보류를 유지한다. 해결·폐기 또는 다음 작업의 필수 선행으로 바꾸지 않는다. 복구 토스트 2-C는 현재 추가하지 않는다.

## 후속 Ticket과 실행 환경

01~05의 기존 수락 범위를 유지한다. 일정 생성·Places(`78acff5`), 경비 날짜(`4646752`), 일정 시각·입수 계약(`d823b41`), 경비 초안·일정 연결(`a8e60a7`)의 결과도 유지한다. 열린 초안 보존, 경비 날짜와 일정 연결 독립성, 활성 여행 Local 이용이 계속 유효하다. [경비·시간 기록](../../records/2026-10-02-03-expense-time-decisions-and-verification.md)에 앞선 실앱·DB 증거가 있다.

여행 생성·PUT·목록 갱신 선행 결과는 후속 Ticket이 재사용하되 07의 저장 후 연결, 08의 대표 여행 계산, 10·11의 전체 폼, 14의 Local 원자성·cache, 15의 sync, 16의 cleanup, 17의 나머지 서버 계약은 남는다. 여행 기간 밖 일정 접근·500ms 경로 준비·정상 0 좌표·검색 부분 성공·수정 fallback 등 기존 미완료도 유지한다.

여행 검증용 데이터는 soft delete했고 해당 큐는 비어 있었다. 원래 활성 파리로 선택이 복귀했으며 앱 삭제는 하지 않았다. 이전 테스트 경비는 삭제하지 않았다. 앱·서버·Metro가 다음 실행에도 살아 있다고 가정하지 않는다.

자동 Maintain unbound 상태에서 사용자 기록 요청에 따라 수동 guarded apply로 반영했다. 자동 연결·기계 상태·receipt·active index는 변경하지 않았다.
