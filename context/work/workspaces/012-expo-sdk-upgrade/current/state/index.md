# 현재 상태와 다음 행동

2026-11-20 기준 상태다. 범위·대상 SDK·출시 2번을 정했고, 라이브러리 호환 점검과 지도 문제를 반영해 Ticket을 5개로 다시 짜 확정했다. **2026-11-18 Ticket 02 판정을 마쳤다.** 기기 DB·오프라인 지도가 업데이트 뒤 남아 03으로 갈 수 있고, 04의 지도 대응은 필요 없다. **2026-11-18 Ticket 01을 시작했다.** 검사 기준선, `release/1.1`(원격, 빌드·OTA 확인), Node 24 설정 변경과 Railway 설정 삭제(`7413b343`), 설치 절차 확정까지 했고, main에 병합·push해 운영 서버가 Node 24.16.0으로 배포됐다. 운영 앱에서도 로그인·여행 조회·동기화가 된다는 사용자 확인("잘 돼")을 받았다. 1.1.4는 심사를 통과해 출시됐고(2026-11-20 확인), 01에 남은 일은 실기기 점검표다. **같은 날 Ticket 03을 시작해 SDK 52·53·54를 작업 브랜치 `feat/012-sdk54`에 커밋했다(main 무변경).** 앱이 SDK 54(Legacy)로 로컬 검사와 시뮬레이터 빌드를 통과한다. 2026-11-19까지 검사 장치, EAS preview, iPad 실기기 확인을 마치고 사용자의 "병합해"로 main에 병합해 03을 완료했다(머지 `ae97809e`, 2026-11-19 `195b62ee`까지 push하고 Render 재배포 health 200 확인). **2026-11-19 Ticket 04 코드 작업을 앞당겨 시작했다.** New Architecture·reanimated 4·Mapbox v11 전환과 fmt 우회 삭제, 독립 검증이 찾은 오프라인 지도 스타일 문제 수정을 작업 브랜치 `feat/012-newarch`에 커밋했다. 같은 날 iPad 실기기에서 1.1.4 위 덮어 설치·비행기 모드·서버 전송을 확인했고, 거기서 찾은 일정 지도의 마커 번호·처음 위치 차이를 고쳐(`c5fdbbdc`) 다시 실기기로 확인했다. **2026-11-20 사용자의 "병합하고 push"로 `feat/012-newarch`를 main에 병합해(`6d34c44b`) push했다.** 04의 코드 부분은 main에 들어갔다. **같은 날 사용자의 "쭉 다해줘"로 iPad에서 `OfflineMapView`와 첫 일정에 좌표가 없는 날을 확인했고, 병합된 012 worktree 2개·브랜치 4개를 지웠다.** 04에 남은 것은 iPhone·Android·Apple 로그인 확인과 1.2.0 출시다. 1.2.0 스토어 빌드는 12월 갱신 뒤다.

**이 Work가 생긴 경위:** 2026-11-16 Work 011을 재개하던 중 사용자가 SDK·라이브러리 업그레이드를 함께 맡을지 물었고, Main의 분석과 추천에 따라 별도 Work로 나눴다. 사용자는 "그래 분리해서 진행하자 더 버전에 대해 자세한건 012에서 더 논의한다고 기록해주고"라고 답했다. 분석과 선택 이유는 [분리 기록](../../records/2026-11-16-01-separation-from-011-and-version-analysis.md)에 있다.

**011과의 순서:** 011(SDK 51 위에서 expo-updates, 1.1.4)을 먼저 끝내고 이 Work로 넘어간다. 2026-11-17 현재 이 조건은 사실상 충족됐다.
- 011의 판단 지점(SDK 51용 expo-updates·dev-client가 Xcode 26에서 빌드되는가)은 `expo-dev-menu@5.0.23` pnpm patch로 통과했다. OTA를 이 Work에 합칠 이유는 없어졌다.
- 011은 main에 병합됐고 1.1.4(빌드 18)는 심사를 통과해 2026-11-17T22:22:51Z에 App Store에 출시됐다(2026-11-20 App Store 조회로 확인). 011의 문서가 이를 반영했는지는 이 Work에서 보지 않았다. 상세는 011의 [현재 상태](../../../011-expo-updates-ota/current/state/index.md)에 있다.
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

**1.2.0 뒤 1.1.x 핫픽스.** 1.2.0이 나가면 1.1.x 사용자는 1.2.x로 업데이트해야 고칠 수 있다. production에 1.2.0 빌드가 생기면 `release/1.1`의 OTA가 발행되지 않고, App Store는 이미 승인된 버전보다 높은 버전만 받아 1.1.x 스토어 빌드도 낼 수 없기 때문이다(버전 규칙은 Main의 지식이며 Apple 문서로 다시 확인하지 않았다). 이전 버전 사용자는 스토어 업데이트로 고친다는 Project [출시 기준](../../../../../project/guidance/app-release-and-ota.md#runtime이-같은-빌드에만-ota가-간다)의 기존 정책과 같은 결론이다. `release/1.1`은 1.2.0 출시 전까지 1.1.4 반려 시 재제출, 1.1.5 핫픽스, 1.1.4 OTA에 쓴다. 2026-11-17에 "1.1.x는 스토어 빌드로만"이라고 적은 것은 틀렸다. 경위는 [검토 발견 처리 기록](../../records/2026-11-17-06-review-findings-handling.md)과 [정정 기록](../../records/2026-11-18-01-release-branch-correction-and-worktree.md)에 있다.

**worktree 병렬 진행과 이미 나간 빌드(2026-11-18, Main 판단).** 이미 제출·승인된 스토어 빌드는 업로드한 바이너리라 브랜치나 worktree 분리의 영향을 받지 않는다. 꼬일 수 있는 것은 이미 나간 버전에 나중에 더 보낼 때다. `release/1.1`을 Ticket 01에서 가장 먼저 만들고 그 전에는 012 변경을 main에 병합하지 않는다. 잘못된 빌드로 OTA가 가는 일은 발행 스크립트의 runtime 대조가 막는다. 버전·빌드 번호는 브랜치마다 따로 올린다. 실제 사용자에게 바로 닿는 것은 Ticket 01의 Node 24 서버 배포뿐이라, 되돌리는 방법을 확인하고 배포 뒤 운영 앱으로 본다. worktree로 나눠도 함께 쓰는 자원(실기기와 preview 앱, EAS preview 채널, lockfile, 운영 서버, Metro 포트, `node_modules`)은 조율해야 한다. Main이 Ticket 01을 worktree 세션에서 시작하는 카드를 올려 두었지만, 01은 뒤에 다른 세션의 main 작업 트리에서 시작했다(아래). 카드가 남아 있는지는 확인하지 않았다.

**업데이트 확인에 쓰는 앱.** 02의 검증은 preview 번들 ID(`com.noline.dev`)로 한다. 확정한 02 구성에 들어 있어 채택으로 본다. 04·05에서 출시 빌드로 다시 확인할 때 preview 앱을 쓸지는 원문에서 정하지 않았고, Main 기본값으로 남아 Ticket 04에서 정한다.

## 2026-11-18 Ticket 01 진행

사용자가 "01 시작"이라고 해 Main이 이 세션의 main 작업 트리에서 진행했다. 이 구간에 다른 사용자 선택은 없고, 아래 선택은 Main이 실행하며 정했다. 결과 표는 [Ticket 01](../memory/tickets/01-preparation-baseline-and-node24.md#현재-상태와-실제-결과), 과정은 [진행 기록](../../records/2026-11-18-02-ticket01-baseline-node24-and-expo-install.md), 수치는 [기준선 원자료](../../source/ticket-01-baseline-2026-11-18.md)에 있다.
- **`release/1.1`을 원격에 올렸다.** 1.1.4 빌드 18의 `gitCommitHash`가 `d160c7b5`임을 EAS에서 확인하고 그 커밋에서 만들었다. 그 뒤 main 커밋은 문서뿐이다. Main이 "원격에 push할까요?"라고 묻고 사용자가 "push 해줘"라고 답해 push했다. 원격 `release/1.1`은 `d160c7b5`이고 로컬이 추적한다. main push가 아니라 Render 자동 배포와 무관하다.
- **`release/1.1`의 빌드·OTA를 확인했다.** 사용자의 "빌드·OTA 진행"에 따라 worktree `.claude/worktrees/012-release-1.1`에서 preview 빌드 `30c46ce2`(1.1.4/18)를 만들어 iPhone에 덮어 설치했고, 시험 업데이트 수신("붙어 보여")과 깨끗한 코드로의 복구("원래대로 돌아왔어")를 확인했다. production 빌드는 Main 판단으로 새로 만들지 않고, 같은 커밋의 1.1.4 빌드 `7033c2ba`와 production dry-run의 runtime 일치로 대신했다. 복구 발행 중 Metro가 `@repo/ui`를 찾지 못해 두 번 실패했고 watchman 초기화로 풀렸다. 경위는 [빌드·OTA 확인 기록](../../records/2026-11-18-03-release-1-1-build-and-ota-check.md)에 있다.
- **Node 24를 운영에 배포했다.** 사용자가 되돌리기 확인을 "니가 확인해"로 맡겨 Main이 Render 문서·대시보드를 읽었다(설정 변경 없음). 이전 배포마다 Rollback이 있어 되돌릴 수 있다. 사용자의 "병합·push 해줘"로 main을 `c60224ee`로 올려 push했고, 배포 `dep-dbum5fajnfac73bo70b0`가 `.nvmrc`의 Node 24.16.0으로 Live가 됐으며 `/api/health`가 200이고 약 10분 뒤(08:43Z)에도 200이었다. Main이 "운영 앱에서 로그인·여행 조회·동기화가 잘 되나요?"라고 묻자 사용자가 "잘 돼"라고 답했다(직전 안내는 "운영 앱(1.1.4)").
- **새 사실: 운영 서버는 `render.yaml`을 쓰지 않는다.** 대시보드의 서비스 `noline`은 `render.yaml`(`noline-server`)과 이름·빌드·시작 명령이 다르고 `NODE_VERSION`이 없다. 실제 Node는 `.nvmrc`가, 자동 배포는 대시보드의 Auto-Deploy On Commit(main)이 정한다. 경위는 [Render 확인·배포 기록](../../records/2026-11-18-04-render-check-and-node24-deploy.md)에 있다.
- **`render.yaml`을 지우고 Render 서술을 정정했다.** Main이 "지금 정리할까요?"라고 묻자 사용자가 "지금 정리해"라고 답했다. Blueprint 인스턴스가 하나도 없어 `render.yaml`은 어디에도 연결되지 않은 파일이었고, Main이 맞추거나 Blueprint로 바꾸는 대신 삭제를 골랐다(이미 실제와 어긋났고 Main 자신도 배포에 반영된다고 오해했기 때문, 결과는 사용자에게 사후에 알림). Main이 `apps/server/README.md` 배포 절을 대시보드 기준으로 다시 쓰고, `app-release-and-ota.md`의 `render.yaml` 서술과 루트 README·서버 README의 Node 20 표기를 고쳤다. 이 수정은 커밋 `a22873b1`에 있고, 사용자의 "push 해줘"로 2026-11-18 push했다. 경위는 [삭제 기록](../../records/2026-11-18-05-render-yaml-removal.md)에 있다.
- **Ticket 02의 첫 단계가 채워졌다.** 기기의 preview 앱이 1.1.4 빌드 `30c46ce2`다. 02는 이 앱에 데이터와 오프라인 지도를 넣는 것부터 한다.
- **기준선을 남겼다.** client test·server 전부·schema build는 통과하고, client lint(11 errors)·client typecheck(6 errors)·ui lint(25 errors)는 기존 실패다. 업그레이드 단계는 이 수치와 비교한다. 서버·schema는 Node 20에서도 결과가 같았다. 경로 가이드의 `pnpm client test --runInBand`는 pnpm 9.6.0에서 실패해 `pnpm --filter @apps/client run test --runInBand`로 실행했다.
- **설치 절차를 확정했다.** `npx expo install`의 실패 원인은 npx가 `.npmrc` 값을 환경변수로 넘기는 것이었다. `apps/client`에서 `pnpm exec expo install <패키지>`로 넣는다(공통 규칙 3).
- **Node 24 설정을 바꿔 로컬 브랜치에 커밋했다.** 사용자의 "커밋해줘"로 `7413b343`(설정 변경과 Railway 파일 삭제)과 이 Work 문서의 `4c83ef5f`를 만들었다. 뒤에 main에 병합·push했다(아래). 브랜치 `chore/012-node24`에 `.nvmrc`·`render.yaml`·tsup target·`@types/node`·`START_GUIDE.md` 변경이 있고, 변경 뒤 검사 결과가 기준선과 같다. Node 24 폴더에 pnpm 9.6.0·eas-cli 16.28.0을 설치했다. `eas.json`은 의도대로 20.18.1이다. 사용자가 Railway를 쓰지 않는다고 해("안 써, 지워") `nixpacks.toml`·`railway.json`도 같은 브랜치에서 지웠다(`7413b343`에 포함).

## 2026-11-18 Ticket 02 판정

사용자가 "Ticket 02 시작"을 골라 진행했다. 결과는 [Ticket 02](../memory/tickets/02-data-preservation-check-and-targets.md#현재-상태와-실제-결과), 과정은 [판정 기록](../../records/2026-11-18-06-ticket02-device-verification.md), 읽은 값은 [판정 원자료](../../source/ticket-02-verification-2026-11-18.md)에 있다.
- **판정은 모두 성공이다.** SDK 54·New Architecture·expo-sqlite 16·rnmapbox 10.3.18(native v11)만 넣은 판정용 앱을 1.1.4 preview 위에 덮어 설치했다. 기기 DB가 같은 경로에서 열리고 미전송 경비 1건이 `sync_queue`에 그대로였다. 도쿄 지도 pack은 v11 API의 목록에 있었고 저장 공간에 중복이 없었으며, 비행기 모드에서 지도가 그려졌다. 1.1.4도 이미 TileStore 방식이었다.
- **결정:** 멈춤 조건에 해당하지 않아 03으로 갈 수 있다. 04의 지도 대응은 필요 없다(한계: rnmapbox 10.3.18 한 조합, 기기 1대, 도시 하나). 테스트 도구는 RNTL 14가 jest-expo 54와 동작해 05의 첫 체크포인트로 먼저 옮긴다.
- **진행 방식:** 시뮬레이터로 하자는 사용자 제안에 Main이 시도했지만 1.1.4 Release 빌드가 운영 번들(`com.ham.noline`)로 설치됐고, 사용자가 실기기 쪽이 빠른지 묻자 Main이 실기기를 권해 중단했다("그럼 중지하고 하던대로 하자"). 운영 번들 앱은 시뮬레이터에 남아 있다. 이어 사용자의 `/device-access-setup` 요청으로 Main이 USB로 iPhone을 직접 조작했다(2026-11-06 DeviceKit 인스턴스 재사용). 로그인과 비행기 모드는 사용자가 했고, Main은 시스템 설정이라 비행기 모드를 바꾸지 않았다. Main이 실수로 1.1.4 앱을 한 번 종료했지만 데이터 준비 뒤라 영향은 없었다.
- **별도 발견:** 1.1.4의 `offline_cities`가 0행이다. 1.1.4가 행을 쓰지 않은 기존 문제 후보로 보며(원인 미확인), 어디서 다룰지 정하지 않았다.

## 2026-11-18 Ticket 03 진행 (SDK 52·53·54)

사용자의 "03 시작"으로 worktree `.claude/worktrees/012-sdk54`, 브랜치 `feat/012-sdk54`(main `ff51ecd9`에서 분기, push 안 함)에서 진행했다. 결과는 [Ticket 03](../memory/tickets/03-sdk54-legacy.md#현재-상태와-실제-결과), 과정은 [진행 기록](../../records/2026-11-18-07-ticket03-sdk52-53.md)에 있다.
- SDK 52(`8bfe21e1`)와 53(`668d4e73`) 모두 client test 920 통과, typecheck는 기준선 6 → 52에서 6, 53에서 5다. lint·server·schema는 기준선과 같고, 시뮬레이터 Release 빌드가 0 errors다.
- Ticket이 54에 둔 dev-menu patch 삭제, ui peer 전환·root react 삭제, drizzle-orm 0.45.4는 52에서 막혀 앞당겼다. React 19는 53에서 들어왔다. 최소 iOS는 52에서 15.1이 됐다.
- 새 임시 처리: Xcode 26 fmt consteval 우회 plugin, Jest `doNotFake: ['queueMicrotask']`.
- SDK 54(`3902bf7f`): client test 920 통과, typecheck 5, lint·server·schema 기준선과 같음, `--check` 통과(reanimated 제외). Sentry ~7.2, reanimated 3.19.5 고정, rnmapbox 10.1.45. 첫 테스트 실패는 예전 설치의 중첩 사본이라 깨끗한 재설치로 풀었다. tailwindcss-animate는 Ticket 서술과 달리 쓰이고 있어 남겼다.
- **fmt 우회는 SDK 54에서도 필요했다.** 빼고 빌드하자 같은 오류가 나 유지했고, SDK를 올릴 때마다 빼고 빌드해 본다는 기준으로 바꿨다. 04·05에도 걸리는 조건이며, EAS(Xcode 26.2)에서 필요한지는 03 끝 EAS preview에서 본다.
- 사용자가 "예상과 달라진건 없지?"라고 묻자 Main은 출시 계획(1.2.0·1.3.0)과 Ticket 구성은 그대로이고 순서와 임시 처리가 달랐다고 답했다. 목록은 [SDK 54·달라진 것 기록](../../records/2026-11-18-08-ticket03-sdk54-and-plan-deviations.md#계획에서-달라진-것)에 있다.

## 2026-11-18–19 Ticket 03 마무리

과정은 [EAS·iPad 확인 기록](../../records/2026-11-19-01-ticket03-eas-and-ipad-verification.md), 완료 조건 대비는 [Ticket 03](../memory/tickets/03-sdk54-legacy.md#현재-상태와-실제-결과)에 있다.
- `7be8f22f`로 react를 한 벌로 맞췄고, `35b21093`으로 EAS `base.node` 24·루트 `engines`·루트 `client:expo-check`를 넣고 `apps/client/CLAUDE.md`의 test 명령과 설치 절차를 고쳤다(main 병합 전). Ticket 01부터 남아 있던 두 Project·가이드 후보가 이것으로 처리된다.
- EAS preview `f8e97f99`가 fmt 우회가 적용된 채 Xcode 26.2에서 성공했다. Node 24 사용은 로그로 확인하지 않았다. 이 빌드로 `release/1.1`의 preview 채널 OTA 시험은 막혔다.
- 사용자가 iPad로 하자고 했고 EAS 월간 빌드 제한(사용자 말 15회, 11월 16건)에 가까워 "아이패드로 로컬 빌드해서 진행해"로 정했다. iPad Air 4를 EAS에 등록해 1.1.4 preview `2814ad7f`를 다시 빌드하고, SDK 54는 `eas build --local`로 만들었다. 이 과정에서 Main의 `brew install fastlane`이 Homebrew ruby를 올려 CocoaPods가 깨졌고, `brew reinstall cocoapods`로 복구해 1.17.0이 됐다.
- iPad에서 1.1.4 데이터 위에 SDK 54를 덮어 설치해 로그인 유지, 데이터·미전송 변경 보존, 오프라인 시작·조회·변경, 오프라인 지도, 경로 표시, 미전송 경비 두 건의 서버 전송을 확인했다. Apple 로그인과 iPhone에서의 SDK 54는 보지 않았다. 시험 경비 두 건이 계정의 도쿄 여행에 올라갔다.

## 2026-11-19 Ticket 04 코드 작업

결과는 [Ticket 04](../memory/tickets/04-new-architecture-and-1-2-0.md#현재-상태와-실제-결과), 과정은 [04 코드 작업 기록](../../records/2026-11-19-02-ticket04-newarch-code-and-review.md)에 있다.
- **앞당긴 이유:** 사용자가 "심사 기다려야 한다는거지"라고 묻자 Main은 심사를 기다리는 것은 Ticket 01의 두 항목뿐이고 04 코드 작업은 지금 할 수 있으며 1.2.0 스토어 빌드·제출만 12월 갱신을 기다린다고 답했다. 사용자가 "그래 쭉 해봐 다시"라고 했다.
- **브랜치 `feat/012-newarch`**(worktree `.claude/worktrees/012-newarch`, main `307ae37b`에서 분기): `6c6b5524` New Architecture·reanimated 4.1.7·worklets 0.5.1·rnmapbox 10.3.18, `beee6373` fmt 우회 삭제(New Architecture에서는 fmt를 미리 빌드된 의존성으로 받아 필요 없음), `fb73bb25` 오프라인 지도 스타일을 streets-v11 상수로 고정.
- **검사·시뮬레이터:** Jest 923 통과, typecheck 4, lint 기준선과 같음. 시뮬레이터 Release(New Architecture)에서 기존 데이터, 일정 지도, 내 위치 버튼, 이전 빌드의 오프라인 지도(161.2 MB), 경비·달력·스타일 정상. 비행기 모드·실기기·1.1.4 덮어 설치는 미확인.
- **독립 검증:** `StyleURL.Street`가 Mapbox v11에서 streets-v12로 바뀌어 streets-v11 pack과 어긋나는 문제를 찾았고, 수정 뒤 재검증에서 충족했다.
- **기존 문제(012에서 고치지 않음):** `createPack`이 다운로드 시작 직후 resolve해 다운로드 완료 전에 `mapDownloaded = true`가 기록될 수 있다. 2026-11-19 사용자가 다른 Ticket에 이미 기록돼 있으면 012에서는 넘어가자고 했다. Main이 처음 기록된 곳으로 Work 003 Ticket 05를 확인했으나, 사용자가 예외처리 Workspace인 Work 008로 하자고 해 008로 넘기고 008 현재 상태에 넘겨받은 과제로 추가했다(008에는 원래 기록이 없었다). Project 지도 기준에는 현재 동작으로 적혀 있다. 04 완료 조건("준비됨인데 빈 지도 없음")은 업그레이드의 영향(스타일·pack 호환, 옛 pack 처리)으로만 본다. 경위는 [소관 결정 기록](../../records/2026-11-19-03-createpack-ownership-decision.md)에 있다. 그 밖에 pack 크기·타일 수가 늘 0·null로 저장되는 것, 진행률 NaN 가능성은 저우선으로 남아 있고 (a)와 같은 `download.ts` 경로지만 소관은 정하지 않았다.
- **iPad:** USB를 뺀 상태에서는 조종할 수 없다(mobilecli는 USB 기기만 찾음). 무선 제어는 따로 설정이 필요하며 지금은 하지 않았다.

## 2026-11-19 Ticket 04 iPad 실기기 확인과 일정 지도 수정

결과는 [Ticket 04](../memory/tickets/04-new-architecture-and-1-2-0.md#현재-상태와-실제-결과), 과정은 [iPad 확인·지도 수정 기록](../../records/2026-11-19-04-ticket04-ipad-verification-and-schedule-map-fix.md)에 있다.
- **덮어 설치:** iPad에 1.1.4 preview를 새로 깔아 도쿄 여행을 오프라인 활성화(지도 196.3 MB)하고 비행기 모드에서 미전송 경비를 만든 뒤, `fb73bb25`의 New Architecture 로컬 preview를 덮어 설치했다. 로그인·데이터·미전송 경비·오프라인 지도가 남았고 v11이 v10 pack을 읽었다. 마지막에 서버 기준 합계로 두 시험 경비가 서버에 간 것을 확인했다.
- **찾아서 고친 것:** 일정 Mapbox 지도에서 마커 번호가 빠지고 선택 일정 대신 그날 전체 범위로 열렸다. `MarkerView`와 카메라 위치 규칙으로 고쳤고, 독립 검증자가 찾은 첫 수정의 회귀와 예전부터 있던 재렌더 되돌림도 함께 고쳐 한 커밋으로 남겼다(`129e5321`을 테스트 파일 prettier 수정으로 고쳐 써 `c5fdbbdc`, 제품 코드는 실기기 빌드와 같음). 최종 코드에서 Jest 928 통과, typecheck 4, lint 11(기준선). 마지막 빌드를 비행기 모드 실기기에서 다시 봤다.
- **원인 모름:** 비행기 모드 첫 콜드 스타트에서 검은 화면이 1분 가까이 한 번 이어졌고 다시 만들지 못했다.
- **작업 환경:** 디스크가 차서(남은 124 MB) 첫 로컬 빌드가 실패해 Noline의 Xcode DerivedData만 약 37 GB 지웠다. USB를 다시 꽂은 뒤 끊긴 iPad DeviceKit 서버는 다시 띄워 이 세션의 백그라운드 작업으로 썼다(2026-11-19 사용자의 "제어 서버 꺼줘"로 종료, 아래).
- **지금 기기:** iPad 도쿄 여행은 온라인 전용, Noline Dev는 `c5fdbbdc`와 제품 코드가 같은 빌드다. 시험 경비 JPY 400·500이 계정의 도쿄 여행에 있다.

## 2026-11-19–20 기록 커밋, 제어 서버 종료, Ticket 04 main 병합

결과는 [Ticket 04](../memory/tickets/04-new-architecture-and-1-2-0.md#main-병합-2026-11-20), 과정은 [main 병합 기록](../../records/2026-11-20-01-ticket04-main-merge-and-push.md)에 있다.
- **기록 커밋:** 사용자의 "012만 커밋"으로 이 Work의 기록 파일 6개만 main에 `074ff167`로 커밋했다. personal 4개와 Work 006 2개는 넣지 않았다.
- **제어 서버 종료:** 사용자의 "제어 서버 꺼줘"로 iPad DeviceKit 제어 서버(이 세션의 백그라운드 작업)를 2026-11-19 종료했다. 다시 조작하려면 USB를 연결하고 서버를 다시 띄운다.
- **남은 일 설명:** 같은 발화의 "그다음 작업뭐 남은거지?"에 Main은 지금 할 수 있는 것(04 병합, 실기기 미확인 일부, Ticket 01의 남은 일)과 12월 갱신을 기다리는 것(1.2.0 출시, Ticket 05)으로 나눠 답했다.
- **main 병합·push:** 사용자가 2026-11-20 "병합하고 push"를 골랐다. 머지 커밋 `6d34c44b`의 코드가 `c5fdbbdc`와 같다는 diff 대조로 병합 뒤 검사 재실행을 대신했고, lockfile에서 `apps/server` importer가 바뀌지 않은 것을 확인한 뒤 `195b62ee..6d34c44b`를 push했다. push 직후부터 20초 간격으로 8분간(2026-11-20 15:46:37–15:54:26 KST) health가 24번 모두 200(0.23–0.61초)이었고 끊긴 구간은 없었다. 다만 health 응답에 커밋·버전 정보가 없고 Render 대시보드·GitHub deployment 상태는 보지 않아, `6d34c44b` 배포가 실제로 Live가 됐는지는 확정하지 못했다. 서버 코드와 lockfile의 `apps/server` importer가 바뀌지 않아 배포 여부와 무관하게 서버 동작은 같다고 본다(Main 판단).
- **병합 뒤 OTA:** main push는 OTA 발행이 아니다. main의 runtime은 production의 1.1.4와도, preview 채널 최신인 SDK 54 Legacy `f8e97f99`와도 달라 main에서의 발행은 runtime 대조에서 거부된다고 본다(Project 출시 기준에서 읽은 것, dry-run 안 함). 1.1.4 OTA·핫픽스는 `release/1.1`에서만 낸다. 상세는 [Ticket 04](../memory/tickets/04-new-architecture-and-1-2-0.md#main-병합-2026-11-20)에 있다.

## 2026-11-20 출시 기준 반영, iPad 남은 확인, 1.1.4 출시, 정리

결과는 [Ticket 04](../memory/tickets/04-new-architecture-and-1-2-0.md#현재-상태와-실제-결과)와 [Ticket 01](../memory/tickets/01-preparation-baseline-and-node24.md#현재-상태와-실제-결과), 과정은 [iPad 남은 확인·정리 기록](../../records/2026-11-20-02-ipad-remaining-checks-release-confirmed-and-cleanup.md)에 있다.
- **기록·출시 기준 커밋:** 사용자의 "012만 커밋"으로 병합 기록을 `a44f1993`으로 커밋했다. 직전 기록이 넘긴 Project 출시 기준의 낡은 문장은 사용자의 "고쳐줘"로 Main이 고쳐 release 브랜치 OTA 절을 새로 넣었고, "커밋"으로 `69bfa8eb`에 넣었다. 둘 다 push하지 않았다.
- **"쭉 다해줘":** Main이 남은 일(Render 확인, iPad로 볼 수 있는 04 확인, Ticket 01 마무리, main preview 빌드, 브랜치·worktree 정리)을 제시하자 사용자가 "쭉 다해줘"라고 했다. Main은 정리까지 포함한 승인으로 받았다.
- **Render:** 대시보드가 로그인 화면이라 `6d34c44b` Live 여부는 여전히 확인하지 못했다.
- **iPad 확인:** 제어 서버를 다시 띄워, 도쿄 여행 2/2에 좌표 없는 일정과 시부야역 일정을 만들고 오프라인 활성화했다. 온라인 검색 결과를 띄운 뒤 비행기 모드로 바꿔 `OfflineMapView`가 오프라인 지도·마커·안내를 그리는 것을, 2/1→2/2 전환에서 카메라가 이전 날에 남지 않는 것을 봤다. 시험 일정은 지우고 오프라인을 해제했으며 제어 서버는 종료했다. 마커 번호가 좌표 있는 일정 기준이라 카드 순서와 어긋나는 것은 1.1.4와 같은 기존 동작이라 고치지 않았고, 해제 직후 이전 서버 목록이 보인 것은 관찰만 했다.
- **1.1.4 출시:** App Store 조회로 1.1.4 출시를 확인했다. 점검표 6항목은 iPhone 미연결과 로그인 때문에 실행하지 않았다. Main은 iPad 1.1.4 preview 기준선으로 대부분이 덮이고 운영 앱의 Google·Apple 로그인과 iPhone(iOS 27) 동작이 남는다고 봤고, 인정 여부는 사용자 결정이다.
- **main preview 빌드:** 이번 달 EAS 빌드가 이미 16건(사용자가 말한 월 한도 15회)이고 1.2.0 전까지 필요하지 않아 Main 판단으로 12월로 미뤘다.
- **정리:** 미커밋 변경이 없고 env 파일이 main과 같음을 확인한 뒤 worktree `.claude/worktrees/012-sdk54`·`012-newarch`를 지우고, main에 병합된 `feat/012-sdk54`·`feat/012-newarch`·`chore/012-node24`·`docs/012-sdk-upgrade-split`을 지웠다. `release/1.1`과 worktree `012-release-1.1`은 1.1.x OTA 경로라 남겼다.

## 남은 일과 다음 행동

**아직 하지 않은 것:**
- Ticket 01의 실기기 점검표. iPad 1.1.4 preview 기준선을 점검표 근거로 인정할지 사용자가 정한다. 인정하면 운영 앱의 Google·Apple 로그인과 iPhone(iOS 27)에서의 1.1.4 동작만, 아니면 6항목 전체를 iPhone에서 본다(iPhone 연결과 사용자 로그인 필요). 1.1.4 심사 결과는 2026-11-20 출시로 확인했다
- 02의 남은 것: 목표 버전 표 전체의 확정 여부(rnmapbox 10.3.18과 npm peer만 확인). 기기는 사용자가 "진행에 도움되는 쪽으로 니가 알아서 해"라고 맡겨 Main이 정했다: 판정용 앱(빌드 91)을 그대로 두고(시험 앱은 03 끝의 preview 빌드로 덮어 설치하고, 04의 기존 사용자 업데이트 확인은 1.1.x를 깨끗하게 다시 설치해 시작한다), DeviceKit 제어 서버는 2026-11-18 종료했다
- 1.1.4 `offline_cities` 0행의 원인 확인과 다룰 위치
- 04·05의 업데이트 확인 방식 결정(Ticket 04)
- ESLint 9는 SDK 58이 요구할 때만 넣는다는 Main 기본값의 확인
- Ticket 04의 남은 실기기 확인(iPhone·Android·Apple 로그인)과, 이번 iPad 확인(2026-11-19·20)을 04의 점검표 6항목으로 볼지의 판단
- Ticket 04의 main preview 빌드(2026-11-20 Main 판단으로 12월로 미룸, 그 전에는 main에서 preview OTA 시험 불가), 1.2.0 스토어 빌드·제출·OTA 확인과 `release/1.2`(12월 갱신 뒤), 그 뒤 Ticket 05 전체
- 소관을 정하지 않은 관찰 두 가지: 일정 Mapbox 지도의 마커 번호가 좌표 있는 일정 기준이라 카드 순서와 어긋나는 기존 동작(1.1.4와 같음, 012에서 고치지 않음), 오프라인 해제 직후 이전 서버 목록이 잠시 보이는 현상(원인·1.1.4 동일 여부 미확인). 상세는 [Ticket 04](../memory/tickets/04-new-architecture-and-1-2-0.md#main-병합-2026-11-20)의 (d)·(e)

**중요한 미확인:**
- 02의 판정은 rnmapbox 10.3.18 한 조합, 기기 1대, 도시 하나로 본 것이다. 04·05의 출시 빌드 덮어 설치에서 다시 확인한다
- 앱 테스트 78개를 RNTL 14로 옮기는 비용, jest 30 조합(02는 jest 29.7로 확인)
- nativewind의 SDK 58·RN 0.88 지원, @rn-primitives·react-native-calendars의 React 19·New Architecture 공식 지원(npm peer에는 제한 없음, 03·04 빌드에서 확인)
- 2025-11 Mapbox 실패의 원인(커밋에 기록 없음)
- SDK 51 앱의 Node 24 EAS 빌드, `tsx`(dev 서버)의 Node 24 동작. Render 배포는 2026-11-18 Node 24.16.0으로 Live·health 200과 운영 앱 동작을 확인했다
- 병합 전 운영의 실제 Node 버전(`.nvmrc`의 20.18.1로 추정, 무료 플랜 로그 범위 때문에 로그 줄은 못 찾음)
- Render의 실제 PostgreSQL 버전
- 이미 설치된 SDK 51 빌드가 iOS 27에서 동작하는지(01의 1.1.4 실기기 점검이 근거가 된다)
- Apple 요건의 정확한 날짜(4월로만 공지)
- 대화형 셸에서의 `pnpm exec expo install` 동작(확인은 `CI=1` 비대화형으로 했다)

**다음 행동:** 04의 코드는 main에 들어갔고(`6d34c44b`), iPad로 볼 수 있는 확인과 브랜치·worktree 정리는 2026-11-20 끝났다. 지금 남은 것은 사용자가 움직여야 하는 것이 대부분이다.
- **Render 확인(사용자):** `6d34c44b` 배포가 Live인지 대시보드에서 본다. 대시보드는 로그인이 필요해 Main이 보지 못했다. push 뒤 8분간 health는 계속 200이었고 서버 코드는 바뀌지 않아 급하지 않다.
- **Ticket 01 점검표(사용자 결정):** iPad 1.1.4 preview 기준선을 점검표 근거로 인정할지 정한다. 인정하면 운영 앱(App Store Noline 1.1.4)의 Google·Apple 로그인과 iPhone(iOS 27)에서의 1.1.4 동작만 남고, 아니면 6항목 전체를 iPhone에서 본다. 둘 다 iPhone 연결과 사용자 로그인이 필요하다. 운영 앱으로 하면 시험 앱 재설치가 필요 없고 preview에서 실패할 수 있는 Apple 로그인도 확인된다(Main 판단, 2026-11-18).
- **Ticket 04의 iPhone·Android·Apple 로그인:** 기기·계정이 필요하다. iPhone의 Noline Dev 자리에는 판정용 앱(빌드 91)이 있고 미전송 시험 경비가 DB에 남아 있다(판정용 앱은 동기화하지 않아 온라인이어도 보내지 않는다). 1.1.4 preview(`30c46ce2`)를 다시 설치하고 온라인이 되면 그 경비가 서버로 간다. 로컬 빌드(`eas build --local`)가 EAS 월간 횟수를 아끼는 기본 후보다. 이번 iPad 확인을 04의 점검표 6항목으로 볼지도 사용자와 정한다.
- **push 시점:** `a44f1993`·`69bfa8eb`와 그 뒤 기록 커밋은 push하지 않았다. main push는 문서만이어도 Render 재배포를 일으키므로 다음 서버 변경과 함께 올려도 된다(Main 안내).

12월 갱신 뒤에는 Ticket 04의 1.2.0 스토어 빌드·제출로 간다. Apple Developer 멤버십 갱신(2026-12-18, 사용자가 직접)과 배포 인증서·프로비저닝 갱신(2026-12-30 만료)이 먼저다. 11월에 미룬 main preview 빌드도 이때 EAS 횟수를 보고 만든다. 빌드는 EAS 월간 횟수를 보고 EAS와 로컬 빌드 중 고르고, 03에서 넘긴 확인(EAS 빌드 실기기 설치, Node 24 로그, Apple 로그인, iPhone 덮어 설치)과 1.2.0 빌드의 OTA·덮어 설치를 함께 본다. 그 사이 1.1.4 사용자에게 OTA나 핫픽스를 내야 하면 main이 아니라 `release/1.1`에서 낸다. main은 이제 SDK 54·New Architecture라 production 1.1.4와 runtime이 달라 발행 스크립트가 거부한다(Ticket 04의 [병합 뒤 OTA 발행 주의](../memory/tickets/04-new-architecture-and-1-2-0.md#main-병합-2026-11-20)). main에서 preview OTA를 시험하려면 main에서 EAS preview 빌드를 새로 만든다.

기기 조작이 다시 필요하면 DeviceKit 제어 서버를 `~/Documents/Codex/2026-11-06/new-chat/work/` 에서 `xcodebuild test-without-building -xctestrun iphone-control/build/Build/Products/devicekit-ios_iphoneos26.5-arm64.xctestrun -destination id=<UDID> -only-testing:devicekit-iosUITests/DeviceKitUITests/testRunAutomation -collect-test-diagnostics never`로 띄운다(iPad는 `iphone-control/build-ipad`의 xctestrun, "Server is ready" 확인 뒤 `iphone-control/node_modules/.bin/mobilecli`로 관찰·터치). 운영 서버에 문제가 보이면 Render 대시보드의 이전 배포 Rollback으로 되돌린다(자동 배포가 꺼지므로 다시 켠다). 발행 스크립트의 재설치 뒤 watchman 문제를 스크립트·Project 출시 기준에 반영할지도 Main이 판단한다. `createPack` 완료 시점 문제는 2026-11-19 결정으로 Work 008에 넘겨 012에서 고치지 않는다.

**작업 트리 주의:** main 작업 트리는 다시 main 브랜치다. Node 24 첫 운영 배포는 `c60224ee`다. 그 뒤의 기록·정정 커밋 `1174c5c1`, `e10c8c4f`, `a22873b1`, `b38729b4`는 사용자의 "push 해줘"로 2026-11-18 push했고, Render가 `b38729b`로 다시 배포해 Live가 됐다(health 200, 08:58Z). main push는 문서 변경이어도 Render 재배포를 일으킨다. 그 뒤의 Work 기록 커밋들과 Ticket 03 머지 `ae97809e`는 사용자의 "push 해줘"로 2026-11-19 `195b62ee`까지 push했고, Render 재배포 뒤 health 200을 확인했다(05:38Z). 그 뒤의 기록 커밋 `307ae37b`, `6658ee45`, `faab0efc`, `074ff167`과 Ticket 04 머지 `6d34c44b`는 사용자의 "병합하고 push"로 2026-11-20 함께 push했다(`195b62ee..6d34c44b`). 그 뒤의 `a44f1993`(Work 기록)과 `69bfa8eb`(Project 출시 기준)는 push하지 않아 main이 origin보다 앞서 있다. 다음 미커밋 수정은 이 Work와 무관한데 브랜치 전환으로 함께 따라왔다. `7413b343`·`4c83ef5f`에는 넣지 않았고 작업 트리에 그대로 있다. 이후 이 Work의 커밋에도 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state

worktree `.claude/worktrees/012-release-1.1`(`release/1.1`, env 파일 3개 복사, `node_modules` 설치됨)은 1.1.x OTA·핫픽스를 내는 경로라 남긴다(2026-11-20 Main 판단, Project 출시 기준의 [release 브랜치 절](../../../../../project/guidance/app-release-and-ota.md#이미-낸-버전의-수정은-release-브랜치에서-낸다)). 다른 012 worktree(`012-sdk54`, `012-newarch`)와 병합된 브랜치 `feat/012-sdk54`·`feat/012-newarch`·`chore/012-node24`·`docs/012-sdk-upgrade-split`은 2026-11-20 지웠다.

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
