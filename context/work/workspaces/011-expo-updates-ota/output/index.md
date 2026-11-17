# 현재 산출물

이 Work가 별도 파일을 소유하지는 않는다. 결과는 저장소 코드와 외부 서비스에 있고, 여기서는 그 위치를 연결한다.

## 2026-11-17 현재 있는 결과

브랜치 `feat/011-expo-updates`의 커밋 `3592a538`에 있다(main 병합 전). 각 변경의 의미는 [Ticket 01](../current/memory/tickets/01-expo-updates-and-ios15-build.md)에 있다.
- `apps/client/package.json`: `expo-updates`·`expo-build-properties` 추가, `expo-dev-client` `~4.0.29`
- `apps/client/app.config.js`: fingerprint runtime, `updates`, iOS 15.0 plugin
- `apps/client/eas.json`: preview·production의 `channel`과 `environment`
- 루트 `patches/expo-dev-menu@5.0.23.patch`(새 파일)와 루트 `package.json`의 `pnpm.patchedDependencies`
- `pnpm-lock.yaml`

서버의 Google iOS client 목록 수정은 main 커밋 `99235878`에 있고 Render에 배포됐다. 011 브랜치에는 main을 병합(`cad1ec8f`)해 같은 커밋으로 들어와 있다.

Ticket 02의 발행 스크립트는 처음에 `apps/client/scripts/ota-publish.mjs`로 커밋됐다(`ceb7a7b7`, 루트 `package.json`의 `ota:publish`). 내역은 [발행 스크립트 기록](../records/2026-11-17-05-ota-publish-script.md)에 있다. 그 뒤의 변경은 아직 커밋하지 않았다. 변경 검사·env 이름 대조와 hook을 더했고, 스크립트는 `apps/client/scripts/ota/` 아래 역할별 파일로 옮겼다(`publish.mjs`, `rules.mjs`, `checks.mjs`, `eas.mjs`, `config.mjs`, `terminal.mjs`). hook은 `.agents/hooks/block-direct-eas-update.py`에 두고 `.agents/hooks/README.md`를 더했다. 그에 맞춰 경로 설정(`package.json`, `.claude/settings.json`, `.codex/hooks.json`), 루트 `CLAUDE.md`, `scripts/check-harness.mjs`를 고쳤다. 내역은 [방지 장치 기록](../records/2026-11-17-06-ota-guard-change-env-hook.md)과 [재구성 기록](../records/2026-11-17-07-ota-script-reorganization.md), [hook 이동 기록](../records/2026-11-17-08-hook-to-agents-hooks.md)에 있다.

저장소 밖의 결과도 있다. Expo 계정(프로젝트 `@myeongyeon/noline`)의 EAS 환경 변수다. preview 환경에 공통 변수를 연결하고 preview 전용 값 두 개를 만들었다. 이 변경은 이미 적용돼 있으며, 내역은 [착수 기록](../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)에 있다. 그 뒤 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`를 환경별로 나눴다. 운영 서버(Render)의 `GOOGLE_IOS_CLIENT_ID`도 운영·개발 두 값으로 바꿨다. 내역은 [Google 로그인 기록](../records/2026-11-17-03-preview-google-login-fix.md)에 있다.

EAS와 Apple에는 시험 결과물이 있다. preview 빌드 `f610d9b5-3c04-46d5-b191-e50efac28247`(runtime `54a96787…`, 실패한 첫 빌드는 `8316db33…`), preview 채널의 시험 업데이트 세 개, Google client 수정 업데이트 `a86d1596…`, 소스맵 시험·정리 업데이트 `8c8eb6e9…`·`f40c0676…`, 발행 스크립트 시험 업데이트 `0a0a6db0…`, 등록 기기 1대와 ad hoc 프로필 AN57L8X528이다. ID와 의미는 [실기기 확인 기록](../records/2026-11-17-02-preview-build-and-device-ota-check.md)에 있다.

## 아직 없는 결과

- production EAS 빌드와 production 채널 업데이트
- 1.1.4 빌드와 심사 제출
- Project 본문

Sentry(조직 `hmy-k0`, 프로젝트 `noline-mobile`)에는 preview 업데이트 소스맵 두 벌(debug ID `1b61972b…`, `544fabb1…`)과 시험 issue `7851900817`이 있다. 로컬 `apps/client/.env.production`(gitignore)에는 업로드 토큰을 복사해 두었다. 내역은 [소스맵 기록](../records/2026-11-17-04-commit-and-ota-sourcemap.md)에 있다.
