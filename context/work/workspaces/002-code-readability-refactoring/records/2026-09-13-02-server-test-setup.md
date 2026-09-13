# 서버 테스트 기반 구축과 Ticket 05 범위 확정

날짜: 2026-09-13
Workspace: `002-code-readability-refactoring`

이 기록은 앞선 [서버 테스트 전략 결정](2026-09-13-01-server-test-strategy.md)을 실제 server package에 적용한 결과와, 구현 시작 전에 사용자가 확정한 Ticket 05의 제품 범위를 보존한다. 현재 실행 기준은 [Ticket 05](../current/memory/tickets/05-schedule-response.md), Workspace의 다음 행동은 [state](../current/state/index.md)가 소유한다.

## 확정한 Ticket 범위와 순서

사용자는 “1,2,3 다 하자 이 티켓에서 일단 그렇게 알고 5번 작업 부터 하자”라고 지시했다. 이 번호는 Ticket 번호가 아니라 앞선 논의에서 구별한 작업 항목이다.

1. Schedule DB row의 네 날짜 필드를 ISO 문자열로 바꾸는 일곱 소비 지점의 공통 직렬화 책임
2. Schedule 관련 endpoint가 이미 선언된 `@repo/schema` response schema를 실제 응답 경계에 적용하는 기준
3. Schedule 생성·일반 조회·중첩 조회·activation·sync의 사용자 소유권과 soft-delete 조건
5. 위 변경을 전후 비교할 server test 기반

사용자는 1–3을 Ticket 05에서 모두 수행하되 5를 먼저 만들기로 했다. 앞선 4번인 서버 전체 오류 처리 공통화는 route middleware와 error envelope뿐 아니라 client 소비 계약까지 더 판단해야 하므로 이번 Ticket에서 제외한다. 날짜 변환, response schema 판정, ownership query를 하나의 범용 helper로 합친다는 결정도 아니다.

## 실제 설치와 설정

`apps/server`의 개발 의존성에 다음 정확한 버전을 추가했다.

- Vitest `4.1.11`: TypeScript·ESM test 실행과 app import 전 module mock
- Vite `6.4.3`: Vitest가 허용하는 Vite 6–8 범위 중 `.nvmrc`의 Node 20.18.1과 호환되는 실행 기반을 명시적으로 고정
- Supertest `7.2.2`: export된 Express app에 HTTP 형태의 요청을 보내 status와 JSON 수집
- `@types/supertest` `7.2.1`: Supertest의 TypeScript 선언

`apps/server/package.json`에는 일회 실행 `test`와 watch 실행 `test:watch`를 추가했다. `vitest.config.ts`는 Node 환경, `tests/**/*.test.ts` 범위와 test-only 환경변수를 server package 안에서 소유한다. client의 `jest-expo` 설정과 root 공용 config는 변경하지 않았다.

Vitest 4.1.11은 Vite 6·7·8을 모두 허용한다. 최신 해석에 맡겨 Node 20.18.1과 맞지 않는 Vite major가 들어오는 것을 막기 위해 Vite 6.4.3을 direct exact dependency로 선택했다. 이 추가 고정은 Vite를 제품 server framework로 채택했다는 뜻이 아니라 Vitest의 변환·실행 dependency를 재현 가능하게 만든 것이다.

## 최초 계약 테스트가 고정한 경계

`apps/server/tests/schedules.contract.test.ts`는 DB module과 auth middleware를 `app` import 전에 mock한다. DB mock은 connection client를 만들지 않지만 Drizzle column 표현식이 실제 형태로 구성되도록 `src/db/schema.ts`의 table 정의는 그대로 사용한다. auth mock은 통제된 사용자 ID를 request에 주입한다.

첫 두 검사는 다음을 확인한다.

- `src/index.ts`의 production listener를 시작하지 않고 `src/app.ts`를 import해 `/api/health`의 status와 JSON을 Supertest로 읽을 수 있다. Supertest가 내부에서 여는 임시 local listener는 사용한다.
- `/api/schedules`가 mock DB row의 `scheduledAt`, `createdAt`, `updatedAt`, `deletedAt`을 JSON 문자열·null로 내보내고 `{ success, data }` envelope를 유지한다.

이는 테스트 도구 연결, ESM mock 순서, Express middleware·routing·JSON response 경계를 함께 통과한 smoke이자 첫 Schedule 특성화 검사다. 아직 나머지 여섯 Schedule 소비 지점, schema 실패, 다른 사용자와 soft-deleted row 차단은 고정하지 않았다.

## 실행 결과와 증명 한계

모든 명령은 `.nvmrc`와 같은 Node `20.18.1` 바이너리를 PATH 앞에 두고 실행했다.

- `pnpm --filter @apps/server test`: 1개 test file, 2개 test 통과
- `pnpm --filter @apps/server build`: Node 20 대상 ESM bundle 성공
- `pnpm --filter @apps/server typecheck`: 기존 `src/routes/places.ts:138`에서 `string`을 Google Maps `Language`에 넣는 타입 오류로 실패

첫 test 실행은 제한된 sandbox가 Supertest의 임시 local port bind를 거부해 `listen EPERM`으로 실패했고, 같은 코드와 Node 버전을 local port가 허용된 실행에서 재검사하자 두 test가 통과했다. 이 첫 실패는 app assertion이나 제품 동작 실패로 판정하지 않는다.

mock route 검사는 실제 PostgreSQL의 foreign key·query 조건, JWT 검증, 외부 API, 배포 listener·proxy를 실행하지 않는다. 특히 ownership·soft-delete SQL 의미는 mock chain의 응답만으로 입증할 수 없다. Ticket 05에서 그 조건을 구현할 때에는 route 수준 차단 검사와 격리된 PostgreSQL 통합 검사를 구별해 추가해야 한다. 기존 `places.ts` 타입 오류도 이번 Schedule 변경으로 고친 사실이나 새 회귀가 아니다.

## 다음 실행

제품 코드 변경 전에 일곱 Schedule 소비 지점의 status·envelope·네 날짜 JSON과 선언된 response schema 적용 여부를 특성화한다. 다른 사용자 소유 Trip에 Schedule을 만들거나 중첩 조회하는 경우, soft-deleted parent·child의 일반 조회·activation, 삭제 전파를 위해 tombstone을 포함해야 하는 sync pull은 서로 다른 조건으로 고정한다. 그 근거 위에서 공통 직렬화 책임과 endpoint별 schema·접근 조건을 구현하며 서버 전체 오류 처리에는 손대지 않는다.

## 후속 배치 정리

사용자가 테스트의 정체와 배치를 더 명확히 해 달라고 요청해 최초 한 파일을 역할별로 분리했다. 서버 자체 연결 검사는 `tests/app.smoke.test.ts`, Schedule API 응답 계약은 `tests/routes/schedules.response-contract.test.ts`, DB·auth 대역과 app 준비는 `tests/support/test-app.ts`가 맡는다. 테스트 설명과 실행 이름은 한국어로 바꿨다. 검사의 의미와 mock 범위는 바꾸지 않았다.
