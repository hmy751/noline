# 현재 구현과 검증 경계

작업 범위와 영향을 받을 책임, 실제로 확인할 명령을 정할 때 읽는다. 2026-09-14 현재 제품 tree, root guide·package 구성과 아래 상세 Owner를 대조했다. 이 지도는 해당 구현과 문서의 대조 범위를 설명하며 앱 전체 동작을 재실행한 증거는 아니다.

## 구성과 흐름

[client](../../../apps/client/CLAUDE.md)는 React Native·Expo 화면, FSD entity/data/repository 구조, SQLite와 활성화·정책 UI를 맡는다. [server](../../../apps/server/CLAUDE.md)는 Express route, 인증·user scope, PostgreSQL/Drizzle와 sync endpoint를 맡는다. [schema](../../../packages/schema/CLAUDE.md)는 Zod entity/request/response/sync 계약을, [UI](../../../packages/ui/CLAUDE.md)는 domain logic과 분리된 공유 primitive를 맡는다. pnpm workspace가 각 package의 개발·검증 명령을 연결한다.

Trip·Schedule·Expense의 data hook은 repository를 호출하고 repository의 Activation Router가 local/remote 구현을 고른다. Trip 자체 query와 child entity query는 활성 판단 단위가 다르므로 실제 변경에서는 [Activation Router rule](../../../.claude/rules/activation-router.md)을 확인한다. 활성화된 여행은 SQLite와 queue를 사용하고, Sync Engine은 queue에 남은 변경을 서버로 보낸다. Router의 데이터 위치 선택과 Sync Engine의 동기화 수행은 다른 책임이다.

실제 sync source는 [engine](../../../apps/client/src/shared/services/sync/engine.ts), [queue](../../../apps/client/src/shared/services/sync/queue.ts), [cleanup job](../../../apps/client/src/shared/services/sync/cleanup-job.ts)에서 찾는다. 비활성화 시 pending task가 있으면 cleanup을 미루는 모델을 따른다. 지도·검색·길찾기는 [Policy 설명](../../../.claude/context/policy-architecture.md)을 따르며 Data Router를 확대 적용하지 않는다.

## 지원 경계와 확인 방법

제품 문서는 iOS 중심 배포, 활성 여행의 오프라인 핵심 입력, 온라인 보강과 통화별 관리를 설명한다. Android 동등 지원, 외부 공급자·운영 DB 상태, 실제 네트워크 전환·동시 sync의 성공은 이 지도에 사용한 source 대조만으로 확인되지 않는다. 기능별 현재 여부는 해당 source와 실제 환경에서 다시 판정한다.

제품 변경은 해당 app/package guide에서 검증을 선택한다. Client는 Expo/React Native용 Jest에서 hook·API 계약을 실행하고, server는 Vitest 단위 검사와 Supertest route 계약 검사, 별도 PostgreSQL integration 경계를 갖는다. 이 기반의 존재는 client/server 전체가 테스트됐다는 뜻이 아니다. Native module mock은 실기기를, DB/auth mock은 실제 PostgreSQL·JWT를 대신하지 않으므로 [동작 보존 리팩터링](../guidance/behavior-preserving-refactoring.md)과 [API 변경 가이드](../guidance/api-contracts.md)에서 영향에 맞는 경계를 고른다.

`pnpm schema build`, `pnpm server typecheck`, `pnpm server build`는 package 수준 확인이며 iOS 실기기나 외부 서비스 acceptance를 대신하지 않는다. `pnpm harness:check`는 AI 지침의 bridge·링크·expected surface·whitespace를 확인한다. Python Harness tests는 Recover·Maintain·Verify 계약을 임시 fixture에서 확인한다. 어느 쪽도 여행 기능의 동작 테스트가 아니다.

Root [Context Harness](../../README.md)는 Project layer와 Workspace Spec·Ticket·state를 연결한다. Noline의 `.claude/skills/` 원본은 `.agents/skills/` bridge로 공유한다. Codex·Claude lifecycle wrapper가 설치돼 있지만 새 session은 unbound이며 hook trust·사용자 explicit activation·실제 event receipt 전에는 `activation_pending`이다. Claude adapter의 semantic runner는 기존 Codex 구현을 재사용한다.

상세 Owner와 코드·테스트·runtime이 바뀌면 변경 책임자가 관련 부분을 갱신한다. [기존 Noline 문서 지도](../../../.claude/README.md)와 실제 source가 이 요약에 우선하며 전체 상세 문서 최신화 여부를 이 지도만으로 주장하지 않는다.
