#!/usr/bin/env python3
"""Claude·Codex가 `eas update`를 직접 실행하지 못하게 막는 PreToolUse hook (Work 011 Ticket 02).

OTA 발행은 apps/client/scripts/ota/publish.mjs(`pnpm ota:publish`)가 점검과 함께 한다. AI 도구가 그 점검을 건너뛰고
`eas update`를 실행하려 하면 거부하고 발행 스크립트를 안내한다.

- 발행 스크립트 안의 `eas update`는 hook을 거치지 않는 하위 프로세스라 막히지 않는다.
- `eas update:list`, `eas update:roll-back-to-embedded`처럼 콜론이 붙은 하위 명령은 막지 않는다.
- 사람이 자기 터미널에서 치는 명령은 막지 못한다. 보안 경계가 아니라 실수를 막는 안내다.

입력은 stdin의 hook JSON(`tool_input.command`)이다. 거부하면 이유를 stderr에 쓰고 exit 2로 끝난다
(Claude Code PreToolUse의 거부 방식).
"""
import json
import os
import shlex
import sys

EAS_PROGRAMS = {"eas", "eas-cli"}
SHELLS = {"sh", "bash", "zsh"}
# 이 명령으로 시작하는 줄은 글을 다루는 것이라 그 안의 "eas update"를 실행으로 보지 않는다.
TEXT_TOOLS = {"echo", "printf", "grep", "rg", "ag", "git", "cat", "sed", "awk", "head", "tail", "less"}
SEPARATORS = ";&|()\n"
MAX_NESTING = 3

REFUSAL = """eas update를 직접 실행하지 않습니다. OTA 발행은 저장소 루트에서 발행 스크립트로 하세요:
  pnpm ota:publish <preview|production> --message "..." [--dry-run]
스크립트가 재설치·환경값·runtime·OTA로 내면 안 되는 변경을 점검하고 소스맵까지 올립니다
(apps/client/scripts/ota/publish.mjs). 꼭 직접 실행해야 하면 사용자에게 요청하세요.
"""


def main():
    command = read_command(sys.stdin)

    if command is None or not runs_eas_update(command):
        return 0

    sys.stderr.write(REFUSAL)
    return 2


def read_command(stream):
    """hook 입력에서 실행할 명령을 문자열로 꺼낸다. 명령이 없는 도구 호출이면 None."""
    try:
        payload = json.load(stream)
    except ValueError:
        return None

    tool_input = payload.get("tool_input")
    command = tool_input.get("command") if isinstance(tool_input, dict) else None

    # argv 배열은 따옴표 구조가 유지되게 다시 감싼다.
    if isinstance(command, list):
        return shlex.join(str(part) for part in command)

    return command if isinstance(command, str) else None


def runs_eas_update(command, depth=0):
    if depth > MAX_NESTING:
        return False

    return any(segment_runs_eas_update(words, depth) for words in split_segments(command))


def split_segments(command):
    """따옴표를 지키며 ; && || | & ( ) 줄바꿈에서 나눈다. 따옴표 안의 문장은 한 단어로 남는다."""
    lexer = shlex.shlex(command, posix=True, punctuation_chars=SEPARATORS)
    lexer.whitespace = " \t\r"
    lexer.whitespace_split = True

    try:
        tokens = list(lexer)
    except ValueError:
        tokens = command.split()

    segments = [[]]

    for token in tokens:
        if all(char in SEPARATORS for char in token):
            segments.append([])
        else:
            segments[-1].append(token)

    return segments


def segment_runs_eas_update(words, depth):
    """npx·pnpm exec·timeout 같은 앞부분과 상관없이 eas의 하위 명령을 본다."""
    if not words or program(words[0]) in TEXT_TOOLS:
        return False

    for index, word in enumerate(words):
        name = program(word)
        rest = words[index + 1 :]

        if name in SHELLS:
            script = shell_script(rest)

            if script is not None and runs_eas_update(script, depth + 1):
                return True

        if name in EAS_PROGRAMS:
            subcommand = first_positional(rest)

            if subcommand == "update":
                return True

            # eas env:exec <환경> '<명령>' 안의 명령도 본다.
            if subcommand == "env:exec" and any(runs_eas_update(arg, depth + 1) for arg in rest):
                return True

    return False


def first_positional(args):
    """`eas --non-interactive update`처럼 하위 명령 앞에 오는 전역 플래그를 건너뛴 첫 인자."""
    return next((arg for arg in args if not arg.startswith("-")), None)


def program(word):
    """경로와 @버전을 걷어 낸 실행 파일 이름. 예: ./node_modules/.bin/eas-cli@16 → eas-cli"""
    return os.path.basename(word).split("@")[0]


def shell_script(args):
    """`bash -lc '<스크립트>'`의 스크립트. c가 들어간 짧은 플래그 묶음(-c, -lc, -ic) 다음 인자다."""
    for index, arg in enumerate(args[:-1]):
        if arg.startswith("-") and not arg.startswith("--") and "c" in arg[1:]:
            return args[index + 1]

    return None


if __name__ == "__main__":
    sys.exit(main())
