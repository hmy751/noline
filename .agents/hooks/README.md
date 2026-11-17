# Noline 공통 AI 도구 hook

이 디렉터리는 Claude Code와 Codex가 함께 쓰는 hook의 원본을 소유한다. 각 도구의 설정은 사본을 만들지 않고 이 파일을 가리킨다. Claude는 `.claude/settings.json`에서, Codex는 `.codex/hooks.json`에서 등록한다. 등록 설정이 있다고 해서 실제 host가 hook을 호출하고 결과를 거부로 처리한다는 증명은 되지 않으므로, 동작은 host별로 따로 확인한다.

## 설치된 hook

| hook | 이벤트 | 하는 일 | 연결된 대상 |
| --- | --- | --- | --- |
| [block-direct-eas-update.py](block-direct-eas-update.py) | PreToolUse (셸 명령) | AI 도구가 `eas update`를 직접 실행하려 하면 거부하고 `pnpm ota:publish`로 안내한다. | 발행 스크립트 `apps/client/scripts/ota/publish.mjs` (Work 011 Ticket 02) |

## 연결과 확인

- 등록 명령은 hook 파일이 없으면 아무것도 하지 않고 넘어간다. 그래서 파일을 옮기거나 지울 때 설정을 놓치면 보호가 조용히 사라진다. `pnpm harness:check`가 두 설정이 가리키는 파일의 존재를 확인한다.
- hook은 실수를 막는 안내다. 사람이 자기 터미널에서 실행하는 명령은 막지 못한다.
- Claude Code에서는 실제 호출과 거부를 확인했다. Codex에서는 아직 확인하지 않았다.

## 바꾸거나 없앨 때

hook이 기대는 대상(위 표의 연결된 대상)이 바뀌면 hook의 판정과 안내 문구도 함께 고친다. 대상 기능을 없애면 hook 파일, 두 도구의 등록 설정, 이 표의 행을 함께 지운다. 변경 뒤에는 `pnpm harness:check`를 실행한다.
