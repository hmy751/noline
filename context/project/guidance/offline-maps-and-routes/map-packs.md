# 지도 파일의 준비와 정리

지도 다운로드·공유·준비 표시·삭제를 바꿀 때 읽는다. **native pack의 실제 상태와 SQLite metadata를 함께 확인한다.** metadata만 남거나 pack만 남는 경우가 있어 한쪽의 존재로 다른 쪽을 추정하면 복구와 공간 회수 판단이 틀릴 수 있다.

## 다운로드를 바꾸면 실제 완료와 재사용 조건을 확인한다

현재 진입은 [여행 활성화](../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)이며 첫 일정 생성이 아니다. [다운로드 helper](../../../../apps/client/src/shared/services/offline-map/download.ts)는 Trip의 cityId·destination·좌표를 읽고 도시별 `offline_city_${cityId}` 이름을 사용한다. 도시 중심에서 위도·경도 각각 ±0.09도의 사각 범위, Streets v11, zoom 10–16을 요청한다. 코드의 radiusKm=10이라는 이름을 정확한 반경 10km 원형 보장으로 설명하지 않는다. 실제 거리와 필요한 일정 범위는 위도·zoom·이동 지역에 따라 달라진다.

처리는 세 갈래다. offlineCities 행이 있으면 referenceCount를 올리고 mapDownloaded를 기록한다. 행이 없고 같은 이름의 native pack이 있으면 그 pack을 재사용한다. 둘 다 없으면 createPack을 요청한 뒤 등록된 pack을 찾아 metadata와 flag를 기록한다. 앞의 두 재사용 경로와 새 등록 경로 모두 실제 다운로드 완료를 판정하는 조건이 없다.

설치된 SDK의 iOS 구현은 로딩을 시작한 뒤 createPack을 반환하고, 진행·완료 이벤트는 나중에 전달한다. 현재 helper의 `await createPack`과 getPacks 조회는 tile 완료 대기가 아니다. progress callback은 syncProgress를 갱신하지만 mapDownloaded 기록을 완료 이벤트에 묶지 않는다. 오류 callback에서 throw하는 것도 외부 요청 Promise가 실패 결과를 받는다는 보장은 아니다. 실패·재시도를 손볼 때는 등록, 진행, 완료, 실패를 각각 어떤 호출자가 관측하는지 확인한다.

기존 metadata의 재사용에는 pack 존재 확인이 없고, 기존 pack의 재사용에는 완료 확인이 없다. 같은 여행의 반복 요청을 한 번으로 합치거나 여행별 획득 관계를 기록하는 구조도 없다. 재활성화는 지도 helper를 재호출하지 않으므로 현재 활성화 버튼을 범용 지도 복구 기능으로 안내하지 않는다.

## 저장 위치를 바꾸면 두 저장소의 불일치 복구를 함께 설계한다

실제 지도 자원은 Mapbox native 저장소가, 도시·범위·공유 수 같은 앱 조회 정보는 [offlineCities schema](../../../../apps/client/src/shared/db/schema.ts)가 맡는다. DB 초기화만으로 native pack이 지워지지 않으므로 같은 이름의 중복 등록이나 metadata 누락이 생길 수 있다. 반대로 metadata만 존재할 때 준비됐다고 판단하면 실제 오프라인 지도가 없을 수 있다.

현재 다운로드 코드의 `pack.size`·`pack.tileCount`는 설치 SDK OfflinePack의 상태 API와 맞지 않아 저장량·타일 수를 신뢰할 근거가 되지 못한다. 용량 화면은 별도로 `pack.status()`의 completedResourceSize를 읽는다. 표시를 바꿀 때는 [저장 용량 집계](../../current/storage-statistics.md)의 부분 실패·유효 숫자 판정 범위를 따른다.

지도 초기화 오류를 조사할 때는 앱 루트의 Mapbox 토큰 설정과 실제 환경 변수 `EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN`, DB 준비, pack 이름과 bounds 입력을 확인한다. 예전 문서의 zoom 변경이나 토큰명 예제를 그대로 재현하지 않는다. 현재 초기화 책임은 [앱 실행](../../current/app-runtime/INDEX.md)이 맡는다. 토큰 문제를 해결했다고 다운로드 범위·native 오프라인 표시까지 검증한 것으로 보지 않는다.

## 공유 지도를 정리할 때 참조 수와 파일 삭제를 따로 확인한다

도시별 공유는 같은 도시의 여행마다 파일을 중복 다운로드하지 않으려는 선택이다. 현재 referenceCount는 여행별 소유 관계 테이블에서 도출되지 않는다. 다운로드 재사용은 호출마다 증가시키고, 여행별 cleanup은 감소시키며, 만료 reconcile은 같은 도시의 만료되지 않은 비삭제 여행 수로 다시 계산한다. 활성화·실제 획득 여부까지 같은 의미로 세는 값이 아니므로 정확한 소유 여행 수로 간주하지 않는다.

| 정리 경로 | 현재 수행과 남는 차이 |
| --- | --- |
| [여행별 cleanup](../../../../apps/client/src/shared/services/offline-map/cleanup.ts) | 저장 count를 1 줄이고 남으면 metadata를 갱신한다. 0 이하면 native pack 삭제 후 metadata를 지운다. 오류는 로그로 흡수하며 mapDownloaded는 초기화하지 않는다. |
| 같은 모듈의 만료 reconcile | 해당 도시의 만료되지 않은 비삭제 여행 수를 센다. 0이면 metadata만 삭제하고 native pack은 남긴다. 날짜 없는 여행 등은 만료로 계산되지 않을 수 있다. |
| [디버그 지도 삭제](../../../../apps/client/src/features/debug/ui/DebugScreen.tsx) | native pack과 offlineCities를 지우지만 활성화 mapDownloaded는 초기화하지 않는다. 배지가 남을 수 있다. |

만료 정리는 앱의 [cleanup hook](../../../../apps/client/src/shared/services/offline-map/useOfflineMapCleanup.ts)이 지연 호출하며, hook 해제는 아직 시작하지 않은 타이머만 취소한다. 이미 시작한 작업의 세션 종료 합류 여부는 [앱 실행 수명](../../current/app-runtime/INDEX.md)과 함께 확인한다. 현재 파일 회수가 만료 시각에 자동으로 끝난다고 안내하지 않는다.

정리 변경은 같은 도시의 여러 여행, 반복 다운로드, metadata만 존재, native pack만 존재, 삭제 실패를 나눠 확인한다. 지도 자원 정리는 일정·경비의 미전송 보호를 대신하지 않으므로 [데이터 수명의 cleanup 계약](../data-lifecycle/INDEX.md)도 보존한다. 현재 준비 공백을 해결하려고 기록 데이터의 보존 약속을 약화하지 않는다.
