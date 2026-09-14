# 첫 실행부터 주요 기능을 시험하는 시나리오 조사

앱을 처음 접한 개발자가 저장된 계정으로 앱을 다시 켜고, 여행을 만들고 선택하며, 일정·경비 입력과 오프라인 전환을 시험하는 흐름을 조사했다. 첫 진입에서 인증을 복구하는 과정과 안내 버튼의 이동, 생성한 항목의 즉시 수정, 선택한 여행의 유지, 동기화 실패 후 로그아웃에서 구체적인 문제를 확인했다.

2026-09-13 Main이 현재 소스를 추적하고 분리 실험을 실행했다. 기준은 `refactor/codebase`, HEAD `70155641b2bda13df6b905b58ebbe414fa5ee0ed`다. 실행에 사용한 파일별 SHA-256과 도구 버전은 [실험 출력](../source/2026-09-13-first-use-probes-output.json)에 있다. 002에서 진행 중인 문서 변경은 이 조사에 포함하지 않았다.

## 조사 요청과 확인 범위

같은 작업 대화의 사용자 요청에서 핵심 원문을 보존한다.

> “앱을 켰을때 예를 드렁 로그인 재시도 안내문이 나오거든? 이미 로그인 되어 있는데도”
>
> “앱을 처음 보는사람이 여러 주요기능을 만져볼대 예상 시나리오를 기반으로 버그가 있는지 더 추가 조사를 하고 싶어 특히 개발자가 앱을 처음 키고 여러 테스트르를 한다 가정하고”

사용자가 실제로 본 문구·기기 로그는 아직 대조하지 않았다. 우선 현재 코드의 “세션이 만료되었습니다 / 동기화를 위해 다시 로그인하세요” 배너를 대응 후보로 조사했다. 이 경로의 결함을 확인한 것과 사용자의 그 실행에서 원인이 확정된 것은 구별한다.

[실험 스크립트](../source/2026-09-13-first-use-probes.cjs)는 현재 TypeScript 소스를 읽어 실행한다. 인증은 실제 Axios interceptor chain에 메모리 응답을 연결하고, 기본 network adapter는 차단했다. Repository·동기화·로그아웃에서는 DB·서버·토큰 저장을 대체 함수로 바꿔 호출과 결과를 관찰했다. 화면 이동과 여행 선택은 원본 함수 본문을 추출해 effect를 실행했다. 늦게 도착한 통화는 실제 React·react-hook-form을 React test renderer로 재렌더링했다.

이 결과는 실기기 화면 조작, OAuth 공급자 로그인, 실제 서버·SecureStore·SQLite 데이터 검증이 아니다. 제품 코드는 수정하지 않았다. 이 기록은 추가 조사 산출물이며 첫 수정 Ticket·제품 Verify·완료 또는 구현 순서 변경을 확정하지 않는다.

## 시작·로그인 복구에서 확인한 문제

### 앱을 다시 켜면 자동 갱신 가능한 토큰도 재로그인 안내로 이어진다

저장된 계정, 만료된 access token, 여전히 갱신 가능한 refresh token, 활성 여행 또는 전송할 queue가 있는 온라인 재시작을 생각하면 된다. 짧게 쓰는 access token이 만료돼도 refresh token으로 갱신할 수 있으면 사용자가 다시 로그인하지 않고 계속할 수 있어야 한다.

인증 store는 저장된 userId와 access token의 존재로 `isAuthenticated=true`를 복원한다. 시작 동기화는 `SyncProvider`에서 실행되며, 실제 사용하는 `sync/api.ts`는 401을 받으면 refresh를 시도하지 않고 `isSessionExpired=true`로 바꾼다. 특히 활성 여행이 있으면 여행 목록도 로컬로 조회하므로 일반 API의 refresh 경로가 이 상태를 반드시 회복시켜 주지 않는다.

분리 실험 `sync-401-valid-refresh-available`에서는 갱신 함수가 사용 가능한 상태에서도 호출 횟수가 0이었고 만료 상태와 `AuthRequiredError`가 반환됐다. 일반 API 갱신 성공은 별도 대조 경로에서 확인했다. 실제 refresh token까지 만료·폐기된 경우의 재로그인 안내는 이 결함과 구별해야 한다.

근거: [인증 복원](../../../../../apps/client/src/shared/store/auth.ts) 48–70행, [시작 동기화](../../../../../apps/client/src/shared/services/sync/provider.tsx) 112–118행, [실제 sync 401 처리](../../../../../apps/client/src/shared/services/sync/api.ts) 59–64행, [활성 여행 pull](../../../../../apps/client/src/shared/services/sync/engine.ts) 153–183행.

### 안내의 재로그인 버튼을 눌러도 로그인 화면에 머물 수 없다

배너는 기존 로그인 정보를 유지한 채 `/(auth)/login`으로 이동한다. 그러나 공통 `AuthRouter`는 `isAuthenticated=true`이고 auth 화면에 있으면 만료 여부와 무관하게 `/(tabs)`로 돌려보낸다. 사용자는 안내에 따라 눌러도 홈으로 돌아오는 흐름에 놓인다.

`relogin-destination-authenticated-expired`에서 `isAuthenticated=true`, `isInitialized=true`, `isSessionExpired=true`와 로그인 화면 위치를 넣어 원본 effect를 실행하자 홈 이동을 관찰했다. 화면 깜박임이나 native navigation 타이밍은 기기에서 추가 확인해야 한다.

근거: [배너](../../../../../apps/client/src/shared/components/SessionExpiredBanner.tsx) 22–32행, [AuthRouter](../../../../../apps/client/app/_layout.tsx) 136–159행. 기존 후보에 구체적으로 적혀 있지 않던 인증 복구 경로의 추가 발견이다.

### 토큰 갱신에 성공한 첫 API 요청은 응답 구조가 한 번 더 벗겨진다

일반 API에서 401을 받고 갱신에 성공하면 원래 요청을 같은 Axios 인스턴스로 재실행한다. 안쪽 요청의 응답에는 이미 `handleResponse`가 적용돼 `{ success, data }`만 남아 있다. 그 결과가 바깥 요청의 `handleResponse`를 다시 통과하면 `.data`가 한 번 더 적용된다.

같은 서버 응답을 둔 `refresh-success-response-shape` 실험에서 보통 요청은 `{ success: true, data: [...] }`, 갱신을 거친 요청은 `[...]`를 받았다. 여행·일정·경비 API는 바깥 응답 계약을 Zod로 검증하므로 이 차이는 갱신 직후 조회·저장을 실패로 처리하게 만드는 조건이다. 서버가 저장을 마친 뒤 화면이 실패로 처리할 수 있으며, 재입력 시 중복 저장까지 생기는지는 별도 조사해야 한다.

근거: [갱신 뒤 같은 인스턴스로 재요청](../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts) 125–135행, [응답 추출 및 설치 순서](../../../../../apps/client/src/shared/api/fetcher.ts) 26–28·58–64행, [응답 소비자 예](../../../../../apps/client/src/entities/schedule/api/schedules.ts). 기존 일반적인 오류 응답 불일치 관찰보다 구체적인 새 실패 조건이다.

### 일시적인 갱신 통신 실패도 세션 만료로 확정한다

일반 요청의 401 후 refresh 중 네트워크 오류가 나면, 갱신 함수는 모든 예외를 동일한 실패로 처리하고 세션 만료를 표시한다. 이어 `AuthRequiredError`는 공통 fetcher에서 `UNKNOWN_ERROR`로 바뀐다. 현재 연결 문제와 실제 계정 재인증 필요를 구분할 정보가 화면 소비 단계에서 사라진다.

`refresh-network-failure`에서 통신 오류를 주입했을 때 `sessionExpired=true`, 사용자 메시지 “알 수 없는 에러가 발생했습니다”를 확인했다. 최초 일반 요청 자체가 단순 네트워크 오류인 경우까지 세션 만료로 표시된다는 주장은 아니다. 401 다음의 갱신 실패라는 순서가 필요하다.

근거: [갱신 예외 처리](../../../../../apps/client/src/shared/services/auth/auth-interceptor.ts) 41–60·138–151행, [오류 재포장](../../../../../apps/client/src/shared/api/fetcher.ts) 30–50행.

## 여행·일정·경비를 이어서 조작할 때

### 활성화하지 않은 여행에서 생성한 일정·경비를 바로 수정할 수 없다

처음 로그인한 계정에서 여행을 만들고, 오프라인 활성화 없이 일정 또는 경비를 추가한 뒤 제목을 수정하는 흐름이다. 생성은 서버 경로를 사용할 수 있지만 수정은 먼저 로컬 행에서 tripId를 찾는다. 로컬에 그 항목이 없으면 서버에 도달하기 전에 `not found`로 끝난다.

두 Repository의 실제 함수를 호출한 실험에서 생성은 반환됐고 수정은 각각 `Schedule not found`, `Expense not found`였으며 원격 수정 호출은 0회였다. DB와 서버는 대체했으므로 실제 서버 저장·화면 결과를 실행했다고 확대하지 않는다. 삭제와 일정별 경비 조회도 같은 로컬 선행 의존이 코드에 있으나 이번 실행은 생성 후 수정에 한정했다.

근거: [ScheduleRepository](../../../../../apps/client/src/entities/schedule/repository/schedule-repository.ts) 48–91행, [ExpenseRepository](../../../../../apps/client/src/entities/expense/repository/expense-repository.ts) 36–99행. 기존 “비활성 여행의 local 선행 의존” 후보를 첫 사용 시나리오와 분리 실행으로 강화했다.

### 직접 고른 여행이 목록 갱신 뒤 다른 여행으로 바뀔 수 있다

여행 A와 B가 있을 때 B를 골라 테스트하다가 여행 목록 내용이 갱신되는 상황이다. 전역 `InitializeMainTrip`은 목록 관련 effect가 실행될 때마다 현재 선택을 확인하지 않고 날짜 기준 대표 여행을 다시 선택한다. 따라서 이름 수정·동기화 등으로 목록이 달라지면 B 선택이 A로 덮일 수 있다. 그 뒤 일정·경비 추가는 현재 선택된 여행의 ID를 사용한다.

`trip-list-effect-after-user-selected-B`에서 원본 effect를 실행하면 B가 A로 바뀌었다. 재조회 결과가 완전히 같아서 React Query가 같은 목록 참조를 유지하는 경우까지 모든 새로고침에서 바뀐다고 주장하지 않는다. 실제 목록 변경으로 effect가 다시 실행되는 조건을 기기 검증에 포함해야 한다.

근거: [전역 선택 effect](../../../../../apps/client/app/_layout.tsx) 52–75행, [사용자 선택](../../../../../apps/client/src/entities/trip/ui/TripSelector.tsx), [경비 추가에 선택 ID 사용](../../../../../apps/client/src/screens/ExpensesScreen.tsx) 242–247행. 새로 확인한 사용자 선택 유지 문제다.

### 늦게 읽힌 여행 통화가 경비 기본값에 반영되지 않는다

여행 데이터가 아직 없는 시점에 경비 작성 hook이 먼저 실행되면 USD로 초기화된다. 뒤늦게 JPY 여행 정보가 와도 react-hook-form 초기값을 갱신하지 않는다. 실험에서 여행 통화가 JPY로 도착한 뒤에도 실제 form 값은 USD였다.

이 조건은 cold deep link나 여행 query가 없는 상태에서 먼저 작성 화면이 열리는 경우를 대상으로 한다. 일반 여행 목록을 이미 읽고 들어온 경로에서는 처음부터 올바른 통화가 들어갈 수 있다. 기존 “비동기 초기값” 후보를 분리 실행으로 강화했으며 모든 경비 작성의 오류로 일반화하지 않는다.

근거: [경비 작성 hook](../../../../../apps/client/src/features/expense/create-expense/useCreateExpenseForm.ts) 20–40행, [경비 작성 화면](../../../../../apps/client/src/screens/CreateExpenseScreen.tsx) 23–29행.

### 조회 실패가 날짜별 빈 목록처럼 보일 수 있다

여행 목록은 읽혔지만 일정 또는 경비 조회가 처음 실패해 cache가 없는 상황을 본다. 두 화면은 `data=[]`, `isLoading`을 소비하고 오류 상태를 별도 표시하지 않는다. 여행 날짜가 있으면 각 날짜 아래에 “이 날의 일정을 추가해보세요” 또는 “이 날의 경비를 추가해보세요”가 표시될 수 있다. 경비 합계도 읽기 실패와 실제 0을 구분하지 않는다.

근거: [일정 화면](../../../../../apps/client/src/screens/ScheduleScreen.tsx) 58–59·225–234행, [일정 목록](../../../../../apps/client/src/features/schedule/schedule-list-view/ScheduleListView.tsx) 73–132행, [경비 화면](../../../../../apps/client/src/screens/ExpensesScreen.tsx) 30–34·197–220·257–280행. 소스에서 화면 분기를 확인했으며 native 화면 실험은 하지 않았다. 기존 조회 실패 표시 후보에 구체적인 조건을 더한 것이다.

## 오프라인·재연결·테스트 종료에서

### 수동 동기화 실패가 성공 안내로 돌아온다

개발자 화면에서 수동 동기화를 누르고 전송이 실패하는 상황이다. `pushChanges`는 작업을 FAILED로 기록한 뒤 정상 반환한다. 활성 여행이 없어서 pull을 건너뛰면 `triggerSync`는 성공과 “동기화가 완료되었습니다”를 반환한다. 개발자 화면은 그대로 성공 알림을 띄운다.

`manual-sync-push-fails-no-active-trip`에서 작업 상태가 IN_PROGRESS 다음 FAILED였는데 반환은 성공이었다. 활성 여행이 있을 때는 이어지는 pull의 성공·실패에 따라 결과가 달라진다. 기존 “동기화 결과” 후보를 개발자 수동 테스트의 구체적인 실패 조건으로 재현했다.

근거: [push·triggerSync](../../../../../apps/client/src/shared/services/sync/engine.ts) 98–141·258–300행, [개발자 화면 알림](../../../../../apps/client/src/features/debug/ui/DebugScreen.tsx) 125–133행.

### 전송 실패 항목만 남으면 로그아웃의 손실 경고를 건너뛴다

일정이나 경비를 저장한 뒤 전송 실패를 일으키고, 테스트를 끝내려고 프로필에서 로그아웃하는 순서다. `checkPendingSync`는 PENDING과 IN_PROGRESS만 경고 대상에 넣고 FAILED는 따로 세기만 한다. FAILED만 있으면 기본 로그아웃이 queue 삭제와 DB 초기화로 진행된다.

`logout-with-failed-unsent-item`에서 FAILED 1개를 둬도 경고 조건은 false였고 `clearSyncQueue`, `resetDatabase` 호출을 관찰했다. PENDING 1개 대조군에서는 경고 결과를 반환하고 삭제 호출은 없었다. 실제 사용자 데이터를 지운 실험이 아니라 삭제 함수를 spy로 대체한 제어 흐름 확인이다.

근거: [로그아웃 안전 조건과 정리](../../../../../apps/client/src/shared/services/auth/logout-service.ts) 35–45·83–118행, [프로필 경고 분기](../../../../../apps/client/src/screens/ProfileScreen.tsx) 30–58행. 기존 비활성화 cleanup 후보와 같은 상태 해석 문제지만, 새로 확인한 영향 경계는 로그아웃이다.

### 온라인에서 새 여행을 만든 직후의 후속 기능은 추가 재현이 필요하다

여행 A가 활성화된 동안 B를 만들면 `routeTripMutation`은 B도 로컬로 생성한다. B 자체는 비활성이므로 B의 일정 생성은 remote, 활성화는 서버 endpoint로 간다. B의 CREATE가 아직 서버에 전송되지 않았다면 후속 작업이 서버에 없는 부모를 참조할 수 있다. 현재 Provider는 주기 동기화가 기본 꺼져 있고, 생성 hook은 query만 무효화하며, 일반 목록 새로고침도 sync를 호출하지 않는다.

소스에서 경로 차이와 호출 부재를 확인했다. 실제 UI 순서·서버 결과·전송 타이밍을 합친 재현은 미수행이며, 즉시 전송 시점의 제품 기대도 확인할 필요가 있다. 이 조건을 해결했다고 주장하거나 광범위한 동기화 재설계를 채택하지 않는다.

근거: [Trip 생성 분기](../../../../../apps/client/src/entities/trip/repository/trip-repository.ts) 48–52행, [Router](../../../../../apps/client/src/shared/services/offline-prep/router.ts) 80–99·113–136행, [생성 후 처리](../../../../../apps/client/src/entities/trip/data/useCreateTrip.ts) 24–37행, [SyncProvider](../../../../../apps/client/src/shared/services/sync/provider.tsx) 59–63·110–158행, [활성화 서버 요청](../../../../../apps/client/src/entities/trip/data/useActivateTrip.ts) 54–63행.

## 아직 확정하지 않은 범위와 반대 조건

수정 Drawer의 effect가 ID에만 의존한다는 사실만으로 “취소 후 같은 항목을 열면 항상 편집값이 남는다”는 결론은 내리지 않았다. 현재 일정·경비 목록 부모는 Drawer를 닫을 때 선택 객체를 null로 바꾸므로 재열기 시 ID가 null에서 실제 ID로 변한다. 다른 진입점·열린 상태의 원격 갱신은 따로 확인해야 한다. 근거: [일정 부모](../../../../../apps/client/src/screens/ScheduleScreen.tsx) 257–278행, [경비 부모](../../../../../apps/client/src/screens/ExpensesScreen.tsx) 300–320행.

일정 생성 화면은 날짜별 추가에서 받은 `date`를 실제 폼에 넣는다. 따라서 초기 조사 중 검토한 “전달 날짜를 전혀 사용하지 않는다”는 의심은 채택하지 않았다. 같은 화면의 back fallback `/(tabs)/schedule`은 실제 `schedules` 폴더와 다르지만, 일반 push로 들어가 back stack이 있는 흐름과 구별해 cold link에서만 후속 확인한다.

지도 SDK·위치 권한 거절, 장소 검색 지연, 장소 변경 후 경로, 좌표 0, 지도 다운로드 실패 후 완료 표시, DB 초기화 실패, 앱 강제 종료 후 미전송 복구, 계정 전환 도중 동기화는 이 기록만으로 실행 검증됐다고 말할 수 없다. 장소 변경·queue 원자성 등 앞선 후보는 [기존 목록](../current/memory/analysis-items.md)에 계속 남아 있다.

## 개발자가 이어서 실행할 주요 시나리오

앞에서 설명한 문제를 같은 조건으로 비교하려면 신규 계정·기존 계정, 활성 여행 유무, cache 유무를 구분한 테스트 데이터가 필요하다. 실제 계정·네트워크·지도 확인은 별도 시험 환경에서 수행하고, 저장됐다는 판단은 화면뿐 아니라 서버와 로컬 결과도 대조한다.

| 사용 순서 | 기대하는 결과 | 이번 확인과 다음 확인 |
| --- | --- | --- |
| 신규 설치, 로그인 취소, 정상 로그인 | 실패·취소에서 재시도 가능하고 로그인 성공 후 홈 진입 | 소스 경로 확인. OAuth·기기 실행 필요 |
| 저장 계정 재시작: 유효 토큰, 갱신 가능 토큰, 갱신 불가 토큰 | 자동 복구 가능한 상태와 재로그인 필요 상태를 구분 | sync 401·일반 refresh 경로 분리 실행. 사용자 실제 시작 로그 대조 필요 |
| 만료 안내의 재로그인 누르기 | 로그인 화면에 머물고 같은 계정 재인증 가능 | 홈으로 돌리는 원본 effect 확인. native 이동 확인 필요 |
| 첫 여행 생성, 비활성 상태로 일정·경비 생성 후 수정·삭제 | 만든 항목을 바로 고칠 수 있음 | 생성→수정 분리 실행 실패. 삭제·상세는 화면 시험 필요 |
| 여행 B 선택 후 A 또는 B 정보 수정·목록 갱신 | 명시적인 B 선택 유지 | 목록 effect가 A로 덮는 조건 확인 |
| 비활성 여행의 첫 조회 중 서버 오류·오프라인 | 기존 데이터 없음과 조회 불가를 구분 | 오류를 소비하지 않는 목록 화면 소스 확인 |
| 여행 통화 조회 지연, 날짜 선택, 취소·재열기 | 올바른 기본값과 의도한 취소 결과 | 통화 지연 재현. 목록 부모의 null 초기화는 반대 근거 |
| 여행 A 활성화, B 생성 직후 B 일정 추가·활성화 | 부모 저장과 후속 동작 연결 | local/remote 경로 차이 확인, 통합 재현 필요 |
| 활성 여행에서 비행기 모드, 일정·경비 저장, 앱 재실행·재연결 | 입력 유지와 서버 반영 | 기존 transaction·queue 결함 관련. 실제 기기 전 과정 미실행 |
| 장소 수정·삭제·순서 변경, 지도/목록 전환, 위치 권한 거절 | 최신 경로와 설명 가능한 제한 표시 | 기존 경로 후보 유지. 실제 지도 시험 필요 |
| 개발자 수동 동기화 실패 후 로그아웃 | 실패를 성공으로 표시하지 않고 미전송 손실 경고 | sync 결과·FAILED 로그아웃 분리 실행으로 확인 |

첫 사용에서 막히는 순서로는 인증 복구와 재로그인 이동, 비활성 여행 CRUD를 먼저 확인하는 편이 효율적이다. 데이터 보존 관점에서는 FAILED 로그아웃과 기존 transaction·cleanup 결함의 영향이 더 크다. 이는 조사 결과에 따른 제안이며 수정 우선순위의 사용자 확정이나 실행 Ticket 생성은 아니다.

## 재실행

Project root에서 다음 명령을 실행한다.

```bash
node context/work/workspaces/003-bug-investigation-and-fixes/source/2026-09-13-first-use-probes.cjs
```

보존된 성공 실행은 11개 결과 항목을 출력했다. 같은 결함의 일정·경비 변형과 정상 대조군이 포함되어 있으므로 11개 독립 버그라는 의미가 아니다. 스크립트는 현재 결함이 관찰되는지 assert한다. 수정 후 올바른 동작을 검증하는 회귀 테스트로 그대로 쓰지 않는다. 제품 Verify는 실행하지 않았고 기존 `status.json`의 의미를 바꾸지 않았다.
