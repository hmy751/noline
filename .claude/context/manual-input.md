# Manual Input Feature Guide

> 문서 상태: active source.
> v3.0 phase 설명과 긴 구현 예시는 [_archive/manual-input-v3-rollout.md](../_archive/manual-input-v3-rollout.md)에 보존되어 있다.

Manual Input은 네트워크나 외부 API가 없어도 핵심 데이터를 입력할 수 있게 하는 graceful degradation 전략이다.

## 현재 기준

- Schedule은 `offline_active`에서 장소 검색을 제한하고 직접 입력을 유지한다. Expense는 같은 상태에서 Local 일정 연결을 포함한 `full` 입력을 허용한다.
- Trip 생성은 기본적으로 온라인 전제를 유지한다.
- UI는 `useAppPolicy(tripId)`로 기능별 제한을 안내하며, 열린 초안과 기본 입력 폼은 유지한다.
- Data 저장은 기존 entity data hook과 Activation Router 경계를 그대로 탄다.

## Current Code Paths

| 책임 | 현재 위치 |
| --- | --- |
| Schedule 단일 작성 폼·장소 검색 조합 | `apps/client/src/features/schedule/create-schedule/` |
| Expense 단일 생성 폼 | `apps/client/src/features/expense/create-expense/` |
| Expense 생성·수정 일정 선택·저장 안내 | `apps/client/src/features/expense/expense-form/` |
| Policy hook | `apps/client/src/shared/policy/useAppPolicy.ts` |
| Policy constants | `apps/client/src/shared/policy/constants.ts` |
| Policy UI | `apps/client/src/shared/components/ErrorBoundary/PolicyErrorDisplay.tsx` |
| Schedule data hook | `apps/client/src/entities/schedule/data/useCreateSchedule.ts` |
| Expense data hook | `apps/client/src/entities/expense/data/useCreateExpense.ts` |

## UI Pattern

장소 검색이 막혔다는 이유로 Schedule 작성 폼을 교체하지 않는다. 같은 폼 안에서 직접 입력과 검색 영역의 제한을 설명한다. Expense도 같은 폼을 유지하고 일정 연결과 저장 영역이 각자의 가용성을 표현한다. 비활성 여행에서 연결이 끊겨도 이미 열린 초안은 편집할 수 있지만 서버 저장은 복구 전까지 제한된다. 읽기 목록·상세의 제한은 별도로 유지하며, 구체적인 계약은 [Policy Architecture](policy-architecture.md#작성과-읽기의-제한을-구별한다)를 따른다.

## Data Pattern

Manual form still submits through the same entity data hook.

- Schedule: `useCreateSchedule`.
- Expense: `useCreateExpense`.
- ID generation stays client-side.
- 한 시점의 값은 timezone 포함 ISO datetime을 사용한다. Expense 날짜의 현재 경계 차이는 [날짜와 시각](../../context/project/common/date-and-time.md)을 따른다.
- Local/Remote routing remains in repository/Activation Router.

Do not add a separate manual-only persistence path unless the current entity path cannot express the behavior.

## Field Rules

Schedule manual mode:

- Required: title, scheduledAt.
- Allowed: text location/address where useful.
- Blocked or nullable: API-derived coordinates when they are unavailable.

Expense offline active:

- Required: title, amount, currency, category, date.
- Optional: 같은 여행 Local 일정의 scheduleId. 경비 날짜와 다른 날짜의 일정에도 연결·변경·해제할 수 있다.
- Blocked or deferred: receipt upload and external enrichment when offline.

## 체크리스트

- [ ] UI 분기가 `useAppPolicy` 결과를 기준으로 하는가?
- [ ] manual form도 동일한 entity data hook을 사용하는가?
- [ ] external API가 없는 상태에서 필수 입력만 요구하는가?
- [ ] 나중에 보강 가능한 값은 null/deferred로 안전하게 저장하는가?
- [ ] 오프라인 제한 메시지가 사용자에게 이해 가능한 문장인가?
