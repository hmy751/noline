# 현재 상태와 다음 행동

2026-11-17 기준 상태다. 범위·대상 SDK·출시 2번을 정했고, 라이브러리 호환 점검과 지도 문제를 반영해 Ticket을 5개로 다시 짜 확정했다. Ticket 문서 01–05를 만들었다. 구현·빌드는 아직 시작하지 않았고, 01과 02를 바로 시작할 수 있다.

**이 Work가 생긴 경위:** 2026-11-16 Work 011을 재개하던 중 사용자가 SDK·라이브러리 업그레이드를 함께 맡을지 물었고, Main의 분석과 추천에 따라 별도 Work로 나눴다. 사용자는 "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"라고 답했다. 분석과 선택 이유는 [분리 기록](../../records/2026-11-16-01-separation-from-011-and-version-analysis.md)에 있다.

**011과의 순서:** 011(SDK 51 위에서 expo-updates, 1.1.4)을 먼저 끝내고 이 Work로 넘어간다. 2026-11-17 현재 이 조건은 사실상 충족됐다.
- 011의 판단 지점(SDK 51용 expo-updates·dev-client가 Xcode 26에서 빌드되는가)은 `expo-dev-menu@5.0.23` pnpm patch로 통과했다. OTA를 이 Work에 합칠 이유는 없어졌다.
- 011은 main에 병합됐고 1.1.4(빌드 18)는 심사 대기 중이다. 남은 것은 심사 결과다. 상세는 011의 [현재 상태](../../../011-expo-updates-ota/current/state/index.md)에 있다.
- 011 병합으로 dev-client 4.0.29 정렬, expo-updates 0.25.28, 최소 iOS 15.0이 이미 들어왔다. 출시·OTA 기준은 Project의 [app-release-and-ota](../../../../../project/guidance/app-release-and-ota.md)가 소유한다.

## 2026-11-17에 한 것

**버전 설정 전수 조사.** 사용자가 Node도 올리고 전반적인 버전 설정을 정리해 달라고 했다. Main이 앱·공유 패키지·서버·배포 설정을 조사해 현재와 이후로 나눴다. 값과 구분(필수·연동·정리)은 [제약·현재 설계·가정](../memory/spec/05-constraints-design-assumptions.md#버전-현재와-이후-2026-11-17)에 있다. 판단에 영향을 준 발견은 다음과 같다.
- Node가 `.nvmrc`·`eas.json`·`render.yaml`·`nixpacks.toml` 네 곳에 지원 종료된 20으로 적혀 있는데, 로컬은 24.16으로 돌고 있다. `engines`가 없다.
- root `package.json`의 react `^18.2.0`과 `packages/ui`의 react·RN·reanimated 고정이 있다. `node-linker=hoisted`라 SDK를 올리면 React 18·19가 함께 설치될 수 있다.
- Expo SDK 58의 Node 지원(22.13+·24.3+·26+)과 React 19.3.0을 공식 문서로 확인했다.

**서버를 범위에 넣었다(채택).** 사용자가 "서버도 하는게 낫지 않나?"라고 물었고, Main이 Node와 그에 따른 도구까지만 넣자고 추천하자 "반영하고"라고 답했다. 이유는 Node 20 지원 종료와 인터넷 노출, Render 배포가 client 의존성까지 설치해 앱만 올리면 서버 배포가 깨질 수 있다는 점, 네 곳의 Node 설정을 한 번에 맞추는 것이다. 서버 라이브러리(Express 5, drizzle 최신, zod 4)와 PostgreSQL은 012 밖에서 따로 판단한다. 근거는 [전수 조사 기록](../../records/2026-11-17-01-version-inventory-and-server-scope.md)에 있다.

**사용자가 고른 결정(채택).** Main의 질문에 사용자가 답했다. 경위와 선택지는 [Ticket 구성·결정 기록](../../records/2026-11-17-02-ticket-composition-and-release-decisions.md)에 있다.
- **대상 SDK 58.** "중간 단계 각각 출시" 선택지가 58 출시를 명시해 함께 정해졌고(기록 담당자의 해석), 뒤에 출시 횟수를 줄이라고 한 뒤에도 바뀌지 않았다.
- **브랜치:** 1.1.4 시점에서 `release/1.1`을 만들어 핫픽스는 그쪽에서 낸다. 업그레이드는 Ticket마다 main에 병합한다.
- **최소 iOS 16.4를 수용한다.** iOS 15.x–16.3 기기는 업데이트를 받지 못한다. 사용자 수 통계는 보지 않고 정했다.
- **테스트 기기:** 사용자가 "27.2.1, iPhone 14 Pro, 시뮬레이터만 추가"를 골랐다. Main은 iOS 27.2.1이 설치된 iPhone 14 Pro 실기기 1대와 나머지는 시뮬레이터로 해석했다(사용자가 문장으로 확인한 해석은 아니다). 이 기기로 iOS 27 시작과, 이미 설치된 SDK 51 빌드의 iOS 27 동작을 실기기로 확인할 수 있게 됐다. 둘 다 아직 확인하지 않았다.

**출시 2번을 채택했다.** 사용자는 처음에 중간 단계를 각각 출시(심사 3번)하기로 골랐다가 "더 줄일수 있음 줄이고"라고 했고, 개발 단계와 출시 횟수를 나눈 안에 "그래 좋아"라고 답했다. 출시는 1.2.0(SDK 54 + New Architecture)과 1.3.0(SDK 58·iOS 27) 2번이고, 1.2.0 뒤 1주일 동안 Sentry에 새 크래시가 없으면 1.3.0을 낸다. 현재 버전은 1.1.4(빌드 18)다. Node 24도 승인한 Ticket 표에 들어 있어 채택으로 본다(Node만 따로 확인한 발화는 없다). 경위는 [출시 축소 기록](../../records/2026-11-17-03-release-count-reduction.md)과 [채택·점검 기록](../../records/2026-11-17-04-release-plan-adopted-and-library-check.md)에 있다.

**라이브러리 호환 점검.** 사용자가 reanimated를 계기로 연관 라이브러리를 찾아보자고 했다. 버전 표·묶음·출처는 [라이브러리 호환 조사](../../source/library-compatibility-2026-11-17.md)에 있다. SDK 54 Legacy 단계에는 유지보수가 끝난 reanimated 3.19.x를 고정해야 하고, New Architecture 단계에 reanimated 4와 Mapbox v11이 함께 바뀌며, SDK 58 단계에 테스트 도구 변경이 몰린다는 점이 계획에 영향을 줬다.

**Ticket 5개로 다시 짜 확정했다.** 사용자가 "그래 좋아는 이전 메시지 고 그럼 이전에 분석으로 티켓을 좀 변경해야하지 않을까? 다시 판단해봐"라고 해 Main이 4개 구성을 다시 봤다. 가장 큰 위험(옛 오프라인 지도·기기 DB 보존)을 너무 늦게 확인하고, Ticket 03이 너무 크고, 테스트 도구를 앱 플랫폼과 같이 바꾸는 문제가 있었다. Expo가 SDK를 한 버전씩 올리라고 권장하는 것도 확인했다. 지도 문제 설명과 사용자의 대응안을 거쳐, 사용자가 "확정·작성 진행"으로 최종 구성과 보완 세 가지를 확정했다. 경위와 사용자 원문은 [재구성·지도 대응 기록](../../records/2026-11-17-05-ticket-restructure-and-map-data-plan.md)에 있다.
- **Ticket:** 01 준비(기준선·점검표·`release/1.1`·서버와 로컬 Node 24) → 02 데이터 보존 선검증과 목표 확정 → 03 SDK 51→54(Legacy, 출시 안 함) → 04 New Architecture와 1.2.0 → 05 SDK 55→58·iOS 27과 1.3.0. 문서와 공통 규칙은 [Ticket 색인](../memory/tickets/index.md)에 있다.
- **SDK는 한 버전씩 올린다.** 중간 SDK는 로컬 빌드, EAS preview 빌드는 Ticket 끝.
- **02의 멈춤 조건:** 기기 DB가 업데이트 뒤 그대로 열리지 않으면 03으로 가지 않고 보존 방법부터 다시 설계한다.
- **지도 대응 방향:** 옛 지도가 v11에서 쓸 수 있으면 그대로 둔다. 안 되면 새 지도에 엔진 버전을 남기고, 업데이트 뒤 첫 실행에 옛 기록의 `mapDownloaded`를 내려 "다시 받기 필요"로 바꾸고 안내한다. 활성 여행은 지도만 다시 받고 비활성 여행은 다음 활성화 때 받는다.
- **출시마다 release 브랜치:** 1.2.0을 낼 때 `release/1.2`를 만든다.
- **04는 멤버십(2026-12-18)·인증서(2026-12-30) 갱신 뒤.** 멤버십 갱신은 사용자가 직접 한다.
- **테스트 도구 선이전은 조건부:** 02에서 RNTL 14가 SDK 54의 jest-expo와 동작하면 05의 첫 체크포인트(1주일 관찰 기간)로, 아니면 SDK 58 단계로.
- **이미 어긋난 정리**(tailwind-merge 2.6, ui peer 전환, 쓰지 않는 패키지)는 03에 넣었다.
- **일정:** 11월 01·02, 12월 03, 1월 04(1.2.0), 2월 05, 3월 초 1.3.0.

**1.2.0 뒤 1.1.x 핫픽스.** 검토 중 드러난 "1.2.0 빌드가 생기면 `release/1.1`에서 OTA를 낼 수 없다"는 새 결정이 필요한 문제가 아니었다. Project [출시 기준](../../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)이 이미 이전 버전 사용자는 스토어 업데이트로 고친다고 정해 두었고 012는 이를 따른다. 그 뒤 1.1.x 핫픽스는 스토어 빌드로만, 1.2.0 핫픽스는 `release/1.2`의 OTA로 낸다. 경위는 [검토 발견 처리 기록](../../records/2026-11-17-06-review-findings-handling.md)에 있다.

**업데이트 확인에 쓰는 앱.** 02의 검증은 preview 번들 ID(`com.noline.dev`)로 한다. 확정한 02 구성에 들어 있어 채택으로 본다. 04·05에서 출시 빌드로 다시 확인할 때 preview 앱을 쓸지는 원문에서 정하지 않았고, Main 기본값으로 남아 Ticket 04에서 정한다.

**아직 하지 않은 것:**
- 01·02 실행(바로 시작 가능)
- `npx expo install` 실패의 원인 수정 또는 대체 절차 확정(01). 루트와 `apps/client`의 pnpm hoist 설정이 같아 원인은 미확인이다
- Node 24 쪽 pnpm 9.6.0·eas-cli 준비(01). 지금은 nvm의 Node 20 폴더에만 있다
- 04·05의 업데이트 확인 방식 결정(Ticket 04)
- ESLint 9는 SDK 58이 요구할 때만 넣는다는 Main 기본값의 확인
- 구현·빌드·검증 전부

**중요한 미확인:**
- Mapbox v10에서 받은 오프라인 pack이 v11 빌드에서 남는지, expo-sqlite를 올린 뒤 기기 DB 파일 경로가 그대로인지(02에서 판정)
- RNTL 14와 jest-expo 54의 동작(02)
- nativewind의 SDK 58·RN 0.88 지원, @rn-primitives·react-native-calendars의 React 19·New Architecture 공식 지원
- 2025-11 Mapbox 실패의 원인(커밋에 기록 없음)
- SDK 51 앱의 Node 24 EAS 빌드, 서버 도구(tsx·tsup·vitest·drizzle-kit 0.20)의 Node 24 동작
- `nixpacks.toml`(Railway) 사용 여부, Render의 실제 PostgreSQL 버전
- 이미 설치된 SDK 51 빌드가 iOS 27에서 동작하는지(01의 1.1.4 실기기 점검이 근거가 된다)
- Apple 요건의 정확한 날짜(4월로만 공지)
- 업그레이드 전 기준선(01에서 기록)

**다음 행동:** Ticket 01과 02를 시작한다. 02는 1.1.4 preview를 새로 빌드해 데이터와 오프라인 지도를 넣는 것부터 한다. 기존 preview 빌드는 1.1.3이라 쓸 수 없다.

**작업 트리 주의:** 다음 미커밋 수정은 이 Work와 무관하다. 이 Work의 문서를 커밋할 때 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
