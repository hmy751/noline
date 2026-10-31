# Noline 로컬 개발 시작

처음 저장소를 받은 개발자가 PostgreSQL·API 서버·iOS 개발 앱을 준비하고, 다음 실행에서 기존 환경을 재사용하는 절차다. 로컬 시작 절차는 이 문서가 소유한다. 서버 환경·라우트·배포 전제는 [서버 안내](apps/server/README.md), 개별 SQL의 적용 조건은 [DB 스크립트 안내](apps/server/scripts/README.md)를 따른다. 제품의 동작과 구현 차이는 [Project context](context/project/README.md)에서 찾는다.

## 준비할 도구와 실행 대상

- Node.js 20 계열과 pnpm **9.6.0**: 루트 `packageManager`와 서버 build target 기준이다. EAS 설정은 Node 20.18.1을 사용한다.
- PostgreSQL: 아래 절차는 Docker Compose의 PostgreSQL 14를 사용한다. 기존 개발 DB를 이용한다면 접속 정보와 현재 schema를 별도로 확인한다.
- iOS 개발 앱을 로컬 빌드할 macOS, Xcode와 simulator, CocoaPods. 저장소가 Xcode·CocoaPods의 정확한 최소 지원 버전을 검증하는 것은 아니다.
- 지도·도시 검색과 로그인에 사용할 외부 서비스 설정. 필요한 변수와 역할은 다음 표를 따른다.

Mapbox 네이티브 모듈을 포함하므로 **Expo Go 대신 프로젝트의 네이티브 개발 빌드**를 사용한다. 현재 배포 대상은 iOS다. Android 실행 스크립트·설정은 있지만 이 절차가 Android 빌드·로그인 성공까지 검증한 것은 아니다.

명령은 별도 표시가 없으면 저장소 루트에서 실행한다. 앱·DB가 이미 실행 중이면 먼저 그 상태와 주소를 확인하고 필요한 부분만 시작한다.

## 1. 의존성과 공유 schema

```bash
pnpm install
```

루트 `postinstall`이 `@repo/schema`를 빌드한다. 설치 시 lifecycle 실행을 생략했거나 공유 schema를 수정했다면 다시 빌드한다.

```bash
pnpm schema build
```

schema package는 `dist`를 내보내므로 소스만 수정한 상태로 서버·클라이언트를 실행하면 이전 계약을 읽을 수 있다. 기존 설치가 있는 환경에서는 실행만 하려고 의존성을 지우거나 재설치하지 않는다.

## 2. 개발 환경 파일

저장소에는 복사할 `env.example`이 없다. 다음 예시를 참고해 각각의 파일을 생성한다. 이미 있는 파일은 덮어쓰지 말고 필요한 변수만 확인한다. 실제 비밀값은 커밋하거나 환경 파일 전체를 로그로 출력하지 않는다.

### 서버: `apps/server/.env.development`

```dotenv
PORT=3000
HOST=localhost
DATABASE_URL=postgresql://postgres:password@localhost:5432/noline_dev
JWT_SECRET=<로컬에서 생성한 비밀값>
JWT_ISSUER=noline-api
CORS_ORIGIN=http://localhost:8081

# Google 로그인 사용 시: 클라이언트 OAuth 설정과 일치시킨다.
GOOGLE_WEB_CLIENT_ID=<web-client-id>
GOOGLE_IOS_CLIENT_ID=<ios-client-id>

# 장소 검색·Google 경로 기능 사용 시
GOOGLE_PLACES_API_KEY=<places-api-key>
GOOGLE_GEO_DIRECTIONS_API_KEY=<directions-api-key>

# Apple 로그인 사용 시: 선택한 앱의 bundle identifier와 일치시킨다.
APPLE_CLIENT_ID=com.noline.dev
# Apple authorization code 교환·token revoke까지 확인할 때
APPLE_TEAM_ID=<team-id>
APPLE_KEY_ID=<key-id>
APPLE_PRIVATE_KEY=<PEM-private-key>
```

꺾쇠 값은 실제 설정으로 바꾼다. 서버 시작에 필요한 값은 `DATABASE_URL`, `JWT_SECRET`이고 외부 서비스 값은 해당 기능을 사용할 때 필요하다. Apple private key의 줄바꿈은 `\n` 형태도 서버가 해석한다. 사용하지 않는 서비스 변수는 예시값 그대로 남기지 말고 생략한다.

`pnpm server dev`는 `NODE_ENV=development`를 지정하고 서버가 `.env.development`를 읽는다. 이미 프로세스 환경에 설정된 값은 dotenv가 덮어쓰지 않는다. `JWT_EXPIRES_IN`은 현재 코드가 읽지 않으며 토큰 만료는 서버 config에서 access 1시간, refresh 30일로 정한다.

### 클라이언트: `apps/client/.env.development`

```dotenv
APP_VARIANT=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GEONAMES_API_URL=https://secure.geonames.org
EXPO_PUBLIC_GEONAMES_USERNAME=<geonames-username>
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=<maps-ios-key>
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=<maps-android-key>
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web-client-id>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<ios-client-id>
EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN=<mapbox-public-token>
MAPBOX_SECRET_ACCESS_TOKEN=<mapbox-native-download-token>
```

| 설정 | 역할과 주의점 |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | 서버 origin만 넣는다. 요청 코드가 `/api/...`를 붙이므로 값에 `/api`를 덧붙이지 않는다. |
| `EXPO_PUBLIC_GEONAMES_*` | 여행 생성의 도시 검색·좌표 기반 시간대 조회. 예전 `GEONAMES_USERNAME` 이름은 현재 코드와 다르다. |
| Google Maps API key | native 지도 설정. OAuth client ID와 다른 값이다. |
| Google OAuth client ID | client 로그인 요청과 server ID token 검증의 audience를 맞춘다. |
| `EXPO_PUBLIC_MAPBOX_PUBLIC_ACCESS_TOKEN` | 앱 실행 중 지도·Mapbox 경로 요청에 사용하는 공개 token. 예전 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 이름은 사용하지 않는다. |
| `MAPBOX_SECRET_ACCESS_TOKEN` | Mapbox native SDK 다운로드를 위한 빌드 설정. `EXPO_PUBLIC_` 변수에 비밀 token을 넣지 않는다. |
| `APP_VARIANT` | 기본은 development이며 development bundle은 `com.noline.dev`, production은 `com.ham.noline`이다. OAuth 앱 등록도 대상과 맞아야 한다. |

클라이언트는 `@env`용 Babel 설정과 `process.env.EXPO_PUBLIC_*`를 함께 사용한다. 개발 파일을 바꿨는데 반영되지 않으면 Metro를 다시 시작하고, 필요한 경우 `pnpm client start --clear`로 캐시를 비운다. native key·plugin·bundle 설정 변경에는 개발 앱 재빌드가 필요하다.

### 서버 주소를 실행 대상에 맞춘다

| 실행 대상 | 클라이언트 API 주소 | 서버 측 준비 |
| --- | --- | --- |
| 같은 Mac의 iOS simulator | `http://localhost:3000` | 기본 `HOST=localhost` 사용 가능 |
| Android emulator | 호스트 Mac에 닿는 주소(일반적인 Android emulator는 `10.0.2.2`) | emulator에서 접근 가능한 서버 바인딩 확인 |
| 실제 기기 | `http://<Mac의 LAN IP>:3000` | `HOST=0.0.0.0` 또는 해당 LAN IP, 같은 네트워크와 방화벽 확인 |

실기기의 localhost는 Mac이 아니다. API 서버 주소와 Metro 연결 주소도 서로 다른 역할이다. 서버 기본 CORS origin은 `http://localhost:8081`이며 브라우저 실행을 확인한다면 실제 origin과 맞춘다. 주소만 바꿔 Android·실기기 로그인과 native 기능까지 확인됐다고 보지 않는다.

## 3. PostgreSQL과 새 로컬 DB

Docker가 준비되어 있는지 확인한 뒤 Compose를 시작한다.

```bash
docker info
docker compose -f apps/server/docker-compose.yml up -d
docker compose -f apps/server/docker-compose.yml ps
docker exec noline-postgres pg_isready -U postgres -d noline_dev
```

Compose는 `noline-postgres` 컨테이너, 호스트 포트 `5432`, DB `noline_dev`와 지속 volume을 사용한다. 위 `DATABASE_URL`은 이 로컬 기본값에 맞춘 예시다. 다른 PostgreSQL이 5432를 사용한다면 기존 프로세스와 DB의 용도를 확인하고 포트·접속값을 함께 정한다.

**빈 DB를 새로 준비한 경우** 현재 Drizzle schema를 적용한다.

```bash
pnpm server db:push
```

현재 schema는 users·refresh_tokens·trips·schedules·expenses를 포함한다. Compose 시작이나 재시작은 테이블을 생성하지 않는다. `db:push`는 대상 DB를 변경하므로 기존 데이터가 있는 DB에서 변경 내용을 보지 않고 승인하지 않는다. `db:generate`는 SQL 파일을 생성하는 명령이며 DB 적용 명령이 아니다.

현재 로그인은 Google/Apple OAuth이고 첫 로그인 때 서버가 사용자를 생성한다. 과거 `setup-dev-db.sql`의 하드코딩 테스트 유저는 현재 schema와 맞지 않으므로 실행하지 않는다. 기존 DB의 `time_zone` 열 추가 등은 [SQL별 적용 조건](apps/server/scripts/README.md)을 따른다. 기존 DB를 새 설치처럼 리셋하거나 SQL 파일을 순서 없이 모두 실행하지 않는다.

## 4. API 서버

새 터미널에서 실행한다.

```bash
pnpm server dev
```

서버 시작은 DB에 `SELECT 1`을 실행한 뒤 HTTP listener를 연다. 선택한 host 주소로 확인한다.

```bash
curl http://localhost:3000/api/health
```

정상 응답은 `status: "ok"`, `message: "Server is running"`, ISO timestamp를 포함한다. 이 endpoint는 요청마다 DB schema·OAuth·지도 API를 검사하지 않는다. DB 연결 성공도 모든 테이블이 최신이라는 뜻은 아니다.

## 5. iOS 개발 앱과 로그인

처음 빌드하거나 native 설정을 바꾼 경우:

```bash
pnpm client ios
```

Xcode simulator와 CocoaPods 환경이 준비돼 있어야 한다. CocoaPods의 인코딩 오류가 발생하면 현재 터미널의 UTF-8 locale을 확인한다. 설치 실패의 원인을 확인하기 전에 native 폴더나 의존성을 지우는 복구를 기본 단계로 실행하지 않는다.

이미 호환되는 개발 앱이 설치돼 있다면 Metro만 실행할 수 있다.

```bash
pnpm client start
```

서버와 Metro는 각각 별도 터미널에서 유지한다. 앱 화면에서 SQLite 준비가 끝나고 로그인 화면 또는 복원한 계정 화면에 진입하는지 확인한다. 로그인은 등록된 Google/Apple 설정을 사용하며 개발용 이메일·비밀번호 로그인이나 고정 유저 우회는 없다. Apple 로그인·Google callback의 simulator/실기기 성공은 대상 환경에서 별도로 확인해야 한다.

시작 완료를 확인할 때 다음 결과를 구별한다.

- 서버 health 응답과 DB 접속: 서버 시작의 확인.
- 앱의 실제 준비 완료 화면: native 앱과 로컬 준비의 확인.
- 로그인 후 실제 여행 API 응답과 앱 데이터: 인증·서버 연결의 확인.
- 활성 여행 준비 후 연결 차단·앱 재실행: 준비된 데이터·지도·경로의 오프라인 사용 확인.

로그만 확인했으면 실제 화면·로그인·오프라인 지도를 검증했다고 보고하지 않는다. 앱 시작·세션과 데이터 보존의 현재 계약은 [앱 실행 본문](context/project/current/app-runtime/INDEX.md)을 따른다.

## 다음 실행과 실패 확인

다음 실행은 기존 DB·서버·Metro·개발 앱을 먼저 확인하고 필요한 구성요소만 다시 켠다. DB가 계속 살아 있으면 매번 `db:push`나 SQL seed를 실행할 필요가 없다.

| 증상 | 먼저 확인할 것 |
| --- | --- |
| DB connection refused | Compose 상태·5432 충돌·DATABASE_URL. 새 컨테이너를 추가로 만들기 전에 기존 컨테이너를 확인한다. |
| relation/column 없음 | 대상 DB와 현재 schema. health 성공만으로 schema가 맞다고 판단하지 않는다. |
| client network error | 실행 대상에서 보이는 API origin, HOST 바인딩, 방화벽·네트워크. |
| OAuth 실패 | 선택 variant의 bundle·client ID·server audience·provider 등록. API key와 OAuth ID를 구별한다. |
| native module 없음 | Expo Go인지, 개발 앱이 현재 native 의존성·설정으로 빌드됐는지 확인한다. |
| `@env`/token 설정 미반영 | 정확한 변수명·개발 파일·Metro 재시작과 캐시. 비밀값 전체를 출력하지 않는다. |

## 코드 검사와 실제 실행의 범위

변경한 workspace에 맞춰 실행한다.

```bash
pnpm schema build
pnpm server typecheck
pnpm server build
pnpm client test:typecheck
pnpm client lint
pnpm harness:check
```

각 명령은 빌드·타입·lint·문서 연결 등 맡은 범위만 확인한다. native 빌드·DB 적용·OAuth·실제 기기 동작을 대신하지 않는다. client/server의 단위 테스트는 각 `test` 스크립트로 실행한다. `pnpm server test:integration`은 별도 PostgreSQL test DB(포트55432)를 생성·변경하고 마지막에 test volume을 제거하므로 단순 읽기 검사와 구별한다.

이 안내는 2026-10-31의 package scripts·Compose·env 소비 코드·Drizzle schema를 정적으로 대조한 결과다. 새 환경에서 설치·native 빌드·외부 서비스 접속을 실행해 성공을 보장하는 기록은 아니다. 설정·실행 스크립트 변경 책임자가 이 문서와 서버/SQL 안내를 함께 갱신한다.
