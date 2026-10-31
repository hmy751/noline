# 저장 경로를 현재 일정에 맞게 사용한다

일정 생성·장소/시각 수정·삭제, 경로 준비와 표시를 바꿀 때 읽는다. **경로는 현재 일정의 좌표·인접 순서·이동수단에 맞는 사전 계산 결과여야 한다.** 저장 row 존재나 다운로드 함수의 정상 반환만으로 최신성과 준비 범위를 판단하지 않는다. 아래의 현재 차이는 구현 보완 대상이며 허용할 제품 품질로 채택한 규칙이 아니다.

## 준비 계기를 바꾸면 저장 성공과 후속 계산을 구별한다

[생성 제출](../../../../apps/client/src/features/schedule/create-schedule/useSubmitSchedule.ts)은 저장 성공 뒤 500ms 타이머에서 기존 일정과 생성 입력을 합쳐 시간순으로 경로 준비를 요청한다. [수정 화면](../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx)도 저장 후 타이머를 사용한다. 화면 성공 callback과 닫기는 경로 완료를 기다리지 않는다.

이 지연은 현재 구현 사실이다. 타이머가 이미 캡처한 query 목록을 사용하므로 캐시의 최신성·반영 완료를 보장하는 패턴으로 복제하지 않는다. 수정 경로는 저장된 시각을 반영하지만 기존 목록의 좌표를 사용하므로 새 장소 좌표가 경로 입력에 반영되지 않을 수 있다. 준비 계기를 고칠 때는 저장 결과와 실제 후속 계산 입력을 직접 대조한다.

[활성화](../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)는 별도 공통 downloader를 백그라운드로 호출한다. 최초 활성화의 [서버 POST 응답](../../../../apps/server/src/routes/trips.ts)은 삭제 일정을 제외하지만 시각순 정렬을 명시하지 않는다. 이미 활성 여행의 재요청에서 읽는 raw Local 목록에는 명시적인 정렬·deletedAt 필터가 모두 없다. 두 경로 모두 전달받은 목록으로 인접 구간을 만들기 때문에 시간순 경로 준비를 보장하지 않는다. 별도 일정 조회 API의 정렬 조건을 활성화 응답에도 적용된 것으로 추정하지 않는다.

## 재사용과 저장을 바꾸면 두 다운로드 경로를 함께 대조한다

현재 walking·cycling·driving-traffic 세 profile을 계산한다. 각 결과는 client generateId()로 식별하고 Local routes에 geometry·거리·시간·일정 ID 쌍·profile을 저장한다. 이 서비스 결과는 사용자 일정·경비와 같은 sync-owned 데이터로 다루지 않는다.

| 실제 처리 | 재사용·실패 의미 |
| --- | --- |
| [useAutoDownloadRoutes](../../../../apps/client/src/entities/route/data/useAutoDownloadRoutes.ts) | 일정 생성·수정에서 사용한다. 세그먼트와 profile을 순차 계산하고 성공분을 새 ID로 insert한다. 기존 row 교체·중복 제거는 없다. |
| [공통 route-downloader](../../../../apps/client/src/shared/services/directions/route-downloader.ts) | 활성화에서 사용한다. from/to 일정 ID와 profile이 같은 row를 재사용한다. 좌표 변경·deletedAt·geometry 최신성은 재사용 조건에 없다. |

두 구현은 실제로 별개다. 둘 다 개별 API 실패를 catch하여 계속 진행하고 전체 실패도 `{downloaded: 0}`으로 정상 반환할 수 있다. 0은 실패·계산할 구간 없음·기존 결과 재사용을 구별하지 않는다. 현재 자동 재시도·실패 UI가 제공된다고 안내하지 않는다. 재시도나 완료 표시를 추가한다면 성공분 보존과 누락 구간/profile 식별이 필요하다.

Directions 요청과 decode를 바꾸면 precision과 좌표 순서를 맞춘다. [API 요청](../../../../apps/client/src/shared/services/directions/mapbox.ts)은 polyline6를 요구하고 [decode helper](../../../../apps/client/src/shared/lib/mapbox.ts)는 precision 6으로 복원한 `[lat, lng]`를 지도용 `[lng, lat]`로 바꾼다. precision을 압축률의 우열로 설명하거나 일반 polyline 기본값으로 바꾸지 않는다.

## 표시를 바꾸면 저장 선과 직선 fallback의 의미를 드러낸다

[Mapbox 일정 지도](../../../../apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx)는 인접 ID 쌍과 profile의 첫 matching row를 그린다. 저장 row는 초록 실선, 없으면 현재 좌표 사이 회색 점선이다. 실선은 저장 결과 존재를 뜻하며 현재 좌표와 맞는 최신 도로 경로라는 보증은 아니다. 중복 row·동일 ID의 장소 변경은 오래된 선을 남길 수 있다.

화면은 walking 기본과 세 profile 선택을 제공한다. 거리·시간은 저장된 구간만 합산하지만 일부 구간만 있어도 현재 “총 거리/예상 시간”을 표시한다. fallback 구간까지 포함한 완전한 합계로 해석하지 않는다. 누락 안내나 합계 표시를 고칠 때 전체 인접 구간과 저장된 구간의 차이를 확인한다.

[지도 container](../../../../apps/client/src/features/schedule/schedule-map-view/ScheduleMapViewContainer.tsx)는 선택 날짜의 일정을 표시하지만 준비는 여행 전체 목록으로 수행해 날짜 경계의 계산 범위가 다를 수 있다. downloader와 renderer에 숙소→첫 일정 입력 지원은 있으나 현재 주요 호출부가 숙소 좌표를 넘기지 않으므로 일반 지원 기능으로 약속하지 않는다.

현재 두 downloader와 지도 renderer가 사용하는 인접 관계는 좌표가 있는 일정만 남긴 목록 기준이다. A(좌표 있음)·B(없음)·C(있음) 순서라면 B를 건너뛰어 A→C를 계산·표시한다. 이는 B를 지나는 이동 경로를 준비했다는 뜻이 아니다. 좌표가 없는 일정 자체에는 직선 fallback도 만들 수 없다. 숫자 0은 유효한 좌표지만 현재 projection·downloader·지도 renderer의 truthy 판정에서 제외될 수 있다. 좌표 검사를 바꿀 때 0과 null/누락을 구별하고 입력 보존부터 표시까지 확인한다.

## 일정 변경과 삭제 뒤에는 인접 관계와 남은 경로를 확인한다

시간 수정은 정렬 순서, 장소 수정은 같은 ID의 좌표, 삭제는 새 이웃을 바꾼다. 현재 자동 준비는 이전 row를 교체하지 않고 공통 준비는 같은 ID 쌍을 건너뛴다. 따라서 재다운로드 요청만으로 최신성 문제가 해결됐다고 판단하지 않는다.

[일정 삭제](../../../../apps/client/src/entities/schedule/data/useDeleteSchedule.ts)는 query를 무효화하지만 새 인접 구간을 준비하지 않는다. Local soft delete는 route 행을 직접 제거하지 않는다. schema의 ON DELETE CASCADE는 hard delete 관계이며 soft delete 전파가 아니다. route 자체에는 expiry가 없고 활성 metadata의 expiresAt 존재도 route 자동 정리를 의미하지 않는다. 현재 cleanup은 route를 직접 지우지 않으며 오래된 schedule의 hard delete와 실제 DB FK 동작에 영향을 받는다.

변경·삭제·정리를 검증할 때 같은 ID의 좌표 수정, 시간 역전, 중간 일정 삭제, 날짜 경계, 좌표 없는 중간 일정, 일부 profile 실패와 중복 row를 포함한다. native DB의 cascade 실행과 실제 오프라인 렌더는 schema 선언·mock hook 테스트만으로 입증하지 않는다. 미전송 원본 보호와 vacuum의 조건은 [데이터 수명](../data-lifecycle/INDEX.md)이 소유한다.
