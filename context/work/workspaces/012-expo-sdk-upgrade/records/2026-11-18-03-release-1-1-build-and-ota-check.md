# 2026-11-18 — `release/1.1`의 빌드·OTA 확인: production 빌드를 생략한 판단과 복구 발행의 watchman 실패

원문 줄 번호는 Main 대화 `6cf742c7-a162-4a57-981d-2258485e4b19`(JSONL 로그) 기준이다. 앞선 진행은 [Ticket 01 진행 기록](2026-11-18-02-ticket01-baseline-node24-and-expo-install.md)에 있다.

## 시작과 범위

`release/1.1`을 push한 뒤 Main이 "release/1.1에서 production 빌드와 preview OTA 확인을 돌릴까요?"라고 물었고(548행), 사용자가 "빌드·OTA 진행"이라고 답했다(560행). Main은 Project [출시 기준](../../../../project/guidance/app-release-and-ota.md)과 011의 기기 OTA 확인 방법(로그인 화면 문구를 바꿔 발행하고 앱을 두 번 열어 본다)을 읽고 같은 방식으로 진행했다(566–594행).

main 작업 트리는 Node 24 미커밋 변경과 무관한 수정이 섞여 있어, 깨끗한 `release/1.1`에서 발행하려고 worktree `.claude/worktrees/012-release-1.1`을 만들었다. gitignore 대상인 `apps/client`의 env 파일 3개(`.env.development`, `.env.development.local`, `.env.production`)를 main에서 복사했고, `.nvmrc`가 20.18.1인 브랜치라 Node 20.18.1로 설치했다(600–614행).

## production 빌드를 새로 돌리지 않았다

Ticket 01은 "`release/1.1`에서 production 프로필로 빌드가 만들어지는지" 확인한다고 했고, 사용자의 "빌드·OTA 진행"도 그 질문에 대한 답이었다. Main은 production 빌드를 새로 만들지 않기로 판단하고, preview 빌드를 시작한 뒤 사용자에게 알렸다(698행). 사용자는 이에 대해 따로 답하지 않고 다음 단계("문구가 잘 보여", 703행)로 넘어갔다.

Main이 든 이유는 둘이다.
- 같은 커밋 `d160c7b5`로 만든 1.1.4 production 빌드 `7033c2ba`가 이미 성공했다. 같은 커밋에서 production 빌드가 만들어진다는 근거는 이미 있다.
- 새 production 빌드가 production 채널의 최신 빌드가 되면, "채널의 최신 빌드와 runtime이 같을 때만 발행"하는 발행 스크립트의 대상이 1.1.4 스토어 빌드에서 바뀌어 1.1.4 사용자에게 갈 OTA가 흔들릴 수 있다.

대신 `pnpm ota:publish production --dry-run`을 깨끗한 재설치를 포함해 돌렸다(622–623행). 로컬 runtime `0367b72f308228a445726174dabf39c401499fdd`가 최신 production 빌드 `7033c2ba`(1.1.4/18)와 같아, `release/1.1`에서 발행하면 1.1.4 스토어 빌드를 쓰는 기기가 받는다는 것까지 확인했다. 실제 production 발행은 하지 않았다.

이 대체는 Ticket 01 완료 조건의 문구("그 브랜치에서 만든 빌드 ID")를 preview 빌드로 채운다. production 프로필의 새 빌드 성공 자체는 확인하지 않았다는 한계가 남는다.

## preview 빌드와 OTA 수신

| 단계 | 결과 | 원문 |
| --- | --- | --- |
| preview 빌드 | `30c46ce2-39f7-450d-9c1c-bce9b4f2dff6` FINISHED, 1.1.4/18, commit `d160c7b5`, runtime `92c898f200ec3d0ca19050454773991bdc75371f`, `com.noline.dev` | 634–680행 |
| preview dry-run | 최신 preview 빌드 `30c46ce2`와 runtime 일치 | 684–685행 |
| 설치 | 사용자가 iPhone의 기존 `com.noline.dev`(1.1.3) 위에 덮어 설치하고 원래 부제를 확인: "그래 지금 보니까 문구가 잘 보여 \"네트워크가 없어도 여행은 계속된다\"" | 698–703행 |
| 시험 발행 | `LoginScreen.tsx` 부제에 " · OTA 시험 release/1.1"을 미커밋으로 넣고 `pnpm ota:publish preview --allow-dirty`. 그룹 `dedf8fc0-46ae-4ac8-8f68-2d9e98e51c59`, Sentry 소스맵 업로드. 발행 직후 worktree에서 되돌림 | 709–722행 |
| 수신 | 앱을 두 번 연 뒤 사용자: "붙어 보여" | 729–734행 |
| 복구 발행 | 깨끗한 트리에서 다시 발행. 그룹 `0272f0e0-c752-4a36-b502-26c900986079`, 소스맵 업로드 | 738–783행 |
| 복구 확인 | 사용자: "원래대로 돌아왔어" | 788–797행 |

덮어 설치로 기존 1.1.3 앱의 데이터가 남았는지는 확인하지 않았다. 이 기기의 preview 앱은 이제 1.1.4 빌드 `30c46ce2`에 깨끗한 코드의 업데이트 `0272f0e0`이 적용된 상태다. Ticket 02의 첫 단계("1.1.4 preview를 새로 빌드해 설치한다")가 이것으로 채워졌다.

## 복구 발행의 실패와 watchman 초기화

깨끗한 트리에서의 첫 복구 발행은 runtime 대조까지 통과한 뒤 `Export failed`로 끝났다(738–739행). `--skip-install`로 다시 돌려 출력을 보니 Metro가 `Unable to resolve module @repo/ui`를 냈다(745–751행). `apps/client/node_modules/@repo/ui` 심볼릭 링크는 `packages/ui`를 가리키며 존재했다(756–757행). `metro.config.js`는 workspace 루트를 감시하고 symlink를 따르는 설정이다(767–768행). watchman이 이 worktree를 감시 중이었다(773–774행).

`watchman watch-del <worktree>` 뒤 `--skip-install`로 재실행하자 발행에 성공했다(777–783행). `--skip-install`을 쓴 이유는 바로 앞의 실패한 시도가 이미 `node_modules` 삭제와 깨끗한 재설치를 했기 때문이다. 실패한 두 시도는 업로드 전에 멈춰 올라간 업데이트가 없다.

원인은 발행 스크립트가 `node_modules`를 지우고 다시 설치한 뒤 watchman의 감시 상태가 바뀐 폴더를 반영하지 못한 것으로 추정한다. 같은 스크립트의 앞선 두 발행(dry-run, 시험 발행)은 같은 재설치 뒤에도 성공했으므로 늘 일어나는 문제는 아니다. 확인한 것은 watchman 초기화로 해결됐다는 사실뿐이고 원인을 따로 증명하지는 않았다.

발행 스크립트나 Project 출시 기준에 "재설치 뒤 watchman 초기화" 같은 대응을 넣을지는 정하지 않았다. 012의 기록 범위 밖이라 Main의 판단으로 남겼다.

## 남은 것

- worktree `.claude/worktrees/012-release-1.1`은 남겨 두었다. 1.1.x 핫픽스나 Ticket 02에 다시 쓸 수 있고, 지울지는 정하지 않았다.
- preview 채널의 최신 빌드는 이제 `30c46ce2`(1.1.4)이고 최신 업데이트는 깨끗한 `release/1.1` 코드의 `0272f0e0`이다.
