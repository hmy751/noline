# 실행 Ticket

2026-11-17 사용자가 "확정·작성 진행"으로 아래 구성을 확정했다. 출시는 2번, Ticket은 5개다. 01·02는 바로 실행할 수 있게 확인 방법까지 구체화했고, 03–05는 02의 판정(기기 DB·오프라인 지도·목표 버전·테스트 도구)으로 범위가 바뀔 수 있다.

사용자는 이 작업을 "버전 의존성 문제 때문에 앱이 깨지고 그래서 확인하고 되게 중요한 작업"이라고 규정하고 안정성과 순서를 고려해 나누자고 했다. 출시 횟수는 "더 줄일수 있음 줄이고"라고 했다. 그래서 안정성은 출시 횟수가 아니라 단계별 검증에 둔다. 가장 큰 불확실성(데이터 보존)은 구현 전에 확인하고, 한 단계에서 하나만 바꾼다. 구성이 8개 → 7개 → 4개 → 5개로 바뀐 경위는 records의 [02](../../../records/2026-11-17-02-ticket-composition-and-release-decisions.md), [03](../../../records/2026-11-17-03-release-count-reduction.md), [04](../../../records/2026-11-17-04-release-plan-adopted-and-library-check.md), [05](../../../records/2026-11-17-05-ticket-restructure-and-map-data-plan.md)에 있다.

| # | Ticket | 맡는 결과 | 출시 | 선행 | 일정 | 상태 |
| --- | --- | --- | --- | --- | --- | --- |
| 01 | [준비](01-preparation-baseline-and-node24.md) | 검사 기준선, 실기기 점검표, `release/1.1`과 핫픽스 경로 확인, 서버·로컬 Node 24(pnpm·eas-cli 준비 포함), 패키지 설치 절차 확정 | 서버 배포만 | — | 11월 | 진행 중(1.1.4 출시 확인, 실기기 점검표 남음) |
| 02 | [데이터 보존 선검증과 목표 확정](02-data-preservation-check-and-targets.md) | 검증용 최소 앱으로 기기 DB와 오프라인 지도가 남는지 판정, 목표 버전 표와 테스트 도구 선이전 가능 여부 확정 | — | 01과 병행 가능 | 11월 | 판정 완료(DB·지도 성공) |
| 03 | [SDK 51→54, Legacy 유지](03-sdk54-legacy.md) | 한 단계씩 SDK 54로, React 19·기기 DB 묶음, EAS Node 24, ui peer 전환과 이미 어긋난 것 정리 | — | 02(DB 판정 성공) | 12월 | 완료(2026-11-19, main `ae97809e`) |
| 04 | [New Architecture와 1.2.0](04-new-architecture-and-1-2-0.md) | reanimated 4·Mapbox v11, 지도 대응(02 판정으로 불필요), 기존 사용자 업데이트, `release/1.2`, 1주일 관찰 | **1.2.0** | 02·03, 멤버십·인증서 갱신 | 1월 | 진행 중(코드는 2026-11-20 main 병합, iPad 확인 끝, iPhone·Android·Apple 로그인 남음, 출시는 갱신 뒤) |
| 05 | [SDK 55→58·iOS 27과 1.3.0](05-sdk58-ios27-and-1-3-0.md) | 테스트 도구 선이전, 한 단계씩 SDK 58로, Xcode 27·SceneDelegate·iOS 16.4, Project 반영 | **1.3.0** | 04와 1주일 관찰 | 2월, 3월 초 출시 | 시작 전 |

**02의 멈춤 조건:** 기기 DB가 업데이트 뒤 그대로 열리지 않으면 03으로 가지 않고 보존 방법부터 다시 설계한다. 2026-11-18 판정에서 DB가 그대로 열려 해당하지 않는다. 지도도 남아 04의 지도 대응은 빠지고, 테스트 도구 선이전은 05 첫 체크포인트로 둔다.

## 공통 규칙 (확정)

1. **한 단계에서 하나만 바꾼다.** Node, SDK 버전, New Architecture, iOS 27 SDK를 따로 바꾼다. SDK는 Expo 권장에 따라 한 버전씩 올린다. 출시를 묶어도 개발과 검증은 단계별로 한다. 중간 SDK는 로컬 빌드로 확인하고 EAS preview 빌드는 Ticket 끝에 돌린다.
2. **매 단계 같은 확인을 한다.** 기준선 대비 검사(client lint·test·typecheck, server typecheck·build·test·integration, schema build, ui lint)와 실기기 점검표(오프라인 시작, 활성 여행 조회·변경, 동기화, Google·Apple 로그인, 오프라인 지도, 경로 표시). 기준선 수치와 실패 이름은 [기준선 원자료](../../../source/ticket-01-baseline-2026-11-18.md)에 있다. client test는 `pnpm --filter @apps/client run test --runInBand`로 실행한다(경로 가이드의 `pnpm client test --runInBand`는 pnpm 9.6.0에서 실패).
3. **Expo가 고른 버전만 넣는다.** `apps/client`에서 `pnpm exec expo install <패키지>`로 넣는다(2026-11-18 Ticket 01에서 확정). `npx expo install`은 npx가 `.npmrc` 값을 환경변수로 넘겨 내부 `pnpm add`가 `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`로 실패하므로 쓰지 않는다. 같은 이유로 설치 명령을 `npx`로 감싸면 pnpm이 `node_modules` 전체 재설치를 물을 수 있다. 근거는 [Ticket 01 진행 기록](../../../records/2026-11-18-02-ticket01-baseline-node24-and-expo-install.md#npx-expo-install-실패의-원인)에 있다. SDK 단계마다 `expo install --check`를 통과하거나 차이마다 이유를 남긴다. 일부러 벗어난 버전(SDK 54 Legacy 단계의 reanimated 3.19.x)은 `expo.install.exclude`와 이유로 남긴다.
4. **출시하는 단계마다 기존 사용자 업데이트를 확인한다.** 이전 빌드에 데이터·미전송 변경·오프라인 지도를 넣고 새 빌드를 덮어 설치한다. 02는 preview 번들 ID(`com.noline.dev`)로 한다(확정한 02의 방법). 04·05에서 preview 앱으로 할지 다른 방식으로 할지는 아직 Main 기본값(preview 앱)이며 04에서 정한다.
5. **출시마다 release 브랜치를 만든다.** 1.1.4에서 `release/1.1`, 1.2.0에서 `release/1.2`를 만들어 핫픽스는 그 브랜치에서 낸다. 업그레이드는 Ticket마다 main에 병합한다. release 브랜치는 다음 버전이 출시되기 전까지만 쓴다. OTA는 채널의 최신 빌드와 runtime이 같을 때만 발행되고, App Store는 이미 승인된 버전보다 높은 버전만 받으므로(Main의 지식, Apple 문서 재확인 전), 1.2.0이 나간 뒤 1.1.x 사용자는 1.2.x로 업데이트해야 고칠 수 있다. `release/1.1`은 012 변경을 main에 병합하기 전에 가장 먼저 만든다.
6. **출시 뒤 1주일 관찰한다.** 1.2.0 뒤 1주일 동안 Sentry에 새 크래시가 없어야 1.3.0을 낸다.

확인 기기는 iOS 27.2.1 iPhone 14 Pro 실기기 1대(사용자 답의 Main 해석)와 시뮬레이터(최소 iOS 16.4 포함)다. 2026-11-19 iPad Air 4(iPadOS 26.6.2)를 EAS에 등록해 03의 실기기 확인에 썼다.

## Spec 완료 기준을 맡는 Ticket

Main이 확정 전에 대조한 결과다([재구성 기록](../../../records/2026-11-17-05-ticket-restructure-and-map-data-plan.md#최종-구성과-보완-737행)). 기준 번호는 [완료 판단](../spec/04-quality-and-completion.md)을 따른다.

| 완료 기준 | 맡는 Ticket |
| --- | --- |
| 1 Apple 요건, 2 iOS 27 시작 | 05 |
| 3 기존 사용자 업데이트 | 02에서 먼저, 04·05에서 출시 빌드로 |
| 4 오프라인 약속 | 모든 Ticket의 실기기 점검표 |
| 5 위험 영역 | 02에서 확인 방법을 정하고 03–05에서 확인 |
| 6 의존성 정합, 11 중복 없음 | 03, 05 |
| 7 OTA | 04, 05(SDK 58의 fingerprint 기본 방식 변경은 05) |
| 8 검사 기준선, 10 Node 정합 | 01(EAS Node는 03) |
| 9 재발 방지 | 03(`expo install --check`, `engines`), 05(Project 반영) |
