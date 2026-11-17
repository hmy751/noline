/** EAS CLI 호출과 결과 해석. 판단은 checks.mjs와 publish.mjs가 맡는다. */
import { CLIENT_DIR, PLATFORM, SENTRY_ENV_FILE } from './config.mjs';
import { capture, fail } from './terminal.mjs';

const EAS_BIN = process.env.EAS_BIN || 'eas';
const SENTRY_UPLOAD_COMMAND = `node --env-file=${SENTRY_ENV_FILE} ../../node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js dist`;

/**
 * EAS environment에서 values 이름의 값과 has 이름의 존재 여부를 읽는다.
 * 비밀일 수 있는 has 쪽은 값을 꺼내지 않고 있는지만 돌려준다.
 */
export function readEnvironment(environment, { values, has }) {
  const code = [
    'const e = process.env;',
    `const out = { values: Object.fromEntries(${JSON.stringify(values)}.map((k) => [k, e[k] ?? null])),`,
    `  has: Object.fromEntries(${JSON.stringify(has)}.map((k) => [k, !!e[k]])) };`,
    'console.log("OTA_ENV=" + JSON.stringify(out));',
  ].join(' ');
  const { status, stdout } = execInEnvironment(environment, `node -e '${code}'`);
  const result = parseJsonLine(stdout, 'OTA_ENV=');

  if (status !== 0 || !result) {
    fail(`EAS environment "${environment}"의 값을 읽지 못했습니다.`);
  }

  return result;
}

/** 이 작업 트리를 그 environment의 환경값으로 빌드했을 때의 runtime. */
export function resolveLocalRuntime(environment) {
  const { status, stdout } = execInEnvironment(
    environment,
    `npx expo-updates runtimeversion:resolve --platform ${PLATFORM}`,
  );
  const result = parseJsonLine(stdout, '{');

  if (status !== 0 || !result?.runtimeVersion) {
    fail('로컬 runtime을 계산하지 못했습니다.');
  }

  return result.runtimeVersion;
}

/** 채널의 finished 빌드를 최신순으로 돌려준다. */
export function listFinishedBuilds(channel) {
  const { status, stdout } = runEasJson([
    'build:list',
    '--channel',
    channel,
    '--platform',
    PLATFORM,
    '--status',
    'finished',
    '--limit',
    '50',
  ]);
  const builds = parseJsonBlock(stdout);

  if (status !== 0 || !Array.isArray(builds)) {
    fail(`채널 "${channel}"의 빌드 목록을 읽지 못했습니다.`);
  }

  return builds;
}

export function describeBuild(build) {
  const date = build.completedAt?.slice(0, 10) ?? '';

  return `${build.id.slice(0, 8)} (${build.appVersion} / ${build.appBuildVersion}, ${date})`;
}

/** 채널과 같은 이름의 environment로 업데이트를 발행하고, 발행된 업데이트를 돌려준다. */
export function publishUpdate(channel, message) {
  const { status, stdout } = runEasJson([
    'update',
    '--channel',
    channel,
    '--environment',
    channel,
    '--platform',
    PLATFORM,
    '--message',
    message,
  ]);
  const updates = parseJsonBlock(stdout);

  if (status !== 0 || !Array.isArray(updates) || !updates.length) {
    fail(
      'eas update가 실패했거나 결과를 읽지 못했습니다. 업데이트가 이미 올라갔을 수 있습니다.',
      `다시 실행하기 전에 EAS 대시보드에서 ${channel} 브랜치의 최신 업데이트를 확인하세요. 올라갔다면 소스맵만 따로 올리면 됩니다.`,
    );
  }

  return updates[0];
}

/** eas update가 만든 dist의 번들·소스맵을 Sentry에 올리고 debug ID를 돌려준다. */
export function uploadSourcemaps(channel) {
  const { status, stdout } = execInEnvironment(channel, SENTRY_UPLOAD_COMMAND);
  const debugIds = [...new Set([...stdout.matchAll(/debug id ([0-9a-f-]{36})/g)].map((m) => m[1]))];

  console.log(stdout.trimEnd().replace(/^/gm, '    '));

  if (status !== 0 || !/successfully/i.test(stdout) || !debugIds.length) {
    fail(
      '업데이트는 발행됐지만 Sentry 소스맵 업로드가 실패했습니다.',
      `apps/client에서 다시 올리세요: EXPO_NO_DOTENV=1 eas env:exec ${channel} '${SENTRY_UPLOAD_COMMAND}' --non-interactive`,
    );
  }

  return debugIds;
}

/** EAS environment의 변수(SECRET 포함)를 넣고, 로컬 .env는 읽지 않은 채 명령을 실행한다. */
function execInEnvironment(environment, command) {
  return capture(EAS_BIN, ['env:exec', environment, command, '--non-interactive'], {
    cwd: CLIENT_DIR,
    env: { EXPO_NO_DOTENV: '1' },
  });
}

function runEasJson(args) {
  return capture(EAS_BIN, [...args, '--json', '--non-interactive'], { cwd: CLIENT_DIR });
}

// eas는 버전 안내 같은 줄을 JSON 앞뒤에 섞어 출력한다.
function parseJsonLine(stdout, prefix) {
  const line = stdout.split('\n').find((l) => l.startsWith(prefix));

  if (!line) {
    return undefined;
  }

  try {
    return JSON.parse(prefix === '{' ? line : line.slice(prefix.length));
  } catch {
    return undefined;
  }
}

function parseJsonBlock(stdout) {
  const start = stdout.search(/^[[{]/m);

  if (start < 0) {
    return undefined;
  }

  try {
    return JSON.parse(stdout.slice(start));
  } catch {
    return undefined;
  }
}
