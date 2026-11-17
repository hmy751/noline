# 현재 상태와 다음 행동

2026-11-17 오후 6시경, 두 번째 세션을 마무리한 시점의 상태다. Ticket 01–03의 작업은 끝났고, 1.1.4(빌드 18)는 심사 대기 중이다.

**지금 어디인가:** OTA를 넣은 1.1.4가 "심사 대기 중"이다. 실기기에서 OTA 받기·오프라인 시작·롤백·runtime 분리를 확인했다. 위험한 발행을 막는 장치(발행 스크립트와 hook)도 만들었다. 011 작업은 1.1.4를 위해 main에 병합됐다. 출시·OTA 기준은 Project의 [앱 변경을 사용자에게 내보낼 때의 기준](../../../../../project/guidance/app-release-and-ota.md)에 반영했고(Ticket 03), 방지 규칙도 거기서 확정했다. 남은 것은 바깥 결과를 확인하는 일이다. 심사 결과와 ITMS-90068 확인이 남았다. 첫 production OTA는 실제 수정이 생길 때 그 발행으로 확인하고, Codex hook 확인은 하지 않기로 했다.

## 된 것

경위와 근거는 각 기록에 있다. 여기서는 지금 판단에 필요한 결과만 둔다.

**Ticket 01: 도입과 1.1.4**
- **설치·설정:** `expo-updates`·`expo-build-properties`를 넣고 dev-client를 SDK 51용 4.0.29로 내렸다. `app.config.js`에 fingerprint runtime, `updates.url`, `fallbackToCacheTimeout: 0`, iOS 15.0을 넣었다. `eas.json`의 preview·production에는 `channel`과 `environment`를 넣었다.
  - Xcode 26 판단 지점은 `expo-dev-menu` 한 줄을 pnpm patch로 고쳐 통과했다. 사용자는 "됐으면 진행해 계속 012 는 다른데서 할거고"라고 답했다.
  - 경위: [착수 기록](../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)
- **발행 환경:** 발행은 채널과 같은 이름의 EAS environment로 한다. fingerprint가 환경값에 따라 달라지기 때문이다. EAS preview 환경을 채웠고, Google iOS client처럼 번들 ID에 묶인 값은 환경별로 나눴다.
- **preview 실기기 확인:** iPhone 14 Pro에서 완료 판단 1–4를 사용자가 확인했다.
  - 첫 빌드는 오래된 로컬 `node_modules` 때문에 runtime이 어긋나 실패했고, 깨끗이 다시 설치해 맞췄다.
  - 기록: [실기기 확인](../../records/2026-11-17-02-preview-build-and-device-ota-check.md)
- **preview 앱 Google 로그인:** preview가 운영용 iOS client를 공유해 막혔던 것을 고쳤다. 이 Work 밖의 서버 변경이 함께 들어갔다.
  - 서버가 iOS client 목록을 받게 고쳐 `99235878`로 커밋했다.
  - Render의 `GOOGLE_IOS_CLIENT_ID` 값도 바꿨다.
  - 기록: [Google 로그인](../../records/2026-11-17-03-preview-google-login-fix.md)
- **Sentry 소스맵:** 로컬 토큰으로 올린다(토큰은 gitignore 대상 `.env.production`). preview에서 OTA 번들 오류가 원래 소스 위치로 풀리는 것을 확인했다. 기록: [소스맵](../../records/2026-11-17-04-commit-and-ota-sourcemap.md)
- **1.1.4(빌드 18) 제출:**
  - 사용자가 "로그인했어 main 병합하고 빌드 진행해"로 병합을 골랐다. 원래 계획은 "011이 다 끝나면 병합"이었다.
  - 브랜치를 main에 fast-forward하고 버전 커밋 `d160c7b5`를 push했다.
  - production 빌드 `7033c2ba…`(runtime `0367b72f…`)를 만들어 올렸다.
  - 업데이트 안내를 넣고 자동 출시로 심사에 제출했다. 1.1.3은 그 전에 "배포 준비됨"(통과·공개)이었다.
  - 기록: [1.1.4 제출](../../records/2026-11-17-10-release-1-1-4-submission.md)

**Ticket 03: Project 반영**
- 새 guidance [앱 변경을 사용자에게 내보낼 때의 기준](../../../../../project/guidance/app-release-and-ota.md)을 만들었다. 두 출시 경로, runtime 조건, 오프라인 시작, 확정한 OTA 규칙, 서버 먼저 배포, 발행 절차·되돌리기, 스토어 절차, preview 시험 앱, 현재 범위가 들어 있다.
- Project README, guidance 목록, API 계약, 저장·동기화 기준, 구조 지도, `apps/client/CLAUDE.md`, `START_GUIDE.md`에서 이 가이드로 연결했다.
- 독립 읽기 확인에서 나온 결함(이전 버전 OTA 오류 등)을 고쳤다.
- 기록: [Project 반영](../../records/2026-11-17-11-project-reflection.md)

**Ticket 02: 방지 장치**
- **발행 스크립트 `pnpm ota:publish`(`apps/client/scripts/ota/`):** 순서는 깨끗한 재설치 → 환경값 대조 → runtime 대조 → `eas update` → 소스맵 업로드다. OTA로 내면 안 되는 변경도 검사한다. DB 구조는 거부, 서버 계약은 `--server-checked` 확인, env 이름은 대조한다.
- **hook `.agents/hooks/block-direct-eas-update.py`:** AI 도구가 `eas update`를 직접 치면 막는다. Claude에서는 확인했다.
- **규칙:** Main이 골랐고, 사용자는 그대로 두되 다른 context와 연결해 정하자고 했다. Ticket 03에서 Project 가이드에 채택된 규칙으로 옮겨 확정했다.
- **production dry-run:** 1.1.4 빌드 뒤 통과했다(runtime `0367b72f…`, 발행 없음).
- 기록: [발행 스크립트](../../records/2026-11-17-05-ota-publish-script.md), [방지 장치](../../records/2026-11-17-06-ota-guard-change-env-hook.md), [재구성](../../records/2026-11-17-07-ota-script-reorganization.md), [hook 이동](../../records/2026-11-17-08-hook-to-agents-hooks.md), [규칙 유지](../../records/2026-11-17-09-keep-rules-and-link-project.md)

## 새로 알게 된 운영 조건

- **runtime은 버전과 빌드 번호마다 다르다.** 이 구성의 fingerprint는 앱 버전과 iOS buildNumber를 포함한다.
  - 1.1.4(18)의 production runtime은 `0367b72f…`, preview runtime은 `92c898f2…`다.
  - OTA는 버전·빌드 번호가 같은 빌드에만 간다. 발행 스크립트는 그 채널 최신 빌드와 같은 runtime에만 발행한다. 그래서 다음 버전 빌드가 생기면 이전 버전 사용자에게만 OTA를 보낼 길이 없고, 그 사용자는 스토어 업데이트로 고친다. 앞서 "이전 버전 코드 트리에서 발행하면 된다"고 적은 것은 틀렸다([Project 반영 기록](../../records/2026-11-17-11-project-reflection.md)).
  - 기존 preview 빌드 `f610d9b5…`(1.1.3/17)는 이제 main과 runtime이 다르다. preview 시험에는 새 preview 빌드가 필요하다.
- runtime은 `apps/client/package.json`의 scripts와 환경값에도 영향을 받는다. 발행 전에는 깨끗한 재설치가 필요하다. 발행 스크립트가 이를 강제한다.

## 다음 행동

1. **1.1.4 심사 결과를 확인한다.** 통과하면 자동으로 공개된다. 거절되면 그 대응이 먼저다. ITMS-90068 경고 메일이 왔는지 사용자에게 확인한다(완료 판단 7). Gmail 커넥터 연결이 끊겨 Main이 보지 못했다. 심사를 통과하고 경고가 없으면 이 Work를 완료로 닫는다.
2. **첫 production OTA는 실제 수정이 생길 때 그 발행으로 확인한다.** 사용자가 정했다: "그래 실제 수정 생기면 그때 하자". 확인만을 위해 내용 변화 없는 업데이트를 발행하지 않는다. `pnpm ota:publish production --dry-run`은 이미 통과했다. 그 발행 때 번들 환경값과 Sentry 소스맵을 확인하고, 그 결과로 완료 판단 5의 production 쪽을 닫는다. 이 확인은 Work 011을 닫는 조건에 넣지 않는다.
3. **Codex hook 확인은 하지 않는다.** 사용자가 "훅은 넘기고"라고 했다. Codex에서는 확인하지 않은 상태로 두며, 이 사실은 [공통 hook README](../../../../../../.agents/hooks/README.md)와 Project 가이드에 적혀 있다.

완료 판단 1–4·6·8은 충족했다. 7은 심사 결과와 경고 메일이 남았다. 5의 production 쪽은 위 2의 조건으로 미뤘다. Ticket 03의 Project 변경과 기록은 커밋해 main에 push했다(`c068324e`, `046279a4`).

## 중요한 미확인

- 1.1.4 심사 결과, ITMS-90068 경고 여부
- Render가 main push(`d160c7b5`)로 자동 배포를 돌렸는지. 서버 코드는 바뀌지 않았다.
- Codex에서의 hook 동작(확인하지 않기로 함)
- preview 앱(`com.noline.dev`)의 Apple 로그인. 서버 `APPLE_CLIENT_ID`가 운영 번들이라 실패할 수 있으며, 이번 범위 밖이다.
- Expo 무료 플랜의 업데이트 한도, iOS 13–14 사용자 수

## 브랜치와 커밋

011 작업은 main에 들어갔다(2026-11-17).
- `feat/011-expo-updates`를 main에 fast-forward 병합했다(main `92ca714d`).
- 그 위에 버전 커밋 `d160c7b5` "chore(client): 1.1.4 빌드 18 배포 준비"를 올리고 origin에 push했다(`99235878..d160c7b5`).
- 브랜치의 주요 커밋은 다음과 같다.
  - `3592a538`: expo-updates 설정
  - `ceb7a7b7`: 발행 스크립트
  - `4c00153e`: 변경 검사·재구성
  - `49fd28a3`: 공통 hook
  - 그 밖은 Work 기록 커밋이다.
- 앞선 기록의 `233e0a17`·`212040c2`는 이력 정리로 지금 `ba06e62a`·`bb459027`이다.
- 1.1.4 제출 기록은 `3fb997d0`으로 커밋해 main에 push했다(`d160c7b5..3fb997d0`).
- 아직 커밋하지 않은 것: Ticket 03의 Project 변경(`context/project/` 아래 새 가이드와 연결 문서들, `apps/client/CLAUDE.md`, `START_GUIDE.md`), 이 Work 문서 갱신과 [Project 반영 기록](../../records/2026-11-17-11-project-reflection.md), workspaces 목록의 011 줄.

저장소 밖에 반영된 것도 있다.
- EAS 환경 변수
- Render의 `GOOGLE_IOS_CLIENT_ID`
- Expo preview 채널의 시험 업데이트(최신은 `0a0a6db0…`, runtime `54a96787…`)
- Apple: 등록 기기 1대, ad hoc 프로필, App Store Connect의 1.1.4 버전과 제출

목록과 ID는 [output 색인](../../output/index.md)에 있다.

## 작업 트리 주의

다음 미커밋 수정은 이 Work와 무관하다. 011을 커밋할 때 함께 올리지 않는다.
- `context/personal/experience/*` 4개
- Work 006의 Ticket 14·state
- `.pnpm-store/`, `.claude/worktrees/`(추적하지 않는 폴더)

기본 Workspace와 host 세션 선택은 바꾸지 않았다.
