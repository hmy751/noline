---
description: API & data guide for current Noline entity, repository, React Query, and schema contracts.
alwaysApply: true
---

# API and Data Guide

> 문서 상태: active source.
> 오래된 web/custom-error 예시와 긴 레벨별 설명은 [_archive/api-data-legacy-patterns.md](../_archive/api-data-legacy-patterns.md)에 보존되어 있다.

## 현재 기본값

- API client는 `apps/client/src/shared/api/fetcher.ts`의 `apiClient`를 사용한다.
- 타입 계약은 `packages/schema`의 Zod schema가 원천이다.
- client 타입은 schema를 import하고 `z.infer`로 추론한다.
- Data Entity는 `model/api/lib/repository/data/ui` 구조를 우선한다.
- React Query hook은 repository를 호출하고 query key factory를 사용한다.
- 현재 클라이언트에는 `_libs/error`나 `errorService`가 없다. 기본 `Error` throw와 React Query error state를 사용한다.

## Entity 구조

```text
entities/{entity}/
├── model/types.ts
├── api/{entity}.ts
├── lib/{entity}-local.ts
├── repository/{entity}-repository.ts
├── data/keys.ts
├── data/useGet*.ts
├── data/useCreate*.ts
└── ui/*.tsx
```

Trip, Schedule, Expense는 이 구조를 기준으로 작업한다. 작은 보조 entity는 필요만큼 축소할 수 있지만, Data Entity가 sync 대상이면 repository와 query key 경계는 유지한다.

## Schema 사용

`@repo/schema`는 schema를 export하고, client/server는 그 schema를 기준으로 타입을 추론한다.

```typescript
import { scheduleEntity } from '@repo/schema/entities/schedule';
import { createScheduleRequest } from '@repo/schema/requests/schedule';
import { z } from 'zod';

type Schedule = z.infer<typeof scheduleEntity>;
type CreateScheduleInput = z.infer<typeof createScheduleRequest>;
```

request/response는 API 경계에서 validate한다. local DB select 결과는 필요한 곳에서 entity model 타입으로 맞춘다.

## API 함수

API 함수는 remote 호출과 schema validation을 담당한다.

```typescript
const response = await apiClient.post('/api/schedules', validatedInput);
const parsed = scheduleResponse.safeParse(response.data);

if (!parsed.success) {
  throw new Error('Invalid schedule response');
}

return parsed.data.data;
```

서버 응답 wrapper가 있는 경우 `responses/*` schema를 먼저 확인한다.

## Repository

Repository는 Activation Router의 경계다.

```typescript
return routeChildMutation(data.tripId, {
  local: () => createScheduleLocal(data),
  remote: () => createScheduleRemote(data),
});
```

화면과 data hook은 local/remote 선택을 알 필요가 없다.

## React Query

Query key는 `data/keys.ts`에서 관리한다.

```typescript
export const scheduleQueryKeys = {
  base: ['schedules'] as const,
  list: (tripId: string) => [...scheduleQueryKeys.base, 'list', tripId] as const,
};
```

Mutation 성공 후에는 영향 범위만 invalidate한다. Activation/deactivation처럼 여러 entity를 pull하거나 cleanup하는 작업은 Trip, Schedule, Expense, Route key를 함께 확인한다.

## 체크리스트

- [ ] schema가 있으면 `z.infer`와 request/response validation을 사용했는가?
- [ ] data hook이 repository를 거치고 직접 DB/API를 선택하지 않는가?
- [ ] local mutation은 transaction과 sync queue를 고려했는가?
- [ ] query key가 중복 문자열로 흩어져 있지 않은가?
- [ ] 현재 없는 중앙 error infra를 새 기본값처럼 만들지 않았는가?
