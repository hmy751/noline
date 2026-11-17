import { spawnSync } from 'node:child_process';

export function step(title) {
  console.log(`\n▶ ${title}`);
}

export function ok(message) {
  console.log(`  ✔ ${message}`);
}

export function warn(message) {
  console.log(`  ! ${message}`);
}

/** 실패를 알리되 종료하지 않는다. 여러 실패를 모아 보여 줄 때 쓴다. */
export function report(message, hint) {
  console.error(`\n✖ ${message}`);

  if (hint) {
    console.error(`  ${hint}`);
  }
}

/** 실패를 알리고 종료한다. 다음에 할 일을 hint로 함께 보여 준다. */
export function fail(message, hint) {
  report(message, hint);
  process.exit(1);
}

export function indentLines(lines) {
  return lines.map((line) => `      ${line}`).join('\n');
}

/**
 * 출력을 받아 해석할 때 쓴다. 진행 표시(stderr)는 그대로 보인다.
 * 명령을 실행하지 못하면 종료하고, 실행은 됐지만 실패한 경우는 status로 돌려줘 호출자가 판단한다.
 */
export function capture(cmd, args, { cwd, env } = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  if (result.error) {
    fail(`${cmd} 실행 실패: ${result.error.message}`);
  }

  return { status: result.status, stdout: result.stdout ?? '' };
}

/** 사람이 진행을 지켜봐야 하는 긴 명령에 쓴다. 실패 처리는 capture와 같다. */
export function run(cmd, args, { cwd } = {}) {
  const result = spawnSync(cmd, args, { cwd, stdio: 'inherit' });

  if (result.error) {
    fail(`${cmd} 실행 실패: ${result.error.message}`);
  }

  return result.status;
}
