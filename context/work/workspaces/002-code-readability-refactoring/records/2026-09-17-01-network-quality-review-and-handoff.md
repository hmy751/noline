# Work Handoff: Ticket 06 네트워크 기반과 품질 리뷰

- transfer-status: prepared
- prepared-at: 2026-09-17T11:37:52+09:00
- sender: 현재 작업 Main
- intended-receiver: same-workspace fresh agent
- workspace: /Users/hammyeong-yeon/Desktop/10_work/noline
- revision: 1

## 1. Purpose and done criteria

002 Workspace의 원래 목적은 코드의 읽기 부담과 유지보수 부담을 줄이는 것이다. 사용자는 Ticket 06의 네트워크 기반을 먼저 작업하기로 했고, 기능을 연결하면서 코드와 테스트의 가독성도 개선하도록 요청했다. 이번 인계는 이미 구현한 결과와 최신 전문가 리뷰의 미해결 문제를 분리해 다음 세션이 소스에서 다시 확인할 수 있게 하는 준비다. 수신자의 인수 확인과 Ticket 06 최종 수락은 아직 없다.

Ticket 전체 완료 기준은 [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md)이 소유한다. Store 단위 검사 통과만으로 제한 화면·대상별 Router·DB/auth·sync·native 연결의 완료를 선언하지 않는다. 인계 자체의 완료는 문서를 저장하고 현재 코드·검사·미커밋 상태·다음 확인 경로를 연결하는 데 한정한다.

## 2. Current state and last verified point

- verified: Network Store 첫 구현, 실제/표시 API 이름 구분, 품질 리뷰 후 테스트·SyncProvider effect 보완, 같은 파일 안의 action factory 분리가 현재 소스에 있다. Main은 아래 최신 전문가 지적의 코드 경로도 직접 대조했다.
- reported: 전문가가 React를 대체한 동일-render 진단에서 sync engine 호출 두 번을 관찰했다고 보고했다. Main은 원인 코드를 확인했지만 이 진단을 실제 React fixture로 재현하지 않았다.
- unknown: 실제 Expo·NetInfo 기기 통합, SQLite queue 경쟁·원자성, 외부 API 쓰기와 서버 중복 영향, 앱 실행 환경의 데이터 격리. 최신 리뷰의 수정안은 미구현이다.
- last verified point: 2026-09-17 오전의 현재 작업 트리에서 client Jest 7개 suite의 90개 test 통과, 수정 제품 코드 11개와 새 테스트 4개의 Prettier 통과, 아래 범위의 ESLint 통과, 기존 지도 타입 오류 세 개 확인. 명령과 한계는 11절에 있다.

## 3. Sources of truth and artifacts

- project instructions: [루트 가이드](../../../../../CLAUDE.md), [client 가이드](../../../../../apps/client/CLAUDE.md), [Work 지침](../../../AGENTS.md), [Workspace 진입](../README.md). 다음 구현을 시작하기 전 관련 rules·guards와 Ticket 실행 기준을 적용한다.
- branch and HEAD: `refactor/app-startup-lifecycle`, `7cfa7db7f4a56f05f618163b80c77848032e28a3` — `docs(workspace): Ticket 06 네트워크 정책과 구현 범위 정리`.
- dirty state: 이 HEAD 이후 제품 코드와 새 테스트, 관련 문서가 **미커밋**이다. staged 변경은 없다. 별도 untracked `.pnpm-store/`는 이번 산출물이 아니며 보존한다. 첫 구현 기록과 가독성 기록도 untracked 상태다. 새 세션은 `git diff`뿐 아니라 untracked 테스트도 읽어야 한다.
- primary artifacts: [Ticket 06](../current/memory/tickets/06-app-startup-lifecycle.md), [현재 상태](../current/state/index.md), [산출물](../output/index.md), [Network Store](../../../../../apps/client/src/shared/store/network.ts), [SyncProvider](../../../../../apps/client/src/shared/services/sync/provider.tsx), [Router](../../../../../apps/client/src/shared/services/offline-prep/router.ts).
- supporting evidence: [정책 인터뷰·구현 범위](2026-09-16-01-network-policy-and-implementation-boundaries.md), [첫 구현](2026-09-16-02-network-store-first-step.md), [첫 가독성 보완](2026-09-16-03-network-store-readability.md). 당시 81개 test 결과와 당시 함수 이름은 역사로 유지한다. 현재 결과는 이 기록과 현재 소스를 따른다.

제품 변경은 Store, Root, DashboardView, Policy types/hook, Router, SyncProvider 및 API 이름을 옮긴 HomeScreen·TripDateForm·NetworkStatusIndicator·ScheduleCard의 11개 파일이다. 새 영구 검사는 [Store](../../../../../apps/client/tests/shared/store/network.test.ts), [Router](../../../../../apps/client/tests/shared/services/offline-prep/router-network.test.ts), [Policy](../../../../../apps/client/tests/shared/policy/useAppPolicy-network.test.ts), [Provider](../../../../../apps/client/tests/shared/services/sync/provider-network.test.tsx)의 4개 파일이다. `.claude/context/policy-architecture.md`에도 앞선 호환 문서 변경이 남아 있다. 이를 이번 인계에서 새로 바꾼 것으로 보지 않는다.

## 4. Decisions and rationale

- decision: Selective Local-First를 유지한다. 활성 여행은 Local SQLite, 비활성 여행은 Server API가 진실의 원천이다. Service Layer의 Network-First와 Data Layer의 Activation Router를 혼동하지 않는다.
  rationale: 모든 데이터를 무조건 Local로 보내는 아키텍처가 아니다. 현재 범위에 직접 필요한 Router 결함은 003으로 미루지 않고 002에서 정상화한다.
  evidence: 정책 인터뷰 기록과 Ticket 06의 적용 경계.
- decision: 실제 관측은 `online/offline/unknown`이다. 두 NetInfo 값 중 false가 있으면 offline, 둘 다 true이면 online, 나머지는 unknown이다. 초기뿐 아니라 이후 미확정 관측에도 적용한다. 10초는 확인 불가 안내·refresh 대기 종료 기준이며 unknown을 offline으로 만드는 시간은 아니다.
  rationale: 활성 여행의 Local 이용을 유지하면서 미확정 상태에서 서버 요청을 임의 허용하지 않는다. weak/degraded·선제적 debounce·NetInfo 설정 조정은 아직 추가하지 않는다.
  evidence: Ticket 06의 합의. 실기기 변동 빈도는 미측정이다.
- decision: 화면은 `useDisplayNetworkStatus()`로 override를 포함하고, 요청 판단은 `networkStore.realStatus` 또는 `useRealNetworkStatus()`로 실제 관측을 읽는다. debug override 중 Local write·queue 추가·Remote mutation·새 sync 전송을 막는 것이 합의다.
  rationale: 화면 실험이 실제 데이터를 바꾸게 하지 않는다. **합의가 모든 경로에서 구현된 것은 아니다**. debug 수동 sync 우회가 남아 있다.
  evidence: 정책 기록, 현재 Store·Router·Provider, 7절의 실제 debug 경로.
- decision: 비활성 여행의 offline/unknown 쓰기는 Router에서 일괄 거부하고 기존 오류 처리로 안내한다. 입력은 자유롭게 유지하고 버튼마다 조건을 복제하지 않는다. online 비활성 여행은 정상 서버 앱처럼 생성·수정·삭제를 지원해야 한다.
  rationale: 추가 입력 상태·자동 저장·캐시 복원 체계를 만들지 않는다. 제한 UI는 기존 React Query 캐시를 보존한 채 보여주고 복구 조회 성공 때 한 번의 토스트를 사용한다. 최초 unknown 해소에는 복구 토스트를 붙이지 않는다.
  evidence: 정책 인터뷰 기록. 제한 화면·복구·폼 연결과 Router 정상화는 미완료다.
- decision: action을 Store 선언 밖으로 옮기되 `currentSession`은 `createNetworkActions(set, get)` 안의 private closure에 둔다. 추가 class·framework·전역 request manager는 만들지 않는다.
  rationale: 사용자의 “너무 메서드가 많아서 안 읽혀” 요청을 반영하면서 runtime 자원의 소유권을 유지한다. 전문가도 mutable module-global이 생긴 것은 아니며 현재 factory 구조를 유지할 수 있다고 판단했다.
  evidence: Store 소스와 7절의 전문가 리뷰.

사용자는 품질 리뷰에 대해 “리뷰어가 그걸 제시하게 하라고 어떻게 하면 개선할지 목표와 구체적기준을 제시하게 품질리뷰”라고 정정했다. 이후 구현·테스트 검증을 승인했다. 마지막 리뷰는 “아니 하나 관점 말고 역할을 코드 전문가 잘 임명해서”라는 요청에 따라 좁은 전역 변수 점검이 아니라 senior/staff 수준의 TypeScript·React Native·Zustand·비동기 lifecycle·아키텍처·테스트 리뷰로 다시 맡겼다. 이 최소 발췌는 다음 세션이 리뷰의 역할과 품질 기준을 복원하기 위한 근거다.

## 5. Attempts ledger

### Succeeded

1. 첫 Store 구현: unknown 초기 상태, 순수 관측 변환, listener 기반 init/cleanup, 10초 안내와 수동 refresh, 실제/표시 분리 및 필요한 Router·Policy·Provider·debug 호환을 추가했다. 초기 전체 결과는 81개 test였다.
2. 표현 보완: 당시 제품 코드 7개와 테스트 4개의 조건 블록·간격·fixture·mock 타입·지연 Promise 이름을 정리했다. 최초 결과의 정책을 바꾸는 것으로 확대하지 않았다.
3. API 이름 보완: 실제 getter `status`를 `realStatus`, 화면 훅 `useNetworkStatus`를 `useDisplayNetworkStatus`, debug 지역 이름 `effectiveStatus`를 `displayStatus`로 옮겼다. 실제 훅은 `useRealNetworkStatus`다. 소비부 네 곳도 함께 옮겼다.
4. 품질 리뷰 실행: Router 검사가 앱 전체 activation과 대상 여행 activation을 독립적으로 대조하도록 보완했다. global=true/target=false와 global=false/target=true에서 child query·mutation의 Local/Remote 선택을 검증한다. 이는 분기 입력의 대조 fixture이며 실제 DB에서 두 조합이 항상 가능한 상태라는 주장이 아니다. query의 debug read 허용과 mutation 차단·해제 검사도 분리했다. Router 검사는 34개에서 40개가 됐다.
5. Provider 초기 mount와 online 전환 effect를 하나로 합쳤다. `previousStatusRef`의 null은 첫 effect 미처리, unknown은 실제 네트워크 상태다. 상태를 먼저 기록하므로 callback이 바뀌거나 일반 재렌더돼도 online 진입을 다시 소비하지 않는다. Provider 검사는 3개에서 6개가 됐다. **같은 render의 병렬 실행 잠금까지 구현한 것은 아니다**.
6. Store 요청 수명을 `startRefreshRequest`·finish로 모았다. 새 요청이 진행 중일 때 이전 timeout 요청의 늦은 응답이 상태·isRefreshing·공유 Promise를 바꾸지 못하는 검사를 강화했다. 등록·timer·대기 표시 순서도 한곳에서 읽힌다.
7. Main이 앞선 품질 구현 전후에 Router mutation 검사를 수행했다. 런타임 변환으로 child의 `getTripActivationStatus(tripId)`를 `hasAnyActivatedTrip()`으로 바꿨을 때 이전 34개 검사는 모두 통과했지만, 보완된 40개 검사에서는 대조 4개가 실패하고 36개가 통과했다. 정상 소스의 전체 90개는 통과했다. 이는 당시 Main의 실행 관찰이며, 임시 변환기·전후 snapshot은 지금 남아 있지 않아 이번 인계에서 재실행하지 않았다. 현재 영구 대조 테스트가 재검증 출발점이다.
8. 마지막 action 분리: `useNetworkStore` 선언에는 초기 상태·action factory·setOverride만 남겼다. `createNetworkActions` 안에서 init/cleanup/refresh를 먼저 읽고 helper를 이어 읽는다. `clearNoticeTimer(session)`은 module-private 순수 자원 정리 helper다. session 포인터·구독·timer·request는 factory closure가 소유한다. refresh는 같은 closure의 init을 직접 부른다. 파일·framework를 늘리지 않았다.
9. Main과 최신 전문가 모두 현재 전체 90개 test 통과를 확인했다. 11절은 인계 준비 중 Main이 다시 실행한 검사다.

### Failed

- 자동 Maintain generation 2의 이전 반영 경로가 실패했고 이후 response-end 경계가 pending 상태로 쌓였다는 host notice를 받았다. 이번 사용자 요청의 기록은 Main의 수동 반영이다. lifecycle 재연결·queue replay·freshness 복구를 실행하거나 성공으로 표시하지 않는다.
- client 전체 typecheck는 지도 코드의 기존 오류 세 개 때문에 실패한다. 원래 baseline과 같은 위치·유형이며 관련 파일을 이번에 수정하지 않았다. 전체 타입 검사 성공으로 보고하지 않는다.
- 인계 준비 중 일반 `pnpm exec`·`pnpm test:typecheck`가 dependency 상태 확인에서 install을 시도하고 registry fetch 실패 및 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`로 중단됐다. 설치·CI 강제·modules purge로 해결하지 않고 기존 local executable을 직접 실행해 아래 검사를 마쳤다. Git-visible 파일 상태는 검사 전후 같았다. ignored dependency 파일 전체 불변까지 검증한 것은 아니다.
- 정규 lint의 기존 Prettier 연동 호환 오류 때문에 해당 규칙을 끄고 제한된 파일에 ESLint를 실행했다. 별도 Prettier 검사는 통과했다. 이를 저장소 전체 정규 lint 통과로 바꾸지 않는다.

### Not tried

최신 전문가 리뷰의 P1/P2/낮은 우선순위 수정, 대상 Trip Router 정상화와 inactive child의 Local 선조회 제거, 제한 화면·폼 오류·복구 토스트 전체 연결, DB/auth 실패 UX·sync eligibility·foreground 재확인, 실제 SQLite 경쟁·원자성, 실기기·외부 API 검증은 아직 실행하지 않았다. 마지막 리뷰 뒤 소스 수정은 없다.

## 6. Ownership and authority transferred

- receiver now owns: 아직 인수되지 않았다. 인수할 책임은 현재 source·dirty state·검증 한계를 대조하고 사용자에게 이어갈 범위와 첫 행동을 설명하는 것이다.
- receiver may: 관련 소스·diff·untracked 테스트를 읽고 외부 쓰기 없는 검사를 실행한다. 사용자가 후속 구현을 요청하면 기존 Ticket 06 범위에서 작업하고 검증한다.
- receiver may not: 이 기록 요청만으로 최신 리뷰 수정의 승인·Ticket 전체 수락을 추론하거나 commit/push·배포·실제 서버 쓰기·debug 데이터 삭제·Maintain runtime 복구를 실행하지 않는다. 사용자의 다른 변경과 `.pnpm-store/`를 정리하지 않는다.
- completion reporting target: 사용자. 구현 시 Ticket·state·output·records의 역할을 유지하고 검사 범위와 남은 문제를 함께 보고한다.

## 7. Open questions, approvals, and blockers

최신 전문가는 이전 리뷰 결론을 주입받지 않고 현재 코드·HEAD·소비부·테스트·NetInfo 소스를 읽어 기준을 정했다. 기준은 실제/표시/실행 허용의 구분, 자원 소유와 종료, 오래된 결과 방어, 모든 sync 진입점의 공통 보호, React state와 실행 잠금의 구분, DB/auth 준비 변화의 소비, 실제 사용자 행동과 부작용을 검증하는 테스트다. 리뷰는 read-only였다.

### Store 구조 판단 — 현재 factory 유지 가능

`currentSession`은 module-global이 아니라 action factory 내부의 지역 변수다. session/request 타입과 helper도 export되지 않는다. 앱의 singleton store와 runtime handle을 React state 밖에서 소유하는 것은 적절하다고 판단했다. export된 Zustand hook에는 기술적으로 `.setState`가 있으므로 완전한 외부 불변성을 보장하는 것은 아니다. 제품 코드에서 이 경로로 직접 상태를 조작하는 사용은 찾지 못했다. 더 잘게 분리하는 것을 해결책으로 삼지 않는다.

### P1 — 실제 debug 수동 sync가 보호 경계를 우회함

Main 확인 경로: [DashboardView](../../../../../apps/client/src/features/debug/ui/DashboardView.tsx)의 `onManualSync` 버튼 → [features/debug/ui/DebugScreen.tsx](../../../../../apps/client/src/features/debug/ui/DebugScreen.tsx)의 `handleManualSync`(기록 시 125행) → engine의 [triggerSync](../../../../../apps/client/src/shared/services/sync/engine.ts)(285행) → `syncData()`(289행). 실제 screen 구현은 features 쪽이며 `src/screens/DebugScreen.tsx`는 과거 경로의 re-export다.

이 경로는 Provider의 실제 online·override 검사와 실행 중 검사를 통과하지 않는다. 실제 online이고 화면 override가 offline/unknown인 상황에도 pending queue 전송을 시작할 가능성이 있으며, 실제 offline/unknown에서도 queue 처리를 시도할 수 있다. 기존 직접 호출 경로가 이번 합의의 구현 누락으로 드러난 것이지 action factory 분리로 새로 만들어진 회귀는 아니다. 실제 서버 전송을 관찰한 결과는 아니다.

전문가 제안: 버튼마다 조건을 복제하지 않고 공통 보호 실행 경계로 연결한다. debug의 성공/실패 메시지와 성공 후 `loadData()`는 유지한다. Provider는 현재 void 반환·오류 내부 처리·조건 차단 시 조용한 return이므로 호출만 옮겨 차단을 성공으로 안내하지 않도록 결과 계약을 먼저 읽는다. 결과 타입·오류 처리 방식은 아직 구현 결정되지 않았다.

검증 기준 제안: **실제 Dashboard 버튼**에서 override/offline/unknown이면 engine·HTTP 호출 0, 자동 sync 중 버튼을 눌러도 engine 실행 1, 성공·실패·차단 안내가 구별된다.

### P1 — React state 검사만으로 같은-render 동시 sync를 막지 못함

Main 확인 소스: Provider의 `executeSync`는 `isSyncing` closure를 검사한 뒤 `setIsSyncing(true)`한다. React가 재렌더하기 전에 같은 callback을 두 번 부르면 둘 다 이전 false를 읽을 수 있다. 전문가는 React 대체 진단에서 engine 호출 두 번을 보고했다. 실제 React 회귀 fixture·SQLite 경쟁·서버 중복은 미확인이다. HEAD에도 있던 보호 부족이며 이번 분리의 새 회귀로 단정하지 않는다.

전문가 제안: 공통 실행 경계에서 ref 또는 in-flight Promise를 즉시 선점하고, `isSyncing`은 화면 표시로 유지한다. Provider-local 소유로 충분하며 별도 framework나 전역 manager가 필수는 아니다. 앞선 debug 우회도 같은 경계에 연결해야 한다.

검증 기준 제안: 같은 act/render의 callback 두 번·자동/수동 overlap에서도 engine 1, 성공·실패 후 다음 실행 가능, 이전 실행 종료가 새 실행의 표시를 덮지 않는다. 현재 90개 테스트는 이 동일-turn 경쟁을 검증하지 않는다.

### P2 — DB/auth·override 해제의 sync eligibility는 미완료

Main은 Root의 DB/auth 준비 실패 뒤에도 finally에서 appReady가 되는 흐름, Provider의 network/override 중심 검사, [sync API](../../../../../apps/client/src/shared/services/sync/api.ts)의 token 부재 시 요청을 계속하는 interceptor를 확인했다. online 초기 비인증 실행, online 유지 중 login에서 자동 시작하지 않는 문제, override 해제만으로 자동 재개하지 않는 문제가 남는다. 이는 Ticket에 이미 남아 있던 준비 조건 범위다.

전문가 제안은 DB 준비·auth·override eligibility의 전환을 작은 명시적 계약으로 연결하는 것이다. DB/auth 실패 화면 전체 설계는 별도 열린 판단으로 둔다. 검증 기준 제안은 DB 미준비/실패·auth 미완료/비인증에서 실행 0, online login의 시작, override 해제 시 기대 동작의 명시, network 변화와 준비 변화가 겹쳐도 실행 1이다. 자동 재개 방식의 세부 구현은 아직 채택하지 않았다.

### 낮은 우선순위 — ScheduleCard UI가 실제 getter를 직접 읽음

Main 확인: [ScheduleCard](../../../../../apps/client/src/shared/components/Card/ScheduleCard.tsx) 34행의 좌표 누락 경고가 `networkStore.realStatus`를 직접 읽는다. getter는 React 구독이 아니고 화면 override도 반영하지 않는다. 비구독은 기존 문제이며 getter 의미가 실제 상태로 바뀐 영향도 함께 봐야 한다. 전문가 제안은 UI 목적에 맞는 display hook과 경고 반응 검사다. 아직 수정하지 않았다.

Main의 다음 순서 **권장안**은 위 두 P1의 회귀 검사를 먼저 만들고 작은 공통 보호 경계로 고친 뒤, 기존 대상 Router 정상화 계획을 이어가는 것이다. 이는 최신 리뷰를 반영한 제안이며 사용자가 이 순서를 추가 확정하거나 최신 수정안을 승인한 것으로 기록하지 않는다. 그 외 startup·sync engine 내부 결과·queue 원자성·cleanup까지 한 번에 넓히지 않는다.

## 8. External side effects

- already caused: 인계 준비 중 로컬 검사와 Workspace 문서 갱신만 실행했다. 제품 소스·테스트는 이 요청 전에 구현된 미커밋 결과다. 이 인계에서 commit/push·배포·서버 API write·DB 변경·삭제는 실행하지 않았다.
- irreversible or costly actions: 이 인계에서 없음. debug의 기존 sync/activation/삭제 기능을 확인 목적으로 누르지 않는다.
- pending external actions: 없음. 외부 환경 쓰기가 필요한 검증은 실행 환경·데이터 격리와 승인부터 확인한다.

## 9. Next atomic action

- action: `git status --short`로 현재 dirty state를 이 기록과 대조한다.
- working directory or target: 위 metadata의 workspace root.
- expected result: 관련 제품 코드 11개·문서·untracked 테스트 및 날짜별 기록이 남고 staged 변경은 없다. `.pnpm-store/`는 별도로 보존한다.
- stop condition: 다른 branch/HEAD, 예상하지 못한 겹치는 사용자 변경·staged 변경이 있으면 편집 전에 범위를 다시 확인한다. 이 packet만으로 구현을 시작하지 않는다. 인수 후 관련 source와 검증 결과를 대조하고 사용자에게 다음 행동을 제시한다.

## 10. Do not repeat and recovery

- do not repeat: 전체 리팩토링 완료·90개 test의 전체 제품 보장·Maintain 복구를 선언하지 않는다. latest 리뷰 수정이 끝났다고 쓰지 않는다. 과거 임시 snapshot을 현재 증거로 링크하지 않는다. 실제 debug sync/activation/삭제·queue replay·dependency purge를 검증 대용으로 실행하지 않는다.
- safe retry: 현재 설치된 local executable으로 no-cache Jest·noEmit typecheck·Prettier check를 실행한다. package-manager의 자동 install이 끼면 강제 진행하지 않는다. 새 session의 Maintain 연결은 사용자 explicit 선택과 session binding 계약에 따라 별도 처리한다.
- rollback or recovery: 기존 dirty 변경을 reset/checkout으로 되돌리지 않는다. HEAD는 문서 커밋이므로 reset하면 구현·새 테스트를 잃는다. 수정 전 diff·untracked 목록을 확보하고 작업 소유 범위의 patch만 되돌린다. 이전 dated records는 수정하지 않고 정정 필요 시 새 기록을 추가한다.

## 11. Verification receipt

- checked-at: 2026-09-17T11:37:52+09:00까지의 인계 준비 검사.
- check: root에서 기존 Jest 실행기를 사용한 client 전체 검사, `--config apps/client/jest.config.cjs --runInBand --no-cache`.
- result: 7개 suite, 90개 test 통과. Snapshot 0. 외부 API·native·SQLite 실행이 아니라 mock/fake timer·hook/component fixture 범위다.
- check: root의 `./node_modules/.bin/prettier --check`로 위 제품 파일 11개·새 테스트 4개 검사.
- result: 15개 파일 모두 통과.
- check: client에서 `../../node_modules/.bin/eslint src/shared/store/network.ts src/shared/services/sync/provider.tsx tests/shared/store/network.test.ts tests/shared/services/offline-prep/router-network.test.ts tests/shared/services/sync/provider-network.test.tsx --rule 'prettier/prettier: off'`.
- result: 품질 구현의 5개 파일 통과, 출력 없음. 전체 저장소 정규 lint 결과가 아니다.
- check: client에서 `./node_modules/.bin/tsc --project tsconfig.json --noEmit`.
- result: exit 2. `src/shared/lib/mapbox.ts:61`의 `number[][]`/tuple 불일치, `src/shared/services/offline-map/download.ts:165`의 `size`, 166행의 `tileCount` 타입 오류. 기존 baseline의 세 오류 외 추가 진단은 없다.
- check: `git status --short`, branch/HEAD read-only 조회와 `git diff --check`.
- result: branch/HEAD는 위 metadata와 같고 기존 tracked/untracked 목록은 baseline 검사 전후 같다. 문서 저장 뒤 2026-09-17T11:41:09+09:00에 새 packet·Ticket·state·output·records 색인의 로컬 파일 링크 137개가 모두 존재하고 `git diff --check`가 통과함을 확인했다. staged 변경은 없으며 Git 목록에는 새 packet만 추가됐다. 이 링크 검사는 파일 존재를 확인한 것이며 문서 의미나 anchor의 독립 검증은 아니다.
- workspace before/after: 검사 전 이미 dirty였고 baseline 검사 뒤 Git-visible 상태 변화는 없었다. 이번 기록 요청으로 새 packet과 Ticket 06·state·output·records 색인만 갱신한다. 제품 코드·테스트·기존 dated record·machine receipt/status·Maintain 설정은 갱신하지 않는다.
- not checked: 수신자 독립 인수·새 세션 재진입 리허설, 실제 debug 버튼 회귀·동일-turn sync 경쟁·DB/auth transition, 실제 native/SQLite/API, 임시 mutation harness 재실행, ignored dependency tree 전체 불변. 준비 상태를 accepted로 바꾸지 않는다.
