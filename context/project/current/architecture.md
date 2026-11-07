# 현재 구현과 검증 경계

작업 범위와 영향을 받을 책임, 실제로 확인할 명령을 정할 때 읽는다. 2026-10-31에 제품 tree, root·app/package guide, 대표 호출 경로와 아래 상세 Owner를 대조했다. 이 지도는 해당 구현과 문서의 대조 범위를 설명하며 앱 전체 동작을 재실행한 증거는 아니다.

## 구성과 흐름

| 실제 위치 | 현재 책임과 변경 시 읽을 기준 |
| --- | --- |
| [client](../../../apps/client/CLAUDE.md) | React Native·Expo 화면, SQLite, Router·Policy와 앱 실행. `app`의 navigation/provider 연결, `src/application`의 준비·수명 조합, screens/features/entities/shared를 구별한다. [계층 기준](../guidance/development-boundaries/layers.md)이 배치와 현재 의존 예외를 설명한다. |
| [server](../../../apps/server/CLAUDE.md) | Express route·인증·소유권, PostgreSQL/Drizzle, sync와 외부 인증 service. DB schema는 `apps/server/src/db/schema.ts`에 있다. |
| [schema](../../../packages/schema/CLAUDE.md) | Zod entity/request/response/sync와 공통 값 검증. TypeScript 추론과 실제 parse는 [공유 계약 기준](../guidance/development-boundaries/schema-and-types.md)에서 구별한다. |
| [UI](../../../packages/ui/CLAUDE.md) | React Native primitive·shell과 공개 export. 앱 조합과 domain workflow는 client에 남긴다. [UI 책임](../guidance/development-boundaries/ui.md)을 따른다. |
| 공통 도구 | `packages/eslint-config`, `packages/typescript-config`와 pnpm workspace가 검사·설정을 연결한다. |

현재 `packages/db`나 Prisma 기반 공통 DB package는 없다. Client DB는 `apps/client/src/shared/db`, 서버 DB는 위 server 경로가 소유한다. 공유 schema와 각 저장소 schema는 같은 파일이나 같은 런타임 표현이 아니다.

기본 의존은 화면 조립에서 feature·entity·공통 기반을 사용하는 방향이다. 실제 shared Policy·지도 UI 등에는 entity 참조가 남고, 일정·경비 폼은 공개 일정 조회 feature를 재사용한다. 이 지도는 이를 엄격한 FSD 준수나 모든 같은 계층 참조의 허용으로 설명하지 않는다. 현재 적용 조건과 비용은 계층 기준에서 확인한다.

Trip·Schedule·Expense의 data hook은 repository를 호출하고 repository의 Activation Router가 local/remote 구현을 고른다. Trip 자체 query와 child entity query는 활성 판단 단위가 다르므로 실제 변경에서는 [여행 접근·Router 기준](../guidance/travel-access/INDEX.md#router와-계정-전체-여행-목록의-계약)을 확인한다. 활성화된 여행은 SQLite와 queue를 사용하고, Sync Engine은 queue에 남은 변경을 서버로 보낸다. Router의 데이터 위치 선택과 Sync Engine의 동기화 수행은 다른 책임이다.

실제 sync source는 [engine](../../../apps/client/src/shared/services/sync/engine.ts), [queue](../../../apps/client/src/shared/services/sync/queue.ts), [cleanup job](../../../apps/client/src/shared/services/sync/cleanup-job.ts)에서 찾는다. 저장·전송·정리의 계약과 현재 구현 차이는 [데이터 수명 가이드](../guidance/data-lifecycle/INDEX.md)가 설명한다. 비활성화 정리는 현재 PENDING 중심이라 FAILED·IN_PROGRESS와 귀속 불명 작업 보호가 부족하며 로그아웃·vacuum의 보호와 다르다. 지도·검색·길찾기는 [Policy 설명](../guidance/travel-access/INDEX.md)을 따르며 Data Router를 확대 적용하지 않는다.

## 앱 준비와 세션 수명

`application/AppInitialization`은 DB 준비와 기기 인증 복원을 마친 뒤 하위 화면을 연다. DB 실패는 앱 준비 화면에서 재시도하고, 인증 복원 실패는 데이터를 보존한 채 로그인 화면에서 다룬다. Root layout은 준비된 앱의 화면과 인증 후 작업을 연결한다. 여행 목록 갱신·선택, 지도·pending cleanup, sync 완료는 앱 진입의 선행 조건이 아니다.

Auth Store는 현재 계정과 인증 수단을 관리한다. 재인증이 필요해도 같은 계정의 활성 여행을 로컬에서 계속 이용하고, 로그인 서비스는 기존 데이터를 유지하며 인증을 복구한다. 명시적 로그아웃·탈퇴는 실행 중 sync·pending cleanup·DB 작업을 기다린 뒤 미전송 여부와 데이터 정리를 처리한다. Store의 기기 저장 순서와 서비스의 전체 절차 조율은 범위가 다르다.

이 연결은 2026-10-30 현재 소스와 관련 검사에 대조했다. 상태별 접근, 변경할 책임, 실패 시 남는 데이터와 실제 보호의 한계는 [앱 실행·세션·데이터 보존](app-runtime/INDEX.md)이 설명한다. 특히 종료 대기와 전송 성공, 로그아웃의 미전송 검사와 여행별 cleanup 검사를 구별한다. 이 보완이 위 전체 구현 지도의 모든 영역을 다시 확인했다는 뜻은 아니다.

## 지원 경계와 확인 방법

제품 문서는 iOS 중심 배포, 활성 여행의 오프라인 핵심 입력, 온라인 보강과 통화별 관리를 설명한다. Android 동등 지원, 외부 공급자·운영 DB 상태, 실제 네트워크 전환·동시 sync의 성공은 이 지도에 사용한 source 대조만으로 확인되지 않는다. 기능별 현재 여부는 해당 source와 실제 환경에서 다시 판정한다.

제품 변경은 해당 app/package guide에서 검증을 선택한다. Client는 Expo/React Native용 Jest에서 hook·API 계약을 실행하고, server는 Vitest 단위 검사와 Supertest route 계약 검사, 별도 PostgreSQL integration 경계를 갖는다. 이 기반의 존재는 client/server 전체가 테스트됐다는 뜻이 아니다. Native module mock은 실기기를, DB/auth mock은 실제 PostgreSQL·JWT를 대신하지 않으므로 [동작 보존 리팩터링](../guidance/behavior-preserving-refactoring.md)과 [API 변경 가이드](../guidance/api-contracts.md)에서 영향에 맞는 경계를 고른다.

`pnpm schema build`, `pnpm server typecheck`, `pnpm server build`는 package 수준 확인이며 iOS 실기기나 외부 서비스 acceptance를 대신하지 않는다. `pnpm harness:check`는 AI 지침의 bridge·링크·expected surface·whitespace를 확인한다. 제품 동작은 해당 app/package에서 별도로 검사한다.

Root [Context Harness](../../README.md)는 Project layer와 Workspace Spec·Ticket·state를 연결한다. Noline의 공통 스킬 원본은 `.agents/skills/`에 있으며 Codex가 직접 발견하고 Claude는 `.claude/skills` symlink로 같은 원본을 읽는다. 새 세션은 Workspace의 재개 안내를 읽고 필요할 때 기록 담당자를 호출한다.

상세 Owner와 코드·테스트·runtime이 바뀌면 변경 책임자가 관련 부분을 갱신한다. 이 지도는 위치·현재 관계를 요약한다. 제품 계약·위험·변경 확인 조건은 대응 Project 본문이 소유하고 구현 사실은 실제 source를 근거로 하며, 둘의 충돌은 구별한다. [개발 기준의 형성 자료](../guidance/development-boundaries/_background/README.md)에서 구조·UI·schema 선택 이유를 찾는다. 전체 상세 문서 최신화 여부를 이 지도만으로 주장하지 않는다.
