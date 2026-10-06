# 날짜·시각 구현 경로와 호환 진입

> 현재 datetime/date-only 의미와 열린 제품 판단은 [Project 날짜와 시각](../../context/project/common/date-and-time.md)이 소유한다.
> 긴 시간 처리 설명과 web input 예시는 [_archive/time-data-complete-guide.md](../_archive/time-data-complete-guide.md)에 보존되어 있다.

이 문서는 기존 링크를 보존하고 helper·schema·DB의 구현 위치를 찾는 역할만 맡는다. 한 시점을 나타내는 datetime과 Expense `date`의 form·request·entity·저장 경계 차이를 하나로 일반화하지 않는다.

## 현재 코드 경로

| 책임 | 현재 위치 |
| --- | --- |
| datetime helpers | `apps/client/src/shared/lib/datetime.ts` |
| DB helpers | `apps/client/src/shared/db/utils.ts` |
| client DB schema | `apps/client/src/shared/db/schema.ts` |
| server DB schema | `apps/server/src/db/schema.ts` |
| schema contracts | `packages/schema/src/entities/*`, `packages/schema/src/requests/*` |
| Schedule API serializer | `apps/server/src/serializers/schedule.ts` |

React Native의 Schedule form은 date/time 값을 submit 경계에서 `combineDateTimeInTimeZoneToISO` 같은 shared helper로 datetime에 결합하고, 표시는 Trip 시간대를 받는 `formatISOToTimeZoneDate`, `formatISOToTimeZoneTime` 같은 helper를 사용한다. 이 경로를 Expense의 date-only 입력에 그대로 적용하지 않는다.

Schedule 응답을 바꾸면 serializer와 일곱 route consumer를, Expense `date`를 바꾸면 shared schema와 client/server DB·serializer를 함께 확인한다. 문자열 포맷이 보장되지 않는 외부 입력은 shared schema 또는 helper로 검증·정규화한다.
