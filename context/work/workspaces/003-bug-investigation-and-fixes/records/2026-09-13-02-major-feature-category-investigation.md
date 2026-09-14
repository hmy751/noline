# 주요 기능 카테고리별 첫 사용 조사·분석

이번 조사는 개발자가 Noline을 처음 켜서 주요 기능을 확인하는 범위를 실제 화면·기능에서 다시 잡고, 이전 조사에서 얕게 본 활성화·여행 관리·지도·오프라인 복구를 보완한 결과다. 여러 카테고리에서 추가 결함을 확인했다. 다만 실제 iOS 앱을 처음부터 끝까지 조작해 통과시킨 결과는 아니다.

티켓과 제품 수정은 하지 않았다. 현재 소스의 함수·일부 React 컴포넌트를 분리 실행한 결과와 코드에서만 추적한 조건, 아직 실행하지 않은 환경 검증을 아래에서 구분한다.

## 조사 배경과 근거의 범위

사용자가 같은 작업 대화에서 조사 기준을 명확히 했다.

> “개발자가 이 앱을 키고 확인해보려고 하는 카테고리를 충실히 조사햇나 하는게 포인트야”
>
> “아 티켓전에 일단 조사 분석 부터해봐”

로그인 재시도 안내는 전체 조사 필요를 보여 준 예시다. 활성화 역시 조사 범위를 그 기능 하나로 한정하는 요청이 아니다. [이전 첫 사용 조사](2026-09-13-01-first-use-scenario-investigation.md)의 개별 발견은 유지하되, 그 결과만으로 주요 기능을 충분히 조사했다고 판단하지 않았다.

2026-09-13 Main이 `refactor/codebase`, HEAD `70155641b2bda13df6b905b58ebbe414fa5ee0ed`의 현재 소스를 읽고 [카테고리 실험](../source/2026-09-13-category-probes.cjs)을 실행했다. [최종 출력](../source/2026-09-13-category-probes-output.json)에 실행 시각·버전·입력 파일 SHA-256과 각 조건의 결과를 보존했다. 출력은 **39개 관찰 항목**이며 정상 대조군 16개와 결함 조건 관찰 23개를 포함한다. 같은 원인의 여러 조건과 앞선 후보의 강화가 있으므로 23개 신규 버그라는 뜻이 아니다.

- 제품 TypeScript를 읽어 변환·실행했다. 임의로 로직을 다시 구현한 결과를 제품 함수 실행으로 표시하지 않았다.
- DB는 select/update/upsert/delete 호출의 의미를 따르는 메모리 adapter다. SQL 제약·실제 SQLite transaction·동시성은 모형에 없고 transaction 대체물은 callback을 기다린다. 이번 정상 저장 대조군은 기존 실제 드라이버의 조기 commit 문제를 반박하지 않는다.
- 서버·토큰·지도·위치 공급자는 대체했으며 실제 네트워크는 호출하지 않았다. 허용하지 않은 모듈 import는 차단했다.
- 로그인·일정 상세·활성화 진행 UI·위치 hook은 React test renderer로 실행하되 native 구성요소와 일부 hook을 대체했다. 실제 터치·navigation·권한 대화상자를 재현한 것은 아니다.
- 날짜는 별도 Node 프로세스를 서울·로스앤젤레스·UTC 시간대로 실행했다.
- 설치된 Mapbox React Native 모듈 10.1.33의 JS·iOS Swift 구현도 읽었다. 다운로드 시작 뒤 promise가 끝나는 계약을 mock 조건의 근거로 사용했으며 native 다운로드 자체를 실행하지 않았다.
- iOS 시뮬레이터는 읽기 전용 목록 조회로 부팅 상태만 확인했다. 별도 시험 계정·데이터·서버 연결이 확인되지 않아 앱 시작·로그인·동기화·삭제 같은 실제 데이터 변화를 일으키는 조작은 하지 않았다.

## 어떤 카테고리를 어디까지 조사했는가

앱의 홈·일정·경비·프로필 탭, 생성·상세 화면과 개발자 화면을 기준으로 범위를 잡았다. 각 카테고리에서 기본 동작, 실패 후 복구, 다른 기능으로 이어지는 조건을 대조했다. 표의 정상은 해당 조건에 한정되며 카테고리 전체 무결함 판정이 아니다.

| 카테고리와 대표 사용 | 실제 확인한 범위와 결과 | 남은 실행 검증 |
| --- | --- | --- |
| 앱 시작·로그인 | Google 로그인 취소 후 재시도 가능 상태·성공 후 인증 store 전달은 대조군 통과. DB 초기화 실패 후 준비 완료 처리 재현. 저장 계정 갱신·재로그인 문제는 이전 실행 근거 유지 | 새 설치, 실제 Google·Apple OAuth, SecureStore 실패, native 화면 이동 |
| 여행 생성·선택·기간 수정·삭제 | 생성 form·Repository·서버 경로 추적. 기간만 수정해 좌표 null 저장, 활성 여행 삭제 뒤 activation 잔존 재현. 이전 선택 덮어쓰기 근거 유지 | 도시 검색부터 서버 생성·새 여행 선택까지 연속 조작, 삭제 전파, 빠른 반복 저장 |
| 활성화·비활성화·재활성화 | 최초 데이터 저장 성공·서버 실패 대조군. 지도 재시도 누락, 재활성화 뒤 정리 예약 유지·활성 일정 삭제 표시, 과거 ready 잔존 재현. A→B 전환의 실패 경계 코드 확인 | 실제 SQLite 중단·복구, 다운로드 중 비활성화, 여러 번 연속 전환 |
| 일정 목록·생성·수정·삭제·상세 | 제목 변경 좌표 보존·삭제 후 목록 제외 대조군. 비활성 수정의 기존 재현에 삭제 실패 추가. 기간 밖 일정 숨김, 상세 지도 버튼 무동작 재현. 생성 날짜 전달·취소·수동 입력·좌표 보강 경로 추적 | native form 입력·키보드·picker·취소 후 재열기, 날짜 변경 후 지도 선택 상태 |
| 경비 입력·수정·삭제·통화·일정 연결 | 로컬 생성→금액 수정→일정별 조회→삭제 대조군, 통화별 합계·기간 밖 표시 대조군. 비활성 삭제·일정별 조회 실패 추가. 통화 지연 초기값은 이전 재현 유지 | 실제 폼 저장 실패 안내·연속 클릭, 일정 연결 변경·해제·삭제의 전 과정, 날짜 변경 뒤 합계 UI |
| 장소 검색·지도·경로·현재 위치 | 검색/상세 정상 응답 대조군. 상세 실패를 좌표 0으로 반환, 경로 0 좌표 누락·좌표 변경 후 기존 ID 경로 재사용·전체 경로 실패 정상 반환 재현. 위치 권한 거절 대조군. 지도 준비 완료 시점 및 UI 표시 대조 | 실제 공급자 제한·키 설정·검색 지연, native 지도·마커·carousel·경로 모드 전환 |
| 오프라인 입력·재연결·동기화 | 활성/비활성 × 온라인/오프라인 child routing 대조군. 오프라인 생성 제한·수동 입력 정책 대조군. FAILED 다음 push 누락, IN_PROGRESS 잔존 조건, pull의 미전송 수정 덮어쓰기 재현 | 실제 비행기 모드·강제 종료·재실행·재연결의 전체 저장 보존, 요청 도중 끊김·동시 push·서버 cursor 경계 |
| 프로필·로그아웃·계정 전환 | 프로필의 실제 노출 항목, 저장 용량·계정 삭제·다른 계정 정리의 코드 경로 확인. 이전 FAILED 로그아웃 손실 경고 누락 재현 유지. 서버 소유권·삭제 조건을 관련 경로에서 다시 확인 | 실제 A/B 계정 교체와 진행 중 sync 격리, 계정 삭제 서버/native 정리, 용량 표시 실제 값 |
| 오류·준비 상태·개발자 도구 | 지도 실패 후 진행 UI가 대기 문구를 유지하는 렌더 결과. 조회·검색·생성 실패 표시 소비 경로 확인. 수동 동기화의 이전 거짓 성공 근거 유지. 지도 삭제 도구의 상태 갱신 범위 코드 확인 | 실제 debug reset 뒤 재사용, 느린 요청·네트워크 토글·중복 클릭·화면 이탈의 조합 |

기간·시간대·통화는 여행·일정·경비를 가로지르는 입력 계약으로 함께 봤다. 프로필의 다크 모드·언어 설정·오프라인 지도 관리 메뉴는 현재 코드에서 주석 처리돼 있다. 노출되지 않은 메뉴를 눌러도 동작하지 않는 버그로 집계하지 않는다. 경비 영수증 업로드도 현재 작성 hook에서 미구현으로 표시된 범위이며 이번 조사를 새 기능 구현 요청으로 바꾸지 않는다.

## 발견한 문제와 판단

### 활성화와 지도 준비

**재활성화한 여행에 과거 정리 예약이 적용된다.** 미전송 CREATE가 있는 A를 데이터 정리 옵션으로 비활성화하면 `cleanupPending=true`가 된다. 다시 A를 활성화해도 upsert의 갱신 필드에 그 flag가 없어 예약이 유지된다. 전송이 끝난 조건에서 cleanup을 실행하면 현재 활성 여부를 확인하지 않고 일정·경비를 삭제 표시한다.

실험은 실제 activate/deactivate/queue/cleanup 함수를 연결하고 queue가 비워진 조건을 명시적으로 부여했다. 결과는 `isActivated=true`인 A의 일정에 `deletedAt`이 들어갔다. 실제 기기 데이터 유실 사고를 재현한 것은 아니며, 내려받은 데이터를 숨기는 제어 흐름의 재현이다. 기존 cleanup 후보에 **재활성화라는 별도 실패 조건을 추가**했다.

근거: [활성화 upsert](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts), [비활성화](../../../../../apps/client/src/entities/trip/data/useDeactivateTrip.ts), [예약 정리](../../../../../apps/client/src/shared/services/sync/cleanup-job.ts). 실험 `defer-cleanup-reactivate-drain-cleanup`.

**지도 다운로드가 끝나기 전에 준비 완료로 판정한다.** 다운로드 helper는 `createPack`이 반환하고 pack이 존재하면 `mapDownloaded=true`를 기록한다. 설치된 iOS 모듈은 `startLoading(pack: actPack)` 다음에 promise를 resolve하며 타일 완료는 별도 callback에서 온다. 따라서 pack 생성은 다운로드 완료가 아니다.

이 계약을 따른 mock에서 진행률 0%에도 준비 flag가 켜졌고, 10% callback 뒤에도 켜진 상태였다. metadata의 ready는 그 flag만 사용한다. 기존 ‘지도·경로 부분 완료’ 후보를 **설치된 native 계약과 분리 실행으로 강화**했다. 실제 장치에서 오프라인 타일이 어느 범위까지 보이는지는 별도다.

**삭제·재활성화·재시도에서도 지도 상태가 어긋난다.** 실제 지도 cleanup helper는 pack과 도시 DB를 지우지만 activation의 `mapDownloaded`를 지우지 않는다. 재활성화의 충돌 갱신도 그 값을 초기화하지 않는다. 과거 true를 가진 비활성 여행에서 새 지도 다운로드를 실패시켜도 상태는 ready였다. 이미 활성화된 여행을 다시 activate하면 경로만 시도하고 지도는 재시도하지 않는다. DB에 도시 row가 있으면 native pack 존재 확인 없이 재사용한다.

이들은 모두 ‘저장된 준비 flag가 실제 지도 상태·재시도와 일치하는가’라는 연결된 문제다. 각각을 독립 신규 버그 수로 부풀리지 않는다.

근거: [다운로드](../../../../../apps/client/src/shared/services/offline-map/download.ts), [지도 정리](../../../../../apps/client/src/shared/services/offline-map/cleanup.ts), [ready 판정](../../../../../apps/client/src/shared/services/offline-prep/metadata.ts), [활성화](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts). 설치본의 `node_modules/@rnmapbox/maps/src/modules/offline/offlineManager.ts`와 `ios/RNMBX/Offline/RNMBXOfflineModule.swift`의 해시는 출력에 있다.

**실패한 활성화 진행 화면이 계속 기다리라고 한다.** 데이터 성공·지도 오류를 넣어 실제 진행 컴포넌트를 렌더했을 때 ‘오프라인 준비 중...’, ‘50% 완료’, ‘잠시만 기다려주세요...’와 개별 오류가 함께 표시됐다. 하단 완료/닫기 버튼은 모든 항목이 성공한 경우에만 생긴다. Drawer 자체의 닫기 동작은 대체했으므로 화면에서 탈출할 수 없다고 주장하지 않는다.

근거: [진행 Drawer](../../../../../apps/client/src/entities/trip/ui/ActivationProgressDrawer.tsx), 실험 `activation-error-drawer-still-says-wait`.

A→B 전환에서는 [홈](../../../../../apps/client/src/screens/HomeScreen/TripsSection.tsx)이 A를 먼저 비활성화·정리한 뒤 B를 활성화한다. B가 실패했을 때 A를 복원하는 분기는 없다. 이는 **코드로 확인한 전환 실패 경계**이며 전환의 원자성을 새 제품 요구로 확정하거나 실제 UI 실패 재현으로 집계하지 않는다.

### 여행 수정·삭제와 일정·경비 연결

**여행 날짜만 고쳐도 로컬 여행 좌표가 지워진다.** [여행 편집 UI](../../../../../apps/client/src/features/trip/update-trip/EditTripDrawer.tsx)는 시작·종료일만 전달한다. [로컬 여행 수정](../../../../../apps/client/src/entities/trip/lib/trip-local.ts)은 전달하지 않은 latitude/longitude도 null로 만든다. 종료일만 바꾸는 실험에서 기존 '35'/'139'가 모두 null이 됐고 queue payload에는 날짜만 남았다. 서버 좌표까지 지웠다는 뜻은 아니며 로컬 좌표·검색 중심·지도 재준비에 영향을 주는 조건이다. 새로 구체화한 결함이다.

**마지막 활성 여행을 삭제해도 활성화 레코드가 남는다.** 로컬 여행 삭제 뒤 사용자 여행 목록은 비었지만 `hasAnyActivatedTrip()`는 true였다. 삭제는 trip의 soft delete와 queue만 처리하고 activation을 해제하지 않는다. Trip 전체 routing이 이 잔존 flag를 보기 때문에 삭제 뒤 앱의 ‘활성 여행 있음’ 판단과 화면 목록이 불일치한다. 이 실험만으로 서버의 모든 자식 데이터가 유실·노출됐다고 확대하지 않는다.

근거: [여행 삭제](../../../../../apps/client/src/entities/trip/lib/trip-local.ts), [삭제 hook](../../../../../apps/client/src/entities/trip/data/useDeleteTrip.ts), [활성 판정](../../../../../apps/client/src/shared/services/offline-prep/metadata.ts). 실험 `delete-last-active-trip-leaves-activation`.

**여행 기간을 줄이거나 일정을 기간 밖으로 옮기면 일정이 목록에서 사라진다.** 일정 화면의 실제 날짜별 그룹 계산을 실행했다. 저장된 10월 1일 일정과 10월 2일만 포함한 여행 기간을 주면 어느 그룹에도 일정이 들어가지 않는다. 경비 화면은 기간과 실제 경비 날짜의 합집합을 써 기간 밖 경비도 표시하는 대조군이 통과했다. DB 삭제가 아니라 목록·그 목록을 받는 지도에서 찾기 어려워지는 문제다. 기간 밖 일정의 정확한 UI는 설계 판단이 남지만, 변경 후 항목에 접근할 경로를 잃는 현상은 확인됐다.

근거: [일정 그룹](../../../../../apps/client/src/screens/ScheduleScreen.tsx), [경비 그룹](../../../../../apps/client/src/screens/ExpensesScreen.tsx). 실험 `shorten-trip-range-hides-existing-schedule`, `outside-trip-range-expense-remains-visible-control`.

**비활성 여행의 삭제와 일정별 경비 조회도 로컬 선행 의존으로 막힌다.** 이전에는 생성 후 수정만 실행했다. 이번에는 실제 일정·경비 Repository의 삭제와 경비의 일정별 조회를 실행했다. 로컬에 row가 없으면 모두 원격 함수 호출 0회로 실패했다. 일정 상세는 경비 query의 error를 별도 표시하지 않고 빈 배열로 소비하므로 ‘경비 없음’ 표시로 이어질 수 있다. 저장된 실제 서버 경비가 있어도 그 API에 도달하지 못하는 조건이다.

근거: [일정 Repository](../../../../../apps/client/src/entities/schedule/repository/schedule-repository.ts), [경비 Repository](../../../../../apps/client/src/entities/expense/repository/expense-repository.ts), [일정 상세](../../../../../apps/client/src/screens/ScheduleDetailScreen.tsx). 기존 local 선행 의존 후보의 범위를 강화한 것이며 별도 원인으로 중복 집계하지 않는다.

정상 대조군에서는 로컬 경비의 생성·금액 수정·일정별 조회·삭제, 삭제된 일정의 목록 제외, 일정 제목만 수정할 때 좌표 유지가 확인됐다. 이는 정상 callback 경로의 확인이며 실제 DB 원자성·서버 전송 성공 보장은 아니다.

### 지도에서 보기·장소 검색·경로

**일정 상세의 ‘지도에서 보기’ 버튼이 동작을 제공하지 않는다.** 실제 상세 컴포넌트에서 그 버튼을 호출하면 로그만 남고 navigation 호출은 0회였다. 같은 화면의 ‘경비 추가’ 버튼은 tripId·scheduleId·날짜가 포함된 경로로 이동 요청하는 대조군이 통과했다. 노출된 버튼의 미구현 동작으로 새로 확인했다.

근거: [일정 상세](../../../../../apps/client/src/screens/ScheduleDetailScreen.tsx), 실험 `schedule-detail-show-on-map-button`.

**장소 상세 조회가 실패하면 좌표 0,0을 가진 선택 가능한 검색 결과가 된다.** 검색 응답은 정상이고 상세 요청만 timeout인 조건에서 실제 `searchPlaces`는 이름·주소와 위도/경도 0을 반환했다. [검색 지도](../../../../../apps/client/src/shared/components/PolicyBasedMapView/PolicyBasedMapView.tsx)는 결과의 좌표를 그대로 marker/중심에 사용한다. 값 없음과 실제 좌표 0을 구별하지 않는 오류 복구다. 반면 정상 search envelope와 상세의 평면 응답 조합은 실제 [서버](../../../../../apps/server/src/routes/places.ts)와 맞으며, 그 차이 자체를 계약 오류로 판정하지 않았다.

[장소 검색 hook](../../../../../apps/client/src/features/schedule/create-schedule/useLocationSearch.ts)은 query 오류를 반환하지 않는다. 최초 검색 요청 실패도 결과 없음과 구별할 표시를 화면이 받지 못하는 코드 경로다. 실제 네트워크·키·공급자 장애는 시험하지 않았다.

**기존 경로를 좌표 변화 없이 재사용하고, 유효한 0 좌표는 빠뜨린다.** 공통 경로 downloader는 같은 일정 ID 쌍과 이동수단이면 좌표가 달라져도 새 요청을 하지 않는다. 3개 이동수단의 정상 요청 대조군 뒤 도착 좌표를 바꾸자 새 요청은 0회였다. 위도 0을 넣은 별도 조건도 좌표가 있는 일정에서 제외됐다. 모든 directions 요청을 실패시키면 예외 대신 `{ downloaded: 0 }`으로 정상 반환됐다.

활성화의 경로 준비와 UI 완료 문구는 이 실패를 반영하지 않는다. 일정 수정의 별도 자동 downloader에는 중복 방지 로직이 없고 기존 query 좌표를 전달하는 경로가 남아 있다. 두 구현의 문제를 같은 구현이라고 합치지 않는다. 좌표 보강 UI는 현재 좌표가 없는 일정에만 노출되므로 일반적인 모든 장소 변경 UI를 실행한 것으로 확대하지 않는다.

근거: [공통 downloader](../../../../../apps/client/src/shared/services/directions/route-downloader.ts), [수정 후 처리](../../../../../apps/client/src/features/schedule/update-schedule/UpdateScheduleDrawer.tsx), [별도 자동 downloader](../../../../../apps/client/src/entities/route/data/useAutoDownloadRoutes.ts), [저장 경로 소비](../../../../../apps/client/src/shared/components/Map/MapboxScheduleMapView.tsx). 기존 경로·좌표 후보를 실행으로 강화했다.

### 오프라인·동기화·날짜·시작 복구

**일반 전송 실패와 실행 중 중단 상태가 다음 전송에서 제외된다.** 실제 queue와 push 엔진을 연결해 첫 UPDATE를 실패시키고 push를 다시 호출했다. 서버 호출은 첫 1회뿐이고 작업은 FAILED로 남았다. IN_PROGRESS 상태를 재시작 입력으로 줘도 선택되지 않았다. 현재 sync·debug 경로에서 일반 FAILED/IN_PROGRESS를 자동 복구하는 소비자를 찾지 못했다. 전체 프로세스 강제 종료를 실행한 것은 아니므로 ‘재시작 입력 상태에서의 push 결과’로 한정한다.

**실패한 미전송 수정이 pull로 덮인다.** 로컬 제목을 ‘unsent edit’로 바꾸고 전송에 실패한 뒤, 서버의 이전 제목 ‘saved’를 pull 응답으로 줬다. 실제 pull·upsert 함수를 통해 로컬 제목이 이전 값으로 바뀌었고 queue에는 미전송 payload가 남았다. 즉 화면에 보이는 수정이 사라져도 이 시점의 queue payload까지 지워진 것은 아니다. 이전 FAILED 로그아웃/cleanup 문제와 결합하면 보존 위험이 커진다. 서버가 해당 row를 실제 pull에 포함시키는 cursor·변경 시점은 환경에서 별도 확인해야 한다.

근거: [push/pull](../../../../../apps/client/src/shared/services/sync/engine.ts), [queue](../../../../../apps/client/src/shared/services/sync/queue.ts), [upsert](../../../../../apps/client/src/shared/db/utils.ts), [재연결 trigger](../../../../../apps/client/src/shared/services/sync/provider.tsx). 기존 재시도·충돌 후보의 실행 근거를 강화했다.

**미국 시간대에서 선택 날짜가 하루 앞선 날짜로 저장·표시된다.** 실제 날짜 util에 2026-09-13과 09:00을 넣으면 서울·UTC에서는 해당 날짜가 유지되지만 로스앤젤레스에서는 일정 표시 날짜가 2026-09-12였다. 경비/여행용 날짜 전용 변환도 UTC 자정으로 저장한 뒤 로컬 날짜로 표시하면 9월 12일이 된다. 시간 입력을 UTC로 저장하는 정책 자체가 문제가 아니라, 날짜 전용 입력의 뜻을 변환·표시 과정에서 보존하지 못하는 문제다. 새로 분리 재현했다.

근거: [날짜 util](../../../../../apps/client/src/shared/lib/datetime.ts), [일정 작성](../../../../../apps/client/src/features/schedule/create-schedule/useCreateScheduleForm.ts), [경비 작성](../../../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts), [여행 작성](../../../../../apps/client/src/features/trip/create-trip/useCreateTripForm.ts). 실험 `date-roundtrip-*`.

**DB 초기화 실패도 앱 준비 완료로 이어지고 인증 복원은 호출되지 않는다.** 원본 `prepareApp` 함수를 추출해 DB 실패를 주입하면 `initAuth`는 0회인데 ready는 true가 됐다. 이 뒤 root는 일반 화면·sync provider 렌더 경로로 들어갈 수 있다. 특정 기기에서 반드시 흰 화면이나 crash가 난다는 뜻은 아니며, 필수 준비 실패와 성공을 구분하지 않는 경로가 확인됐다. 기존 초기화 후보를 실행으로 강화했다.

근거: [앱 root](../../../../../apps/client/app/_layout.tsx), 실험 `database-init-fails-but-app-ready-auth-not-initialized`.

## 정상 근거·미확정·범위 밖의 구분

확인한 정상 조건에는 Google 로그인 취소 후 idle 복귀, 정상 인증 응답의 store 전달, 활성화 서버 실패 시 최초 로컬 활성화 없음, child의 온라인/오프라인 routing, 통화별 독립 합계, 오프라인 정책 제한, 위치 권한 거절 시 조회·지도 이동 중단과 loading 해제가 있다. 각각의 입력/출력은 최종 실험 JSON에 있다. 기존 Drawer 재열기에서 부모가 선택값을 null로 되돌리는 반대 근거와 일정 생성 화면의 전달 날짜 사용도 유지한다.

아직 소스 수준 또는 환경 검증이 필요한 중요 조건은 다음과 같다.

- **온라인에서 A 활성화 중 새 B 생성 후 즉시 B에 일정 추가·활성화:** 부모는 local/queue, 자식은 remote로 향하는 이전 경로 분석이 유지된다. 실제 서버에 부모가 도착하는 시점을 합친 재현은 하지 않았다.
- **서버 소유권·삭제·활성화 응답:** 중첩 일정 조회의 userId/deletedAt 조건 누락, 생성 부모 소유권, 활성화 경비의 날짜/boolean 정규화, 허용한 여행 수정 필드의 미반영은 [기존 후보](../current/memory/analysis-items.md)와 현재 서버 소스 근거를 유지한다. 실제 두 계정·PostgreSQL·응답 parser를 연결한 시험은 미수행이다. 일반 앱 일정 목록은 `/api/schedules?tripId=`를 사용하므로 중첩 endpoint 문제를 모든 목록 호출로 일반화하지 않는다.
- **여행 기간 변경의 추가 연결:** activation 만료일 갱신·이미 선택한 지도 날짜·일정/경비 연결 변경의 후속 처리는 더 확인해야 한다. 기간 밖 항목의 보존/노출 결과와 정확한 수정 정책을 섞지 않는다.
- **실제 native/외부 환경:** 신규 설치, Apple OAuth, 권한 재허용, 지도 다운로드 중 앱 종료, 백그라운드 복귀, 네트워크 순간 단절, SQLite failure·동시 transaction, 계정 전환 중 진행 요청은 아직 전체 실행 결과가 없다.
- **생성 실패 UX:** 여행·일정·경비 생성 hook의 실패 처리 중 console만 남기는 부분이 있다. form 입력은 남을 수 있으므로 ‘입력 유실’로 확정하지 않으며 오류 표시·재시도의 실제 화면 확인이 필요하다.
- **개발자 지도 삭제 도구:** native pack과 도시 DB 삭제 후 activation ready flag를 갱신하지 않는 코드를 확인했다. 실제 reset/지도 삭제는 실행하지 않았다.

따라서 이번에는 주요 기능 카테고리를 실제 코드에 연결하고 다수 조건을 분리 실행한 조사 근거를 확보했다. **앱 전체 무결함 판정이나 iOS 전 과정 테스트 완료는 아니다.** 남은 범위는 카테고리 표와 위 목록에 보존했다. 다음 티켓 구성은 이 결과의 확인 수준과 필요한 환경 검증을 보고 별도로 정하며, 이번 요청에서는 Ticket·제품 코드·제품 Verify·완료 상태를 변경하지 않는다.

## 재실행

Project root에서 실행한다.

```bash
node context/work/workspaces/003-bug-investigation-and-fixes/source/2026-09-13-category-probes.cjs
```

표준 출력이 결과 JSON이다. 과거 결함을 기대하는 assertion이 포함되어 있으므로 수정 후에는 해당 결함의 올바른 동작을 검사하는 회귀 조건으로 바꿔야 한다. 기존 첫 사용 실험은 별도 파일로 유지하며 이번 실험이 인증·로그아웃의 앞선 근거를 덮어쓰지 않는다.
