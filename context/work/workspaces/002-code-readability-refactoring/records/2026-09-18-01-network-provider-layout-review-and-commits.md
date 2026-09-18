# Ticket 06 — 파일별 검토·Provider 보완·레이아웃 검사와 커밋

## 채택한 작업과 범위

사용자는 기존 동작을 크게 확장한 워커 구현을 철회한 뒤, 직접 코드를 읽고 파일별로 가독성과 흐름을 정리했다. 이번 기록의 근거는 이 작업 대화의 사용자 요청과 Main이 읽은 소스·Git diff 및 실행한 검사다. 앞선 [확대 구현과 철회 기록](2026-09-17-02-network-consumer-quality-improvements.md)은 사용자 선택인 “철회 표시를 유지해 이력으로 보존”에 따라 그대로 남긴다. 당시 전체 기능 구현과 검증 결과를 현재 결과로 재사용하지 않는다.

Network Store는 사용자가 제공한 코드로 교체하되 refresh의 관측 반영 오류를 네트워크 요청 실패로 삼키지 않도록 `operation.accept(state)`를 `try/catch` 밖에 둔 차이를 유지했다. Promise의 공유·완료 의미를 보존하고 내부 비동기 호출은 async/await로 읽도록 정리했다. 자체 테스트는 현재 함수·변수 이름과 테스트 의도를 맞췄다. NetworkStatus의 enum 전환은 영향 범위만 메모한 추후 후보이며 구현하지 않았다.

SyncProvider는 사용자 제안 코드를 검토한 뒤 채택했다. `syncingRef`로 같은 렌더 안의 동시 호출을 막고 `finally`에서 잠금을 해제한다. 실행 함수 참조가 상태 변경마다 바뀌지 않으며, 주기 타이머도 sync 완료나 네트워크 변화 때문에 다시 시작하지 않는다. 주기 실행은 기본 비활성이다. 실제 online·override 해제 조건을 유지하고 차단 로그를 offline·unknown·override·이미 실행 중으로 구분했다. Context 값은 useMemo로 유지한다. 동시 호출은 같은 Promise를 공유하는 방식이 아니라 후속 호출을 즉시 반환시키며, 잠금은 Provider 인스턴스 내부에 한정된다.

## 레이아웃의 개선과 유지한 동작

Root의 import·함수 배치와 initializer 이름을 정리하고, pending cleanup 실행 함수를 effect에서 분리했다. Store는 필요한 값만 구독하며 cleanup 지연 시간을 이름 있는 상수로 옮겼다. 로그는 단계·실행 이유·소요 시간과 같은 값을 구조화했다. DB 초기화 뒤 auth 복원, 네트워크 lifecycle의 독립 effect, 준비 시도 종료 후 화면 진입이라는 기존 흐름은 유지했다.

사용자가 제공한 후보의 여행 조회 오류 시 즉시 return은 제외했다. 기존에는 오류와 함께 이전 여행 데이터가 남아 있으면 선택 로직을 계속 실행했기 때문이다. 이 차이는 코드 비교로 보존했으며 오류+캐시 선택 정책 전체를 새 테스트 계약으로 확정하지 않았다. DB 실패에도 화면 자체가 오류 처리를 보장한다는 주석은 실제 코드보다 강한 설명이므로, 준비 시도가 끝났다는 의미까지만 남겼다.

파일 분리는 검토 후 보류했다. Main은 처음 features/app-startup을 제안했지만 초기화·전역 인증 라우팅은 App 책임임을 재확인했다. 이어 제안한 src/application은 기존 프로젝트에 없는 물리적 위치였고, 별도 FSD 계층을 뜻하는 것처럼 설명한 부분을 정정했다. 설치된 Expo Router는 app 하위 일반 TSX도 라우트 탐색 대상으로 삼는다. 사용자는 최종적으로 “그럼 그냥 layout에 두자 그냥”을 선택했다. initializer와 AuthRouter는 `_layout.tsx` 내부에 유지하며, AuthenticatedAppEffects·AuthRouteRedirect 등 제안했던 추가 이름과 폴더는 적용하지 않았다. 새 startup framework도 추가하지 않았다.

나머지 제품 변경은 Debug의 실제/강제 3상태 표시·미확정 override·재확인 버튼, HomeScreen의 사용하지 않는 예제 제거, ScheduleCard 메뉴 이벤트의 구체 타입 지정, Policy 상태 타입 재사용과 빈 interface 정리다. ScheduleCard의 비구독 실제 getter 방식은 그대로 남는다.

## 검증 결과와 입증 범위

레이아웃 테스트 15개를 작성해 개선 전후 모두 통과시켰다. native 화면·Mapbox·DB·조회·엔진을 mock하고 실제 RootLayout·Network Store·SyncProvider·여행 선택 Store를 연결했다. 인증 Store는 테스트용 Zustand Store다. 첫 실패는 SafeAreaProvider가 테스트에서 자식 화면을 렌더링하지 않는 환경 문제였고 해당 native 경계만 대체해 해결했다.

검사한 결과는 DB→auth 호출 순서와 준비 전 화면/Splash 유지, 네트워크 unknown에서도 진입, unmount의 감지·타이머 정리, 비인증 작업 차단, 인증 상태별 route 이동, 최초 대표/첫 여행 선택과 빈 목록의 선택 유지, 2초 cleanup 실행·처리 후 캐시 무효화·실패·로그아웃 시 타이머 해제다. 네트워크 복구 재조회 후 사용자 선택 보존 전체와 DB/auth 실패 UX를 검증한 것은 아니다.

Main은 최종 제품 커밋 직전에 다음을 직접 실행했다.

- `node_modules/.bin/jest --config apps/client/jest.config.cjs --runInBand`: 8개 suite, 108개 test 통과. 이 중 Layout 15개, Provider 9개, Network Store 24개다.
- 남은 제품 파일 5개와 Layout test의 Prettier 검사 통과.
- 같은 6개 파일의 ESLint는 기존 Prettier plugin 연동 규칙을 끈 명령에서 오류 0개·경고 9개. Layout의 void/Mapbox 토큰 단언과 HomeScreen inline style 경고가 남는다. 정규 전체 lint 성공을 뜻하지 않는다.
- client 전체 TypeScript 검사에는 기존 mapbox 좌표 튜플 오류 1개와 offline-map download의 size/tileCount 오류 2개만 남았다. 새 파일의 타입 오류는 해결했다.
- `git diff --check` 통과. 실제 Expo 기기·native·SQLite 데이터 보존·서버 전송은 실행하지 않았다. mock 통과를 이 범위의 검증으로 확대하지 않는다.

## 커밋 경계

처음 Main은 사용자의 네트워크 커밋 요청을 소비부 전체 승인으로 넓혀 해석했다. 사용자는 “network랑 테스트랑 확인했다고 관련 호출 부 정도나 뭐 그런거 하란거지 나머지 코드 확인 안됐어”라고 정정했다. 커밋에서 제외한 내용은 작업 폴더에 보존하고 이후 검토·승인된 범위별로 저장했다. 검토되지 않은 관련 파일이라는 이유만으로 함께 커밋하지 않는 기준을 적용했다.

- `c578446`: Network Store·자체 테스트·최소 호출부 호환 변경.
- `6efdfed`: useAppPolicy·Activation Router·SyncProvider와 대응 테스트 3개. 테스트를 함께 포함하도록 사용자 요청으로 수정한 최종 커밋이다.
- `0ce6f4d`: Root 레이아웃·Layout 테스트·Debug 화면·HomeScreen·ScheduleCard·Policy 타입. 사용자의 “나머지 코드들도 커밋하자 그리고 기록할거 잘 남겨놔줘” 요청으로 남은 6개 제품/테스트 파일을 저장했다.

이 기록과 Ticket·state·output 및 기존 미커밋 기록은 별도의 문서 커밋으로 보존한다. 로컬 의존성 캐시 `.pnpm-store/`는 제품 산출물이 아니므로 포함하지 않는다. 원격 push는 요청되지 않았다.

## 남은 상태

Ticket 06 전체 완료·수락은 아니다. Provider ref 잠금 문제는 이번 사용자 승인 코드와 동시 호출 테스트로 보완됐지만, DebugScreen의 수동 sync는 여전히 engine triggerSync를 직접 호출한다. DB 사용 가능·auth 복원/인증·login·override 해제의 sync 시작 연결, DB/auth 실패 화면 정책, 대상 Trip별 Router 및 inactive child의 Local 선조회, 제한 화면·복구 조회·폼 유지 전체는 후속 판단으로 남는다. 발견 사실만으로 현재 가독성 작업을 확장하지 않는다.

기록은 사용자 요청에 따른 수동 Maintain 경로로 반영했다. 자동 session binding이나 이전 실패 generation 복구, machine status·제품 Verify receipt 생성, 전체 Ticket 수락을 뜻하지 않는다.
