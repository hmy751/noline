# Noline 구조와 검증 경로

## 구성

- [`apps/client/`](../../apps/client/): React Native·Expo 앱, FSD 기반 화면과 entity, SQLite, Activation Router, policy UI, offline map·sync 서비스
- [`apps/server/`](../../apps/server/): Express API, 인증·user ownership middleware, PostgreSQL/Drizzle, sync endpoint
- [`packages/schema/`](../../packages/schema/): client/server가 공유하는 Zod entity·request·response·sync 계약
- [`packages/ui/`](../../packages/ui/): domain logic을 소유하지 않는 공유 UI primitive와 구성 요소
- [`.claude/`](../../.claude/): 제품 규칙·guard·runbook·깊은 context·AI harness의 상세 Owner
- [`context/`](../README.md): 이 문서와 Work context의 별도 운영 경계

## 주요 실행 흐름

1. 사용자가 여행을 활성화하면 해당 여행 데이터는 local SQLite와 오프라인 준비 흐름을 사용한다. 비활성 여행은 Server API로 접근한다.
2. Trip·Schedule·Expense의 Data Layer는 Activation Router를 통해 local/remote 구현을 선택한다. 직접 분기나 데이터 Owner 우회는 허용하지 않는다.
3. local mutation은 `sync_queue` 기록과 같은 transaction 안에서 수행한다. 이후 sync는 이 queue를 사용해 서버 반영을 시도한다.
4. 지도·검색·directions는 sync 대상 data가 아니라 현재 policy에 따라 Network-First/제한 상태를 선택한다.
5. schema 변경은 `@repo/schema`에서 먼저 하고 client·server가 추론 타입을 사용한다.

## 검증 경로

- AI/developer harness 구조: Project root에서 `pnpm harness:check`
- schema build: `pnpm schema build`
- server typecheck/build: `pnpm server typecheck`, `pnpm server build`
- client 작업: [`apps/client/CLAUDE.md`](../../apps/client/CLAUDE.md)가 지정하는 Expo·React Native 명령

명령 통과는 선언된 입력과 runtime에서 해당 명령이 성공했다는 사실만 보인다. 실제 iOS 기기, 네트워크 공급자, OAuth, PostgreSQL, 동시 동기화와 사람 acceptance는 별도 확인 범위다.
