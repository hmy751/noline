# 06 — 앱 준비·인증 상태·첫 화면·초기 작업 연결

## 맡은 결과와 범위

앱을 켰을 때 네트워크·DB·인증 준비, Splash 해제, 첫 화면 선택과 인증 후 작업 시작이 어떤 조건으로 이어지는지 가까운 코드에서 이해하고 수정할 수 있게 한다. 준비 상태를 서로 다른 boolean·effect·고정 지연에서 다시 추론하는 부담과 root·탭의 라우팅 책임 중복을 줄인다. 기존 provider 요구와 정상 진입·로그인·재진입 동작을 보존하며 범용 startup framework나 폴더 재편은 목표로 삼지 않는다.

범위는 root와 탭 layout, 인증 초기화 상태의 소비, `InitializeMainTrip`·`AuthenticatedInitializers`와 sync·cleanup의 시작 접점 및 관련 test다. 대표 여행을 계산하는 규칙은 [08번](08-date-selection-grouping.md), sync 실행·재시도는 [15번](15-sync-result-retry-pull-types.md), 정리 허용 조건과 알고리즘은 [16번](16-unsynced-data-cleanup.md)이 맡는다. 이 Ticket은 그 내부 작업을 흡수하지 않고 언제 시작하고 어떤 결과를 소비하는지를 맡는다.

## 실행 맥락과 접근

[root layout](../../../../../../../apps/client/app/_layout.tsx)은 network 초기화 뒤 DB와 auth를 순차 준비하지만 `finally`에서 성공·실패와 무관하게 `isAppReady`를 세운다. 인증 후 initializers를 mount하고 pending cleanup은 2초 timer로 시작한다. root와 탭 layout은 각각 인증 상태로 이동을 제어하며, `InitializeMainTrip`은 목록 갱신 때마다 대표 여행을 다시 선택한다. [auth store](../../../../../../../apps/client/src/shared/store/auth.ts)와 [SyncProvider](../../../../../../../apps/client/src/shared/services/sync/provider.tsx)를 함께 읽어 준비 완료·인증 복원·자동 작업 시작의 실제 관계를 확인한다.

DB 실패 뒤 auth 미실행·ready=true는 [003-01 앱 준비·오류 복구](../../../../003-bug-investigation-and-fixes/current/memory/tickets/01-startup-and-error-recovery.md)의 분리 재현 결과다. 로그인 복구와 재인증 이동의 기대 동작은 [003-02](../../../../003-bug-investigation-and-fixes/current/memory/tickets/02-auth-account-recovery.md), 사용자가 고른 여행의 보존은 [003-03](../../../../003-bug-investigation-and-fixes/current/memory/tickets/03-trip-management.md)가 맡는다. 알려진 잘못된 준비·선택 동작을 보존 테스트의 정답으로 고정하지 않는다.

먼저 정상·실패·지연의 호출 순서와 준비 조건을 특성화하고, 003 담당 결과와 충돌하지 않는 이름·조건·책임부터 정리한다. 준비 실패 UI·인증 정책·선택 보존의 동작 변경은 해당 003 범위에서 해결하거나 명시적으로 권한을 확인한다. 08·15·16 전체 완료를 조사 착수 조건으로 두지는 않지만, 그중 시작 조건에 직접 필요한 계약과 003-01·02·03의 기대가 미해결이면 안전한 진입 결과까지 완료로 닫지 않는다.

## 완료 조건과 확인 방법

- 유효 인증·인증 없음, DB/auth 실패·지연, 로그인·로그아웃, unmount·재진입에서 준비 상태·화면 이동·Splash와 초기 작업 호출 순서·횟수를 비교한다. 기존 두 라우팅 지점이 필요한 보호인지 실제 중복인지 구별한다.
- 필수 준비, 인증 여부, 후속 작업 시작 조건을 코드의 이름·상태·가까운 흐름에서 읽을 수 있다. 준비 실패를 성공으로 숨기거나 시간이 지났다는 이유만으로 안전 조건이 만족됐다고 보지 않는다.
- 최초 목록 도착과 이후 재조회·사용자 선택 변경의 책임이 구별된다. 대표 여행의 계산 규칙은 08에 남기며, 선택 보존은 003-03의 채택 계약과 일치한다.
- sync·cleanup 시작과 결과 소비는 15·16의 계약을 사용한다. startup test의 mock 성공을 실제 전송 성공이나 미전송 데이터 보존의 증거로 확대하지 않는다.
- Jest의 지연 promise·fake timer·router/provider fixture로 정상·오류 경로를 비교하고 관련 정적 검사를 실행한다. 실제 Expo 진입·native Splash·로그인 확인이 없으면 그 범위는 미확인으로 남긴다.

## 현재 상태와 실제 결과

2026-09-14 재배치에서 새로 정의했다. root·탭 layout과 기존 003 조사·Ticket을 대조했으며 제품 코드·test는 변경하지 않았다. 구현·검증·수락은 아직 없고, 준비·인증·선택의 동작 변경 권한은 이 문서 생성으로 추가되지 않는다.
