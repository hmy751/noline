# 011 — expo-updates 작업을 이어갈 때

1.1.4(빌드 18)가 App Store "심사 대기 중"이다(2026-11-17). OTA 도입, preview 실기기 확인(완료 판단 1–4), 방지 장치(발행 스크립트와 hook)는 끝났다. 011 작업은 1.1.4를 위해 main에 병합됐다. OTA는 손으로 `eas update`를 치지 말고 `pnpm ota:publish`(`apps/client/scripts/ota/`, 규칙은 `rules.mjs`)로 낸다. AI 도구가 직접 치면 `.agents/hooks/`의 hook이 막는다. runtime은 앱 버전과 빌드 번호마다 다르다. OTA는 같은 버전·빌드 번호의 스토어 빌드에만 가고, 발행 전에는 깨끗한 재설치가 필요하다. 남은 일은 심사 결과와 ITMS-90068 확인, 공개 뒤 production OTA 경로 확인, Project 반영(Ticket 03, 방지 규칙 확정 포함)이다.

**먼저 읽는다.** 이것들이 빠지면 확인 전의 설정을 완료로 착각하거나, 조용히 전달되지 않는 발행을 하거나, 제품 약속을 깨는 업데이트를 내게 된다.
- [현재 상태](current/state/index.md): 된 것, 다음 행동의 순서와 아직 정하지 않은 순서, 브랜치·커밋 상태와 커밋하면 안 되는 무관한 파일
- [Ticket 01](current/memory/tickets/01-expo-updates-and-ios15-build.md): 단계별 결과, 남은 단계 6·7, 패치와 로컬 `ios/`·locale 주의
- [구별해야 할 사례](current/memory/spec/02-behavior-and-cases.md): OTA로 내면 안 되는 변경과 빌드와 다른 환경으로 하는 발행

**요청에 따라 더 읽는다.**

| 요청 | 읽을 것 | 이유 |
| --- | --- | --- |
| preview 빌드·OTA를 확인하거나 완료를 판단할 때 | [완료 판단](current/memory/spec/04-quality-and-completion.md), [개념](current/memory/spec/03-concepts-and-contracts.md)의 runtime version·채널 절 | 설정을 넣은 것만으로 확인을 대신하지 않는다. runtime이 환경값에 따라 달라진다 |
| 업데이트를 발행하거나 빌드할 때, runtime이 어긋날 때, 완료 판단 1–5의 확인 근거가 필요할 때 | [실기기 확인 기록](records/2026-11-17-02-preview-build-and-device-ota-check.md) | 첫 빌드의 runtime 불일치와 원인(오래된 `node_modules`), 실기기 확인 절차와 사용한 빌드·업데이트 ID, Sentry 토큰 제약 |
| 스토어 빌드를 내거나 버전을 올릴 때, 버전과 runtime의 관계가 필요할 때 | [1.1.4 제출 기록](records/2026-11-17-10-release-1-1-4-submission.md) | 병합·버전 커밋·빌드·제출 절차, 업데이트 안내 문구의 선택, fingerprint가 버전·빌드 번호를 포함한다는 발견 |
| OTA를 발행하거나 발행 스크립트를 고칠 때 | [발행 스크립트 기록](records/2026-11-17-05-ota-publish-script.md), [Ticket 02](current/memory/tickets/02-ota-publish-guard.md) | 스크립트의 단계·옵션·확인 결과, 명령을 루트 `package.json`에 둔 이유(fingerprint가 scripts를 해시에 넣음), 남은 검사 |
| OTA 소스맵을 올리거나 Sentry 토큰 위치를 바꿀 때 | [소스맵 기록](records/2026-11-17-04-commit-and-ota-sourcemap.md) | 토큰 배치의 선택과 이유, 업로드 명령, 시험·정리 업데이트, Sentry에서 확인한 frame, 롤백 대신 재발행한 이유 |
| EAS 환경 변수를 환경별로 나누거나, 서버·Render의 Google 로그인 설정을 바꿀 때 | [Google 로그인 기록](records/2026-11-17-03-preview-google-login-fix.md) | preview가 운영 client를 공유해 막힌 원인, 서버 iOS client 목록, 코드 배포 뒤 값 변경이라는 순서의 이유, Apple 로그인 제한 |
| 발행 명령·EAS 환경을 다룰 때, 또는 판단 지점의 근거가 필요할 때 | [착수 기록](records/2026-11-17-01-ticket01-build-gate-and-publish-env.md) | 빌드 세 번의 경위, eas-cli 코드에서 읽은 environment 규칙, preview 환경에 연결한 변수, runtime 계산 명령과 값 |
| 설계 방향과 가정을 다시 볼 때 | [제약·설계](current/memory/spec/05-constraints-design-assumptions.md) | 현재 구현 표, 판단 지점의 결과, SDK 51의 남은 기간, 남은 가정 |
| 방지 장치의 규칙·hook을 바꾸거나 확인할 때 | [Ticket 02](current/memory/tickets/02-ota-publish-guard.md), [방지 장치 기록](records/2026-11-17-06-ota-guard-change-env-hook.md), 파일 위치·역할은 [재구성 기록](records/2026-11-17-07-ota-script-reorganization.md)과 [hook 이동 기록](records/2026-11-17-08-hook-to-agents-hooks.md), Spec 05의 방지 장치 절 | Main이 고른 규칙과 확정 상태, 막힘·통과 실행, 별도 검증, hook의 한계, SDK 버전에 묶이지 않게 한다는 방향 |
| Project에 반영할 때 | [Ticket 03](current/memory/tickets/03-project-context-reflection.md), [선택한 Project 맥락](current/memory/project-context.md) | 반영 위치가 미정이고, 확정한 규칙만 옮긴다 |
| dev-client 정렬이나 012 분리의 근거가 필요할 때 | [파악·분리 기록](records/2026-11-16-02-scoping-check-and-sdk-split.md) | dev-client 충돌의 근거, 나눈 이유와 받아들인 비용 |
| SDK·라이브러리 버전 자체를 다룰 때 | [Work 012](../012-expo-sdk-upgrade/README.md) | 버전의 상세 논의는 012가 소유하며 다른 세션에서 진행한다. 011의 Spec에 끌어오지 않는다 |
| 추천을 바꾸거나 이유를 다시 볼 때 | [논의 기록](records/2026-11-16-01-discussion-and-work-creation.md) | fingerprint·시작 시 기다리지 않음·iOS 15 동반을 고른 이유 |
| 사용자가 실제로 한 말이 문제일 때 | [사용자 방향 원문](source/user-direction.md)(첫 세션), 두 번째 세션 발화는 [source 색인](source/index.md)의 행 표와 각 기록의 인용 | 범위(hook, Project 반영, 012 분리), 착수·계속 결정의 원문 |
| 릴리스 절차를 따라 할 때 | Work 007의 [빌드 16 기록](../007-sync-failure-recovery/records/2026-11-14-08-build-16-release-and-review-submission.md), Work 008의 [1.1.3 기록](../008-exception-notice-rules/records/2026-11-16-01-pressable-drawer-fixes.md) | Project에 릴리스 본문이 아직 없다 |

**첫 행동:** `git status`로 main 기준인지 확인하고, App Store Connect에서 1.1.4 심사 상태를 본다. 거절됐으면 그 대응이 먼저다. 빌드나 발행을 하기 전에는 `node_modules`를 지우고 `pnpm install --frozen-lockfile`로 다시 설치한 뒤 runtime을 계산한다. 012가 다른 세션에서 먼저 진행돼 SDK나 dev-client가 바뀌었다면 패치와 runtime 값이 달라진다.
