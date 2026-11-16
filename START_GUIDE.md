# Noline 로컬 개발 시작

처음 저장소를 받은 개발자가 PostgreSQL·API 서버·iOS 개발 앱을 띄워 로그인 화면까지 가는 절차다. 다음 실행에서 기존 환경을 다시 쓰는 방법과 막혔을 때 확인할 것도 함께 둔다.

## 한눈에 보기

0. 프로젝트 관리자에게 외부 서비스 값을 받는다. 특히 `MAPBOX_SECRET_ACCESS_TOKEN`과 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`가 없으면 빌드나 로그인 화면에서 막힌다. → [2. 개발 환경 파일](#2-개발-환경-파일)
1. `pnpm install`
2. 서버·클라이언트 환경 파일을 만든다.
3. `docker compose -f apps/server/docker-compose.yml up -d`로 DB를 켜고 `pnpm run server db:push`에서 `Yes`를 고른다.
4. **터미널 A**: `pnpm run server dev`를 실행하고 health 응답을 확인한다.
5. **터미널 B**: `pnpm client ios`를 실행하면 simulator에 로그인 화면이 나온다.

두 번째부터는 [다음에 다시 켤 때](#다음에-다시-켤-때)를 따른다. 이 절차는 2026-11-16에 새 clone에서 로그인 화면까지 실행해 확인했다. 확인한 범위는 [문서 끝](#문서-범위와-마지막-확인)에 있다.

## 준비할 도구

- **Node.js 20과 pnpm 9.6.0**: 저장소의 `.nvmrc`는 20.18.1이다. nvm을 쓰면 저장소 루트에서 `nvm use`로 맞춘다.
- **Docker Desktop**(Compose 포함): 로컬 PostgreSQL 14를 띄운다.
- **macOS, Xcode, iOS simulator runtime, CocoaPods**: simulator runtime이 없으면 Xcode의 Settings > Components에서 설치한다. 최소 지원 버전은 정하지 않았다. 확인한 환경은 Xcode 26.5·CocoaPods 1.16.2다.
- **외부 서비스 값**: [외부 서비스 값과 필요한 시점](#외부-서비스-값과-필요한-시점)을 본다.

Mapbox 네이티브 모듈이 들어 있어 Expo Go로는 실행할 수 없고, 프로젝트의 네이티브 개발 빌드를 쓴다. 지원·배포 대상은 iOS다. Android나 실기기로 실행하려면 [부록](#부록-다른-실행-대상)을 본다.

### 명령을 실행하는 규칙

- 명령은 별도 표시가 없으면 저장소 루트에서 실행한다.
- `pnpm client …`, `pnpm schema …`는 그대로 쓴다. **서버만 `pnpm run server …`로 실행한다.** `server`가 pnpm 내장 명령(store server 관리)과 이름이 겹쳐서, `run`을 빼면 `ERR_PNPM_INVALID_SERVER_COMMAND`로 실패한다.
- 터미널 A는 API 서버, 터미널 B는 Metro(앱 번들 서버)다. 앱을 쓰는 동안 둘 다 열어 둔다.
- 이미 떠 있는 DB·서버·Metro가 있으면 먼저 상태와 주소를 확인하고 필요한 것만 켠다.

## 1. 의존성과 공유 schema

```bash
pnpm install
```

설치 마지막에 `postinstall`이 공유 schema 패키지(`@repo/schema`)를 빌드한다. 서버와 클라이언트는 빌드된 `dist`를 읽는다. 그래서 `packages/schema`를 고쳤거나 설치 때 스크립트 실행을 건너뛰었다면 다시 빌드해야 한다.

```bash
pnpm schema build
```

## 2. 개발 환경 파일

저장소에는 복사할 `env.example`이 없다. 아래 예시로 두 파일을 만든다. 이미 있는 파일은 덮어쓰지 말고 필요한 변수만 확인한다. 실제 비밀값은 커밋하거나 로그에 출력하지 않는다.

### 외부 서비스 값과 필요한 시점

서버·클라이언트 값 전체를 프로젝트 관리자에게 한 번에 받는 것을 기본으로 한다. 직접 발급한다면 Mapbox·Google Cloud·Apple Developer·GeoNames에서 만들고, OAuth 등록은 개발 bundle `com.noline.dev`에 맞춘다.

다음 값은 없으면 바로 막힌다.

| 값 | 막히는 단계 | 이유 |
| --- | --- | --- |
| 서버 `DATABASE_URL`, `JWT_SECRET` | 서버 시작 | 서버가 시작할 때 검사한다. |
| `MAPBOX_SECRET_ACCESS_TOKEN` | 첫 iOS 빌드 | CocoaPods가 Mapbox SDK를 내려받을 때 인증에 쓴다. `DOWNLOADS:READ` 권한이 있는 secret token이어야 한다. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | 로그인 화면 | 비어 있으면 화면을 그리다 `Client Id property iosClientId must be defined` 예외로 멈춘다. 실제 Google 로그인까지 하려면 OAuth에 등록된 값이어야 한다. |

나머지는 해당 기능을 쓸 때 필요하다.

| 기능 | 필요한 값 |
| --- | --- |
| Google 로그인 | 클라이언트 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`·`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, 서버 `GOOGLE_WEB_CLIENT_ID`·`GOOGLE_IOS_CLIENT_ID`. 넷이 같은 OAuth 등록을 가리켜야 한다. |
| Apple 로그인 | 서버 `APPLE_CLIENT_ID`, 토큰 교환·철회까지 확인하려면 `APPLE_TEAM_ID`·`APPLE_KEY_ID`·`APPLE_PRIVATE_KEY` |
| 지도·Mapbox 경로 | `EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN`, `EXPO_PUBLIC_GOOGLE_MAPS_*_API_KEY` |
| 여행 생성의 도시 검색·시간대 | `EXPO_PUBLIC_GEONAMES_*` |
| 장소 검색·Google 경로 | 서버 `GOOGLE_PLACES_API_KEY`, `GOOGLE_GEO_DIRECTIONS_API_KEY` |

Mapbox 공개 token은 앱 시작 코드에서 지도 SDK에 바로 설정된다. 이 값 없이 앱을 실행하는 경우는 확인하지 않았으므로 처음부터 함께 받아 둔다.

### 서버: `apps/server/.env.development`

```dotenv
PORT=3000
HOST=localhost
DATABASE_URL=postgresql://postgres:password@localhost:5432/noline_dev
JWT_SECRET=<openssl rand -base64 32 같은 명령으로 만든 임의 문자열>
JWT_ISSUER=noline-api
CORS_ORIGIN=http://localhost:8081

# Google 로그인
GOOGLE_WEB_CLIENT_ID=<web-client-id>
GOOGLE_IOS_CLIENT_ID=<ios-client-id>

# 장소 검색·Google 경로
GOOGLE_PLACES_API_KEY=<places-api-key>
GOOGLE_GEO_DIRECTIONS_API_KEY=<directions-api-key>

# Apple 로그인: APPLE_CLIENT_ID는 앱 bundle identifier와 같아야 한다.
APPLE_CLIENT_ID=com.noline.dev
APPLE_TEAM_ID=<team-id>
APPLE_KEY_ID=<key-id>
APPLE_PRIVATE_KEY=<PEM-private-key>
```

꺾쇠 값은 실제 값으로 바꾼다. 아직 없는 서비스 값은 예시값으로 남기지 말고 줄을 지운다. 서버는 그대로 시작하고 해당 기능만 실패한다. Apple private key는 줄바꿈을 `\n`으로 적어도 된다. 이미 셸 환경에 있는 변수는 파일 값이 덮어쓰지 않는다.

### 클라이언트: `apps/client/.env.development`

```dotenv
APP_VARIANT=development
EXPO_PUBLIC_API_URL=http://localhost:3000

# 없으면 첫 빌드·로그인 화면에서 막힌다
MAPBOX_SECRET_ACCESS_TOKEN=<mapbox-secret-token>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>

# Google 로그인
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>

# 지도
EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN=<mapbox-public-token>
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=<maps-ios-key>
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=<maps-android-key>

# 여행 생성의 도시 검색
EXPO_PUBLIC_GEONAMES_API_URL=https://secure.geonames.org
EXPO_PUBLIC_GEONAMES_USERNAME=<geonames-username>
```

| 설정 | 주의점 | 값을 바꾼 뒤 |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | 서버 origin만 넣는다. 요청 코드가 `/api/...`를 붙이므로 `/api`를 덧붙이지 않는다. Android·실기기는 [부록](#부록-다른-실행-대상)의 주소를 쓴다. | Metro 재시작 |
| `MAPBOX_SECRET_ACCESS_TOKEN` | 빌드에만 쓰는 비밀 token이다. `EXPO_PUBLIC_` 변수에 넣지 않는다. | `pnpm client ios`로 재빌드 |
| Google Maps API key | 네이티브 지도 설정이다. OAuth client ID와 다른 값이다. | 재빌드 |
| Google OAuth client ID, Mapbox 공개 token, GeoNames | 앱 코드가 실행 중에 읽는다. | Metro 재시작 |
| `APP_VARIANT` | 기본은 development다. development bundle은 `com.noline.dev`, production은 `com.ham.noline`이고 OAuth 등록도 이에 맞춘다. | 재빌드 |

Metro를 다시 시작해도 값이 반영되지 않으면 `pnpm client start --clear`로 캐시를 비운다.

## 3. PostgreSQL과 새 로컬 DB

```bash
docker info
docker compose -f apps/server/docker-compose.yml up -d
docker exec noline-postgres pg_isready -U postgres -d noline_dev
```

`accepting connections`가 나오면 DB가 준비된 것이다. Compose는 `noline-postgres` 컨테이너, 포트 `5432`, DB `noline_dev`를 만들고 데이터를 volume에 보존한다. 서버 예시의 `DATABASE_URL`이 이 값에 맞춰져 있다.

새 DB에는 테이블이 없으므로 현재 schema를 적용한다.

```bash
pnpm run server db:push
```

`db:push`는 실행할 SQL을 모두 출력한 뒤 다음 중 하나를 고르게 한다.

```text
❯ No, abort
  Yes, I want to execute all statements
```

기본 선택은 `No, abort`다. 새 DB라면 출력이 테이블 생성과 제약 추가뿐인지 보고, 아래 화살표로 `Yes`를 골라 Enter를 누른다. `[✓] Changes applied`가 나오면 users·refresh_tokens·trips·schedules·expenses·legacy_update_holds 테이블이 생긴 것이다.

데이터가 있는 DB에서는 출력된 SQL을 확인하지 않고 `Yes`를 고르지 않는다. 이미 쓰던 DB에 변경을 적용하는 방법은 [다음에 다시 켤 때](#다음에-다시-켤-때)에 있다.

## 4. API 서버 (터미널 A)

```bash
pnpm run server dev
```

`API listening at http://localhost:3000 (development)`가 출력되면 시작된 것이다. 다른 터미널에서 확인한다.

```bash
curl http://localhost:3000/api/health
```

`{"status":"ok","message":"Server is running",...}`가 오면 된다. 서버는 시작할 때 DB 연결만 확인한다. health 응답은 테이블이 최신인지, OAuth·지도 API 설정이 맞는지는 알려 주지 않는다.

## 5. iOS 개발 앱 (터미널 B)

```bash
pnpm client ios
```

이 명령 하나가 다음을 차례로 한다. prebuild로 `apps/client/ios`를 만들고, CocoaPods 설치와 Xcode 빌드를 거쳐 simulator에 앱을 설치한 뒤, 같은 터미널에서 Metro를 시작한다. 캐시가 없는 첫 빌드는 오래 걸린다. 빌드가 끝나도 이 터미널을 닫지 않는다. Metro가 여기서 돌고 있으므로 `pnpm client start`를 따로 실행하지 않는다.

켜져 있는 simulator가 있으면 그 기기에 설치된다. 다른 기기를 고르려면 `pnpm client ios --device "<simulator 이름 또는 UDID>"`를 쓴다.

**성공 확인**: Metro 로그에 `[AppInitialization] completed`와 `redirect {"reason": "unauthenticated", "target": "login"}`가 나오고, simulator에 로그인 화면이 보이면 된다. 예전에 로그인한 계정이 남아 있으면 로그인 화면 대신 여행 화면으로 들어간다.

**알아둘 것**

- 번들링 중 반복되는 `baseline-browser-mapping` 경고는 실행에 영향이 없다.
- 로그인은 Google·Apple만 있다. 개발용 이메일 로그인이나 테스트 계정은 없고, 첫 로그인 때 서버가 사용자를 만든다.
- simulator·실기기에서 Apple 로그인과 Google 로그인 복귀가 되는지는 그 환경에서 따로 확인해야 한다.

## 다음에 다시 켤 때

DB 데이터는 volume에 남으므로 `db:push`를 다시 할 필요가 없다.

```bash
docker compose -f apps/server/docker-compose.yml up -d
```

- 터미널 A: `pnpm run server dev`
- 터미널 B: 개발 앱이 이미 설치돼 있으면 `pnpm client start`로 Metro만 띄우고 simulator에서 앱을 연다. 네이티브 의존성이나 위 표의 "재빌드" 값을 바꿨다면 `pnpm client ios`로 다시 빌드한다.

**저장소를 새로 받은 뒤 서버 schema(`apps/server/src/db/schema.ts`)가 바뀌었다면** 기존 DB에 빠진 변경만 적용한다. 2026-11-13 이전에 만든 DB에는 일정·경비의 `field_edits` 열과 `legacy_update_holds` 테이블이 없으니 [항목별 편집 표식 DDL](apps/server/README.md#항목별-편집-표식의-db-적용)을 적용한다. 그보다 오래된 DB는 [SQL별 적용 조건](apps/server/scripts/README.md)을 따른다. 기존 DB를 새로 만들거나 `scripts/`의 SQL을 모두 실행하지 않는다.

## 막혔을 때

| 증상 | 원인 | 할 일 |
| --- | --- | --- |
| `ERR_PNPM_INVALID_SERVER_COMMAND` | `pnpm server …`처럼 `run`을 빠뜨렸다. | `pnpm run server …`로 실행한다. |
| `db:push`가 멈춘 것처럼 보인다 | 확인 프롬프트가 선택을 기다린다. | 대화형 터미널에서 실행해 출력된 SQL을 보고 고른다. |
| DB connection refused | DB가 꺼져 있거나, 다른 PostgreSQL이 5432를 쓰거나, `DATABASE_URL`이 다르다. | `docker compose -f apps/server/docker-compose.yml ps`로 상태를 본다. 5432를 다른 DB가 쓰면 그 용도를 확인한 뒤 포트와 `DATABASE_URL`을 함께 바꾼다. 컨테이너를 새로 만들기 전에 기존 컨테이너부터 확인한다. |
| relation·column이 없다는 오류 | DB가 현재 schema보다 오래됐다. | [다음에 다시 켤 때](#다음에-다시-켤-때)의 DDL을 적용한다. |
| simulator가 없다 | iOS simulator runtime이 없다. | Xcode의 Settings > Components에서 설치한다. |
| CocoaPods 인코딩 오류 | 터미널 locale이 UTF-8이 아니다. | `export LANG=en_US.UTF-8` 후 다시 실행한다. |
| CocoaPods가 Mapbox SDK를 받지 못한다 | `MAPBOX_SECRET_ACCESS_TOKEN`이 없거나 권한이 부족하다. | token과 `DOWNLOADS:READ` 권한을 확인하고 `pnpm client ios`를 다시 실행한다. |
| 로그인 화면 대신 `Client Id property iosClientId must be defined` | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`가 비어 있다. | 값을 넣고 Metro를 다시 시작한다. |
| 앱에서 network error | 실행 대상에서 API 주소가 닿지 않는다. | [부록](#부록-다른-실행-대상)의 주소와 서버 `HOST`, 방화벽을 확인한다. |
| OAuth 실패 | variant의 bundle, client ID, 서버 검증값, provider 등록이 서로 다르다. | [외부 서비스 값](#외부-서비스-값과-필요한-시점)의 Google·Apple 값을 같은 등록에 맞춘다. API key와 OAuth client ID를 섞지 않는다. |
| native module이 없다는 오류 | Expo Go로 열었거나 개발 앱이 현재 네이티브 설정보다 오래됐다. | `pnpm client ios`로 다시 빌드한다. |
| 환경 파일 값이 반영되지 않는다 | 변수명 오타, 예전 이름(`GEONAMES_USERNAME`, `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`), Metro 캐시 | 정확한 이름을 쓰고 Metro를 다시 시작한다. 그래도 안 되면 `pnpm client start --clear`, 재빌드 값이면 `pnpm client ios`. |
| Metro가 지금 저장소가 아닌 경로에서 `Unable to resolve`를 낸다 | 다른 위치의 같은 프로젝트(worktree·clone)를 번들링한 캐시가 남았다. | `pnpm client start --clear`로 캐시를 비운다. |

설치나 빌드가 실패해도 원인을 확인하기 전에 `node_modules`나 `apps/client/ios`를 지우지 않는다. 지우고 다시 받는 데 오래 걸리고, 원인이 그대로면 같은 곳에서 다시 실패한다.

## 코드 검사와 실제 실행의 범위

변경한 workspace에 맞춰 실행한다.

```bash
pnpm schema build
pnpm run server typecheck
pnpm run server build
pnpm client test:typecheck
pnpm client lint
pnpm harness:check
```

각 명령은 빌드·타입·lint·문서 연결 중 맡은 범위만 확인한다. 네이티브 빌드, DB 적용, OAuth, 실제 기기 동작은 대신하지 않는다. 단위 테스트는 각 workspace의 `test` 스크립트로 실행한다. `pnpm run server test:integration`은 별도 PostgreSQL test DB(포트 55432)를 만들어 검사하고 마지막에 test volume을 지운다.

실제 실행은 다음 단계를 구별해서 확인한다. 로그만 보고 화면·로그인·오프라인 동작을 확인했다고 하지 않는다.

| 확인할 것 | 방법 |
| --- | --- |
| 서버 시작 | health 응답 |
| 앱 실행 | simulator의 로그인 화면(또는 여행 화면) |
| 로그인과 서버 연결 | 로그인 뒤 서버에서 받은 여행 목록이 보이는지 |
| 오프라인 사용 | 여행을 기기에 준비(활성화)한 뒤 네트워크를 끊고 앱을 다시 열어 일정·지도·경로가 보이는지 |

앱 시작·세션과 기기 데이터 보존의 현재 계약은 [앱 실행 본문](context/project/current/app-runtime/INDEX.md)에 있다.

## 부록: 다른 실행 대상

| 실행 대상 | 클라이언트 `EXPO_PUBLIC_API_URL` | 서버 쪽 준비 |
| --- | --- | --- |
| 같은 Mac의 iOS simulator | `http://localhost:3000` | 기본 `HOST=localhost`로 충분하다. |
| Android emulator | 호스트 Mac에 닿는 주소(보통 `http://10.0.2.2:3000`) | emulator에서 접근할 수 있게 서버 바인딩을 확인한다. |
| 실제 기기 | `http://<Mac의 LAN IP>:3000` | `HOST=0.0.0.0` 또는 해당 LAN IP. 같은 네트워크와 방화벽을 확인한다. |

실기기에서 localhost는 Mac이 아니다. API 서버 주소와 Metro 주소는 서로 다른 것이다. 브라우저에서 실행한다면 서버 `CORS_ORIGIN`(기본 `http://localhost:8081`)을 실제 origin에 맞춘다. Android 실행 스크립트와 설정은 있지만, 이 문서는 Android 빌드와 로그인을 확인하지 않았다. 주소만 바꿨다고 Android·실기기의 로그인과 네이티브 기능이 된다고 보지 않는다.

## Sentry 오류 수집을 연결할 때

선택 설정이다. 로컬 시작에는 필요 없다. DSN이 없으면 그쪽은 진단을 보내지 않고 앱·서버와 여행 기능은 그대로 동작한다.

### 연결 설정

Sentry 조직에 React Native용 앱 프로젝트와 Node.js용 서버 프로젝트를 만들고, 각 프로젝트의 Client Keys에서 DSN을 가져온다. 앱 빌드 환경의 `EXPO_PUBLIC_SENTRY_DSN`과 서버 실행 환경의 `SENTRY_DSN`에 각각 넣는다.

앱의 `EXPO_PUBLIC_SENTRY_ENVIRONMENT`에는 검증 빌드와 운영 빌드를 구별하는 값(예: `staging`, `production`)을 넣는다. 앱 소스맵을 올리려면 빌드 환경에 `SENTRY_ORG`, 앱의 `SENTRY_PROJECT`, 비밀값 `SENTRY_AUTH_TOKEN`을 지정하고 새 네이티브 빌드를 만든다. 이미 로컬 iOS 프로젝트를 만든 뒤 조직·프로젝트를 설정했다면 `apps/client`에서 `pnpm exec expo prebuild --platform ios --no-install`로 다시 적용하고, Xcode의 “Bundle React Native code and images” 단계에 `sentry-xcode.sh`가 있는지 확인한다. 업로드 token은 빌드 서비스의 secret으로 관리한다.

서버는 같은 빌드를 여러 환경에 배포할 때 실행 환경마다 `SENTRY_ENVIRONMENT`를 지정한다. 릴리스를 구별하려면 `SENTRY_RELEASE`에 배포 버전이나 커밋을 넣는다.

### 수신 신호 해석과 운영 알림

테스트 프로젝트에서 오류의 코드 위치와 환경을 확인한 뒤 [Ticket 06](context/work/workspaces/007-sync-failure-recovery/current/memory/tickets/06-stalled-sync-visibility.md)의 오프라인·재실행·로그아웃 사례를 확인한다. 여행 데이터가 실제로 전송됐는지는 앱의 큐와 서버에서 확인한다. Sentry 건수는 수신된 진단의 범위일 뿐이다.

반복해서 막힌 작업은 앱 프로젝트에서 환경·릴리스를 고르고 이슈에서 `sync.push.blocked`와 `sync.repeated:true`로 찾는다. `sync.previous_failures`는 이번 시도 전까지 큐에 쌓인 실패 횟수이고, `sync.has_waiting`은 이번 작업 뒤에 기다리는 작업이 있는지를 나타낸다. 같은 실행의 시작·종료는 trace에서 본다. 실행 빈도는 수신된 `sync.started` 추적을 시작 이유별로 조회한다. 같은 실행 ID의 `sync.finished`가 없으면 결과는 미확인이다. 동기화 실행마다 추적 기록이 최대 두 개 생기고, 격리·막힘 이벤트는 오류 이벤트 할당량을 쓴다.

운영 앱 프로젝트는 JS 예외와 동기화 신호를 수집한다. 이 프로젝트는 Expo 51과 Xcode 릴리스 빌드에 Sentry React Native 6.22 계열을 쓴다. 네이티브 크래시 원문은 JS 이벤트 필터를 거치지 않으므로 자동 수집을 껐다.

수집 설정을 바꾸면 새 이벤트 상세에서 실제 저장된 필드를 확인한다. Noline 검증 프로젝트에서는 IP 저장 방지를 켠 뒤에도 도시가 표시됐다. 앱 필터와 수집 서버가 더하는 정보는 [오류·진단 가이드](context/project/guidance/error-handling.md#개발자가-동기화-실패를-조사할-때)를 참고한다.

프로젝트를 만들 때 운영 알림을 정한다. 새 JS 예외와 서버 오류는 알리고, 정보 수준인 `sync.quarantined`는 즉시 알림에서 뺀다. 동기화 경고는 `sync.push.blocked` 중 이전 실패가 있고 뒤 작업도 남은 경우를 우선한다. 서버 프로젝트의 `api.request.rejected`는 서버가 받은 HTTP 거절 기록이고, 같은 실행 안의 HTTP 재시도도 따로 들어온다. 프로젝트별 수신량과 누락을 함께 살핀다.

## 문서 범위와 마지막 확인

이 문서는 로컬 시작 절차를 맡는다. 서버 환경·라우트·배포 전제는 [서버 안내](apps/server/README.md), 개별 SQL의 적용 조건은 [DB 스크립트 안내](apps/server/scripts/README.md), 제품 동작과 구현 차이는 [Project context](context/project/README.md)가 맡는다.

2026-11-16에 새로 clone한 저장소에서 Node 20.18.1·pnpm 9.6.0·Xcode 26.5·CocoaPods 1.16.2로 이 절차를 실행했다. 확인한 것은 설치와 schema 빌드, 빈 PostgreSQL 14 DB의 `db:push`, 서버 시작과 health 응답, 새 iOS simulator에서 `pnpm client ios`의 빌드·설치와 로그인 화면 표시까지다. DB는 기존 개발 DB와 겹치지 않게 같은 설정의 별도 컨테이너·포트를 썼고, 클라이언트에는 외부 서비스 값을 모두 채운 환경 파일을 썼다. 실제 Google·Apple 로그인, Android, 외부 값 일부가 없는 실행, 패키지·CocoaPods 캐시가 없는 Mac의 첫 설치는 확인하지 않았다.

설정이나 실행 스크립트를 바꾸는 사람이 이 문서와 서버·SQL 안내를 함께 고친다.
