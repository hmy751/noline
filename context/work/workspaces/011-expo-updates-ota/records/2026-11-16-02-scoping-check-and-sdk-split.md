# 착수 전 파악과 SDK 업그레이드를 012로 분리한 경위

2026-11-16 같은 날 두 번째 세션의 기록이다. 사용자는 011을 이어가자고 했다가 "파악만" 하라고 범위를 좁혔다. 파악하면서 `expo-dev-client` 버전 충돌이라는 막힘이 새로 나왔다. 이어서 사용자가 SDK·라이브러리 업그레이드도 이 Work에서 맡을지 물었고, 분석 끝에 업그레이드를 별도 Work 012로 나누기로 했다. 저장소 코드는 바뀌지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 아래 괄호 안 숫자는 그 파일의 행 번호다.

## 앞서 나간 설치와 "파악만" 정정

사용자의 첫 요청은 "011 워크스페이스 파악하고 진행하자"(4)였다. Main은 Work 문서와 `package.json`·`app.config.js`·`eas.json`을 읽은 뒤 사용자 확인 없이 구현 계획을 세우고 바로 설치를 시작했다(115–138).
- 브랜치 `feat/011-expo-updates`를 만들고 `apps/client`에서 `npx expo install expo-updates expo-build-properties`를 실행했다. Expo가 SDK 51용 버전을 `expo-updates@~0.25.28`, `expo-build-properties@~0.12.5`로 골랐지만, 내부의 `pnpm add`가 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패했다(117–118).
- 그래서 저장소 루트에서 `pnpm --filter @apps/client add expo-updates@~0.25.28 expo-build-properties@~0.12.5`로 다시 설치했다(134). 이 설치는 끝났다.

이 설치가 도는 동안 사용자 메시지가 도착했다(140, 작업 중 끼어든 메시지).

> "바로 시작하지말고 파악만 해봐"

Main은 구현을 멈추고 되돌렸다(151–171).
1. 바뀐 파일을 확인했다. 원래 있던 미커밋 수정 6개 외에는 `apps/client/package.json`과 `pnpm-lock.yaml`뿐이었다.
2. 패키지가 깔려 있는 동안 fingerprint 지원을 코드로 확인했다(아래 절).
3. 두 파일을 `git checkout`으로 되돌리고 main으로 돌아가 브랜치를 지웠다. `pnpm install --frozen-lockfile`로 `node_modules`를 다시 맞췄고, `expo-updates`·`expo-build-properties`가 없어진 것을 확인했다.

"진행하자"를 구현 착수 허락으로 읽은 것이 어긋났다. 이 세션에서 사용자는 이후에도 구현을 시작하라고 하지 않았다. 그래서 현재 상태는 여전히 "구현 전"이고, 착수는 사용자가 정한다.

## 파악에서 확인한 것

| 항목 | 확인한 내용 | 확인 방법과 한계 |
| --- | --- | --- |
| SDK 51용 버전 | `expo-updates` 0.25.28, `expo-build-properties` 0.12.5 | `npx expo install`이 고른 버전(118). 설치 뒤 `expo-updates` 0.25.28, `@expo/fingerprint` 0.10.3이 깔린 것을 봤다(160) |
| fingerprint 지원 | 설치된 `@expo/config-plugins`의 `build/utils/Updates.js` 130행에 `runtimeVersion.policy === 'fingerprint'` 분기가 있다 | 코드만 읽었다(159–160). 실제 빌드에서 fingerprint를 계산하는지는 보지 않았다 |
| dev-client 충돌 | `expo-dev-client` 6.0.20은 SDK 54 세대다. `expo-updates-interface ~2.0.0`, `expo-manifests ~1.0.10`, `expo-dev-launcher` 6.0.20, `expo-dev-menu` 7.0.18을 끌어온다. 루트에는 `expo-updates-interface` 2.0.0, `expo-manifests` 1.0.10이 깔려 있다. 반면 `expo-updates` 0.25.28은 `expo-updates-interface ~0.16.2`, `expo-manifests ~0.14.0`을 요구한다 | `package.json`과 `npm view`로 확인했다(182, 188, 199). Main은 그대로 넣으면 같은 네이티브 모듈이 두 버전으로 섞인다고 해석했다. 빌드해서 깨지는지는 보지 않았다 |
| dev-client가 들어온 경위 | 커밋 `9f45f931`(2025-12-30, "expo-dev-client 라이브러리 설치") | git 기록(188). SDK 51용 `expo-dev-client`의 마지막 판은 4.0.29다(199) |
| SDK 51 기대 버전과 어긋난 패키지 | 10개. netinfo 11.4.1(기대 11.3.1), `@sentry/react-native` 6.22.0(~5.24.3), `expo-dev-client` 6.0.20(~4.0.29), `expo-splash-screen` 31.0.10(~0.27.7), react·react-dom 18.3.1(18.2.0), safe-area-context 5.6.1(4.10.5), screens 3.37.0(3.31.1), svg 15.14.0(15.2.0), `@types/react` 18.3.26(~18.2.79) | `npx expo install --check`(읽기 전용, 467–468) |
| iOS 15 plugin의 적용 | `apps/client/ios/`는 gitignore 대상이라 EAS 빌드가 매번 prebuild한다. 그래서 `app.config.js`의 `expo-build-properties` plugin이 EAS 빌드에 그대로 들어간다 | `git check-ignore`(83, 89) |
| preview 빌드의 앱 | `eas.json`의 preview 프로필은 `APP_VARIANT=development`라 개발용 앱 `com.noline.dev`로 빌드된다. preview 채널 확인도 이 앱에서 하게 된다 | `eas.json`·`app.config.js` 읽기(71). Main 정리(208) |
| 1.1.3 심사 결과 | 확인하지 못했다 | Gmail 커넥터 연결이 끊겨 있었다(110–111) |

어긋난 10개 가운데 Sentry 6.22(Xcode 26 컴파일 오류 대응, Work 007)와 react 18.3.1(expo-router 빌드 실패 대응, 커밋 `80ee0751`)은 일부러 벗어난 것이다. dev-client·splash-screen·safe-area-context·netinfo·screens·svg·`@types/react`는 섞여 들어온 것으로 Main이 분류했다(555).

## 사용자의 버전 질문과 Main의 분석

파악 결과(208)를 본 사용자가 범위를 물었다.

> "하는김에 앱 버전이랑 이런것도 이번 작업에서 맡을까? 기존에 앱 버전 업그레이드 하려고 했는데 안한게 꽤 있거든 그 기록 사례도 찾아보고 archive등 해서 현황이랑 잘 비교해서 분석해보고 생각해보자" (213)

Main은 "앱 버전 업그레이드"를 Expo SDK·React Native·라이브러리 버전을 올리는 일로 이해했다고 밝히고 답했다(555). 근거는 `_archive`·git 커밋·이전 세션 원문 검색, `expo install --check`, Apple·Expo 공식 문서였다(220–549).

**과거 사례.** archive에는 업그레이드 계획이 없었다. 사례는 git 커밋과 이전 세션 대화에 있었다.
- 최신판(SDK 54용)을 받았다가 문제가 나면 SDK 51용으로 내리는 일이 반복됐다: expo-sqlite 16→14(`ffa7069f`), Mapbox 다운그레이드와 `newArchEnabled: false`(`7ed7ac54`), expo-asset 12→10 크래시 수정(`8a9b0243`).
- Xcode가 오를 때마다 개별로 버텼다: 2026-11-02 EAS 이미지를 Xcode 26.2로 고정, 2026-11-09 Sentry 5.24→6.22(Work 007).
- 2026-11-02 세션에서 AI가 "근본 해법은 Expo SDK를 올리는 것, 이번 배포 뒤 별도 작업으로"라고 추천했고 사용자가 받아들였다. 그런데 이 결정은 어느 Work·Ticket에도 기록되지 않았다. Main은 이것을 "안 한 게 꽤 있는" 직접적인 이유로 보았다.

**판단을 바꾸는 외부 조건.** Main이 공식 문서에서 확인해 보고한 내용이다.
- Apple 공지(2026-09-09): 2027년 4월부터 App Store Connect에 올리는 iOS 앱은 iOS 27 SDK 이상으로 빌드해야 한다.
- iOS 27 SDK로 빌드한 앱은 UIScene 생명주기(scene 기반 실행 구조, TN3187)가 필요하다. SDK 51/RN 0.74에는 이 구조가 없다. Expo는 SDK 58에서 기본으로 넣는다.
- SDK 55부터는 New Architecture만 지원한다. Noline은 이 구조를 끈 상태이고 Mapbox가 이 구조에서 깨졌던 이력이 있다.
- SDK 56–58의 최소 iOS는 16.4다. Node는 SDK 58에서 22.13 이상이 필요하다(저장소는 20.18.1).
- 현재 최신은 SDK 58(2026-10-15, RN 0.88)이다. SDK 51(2024-05)과 일곱 세대 차이다.

Main의 결론은 "2027년 4월 이후에는 SDK 51로 새 스토어 빌드를 올리기가 사실상 어렵다"였다. UIScene을 직접 패치하는 길은 시도하지 않았다. 이미 설치된 앱과 OTA 전달은 계속 동작하고, 막히는 것은 새 스토어 빌드다. 그래서 업그레이드는 "언젠가 할 개선"이 아니라 마감이 있는 일이 됐다.

## 012로 나눈 이유와 011에 남긴 조정

Main은 011에 합치지 말고 별도 Work 012로 나누고, 011을 짧게 먼저 끝내라고 추천했다.

| 비교 | 내용 |
| --- | --- |
| 나누는 이유 | 목표와 완료 기준이 다르다. 011은 OTA 경로와 방지 장치를 만드는 작은 일이고, 012는 RN 0.74→0.88, React 19, New Architecture, expo-router, Mapbox, drizzle, Node까지 걸린 큰 이전이다. 합치면 OTA가 큰 이전이 끝날 때까지 묶인다 |
| 먼저 끝낸 011이 012를 돕는 점 | 업그레이드 릴리스는 버그가 나기 쉽다. 그때 심사 없이 고치려면 OTA가 이미 운영에서 검증돼 있어야 한다. 채널·발행 스크립트·절차는 SDK와 상관없이 이어 쓴다 |
| 나누면 드는 비용 | 심사를 두 번 받는다. 업그레이드 뒤에 OTA 받기·오프라인 시작·롤백을 다시 확인해야 한다 |
| 합치면 얻는 것 | 심사가 한 번이고, dev-client를 4.0.x로 내리는 일이 필요 없다 |

추천에 함께 들어 있던 011 조정은 다음과 같다.
- SDK 51에 들이는 정리는 expo-updates에 필요한 dev-client 정렬까지만 한다. 나머지 어긋남은 012에서 다룬다.
- 1단계에서 갈린다. SDK 51용 expo-updates와 dev-client 4.0.29가 Xcode 26에서 빌드되는지 먼저 본다. Sentry처럼 오래된 네이티브 코드가 깨지면 SDK 51에 더 투자하지 않고 OTA를 012에 합치는 쪽으로 다시 판단한다.
- 방지 장치는 특정 SDK 버전에 묶이지 않게 만든다.
- iOS 15 설정은 1.1.4만을 위한 임시 조치다. SDK 56 이상으로 올라가면 최소 iOS 16.4가 되어 의미가 없어진다.

## 사용자의 선택

> "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고" (560)

사용자는 업그레이드를 012로 분리하는 데 동의했고, 버전의 상세 논의는 012에서 하기로 했다. 위 011 조정은 사용자가 받아들인 분리 추천 안에 들어 있던 방향이다. 항목마다 따로 확정하지는 않았으므로 Ticket 01·02를 구현할 때 확정한다.

Main 정리(555)에는 012의 뼈대(3월 심사 목표, 대상 SDK 58 추천, 51→54→58 단계, `npx expo install`만 쓰고 `expo install --check`를 검사에 넣는 재발 방지)도 있었다. 이것은 012에서 논의할 내용이며 011의 결정으로 기록하지 않는다. 012는 [012 Work](../../012-expo-sdk-upgrade/README.md)가 소유한다.

이번 세션은 dev-client 충돌을 011 문서에 적을지 물었고(205), 사용자는 그 질문에 따로 답하지 않은 채 버전 질문으로 넘어갔다. 마지막 "기록해주고"(560)에 따라 이 기록과 current에 함께 반영했다.

## 이 기록으로 고친 current

- Spec 01: 범위에 dev-client 정렬을 넣고, SDK 업그레이드를 범위 밖(012)으로 적었다. iOS 15 목표에 임시 조치 표시를 붙였다.
- Spec 03: fingerprint 지원의 확인 범위를 바꿨다.
- Spec 05: 설계 표의 패키지 행, 1단계 판단 지점, 설치 명령의 실패와 우회, 가정 목록을 고쳤다.
- Ticket 01·02, state, recover, README.
