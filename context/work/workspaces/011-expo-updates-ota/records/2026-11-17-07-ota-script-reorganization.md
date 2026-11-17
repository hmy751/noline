# OTA 스크립트를 역할별로 나누고 다듬음

2026-11-17 오후 4시 10분경부터 4시 20분경(KST)까지의 기록이다. 발행 스크립트 한 파일과 hook 한 파일을 `apps/client/scripts/ota/` 아래로 모아 역할별로 나눴다. 코드도 Personal의 코드 표현 기준에 맞춰 다듬었다. 동작은 바꾸지 않는 것이 목표였다. 예외는 hook이 하나 더 잡게 된 형태와 harness 검사 하나다. 같은 검사들로 결과가 그대로인 것을 확인했다. 변경은 커밋하지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 4797–5150행이다. 별도 검토자의 판정은 원문에 도착한 반환(5024)을 기준으로 적었다.

## 요청

[방지 장치 기록](2026-11-17-06-ota-guard-change-env-hook.md)의 결과를 본 사용자가 말했다.

> "근데 파일 보니까 스크립트 파일 2개확인했어 일단 코드 퀄리티를 좀 더 깔끔하게 해줬으면 좋겠고 persoanl보고 그리고 파일 위치랑 이런게 음 지금 역할에 맞게 뭔가 위치나 이런게 잘 구성되어 있으면 좋겠어" (4797)

요청은 두 가지였다. 하나는 Personal 기준으로 코드를 다듬는 것이고, 다른 하나는 역할에 맞게 파일 위치를 구성하는 것이다. 규칙(무엇을 막는지)을 바꾸라는 요청은 아니었다. 그래서 [Ticket 02](../current/memory/tickets/02-ota-publish-guard.md)의 규칙 표와 "사용자 확인 전" 상태는 그대로다.

## 새 구성

`apps/client/scripts/ota-publish.mjs`를 `apps/client/scripts/ota/` 아래 여러 파일로 나눴다. 이름은 `git mv`로 index에 올렸고 내용 변경은 미커밋이다.

| 파일 | 맡는 것 |
| --- | --- |
| `publish.mjs` | 진입점, 옵션, 단계 순서, 깨끗한 재설치 |
| `config.mjs` | 경로, 채널, 플랫폼, Sentry 토큰 파일 |
| `rules.mjs` | 무엇을 검사하는지와 그 규칙. 사용자가 확인해야 할 정책이 여기 모인다 |
| `checks.mjs` | 발행 전 점검들 |
| `eas.mjs` | EAS CLI 호출과 출력 해석 |
| `terminal.mjs` | 프로세스 실행과 출력. 종료하지 않는 `report()`를 새로 만들었다 |
| `block-direct-eas-update.py` | `eas update` 직접 실행을 막는 hook. 예전 위치는 `apps/client/scripts/` 바로 아래였다 |

`rules.mjs`는 이렇게 구성했다.
- `CHANGE_RULES`에 거부·확인·경고 규칙을 모았다.
- 예전 별도 상수였던 DDL 정규식은 거부 규칙 "SQLite 구조를 바꾸는 SQL"(상수 `SQLITE_DDL`)이 됐다.
- 요청 클라이언트 import 패턴은 확인 규칙의 `content`로 옮겼다.
- `BUNDLE_SOURCES`, `CODE_PATHS`, `ENV_SOURCE_DIRS`도 이 파일에 두었다. 경로는 모두 저장소 루트 기준이다.

`checks.mjs`의 `findTargetBuilds`는 `checkChannelBuilds`로 이름을 바꿨고, `{ builds, targets }`를 돌려준다. runtime 대조가 빌드 목록을 네트워크로 다시 받던 것을 이 결과를 재사용하게 고쳤다(4915).

경로도 맞췄다. 루트 `package.json`의 `ota:publish`는 `ota/publish.mjs`를 가리킨다. `.claude/settings.json`과 `.codex/hooks.json`은 새 hook 경로를 가리킨다.

### hook을 이 자리에 둔 이유

hook을 `.claude/hooks`가 아니라 `apps/client/scripts/ota/`에 둔 이유는 셋이다.
- OTA 발행 흐름과 함께 바뀐다.
- 그 흐름을 없앨 때 함께 지워야 한다.
- 두 도구의 설정이 한 공통 파일을 가리키게 하는 것이 루트 CLAUDE.md의 도구 연결 규칙(공통 본문을 가리키고 host 차이만 적응)과 맞는다.

별도 검토자도 이 자리를 유지하기를 권했다(5024).

### hook의 변경

- 코드를 다듬었다.
- `eas --non-interactive update`처럼 하위 명령 앞에 전역 플래그가 오는 형태도 잡는다.
- docstring에서 "Codex도 exit 2를 거부로 처리한다"는 문장을 고쳤다(4952). 확인하지 않은 내용이었다. Codex 실제 동작은 여전히 확인 전이다.

### harness 검사 추가

hook 명령은 파일이 없으면 조용히 건너뛴다. 그래서 `scripts/check-harness.mjs`에 hook 명령이 가리키는 파일이 실제로 있는지 보는 검사를 넣었다(5104–5121). 경로를 일부러 바꾼 반대 시험에서 이 검사가 그 경로를 보고했고, 그 뒤 원래대로 되돌렸다.

## Personal 기준으로 다듬은 것

`context/personal/development/`의 code-expression, naming-and-completion, contracts-and-lifetime을 적용했다.
- 모든 조건에 중괄호를 쓰고, 선언·확인·실행 사이에 빈 줄을 둔다.
- 흐름을 먼저 두고 도우미를 아래에 둔다. `eas.mjs`를 이 순서로 다시 배치했다(5064).
- 장식용 구분선을 줄였다.
- 이유 주석을 더했다. `dist`를 지우는 이유와 `capture`·`run`의 실패 계약이다.
- 이름을 동작에 맞췄다. `checkChannelBuilds`, `readEnvironment`의 옵션 `has`가 그 예다.
- "프로필 env 같음" 줄은 비교할 것이 있을 때만 출력한다.
- "eas update는 프로필 env를 쓰지 않습니다" 안내를 되살렸다.

이름·주석·구분선·harness 검사는 별도 검토자의 제안을 받아 Main이 반영한 것이다(5034).

## 확인

- **lint:** prettier, prettier 규칙을 끈 eslint, `node --check`, `py_compile`이 통과했다.
- **hook:** 기존 35가지에 검증자가 시도했던 형태를 더해 모두 의도대로 나왔다(4976). 이 세션의 Claude Code에서도 새 경로의 hook이 실제로 막았다(4986).
- **dry-run(preview):**
  - 통과: 현재 트리, `--server-checked`를 붙인 sync 수정, `db/utils.ts`, `submit-error`. 현재 트리의 runtime `54a96787…`가 빌드 `f610d9b5…`와 여전히 같다. 스크립트를 옮겨도 fingerprint는 바뀌지 않았다는 뜻이다. `scripts/ota/` 아래 새 파일은 runtime에 들어가지 않는다.
  - 거부: migration, `db/` 아래 새 파일, 여러 줄 `CREATE TABLE`, DDL과 auth-api(함께 보고됨), EAS에 없는 `@env`·`process.env` 이름, namespace `@env` import, 인자 오류, 빌드가 없는 production.
  - migration 수정은 SQLite 경로 규칙과 SQL 규칙 양쪽에서 보고된다. 의도한 결과다.
- **별도 검토(5024):** 분리가 책임별로 맞고 리팩터링으로 생긴 동작 결함은 없다고 판정했다. 제안은 위처럼 반영했다.
- **`pnpm harness:check`:** 기존 깨진 링크 64건 외에 실패가 없다.

## 이 기록으로 고친 current

- Ticket 02의 파일 경로·규칙 상수 이름, Spec 05 방지 장치 절, state, recover, output·source·records 색인. 앞선 기록은 당시 경로 그대로 둔다.
