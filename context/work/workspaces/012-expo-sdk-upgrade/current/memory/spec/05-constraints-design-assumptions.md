# 제약·현재 설계·가정

## 지킬 제약

- **마감:** 2027년 4월(Apple 요건). 확정 구성의 일정은 3월 초에 1.3.0을 내는 것이다(아래 일정).
- **011이 먼저다:** 011(expo-updates, 1.1.4)을 SDK 51에서 먼저 끝낸다. 업그레이드 릴리스 뒤의 버그를 심사 없이 고치려면 OTA가 이미 운영에서 검증돼 있어야 하기 때문이다. 2026-11-17 현재 011의 Xcode 26 판단 지점은 `expo-dev-menu` patch로 통과해 OTA를 이 Work에 합칠 이유는 없어졌고, 1.1.4(빌드 18)는 main에 병합돼 심사 대기 중이다. 남은 조건은 심사 결과다.
- **SDK 51 핫픽스 빌드를 지킨다:** 업그레이드(1.2.0)가 출시되기 전까지는 1.1.x 스토어 핫픽스를 낼 수 있어야 한다. 1.2.0이 승인된 뒤에는 App Store 버전 규칙상 1.1.x를 낼 수 없다(Main의 지식, Apple 문서 재확인 전). 2026-11-17 사용자가 1.1.4 시점에서 `release/1.1` 브랜치를 만들어 핫픽스는 그쪽에서 내고, 업그레이드는 Ticket마다 main에 병합하기로 했다. EAS 빌드 설정(`eas.json` `base.node`·이미지)은 SDK를 올리는 단계 전에는 바꾸지 않는 것을 추천한다. SDK 51을 EAS에서 Node 24로 빌드해 본 적이 없다.
- **출시는 2번이다:** 1.2.0(SDK 54 + New Architecture)과 1.3.0(SDK 58·iOS 27), 그 사이 1주일 Sentry 관찰(2026-11-17 채택). 처음 고른 "단계마다 출시(심사 3번)"는 사용자가 줄이라고 해 바꿨다. 현재 앱 버전은 1.1.4(빌드 18)다.
- **SDK 54 Legacy 단계는 짧게 지난다:** SDK 54가 정한 reanimated 4.1.1은 New Architecture 전용이라, Legacy로 검증하는 동안은 유지보수가 끝난 3.19.x를 `expo.install.exclude`로 고정해야 한다.
- **확인 기기:** 실기기는 iPhone 14 Pro 1대(iOS 27.2.1로 해석), 나머지는 시뮬레이터다. 구형·iOS 16대 실기기는 없어 최소 iOS 16.4는 Xcode의 iOS 16.4 시뮬레이터로 확인한다(Main 기본값). 실기기 1대로 기존 사용자 업데이트를 확인하므로 02는 preview 번들 ID(`com.noline.dev`)로 한다(확정). 04·05에서도 preview 앱을 쓸지는 Main 기본값이다.
- **SDK는 한 버전씩 올린다:** Expo 권장에 따른다(2026-11-17 확정). 중간 SDK는 로컬 빌드, EAS preview 빌드는 Ticket 끝.
- **04는 멤버십·인증서 갱신 뒤:** 1.2.0 스토어 빌드 전에 멤버십(2026-12-18)과 인증서(2026-12-30)를 갱신해야 한다. 멤버십 갱신은 사용자가 직접 한다.
- **일정(확정 구성):** 11월 01·02, 12월 03, 인증서 갱신 뒤 1월 04(1.2.0), 2월 05, 3월 초 1.3.0. 4월 마감 전 여유를 둔 일정이다.
- **서버 배포는 client 의존성까지 설치한다:** Render 대시보드에 설정된 빌드 명령(`NODE_ENV=development pnpm install && …`)이 루트에서 `pnpm install`을 실행한다. 2026-11-18 확인으로 실제 서비스는 `render.yaml`이 아니라 대시보드 설정을 쓰고, Node는 `.nvmrc`로 정해진다(대시보드 `NODE_VERSION` > `.node-version` > `.nvmrc` > `engines` 순). client를 SDK 58로 올리기 전에 서버 Node가 SDK 58이 지원하는 버전이어야 서버 배포가 깨지지 않는다.
- **인증서:** 배포 인증서·프로비저닝 프로필이 2026-12-30에 만료되고, Apple Developer 멤버십 갱신은 2026-12-18이다. 이 Work의 스토어 빌드는 그 뒤가 될 가능성이 높아 갱신이 먼저다.
- **기존 릴리스 절차:** EAS production 빌드 → `eas submit` → App Store Connect 입력 → 심사. 2026-11-17부터 Project의 [앱 변경을 사용자에게 내보낼 때의 기준](../../../../../../project/guidance/app-release-and-ota.md)이 스토어 빌드 절차와 runtime(fingerprint) 조건을 소유한다. 업그레이드 빌드는 runtime이 바뀌므로 SDK 51 빌드로 가던 OTA를 받지 않는다.
- **설치 방식:** Expo가 고른 버전만 넣는다. `pnpm add`로 npm 최신을 받은 것이 반복된 버전 혼선의 공통 원인이었다. 절차는 `apps/client`에서 `pnpm exec expo install <패키지>`다(2026-11-18 Ticket 01에서 확정). `npx expo install`은 npx(npm 11)가 프로젝트 `.npmrc` 값을 `npm_config_public_hoist_pattern=*` 환경변수로 넘겨 내부 `pnpm add`가 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패한다(Work 011의 실패 원인). 설치 명령을 `npx`로 감싸면 같은 이유로 pnpm이 `node_modules` 전체 재설치를 물을 수 있어 쓰지 않는다. 확인은 `CI=1` 비대화형 실행으로 했다. 근거는 [Ticket 01 진행 기록](../../../records/2026-11-18-02-ticket01-baseline-node24-and-expo-install.md#npx-expo-install-실패의-원인)에 있다.
- **로컬 도구는 Node 버전 폴더마다 따로 있다:** nvm은 Node마다 전역 도구를 따로 둔다. 2026-11-17에는 pnpm 9.6.0과 eas-cli가 Node v20.18.1 폴더에만 있었고, 2026-11-18 Ticket 01에서 Node 24.16.0 폴더에도 `npm i -g pnpm@9.6.0 eas-cli@16.28.0`으로 설치했다. 그 방법은 `START_GUIDE.md`(커밋 `7413b343`, main 반영)에 적었다. 새 Node로 바꿀 때마다 같은 준비가 필요하다.

## 버전: 현재와 이후 (2026-11-17)

2026-11-17 Main이 저장소 전체의 버전 설정을 조사했다(근거와 판단은 [전수 조사 기록](../../../records/2026-11-17-01-version-inventory-and-server-scope.md)). 아래 "현재"는 그날의 설정·lockfile 값이다. "이후"는 대상 SDK 58과 Node 24를 전제로 한 목표다. 서버를 Node와 도구까지 넣은 범위, SDK 58, 최소 iOS 16.4는 사용자가 정했다. Node 24와 출시 2번은 사용자가 승인한 계획에 들어 있다. SDK 54·58의 라이브러리별 목표 버전과 함께 움직이는 묶음은 [라이브러리 호환 조사](../../../source/library-compatibility-2026-11-17.md)에 있고, 실제 설치는 `npx expo install`이 정한다.

구분의 뜻은 다음과 같다.
- **필수:** 2027-04 Apple 마감이나 Node 지원 종료 때문에 반드시 바꾼다.
- **연동:** 필수 항목을 바꾸면 따라 바뀐다.
- **정리:** 하면 좋지만 미룰 수 있다. 012에 넣을지 아직 정하지 않았다.

### Node와 도구 (앱·서버 공통)

| 요소 | 현재 | 이후 | 구분 |
| --- | --- | --- | --- |
| `.nvmrc` | 20.18.1 | 24.x | 필수 |
| `render.yaml` `NODE_VERSION` | 20 | 파일 삭제(2026-11-18). 어떤 Render 서비스·Blueprint에도 연결되지 않은 파일이었다. 운영 서버의 Node는 `.nvmrc`가 정한다 | 정리됨 |
| `eas.json` `base.node` (앱 클라우드 빌드) | 20.18.1 | 24.x, SDK를 올리는 첫 단계에서 | 필수 |
| `nixpacks.toml`·`railway.json` (Railway) | `nodejs_20` | 삭제(2026-11-18 사용자가 Railway 미사용 확인) | 정리 |
| 로컬 실제 실행 | v24.16.0 | 24.x | — |
| `@types/node` (root·server·ui) | ^20 | ^24 | 연동 |
| `START_GUIDE.md`의 Node 안내 | "Node.js 20" | 24 | 연동 |
| `engines` 필드 | 없음 | `"node": ">=24"` | 정리 |
| pnpm (`packageManager`, `eas.json`) | 9.6.0 | 유지 | — |
| eas-cli | 로컬 16.28.0, `eas.json` 요구 `>= 5.0.0` | 최신과 요구 버전 상향 | 연동 |

Node가 네 곳에 따로 적혀 있고 로컬만 24로 돌고 있었다. 어긋나도 막는 장치(`engines`)가 없다.

2026-11-18 Ticket 01이 브랜치 `chore/012-node24`에서 `.nvmrc`(24.16.0)·`render.yaml`(24)·`@types/node`(^24.19.2)와 표에 없던 `apps/server/tsup.config.ts` target(`node20` → `node24`)을 바꿨다. `7413b343`으로 커밋해 main(`c60224ee`)에 병합·push했고, Render가 Node 24.16.0으로 배포했다. 뒤에 `render.yaml`은 실제 배포에 쓰이지 않는 파일이라 지웠다([삭제 기록](../../../records/2026-11-18-05-render-yaml-removal.md)). 위 "현재" 열은 2026-11-17 조사 값이다. 같은 브랜치에서 사용자의 "안 써, 지워"에 따라 `nixpacks.toml`·`railway.json`도 삭제했다. `eas.json`은 03, `engines`는 03이다. 현재 상태는 [Ticket 01](../tickets/01-preparation-baseline-and-node24.md#현재-상태와-실제-결과)에 있다. eas-cli는 2026-11-02 세션에서도 27.x 상향을 권했지만 그대로다.

### iOS 빌드

| 요소 | 현재 | 이후 | 구분 |
| --- | --- | --- | --- |
| EAS iOS 이미지 | `macos-sequoia-15.6-xcode-26.2` 고정 | Xcode 27 이미지 | 필수 |
| 앱 시작 구조 | AppDelegate만 | SceneDelegate(SDK 58 prebuild가 생성) | 필수 |
| 최소 iOS | 15.0(011이 1.1.4에 넣음) | 16.4(2026-11-17 수용) | 연동 |
| `expo-dev-menu@5.0.23` pnpm patch | 있음(011의 Xcode 26 대응) | 삭제 | 연동 |

이미지는 2026-11-02 `latest`(Xcode 27.1 RC)에서 Pod 배포 대상 13.4 때문에 실패해 고정했다(`f3007396`).

### 앱의 기반 버전

| 요소 | 현재 | 이후 | 구분 |
| --- | --- | --- | --- |
| 앱 버전 / 빌드 번호 | 1.1.4 / 18 | 1.2.0, 1.3.0 | — |
| Expo SDK | 51.0.39 | 58 | 필수 |
| React Native | 0.74.5 | 0.88 | 필수 |
| React | 18.3.1 | 19.3.0 | 연동 |
| New Architecture | `newArchEnabled: false` | 켜짐(SDK 55부터 끌 수 없음) | 필수 |
| TypeScript | 선언 client `~5.3.3`·ui `^5.5.3`·root `^5.5.4`, 실제 5.9.3 | 한 버전으로 통일 | 연동(RN 0.87부터 Strict TypeScript API 기본) |

### client 라이브러리

★는 위험이 커서 미리 조사할 대상이다. 위험의 이유는 [동작과 사례](02-behavior-and-cases.md)에 있다. SDK 54(Legacy 단계·New Architecture 단계)와 SDK 58의 목표 버전, 근거와 미확인은 [라이브러리 호환 조사](../../../source/library-compatibility-2026-11-17.md)가 맡는다. 아래는 그 요약이다.

| 라이브러리 | 현재(실제 설치) | 확인할 점 |
| --- | --- | --- |
| ★ @rnmapbox/maps | 10.1.33 | Legacy 10.1.4x(native v10) → New Arch 10.3.x(native v11) → ≥10.3.10. 오프라인 pack이 v11에서 남는지 미확인 |
| ★ expo-sqlite / drizzle-orm | 14.0.6 / 0.30.10 | 16 → 58, drizzle ≥0.36.2(0.30의 타입이 사라진 `expo-sqlite/next`를 참조). DB 파일 경로 유지 미확인 |
| ★ expo-router | 3.5.24 | 사용 파일 21개, SDK 58의 navigation core 재작성 |
| ★ reanimated / nativewind | 3.10.1 / 4.2.1 | reanimated Legacy 3.19.x → New Arch 4.1.1 + worklets → 4.7.1. nativewind ≥4.2.2, SDK 58 지원 미확인 |
| ★ react-native-maps | 1.14.0 | 1.20.1 → 1.29.11(1.21부터 Legacy 미지원) |
| @sentry/react-native | 6.22.0 | 소스맵 업로드 절차 |
| expo-updates | 0.25.28 | 새 빌드에서 OTA 재확인 |
| expo-dev-client | 4.0.29 | 011이 SDK 51용으로 정렬함 |
| splash-screen·safe-area-context·screens·svg·netinfo·@types/react | SDK 54용이 섞여 있음 | 업그레이드하면서 정리 |
| jest / jest-expo | 29.7 / 51.0.4 | SDK에 맞춤 |

### 공유 패키지와 저장소 설정

| 요소 | 현재 | 이후 | 구분 |
| --- | --- | --- | --- |
| root `dependencies.react` | ^18.2.0 | 삭제 | 연동 |
| `packages/ui`의 react / react-native / reanimated (일반 의존성으로 고정) | 18.3.1 / 0.74.5 / ~3.10 | client와 같은 버전 | 연동 |
| `packages/eslint-config` devDependencies의 react | 18.2.0 | 19.3.0 또는 삭제 | 연동 |
| ESLint / @typescript-eslint | 8 / 7 | 9 이상(flat config) | 정리 |
| `@repo/schema` (zod 3, tsup) | — | 유지, Node 24에서 빌드되는지만 확인 | — |

root의 react 선언은 반드시 정리한다. `.npmrc`가 `node-linker=hoisted`라 패키지를 루트 `node_modules`로 끌어올리므로, 남겨 두면 React 18과 19가 함께 설치될 수 있다.

### server

서버는 Node와 그에 따른 도구까지만 이 Work에서 바꾼다. 라이브러리는 유지하고 따로 판단한다.

| 요소 | 현재 | 이후 | 구분 |
| --- | --- | --- | --- |
| Node (Render) | 20 | 24 | 필수 |
| tsx·tsup·vitest·drizzle-kit 0.20.18 | 현재 버전 | 유지, Node 24에서 동작 확인 | 연동 |
| express | 4.21.2 | 유지(5는 따로 판단) | 범위 밖 |
| drizzle-orm | 0.29.5(client는 0.30.10) | 유지(client와 맞출지 따로 판단) | 범위 밖 |
| zod | 3.25.76 | 유지(schema로 client와 공유하므로 함께 판단) | 범위 밖 |
| @sentry/node | 10.78.0 | 유지 | — |
| PostgreSQL | 로컬 docker `postgres:14-alpine` | Render 실제 버전 확인 뒤 따로 판단 | 범위 밖 |

### 2026-11-16 `expo install --check`의 어긋남

`npx expo install --check`(SDK 51 기준)가 2026-11-16에 어긋난 패키지 10개를 냈다. 성격이 다르므로 섞어서 되돌리지 않는다. 이 가운데 dev-client는 011이 정렬해 이제 어긋나지 않는다. 나머지는 업그레이드에서 어차피 바뀌므로 SDK 51에서 따로 정리하지 않는다.

| 구분 | 패키지(당시 → SDK 51 기대) | 이유 |
| --- | --- | --- |
| 일부러 벗어남 | `@sentry/react-native` 6.22.0 → ~5.24.3 | 5.24.3의 Sentry Cocoa가 Xcode 26.5에서 컴파일되지 않음(Work 007) |
| 일부러 벗어남 | `react`·`react-dom` 18.3.1 → 18.2.0 | 2025-10 expo-router 빌드 실패를 고치려 맞춤(`80ee0751`) |
| 섞여 들어옴(011에서 정렬함) | `expo-dev-client` 6.0.20 → ~4.0.29 | SDK 54 세대. expo-updates와 충돌(Work 011) |
| 섞여 들어옴 | `expo-splash-screen` 31.0.10 → ~0.27.7 | SDK 54 세대 |
| 섞여 들어옴 | `react-native-safe-area-context` 5.6.1 → 4.10.5, `react-native-screens` 3.37.0 → 3.31.1, `react-native-svg` 15.14.0 → 15.2.0, `@react-native-community/netinfo` 11.4.1 → 11.3.1, `@types/react` 18.3.26 → ~18.2.79 | 근거 기록 없음 |

## 진행 순서

2026-11-17 채택한 개발 순서다. 단계를 하나씩 preview로 검증하되 SDK 54 + New Architecture를 묶어 1.2.0, SDK 58을 1.3.0으로 출시한다. Node 24는 승인한 Ticket 표(서버·로컬 01, EAS 03)에 들어 있다. 이 순서를 Ticket으로 나눈 안은 [Ticket 색인](../tickets/index.md)에 있다.

1. **서버와 로컬 Node를 24로.** Expo와 무관해 지금 할 수 있고 로컬은 이미 24라 위험이 작다. 서버 test·integration·typecheck·build와 Render 배포로 확인한다.
2. **EAS 빌드 Node 24는 SDK를 올리는 첫 단계와 함께.** SDK 51 핫픽스 빌드를 검증되지 않은 조합에 걸지 않기 위해서다.
3. **데이터 보존 선검증.** 구현 전에 검증용 최소 앱으로 기기 DB와 오프라인 지도가 남는지 판정한다(Ticket 02). DB가 남지 않으면 여기서 멈춘다.
4. **SDK 51 → 52 → 53 → 54(Legacy) → New Architecture(1.2.0) → 55 → 56 → 57 → 58(1.3.0).** 버전 상향과 아키텍처 전환의 위험을 나누고 SDK는 한 버전씩 올려, 깨졌을 때 원인을 좁힌다. 05는 테스트 도구를 먼저 옮기고(02에서 가능하다고 나오면) 58 단계에서 Xcode 27 이미지로 바꾼다.

목표 Node를 24로 고른 이유: 22는 2027-04-30에 지원이 끝나고, 26은 지원이 더 길지만(2029-04-30) 오래된 도구가 깨질 위험이 더 크다고 보았다. 24는 2028-04-30까지이고 로컬에서 이미 운용한 근거가 있다.

## 가정과 확인하지 못한 것

- SDK 51 앱을 EAS에서 Node 24로 빌드할 수 있는지 확인하지 않았다.
- 서버의 Node 24 검사는 2026-11-18 로컬에서 확인했다. typecheck·build(tsup)·test(vitest)·integration(drizzle-kit 0.20.18 `push:pg` 포함)이 Node 20과 같은 결과로 통과했다. Render 배포는 2026-11-18 Node 24.16.0으로 빌드·Live·health 200을 확인했다. `tsx`(dev 서버)의 Node 24 동작은 확인하지 않았다. Node 26에서 오래된 도구가 더 깨지기 쉽다는 것은 시험하지 않은 판단이다.
- Render의 실제 PostgreSQL 버전은 확인하지 않았다. Railway는 2026-11-18 사용자가 쓰지 않는다고 확인해 설정 파일을 지웠다(2025-12-30 추가, Render 설정은 2026-02-01). PostgreSQL 14의 지원 종료 시점은 Main이 출처 없이 말한 것이다.
- root `package.json`에 react가 왜 있는지 확인하지 못했다.
- SDK 51 / RN 0.74로 iOS 27 SDK 빌드를 맞추는 것은 사실상 어렵다고 판단했다. 배포 대상은 고칠 수 있지만(011이 15.0으로 올렸다) UIScene 전환은 네이티브 패치가 필요하다. 실제로 시도하지는 않았다.
- 2026-11-17 [호환 조사](../../../source/library-compatibility-2026-11-17.md)에서도 확인하지 못한 것: Mapbox v10 오프라인 pack의 v11 보존, expo-sqlite 상향 뒤 DB 파일 경로, nativewind의 SDK 58 지원, @rn-primitives·react-native-calendars의 React 19·New Architecture 공식 지원. 앞의 둘은 Ticket 02에서 실기기로 판정한다. SDK 55–57 건너뛰기는 Expo가 한 버전씩 권장해 건너뛰지 않기로 했다.
- iOS 15.x–16.3 사용자 수는 확인하지 않고 최소 iOS 16.4를 수용했다.
- 이미 설치된 SDK 51 빌드가 iOS 27 기기에서 그대로 동작한다는 것은 Apple 문서 해석이고 실기기로 확인하지 않았다. iOS 27.2.1 iPhone 14 Pro로 확인할 수 있게 됐고, Ticket 01의 1.1.4 점검이 그 근거가 된다.
- Expo가 Xcode 26.2 이미지를 언제까지 제공할지는 문서에 명시가 없다.
