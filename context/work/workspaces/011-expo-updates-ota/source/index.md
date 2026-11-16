# 선택한 원자료

## 대화 원문

논의는 한 세션에서 나왔다. 원문은 `/Users/hammyeong-yeon/.claude/projects/-Users-hammyeong-yeon-Desktop-10-work-noline/da74d77c-3a97-4f86-9ee3-da972cde564d.jsonl`이다.
- 이 기기 안에서만 접근할 수 있다.
- 한 행이 길어서 스크립트로 필요한 행을 뽑아 읽는다.
- 같은 세션의 앞부분(〜2224행)은 START_GUIDE 검증, 흐린 버튼과 Drawer 수정, 1.1.3 배포다. 그 내용은 Work 008과 START_GUIDE 커밋이 소유한다.
- 2726행에 컨텍스트 요약이 있다. 요약문은 원문이 아니다.

| 행 | 내용 | 읽을 이유 |
| --- | --- | --- |
| 2224 | 사용자가 expo-updates 논의를 꺼냄 | 출발점 |
| 2710 (요약 뒤 2747에 같은 글) | 첫 논의 정리: 배포 결과, 따져 볼 점 다섯 가지, 진행 순서 | 처음 낸 추천의 원래 문안 |
| 2808, 2826 | Apple 경고 메일과 Main의 답(원인 `ios/Podfile`의 `'13.4'`, 고치는 방법) | iOS 15를 묶은 근거 |
| 2855 | expo-updates 상세 설명(두 층, 기기 동작 순서, runtime version 비교, 채널, Noline의 위험 네 가지, Apple 정책, 1.1.4 할 일) | Spec의 원래 설명. 표현을 다시 판단할 때 |
| 2865 | Work 생성 요청 | 범위(Project 반영과 hook)의 원문 |

사용자 발화 발췌는 [사용자 방향 원문](user-direction.md)에 있다.

### 두 번째 세션: 착수 전 파악과 SDK 분리

같은 날의 다음 세션이다. 원문은 `/Users/hammyeong-yeon/.claude/projects/-Users-hammyeong-yeon-Desktop-10-work-noline/58e63789-a699-43ac-8a5c-5540ab654366.jsonl`이고, 이 Work에 반영한 범위는 4–560행이다. 접근 조건과 읽는 방법은 위 원문과 같다. 이 범위의 기록은 [파악·분리 기록](../records/2026-11-16-02-scoping-check-and-sdk-split.md)이다.

| 행 | 내용 | 읽을 이유 |
| --- | --- | --- |
| 4 | "011 워크스페이스 파악하고 진행하자" | 출발점 |
| 117–138 | 브랜치 생성과 패키지 설치. `npx expo install` 실패(`ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`)와 `pnpm --filter` 설치 | 설치 명령과 SDK 51 버전 조합의 출처 |
| 140 | 작업 중 도착한 사용자 메시지 "바로 시작하지말고 파악만 해봐"(대기 메시지 첨부 형태라 일반 사용자 턴이 아니다. `파악만`으로 검색한다) | 구현을 멈추고 되돌린 정정의 원문 |
| 151–171 | 변경 확인, fingerprint 지원 확인(159–160), 되돌리기와 브랜치 삭제 | 저장소에 변경이 남지 않았다는 근거 |
| 181–199 | dev-client 의존성, 루트에 깔린 버전, `npm view`로 본 `expo-updates` 0.25.28의 요구 버전 | dev-client 충돌의 근거 |
| 208 | 파악 결과 정리 | 충돌·plugin 적용·preview 앱 정체성의 원래 설명 |
| 213 | SDK·라이브러리 업그레이드도 맡을지 묻는 사용자 질문 | 분석을 요청한 범위 |
| 467–468 | `npx expo install --check` 결과(어긋남 10개) | 현황 |
| 492–523 | Apple 공지·EAS 이미지·Expo SDK 문서 확인 | 2027년 4월 조건과 UIScene·New Architecture·최소 iOS의 출처 |
| 555 | 버전 분석과 012 분리 추천(과거 사례, 외부 조건, 나누는 이유와 비용, 011 조정, 012 뼈대) | 분리 판단의 원래 문안 |
| 560 | "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고" | 분리 결정의 원문 |

Main이 이 세션에서 다른 세션 원문 두 개도 읽었다. 2026-11-02 세션(SDK 업그레이드를 "이번 배포 뒤 별도 작업으로" 미룬 대목, CLI 원문 `a3669485-d435-43dd-9b82-a2891a7e403e.jsonl`)과 이 Work의 첫 원문(`da74d77c…`)이다. 내용은 555의 정리와 위 기록에 옮겼다.

## 코드 판본

논의 시점의 판본은 main `6adfbb2a`다(1.1.3 빌드는 `4c0df47b`). 두 번째 세션의 파악은 main `08ff4c27`에서 했고, 아래 파일 내용은 그때도 같았다. 확인한 파일은 다음과 같다.
- `apps/client/app.config.js`: `runtimeVersion`·`updates` 없음, version 1.1.3, buildNumber 17
- `apps/client/eas.json`: 프로필 development·preview·production, channel 없음
- `apps/client/package.json`: `expo` ~51.0.21, `expo-dev-client` ^6.0.20, `expo-updates`·`expo-build-properties` 없음
- `apps/client/ios/Podfile` 31행: `platform :ios, podfile_properties['ios.deploymentTarget'] || '13.4'`
- `apps/client/src/shared/db/index.ts`: 마이그레이션 네 개 import

## 외부 상태

- EAS 빌드 `87ad94bf-f72f-43df-b1ca-9213d776f89d`: 1.1.3(17), gitCommitHash `4c0df47b…`
- EAS submit `a98756d8-3fd3-4154-8924-19331cff792b`
- App Store Connect: 2026-11-16 20시경 "iOS 1.1.3 심사 대기 중"을 화면으로 확인. 두 번째 세션에서 Gmail로 심사 결과를 찾으려 했지만 커넥터 연결이 끊겨 확인하지 못했다.
- Apple 공지 [App Store submissions now open](https://developer.apple.com/news/?id=k1mtkt1k)(2026-09-09): 2027년 4월부터 iOS 27 SDK 이상으로 빌드해야 업로드할 수 있다. 두 번째 세션에서 Main이 읽었다.
- Expo 문서 [SDK 버전표](https://docs.expo.dev/versions/latest/)와 [EAS 빌드 이미지](https://docs.expo.dev/build-reference/infrastructure/): 2026-11-16 기준 최신 SDK 58, SDK 56–58 최소 iOS 16.4, `sdk-51` 별칭은 Xcode 15.4 이미지. 버전 상세는 012가 다룬다.
