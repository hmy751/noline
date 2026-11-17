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

같은 날의 다음 세션이다. 원문은 `/Users/hammyeong-yeon/.claude/projects/-Users-hammyeong-yeon-Desktop-10-work-noline/58e63789-a699-43ac-8a5c-5540ab654366.jsonl`이고, 이 Work에 반영한 범위는 4–560행과 839–3005행이다. 그 사이(561–838행)는 Work 012 생성과 커밋이라 012가 소유한다. 접근 조건과 읽는 방법은 위 원문과 같다. 이 범위의 기록은 [파악·분리 기록](../records/2026-11-16-02-scoping-check-and-sdk-split.md)이다.

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

같은 원문의 839–1611행은 Ticket 01을 실제로 실행한 구간이다(2026-11-16 21시 30분경–11-17 0시 30분경 KST). 기록은 [착수 기록](../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)이며, 그 기록의 괄호 숫자가 이 파일의 행이다. 1203행은 컨텍스트 압축 요약이라 원문이 아니다.

| 행 | 내용 | 읽을 이유 |
| --- | --- | --- |
| 841 | "일단 011 부터 하고 다되면 병합하자" | 착수 지시의 원문 |
| 848–875 | App Store Connect에서 1.1.3 "심사 대기 중" 확인 | 1.1.3 상태의 근거 |
| 878–931, 1009–1010 | 설치, 설정 편집, prebuild 결과(`Podfile.lock`, `Expo.plist`) | 단계 1·3·4의 실제 결과 |
| 947–948 | 환경값을 바꿔 계산한 runtime | fingerprint의 환경 의존 |
| 988–1003, 1057–1140 | 빌드 실패 두 번(locale, `expo-dev-menu`)과 임시 수정 뒤 성공 | 판단 지점의 근거 |
| 1151 | 판단 지점 결과와 패치 추천 | 선택지의 원래 문안 |
| 1156–1254 | 설명 요청 네 번과 Main의 답 | 사용자가 선택 전에 배경을 물은 경위 |
| 1259 | "됐으면 진행해 계속 012 는 다른데서 할거고" | 011 계속 결정의 원문 |
| 1280–1309, 1333, 1401–1409 | pnpm patch 고정과 재빌드 | 패치의 근거 |
| 1338–1364, 1418–1474 | EAS 환경 목록, eas-cli 코드 읽기, `ios/` 유무 비교 | 발행 방법의 근거 |
| 1479–1480 | 시험 방식·실기기 질문과 사용자 답 | preview 환경을 채운 허락 |
| 1492–1577 | 기기 목록 0대, EAS 환경 변경, `eas.json` environment, runtime 계산 | 단계 5의 실제 변경 |
| 1611 | `eas device:create` 안내 | 기기 등록의 출발점 |

1611–2268행은 기기 등록부터 실기기 OTA 확인까지다(2026-11-17 0시 55분경–1시 55분경 KST). 기록은 [실기기 확인 기록](../records/2026-11-17-02-preview-build-and-device-ota-check.md)이다.

| 행 | 내용 | 읽을 이유 |
| --- | --- | --- |
| 1640–1720 | 기기 등록(Website 방식, 사용자 Apple 로그인), 등록 1대 | 기기와 등록 경위 |
| 1748–1830 | 첫 preview 빌드 `8316db33…`과 "Runtime version mismatch" 로그 | 불일치의 원문 |
| 1837–1913 | `fingerprint:compare`의 SDK 52 제한, 깨끗한 복사본 재현, 소스 비교, `node_modules` 재설치 | 원인과 해결의 근거 |
| 1912–1974 | 두 번째 빌드 `f610d9b5…` FINISHED | EAS 빌드 성공 |
| 1981–2047 | 앱 시작, crash log 확인, Google "액세스 차단됨" | 로그인 판단의 근거 |
| 2048–2148 | 시험 업데이트 세 개 발행과 사용자 관찰 네 개 | 완료 판단 1–4 |
| 2158–2176, 2235–2248 | 번들 환경값 계수와 `babel.config.js`·`@env` 이름 대조 | 완료 판단 5 일부와 Ticket 02 주의 |
| 2197, 2211 | 결과 정리, Google 확인 방법 질문 | 남은 일과 이어질 질문 |

2268–3005행은 preview 앱 Google 로그인의 원인 확인과 수정이다(2026-11-17 11시경–11시 50분경 KST). 기록은 [Google 로그인 기록](../records/2026-11-17-03-preview-google-login-fix.md)이다.

| 행 | 내용 | 읽을 이유 |
| --- | --- | --- |
| 2272, 2301–2511 | 확인 방법 안내, Chrome 탭으로 OAuth 클라이언트 확인, 원인 | 원인의 근거 |
| 2516–2557 | 표와 값으로 다시 한 설명 | 로그인 단계와 값의 연결 |
| 2562, 2701 | "그럼 다 진행하자…", "그냥 니가 env확인해서 처리해주라…" | 수정·배포 지시의 원문 |
| 2611–2696 | 서버 수정·테스트, EAS 분리, preview OTA `a86d1596…` | 수정 결과 |
| 2808–2965 | 서버 커밋 `99235878` push와 배포, Render 값 변경·해시 대조 | 운영 변경의 근거 |
| 2970–2985 | health 확인, "둘 다 로그인 잘 돼" | 확인 결과 |

Main이 이 세션에서 다른 세션 원문 두 개도 읽었다. 2026-11-02 세션(SDK 업그레이드를 "이번 배포 뒤 별도 작업으로" 미룬 대목, CLI 원문 `a3669485-d435-43dd-9b82-a2891a7e403e.jsonl`)과 이 Work의 첫 원문(`da74d77c…`)이다. 내용은 555의 정리와 위 기록에 옮겼다.

## 코드 판본

논의 시점의 판본은 main `6adfbb2a`다(1.1.3 빌드는 `4c0df47b`). 두 번째 세션의 파악은 main `08ff4c27`에서 했고, 아래 파일 내용은 그때도 같았다. Ticket 01의 구현은 `3895d44f`(012 분리 문서 커밋) 위의 브랜치 `feat/011-expo-updates`에서 했으며 2026-11-17 현재 미커밋이다. 아래 목록은 구현 전 판본이다. 확인한 파일은 다음과 같다.
- `apps/client/app.config.js`: `runtimeVersion`·`updates` 없음, version 1.1.3, buildNumber 17
- `apps/client/eas.json`: 프로필 development·preview·production, channel 없음
- `apps/client/package.json`: `expo` ~51.0.21, `expo-dev-client` ^6.0.20, `expo-updates`·`expo-build-properties` 없음
- `apps/client/ios/Podfile` 31행: `platform :ios, podfile_properties['ios.deploymentTarget'] || '13.4'`
- `apps/client/src/shared/db/index.ts`: 마이그레이션 네 개 import

## 외부 상태

- EAS 빌드 `87ad94bf-f72f-43df-b1ca-9213d776f89d`: 1.1.3(17), gitCommitHash `4c0df47b…`
- EAS submit `a98756d8-3fd3-4154-8924-19331cff792b`
- App Store Connect: 2026-11-16 20시경 "iOS 1.1.3 심사 대기 중"을 화면으로 확인. 두 번째 세션에서 Gmail로 심사 결과를 찾으려 했지만 커넥터 연결이 끊겨 확인하지 못했다. 같은 세션 21시 30분경 App Store Connect 화면에서 다시 봤을 때도 "심사 대기 중"이었다(위 원문 848–875행).
- Apple 공지 [App Store submissions now open](https://developer.apple.com/news/?id=k1mtkt1k)(2026-09-09): 2027년 4월부터 iOS 27 SDK 이상으로 빌드해야 업로드할 수 있다. 두 번째 세션에서 Main이 읽었다.
- Expo 문서 [SDK 버전표](https://docs.expo.dev/versions/latest/)와 [EAS 빌드 이미지](https://docs.expo.dev/build-reference/infrastructure/): 2026-11-16 기준 최신 SDK 58, SDK 56–58 최소 iOS 16.4, `sdk-51` 별칭은 Xcode 15.4 이미지. 버전 상세는 012가 다룬다.
