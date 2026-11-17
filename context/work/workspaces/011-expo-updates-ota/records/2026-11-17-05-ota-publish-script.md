# OTA 발행 스크립트: 구현과 확인

2026-11-17 오후 2시 10분경부터 2시 25분경(KST)까지의 기록이다. Ticket 02의 첫 부분으로 OTA 발행 스크립트 `pnpm ota:publish`를 만들었다. 이 스크립트는 오늘 손으로 한 발행 절차와 그 확인을 한 명령으로 묶는다. 절차는 깨끗한 재설치, runtime 대조, `eas update`, 소스맵 업로드다. 만들면서 Expo fingerprint가 `apps/client/package.json`의 scripts까지 해시에 넣는다는 것을 발견했다. 실제 preview 발행까지 동작을 확인했다. 변경은 커밋하지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 3527–3969행이다. 별도 검증자의 결과는 그 원문에 도착한 반환을 기준으로 적었고, 수정 내역은 Main이 정리한 내용이다.

## 무엇을 만들지 맞춘 과정

> "티켓 02 발행 스크립트는 무슨 마리야?" (3639)

Main은 이렇게 설명했다(3656). 오늘 preview 발행 때 손으로 밟은 네 단계는 어느 하나를 빠뜨려도 명령이 성공으로 끝난다. 재설치, runtime 대조, 채널·environment를 맞춘 `eas update`, 소스맵 업로드다. 그래서 이 확인을 사람이나 AI의 기억이 아니라 코드가 하게 만드는 것이 스크립트다. Ticket 02 안에서는 "발행 절차의 실수"를 막는 중심 형태다. "OTA로 내면 안 되는 변경"을 막는 경로 diff 검사와 우회를 막는 hook은 그 뒤의 일로 구분했다. Main은 절차 검사부터 만들자고 추천했다.

> "그럼 스크립트부터 만들어줘" (3661)

Main이 작업을 시작한 직후 사용자가 끼어들었다.

> "아참 프리뷰는?" (3686)

Main은 이를 "preview 발행 때도 소스맵을 올리나"라는 질문으로 해석했다(3698). 스크립트가 두 채널을 같은 순서로 다룬다고 설명하고, preview에도 올리자고 추천했다. 앞서 한 "운영에만 올려도 된다"는 말은 "최소한 운영은 꼭"이라는 뜻이었다고 정정했다. 하지만 사용자가 물은 것은 그게 아니었다.

> "아니 아까 소스맵 프리뷰 작업" (3703)

앞서 한 preview 소스맵 작업이 어떤 상태인지 묻는 말이었다. Main은 그 작업이 끝났다고 답했다(3707). 오류가 원래 줄로 풀렸고, 정리 업데이트 `f40c0676…`를 냈고, 코드는 되돌렸고, 토큰은 로컬에 있다는 내용이다. 짧은 질문을 바로 앞의 열린 판단과 이어 읽어 해석이 한 번 어긋난 장면이다. 다만 이 답으로 preview도 소스맵을 올리는 방향이 정해졌고, 스크립트는 그대로 구현했다.

> "발 행스크립트 해줘 진햏ㅇ" (3712)

## 구현

새 파일은 `apps/client/scripts/ota-publish.mjs`다. 루트 `package.json`에 `"ota:publish": "node apps/client/scripts/ota-publish.mjs"`를 추가했다(3712–3875).

```
pnpm ota:publish <preview|production> --message "..." [--dry-run] [--skip-install] [--allow-dirty] [--confirm-production]
```

| 단계 | 하는 일 |
| --- | --- |
| 1 사전 점검 | `eas.json`에서 그 channel을 쓰는 프로필의 environment가 같은 이름인지 본다. 코드 경로에 커밋하지 않은 변경이 있으면 거부한다. 코드 경로는 `apps/client`, `packages`, `patches`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`다. `.env.production`에 `SENTRY_AUTH_TOKEN`이 없거나 비어 있으면 거부한다. production은 `--confirm-production`이 있어야 진행한다 |
| 2 깨끗한 재설치 | 루트·`apps/*`·`packages/*`의 `node_modules`를 지우고 `pnpm install --frozen-lockfile` |
| 3 EAS 환경값 대조 | `eas.json` 프로필 `env`(extends 포함, 예: `APP_VARIANT`)가 EAS environment 값과 같은지 본다. `eas update`는 프로필 `env`를 쓰지 않으므로, 다르면 빌드와 발행의 값이 갈린다. `SENTRY_ORG`·`SENTRY_PROJECT`가 있는지도 본다 |
| 4 runtime 대조 | 로컬 runtime이 그 채널의 최신 finished 빌드(`eas build:list --channel`)와 같아야 진행한다. 예전 빌드와만 같아도 거부한다 |
| 5 발행과 업로드 | `eas update --json` → 발행된 runtime을 다시 대조 → 소스맵 업로드 → debug ID 확인. 실패하면 재시도 명령을 안내한다 |

## 발견: fingerprint는 `apps/client/package.json`의 scripts도 해시에 넣는다

처음에는 실행 명령을 `apps/client/package.json`의 scripts에 넣었다. 그러자 깨끗한 재설치를 포함한 preview dry-run이 4단계에서 멈췄다(3824–3830). 로컬 runtime은 `6cfec56f…`, 빌드는 `54a96787…`이었다.

원인은 Expo fingerprint가 `packageJson:scripts`를 해시 소스로 넣는다는 데 있었다. 별도 검증자가 `@expo/fingerprint` 0.10.3의 `build/sourcer/Bare.js`에 있는 `getPackageJsonScriptSourcesAsync`에서 이를 확인했다. 명령을 루트 `package.json`으로 옮기자 runtime이 다시 `54a96787…`이 되어 통과했다(3837–3854).

여기서 얻은 교훈은 이렇다. `apps/client/package.json`의 scripts만 바꿔도 OTA runtime이 바뀌어, 기존 빌드가 업데이트를 받지 못하고 새 빌드가 필요해진다. 스크립트 머리 주석에 이 이유를 적었다. [Ticket 03](../current/memory/tickets/03-project-context-reflection.md)의 반영 후보로 연결했다.

## 확인

| 확인 | 결과 |
| --- | --- |
| 인자 오류 5종: 채널 없음, 알 수 없는 채널, message 없음, production인데 confirm 없음, 알 수 없는 옵션 | 모두 exit 1(3787–3802) |
| 코드 경로에 커밋하지 않은 변경 | 거부 |
| production dry-run | "runtime이 있는 빌드가 없음"으로 멈춤. 1.1.4 전이라 맞는 결과(3805–3823) |
| preview dry-run(깨끗한 재설치 포함) | 명령을 루트로 옮긴 뒤 통과 |
| 실제 preview 발행 | `--skip-install --allow-dirty`, 메시지 "발행 스크립트 시험 (앱 코드 변경 없음)"으로 성공(3861–3869). 직전 dry-run에서 깨끗이 재설치했고, 남은 미커밋 변경은 스크립트와 루트 `package.json`뿐이었다 |

실제 발행 결과는 다음과 같다.
- 그룹 `0a0a6db0-3729-448b-a10b-f15d6841460a`, runtime `54a96787…`
- 소스맵 debug ID `544fabb1-9faf-459e-bf60-053317c91636`
- 번들 `index-73ac695b…`가 앞선 정리 업데이트 `f40c0676…`와 같았다.

앱 코드가 그대로라 번들과 debug ID가 같게 나온 것이다. [소스맵 기록](2026-11-17-04-commit-and-ota-sourcemap.md)에서 추정으로 남긴 "같은 debug ID"가 이것으로 확인됐다. 소스가 같으면 번들과 debug ID가 같다. Expo preview 브랜치에는 이 시험 업데이트가 더해졌다. 사용자는 이 발행을 실기기에서 따로 확인하지 않았다. 내용이 앞 업데이트와 같기 때문이다.

## 별도 검증

Main이 별도 검증자에게 스크립트를 처음부터 확인하게 했다(3883–3916). 판정은 요구 1–6을 충족한다는 것이었다. production 오발행이나 runtime 불일치 발행으로 이어지는 경로는 찾지 못했다. 검증자가 지적한 하위 결함 가운데 Main이 고친 것은 다음과 같다.
- `--skip-install` 안내를 고쳤다. JS 전용 패키지의 오래된 사본은 runtime에 드러나지 않는다는 점을 알린다.
- publish가 실패하면 "이미 올라갔을 수 있으니 대시보드를 확인하라"고 안내한다.
- 발행 뒤 runtime이 어긋나면 정리 방법을 안내한다.
- git status의 exit code를 확인한다.
- `ls` 대신 `readdirSync`를 쓴다.
- extends의 env를 병합한다.
- 빈 토큰을 거부한다.
- debug ID가 0개면 실패로 처리한다.
- dirty 검사 경로에 `.npmrc`·`pnpm-workspace.yaml`을 더했다.

고친 뒤 preview dry-run을 다시 통과했다.

고치지 않은 것도 있다. 로컬 셸에 export한 값이 EAS의 누락을 가리는 경우다. 검증자는 이를 하(下)로 판정했다. `eas update`도 같은 값을 쓰므로 번들과 runtime은 서로 맞는다. 발행 뒤 실패를 안내하는 경로 두 개는 실행으로 확인하지 못했고 코드를 읽어서만 판단했다.

## Ticket 02에 남은 것

- 마지막 스토어 빌드 커밋과의 경로 diff 검사: DB migration, `packages/schema`, `app.config.js`, 네이티브 의존성
- 서버 계약 변경을 통과시키는 방법
- `@env` 이름과 EAS 변수의 대조
- AI나 사람이 `eas update`를 직접 치는 것을 막는 hook

## 이 기록으로 고친 current

- Ticket 02 상태·구현·남은 일, Ticket 01 단계 5, Ticket 03 후보, Spec 05 방지 장치 절, state, recover, output·source·records·Ticket 색인
