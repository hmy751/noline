# Time Data Guide

> 문서 상태: active source.
> 긴 시간 처리 설명과 web input 예시는 [_archive/time-data-complete-guide.md](../_archive/time-data-complete-guide.md)에 보존되어 있다.

현재 Noline의 시간 데이터 기준은 ISO 8601 datetime string이다. DB, schema, API, sync queue 경계에서 문자열로 전달하고, UI 경계에서만 date/time 표시 형식으로 변환한다.

## Current Code Paths

| 책임 | 현재 위치 |
| --- | --- |
| datetime helpers | `apps/client/src/shared/lib/datetime.ts` |
| DB helpers | `apps/client/src/shared/db/utils.ts` |
| client DB schema | `apps/client/src/shared/db/schema.ts` |
| schema contracts | `packages/schema/src/entities/*`, `packages/schema/src/requests/*` |

## Storage Rules

- `startDate`, `endDate`, `scheduledAt`, `date`, `createdAt`, `updatedAt`, `deletedAt`, `activatedAt`, `expiresAt`는 ISO string으로 다룬다.
- SQLite에는 `text`로 저장한다.
- schema에서는 가능한 곳에 `z.string().datetime({ offset: true })`를 사용한다.
- 현재 시각은 `getCurrentISOString()` 또는 `new Date().toISOString()` 패턴을 사용한다.
- 날짜만 입력받아도 API/DB로 넘기기 전 `dateToISODateTime()`로 datetime string으로 바꾼다.

## UI Boundary

React Native 화면은 사용자가 다루기 쉬운 date/time 값을 보여주고, submit 직전에 ISO string으로 변환한다.

```typescript
const scheduledAt = combineDateTimeToISO(data.date, data.time);
```

표시는 `formatISOToLocalDate`, `formatISOToLocalTime`, `formatISOToLocalDateTime` 같은 helper를 사용한다.

## Sorting and Comparison

정렬/비교는 ISO string을 `new Date(value).getTime()`으로 변환해 수행한다.

```typescript
schedules.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
```

문자열 포맷이 보장되지 않는 외부 입력은 먼저 schema 또는 helper로 검증/정규화한다.

## 체크리스트

- [ ] DB/API로 넘기는 값이 ISO datetime string인가?
- [ ] UI date/time 값을 저장 경계 전에 변환했는가?
- [ ] schema의 datetime 검증과 실제 입력 형식이 맞는가?
- [ ] 정렬/비교에서 locale display string을 사용하지 않았는가?
- [ ] timezone 의미가 필요한 기능에서 암묵적인 로컬 문자열을 저장하지 않았는가?
