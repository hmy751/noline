# 02 — 위험한 OTA 발행을 막는 장치

**상태:** 구현·확인 완료, 확정 전 (2026-11-17). 발행 스크립트 `pnpm ota:publish`와 직접 발행 hook을 만들었고, preview에서 막힘과 통과를 확인했다. 발행 스크립트에는 변경 검사와 env 이름 대조가 들어 있다. 남은 일은 셋이다. 구현에 쓴 규칙에 대한 사용자 확인, Codex에서의 실제 동작 확인, 커밋이다. 첫 부분인 발행 스크립트의 기본 절차는 `ceb7a7b7`로 커밋했다. 그 뒤의 변경 검사·env 대조·hook, 그리고 `apps/client/scripts/ota/`로의 역할별 재구성은 미커밋이다.

사용자가 Work를 만들며 직접 요청한 범위다.

> "참고로 hook같은걸로 뭔가 방지하게 하는 그런것도 할거라고 잘 기록해놔줘"

## 구성

검사는 발행 스크립트가 맡고, hook은 AI 도구가 스크립트를 건너뛰지 못하게 유도한다. 사람이 자기 터미널에서 `eas update`를 치는 것은 막지 못한다. 이 장치는 보안 경계가 아니라 실수를 막는 안내다.

### 발행 스크립트

`apps/client/scripts/ota/`에 역할별로 나눠 두었다. 실행 명령은 루트 `package.json`의 `ota:publish`(`ota/publish.mjs`)다.
- `publish.mjs`: 진입점, 옵션, 단계 순서, 재설치
- `rules.mjs`: 검사 규칙. 아래 표의 정책이 여기 있다
- `checks.mjs`: 발행 전 점검
- `eas.mjs`: EAS CLI 호출
- `config.mjs`: 경로·채널 설정
- `terminal.mjs`: 실행과 출력

나눈 경위는 [재구성 기록](../../../records/2026-11-17-07-ota-script-reorganization.md)에 있다.

```
pnpm ota:publish <preview|production> --message "..." [--dry-run] [--skip-install] [--allow-dirty] [--confirm-production] [--server-checked]
```

1. **사전 점검**
   - 채널과 environment가 짝인지 본다.
   - 코드 경로에 커밋하지 않은 변경이 있으면 거부한다.
   - 소스맵 토큰이 있는지 본다. production이면 `--confirm-production`이 필요하다.
   - 기준 빌드를 찾는다. 그 채널에서 최신 빌드와 runtime이 같은 모든 빌드다.
   - 그 빌드 커밋들 이후의 **변경을 검사**한다(아래 규칙).
2. **깨끗한 재설치**
3. **EAS 환경값 대조**
   - 프로필 `env`(extends 포함)를 EAS 값과 대조한다. `SENTRY_ORG`·`SENTRY_PROJECT`가 있는지 본다.
   - **env 이름 대조:** `@env`와 `process.env.EXPO_PUBLIC_*`로 읽는 이름이 그 EAS environment에 있어야 한다.
4. **runtime 대조:** 로컬 runtime이 그 채널 최신 빌드의 runtime과 같아야 한다.
5. **발행과 업로드:** `eas update --json` → 발행 runtime 재대조 → 소스맵 업로드 → debug ID 확인.

실행 명령을 `apps/client/package.json`에 두면 안 된다. fingerprint가 그 scripts를 해시에 넣어 runtime이 바뀐다. 기본 절차의 경위는 [발행 스크립트 기록](../../../records/2026-11-17-05-ota-publish-script.md)에 있다.

### 직접 발행 hook

`.agents/hooks/block-direct-eas-update.py`(PreToolUse)를 `.claude/settings.json`과 `.codex/hooks.json`에 등록했다. hook 파일은 앱 코드가 아니라 AI 하네스 관리 대상이라는 사용자 판단에 따라 Claude·Codex 공통 원본 자리인 `.agents/`에 둔다. `.agents/skills/`와 같은 관례다. 두 도구 설정은 이 한 파일을 가리킨다. 연결 대상(`apps/client/scripts/ota/publish.mjs`)이 바뀌거나 없어질 때 함께 고치거나 지울 것은 [`.agents/hooks/README.md`](../../../../../../../.agents/hooks/README.md)가 맡는다. `pnpm harness:check`는 hook 명령이 가리키는 파일이 실제로 있는지 검사한다. 위치를 옮긴 경위는 [hook 이동 기록](../../../records/2026-11-17-08-hook-to-agents-hooks.md)에 있다.
- 한 명령 구간 안에서 `eas`/`eas-cli` 다음에 `update`가 오면 거부한다. `eas --non-interactive update`처럼 전역 플래그가 앞에 와도 잡는다. `bash -lc` 같은 셸 감싸기, `eas env:exec` 안쪽, `npx`·`pnpm exec`·`timeout`, argv 배열 형태도 포함한다. 거부할 때는 발행 스크립트를 안내한다.
- `eas update:*` 하위 명령은 허용한다.
- hook 파일이 없으면 등록 명령이 건너뛴다.
- 알려진 한계가 있다. heredoc 줄은 오탐이 된다. backtick·`node -e` execSync는 잡지 못한다. 사람의 터미널은 막지 않는다.

## 규칙과 확정 상태

아래 규칙은 Main이 구현하며 정했다. [Spec 02](../spec/02-behavior-and-cases.md)의 "규칙 후보"를 동작으로 옮긴 것이며, **사용자가 확인하지 않았다.** 바꾸면 `apps/client/scripts/ota/rules.mjs`의 `CHANGE_RULES`(SQL 규칙의 `SQLITE_DDL` 포함)와 이 표를 함께 고친다.

| 막아야 할 것 | 동작 | 규칙 |
| --- | --- | --- |
| 기기 SQLite 구조 변경 | 거부, 우회 플래그 없음 | `apps/client/src/shared/db/` 전체(단 `utils.ts` 제외). 그 밖의 번들 소스에서는 DDL(`CREATE …TABLE/INDEX/VIEW/TRIGGER`, `ALTER TABLE`, `DROP …`, `PRAGMA user_version`)이 든 파일이 바뀌면 거부. 스토어 빌드로 낸다 |
| 서버보다 먼저 나가는 계약 변경 | `--server-checked` 없으면 거부 | `packages/schema/`, `shared/api/`, `shared/services/sync/`, `entities/*/api/`, 그리고 요청 클라이언트(`authAxios`·`apiAxios`, fetcher 기본 `apiClient`)를 가져오는 바뀐 파일. 플래그의 뜻은 "서버를 먼저 배포했거나 서버 변경이 필요 없다" |
| 네이티브 변경 | 경고, 실제 차단은 runtime 대조 | `app.config.js`, `eas.json`, `package.json`, `pnpm-lock.yaml`, `patches/` |
| 개발용 `EXPO_PUBLIC_*`·로컬 `.env` 값 | 거부 | 3단계 env 이름 대조. namespace·default `@env` import도 거부 |
| 빌드와 다른 환경으로 하는 발행 | 거부 | 1단계 채널·environment 짝, 3단계 프로필 env 대조 |
| 오래된 로컬 `node_modules` | 거부 | 2단계 재설치, 4단계 runtime 대조 |
| Sentry 소스맵 누락 | 거부(토큰 없음)·실패 알림 | 1단계 토큰 확인, 5단계 업로드와 debug ID 확인 |

기준점 규칙도 있다. 기준 빌드 가운데 커밋 해시가 없는 빌드가 있거나, 그 커밋이 로컬에 없으면 거부한다. 빌드를 커밋하지 않은 변경과 함께 만들었다면 이미 빌드에 든 변경도 diff에 보인다. 그때는 거부되는 쪽으로 틀린다.

배경 사례는 다음 기록에 있다.
- 오래된 `node_modules`로 runtime이 어긋난 첫 preview 빌드: [실기기 확인 기록](../../../records/2026-11-17-02-preview-build-and-device-ota-check.md)
- `@env`가 로컬 `.env`를 읽는 구조: 같은 기록의 완료 판단 5 절
- 환경별 발행 명령: [착수 기록](../../../records/2026-11-17-01-ticket01-build-gate-and-publish-env.md)
- 소스맵 토큰과 업로드: [소스맵 기록](../../../records/2026-11-17-04-commit-and-ota-sourcemap.md)

## 확인한 것

preview에서 `--dry-run --skip-install --allow-dirty`로 실행했다. 시험 변경은 되돌렸다.
- **통과:** 현재 트리, `db/utils.ts` 수정, `--server-checked`를 붙인 sync·places api 수정, 오류 타입만 가져오는 파일 수정.
- **거부:** migration 수정·새 파일·추적 안 된 새 migration, `--server-checked`를 붙인 `db/index.ts` 수정, entity lib의 DDL 네 가지 형태, 플래그 없는 schema·sync·api·auth-api 수정, EAS에 없는 env 이름 두 종류, namespace `@env` import.
- **production dry-run:** 빌드가 없어 멈춘다. 1.1.4가 있어야 한다.
- **hook:** 페이로드 35가지가 의도대로 나왔다. 이 세션의 Claude Code에서 `eas update --help`가 실제로 막혔다. Codex의 실제 동작은 codex CLI가 없어 보지 못했다.
- **별도 검증:** 두 번 받았다. 1차에서 찾은 빈틈(`bash -lc` 우회, 단일 빌드 기준점, 좁은 경로, hook 파일이 없을 때 전면 차단 등)은 모두 고쳤고, 2차가 이를 확인했다. 2차의 남은 지적(DDL 형태, auth·places 서비스)은 Main이 고친 뒤 재실행으로만 확인했다. 3차 검증은 없다.
- 기본 절차의 발행 실행 결과(preview 그룹 `0a0a6db0…`)는 [발행 스크립트 기록](../../../records/2026-11-17-05-ota-publish-script.md)에 있다.

상세는 [방지 장치 기록](../../../records/2026-11-17-06-ota-guard-change-env-hook.md)에 있다. 재구성 뒤에도 같은 막힘·통과 결과와 hook 동작을 다시 확인했다([재구성 기록](../../../records/2026-11-17-07-ota-script-reorganization.md)).

## 남은 일

- **규칙 확인:** 위 표의 규칙을 사용자가 확인한다. 특히 DB 규칙에 우회 플래그가 없는 점, 계약 경로의 범위, `--server-checked`의 뜻을 본다.
- **Codex 확인:** Codex에서 hook이 실제로 막는지 본다. exit 2 처리와 페이로드 모양이 확인 대상이다.
- **커밋:** 다음을 함께 커밋한다. `apps/client/scripts/ota/` 전체(이전 `ota-publish.mjs`에서 옮김, 새 파일은 추적 안 됨), `.agents/hooks/`(hook과 README, 추적 안 됨), 루트 `package.json`, `.claude/settings.json`, `.codex/hooks.json`, 루트 `CLAUDE.md`, `scripts/check-harness.mjs`. hook 파일 없이 설정만 들어가면 hook이 건너뛰어진다. 지금은 harness 검사가 이를 잡는다.
- **놓아 둔 하위 결함:** 로컬 셸 export가 EAS 누락을 가리는 경우(하). 발행 뒤 실패 안내 두 경로는 실행으로 확인하지 못했다.
- **EAS Workflows:** 서버에서 발행하는 안은 SECRET 토큰을 그대로 쓰고 로컬 `node_modules` 문제를 없애지만 준비 비용이 크다. 지금 구성으로 충분하지 않을 때 다시 본다.

## 따를 방향

장치는 특정 SDK 버전에 묶이지 않게 만든다. 검사는 경로 diff와 fingerprint처럼 SDK가 바뀌어도 그대로 쓰는 기준에 기댄다. SDK 업그레이드를 [Work 012](../../../../012-expo-sdk-upgrade/README.md)로 나누자는 추천에 함께 들어 있던 방향이며, 사용자는 분리에 동의했다. 업그레이드 릴리스의 버그를 심사 없이 고치려면 OTA와 이 장치가 012 뒤에도 그대로 이어져야 하기 때문이다. 이유는 [분리 기록](../../../records/2026-11-16-02-scoping-check-and-sdk-split.md)에 있다. 012에서 SDK 52 이상이 되면 `eas fingerprint:compare`도 runtime 비교 후보가 된다.

## 완료 조건

[완료 판단](../spec/04-quality-and-completion.md)의 6을 확인한다. 막히는 경우와 통과하는 경우를 각각 실행한 결과를 records에 남긴다. hook을 바꾸면 `pnpm harness:check`를 실행한다. preview에서는 실행 결과가 생겼다. 사용자 확인과 Codex 확인이 남아 있다.
