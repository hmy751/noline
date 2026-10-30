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

화면은 **처음 내용을 얻지 못한 실패**와 **기존 내용의 갱신 실패**를 구별한다. 모든 `isError`에서 화면 전체를 오류로 바꾸면 재조회 실패만으로 유효한 내용을 가리게 된다. 위 코드는 오류 전달의 개략 예시이며 실제 Entity hook·query key는 [API/Data 구현 경로](api-data.md)에서 찾는다.

일정·경비의 정책 조회 소비자는 `query.data`만으로 표시를 결정하지 않고 기존 `view`를 사용한다. [조회 실행과 화면 표시](policy-architecture.md#조회-실행과-화면-표시를-구별한다)가 이 순서와 접근 조건을 소유한다.

| 상태 | 표현과 복구 |
| --- | --- |
| `blocked` | 캐시를 유지하더라도 제한된 내용을 공개하지 않고 정책 안내를 표시 |
| `loading` / `error` | 최초 조회 중 또는 실패를 표시. 빈 목록·0원·대상 삭제로 대신하지 않음 |
| `ready` | 성공한 내용 표시. 빈 배열도 정상 결과 |
| `ready` + `refreshFailed` | 기존 내용을 유지하고 해당 영역의 갱신 실패를 안내 |
| `unselected` / `idle` | 대상 미선택·소비자 비활성 조건을 화면 맥락에 맞게 처리 |

홈에서 한쪽 요약만 실패하면 정상인 다른 요약을 유지한다. 상세에서는 목록 조회 성공과 특정 ID의 존재 여부를 별도로 판단하며, 조회 중·오류를 대상 부재로 성급히 바꾸지 않는다. 실제 표현은 [홈 요약](../../apps/client/src/entities/trip/ui/TripSummary.tsx)과 [경비 상세](../../apps/client/src/screens/ExpenseDetailScreen.tsx)에서 확인한다. 경비 상세의 특정 재시도·삭제 실패 이유 처리는 여전히 보류 범위이며, 이 문서 보완으로 해결한 것으로 보지 않는다.

재조회는 접근 조건을 확인하는 `actions.refetch`로 요청한다. `finished`는 호출이 끝났다는 의미이고 오류가 결과 안에 남을 수 있다. 진행 표시를 끝내는 일과 성공 안내는 구별한다. 네트워크 재확인은 [연결 관측](policy-architecture.md#연결-복귀와-데이터-갱신)을 갱신하는 별도 행동이다.

## Policy Error Pattern

다음은 일정 읽기 영역의 제한 처리 발췌다. 나머지 `view` 상태는 위 표에 따라 해당 화면에서 표현한다.

```tsx
const { view } = useTripSchedulesReadQuery(tripId);

if (view.kind === 'blocked') {
  return <PolicyErrorDisplay policy={view.policy} variant='block' />;
}
```

실제 prop은 `policy`다. pending·`recoveryAction`·재확인 진행은 기존 [PolicyErrorDisplay](../../apps/client/src/shared/components/ErrorBoundary/PolicyErrorDisplay.tsx)를 재사용한다. 홈처럼 좁은 영역은 같은 정책 결과를 사용하되 공간에 맞는 표시를 맡는다.

이미 열린 작성 폼은 제한을 이유로 전체를 위 예시처럼 교체하지 않는다. [작성과 읽기의 구별](policy-architecture.md#작성과-읽기의-제한을-구별한다)에 따라 입력을 유지하고 사용할 수 없는 동작 영역에 안내한다. 저장 실패도 초안을 유지하며 연결 복구만으로 자동 제출하지 않는다.

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
