# 버전 이력 원문 발췌

2026-11-16 Work를 만들 때 Main이 모은 원자료의 최소 발췌다. 해석은 [분석 기록](../records/2026-11-16-01-separation-from-011-and-version-analysis.md)과 current가 맡고, 여기에는 원문과 출처만 둔다.

## 버전을 바꾼 커밋

`git log`의 제목과 `apps/client/package.json`·`app.config.js` 변경 줄이다(main, 2026-11-16 확인).

| 커밋 · 날짜 | 제목 | 변경 |
| --- | --- | --- |
| `f8b2659d` 2025-10-11 | refactor: client, react 관련 패키지 버전 수정 | `react-native` 0.74.3 → 0.74.5, `@types/react` ~19.1.0 → ^18.2.79, 루트 pnpm overrides 제거 |
| `80ee0751` 2025-10-23 | fix: apps/client, repo/ui, react 버전 문제로 expo-router 빌드 실패 이슈 수정 | `react` 18.2.0 → 18.3.1, `expo-router` ^3.5.24 → ~3.5.24 |
| `ffa7069f` 2025-10-24 | fix: apps/client, expo-sql 버전 호환성 및 config 설정 오류 수정 | `expo-sqlite` ^16.0.8 → ^14.0.6, `drizzle-orm` ^0.29.3 → ^0.30.10 |
| `7ed7ac54` 2025-11-07 | fix: apps/client, rnmapbox 라이브리리 버전과 최신 아키텍쳐 문제로 버전 다운그레이드 | `newArchEnabled: true` → `false`, `@rnmapbox/maps` ^10.2.6 → ^10.1.33 |
| `9f45f931` 2025-12-30 | chore:(client): expo-dev-client 라이브러리 설치 | `expo-dev-client` ^6.0.20 추가 |
| `8a9b0243` 2026-01-16 | fix(client): EXPO SDK(51) 버전 불일치로 크래시 에러 수정하기 위한, expo-asset 버전 변경 및 buildNumber 수정 | `expo-asset` ^12.0.12 → ~10.0.10 |
| `f3007396` 2026-11-02 | chore(client): EAS iOS 빌드 이미지를 Xcode 26.2로 고정 | 본문: "latest가 Xcode 27.1 RC를 가리켜 Pod 배포 대상(13.4) 검사에서 빌드가 실패했다. Apple의 Xcode 26 이상 요구를 지키는 이미지로 고정한다." |

Sentry SDK 변경(5.24.3 시도 → 6.22.0)은 Work 007의 [2026-11-09 기록](../../007-sync-failure-recovery/records/2026-11-09-01-sentry-local-receiver.md)에 원문이 있다.

## 2026-11-02 SDK 업그레이드를 미룬 대화

세션 "🔄개발 코드 검토 및 빌드 배포 준비"의 원문 `/Users/hammyeong-yeon/.claude/projects/-Users-hammyeong-yeon-Desktop-10-work-noline/a3669485-d435-43dd-9b82-a2891a7e403e.jsonl`이다. 이 기기 안에서만 접근할 수 있고, 한 행이 길어 스크립트로 뽑아 읽는다.

- 1004행, 사용자: "근데 latest로 올리면 문제가 잇을까?"
- 1008행, Main(발췌): "**근본 해법은 Expo SDK를 올리는 것입니다.** … 다만 RN 버전, `@rnmapbox/maps`, `expo-router` 등을 함께 올려야 해서 작은 작업이 아닙니다. 이번 배포를 끝낸 뒤 별도 작업으로 정하는 것을 권합니다."
- 1014행, 사용자: "그래 일단 니 추천대로 해봐"
- 1021행, Main: "**SDK 업그레이드**: 이번 배포가 끝난 뒤 별도 작업으로 정합니다. 지금은 건드리지 않습니다."
- 1500행, Main(1.1.0 TestFlight 확인 뒤 남은 것 목록): "**Expo SDK 업그레이드**: 이번 배포가 끝나서 별도 작업으로 정할 시점입니다."

같은 세션 1008행은 `latest`의 실패 원인을 "Xcode 27은 최소 배포 버전을 15.0으로 올려서 모든 Pod를 거부했습니다"로 설명한다.

## 2026-11-16 이 Work를 만든 대화

세션 원문 `/Users/hammyeong-yeon/.claude/projects/-Users-hammyeong-yeon-Desktop-10-work-noline/58e63789-a699-43ac-8a5c-5540ab654366.jsonl`이다.

- 213행, 사용자: "하는김에 앱 버전이랑 이런것도 이번 작업에서 맡을까? 기존에 앱 버전 업그레이드 하려고 했는데 안한게 꽤 있거든 그 기록 사례도 찾아보고 archive등 해서 현황이랑 잘 비교해서 분석해보고 생각해보자"
- 555행, Main: 기록·현황·외부 조건 분석과 별도 Work 추천(원래 문안)
- 560행, 사용자: "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"

## 의존성 점검 결과

2026-11-16 `apps/client`에서 `npx expo install --check`(설치하지 않는 확인)의 출력이다.

```
The following packages should be updated for best compatibility with the installed expo version:
  @react-native-community/netinfo@11.4.1 - expected version: 11.3.1
  @sentry/react-native@6.22.0 - expected version: ~5.24.3
  expo-dev-client@6.0.20 - expected version: ~4.0.29
  expo-splash-screen@31.0.10 - expected version: ~0.27.7
  react@18.3.1 - expected version: 18.2.0
  react-dom@18.3.1 - expected version: 18.2.0
  react-native-safe-area-context@5.6.1 - expected version: 4.10.5
  react-native-screens@3.37.0 - expected version: 3.31.1
  react-native-svg@15.14.0 - expected version: 15.2.0
  @types/react@18.3.26 - expected version: ~18.2.79
Your project may not work correctly until you install the expected versions of the packages.
```

같은 날 설치 버전: `expo` 51.0.39, `react-native` 0.74.5, `expo-modules-core` 1.12.26, `expo-updates-interface` 2.0.0, `expo-manifests` 1.0.10(둘 다 dev-client 6.0.20이 끌어옴). 로컬 `eas-cli` 16.28.0.
