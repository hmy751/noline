# 동작과 구별해야 할 사례

업그레이드는 새 동작을 만들지 않는다. 사용자가 보는 동작은 그대로 두고 그 아래의 플랫폼을 바꾼다. 그래서 이 문서는 "무엇이 그대로여야 하는가"와 "어디가 깨지기 쉬운가"를 구별한다. 라이브러리별 상세 대응은 버전 논의 뒤에 채운다.

## 그대로여야 하는 동작

- 네트워크가 없어도 앱이 열리고, 활성 여행은 기기 SQLite에서 조회·변경된다.
- 기존 사용자가 스토어 업데이트로 새 빌드를 받아도 기기 DB와 미전송 `sync_queue`가 보존되고, 로그인 상태가 유지된다.
- 준비해 둔 오프라인 지도 pack과 저장 경로가 계속 표시된다.
- 011이 넣은 OTA가 새 빌드에서도 업데이트를 받고, 업데이트를 기다리지 않고 시작한다.
- 서버의 Node를 올린 뒤에도 Render 배포가 성공하고 앱이 쓰는 API·동기화가 그대로 동작한다. 서버 배포는 루트에서 client 의존성까지 설치하므로, client의 SDK 상향 단계마다 서버 배포도 깨지지 않아야 한다.

## 깨지기 쉬운 영역 (2026-11-16·17 관찰, 확정 아님)

| 영역 | 왜 위험한가 | 근거 |
| --- | --- | --- |
| Mapbox (`@rnmapbox/maps`) | 2025-11에 New Architecture에서 문제가 나 10.2.6 → 10.1.33으로 내리고 `newArchEnabled: false`로 껐다. SDK 55부터는 끌 수 없다. 10.2.0이 기본 native SDK를 Mapbox v11로 바꿨고(10.2.6 실패의 유력한 원인) 10.3.0은 v10과 Legacy를 버린다. New Architecture 단계에서 native v11로 바뀌며, v10에서 받은 오프라인 pack이 남는지 미확인이다 | 커밋 `7ed7ac54`, 2026-11-17 호환 조사 |
| 기기 DB (`expo-sqlite`·`drizzle-orm`) | 사용자 데이터가 있는 기기에서 업데이트된다. 2025-10에 SDK 54용 expo-sqlite 16을 14로 내린 이력이 있다. drizzle Expo adapter의 transaction 동작도 Work 007에서 문제가 됐다. 1.2.0에서 14→16으로 오르며, DB 파일 경로가 그대로인지 미확인이다. drizzle 0.30의 타입은 16에서 사라진 `expo-sqlite/next`를 참조해 ≥0.36.2가 필요하다 | 커밋 `ffa7069f`, Work 007 기록 |
| 네비게이션 (`expo-router`) | 3.5에서 여러 메이저를 건너뛴다. 사용 파일 21개. SDK 58에서 navigation core가 다시 짜였다 | 2026-11-16 grep, SDK 58 changelog |
| 스타일·애니메이션 (nativewind 4, reanimated 3) | reanimated 4는 New Architecture 전용이고 worklets가 필요하다. nativewind(css-interop)가 reanimated에 의존해 2025-10에 지웠다가 다시 넣었다. 그때 원인은 `packages/ui`와 client가 다른 버전을 고정한 것이었다. nativewind의 SDK 58 지원은 미확인이다. tailwind-merge 3은 Tailwind 4 전용인데 지금 Tailwind 3과 쓰고 있다. 직접 사용처는 `MyLocationButton`과 babel plugin이다 | 커밋 `4995f0d5`·`11f9c997`, 2026-11-17 호환 조사 |
| 앱 시작 (`AppDelegate`, splash) | iOS 27 SDK는 UIScene 생명주기를 요구한다. splash-screen은 지금도 SDK 54용이 섞여 있다 | Apple TN3187, `expo install --check` |
| Sentry | Xcode 26에서 SDK 51 기대 버전이 컴파일되지 않아 6.22로 올렸다. 소스맵 업로드 절차는 미확인이다 | Work 007 기록 2026-11-09 |
| 의존성 중복 (React) | `node-linker=hoisted`인데 root `package.json`에 react `^18.2.0`이 있고 `packages/ui`·eslint-config도 react를 따로 선언한다. 정리하지 않으면 React 18과 19가 함께 설치될 수 있다 | 2026-11-17 설정 조사 |
| 테스트 도구 | SDK 58 단계에서 RNTL 14(`render`·`fireEvent`·`act` 비동기, `UNSAFE_*` 제거), jest 30, TS 6(`strict` 기본)이 함께 바뀐다. 테스트 파일 약 78개에 닿는다 | 2026-11-17 호환 조사 |
| 서버 배포 | Render가 루트 `pnpm install`로 client 의존성까지 설치한다. 서버 Node가 20이면 SDK 58 의존성 설치에서 깨질 수 있다. drizzle-kit 0.20 등 오래된 도구의 새 Node 동작은 미확인이다 | `render.yaml`, 2026-11-17 조사 |

사용 파일 수는 `apps/client/src`·`app`과 `packages/ui/src`에서 import를 센 값이다(expo-router 21, drizzle-orm 28, @rnmapbox/maps 8, react-native-maps 4, expo-sqlite 1).
