# 앱 시작의 DB 실패 재시도와 인증 복원 실패 처리

2026-09-18, [Ticket 06](../../context/work/workspaces/002-code-readability-refactoring/current/memory/tickets/06-app-startup-lifecycle.md)의 DB·인증 초기화 작업에서 채택한 제품 동작이다. Ticket 전체 완료나 사용자 최종 수락을 뜻하지 않는다.

## 선택과 이유

사용자는 DB 실패 처리에 대해 “실패 안내와 재시도 화면을 보여주고, DB 준비 성공 후 진입한다”를 선택했다. SQLite 여행 DB와 로그인 정보의 보안 저장소는 별개다. 저장된 인증 정보가 있어도 DB 준비에 실패할 수 있으므로, 인증 여부만으로 앱 진입을 허용하지 않는다.

인증 복원 실패에는 별도 재시도 화면을 제안했으나 사용자는 “일반적으로 가자”를 선택했다. 이 선택은 인증 정보가 없는 경우와 저장소 읽기 실패 모두 기존 로그인 화면으로 보내는 동작을 유지한다는 뜻이다. 서버가 토큰 만료·인증 거부를 반환한 경우의 처리 정책을 새로 정한 것이 아니다.

## 채택한 동작

- DB 준비 전에는 인증 복원과 앱 화면·Provider·인증 후 초기 작업을 시작하지 않는다.
- DB 파일 열기 또는 테이블 준비가 실패하면 Splash를 해제해 실패 안내와 재시도 버튼을 보여준다. 재시도 중에는 준비 중 화면을 보여주며 중복 입력으로 준비 작업을 추가하지 않는다.
- 재시도는 DB를 다시 준비하는 작업이다. 저장된 여행·sync queue·인증 정보를 삭제하는 reset을 호출하지 않는다.
- DB 준비 성공 뒤 저장된 사용자와 토큰이 있으면 기존 오프라인 인증 복원 방식으로 앱에 진입한다. 네트워크 확정이나 서버 토큰 검증을 새 선행 조건으로 추가하지 않는다.
- 인증 정보가 없거나 보안 저장소 읽기에 실패하면 비인증 상태로 복원을 완료하고 로그인 화면으로 보낸다. 읽기 실패를 이유로 저장된 정보를 삭제하지 않는다.
- 화면 해제 뒤 완료된 초기화는 그 화면의 진입이나 후속 초기화를 이어가지 않는다. 인증 복원 중 반복 호출은 진행 중인 읽기의 완료를 함께 기다린다.

## 구현과 확인 범위 — 첫 구현과 책임 정리 이력

[RootLayout](../../apps/client/app/_layout.tsx)은 준비 중·DB 실패·준비 완료를 구분하며 초기화·화면 전환 책임을 기존 파일에 유지한다. [DB 초기화](../../apps/client/src/shared/db/index.ts)는 파일 import 시점의 DB 열기를 초기화 호출 안으로 옮긴다. 기존 ORM import 사용처는 Root의 초기화 성공 뒤 사용하며, 연결과 ORM 객체는 재사용한다. 테이블·인덱스 SQL과 명시적인 개발·로그아웃용 reset 동작은 유지한다. [Auth Store](../../apps/client/src/shared/store/auth.ts)는 비인증 상태 설정을 모으고 복원 Promise를 Store 내부에서 공유한다.

제품 변경 전에 [Layout 시나리오](../../apps/client/tests/app/layout.test.tsx), [DB 준비 검사](../../apps/client/tests/shared/db/startup.test.ts), [인증 복원 검사](../../apps/client/tests/shared/store/auth.test.ts)를 작성했다. 삭제 SQL 검사의 외래키 `ON DELETE` 오탐을 바로잡은 기준에서 기존 제품 코드로 33개 중 7개가 실패하고 26개가 통과했다. 실패는 DB import 시점의 열기·열기 실패 전달, 실패 후 화면 진입·재시도 부재, unmount 뒤 인증 실행, 중복 인증 읽기였다. 첫 구현 뒤 인증 복원 중 화면 재진입 검사도 추가했고 전체 client Jest 10개 suite·127개 test가 통과했다.

사용자가 “preparation 과 auth init … 따로 구현된느낌”과 Spec 목표를 짚어 초기화 책임을 다시 정리했다. 테스트 통과만으로 가독성 개선을 완료했다고 보지 않고, 준비 여부를 여러 곳에서 추적하게 하는 구조를 줄였다.

- 준비 상태는 Root의 `startupStatus` 하나가 소유한다. `initializeApp()` 안에서 DB 준비, `restoreSession()`, 화면 진입 순서를 읽을 수 있다.
- 재시도 버튼은 같은 `initializeApp()`을 직접 호출한다. 재시도 횟수를 state에 넣어 effect를 다시 실행하는 간접 연결을 제거했다. 실행 중 참조는 중복 호출과 해제된 화면의 늦은 완료를 막는 데만 사용한다.
- Auth Store의 `init`은 `restoreSession`으로 바꾸고 공개 `isInitialized`를 제거했다. 완료된 복원 Promise도 내부에 유지해 이후 로그인·로그아웃 상태를 다시 덮어쓰지 않는다. `createAuthStore()`는 이 내부 상태까지 포함해 테스트마다 실제 Store를 새로 만드는 생성 함수다.
- AuthRouter와 Tabs는 Root 준비 완료 뒤 인증 여부만 판단한다. Tabs의 비인증 접근 차단은 유지한다.

구조 변경 전에 인증 복원 대기와 복원 완료 후 로그인·로그아웃 보존 시나리오를 보강해 관련 30개 test 통과를 확인했다. 변경 뒤 [탭 인증 보호 검사](../../apps/client/tests/app/tabs-layout.test.tsx)를 포함한 전체 client Jest 11개 suite·130개 test가 통과했다. 변경 파일의 ESLint는 오류 0개, `void`와 기존 non-null assertion 경고 9개다. Prettier 규칙은 도구 연동 오류 때문에 ESLint에서 끄고 별도로 검사했다. TypeScript에는 기존 Mapbox 관련 오류 3개만 남는다.

이후 사용자는 “확장성 응집도 모듈도 고려해서 레이아웃 정리”, “앱 초기화의 의미”를 다시 요구했다. 한곳에서 순서가 읽힌다는 것만으로 충분하지 않았다. 준비 과정의 수명·실패·재시도와 화면 구성, 로그인 상태에 따라 연결되는 작업이 각 책임 안에서 함께 변경되도록 다음 구조로 보완했다. 앞선 “Root가 직접 준비 상태와 실행을 소유한다”는 배치는 아래 구성으로 대체한다.

- `RootLayout`은 파일의 첫 컴포넌트로 앱 구성을 보여 준다. 준비 경계 안에 Provider·화면·인증 후 작업을 배치하며, 인증 여부를 한 번 구독해 화면 이동과 후속 작업 연결에 사용한다.
- `AppInitialization`은 앱을 사용할 수 있게 하는 책임을 소유한다. 네트워크 감지 시작·정리, DB와 인증 복원의 순서, 준비 상태, Splash 해제, 실패 안내·재시도가 함께 있다. 준비 완료는 DB 사용 가능과 인증 복원 시도의 완료이며, 네트워크 확정이나 인증 후 작업의 완료를 기다린다는 뜻이 아니다. 재시도는 이 책임 안에서 DB·인증 준비만 반복하고 네트워크 구독은 유지한다.
- `AppNavigation`은 실제 Stack과 인증 상태에 따른 화면 이동을 함께 소유한다. 화면 선언과 별도 `AuthRouter`를 왕복하던 연결을 줄였다.
- `AuthenticatedEffects`는 로그인한 동안 여행 선택·지도 정리·미완료 cleanup을 연결한다. 개별 작업마다 `null`을 반환하던 initializer 컴포넌트는 hook으로 정리하고 하나의 인증 수명 안에서 사용한다. 미완료 cleanup의 지연·실행·오류 처리·캐시 갱신·타이머 해제는 같은 hook에서 읽을 수 있다. 이미 시작된 비동기 정리 작업의 취소를 새로 보장하지 않는다.

추가 필수 준비 단계는 `AppInitialization`, 화면 이동 정책은 `AppNavigation`, 로그인 후 작업은 `AuthenticatedEffects`를 변경하는 기준이다. 기존 `_layout.tsx` 안에서 책임을 정리했으며 별도 폴더나 범용 작업 등록기는 추가하지 않았다. `SafeAreaProvider`도 준비·성공 화면의 공통 바깥에 한 번만 배치했다.

이 보완 전에 DB 재시도 중 네트워크 구독 유지와 로그인·로그아웃·재로그인 시 앱 준비를 반복하지 않는 시나리오를 추가했다. 같은 레이아웃 검사 25개가 변경 전후 통과했고, 최종 전체 client Jest는 11개 suite·132개 test 통과다. 이번 변경 파일의 ESLint 오류는 0개·경고는 기존과 같은 9개이며 Prettier도 통과했다. TypeScript의 기존 지도 관련 오류 3개는 유지된다. 이는 자동 검사와 코드 책임 비교 결과이며 사용자 최종 수락은 아직 받지 않았다.

Layout은 실제 Root·Auth/Network Store·SyncProvider·재시도 버튼을 연결하고, DB·SecureStore·네트워크·라우터/native·sync engine을 대체한다. DB 검사는 SQLite 연결·SQL 실행과 ORM 생성을 대체하며 재시도에서 삭제 SQL이 호출되지 않는지 확인한다. 실제 Expo 화면·기기 저장소·SQLite 데이터 보존·서버 전송을 실행한 증거는 아니다.

## 독립 리뷰 반영 후 현재 구조

사용자는 독립 리뷰 검토 뒤 `application` 분리와 관련 개선을 진행하도록 요청했다. 이전의 파일 분리 보류는 이 범위에서 대체한다. 별도 파일로 옮긴 앱 책임은 [AppInitialization](../../apps/client/src/application/AppInitialization.tsx)이며, 화면 구성·인증 이동과 인증 후 작업의 연결은 `_layout.tsx`에 유지한다. 여행 선택 규칙과 정리 실행은 각각 해당 기능·서비스에 둔다.

- **DB 접근:** 공개 `db` 변수를 없애고 `getDatabase()`가 스키마 준비 성공 뒤에만 클라이언트를 제공한다. 초기화 전·SQL 준비 실패 뒤·reset 실패 뒤에는 명확한 오류를 던진다. reset 시작 시 준비 완료 상태를 폐기하고 성공 뒤 복구한다. 기존 DB 호출부 21개 파일은 이 접근 함수로 연결하며 기존 SQL·조회·mutation·트랜잭션 호출을 유지한다. 이미 얻어 간 DB 객체를 취소하는 계약은 추가하지 않았다.
- **인증 복원:** `restoreSessionOnce`로 이름을 바꿔 Store 생애에 한 번 수행한다는 의미를 드러냈다. 읽기 실패 뒤 자동 재시도나 데이터 삭제는 추가하지 않는다. 복원 중 별도 진입점이 직접 login/logout을 호출하는 경쟁까지 새로 해결한 것은 아니다.
- **여행 선택:** [useTripSelection](../../apps/client/src/entities/trip/data/useTripSelection.ts)이 현재 선택을 보존하고 최초 기본 선택을 담당한다. 사용자는 정상 서버 조회에서 현재 여행이 제거됐다고 확인되면 다른 여행으로 전환하는 동작을 선택했다. 남은 여행이 없으면 선택을 해제한다. Repository가 실제 Local/Remote 출처를 결과에 붙이고 `useGetTrips`가 배열과 출처를 소비자에게 제공한다. 조회 실패·진행 중·불완전한 Local 목록·offline/unknown에서는 기존 선택을 제거하지 않는다. 연결 복구만으로 선택을 바꾸지 않는다. 다중 기기 전체 지원을 추가한 것은 아니다.
- **미완료 cleanup:** [cleanup-job](../../apps/client/src/shared/services/sync/cleanup-job.ts)이 진행 중 Promise를 공유하고 캐시 갱신을 한 번 수행한다. Root의 지연 실행·해제는 [usePendingCleanups](../../apps/client/src/shared/services/sync/usePendingCleanups.ts)로 옮겼으며 sync 엔진의 중복 캐시 갱신을 제거했다. SQL 정리·미동기화 보호·soft delete·vacuum 내부 조건은 변경하지 않았다.
- **로그아웃:** 사용자가 “실행 중인 정리가 끝난 뒤 DB를 비우고 로그아웃”을 선택했다. [logout-service](../../apps/client/src/shared/services/auth/logout-service.ts)의 공통 로컬 세션 종료가 새 pending cleanup을 막고 진행 중 정리의 성공·실패 종료를 기다린 뒤 큐·DB·인증·여행 선택·캐시를 비운다. 같은 DB reset을 사용하는 회원 탈퇴에도 적용한다. 종료 중 오류가 나도 cleanup 일시 중단은 해제한다. 지도 만료 정리·sync 전체 작업까지 중단시키는 계약은 아니다.

제품 변경 전에 DB 준비 전/실패 후 접근 시나리오 3개, 사용자 선택 보존 1개, cleanup 공유 실행·로그아웃/탈퇴 조율 4개의 실패를 확인했다. 세션 종료 때 여행 선택을 비우는 추가 기대도 로그아웃·탈퇴 2개에서 실패를 확인한 뒤 구현했다. 여행 선택의 세부 경우와 Local/Remote 출처 전달, cleanup 조율은 해당 기능·서비스 테스트에서 검사한다. Root의 기존 진입·재시도·라우팅 통합 검사는 유지한다.

최종 client Jest는 14개 suite·154개 test 통과다. 변경된 TypeScript 파일의 ESLint는 Prettier 연동 규칙 제외 시 오류 0개·경고 27개이며, 별도 Prettier 검사와 `git diff --check`가 통과했다. TypeScript에는 기존 Mapbox 좌표·OfflinePack 필드 오류 3개가 남는다. DB 호출부까지 검사 범위가 넓어져 기존 any·non-null·미사용 import 경고도 집계에 포함된다.

검증은 Jest와 타입·정적 검사이며 실제 기기 DB 이관·데이터 보존·native 화면·서버 전송을 실행한 증거는 아니다. SQL migration은 별도 작업으로 남긴다. 준비 완료는 DB 준비와 인증 복원 시도의 완료이며 로그인 여부를 뜻하지 않는다. 로그인·로그아웃·override 변화에 따른 sync 시작 조건, Debug 직접 sync 호출, 전체 인증 route guard 정리와 sync engine·cleanup 내부 보존 계약의 나머지 범위는 후속 작업이다.

## 코드 표현과 테스트 가독성 정리

사용자가 변경 파일만 제공한 독립 코드 스타일 리뷰의 기준을 적용하도록 요청했다. 개행·들여쓰기·따옴표는 기존 Prettier 설정을 따르고, 빈 줄은 준비·조기 반환·외부 작업·결과의 구분에 사용한다. 짧은 guard에도 중괄호를 사용한다. 공개 함수에서 파일의 역할을 먼저 읽고 내부 구현으로 이어지도록 로컬 세션 종료와 도시 참조 재계산 함수를 배치했다.

주석은 동작을 다시 말하는 단계 번호·사용 예시보다 계약·이유·예외를 남긴다. 로컬 DB가 항상 최신이라는 설명, metadata 조회가 활성화 정보를 합친다는 설명, Query hook의 반환 타입 설명을 실제 구현에 맞춰 정리했다. 도시 참조 처리는 감소가 아니라 재계산이라는 이름을 사용하며, 지도 만료 정리가 DB 레코드만 삭제하는 경로라는 사실을 주석과 로그에 반영했다. 이 경로의 native pack 삭제 동작을 새로 구현한 것은 아니다.

로그의 선행 이모지를 제거하고 담당 모듈을 표시했다. 핵심 인증·초기화 이벤트는 필요한 값을 별도 필드로 남기며, 기다리지 않는 캐시 재조회는 완료 대신 요청으로 표현한다. 기존 캐시 호출에 `await`를 추가하지 않았으며 백그라운드 작업의 오류 처리도 유지했다. 비동기 호출 전체에 `void`를 추가하는 표현은 프로젝트의 `no-void` 규칙과 충돌해 채택하지 않았다. 기존 초기화와 cleanup의 `void` 경고는 이번에 별도로 해결하지 않았다.

Layout 테스트는 준비·네트워크 수명·인증 변화·여행 선택·정리 예약으로 묶었다. 여행 선택 테스트는 문자열에 따른 분기 대신 경우별 입력 객체를 제공한다. cleanup 종료 조율 테스트의 반복 microtask 대기는 실제 일시 중단 진입을 관찰하는 Promise로 교체했다. React 업데이트를 반영하는 helper는 준비 완료를 보장하는 이름 대신 `flushReactUpdates`로 명명했다.

정리 전후 전체 client Jest 14개 suite·154개 test가 통과했다. 변경된 TypeScript 파일 39개의 ESLint는 Prettier 연동 규칙 제외 시 오류 0개·경고 26개이며, 직전 27개에서 미사용 import 경고 1개를 제거했다. 별도 Prettier 검사와 `git diff --check`도 통과했다. 타입 검사는 기존 Mapbox 좌표·OfflinePack 필드 오류 3개가 유지된다. 이 결과는 자동 검사 범위의 회귀 확인이며 실제 기기 동작이나 Ticket 전체 완료를 의미하지 않는다.
