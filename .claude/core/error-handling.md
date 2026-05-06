---
description: 에러 처리 현재 가이드 - 서버 AppError/errorHandler, 클라이언트 React Query error state, PolicyErrorDisplay 기준을 정리합니다.
alwaysApply: false
---

# 에러 처리 가이드

> 문서 상태: active source다.
> 예전 클라이언트 중앙 에러 인프라 설계안은 [_archive/client-error-infra-blueprint.md](../_archive/client-error-infra-blueprint.md)에 보존되어 있다. `_libs/error`, `errorService`, 클래스형 `ErrorBoundary`는 현재 기본 인프라가 아니다.

## 현재 기준

| 영역 | 현재 인프라 | 기본 처리 |
| --- | --- | --- |
| Server | `apps/server/src/middleware/errorHandler.ts` | `AppError`를 throw하고 `errorHandler`가 HTTP 응답으로 변환 |
| Client data hook | React Query | `queryFn`/`mutationFn`에서 `Error`를 throw하고 화면 또는 호출부에서 `error` state 처리 |
| Policy/permission UI | `PolicyErrorDisplay` | `useAppPolicy` 결과를 사용자 메시지로 표시 |
| Unknown/client local error | 기본 `Error`, `console.error` | 필요한 경계에서 로깅 후 사용자 친화 메시지 표시 |

## 기본 원칙

- 존재하지 않는 `_libs/error` 또는 `errorService`를 일반 작업에서 새로 만들지 않는다.
- 서버 라우터/미들웨어에서는 기존 `AppError`/`errorHandler` 흐름을 따른다.
- 클라이언트 데이터 계층에서는 React Query의 `error`, `isError`, `onError` 경계를 사용한다.
- 정책상 수행할 수 없는 작업은 예외보다 policy result와 `PolicyErrorDisplay`를 우선한다.
- 사용자에게 보여줄 문구에는 민감 정보, 원본 토큰, 내부 SQL/stack trace를 넣지 않는다.

## Server Pattern

```typescript
import { AppError } from '../middleware/errorHandler';

export async function getTrip(req, res) {
  const trip = await tripService.findById(req.params.id);

  if (!trip) {
    throw new AppError(404, 'Trip not found', 'TRIP_NOT_FOUND');
  }

  res.json({ success: true, data: trip });
}
```

## Client Data Pattern

```typescript
export function useGetTrip(tripId: string) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const trip = await tripRepository.getById(tripId);

      if (!trip) {
        throw new Error('여행 정보를 찾을 수 없습니다.');
      }

      return trip;
    },
  });
}
```

화면에서는 React Query 상태를 UI로 번역한다.

```tsx
const { data, error, isError, isLoading } = useGetTrip(tripId);

if (isLoading) return <LoadingView />;

if (isError) {
  return <ErrorView message={error instanceof Error ? error.message : '문제가 발생했습니다.'} />;
}
```

## Policy Error Pattern

```tsx
const policy = useAppPolicy(tripId);

if (!policy.schedule.create.allowed) {
  return <PolicyErrorDisplay permission={policy.schedule.create} variant='block' />;
}
```

## 확장 후보

아래 조건이 반복되면 중앙 클라이언트 에러 계층을 다시 검토할 수 있다.

- 같은 에러 메시지 변환 로직이 여러 화면에 반복된다.
- toast, inline, block, logging의 분기가 화면마다 중복된다.
- 서버 응답 코드와 클라이언트 표시 문구의 매핑이 커진다.
- 에러 트래킹 도구를 도입해 공통 boundary가 필요해진다.

그때도 먼저 결정 기록을 남기고, archived blueprint를 참고 자료로만 읽는다.

## 체크리스트

- [ ] 서버 에러는 `AppError`/`errorHandler` 흐름과 맞는가?
- [ ] 클라이언트 데이터 훅은 `Error`를 throw하고 React Query 상태로 번역하는가?
- [ ] 정책 위반은 예외가 아니라 policy UI로 표시하는가?
- [ ] 사용자 메시지에 민감 정보가 들어가지 않는가?
- [ ] 중앙 에러 인프라를 만들려면 별도 결정 기록이 있는가?
