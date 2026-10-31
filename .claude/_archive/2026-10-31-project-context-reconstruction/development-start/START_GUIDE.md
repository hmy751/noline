# 🚀 Noline 개발 환경 시작 가이드

> 처음 프로젝트를 클론한 개발자를 위한 단계별 설정 가이드

---

## 📋 사전 요구사항

### 필수 설치 항목

| 도구           | 버전             | 설치 확인 명령어      |
| -------------- | ---------------- | --------------------- |
| Node.js        | 20+ (LTS 권장)   | `node -v`             |
| pnpm           | 8+               | `pnpm -v`             |
| Docker Desktop | 최신             | `docker -v`           |
| Xcode          | 15+ (iOS 빌드용) | `xcodebuild -version` |
| CocoaPods      | 1.14+            | `pod --version`       |

### 필요한 API 키 및 토큰

아래 서비스에서 API 키/토큰을 미리 발급받아야 합니다:

| 서비스       | 용도                | 환경 변수                                 | 위치   | 발급 링크                                                 |
| ------------ | ------------------- | ----------------------------------------- | ------ | --------------------------------------------------------- |
| Mapbox       | 지도 및 오프라인 맵 | `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`         | Client | [Mapbox Account](https://account.mapbox.com/)             |
| Google Cloud | Places API          | `GOOGLE_PLACES_API_KEY`                   | Server | [Google Cloud Console](https://console.cloud.google.com/) |
| Google Cloud | Directions API      | `GOOGLE_GEO_DIRECTIONS_API_KEY`           | Server | [Google Cloud Console](https://console.cloud.google.com/) |
| Google Cloud | Maps SDK (iOS)      | `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY`     | Client | [Google Cloud Console](https://console.cloud.google.com/) |
| Google Cloud | Maps SDK (Android)  | `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` | Client | [Google Cloud Console](https://console.cloud.google.com/) |
| GeoNames     | 지역 정보 조회      | `GEONAMES_USERNAME`                       | Client | [GeoNames](https://www.geonames.org/login)                |

### 환경 변수 파일 예시

<details>
<summary><strong>apps/server/.env.development</strong></summary>

```env
NODE_ENV=development
PORT=3000
HOST=192.168.0.10
DATABASE_URL=postgresql://postgres:password@localhost:5432/noline_dev
JWT_SECRET=dev-secret-key-not-for-production
JWT_ISSUER=noline-api
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://192.168.0.10
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_GEO_DIRECTIONS_API_KEY=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
```

</details>

<details>
<summary><strong>apps/client/.env.development</strong></summary>

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000
GEONAMES_API_URL=https://secure.geonames.org
GEONAMES_USERNAME=your_geonames_username
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
APP_VARIANT=development
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=sk.eyJ1Ijoixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

</details>

> **Note**: `192.168.0.10`은 예시입니다. 실제 로컬 IP로 교체하세요.
>
> ```bash
> ifconfig | grep "inet " | grep -v 127.0.0.1
> ```

---

## 🔧 설정 단계

### Step 1: 의존성 설치

```bash
pnpm install
```

### Step 2: @repo/schema 빌드

공유 스키마 패키지를 먼저 빌드해야 합니다:

```bash
pnpm --filter @repo/schema build
```

성공 시 출력:

```
CLI Building entry: src/index.ts
CLI tsup v8.4.0
ESM Build start
ESM dist/index.js 29.78 KB
ESM ⚡️ Build success in 47ms
DTS Build start
DTS ⚡️ Build success in 1874ms
DTS dist/index.d.ts 18.19 KB
```

### Step 3: 환경 변수 설정

서버와 클라이언트 실행 전에 환경 변수 파일을 먼저 생성해야 합니다.

> **Tip**: `<YOUR_LOCAL_IP>` 확인 방법
>
> ```bash
> ifconfig | grep "inet " | grep -v 127.0.0.1
> ```

#### Server 환경 변수

`apps/server/.env.development` 파일 생성:

```env
NODE_ENV=development
PORT=3000
HOST=<YOUR_LOCAL_IP>
DATABASE_URL=postgresql://postgres:password@localhost:5432/noline_dev
JWT_SECRET=dev-secret-key-not-for-production
JWT_ISSUER=noline-api
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://<YOUR_LOCAL_IP>
GOOGLE_PLACES_API_KEY=<YOUR_GOOGLE_PLACES_API_KEY>
GOOGLE_GEO_DIRECTIONS_API_KEY=<YOUR_GOOGLE_DIRECTIONS_API_KEY>
```

#### Client 환경 변수

`apps/client/.env.development` 파일 생성:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3000
GEONAMES_API_URL=https://secure.geonames.org
GEONAMES_USERNAME=<YOUR_GEONAMES_USERNAME>
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=<YOUR_GOOGLE_MAPS_IOS_KEY>
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=<YOUR_GOOGLE_MAPS_ANDROID_KEY>
APP_VARIANT=development
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=<YOUR_MAPBOX_TOKEN>
```

### Step 4: Docker로 PostgreSQL 실행

Docker Desktop이 실행 중이어야 합니다.

```bash
# Docker Desktop 실행 (macOS)
open -a Docker
```

> ⏳ Docker Desktop이 완전히 시작될 때까지 잠시 대기하세요 (메뉴바 아이콘 확인)

Docker 상태 확인:

```bash
docker info
```

<details>
<summary>❌ <code>Cannot connect to the Docker daemon</code> 오류 발생 시</summary>

Docker Desktop이 아직 시작되지 않은 것입니다.

1. 메뉴바에서 Docker 아이콘이 활성화될 때까지 대기
2. `docker info` 명령이 성공할 때까지 재시도

</details>

PostgreSQL 컨테이너 시작:

```bash
cd apps/server
docker-compose up -d
```

성공 확인:

```bash
docker ps
# CONTAINER ID   IMAGE              ...   NAMES
# xxxx           postgres:14-alpine       noline-postgres
```

### Step 5: DB 스키마 및 테스트 유저 설정

#### 5-1. DB 스키마 푸시

```bash
cd apps/server
pnpm db:push
```

성공 시 테이블들이 생성됩니다 (users, trips, schedules, expenses).

#### 5-2. 테스트 유저 생성

앱에서 사용하는 하드코딩된 테스트 유저를 DB에 추가합니다:

```bash
docker exec -i noline-postgres psql -U postgres -d noline_dev < scripts/setup-dev-db.sql
```

성공 시 출력:

```
ALTER TABLE
INSERT 0 1
        status
------------------------------------
 Development database setup completed!
```

> 이미 테스트 유저가 있으면 `INSERT 0 0`으로 표시되지만 정상입니다.

> **Note**: 테스트 유저 ID `01HZQ8K9X7M2N3P4Q5R6S7T8V9`는 클라이언트/서버 코드에 하드코딩되어 있습니다.

### Step 6: Server 실행

```bash
cd apps/server
pnpm dev
```

성공 시 출력:

```
📄 Loading environment from: .env.development
🔍 Testing database connection...
✅ Database connected successfully
🚀 Server started successfully
📍 Environment: development
🌐 Server running at http://<YOUR_LOCAL_IP>:3000
🔗 API endpoint: http://<YOUR_LOCAL_IP>:3000/api
❤️  Health check: http://<YOUR_LOCAL_IP>:3000/api/health
```

<details>
<summary>❌ <code>Error: connect ECONNREFUSED 127.0.0.1:5432</code> 오류 발생 시</summary>

PostgreSQL Docker 컨테이너가 실행 중이 아닙니다.

```bash
docker ps  # 컨테이너 확인
cd apps/server && docker-compose up -d  # 재시작
```

</details>

Health Check 확인 (새 터미널에서):

```bash
curl http://<YOUR_LOCAL_IP>:3000/api/health
# {"status":"ok","timestamp":"..."}
```

### Step 7: Client 빌드 및 실행 (iOS)

⚠️ **중요**: Mapbox는 네이티브 모듈이므로 `expo start`만으로는 동작하지 않습니다!

#### 7-1. CocoaPods UTF-8 환경 설정 (필수!)

iOS 빌드 전에 UTF-8 인코딩 설정이 필요합니다. 설정하지 않으면 CocoaPods에서 인코딩 오류가 발생합니다.

쉘 설정 파일에 다음을 추가하세요:

```bash
# ~/.zshrc 또는 ~/.bashrc에 추가
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

설정 적용:

```bash
source ~/.zshrc  # 또는 터미널 재시작
```

#### 7-2. iOS 빌드 실행

```bash
cd apps/client
pnpm run ios
# 또는 직접 실행
npx expo run:ios
```

**처음 빌드 시**:

- iOS 네이티브 빌드가 진행됩니다 (5-10분 소요)
- CocoaPods 의존성 자동 설치
- Xcode 시뮬레이터가 자동으로 실행됩니다

<details>
<summary>❌ <code>Unicode Normalization not appropriate for ASCII-8BIT</code> 오류 발생 시</summary>

CocoaPods UTF-8 설정이 적용되지 않은 것입니다.

```bash
# 현재 세션에 즉시 적용
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# pod 재설치
cd apps/client/ios
pod install --repo-update

# 다시 빌드
cd ..
npx expo run:ios
```

</details>

<details>
<summary>❌ <code>Unable to resolve module @env</code> 오류 발생 시</summary>

`.env.development` 파일이 없거나 Metro 캐시 문제입니다.

1. `apps/client/.env.development` 파일 존재 확인
2. Metro 캐시 클리어: `npx expo start --clear`

</details>

<details>
<summary>❌ <code>Mapbox access token is not set</code> 오류 발생 시</summary>

`apps/client/.env.development`에 `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` 설정 확인

</details>

**이후 실행 시**:

- 이미 빌드된 앱이 있다면 `expo start`로 Metro만 실행 가능
- 네이티브 코드 변경 시에만 `expo run:ios` 재실행 필요

---

## 📁 프로젝트 구조 요약

```
noline/
├── apps/
│   ├── client/                    # React Native (Expo) 앱
│   │   ├── .env.development       # 클라이언트 환경 변수
│   │   └── ios/                   # iOS 네이티브 빌드 (자동 생성)
│   └── server/                    # Express API 서버
│       ├── .env.development       # 서버 환경 변수
│       └── docker-compose.yml     # PostgreSQL 설정
├── packages/
│   ├── schema/                    # 공유 Zod 스키마 (빌드 필수!)
│   └── ui/                        # 공유 UI 컴포넌트
└── pnpm-workspace.yaml            # 모노레포 설정
```

---

## ✅ 체크리스트

- [ ] Node.js 20+ 설치됨
- [ ] pnpm 설치됨
- [ ] Docker Desktop 설치됨
- [ ] Xcode 설치됨 (iOS 빌드용)
- [ ] CocoaPods 설치됨
- [ ] `pnpm install` 완료
- [ ] `@repo/schema` 빌드 완료
- [ ] Docker Desktop 실행 중
- [ ] PostgreSQL 컨테이너 실행 중
- [ ] `apps/server/.env.development` 생성됨
- [ ] `apps/client/.env.development` 생성됨
- [ ] Server health check 통과
- [ ] 쉘 UTF-8 환경 변수 설정됨
- [ ] Client iOS 빌드 및 시뮬레이터 실행 성공
