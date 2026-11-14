# 지도 파일의 준비와 정리

지도 다운로드·공유·준비 표시·삭제를 바꿀 때 읽는다. **native pack의 실제 상태와 SQLite metadata를 함께 확인한다.** metadata만 남거나 pack만 남는 경우가 있어 한쪽의 존재로 다른 쪽을 추정하면 복구와 공간 회수 판단이 틀릴 수 있다.

## 다운로드를 바꾸면 실제 완료와 재사용 조건을 확인한다

현재 진입은 [여행 활성화](../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)이며 첫 일정 생성이 아니다. [다운로드 helper](../../../../apps/client/src/shared/services/offline-map/download.ts)는 Trip의 cityId·destination·좌표를 읽고 도시별 `offline_city_${cityId}` 이름을 사용한다. 도시 중심에서 위도·경도 각각 ±0.09도의 사각 범위, Streets v11, zoom 10–16을 요청한다. 코드의 radiusKm=10이라는 이름을 정확한 반경 10km 원형 보장으로 설명하지 않는다. 실제 거리와 필요한 일정 범위는 위도·zoom·이동 지역에 따라 달라진다.

도시 ID로 만든 이름으로 Mapbox에 등록된 pack을 확인한다. 있으면 재사용하고, 없으면 새로 등록한다. 이전 설치의 SQLite에 도시 행만 남았을 때도 같은 확인을 거친다. 시작한 세션·여행·준비 ID가 여전히 유효하면 여행의 보유 표시와 도시의 공유 수를 한 transaction에 기록한다.

설치된 SDK의 iOS 구현은 로딩을 시작한 뒤 createPack을 반환하고, 진행·완료 이벤트는 나중에 전달한다. 현재 helper의 `await createPack`과 getPacks 조회는 tile 완료 대기가 아니다. progress callback은 syncProgress를 갱신하지만 mapDownloaded 기록을 완료 이벤트에 묶지 않는다. 진행·오류 이벤트와 실제 완료 여부는 별도로 확인한다.

해제 후 다시 활성화하면 지도 준비가 시작된다. 이미 활성인 여행에 다시 활성화 요청을 보내는 경로에서는 기존대로 경로 준비만 호출한다.

## 저장 위치를 바꾸면 두 저장소의 불일치 복구를 함께 설계한다

실제 지도 자원은 Mapbox native 저장소가, 도시·범위·공유 수 같은 앱 조회 정보는 [offlineCities schema](../../../../apps/client/src/shared/db/schema.ts)가 맡는다. DB 초기화만으로 native pack이 지워지지 않으므로 같은 이름의 중복 등록이나 metadata 누락이 생길 수 있다. 반대로 metadata만 존재할 때 준비됐다고 판단하면 실제 오프라인 지도가 없을 수 있다.

현재 다운로드 코드의 `pack.size`·`pack.tileCount`는 설치 SDK OfflinePack의 상태 API와 맞지 않아 저장량·타일 수를 신뢰할 근거가 되지 못한다. 용량 화면은 별도로 `pack.status()`의 completedResourceSize를 읽는다. 표시를 바꿀 때는 [저장 용량 집계](../../current/storage-statistics.md)의 부분 실패·유효 숫자 판정 범위를 따른다.

지도 초기화 오류를 조사할 때는 앱 루트의 Mapbox 토큰 설정과 실제 환경 변수 `EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN`, DB 준비, pack 이름과 bounds 입력을 확인한다. 예전 문서의 zoom 변경이나 토큰명 예제를 그대로 재현하지 않는다. 현재 초기화 책임은 [앱 실행](../../current/app-runtime/INDEX.md)이 맡는다. 토큰 문제를 해결했다고 다운로드 범위·native 오프라인 표시까지 검증한 것으로 보지 않는다.

## 공유 지도를 정리할 때 참조 수와 파일 삭제를 따로 확인한다

같은 도시의 획득과 반납은 [도시별 작업 순서](../../../../apps/client/src/shared/services/offline-map/city-sharing.ts)를 따르며 마지막 Mapbox 삭제가 끝난 뒤 다음 획득을 시작한다. 지도를 획득하거나 반납할 때는 그 도시에 `mapDownloaded` 표시가 있는 여행을 센다. 만료 정리는 같은 숫자를 미만료 여행 수로 덮어쓸 수 있어, 반납할 때 저장된 숫자에서 1을 빼면 B가 보유한 지도까지 지울 수 있다.

| 정리 경로 | 현재 수행과 남는 차이 |
| --- | --- |
| [여행별 cleanup](../../../../apps/client/src/shared/services/offline-map/cleanup.ts) | A의 사본 정리 뒤 같은 준비 ID가 여전히 비활성이고 정리 예약이 해제됐는지 확인한다. A가 지도를 보유 중이면 A의 표시만 내린다. 같은 도시의 B가 보유 중이면 파일을 유지한다. 마지막 반납 때 도시 행과 pack 이름이 남아 있으면 native 목록에서 해당 파일을 찾아 삭제한 뒤 도시 행을 지운다. 만료로 도시 행이 먼저 사라졌으면 파일이 남을 수 있고, native 삭제가 실패하면 공유 수 0인 도시 행과 파일이 남을 수 있다. |
| 같은 모듈의 만료 정리 | 여행 종료 후 현지 날짜로 7일의 유예 기간이 지나면, 해당 도시에서 삭제되지 않은 미만료 여행을 센다. 남아 있으면 그 수를 도시 행에 기록하고, 0이면 도시 행만 지운다. 두 경우 모두 여행별 보유 표시와 Mapbox 파일은 그대로 둔다. |
| [디버그 지도 삭제](../../../../apps/client/src/features/debug/ui/DebugScreen.tsx) | native pack과 offlineCities를 지우지만 활성화 mapDownloaded는 초기화하지 않는다. 배지가 남을 수 있다. |

만료 정리는 앱의 [cleanup hook](../../../../apps/client/src/shared/services/offline-map/useOfflineMapCleanup.ts)이 지연 호출하며, hook 해제는 아직 시작하지 않은 타이머만 취소한다. 이미 시작한 작업의 세션 종료 합류 여부는 [앱 실행 수명](../../current/app-runtime/INDEX.md)과 함께 확인한다. 현재 파일 회수가 만료 시각에 자동으로 끝난다고 안내하지 않는다.

정리 변경은 같은 도시의 여러 여행, 반복 다운로드, metadata만 존재, native pack만 존재, 삭제 실패를 나눠 확인한다. 지도 자원 정리는 일정·경비의 미전송 보호를 대신하지 않으므로 [데이터 수명의 cleanup 계약](../data-lifecycle/INDEX.md)도 보존한다. 현재 준비 공백을 해결하려고 기록 데이터의 보존 약속을 약화하지 않는다.
