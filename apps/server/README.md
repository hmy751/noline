# Noline API 서버

Express 4·TypeScript ESM·Drizzle/PostgreSQL 기반 API 서버다. 처음 로컬 DB와 iOS 앱을 함께 준비할 때는 [개발 시작](../../START_GUIDE.md)을 따른다. 이 문서는 서버 환경·명령·코드 위치와 배포 전에 확인할 조건을 소유한다. 개발 계약은 [API 가이드](../../context/project/guidance/api-contracts.md), [오류 전달](../../context/project/guidance/error-handling.md), [서버 작업 지침](CLAUDE.md)에서 찾는다.

## 실행과 검사

아래 명령은 저장소 루트 기준이다. 먼저 의존성과 공유 schema, 개발 DB를 준비한다.

```bash
pnpm server dev
pnpm server typecheck
pnpm server build
```

`dev`는 `NODE_ENV=development tsx watch src/index.ts`, `build`는 Node20 대상의 tsup 빌드다. 공유 schema가 바뀌면 `pnpm schema build`를 먼저 실행한다. production 실행은 빌드 뒤 `pnpm server start`이고 `NODE_ENV=production node dist/index.js`를 실행한다. native 앱·OAuth·실제 DB 연결 성공은 타입/빌드 성공과 별도로 확인한다.

| 명령 | 실제 영향 |
| --- | --- |
| `pnpm server test` | Vitest 검사. 테스트별 의존 환경은 검사 설정에서 확인한다. |
| `pnpm server test:integration` | 전용 Compose project의 PostgreSQL14 test DB(55432)에 현 schema를 적용하고 검사 뒤 test volume을 제거한다. 로컬 개발 DB의 읽기 검사와 다르다. |
| `pnpm server db:generate` | `drizzle-kit generate:pg`로 schema SQL 파일 생성. DB 적용은 하지 않는다. |
| `pnpm server db:push` | `drizzle-kit push:pg`로 대상 DB를 현재 Drizzle schema에 맞춘다. 변경 내용을 확인해야 한다. |
| `pnpm server db:studio` | 설정한 DB를 탐색·수정할 수 있는 Drizzle Studio. |
| `pnpm server docker:up/down/logs` | workspace Compose 조작. 스크립트가 `/usr/local/bin/docker`를 고정하므로 설치 경로가 다르면 PATH의 `docker compose`를 직접 사용한다. |

`test:integration`의 Docker 경로는 `DOCKER_BIN`으로 바꿀 수 있다. 스크립트·실행 디렉터리는 [package.json](package.json), [integration runner](scripts/run-integration-tests.mjs)에서 확인한다.

## 환경 설정

개발 파일 예시는 [개발 시작의 환경 설정](../../START_GUIDE.md#2-개발-환경-파일)에 있다. 복사할 `env.example`은 없다. 기존 파일 전체를 출력하거나 예시 생성 명령으로 덮어쓰지 않는다.

개발 실행은 [config/index.ts](src/config/index.ts)의 소스 위치를 기준으로 `apps/server/.env.development`를 읽는다. production 실행은 필요한 값을 **프로세스 환경으로 주입**하는 것을 기준으로 한다. 이미 주입된 값은 dotenv가 덮어쓰지 않는다.

현재 dotenv 경로는 `import.meta.url`에서 얻은 디렉터리의 두 단계 위를 사용한다. 개발의 `src/config/index.ts`와 달리 [tsup 설정](tsup.config.ts)은 서버 소스를 `dist/index.js` 하나로 묶는다. 이 production bundle에서는 같은 계산이 `apps/.env.production`을 가리키므로 `apps/server/.env.production`을 만들었다고 로드되는 것은 아니다. 기존 `dist/index.js`에서도 이 경로 계산을 정적으로 확인했다. 소스 실행과 bundle 실행의 환경 파일 기준을 일치시키는 코드 수정은 후속 과제이며 이 문서는 이를 수정하거나 production 파일 로드를 검증하지 않았다.

| 변수 | 용도와 현재 기본값 |
| --- | --- |
| `DATABASE_URL` | 필수. PostgreSQL 연결 문자열. Compose 개발 기본 DB는 `noline_dev`다. |
| `JWT_SECRET` | 필수. 서버 token 서명용 비밀값. |
| `HOST`, `PORT` | 기본 localhost, 3000. LAN 기기·배포에서는 접근 가능한 바인딩을 지정한다. |
| `CORS_ORIGIN` | 기본 `http://localhost:8081`. 브라우저 client origin과 맞춘다. |
| `JWT_ISSUER` | 기본 `noline-api`. 만료는 config의 access=1h, refresh=30d다. `JWT_EXPIRES_IN`은 읽지 않는다. |
| `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID` | Google ID token 검증 audience. client OAuth 등록과 맞춘다. `GOOGLE_CLIENT_ID`는 현재 config가 읽지 않는다. |
| `APPLE_CLIENT_ID` | Apple identity token audience. 개발/production 앱 bundle과 맞춘다. |
| `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Apple code 교환·token revoke 설정. PEM의 `\n` 줄바꿈을 해석한다. |
| `GOOGLE_PLACES_API_KEY`, `GOOGLE_GEO_DIRECTIONS_API_KEY` | 장소 검색·Google 경로 서비스. |

부팅은 DATABASE_URL/JWT_SECRET 존재를 검사하고 DB에 SELECT1을 실행한 뒤 listener를 연다. 이것이 외부 서비스 키·OAuth·모든 테이블의 유효성을 확인하는 것은 아니다.

## DB 준비와 변경

[Compose](docker-compose.yml)는 PostgreSQL14, 컨테이너 `noline-postgres`, 포트5432, DB `noline_dev`와 지속 volume을 준비한다. 테이블 초기화 SQL이나 migration을 자동 실행하지 않는다. 따라서 새 로컬 DB에는 `pnpm server db:push`가 필요하다. 컨테이너 down/up은 volume을 유지하며 schema 재생성 방법이 아니다.

현재 DB shape의 원천은 [src/db/schema.ts](src/db/schema.ts)다. OAuth users·refresh_tokens와 Trip/Schedule/Expense를 정의한다. 상세 필드를 README에 복제하지 않는다. 예전 password 기반 users, schedules의 startTime/endTime/order/memo, expenses의 isSynced 설명은 현재 shape가 아니다. shared 입출력 계약은 [packages/schema](../../packages/schema/)와 대조한다.

`drizzle.config.ts`는 현재 실행 디렉터리에서 `.env.development` 또는 `.env.production`을 찾는다. 루트의 `pnpm server ...` alias 또는 `apps/server`에서 실행하면 workspace 경로를 사용한다. 로컬 `drizzle/`은 ignore 대상이고 과거 생성물이 남아 있어도 최신 migration 체인으로 간주하지 않는다. 현재 package script에는 일반 `db:migrate` runner가 없다. 운영 schema 적용은 필요한 DDL·기존 데이터 영향·백업·적용 순서를 별도로 준비해야 하며 `db:generate`만으로 적용이 끝나지 않는다.

[DB 스크립트 안내](scripts/README.md)는 기존 DB 열 추가와 과거 변환·물리삭제 스크립트를 구별한다. 현재 OAuth 로그인에서 사용자를 생성하므로 과거 테스트 유저 seed를 새 환경 준비에 사용하지 않는다.

## 라우트와 인증을 찾는 위치

[app.ts](src/app.ts)가 `/api`에 [routes/index.ts](src/routes/index.ts)를 연결한다.

| 경로 | 코드와 역할 |
| --- | --- |
| `GET /api/health` | `status`, `message`, timestamp 반환. 요청마다 DB를 검사하지 않는다. |
| `GET /api` | API 이름·버전·설명. |
| `/api/auth` | [auth.ts](src/routes/auth.ts): Google/Apple 로그인, refresh, logout, me, account 삭제. |
| `/api/trips` | [trips.ts](src/routes/trips.ts): 여행 CRUD, 여행별 일정, 활성화/비활성화. |
| `/api/schedules` | [schedules.ts](src/routes/schedules.ts): 일정 CRUD. |
| `/api/expenses` | [expenses.ts](src/routes/expenses.ts): 경비 CRUD. |
| `/api/places` | [places.ts](src/routes/places.ts): 장소 검색·상세. |
| `/api/sync` | [sync.ts](src/routes/sync.ts): pull/push. |

Trip/Schedule/Expense·sync와 인증이 필요한 계정 route는 Bearer access token을 검증한다. [requireAuth](src/middleware/auth.ts)가 `req.userId`를 설정하고 route가 소유권을 확인한다. 장소 route는 현재 같은 인증 미들웨어를 쓰지 않는다. 모든 route가 같은 인증·parse·응답 wrapper를 적용했다고 일반화하지 말고 [API 계약의 현재 차이](../../context/project/guidance/api-contracts.md)를 확인한다.

## 배포 전 확인

[render.yaml](../../render.yaml)은 의존성/schema/server build와 `apps/server`에서 production start를 정의한다. production 환경값은 실제 호스팅 환경의 프로세스 환경으로 주입한다. 위의 bundle 경로 차이가 해결되기 전에는 workspace의 `.env.production` 자동 로드에 의존하지 않는다. 이 설정 파일의 존재만으로 배포·DB migration 완료를 판단하지 않는다.

현재 파일에는 `HOST`가 없는데 서버 기본은 localhost이며, `GOOGLE_CLIENT_ID` 선언은 config가 읽는 두 변수명과 다르다. 실제 대시보드의 override는 이 문서에서 확인하지 않았다. 외부에서 닿는 host/port와 OAuth audience를 배포 대상에서 확인해야 한다. 스키마 변경을 포함하면 DB DDL → 서버 → client 순서와 구버전 호환을 검토한다.

서버·DB·외부 서비스 설정을 바꾸는 책임자가 실행 절차와 이 안내를 함께 갱신한다. 2026-10-31 정적 대조 범위이며 새 설치·production 실행 검증 기록은 아니다.
