# 여행 생성·목록 갱신의 책임과 검증

제품 커밋은 `ef47b87`이다. 날짜 차이를 새 여행으로 확인하다 드러난 생성·수정·삭제와 목록 갱신의 연결을 수정했다. 홈·목록의 날짜 해석 자체는 아직 수정하지 않았다. 이 기록은 Ticket 06의 선행 결함 수정과 설계 교정 근거이며 Ticket 전체 수락 기록은 아니다.

## 시작 장면과 기존 계약

활성 파리 여행이 있는 상태에서 새 비활성 여행을 만들면 기존 생성 Router가 다른 여행의 활성 여부만 보고 Local CREATE를 큐에 넣었다. 새 여행을 다시 읽거나 수정·삭제할 때는 대상 여행이 비활성이므로 Server로 향했다. CREATE가 전송되기 전에는 서버에 대상이 없어 후속 조작이 실패했다. 목록도 활성 여행이 하나라도 있으면 Local만 읽어 서버 변경을 따라가지 못했다. Trip 수정의 client PATCH와 server PUT 불일치도 확인했다.

새 여행은 아직 활성화된 대상이 없으므로 실제 online·서버 인증·debug 쓰기 제한을 Router에서 확인하고 Server에서 생성한다. 이미 활성화된 다른 여행의 유무는 생성 저장소를 바꾸지 않는다. 기존 여행의 단건 조회·수정·삭제는 대상 활성 여부에 따라 Local/Server를 고르는 기존 계약을 유지한다. 활성 여행의 Local 변경과 sync_queue 원자성도 유지한다.

## 책임 분리를 다시 고른 이유

처음에는 Server mutation마다 Local 사본을 함께 고쳤다. 하지만 사본 반영이 실패하면 목록 재조회가 Local만 읽어 회복할 수 없었고, 미전송 작업·선택 정리까지 mutation마다 고려해야 했다. 사용자가 기존 시스템과 책임 분리를 다시 검토하도록 요청한 뒤, **변경은 대상 저장소가 확정하고 목록 조회가 사본을 갱신하는 방식**으로 교체했다.

목록은 실제 online·signed-in이면 Server 전체 목록을 읽는다. Local datasource는 transaction 안에서 활성 여행과 Trip/Schedule/Expense의 남은 큐에 관련된 부모 여행을 보호하고 다른 사본을 반영한다. 큐의 대기·진행·실패 상태를 모두 보호하며 삭제 payload가 없어도 자식 행으로 부모를 찾는다. 서버에서 사라진 비활성 사본만 soft delete하고 큐를 새로 넣거나 지우지 않는다. 예전에 생긴 미전송 CREATE도 자동 폐기하지 않는다.

결과는 local/remote/mixed로 구별한다. mixed는 서버 확인을 마쳤지만 일부 로컬 원본을 보존한 목록이다. 따라서 성공한 remote/mixed 결과는 사라진 선택을 정리할 수 있고, local 결과만으로 서버에서 삭제됐다고 판단하지 않는다. 서버 빈 목록은 HTTP 200과 빈 배열로 반환한다.

## useGetTrips와 refresh 분리를 다시 검토한 이유

같은 대화에서 사용자는 “다른 곳은 이렇게 안한느것 같은데 tirp만이러니까 우려돼서 물어봈어”, “일부 로직은 여행 특성상 당연히 달라야하지만 지금은 일관성을 제대로 인지하지 못한것 같아 다시 고민하고 수정해봐”라고 정정했다. 이어 “왜 저 리프레시만 따로 뽑은거야? 해당 로직들이 다 리프레시 관련한거였어?”라고 책임 경계를 확인했다.

중간 구현은 useGetTrips에서 network/auth를 조합해 조건별 Query key를 만들고 staleTime을 0으로 바꿨다. 활성 여행이 없는 상태에서 offline/unknown이 되면 다른 캐시로 이동해 이미 알고 있던 목록이 undefined가 되는 실패를 테스트로 재현했다. 이 구현을 제거했다.

최종 역할은 다음과 같다.

| 코드 | 맡는 역할 |
| --- | --- |
| useGetTrips | 단일 목록 key와 기존 5분 staleTime으로 Repository 결과를 조회·전달한다. Query signal도 전달한다. |
| application/useTripListRefresh | 로그인한 앱에 한 번 연결돼 실제 network/auth 상태 변화 때 목록 취소·갱신을 알리고 해제 시 구독을 정리한다. |
| Activation Router | 실행 순간의 인증·실제 연결·활성 상태로 접근과 저장소를 결정한다. |
| Trip Repository와 Local datasource | 서버 응답을 받아 보호할 로컬 원본과 조합하고 transaction으로 사본을 반영한다. |

이때 추출한 것은 네트워크·인증 변화와 목록 새로고침의 연결이다. 전체 Trip 로직을 refresh 책임으로 묶은 것이 아니다. 특정 여행의 일정·경비 접근을 판단하는 useAppPolicy/useTripReadAccess를 계정 전체 기본 목록에 억지로 적용하지 않고, 기존 Entity 조회 hook과 같은 단순한 경계를 유지했다. 화면 override와 확인 진행만 바뀌면 목록을 새로 요청하지 않는다.

## 조회 취소와 장애 처리

성공한 생성·수정·삭제·활성 변경 뒤에는 기존 `cancelAndInvalidateQueries`를 재사용한다. 이 helper는 앞선 `669aad1`에서 도입됐으며 이번에 새 취소 체계를 만든 것이 아니다. 이전 조회 결과가 성공한 변경을 다시 가리는 것을 막고 새 조회를 시작한다. mutation이나 큐 작업을 취소하는 동작은 아니다.

Query 취소는 HTTP 전송 중단까지 보장하지 않는다. 목록 사본 반영 전후에는 취소 signal과 같은 세션인지 검사해 오래된 응답을 반영하지 않게 한다. 최초 조회 중 변경, 단절 중 느린 응답, 재인증과 복구는 자동 검사에 포함했다.

인터넷 감지가 online이어도 API 네트워크 오류·408·5xx이면 같은 세션의 활성 여행이 있을 때 Local 목록으로 이어간다. 인증·응답 계약·미분류 오류와 Local 반영 실패를 숨기지 않으며 전역 네트워크 상태를 바꾸지 않는다. Router의 오류 참조가 HTTP client 초기화를 일으키지 않도록 APIError 정의를 별도 파일로 옮기고 기존 export는 유지했다.

## 확인한 결과와 증거의 한계

최종 client 전체 Jest는 **52 suites / 583 passed / 1 skipped**다. 변경 파일 형식·diff 검사와 ESLint는 오류 없이 통과했고 `_layout.tsx`의 기존 non-null assertion 경고는 남았다. useGetTrips 선언 생성 TS4023은 TripListResult export로 해결했다. 전체 client 타입·선언 검사에는 기존 Mapbox tuple·OfflinePack 필드 및 UI package rootDir/file-list 오류 7건이 남고, server 타입 검사에는 기존 Places Language 오류가 남는다. server 빈 목록 route 검사 1개와 server build는 통과했다. 이 커밋 요청에서는 이미 실행한 결과와 diff를 확인했으며 전체 검사를 중복 실행하지 않았다.

- [Trip lifecycle 검사](../../../../../apps/client/tests/entities/trip/trip-lifecycle.test.ts): 실제 Node SQLite와 HTTP 대역으로 생성·수정·삭제 후 재조회, 로컬 원본·세 종류 큐 상태·자식 큐 부모·미전송 삭제 보존, 세션·취소 경계를 검사한다.
- [앱 목록 갱신 검사](../../../../../apps/client/tests/application/trip-list-refresh.test.tsx): 실제 Query·Store·Router와 HTTP/DB 대역으로 목록 유지·복구, 느린 최초 조회, 재인증, 여러 소비자 공유, 불필요한 갱신 억제·구독 해제를 검사한다.
- [서버 빈 목록 검사](../../../../../apps/server/tests/routes/trips.list.test.ts): DB·인증 대역과 Express 요청으로 HTTP 200 빈 배열을 확인한다.

재실행 진입점은 repo root에서 `pnpm --filter @apps/client test --runInBand`, `pnpm --filter @apps/server test tests/routes/trips.list.test.ts`, `pnpm --filter @apps/server build`다. 테스트 파일이 실제 무엇을 쓰고 무엇을 대역으로 바꾸는지 위 범위를 함께 적용한다.

iPhone 15 Pro 개발 앱에서는 Repository mutation 뒤 기존 Query invalidate로 신규 생성·종료일 수정·삭제를 실행했고 mixed 목록 반영과 삭제 후 기존 파리 선택 복귀를 확인했다. 테스트 여행은 soft delete로 정리했고 해당 큐는 비어 있었다. 앱 삭제는 하지 않았다. **이 관찰은 추가 취소·네트워크 전환·API 장애 수정 전 버전**이다. 최종 수정은 자동 검사로 확인했으며 생성/수정 폼 전체 조작이나 실제 통신 단절을 native에서 재검증한 것은 아니다.

## 다음 작업에 남기는 범위

홈의 파리 기간 9/30~10/2와 목록의 9/29~10/1은 같은 timestamp의 현지/UTC 해석 차이다. 새 데이터 검증 도중 생성 경로 결함을 먼저 고친 것이며, Trip 기간의 달력 날짜 의미·입력·대표 여행·활성 만료를 함께 판단할 일은 남았다.

그 밖에 실제 단절 Local 저장, 열린 폼의 연결 전환, 최종 Trip 폼 전체·새 activation 확인과 종합 UX 수락은 남는다. 서버에 없어진 활성 여행의 충돌 해결, 생성 응답을 잃은 뒤 재시도 시 중복 생성 방지까지 이번 수정이 보장하지 않는다. 기존 경비 삭제 실패 이유 유실·상세 재시도 불일치는 사용자 보류를 유지한다. 07·14·15·16·17 전체를 이번 커밋으로 완료하지 않는다.

사용자는 “그래 작업한거 커밋하고 기록할거 잘 워크스페이스에 남겨줘”라고 요청했다. 이에 제품·정책 설명을 위 커밋으로 저장하고 이 기록과 Ticket·state·output을 수동 Maintain guarded apply로 연결했다. 자동 session binding, machine status와 Verify receipt는 바꾸지 않는다.
