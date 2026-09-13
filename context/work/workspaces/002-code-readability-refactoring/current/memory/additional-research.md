# 추가 조사와 후속 후보

2026-09-11 Main이 전달한 조사 결과다. 기존 [후보 전체](analysis-items.md)를 대체하지 않으며 Spec의 목표·보존 기준을 변경하지 않는다. [초안 Ticket](tickets/index.md)의 번호와 우선순위는 Main 제안이고 사용자 실행 확정은 아니다.

## 출처와 확인 범위

Main의 `추가 코드 조사와 1차 Ticket 초안`을 읽고 필요한 관찰·경계·작업 정의를 이 문서와 Ticket에 보존했다. 전달 파일은 `/private/tmp/noline-002-additional-research-and-ticket-drafts-2026-09-11.md`, 읽은 bytes의 SHA-256은 `f9656715bc0935258e664b189c412da4b2c04ca24cd4f2775c605eeb5134c1c4`다. 임시 파일의 존속을 재진입 전제로 삼지 않는다.

Main이 보고한 조사 기준은 branch `refactor/codebase`, HEAD `a612ba4c49b92b1193e75e1d56bdefcdcd86bbda`다. 시작·마지막 Git 확인에서 미커밋 파일은 Workspace state뿐이었다고 보고했다. 기존 Spec·14개 후보·각 package 가이드와 파일 목록, 검색·날짜·통화·여행 선택·용량·인증/재시도·로그아웃·지도·query hook·schema·UI의 대표 구현과 사용처를 읽었다. 전체 파일 정독이나 앱 전체 실행의 증거는 아니다. 아래 제품 사실은 Main의 코드 조사 보고이며 Maintain이 제품 코드를 독립 검사한 결과가 아니다.

제품 test/spec 파일·runner 설정의 경로 검색과 root/client/server scripts에서 제품 test 명령을 찾지 못했다고 보고했다. 저장소 밖의 검사까지 없다는 뜻은 아니다. 과거 타입·린트 실패는 재실행하지 않았다. Ticket의 검증 사례는 계획이며 제품 코드·테스트·설정 변경과 앱·외부 API·DB 실행은 없었다.

## 추가 관찰

- **도시 검색:** `apps/client/src/features/trip/create-trip/geonames.api.ts`의 `searchCities`에서 허용 도시 코드 네 개가 요청과 응답 필터에 반복된다. 인구 10,000 초과 또는 수도 `PPLC` 예외가 조건식 안에 있다. `useSearchCities.ts`가 queryFn으로 사용한다. 문자열 좌표의 parseFloat와 실패 시 빈 배열 반환은 의미가 있으므로 보존한다. [Ticket 02](tickets/02-city-search.md)에 구체화했다.
- **프로필 용량:** `apps/client/src/features/profile/hooks/useStorageStats.ts`의 성공·바깥 실패 경로가 같은 표시값을 각각 만든다. 파일 조회 중 실패하면 앞서 합산한 용량을 남기고 지도 조회로 진행하지 않으며, 개별 지도 팩 실패는 경고 후 다음 팩을 계속 읽는다. `ProfileScreen.tsx`에서 소비한다. [Ticket 03](tickets/03-storage-stats.md)에 구체화했다.
- **대표 여행 선택:** `apps/client/src/entities/trip/utils/selectMainTrip.ts`는 진행 중·미래·과거·날짜 없는 여행 순으로 선택한다. 조건과 정렬에서 Date 변환과 날짜 존재 단언을 반복하지만 우선순위 자체는 이미 잘 보인다. `TripSelector.tsx`, `HomeScreen/TripsSection.tsx`, `app/_layout.tsx`에서 사용한다. 첫 다섯 범위 뒤 재검토한다. 고정된 오늘·시간대에서 진행 중/미래/과거/동률/빈 목록과 입력 배열 순서 불변을 확인하고, 날짜 없는 입력의 schema 허용 여부부터 대조한다. 간접 호출만 늘리면 개선으로 보지 않는다.
- **카테고리 색상:** `apps/client/src/screens/ExpenseDetailScreen.tsx`의 배경색·글자색 표를 함께 수정해야 한다. `entities/expense/ui/ExpenseCard.tsx`에도 유사한 표가 있으나 `체험` 처리가 다르다. 실제 목록들은 `shared/components/Card/ExpenseCard.tsx`를 사용하며 entity Card 호출은 조사 검색에서 찾지 못했다. 상세 화면 내부 정리와 다른 Card의 역할 확인을 후속 후보로 두고 자동 병합·색상 통일·export 삭제를 하지 않는다.
- **인증·재시도:** `apps/client/src/shared/services/auth/auth-interceptor.ts`의 sync helper는 설명과 달리 401에서 만료 상태와 AuthRequiredError를 처리하며 실제 setup 호출은 조사 범위에서 찾지 못했다. 실행 sync 클라이언트는 `shared/services/sync/api.ts`의 자체 인터셉터를 사용한다. 이 클라이언트의 최대 3회·2/4/8초 재시도 설명과 `!originalRequest._retry` 조건, 첫 재시도 전 `_retry=true` 설정이 충돌하는 코드 경로가 보인다. 실제 Axios config 전달·요청 횟수는 미검증이다. 주석 수정만으로 닫거나 재현된 결함으로 확정하지 않고 동작 확인 후보로 둔다. 실제 재시도 횟수를 바꾸는 수정은 별도 버그 Work 경계다.
- **로그아웃·계정 삭제:** `apps/client/src/shared/services/auth/logout-service.ts`에서 큐 삭제·DB reset·인증 정리·캐시 clear가 반복되지만 로그아웃은 서버 실패 후 로컬 정리를 계속하고 계정 삭제는 서버 실패 시 종료한다. `checkPendingSync`의 hasPending은 pending/inProgress를 포함하고 failed는 별도로 반환한다. 동일 로컬 정리의 후속 후보로 두되 서버 실패 이후 실행·순서·부분 실패·미전송 보존을 확인한다. 옵션 많은 공통 절차를 자동 도입하지 않는다.

## Schedule 응답 Context와 구현 대조

2026-09-12 사용자는 개별 Ticket을 중심에 두지 말고 관련 Project Context가 정의한 책임과 계약부터 확인하라고 정정했다. Main은 Workspace가 선택한 Project context와 API·시간·TypeScript·오류 처리 설명, server/schema guide 및 현재 코드를 대조했다고 보고했다. 아래 내용은 Main의 직접 대조 보고이며 제품 test나 Verify 결과가 아니다.

- Schedule은 sync 대상 Data Entity이고, `@repo/schema`가 API entity·response shape의 원천이며 전송 시간은 timezone을 포함한 ISO 8601 문자열이어야 한다. PostgreSQL/Drizzle row의 날짜는 서버 런타임에서 `Date`이므로 응답 경계에서 ISO 문자열로 직렬화할 필요가 있다.
- `scheduledAt`, `createdAt`, `updatedAt`, `deletedAt` 변환은 `schedules.ts`의 CRUD 네 곳뿐 아니라 `trips.ts`의 중첩 일정 목록과 activation, `sync.ts`의 pull까지 총 일곱 소비 지점에 분산되어 있다고 보고했다. 날짜 직렬화 책임은 같지만 조회·schema 검증·response envelope·오류·인증·소유권 조건은 endpoint마다 다르다.
- Project Context나 server guide는 현재 Schedule serializer·mapper 계층의 canonical 위치를 정의하지 않는다. 공통 helper를 추가하는 것은 기존 표준의 단순 적용이 아니라 새 책임 단위를 두는 설계 판단이다. 일부 네 곳만 추출하면 같은 책임에 두 구현 방식이 남아 수정 규칙을 더 흐릴 수 있다.
- activation route는 선언된 response schema를 사용하지 않고, `GET /api/trips/:tripId/schedules`는 Main이 확인한 코드에서 tripId만 조회 조건으로 사용한다고 보고했다. 이는 직렬화 공통화와 별개의 검증·소유권 후보이며 helper에 숨기거나 이번 리팩터링의 보존 계약으로 고정하지 않는다.
- 오류 처리 Context의 `AppError` → `errorHandler` 설명과 일정 route의 `try/catch`·`sendInternalError` 구현이 어긋나고, Time Context의 DB 경계 문자열 설명은 Drizzle이 반환하는 `Date`와 구별해 읽어야 한다고 보고했다. 이 Project-wide 설명의 현재성은 Workspace Maintain이 고치지 않으며 관련 Owner에서 별도로 대조할 후보로 남긴다.
- `.nvmrc`는 Node 20.18.1을 선언하지만 `package.json`의 `engines`나 CI 설정으로 강제하지 않는다. Main이 조사한 실제 shell은 Node 24.16.0이었다. Main은 `node:test`의 `mock.module`이 Node 20.18.1에 없는 것이 아니라 기본 상태에서는 비활성화되고 `--experimental-test-module-mocks` 플래그로 활성화된다고 실제 바이너리와 공식 문서에서 확인했다고 보고했다. 공식 문서는 이 기능을 `Early development`로 분류하며, TypeScript 실행에는 `tsx` 연결도 필요하다. 따라서 기존 Node 내장 runner 계획은 불가능한 안이 아니라 실험 플래그와 민감한 실행 구성을 감수해야 하는 대안이다. server package에는 기존 test runner·script가 없다.

후속 논의에서 사용자는 일곱 소비 지점의 Schedule 직렬화, endpoint별 response schema 적용, ownership·soft-delete 조건을 Ticket 05에서 모두 처리하기로 선택했다. Schedule 전용인지 다른 server entity에도 적용할 책임인지와 helper 위치는 구현 전 특성화 뒤 확정한다. 서버 검증 기반도 사용자 결정과 실제 적용으로 확정됐으며 아래에서 현재 기준을 설명한다.

### 서버 실행·빌드와 테스트 경계

2026-09-13 Main은 테스트 도구 선택을 설명하기 위해 server package의 실행·빌드 설정과 현재 산출물을 대조했다고 보고했다. 아래는 Main의 코드·설정 관찰이며 실제 프로덕션 프로세스나 CI를 기동한 결과가 아니다.

- 개발은 `tsx watch src/index.ts`, 배포 빌드는 `tsup`의 Node 20 대상 단일 ESM `dist/index.js`, 시작은 `node dist/index.js`를 사용한다. TypeScript 설정은 `module: ESNext`, `moduleResolution: bundler`, `target: ES2022`다.
- `src/app.ts`와 `src/index.ts`가 분리돼 application의 production listener를 직접 시작하지 않고 Express app을 Supertest에 전달할 수 있다. Supertest 자체는 요청을 처리할 임시 local listener를 내부에서 열기 때문에 실행 환경이 local port bind를 허용해야 한다. app import가 모든 route를 거쳐 config 검사와 DB client 생성까지 불러오므로, 현재 구조에서는 DB·auth module을 app보다 먼저 mock해야 한다.
- 내부 상대 import는 대부분 `.js`를 명시하지만 `services/jwt.ts`와 `middleware/auth.ts`에는 확장자 없는 import가 있다고 보고했다. 현재 `tsx`·`tsup`에서는 해결되지만 번들 없는 native ESM이나 `NodeNext` 검사에서는 문제가 될 수 있는 혼합 상태다.
- `.nvmrc` 외에 Node 버전 강제가 없고 Main의 실제 shell은 Node 24.16.0이었다. 테스트 결과를 Node 20 계약으로 주장하려면 선택한 실행 환경에서 버전을 명시적으로 맞춰야 한다.
- `config/index.ts`의 환경 파일 상대 경로는 개발 시 `apps/server/.env.development`를 가리키지만 단일 번들인 `dist/index.js`에서는 `apps/.env.production`을 가리키는 것으로 Main이 재구성했다. 실제 `.env.production`은 `apps/server` 아래에 있으므로 외부 환경변수 주입이 없다면 시작 검사에서 종료될 가능성이 있다. 실제 프로덕션 기동은 하지 않았다.
- 현재 `docker-compose.yml`은 server app이 아니라 개발용 PostgreSQL 14만 제공한다. PostgreSQL 통합 테스트의 격리 방식은 별도로 정해야 한다.

이 관찰 뒤 사용자는 대안과 역할 차이를 비교하고 Vitest 4.1.11의 ESM module mock과 Supertest 7.2.2를 server package의 검사 기반으로 채택했다. 선택 이유와 증명 경계는 [서버 테스트 전략 결정](../../records/2026-09-13-01-server-test-strategy.md)에 남겼다. 프로덕션 환경 파일 경로와 Node 버전 강제는 테스트 도입과 구별해 점검할 별도 설정 후보로 유지한다.

### 서버 공통화 후보의 책임 분리

후속 대화에서 사용자는 날짜 직렬화·응답 검증·소유권을 공통화할 수 있는지, 오류 처리는 더 큰 서버 전체 범위인지, 서버 테스트 기반은 별도 판단이 필요한지 물었고, 비교 설명 뒤 이 다섯 책임을 구분해 진행하는 방향을 확인했다. 아래 번호는 Workspace Ticket 01–05가 아니라 Schedule 주변의 책임 후보 번호다.

1. **Schedule 직렬화:** 같은 DB row → API entity 변환을 공통화한다면 일부 CRUD가 아니라 일곱 소비 지점을 함께 다루는 좁은 코드 공통화 후보다. 테스트로 현재 응답을 고정한 뒤 실제 공통화 여부를 확정한다.
2. **응답 검증:** 이미 `@repo/schema`가 공통 계약이므로 핵심은 각 route가 자기 response schema를 적용하는 기준이다. 날짜 직렬화와 구별해 다루며 범용 validation helper 도입은 필수 결론이 아니다.
3. **사용자 소유권:** user-owned 데이터의 소유권 확인은 공통 의미지만 모든 query에 같은 조건을 적용하면 안 된다. 일반 조회는 soft-delete row를 제외하는 반면 sync는 삭제 전파를 위해 이를 읽어야 할 수 있다. 중첩 일정 route와 Schedule 생성·activation child query의 소유권 조건은 Ticket 05 안에서 기대 동작과 PostgreSQL 근거를 갖춰 처리한다.
4. **오류 처리:** Main은 Trip·Schedule·Expense의 직접 응답과 `sendInternalError`, Places의 일부 `next(error)`, Auth·Sync의 자체 직접 응답, 널리 쓰이지 않는 `AppError`·`errorHandler`가 함께 있다고 보고했다. 서버 error envelope뿐 아니라 client API의 오류 변환과 UI 표시까지 함께 판단해야 하므로 이번 범위에서는 제외하고 더 큰 범위에서 재검토한다.
5. **서버 테스트 기반:** Vitest 4.1.11과 Supertest 7.2.2를 채택해 먼저 구축한다. DB·auth를 통제한 route 계약 검사로 현재 Schedule 응답을 고정하고, 실제 SQL의 소유권·soft-delete는 별도 PostgreSQL 통합 검사로 구별한다.

사용자는 1–3을 Ticket 05에서 각각의 결과 책임으로 모두 수행하고 5번 테스트 기반부터 시작하기로 확정했다. 테스트 기반은 실제로 구축됐고, 다음은 제품 변경 전 특성화를 일곱 소비 지점·schema 적용·접근 조건으로 넓히는 것이다. 4번 오류 처리 공통화는 이번 Ticket의 제외 범위다.

## 기존 후보에 추가된 경계

- `ExpensesScreen.tsx`의 toFixed 표시와 `shared/lib/currency.ts` helper의 천 단위 구분자는 다르다. 공통 helper로 바로 교체하면 화면 문자열이 바뀐다. 소수 자릿수의 공유 의미와 출력 차이를 구별한다. currency helper의 '가장 많이 사용된 통화' 설명과 명목 금액 내림차순 선택도 다를 수 있으나 해당 함수의 앱 호출은 찾지 못했다. 빈도 정렬·환산을 추가하지 않는다.
- expense/schedule data mutation의 캐시 갱신 대상은 다르며 일정 삭제은 경비 캐시도 갱신한다. 공통 hook으로 통일하며 차이를 지우지 않는다.
- `shared/lib/datetime.ts`의 Date 입력 직접 setHours 변경과 UTC ISO 반환, offset 예제 및 미래 상대시간 설명은 구별해야 한다. 설명 정정과 입력 변경·시간대·미래 표시의 동작 수정을 섞지 않는다.
- `packages/ui`의 Input·Checkbox·Switch는 짧고 명확해 범용 wrapper를 추가할 근거를 찾지 못했다. RadioGroup의 `as any`는 앱 사용처와 primitive prop 계약 확인 전 첫 Ticket으로 올리지 않는다.
- `packages/schema/src/requests/schedule.ts`의 생성·수정은 필수성과 허용 필드가 다르다. 생성 schema를 단순 partial로 만드는 통일은 채택하지 않았다.

## 기존 후보와 실행 초안의 관계

기존 14개 후보는 계속 유효한 조사 범위이며 아래 연결은 최종 처리 판정이 아니다.

- 이름·주석·로그·catch는 Ticket 04의 경비 API부터 제안했다. auth wrapper·날짜 설명·미호출처럼 보이는 export는 후속 판단이다.
- 조건식·표시는 Ticket 01에, 추가 도시 검색은 Ticket 02에, 용량 집계는 Ticket 03에 연결한다. 카테고리 색상은 별도 후속 후보다.
- 불필요한 값 변환·기본값은 일정 form의 number 왕복을 후속으로 남긴다. 도시 검색의 문자열 변환은 보존하고 좌표 0 수정과 섞지 않는다.
- 타입 전달에서 Schedule DB row의 날짜를 API entity 문자열로 직렬화하는 의미는 CRUD·nested list·activation·sync의 일곱 소비 지점에 걸쳐 있다. 공통 책임으로 채택할지는 아직 열려 있으며 sync의 `as never[]`나 mutation의 `any` 전반과 섞지 않는다.
- 중복 검증·도달하지 않는 분기는 직렬화와 별도다. endpoint별 schema 검증 차이, activation의 선언된 response schema 미사용, nested schedule 조회의 소유권 조건은 별도 계약 후보로 유지한다.
- 목록 계산/useMemo와 날짜 그룹은 후속으로 비교하며 UTC/local 차이는 기대 동작부터 확인한다.
- 폼 초기값/reset은 한 폼의 취소·재열기·다른 항목·늦은 기본값으로 좁힌다. picker는 호출부까지 묶어 선택·닫기·취소 횟수와 값 전달을 확인한다.
- 저장 성공 이후 처리는 캐시·이동·경로 준비까지 연결한 한 흐름으로 구체화한다. 500ms 제거·오래된 좌표 수정은 별도 동작 변경이다.
- 생성·수정 컴포넌트 반복은 폼 경계를 확인한 뒤 같은 입력 의미만 다룬다. 조회 정책·오류·loading 차이의 실제 영향은 버그 후보에도 남긴다.
- 공통 데이터·경로·정리는 route/upsert/cleanup의 차이와 미전송 보존에 직접 걸리는 부분만 선행 확인한다. 로그아웃/삭제에도 같은 기준을 적용한다.
- 완료 상태·조율 책임은 활성화/동기화 이름과 실제 완료 범위를 후속 구체화한다. sync 재시도는 먼저 동작 확인 후보로 유지한다.
- 설정·사용처는 policy syncStrategy와 미호출 sync auth helper 등을 실제 연결과 대조하되 자동 삭제·구현하지 않는다.
- 서버 변환·오류 책임은 Project Context와 실제 코드 대조를 먼저 적용한다. Ticket 05의 CRUD 네 곳만 추출하는 초안은 현재 실행안이 아니며, 일곱 Schedule 소비 지점의 직렬화 공통성·endpoint별 계약 차이·새 책임 단위의 비용을 판단한 뒤 범위를 정한다. auth/places 오류와 서버 오류 처리 Context의 현재성은 별도 후속이다.

대표 여행 선택·카테고리·datetime 설명·인증/재시도·로그아웃 후보도 첫 다섯 Ticket 밖에 남아 있다. 다섯 초안만 끝내는 것을 전체 Work 완료로 보지 않는다.
