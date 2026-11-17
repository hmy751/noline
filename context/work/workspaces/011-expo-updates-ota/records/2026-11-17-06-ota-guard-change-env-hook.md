# OTA 방지 장치 나머지: 변경 검사, env 이름 대조, 직접 발행 hook

2026-11-17 오후 3시경부터 3시 20분경(KST)까지의 기록이다. Ticket 02의 나머지를 구현하고 확인했다. 하나는 발행 스크립트에 넣은 "OTA로 내면 안 되는 변경" 검사, 또 하나는 `@env` 이름과 EAS 변수의 대조, 마지막은 Claude·Codex가 `eas update`를 직접 치지 못하게 하는 hook이다. 이로써 [완료 판단](../current/memory/spec/04-quality-and-completion.md) 6에 막힘과 통과 실행이 생겼다. 다만 구현하면서 정한 규칙은 Main의 선택이며 사용자가 확인하지 않았다. 변경은 커밋하지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 4253–4758행이다. 앞 구간(3969–4253행)에서는 사용자 요청으로 기록의 민감 정보 세부를 줄이고, push 전 브랜치 이력을 고쳐 다시 커밋했다(`4c3c8858`). 그 반영은 Main이 직접 했으므로 이 기록에서 다루지 않는다.

## 순서의 선택

사용자는 "이제 다음 진행하자"(4253)라고만 했다. 1.1.4 출시와 Ticket 02 나머지 가운데 무엇을 먼저 할지는 정해 두지 않은 상태였다. Main은 Ticket 02 나머지를 먼저 했다(4285). Main이 밝힌 이유는 둘이다. [Spec 05](../current/memory/spec/05-constraints-design-assumptions.md)의 순서가 방지 장치를 1.1.4 앞에 두고, 이 일은 바깥에 영향을 주는 조치가 없는 로컬 작업이라는 것이다. 이 이유는 대화에 쓰지 않았고 Main이 기록 요청에서 보고했다. 사용자가 이 순서를 고른 것은 아니다.

## 구현 (미커밋)

- `apps/client/scripts/ota-publish.mjs`: 변경 검사(`CHANGE_RULES`, `checkChanges`, `changesSince`, `readChangedSources`), DDL 검사(`DDL_PATTERN`), env 이름 수집(`collectEnvImports`, `process.env.EXPO_PUBLIC_*` 포함)을 넣었다. 기준 빌드 조회(`findTargetBuilds`)는 1단계로 옮겼다. 새 플래그 `--server-checked`를 만들었고, `build:list` 조회 한도는 50이다.
- 새 파일 `apps/client/scripts/block-direct-eas-update.py`: PreToolUse hook이다.
- `.claude/settings.json`과 `.codex/hooks.json`에 이 hook을 등록했다. hook 파일이 없으면 명령을 건너뛴다.

## 구현하며 Main이 정한 규칙

[Spec 02](../current/memory/spec/02-behavior-and-cases.md)의 "규칙 후보"를 실제 동작으로 옮긴 것이다. 사용자가 확인하지 않았으므로 Main의 선택이며 바뀔 수 있다.

| 대상 | 동작 | 내용 |
| --- | --- | --- |
| 기기 SQLite 구조 | 거부 | `apps/client/src/shared/db/` 전체를 막는다. 트랜잭션 도우미 `utils.ts`만 뺀다. 그 밖에서도 번들 소스(`src`, `app`, `packages`)에 DDL이 든 파일이 바뀌면 막는다. DDL은 `CREATE [UNIQUE\|TEMP\|VIRTUAL] TABLE/INDEX/VIEW/TRIGGER`, `ALTER TABLE`, `DROP …`, `PRAGMA user_version`이다. 우회 플래그는 없고 스토어 빌드로 낸다 |
| 서버와 맞춰야 하는 계약 | 확인(없으면 거부) | 대상 경로는 `packages/schema/`, `shared/api/`, `shared/services/sync/`, `entities/*/api/`다. 그 밖에 요청 클라이언트(`authAxios`·`apiAxios`, fetcher의 기본 `apiClient`)를 가져오는 바뀐 파일도 포함한다. `--server-checked`가 있어야 통과한다. 이 플래그의 뜻은 "서버를 먼저 배포했거나 서버 변경이 필요 없다"이다 |
| 네이티브 설정·의존성 | 경고만 | `app.config.js`, `eas.json`, `package.json`, `pnpm-lock.yaml`, `patches/`. 실제로 막는 것은 runtime 대조다 |
| 기준점 | — | 그 채널에서 최신 빌드와 runtime이 같은 모든 빌드의 `gitCommitHash`. 업데이트가 그 빌드 모두에 가기 때문이다. 커밋 해시가 없는 빌드가 있거나 그 커밋이 로컬에 없으면 거부한다 |
| env 이름 | 거부 | `@env`와 `process.env.EXPO_PUBLIC_*`로 읽는 이름이 그 EAS environment에 있어야 한다. namespace·default 형태의 `@env` import는 거부한다 |
| 직접 발행 hook | 거부 | 한 명령 구간 안에서 `eas`/`eas-cli` 다음에 `update`가 오면 막는다. `bash -lc`/`zsh -ic`, `eas env:exec`의 안쪽 명령, `npx`·`pnpm exec`·`timeout` 감싸기, argv 배열 형태도 포함한다. `eas update:*` 하위 명령과 글을 다루는 도구로 시작하는 줄은 허용한다 |

hook에는 알려진 한계가 있다. heredoc 안의 "eas update"로 시작하는 줄은 오탐이 된다. backtick이나 `node -e`의 execSync는 잡지 못한다. 사람이 자기 터미널에서 치는 명령도 막지 못한다. hook은 보안 경계가 아니라 스크립트로 유도하는 안내다. [Spec 05](../current/memory/spec/05-constraints-design-assumptions.md)에서 예상한 구성, 즉 검사는 스크립트가 맡고 hook은 보조라는 구성과 같다.

## 확인

### 발행 스크립트 dry-run (preview)

모두 `--dry-run --skip-install --allow-dirty`로 실행했고, 시험용 임시 변경은 되돌렸다(4497–4543, 4628–4655, 4704–4738).

| 결과 | 경우 |
| --- | --- |
| 통과 | 현재 트리(기준 `3895d44f`, runtime `54a96787…`가 `f610d9b5…`와 같음), `db/utils.ts` 수정, `--server-checked`를 붙인 sync 수정, `--server-checked`를 붙인 places api 수정, `APIError`만 가져오는 `submit-error.ts` 수정 |
| 거부 | migration 수정, `db/` 아래 새 파일, 추적하지 않는 새 migration, `--server-checked`를 붙여도 `db/index.ts` 수정 |
| 거부 | entity lib의 DDL: `ALTER`, `CREATE UNIQUE INDEX`, 여러 줄 `CREATE TABLE`, 새 파일의 `CREATE TEMP TABLE` |
| 거부 | 플래그 없는 schema 수정, 플래그 없는 sync·entities api·auth-api 수정 |
| 거부 | EAS에 없는 `@env` 이름과 `process.env` 이름, namespace `@env` import |
| 거부 | production dry-run: runtime이 있는 빌드가 없음. 1.1.4가 있어야 한다 |

`submit-error.ts`는 처음에 막혔다(4716). fetcher에서 오류 타입만 가져오는데도 걸린 것이다. 그래서 검사를 실제로 요청을 보내는 HTTP 클라이언트로 좁혔다.

### hook

- 페이로드 35가지가 의도대로 나왔다(4620). 처음 22가지에서 시작해, 따옴표를 지켜 명령을 나누도록 고친 뒤 늘렸다(4449–4464).
- 이 세션의 Claude Code에서 실제로 동작했다. Main이 실행한 `eas update --help`가 hook에 막혔다(4490–4491).
- Codex의 실제 동작(exit 2 처리, 페이로드 모양)은 확인하지 못했다. 이 기기에 codex CLI가 없다(4356).
- hook 파일이 없을 때 모든 Bash가 막히던 문제를 고쳐, 파일이 없으면 건너뛴다(4620–4627).

### 별도 검증

Main이 코드를 쓰지 않은 검증자에게 두 번 맡겼다. 세 번째는 없었다.
- **1차(4560):** 실제 빈틈을 찾았다. Codex가 흔히 쓰는 `bash -lc` 형태가 hook을 통과했다. 기준점이 최신 빌드 하나뿐이었다. db·계약 경로 범위가 좁았다. hook 파일이 없으면 모든 Bash가 막혔다. 그 밖에 quotePath, `process.env` 이름 누락이 있었다. Main이 모두 고쳤다(4570–4655).
- **2차(4670):** 1차 수정이 해소됐음을 확인했다. 남은 지적은 둘이었다. DDL 형태(`CREATE UNIQUE INDEX` 등)를 놓치는 것과, 서버를 직접 부르는 auth·places 서비스를 보지 않는 것이다. Main이 그 뒤에 고치고 위 재실행으로 확인했다(4680–4738).

### 구현 중 잡은 버그

git 인자에서 `-z`가 `--` 뒤에 있었다. 그래서 git이 이를 경로로 읽었고, 경로 규칙이 아무것도 맞추지 못한 채 조용히 통과했다. 막혀야 할 경우가 통과하는 것을 보고 찾았다. 고친 뒤 다시 실행했다.

### 그 밖

- `eslint-plugin-prettier`가 prettier 3과 맞지 않아 모든 파일에서 죽는다(4408–4419). 이번 변경과 무관한 환경 문제다. Main은 `prettier --check`와 `eslint --rule 'prettier/prettier: off'`로 대신 확인했다.
- `pnpm harness:check`는 64건 실패였다. 모두 Work 003–005의 기존 깨진 링크이며, 변경 전후가 같았다(4471–4483). 새 실패는 없다.

## Ticket 02에 남은 것

- 위 규칙 선택에 대한 사용자 확인
- Codex에서의 실제 동작 확인
- 커밋: `block-direct-eas-update.py`가 추적되지 않은 상태다. 설정 파일과 함께 커밋해야 한다. 설정만 커밋하면 다른 곳에서는 hook이 건너뛰어진다

## 이 기록으로 고친 current

- Ticket 02 상태·구현·규칙·남은 일, Spec 05 방지 장치 절, Spec 02의 "규칙 후보" 설명, state, recover, output·source·records·Ticket 색인
