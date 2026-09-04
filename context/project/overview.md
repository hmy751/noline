# Noline Project overview

## 사용자 장면과 제품 목적

Noline은 네트워크가 불안정하거나 끊긴 상황에서도 사용자가 여행 일정과 경비를 이어서 관리하도록 돕는 iOS 여행 관리 앱이다. 핵심은 모든 여행을 무차별적으로 로컬에 두는 것이 아니라, 사용자가 활성화한 여행에만 Local SQLite와 오프라인 리소스를 준비하는 Selective Local-First 모델이다.

## 여러 작업에 공통인 범위와 불변식

- 활성화된 여행의 Trip·Schedule·Expense 데이터는 Local SQLite가 진실의 원천이며, 비활성 여행은 Server API가 진실의 원천이다.
- 데이터 접근은 Activation Router를 통해 Local/Remote로 분기한다. 지도·검색·길찾기는 데이터 소유·sync 대상이 아니므로 Policy 기반 Network-First 서비스로 다룬다.
- 로컬 mutation과 `sync_queue` 추가는 하나의 `withTransaction` 안에서 원자적으로 처리한다.
- ID는 클라이언트가 생성하고 서버가 수용한다. `@repo/schema`는 client/server 타입 계약의 원천이며 타입은 Zod schema에서 추론한다.
- 시간은 timezone을 포함한 ISO 8601 datetime으로 저장·전송하며, 서버 route는 인증과 user ownership을 확인한다.
- 정책 제한 UI는 기존 `useAppPolicy`, `PolicyErrorDisplay`, `NetworkStatusIndicator` 패턴을 우선한다.

## 구조와 검증 경계

`apps/client`는 React Native·Expo, local DB, Activation Router와 policy UI를 맡고 `apps/server`는 Express API, 인증·user scope, PostgreSQL과 sync endpoint를 맡는다. `packages/schema`는 Zod 계약, `packages/ui`는 공유 UI primitive를 소유한다. root `pnpm` workspace가 이 구성을 묶는다.

`pnpm harness:check`는 AI/developer harness의 bridge·링크·expected execution surface를 확인한다. 이는 Noline 앱의 실제 네트워크·iOS·외부 서비스 동작이나 사람 acceptance를 증명하지 않는다. 제품 코드의 검증은 해당 app/package Owner가 정한 명령과 실제 환경을 별도로 따른다.

## 상세 Owner

- 제품 설명·현재 기능 범위: root [`README.md`](../../README.md)와 [`CLAUDE.md`](../../CLAUDE.md)
- 깊은 구조와 기능별 edge case: [`.claude/context/README.md`](../../.claude/context/README.md)
- 작업별 규칙과 고비용 실패 경계: [`.claude/rules/README.md`](../../.claude/rules/README.md), [`.claude/guards/README.md`](../../.claude/guards/README.md)
- 반복 작업의 시작 경로: [`.claude/runbooks/README.md`](../../.claude/runbooks/README.md)
- 구현 구조와 검증 명령: [`architecture.md`](architecture.md)
- 지속 선택: [`decisions/0001-selective-local-first.md`](decisions/0001-selective-local-first.md)

상세 Owner 또는 코드가 바뀌면 이 overview는 stale 후보이므로 다음 Recover 전에 다시 대조한다.
