# 저장 경로를 현재 일정에 맞게 사용한다

일정 생성·장소/시각 수정·삭제, 경로 준비와 표시를 바꿀 때 읽는다. **경로는 현재 일정의 좌표·인접 순서·이동수단에 맞는 사전 계산 결과여야 한다.** 저장 row 존재나 다운로드 함수의 정상 반환만으로 최신성과 준비 범위를 판단하지 않는다. 아래의 현재 차이는 구현 보완 대상이며 허용할 제품 품질로 채택한 규칙이 아니다.

## 준비 계기를 바꾸면 저장 성공과 후속 계산을 구별한다

[생성 제출](../../../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)과 [수정 화면](../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)은 저장 성공 뒤 여행 ID로 경로 준비를 요청한다. 수정은 시각·좌표를 포함한 patch일 때만 요청하며 제목만 바꾸면 실행하지 않는다. 폼은 경로용 전체 일정 조회·정렬·좌표 변환을 맡지 않는다. 저장 성공과 닫기는 경로 준비 완료를 기다리지 않는다.

[활성화](../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)도 같은 downloader를 호출한다. downloader는 실행 시점의 소유한 활성 여행과 삭제되지 않은 Local 일정을 읽는다. 비활성 여행의 직접 서버 수정에서는 오래된 기기 사본으로 경로를 준비하지 않고, 다음 활성화에서 준비한다. 일정 저장·동기화의 성공을 외부 경로 서비스 성공에 종속시키지 않는다.

계산 범위는 지도 표시와 같은 여행 현지 날짜별 일정이다. 저장된 시각을 기존 날짜 유틸로 해석하고 날짜 안에서 시각순으로 이웃을 정한다. 시간대 없는 기존 여행은 읽기 화면과 같은 UTC 호환 기준을 사용한다. 시간 변경으로 실제 이웃이 같으면 기존 결과를 재사용하며, 다른 날짜 사이의 표시하지 않는 구간은 준비하지 않는다.

## 생성·수정·활성화가 같은 재사용과 저장 규칙을 쓴다

walking·cycling·driving-traffic 세 profile을 계산한다. 각 결과에는 client generateId()로 만든 식별자, geometry·거리·시간·일정 ID 쌍·profile과 **계산에 사용한 양 끝 좌표 `coordinatesKey`**를 Local routes에 저장한다. 서비스 캐시이며 사용자 일정·경비와 같은 sync-owned 데이터가 아니다.

[useAutoDownloadRoutes](../../../../apps/client/src/entities/route/data/useAutoDownloadRoutes.ts)는 [공통 route-downloader](../../../../apps/client/src/shared/services/directions/route-downloader.ts)에 위임한다. 생성·수정·활성화가 같은 재사용·교체 규칙을 사용한다. [구간 유틸](../../../../apps/client/src/shared/services/directions/route-plan.ts)은 좌표 정규화, 인접 구간과 저장 결과의 일치 판단을 제공하며 지도 표시에서도 재사용한다.

- 현재 일정 ID 쌍·좌표·profile이 일치하고 삭제되지 않은 결과를 재사용한다. 같은 입력의 중복은 최신 행 하나만 남긴다.
- 더 이상 현재 구간이 아니거나 좌표가 바뀐 캐시는 transaction에서 제거한다. 필요한 구간의 없는 profile만 요청하고 성공분을 저장한다. 실패한 profile은 오래된 geometry로 대신하지 않는다.
- 경로 작업끼리만 계정·여행별로 직렬화한다. 네트워크를 기다리는 동안 일정 저장·삭제나 DB transaction을 잠그지 않는다. 요청 전과 최종 저장 전에 현재 일정·활성 상태·세션을 대조해 늦은 응답이 변경 전 경로를 되살리지 않게 한다.
- 구버전 행은 계산 당시 좌표를 추정하지 않는다. 추가 컬럼은 null로 시작하고, 다음 준비에서 새 결과로 교체한다. 사용자 입력이나 sync_queue는 이 정리 대상이 아니다.

개별 API 실패는 다른 구간의 준비를 중단하지 않는다. 다음 준비 요청에서는 성공한 결과를 재사용하고 누락분만 다시 시도한다. 반환값 `savedCount`는 이번 실행에서 새로 저장한 경로 수다. 모두 재사용했거나, 준비할 구간이 없거나, 개별 요청이 모두 실패해도 0일 수 있다. 이 값만으로 준비 완료를 표시하지 않는다. 다음 준비 요청 전까지 실패분의 자동 재시도나 실패 안내는 제공하지 않는다.

준비 작업이 실행될 때 자기 여행을 찾을 수 없거나 살아 있는 여행이 비활성이면 기존 경로 캐시를 보존한다. 자기 여행의 삭제를 확인했거나 활성 여행에 현재 계산할 구간이 하나도 없으면 기존 캐시를 정리한다. 두 경로 모두 새로 저장한 수는 0일 수 있다.

Directions 요청과 decode를 바꾸면 precision과 좌표 순서를 맞춘다. [API 요청](../../../../apps/client/src/shared/services/directions/mapbox.ts)은 polyline6를 요구하고 [decode helper](../../../../apps/client/src/shared/lib/mapbox.ts)는 precision 6으로 복원한 `[lat, lng]`를 지도용 `[lng, lat]`로 바꾼다. precision을 압축률의 우열로 설명하거나 일반 polyline 기본값으로 바꾸지 않는다.

## 표시를 바꾸면 저장 선과 직선 fallback의 의미를 드러낸다

[Mapbox 일정 지도](../../../../apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx)는 현재 인접 ID 쌍·양 끝 좌표·profile이 모두 맞는 저장 결과만 초록 실선으로 그린다. 일치하지 않거나 좌표 출처가 없는 구버전 결과만 있으면 현재 좌표 사이의 회색 점선을 표시한다. 조회 cache에 이전 행이 남아 있어도 표시 시점에 대조한다. 같은 입력의 중복 중에서는 최신 행을 선택한다. 이 일치는 계산 입력에 대한 보장이며 도로·교통 상황의 최신성까지 보장하지 않는다.

화면은 walking 기본과 세 profile 선택을 제공한다. 거리·시간은 저장된 구간만 합산하지만 일부 구간만 있어도 현재 “총 거리/예상 시간”을 표시한다. fallback 구간까지 포함한 완전한 합계로 해석하지 않는다. 누락 안내나 합계 표시를 고칠 때 전체 인접 구간과 저장된 구간의 차이를 확인한다.

[지도 container](../../../../apps/client/src/features/schedule/schedule-map-view/ScheduleMapViewContainer.tsx)는 선택 날짜의 일정을 표시하며 준비도 같은 현지 날짜 안의 인접 구간으로 제한한다. downloader와 renderer에 숙소→첫 일정 입력 지원은 있으나 현재 주요 호출부가 숙소 좌표를 넘기지 않으므로 일반 지원 기능으로 약속하지 않는다.

공통 downloader와 지도 renderer가 사용하는 인접 관계는 좌표가 있는 일정만 남긴 목록 기준이다. A(좌표 있음)·B(없음)·C(있음) 순서라면 B를 건너뛰어 A→C를 계산·표시한다. 이는 B를 지나는 이동 경로를 준비했다는 뜻이 아니다. 좌표가 없는 일정 자체에는 직선 fallback도 만들 수 없다. 숫자 0과 문자열 "0"은 구간 유틸과 Mapbox 표시에서 유효한 좌표로 취급한다. 구간 유틸에 전달된 빈 값·숫자가 아닌 값·범위 밖 좌표는 제외한다. 상위 지도 container의 기존 문자열 변환까지 엄격해졌다는 보장은 아니다. 장소 상세 실패를 0/0으로 대체하는 수정 adapter의 기존 의미는 이 숫자 유효성 검사와 별개의 문제다.

## 일정 변경과 삭제 뒤에는 인접 관계와 남은 경로를 확인한다

시간 수정은 정렬 순서, 장소 수정은 같은 ID의 좌표, 삭제는 새 이웃을 바꾼다. 준비 요청은 현재 Local 인접 관계와 좌표를 다시 대조해 영향받은 구간을 교체한다. 표시도 같은 조건을 대조하므로 새 경로 준비가 끝나기 전에는 점선을 사용할 수 있다.

[일정 삭제](../../../../apps/client/src/entities/schedule/data/useDeleteSchedule.ts)는 query를 무효화하지만 새 인접 구간을 준비하지 않는다. Local soft delete는 route 행을 직접 제거하지 않는다. schema의 ON DELETE CASCADE는 hard delete 관계이며 soft delete 전파가 아니다. route 자체에는 expiry가 없고 활성 metadata의 expiresAt 존재도 route 자동 정리를 의미하지 않는다. 현재 cleanup은 route를 직접 지우지 않으며 오래된 schedule의 hard delete와 실제 DB FK 동작에 영향을 받는다.

변경·삭제·정리를 검증할 때 같은 ID의 좌표 수정, 시간 역전, 중간 일정 삭제, 날짜 경계, 좌표 없는 중간 일정, 일부 profile 실패와 중복 row를 포함한다. native DB의 cascade 실행과 실제 오프라인 렌더는 schema 선언·mock hook 테스트만으로 입증하지 않는다. 미전송 원본 보호와 vacuum의 조건은 [데이터 수명](../data-lifecycle/INDEX.md)이 소유한다.
