# 직접 발행 hook을 `.agents/hooks/`로 옮김

2026-11-17 오후 4시 35분경(KST)의 짧은 기록이다. `eas update` 직접 실행을 막는 hook을 앱 코드(`apps/client/scripts/ota/`)에서 AI 하네스 영역(`.agents/hooks/`)으로 옮겼다. 위치를 정한 근거가 바뀌었으므로 남긴다. [재구성 기록](2026-11-17-07-ota-script-reorganization.md)에 적은 "OTA 스크립트 옆에 둔 이유"는 당시 판단으로 그대로 둔다. 지금 위치와 이유는 이 기록이 대신한다. 변경은 커밋하지 않았다.

원문은 [source 색인](../source/index.md)의 두 번째 세션 원문이다. 괄호 안 숫자는 그 파일의 행 번호이며, 이 기록의 범위는 5181–5294행이다.

## 사용자의 판단

Main이 재구성 결과를 설명하면서 hook을 OTA 폴더에 둔 이유를 다시 말했다(5191). 사용자는 "한글로"(5181)라고 요청해 이 설명을 한국어로 받았다. 이어서 이렇게 답했다.

> "근데 아쉬운게 하나 뭐냐면 hook 을 claude에  두고 뭐 이런건 좋고 한데 어찌보면 AI 관리 하네스 관점이고 그게 apps/client/scripts로 있는게 아쉼다는거지 관리 차원 측면에서" (5196)

hook을 도구 설정에 등록하는 방식은 좋다고 했다. 다만 hook 파일 자체는 AI 하네스 관리의 대상이므로 앱 코드 아래에 있는 것이 아쉽다는 판단이었다.

## 바꾼 것 (미커밋)

- `apps/client/scripts/ota/block-direct-eas-update.py`를 `.agents/hooks/block-direct-eas-update.py`로 옮겼다. docstring은 연결 대상인 `apps/client/scripts/ota/publish.mjs`를 가리킨다.
- 새 `.agents/hooks/README.md`를 만들었다. 이 폴더가 맡는 것, 설치된 hook 표(이벤트, 하는 일, 연결된 대상), 두 도구 설정에서 등록하는 방식을 적었다. 파일이 없으면 조용히 건너뛰는 동작과 그것을 잡는 harness 검사도 적었다. Claude에서는 확인했고 Codex에서는 아직이라는 점, 대상이 바뀌거나 없어질 때 함께 지울 것도 들어 있다.
- `.claude/settings.json`과 `.codex/hooks.json`이 새 경로를 가리킨다.
- 루트 `CLAUDE.md`를 고쳤다. 디렉터리 구조의 `.agents/` 줄은 `skills/`·`hooks/`를 담는 공통 원본으로 바꿨다. `.claude/`·`.codex/` 줄에는 "hook 등록"을 적었다. 도구 연결 항목에는 `.agents/hooks/README.md` 링크를 더했다.
- `scripts/check-harness.mjs`: `.agents` 아래에 `hooks`를 허용한다. hook 명령이 가리키는 파일이 있는지 보는 검사는 그대로다.
- `apps/client/scripts/ota/publish.mjs` 머리 주석의 hook 경로를 고쳤다.

## 이 위치의 근거

`.agents/`는 이미 Claude와 Codex가 함께 쓰는 공통 원본 자리다. `.agents/skills/`는 Codex가 직접 읽고, Claude는 symlink로 읽는다. `.agents/hooks/`는 같은 관례를 따른다. 두 도구의 설정이 한 파일을 가리키는 구성은 그대로다. 달라진 것은 그 파일이 앱 코드가 아니라 하네스 영역에 있다는 점이다.

앞선 근거는 "OTA 흐름과 함께 바뀌고 함께 지운다"였다. 이 필요는 `.agents/hooks/README.md`의 "연결된 대상"과 "바꾸거나 없앨 때"가 맡는다. 발행 스크립트를 바꾸거나 없앨 때 README와 harness 검사가 hook을 함께 보게 한다.

## 확인

- `pnpm harness:check`: 기존 깨진 링크 64건 외 실패가 없다.
- hook 35가지가 새 경로에서도 의도대로 나왔다.
- 두 도구의 등록 명령을 흉내 내 `eas update`를 넣으면 둘 다 2를 반환했다.
- 이 세션의 Claude Code에서 새 위치의 hook이 실제로 막았다(5276).
- `publish.mjs`는 주석만 바뀌어 `node --check`만 했고 dry-run은 다시 하지 않았다.
- Codex의 실제 동작은 여전히 확인 전이다.

## 이 기록으로 고친 current

- Ticket 02의 hook 경로·위치 근거·함께 커밋할 파일, Spec 05 방지 장치 절, state, output·source·records 색인, recover
