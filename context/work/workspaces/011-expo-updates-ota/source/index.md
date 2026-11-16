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

## 코드 판본

논의 시점의 판본은 main `6adfbb2a`다(1.1.3 빌드는 `4c0df47b`). 확인한 파일은 다음과 같다.
- `apps/client/app.config.js`: `runtimeVersion`·`updates` 없음, version 1.1.3, buildNumber 17
- `apps/client/eas.json`: 프로필 development·preview·production, channel 없음
- `apps/client/package.json`: `expo` ~51.0.21, `expo-dev-client` ^6.0.20, `expo-updates`·`expo-build-properties` 없음
- `apps/client/ios/Podfile` 31행: `platform :ios, podfile_properties['ios.deploymentTarget'] || '13.4'`
- `apps/client/src/shared/db/index.ts`: 마이그레이션 네 개 import

## 외부 상태

- EAS 빌드 `87ad94bf-f72f-43df-b1ca-9213d776f89d`: 1.1.3(17), gitCommitHash `4c0df47b…`
- EAS submit `a98756d8-3fd3-4154-8924-19331cff792b`
- App Store Connect: 2026-11-16 20시경 "iOS 1.1.3 심사 대기 중"을 화면으로 확인
