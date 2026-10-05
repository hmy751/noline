# 비활성 Trip 생성과 여행 목록 조회의 책임

2026-10-04. 활성 여행은 Local, 비활성 여행은 Server라는 기존 원칙에 생성과 목록 갱신을 맞춘다. 현재 기준은 [Data Layer Guide](../context/selective-activation-architecture.md#router-사용-기준)가 소유한다.

## 문제와 결정

다른 여행이 활성화된 상태에서 새 비활성 Trip을 만들면 기존 생성 라우터는 Local CREATE를 대기열에 넣었다. 대상 여행 기준의 수정·삭제는 Server로 가므로 CREATE 전송 전 삭제가 실패했다.

새 Trip은 Router가 인증·실제 온라인·debug 쓰기 제한을 확인한 뒤 서버에서 생성한다. 기존 Trip의 수정·삭제는 대상 활성 여부 기준을 유지하고, 활성 여행의 Local mutation과 원자적 큐 기록도 유지한다. Trip HTTP 수정 요청은 기존 서버의 PUT에 맞춘다.

첫 수정안은 서버 mutation마다 로컬 사본을 갱신했으나, 캐시 반영 실패 후 목록 새로고침이 로컬만 읽어 회복되지 않았고 미전송 비활성 변경·여행 선택과의 연결도 부족했다. 사용자가 책임 분리 검토 뒤 목록 조회 중심의 개선을 채택했다.

- Mutation은 해당 저장소의 변경을 확정하고 기존 Query hook이 `cancelAndInvalidateQueries`로 이전 조회를 취소한 뒤 목록을 갱신한다. 활성화 변경도 같은 helper를 사용한다.
- 실제 online·서버 인증 상태에서 목록 조회가 서버 목록을 가져온다. Local datasource가 transaction 안에서 활성 여행과 미전송 작업의 부모 여행을 보존하며 나머지 사본을 갱신한다.
- Trip 큐뿐 아니라 Schedule/Expense 큐의 부모도 보존한다. 전송 대기·진행·실패를 모두 포함한다. 미전송 로컬 삭제는 서버에 남아 있어도 재등장시키지 않는다.
- 서버에서 사라진 비활성 사본은 soft delete하고 큐는 그대로 둔다. 서버의 빈 여행 목록은 성공한 빈 배열로 반환한다.
- 결과 출처 local/remote/mixed를 구별한다. 서버 확인을 마친 mixed 목록도 삭제된 선택을 정리할 수 있다.
- 세션과 Query 취소를 반영 전후 확인해 늦은 목록 응답이 사본을 덮지 않게 한다. 여행 목록은 단일 Query key와 기존 5분 staleTime을 사용한다. 앱의 로그인 후 연결부에서 실제 네트워크·인증 상태 변화를 한 번 구독해 목록을 취소·갱신하며, 각 화면의 조회 훅은 실행 조건을 계산하지 않는다.
- 온라인 감지 중에도 API 네트워크 오류·시간 초과·5xx가 발생하면 같은 세션의 활성 여행이 있을 때 로컬 목록을 제공한다. Router는 부작용 없는 API 오류 타입만 참조한다.

이 구성은 별도 전역 Store나 sync engine의 전체 개편을 요구하지 않는다. 이미 남아 있는 미전송 CREATE는 일반 큐 보존 대상으로 두며 자동 폐기하지 않는다.

## 검증 경계

`apps/client/tests/entities/trip/trip-lifecycle.test.ts`는 실제 SQLite에서 서버 생성·재조회·수정·삭제, 활성 여행·세 종류 큐 상태·자식 큐 부모·미전송 삭제 보존, 다른 계정/세션·취소 응답 차단, 서버 오류 후 재조회 복구를 검사한다. HTTP는 대역이다. Query와 Router 검사는 연결 복구와 mixed 목록의 선택 전환을 포함한다. Server route 검사는 마지막 여행 삭제 후 빈 목록의 HTTP 200 계약을 확인하고 DB·인증은 대역이다.

인증·응답 계약·미분류 오류와 로컬 반영 실패는 Query 오류다. 통신 장애 시 제공하는 Local 목록은 마지막 서버 조회의 사본과 로컬 원본이며 서버 최신 목록을 보장하지 않는다. 서버에 없어진 활성 여행의 폐기·충돌 해결은 이번 변경에서 결정하지 않는다.

추가 코드 검토에서는 최초 조회 중 mutation/활성화 변경 후 오래된 응답 사용, 조회 도중 단절 시 로컬 전환 누락, 온라인 감지 중 API 장애가 활성 여행 목록을 가리는 문제를 실패하는 테스트로 재현한 뒤 수정했다. 인증·미분류·응답 계약 오류가 로컬 fallback으로 숨겨지지 않는지도 검사한다.

2026-10-05 사용자가 다른 Entity 조회와의 일관성을 다시 검토하도록 요청했다. 온라인·인증 조건을 Entity 훅에서 조합해 key를 나누던 중간 구현은 활성 여행 없이 offline/unknown으로 전환하면 기존 목록이 undefined가 되는 문제를 재현했다. 조건별 캐시와 staleTime 0을 제거하고 `application/useTripListRefresh`로 갱신 계기를 한 번 연결했다. 여행 목록은 기본 정보를 유지하는 계정 전체 조회이므로 특정 여행의 일정·경비 접근 정책을 억지로 적용하지 않는다. 실행 경로는 Router가 계속 소유한다. 이는 조건식을 다른 훅으로 옮긴 것에 그치지 않고 단일 캐시·조회 유효기간·구독 수명을 기존 경계에 맞춘 변경이다.

`tests/application/trip-list-refresh.test.tsx`는 실제 Query·Store·Router에 HTTP·DB 대역을 연결해 활성 여행 없는 단절 시 목록 유지와 복구, 느린 첫 조회의 로컬 전환, 재인증, 여러 소비자의 요청 공유, 불필요한 갱신 억제와 해제 시 구독 정리를 검사한다. Entity 훅 검사는 데이터·출처 전달에 집중한다. `TripListResult`를 export해 useGetTrips의 선언 생성 TS4023도 수정했다.

최종 client 자동 검사: 52 suites, 583 passed, 1 skipped. Server 빈 목록 route 검사와 server build는 앞선 변경에서 통과했다. Client 전체 타입·선언 생성 검사는 기존 7건, server 타입 검사는 기존 Places Language 오류로 미통과이며 변경 파일의 추가 오류는 없었다.

iPhone 15 Pro 개발 앱에서 Repository mutation 뒤 기존 Query를 invalidate하는 방식으로 신규 생성·종료일 수정·삭제를 실행했다. 재조회 결과는 mixed였고 생성·수정 반영, 삭제 후 목록 제외와 선택의 기존 파리 여행 복귀를 확인했다. 테스트 여행은 soft delete로 정리했으며 해당 큐는 비어 있다. 이 실기 검사는 추가 코드 검토 전 버전에서 수행했다. 이후 취소·연결 전환·API 장애 수정은 자동 검사로 검증했고, 생성/수정 폼 전체 조작과 실제 통신 단절 재현은 포함하지 않았다.
