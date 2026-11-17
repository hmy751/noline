# 03 — Project context에 반영

**상태:** 실행 전 (2026-11-17). 01의 1.1.4 제출과 02의 장치 구현이 끝났다. 011 브랜치는 1.1.4를 위해 main에 병합됐고, 이 Ticket은 병합 뒤 문서 작업으로 이어 한다.

사용자가 Work를 만들며 직접 요청한 범위다.

> "나중에 잊지않게 context도 작업하고나서 알맞게 반영해야할거고"

## 반영할 의미

- OTA로 내도 되는 변경과 안 되는 변경, 그 이유. 01·02에서 실제로 확정한 규칙만 옮긴다. 논의 단계의 "규칙 후보"를 그대로 옮기지 않는다.
- 발행 절차: 채널, 환경값, Sentry, 롤백. 방지 장치의 위치와 우회 조건도 포함한다.
- 오프라인 시작을 늦추지 않는 설정(`fallbackToCacheTimeout: 0`)이 제품 약속과 이어진다는 점.
- runtime version 정책(fingerprint)과, 네이티브 변경은 스토어 빌드로만 나간다는 점.
- **OTA 방지 규칙의 확정:** [Ticket 02](02-ota-publish-guard.md#규칙과-확정-상태)의 규칙(`apps/client/scripts/ota/rules.mjs`)은 사용자가 그대로 두되 "다른 context와 같이 연결해서" 정하자고 했다(2026-11-17). 그래서 이 Ticket에서 기존 Project 계약과 대조해 확정한다. 대조할 곳은 다음과 같다.
  - 서버 계약: [API 계약](../../../../../../project/guidance/api-contracts.md)은 편집 표식 변경에서 "DB 구조 → 서버 → 새 앱" 배포 순서를 이미 정했다. `--server-checked`의 뜻과 계약 경로 범위를 이 순서와 맞춘다.
  - 동기화·편집 병합: [저장·동기화 기준](../../../../../../project/guidance/data-lifecycle/INDEX.md)과 구버전 요청 처리. 앱이 먼저 바뀔 때 옛 서버·옛 앱과 어떻게 어긋나는지가 서버 계약 규칙의 근거다.
  - 기기 DB migration: 이를 소유하는 Project 본문이 없다([앱 실행·세션](../../../../../../project/current/app-runtime/README.md)은 DB migration을 소유하지 않는다고 밝힌다). DB 규칙을 어디에 둘지 함께 정한다.
  - 확정하면 Spec 02의 "(규칙 후보)" 표시와 `rules.mjs`가 같은 뜻인지 맞춘다.

## 반영할 위치 (미정)

2026-11-16 기준 Project에는 배포·릴리스를 소유하는 본문이 없다. `context/project`에서 `eas build`·`App Store`·`심사`를 검색하면 지도 형성 자료 한 곳만 나온다. 릴리스 절차는 지금 Work 007·008의 records에만 있다.

그래서 새 Owner를 만들지, 기존 본문에 합칠지부터 정해야 한다. 기존 본문 후보는 `current/app-runtime`과 `current/architecture.md`다. 이 판단은 [Project 관리 계약](../../../../../../project/MAINTENANCE.md)과 [구성 기준](../../../../../../project/REFERENCE/composition.md)을 읽고 [context-update](../../../../../../../.agents/skills/context-update/SKILL.md)로 수행한다.

이 밖에 영향이 갈 수 있는 곳도 함께 확인한다.
- runtime이 바뀌는 조건: fingerprint는 `apps/client/package.json`의 scripts까지 해시에 넣는다. 그래서 scripts만 바꿔도 OTA runtime이 바뀌고 새 빌드가 필요해진다. 발행 명령을 루트 `package.json`에 둔 이유이기도 하다. `apps/client` 가이드나 OTA 기준 본문에 남길지 확인한다. 근거는 [발행 스크립트 기록](../../../records/2026-11-17-05-ota-publish-script.md)에 있다.
- runtime이 버전마다 다르다는 점: 이 구성(SDK 51, expo-updates 0.25)의 fingerprint는 앱 버전과 iOS buildNumber도 포함한다. 그래서 스토어 빌드마다 runtime이 다르고, OTA는 버전·빌드 번호가 같은 빌드에만 간다. 이전 버전 사용자에게 보낼 때는 그 버전의 코드 트리에서 발행해야 한다. 버전을 올린 뒤에는 preview 빌드도 새로 만들어야 한다. 근거는 [1.1.4 제출 기록](../../../records/2026-11-17-10-release-1-1-4-submission.md)에 있다.
- 발행 절차: `pnpm ota:publish`의 사용법과 단계.
- 서버의 Google 로그인 설정: 2026-11-17 서버가 `GOOGLE_IOS_CLIENT_ID`를 쉼표 목록으로 받게 바뀌었다(`99235878`). 운영과 preview 앱의 iOS client를 함께 허용하기 위해서다. 서버 README의 환경 변수 설명은 이미 고쳤다. API·인증 Project 본문에 반영할지 확인한다. 경위는 [Google 로그인 기록](../../../records/2026-11-17-03-preview-google-login-fix.md)에 있다.
- `apps/client/CLAUDE.md`의 명령
- [START_GUIDE](../../../../../../../START_GUIDE.md): 개발 앱을 다시 빌드해야 하는 조건

## 완료 조건

[완료 판단](../spec/04-quality-and-completion.md)의 8을 확인한다. 반영한 본문, 읽기 경로, 갱신하지 않은 영향 범위를 records에 남긴다.
