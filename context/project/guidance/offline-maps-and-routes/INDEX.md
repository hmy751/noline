# 준비한 지도와 경로의 범위를 구별한다

**언제 쓰나:** 여행 활성화, 지도 준비·삭제, 일정 변경 뒤 경로 생성, 지도 표시와 준비 안내를 바꿀 때 읽는다.

**핵심 규칙:** 일정·경비의 Local 저장, native 지도 pack(기기에 저장한 지도 자원), 경로 geometry(미리 계산한 이동 선)는 서로 다른 결과다. 사용 가능성을 표시할 때는 그 기능에 필요한 실제 자원과 실패·누락 범위를 확인한다. 여행 활성화나 다운로드 함수의 반환 하나로 세 결과를 합치지 않는다.

| 바꾸려는 것 | 읽고 판단할 범위 |
| --- | --- |
| 활성화·준비 배지·지도 화면 | 아래의 준비·표시 관계에서 실제 완료 근거를 확인한다. |
| 지도 범위·다운로드·재사용·공간 회수 | [지도 파일](map-packs.md)에서 native pack과 DB metadata의 불일치·공유 수명·실패를 확인한다. |
| 일정 생성·수정·삭제·경로 표시 | [저장 경로](routes.md)에서 최신 좌표·인접 관계·profile별 저장과 fallback을 확인한다. |

이 본문은 해당 주제의 현재 개발 기준과 구현 차이를 소유한다. 코드 경로와 현재 값은 변경 판단의 근거이며 모든 기능이 같은 함수나 화면을 사용해야 한다는 지시는 아니다. 제품의 기록 보존 목적은 [제품 기준](../../common/product.md), 활성화 transaction과 sync·미전송 보호는 [데이터 수명](../data-lifecycle/INDEX.md), 연결에 따른 기능 선택은 [여행 접근](../travel-access/INDEX.md)이 맡는다.

## 준비 안내를 바꾸면 자원별 완료 근거를 확인한다

현재 [활성화](../../../../apps/client/src/entities/trip/data/useActivateTrip.ts)는 서버에서 받은 Trip·Schedule·Expense와 활성 metadata를 Local transaction으로 반영한 뒤, 지도와 경로 준비를 각각 백그라운드로 시작한다. 활성화 반환은 두 준비의 완료를 기다리지 않는다. 이미 활성화된 여행에 같은 요청을 하면 Local 일정으로 경로 준비만 다시 시도하며 지도 재시도는 하지 않는다.

| 상태·표시 | 현재 의미와 사용 한계 |
| --- | --- |
| `dataDownloaded=true`, `syncStatus='COMPLETED'` | 활성화의 데이터 입수 결과다. 지도 파일·경로의 완료를 표현하지 않는다. |
| `mapDownloaded=true` | 현재 download helper가 기록하는 flag다. 기존 DB 행이나 등록된 pack을 재사용할 때 native 완료를 확인하지 않아 실제 tile 준비와 어긋날 수 있다. |
| `ready` 상세 배지 | [metadata 판정](../../../../apps/client/src/shared/services/offline-prep/metadata.ts)이 mapDownloaded를 읽은 결과다. route coverage나 실제 pack 상태를 조회하지 않는다. |
| 저장 route 행 | 특정 일정 ID 쌍과 이동수단의 계산 결과다. 현재 좌표·순서에 적합한지 별도 확인이 필요하다. |

[진행 Drawer](../../../../apps/client/src/entities/trip/ui/ActivationProgressDrawer.tsx)는 모든 항목이 success일 때만 완료로 계산한다. error가 섞이면 하단은 기다림 안내에 남고 오류용 완료 분기에 도달하지 않는다. Drawer 자체의 닫기 경로와 별개 문제이므로 화면을 빠져나갈 수 없다고 확대하지 않는다. 준비 UI를 고칠 때는 성공·부분 실패·전체 실패 뒤 사용자가 할 수 있는 행동을 실제 호출부와 함께 확인한다.

## 지도 종류를 선택할 때 준비 범위와 표시 방식을 함께 본다

현재 Policy의 기본 관계는 온라인이면 Google, 활성 여행의 오프라인이면 Mapbox, 비활성·오프라인이면 지도 제한이다. unknown·재인증 등 조건은 여행 접근 기준을 따른다. Mapbox 선택은 pack 존재나 완료 검증을 대신하지 않는다.

일정 지도에서는 온라인 Google이 일정 좌표를 점선으로 연결하고, 오프라인 Mapbox가 저장 경로를 찾아 그리며 없으면 직선으로 연결한다. Google 화면의 점선과 Mapbox의 미준비 fallback은 같은 저장 결과를 뜻하지 않는다. 카드의 외부 Google Maps 길찾기는 온라인 외부 앱 연결이며 저장된 geometry를 이용한 오프라인 내비게이션이 아니다.

일반 [PolicyBasedMapView](../../../../apps/client/src/shared/components/PolicyBasedMapView/PolicyBasedMapView.tsx)는 Mapbox 선택 때 offlineCities metadata 유무로 지도와 준비 중 안내를 나눈다. 반면 [일정 지도 선택기](../../../../apps/client/src/shared/components/Map/PolicyBasedScheduleMapView.tsx)는 같은 metadata gate 없이 Mapbox 화면을 고른다. 지도 하나의 준비 안내를 전체 지도 화면의 보장으로 일반화하지 않는다.

오프라인 지도는 다운로드한 지역·zoom·style 범위에 의존한다. 지도 타일이 있어도 새 도로 경로 계산에는 네트워크가 필요하고, 경로가 있어도 배경 지도 파일이 누락될 수 있다. 좌표 없는 일정도 기록은 유지하지만 지도 마커·경로에 쓸 수 없다는 [기록과 좌표 보완의 구분](../travel-access/INDEX.md#수동-기록과-좌표-보완)을 보존한다.

## 검증할 때 저장 결과와 실제 오프라인 표시를 나눠 확인한다

준비·재시도·삭제를 바꾸면 데이터만 성공, 지도만 실패, 일부 경로 누락, 완료 전 앱 종료, 재활성화와 같은 조건에서 표시와 실제 자원이 맞는지 확인한다. 단위 테스트의 mock pack 등록·DB 저장은 실제 tile 다운로드나 비행기 모드의 재실행을 입증하지 않는다. Native SDK·style·zoom 또는 pack 수명을 바꾸면 대상 플랫폼에서 준비 완료 후 연결 차단·앱 재시작·지역 이동을 확인할 필요가 있다.

현재 설명은 2026-10-31의 client 소스와 설치된 SDK 소스를 대조한 범위다. 실제 기기에서 지도 준비·실패 복구·정리 후 공간 회수까지 확인한 지원 선언은 아니다. 변경 시 source와 실제 실행의 차이를 다시 대조한다. 구성과 선택 이유는 [주제 안내](README.md)에서 찾는다.
