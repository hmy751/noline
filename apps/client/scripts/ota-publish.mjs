#!/usr/bin/env node
/**
 * OTA 업데이트 발행 스크립트 (Work 011 Ticket 02).
 *
 * 다음 실수는 명령이 성공으로 끝나도 조용히 문제를 남긴다. 이 스크립트는 발행 전에 이를 막는다.
 * - 오래된 node_modules 때문에 로컬 runtime이 빌드와 달라져 업데이트가 어떤 기기에도 가지 않음
 * - 채널과 다른 EAS environment로 발행해 환경값과 runtime이 어긋남
 * - Sentry 소스맵을 올리지 않아 오류 위치를 읽을 수 없음
 *
 * 순서: 사전 점검 → 깨끗한 재설치 → 환경값 대조 → runtime 대조 → eas update → 소스맵 업로드
 *
 * 사용법 (저장소 루트에서):
 *   pnpm ota:publish preview --message "무엇을 고쳤는지"
 *   pnpm ota:publish production --message "..." --confirm-production
 *
 * 옵션:
 *   --dry-run             점검과 runtime 대조까지만 하고 발행하지 않는다
 *   --skip-install        깨끗한 재설치를 건너뛴다 (runtime 대조는 그대로 한다)
 *   --allow-dirty         코드 경로에 커밋하지 않은 변경이 있어도 진행한다
 *   --confirm-production  production 발행에 필요하다
 *
 * 실행 명령은 루트 package.json에 둔다. Expo fingerprint는 apps/client/package.json의 scripts까지
 * runtime 계산에 넣으므로, 여기에 명령을 추가하면 runtime이 바뀌어 기존 빌드가 업데이트를 받지 못한다.
 *
 * OTA로 내면 안 되는 변경(기기 DB 구조, 서버보다 먼저 나가는 계약)의 검사는 아직 없다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLIENT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = join(CLIENT_DIR, '..', '..');
const CHANNELS = ['preview', 'production'];
const PLATFORM = 'ios';
const EAS = process.env.EAS_BIN || 'eas';
// 발행 결과에 영향을 주는 경로. 여기에 커밋하지 않은 변경이 있으면 업데이트가 어느 커밋인지 알 수 없다.
const CODE_PATHS = [
  'apps/client',
  'packages',
  'patches',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
];
const SENTRY_UPLOAD_SCRIPT = '../../node_modules/@sentry/react-native/scripts/expo-upload-sourcemaps.js';
const SENTRY_ENV_FILE = '.env.production';

function parseArgs(argv) {
  const opts = { flags: new Set(), message: undefined, channel: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    if (arg === '--message' || arg === '-m') {
      opts.message = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--message=')) {
      opts.message = arg.slice('--message='.length);
    } else if (arg.startsWith('--')) {
      opts.flags.add(arg.slice(2));
    } else if (!opts.channel) {
      opts.channel = arg;
    } else {
      fail(`알 수 없는 인자: ${arg}`);
    }
  }
  const known = new Set(['dry-run', 'skip-install', 'allow-dirty', 'confirm-production']);
  for (const flag of opts.flags) if (!known.has(flag)) fail(`알 수 없는 옵션: --${flag}`);
  return opts;
}

function fail(message, hint) {
  console.error(`\n✖ ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

function step(title) {
  console.log(`\n▶ ${title}`);
}

function ok(message) {
  console.log(`  ✔ ${message}`);
}

/** 출력을 받아 파싱할 때 쓴다. 진행 표시는 stderr로 그대로 보인다. */
function capture(cmd, args, { cwd = CLIENT_DIR, env } = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.error) fail(`${cmd} 실행 실패: ${result.error.message}`);
  return { status: result.status, stdout: result.stdout ?? '' };
}

/** 사람이 진행을 지켜봐야 하는 긴 단계에 쓴다. */
function run(cmd, args, { cwd = CLIENT_DIR, env } = {}) {
  const result = spawnSync(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
  if (result.error) fail(`${cmd} 실행 실패: ${result.error.message}`);
  return result.status;
}

/** eas env:exec는 EAS 환경 변수(SECRET 포함)를 넣은 채 명령을 실행한다. 로컬 .env는 읽지 않게 한다. */
function easEnvExec(environment, command) {
  return capture(EAS, ['env:exec', environment, command, '--non-interactive'], { env: { EXPO_NO_DOTENV: '1' } });
}

/** 출력에서 지정한 접두어로 시작하는 줄의 JSON을 꺼낸다. eas는 버전 안내 같은 줄을 섞어 출력한다. */
function extractJsonLine(stdout, prefix) {
  const line = stdout.split('\n').find((l) => l.startsWith(prefix));
  if (!line) return undefined;
  try {
    return JSON.parse(line.slice(prefix === '{' || prefix === '[' ? 0 : prefix.length));
  } catch {
    return undefined;
  }
}

function extractJsonBlock(stdout) {
  const start = stdout.search(/^[[{]/m);
  if (start < 0) return undefined;
  try {
    return JSON.parse(stdout.slice(start));
  } catch {
    return undefined;
  }
}

// ── 1. 사전 점검 ─────────────────────────────────────────────

function checkArgs(opts) {
  if (!opts.channel || !CHANNELS.includes(opts.channel)) {
    fail(`채널을 지정하세요: ${CHANNELS.join(' | ')}`, '예: pnpm ota:publish preview --message "..."');
  }
  if (!opts.message || !opts.message.trim()) {
    fail('--message로 이 업데이트의 내용을 적으세요. EAS 대시보드와 기록에 남습니다.');
  }
  if (opts.channel === 'production' && !opts.flags.has('confirm-production') && !opts.flags.has('dry-run')) {
    fail('production 발행에는 --confirm-production이 필요합니다.', '먼저 --dry-run으로 점검만 해 볼 수 있습니다.');
  }
}

/** 채널과 environment는 같은 이름을 쓴다. eas.json의 빌드 프로필도 같은 짝인지 확인한다. */
function checkEasJson(channel) {
  const easJson = JSON.parse(readFileSync(join(CLIENT_DIR, 'eas.json'), 'utf8'));
  const entry = Object.entries(easJson.build ?? {}).find(([, profile]) => profile.channel === channel);
  if (!entry) fail(`eas.json에 channel "${channel}"을 쓰는 빌드 프로필이 없습니다.`);
  const [name, profile] = entry;
  if (profile.environment !== channel) {
    fail(
      `eas.json의 "${name}" 프로필은 channel "${channel}"인데 environment가 "${profile.environment}"입니다.`,
      '빌드와 발행이 같은 EAS environment를 써야 runtime이 맞습니다.',
    );
  }
  ok(`eas.json "${name}" 프로필: channel·environment 모두 "${channel}"`);
  return { ...profile, env: resolveProfileEnv(easJson.build, name) };
}

/** extends로 물려받은 env까지 합친다. 자식 프로필의 값이 우선한다. */
function resolveProfileEnv(profiles, name, seen = new Set()) {
  if (seen.has(name)) fail(`eas.json 프로필 extends가 순환합니다: ${name}`);
  seen.add(name);
  const profile = profiles[name];
  if (!profile) fail(`eas.json에 "${name}" 프로필이 없습니다.`);
  const inherited = profile.extends ? resolveProfileEnv(profiles, profile.extends, seen) : {};
  return { ...inherited, ...(profile.env ?? {}) };
}

function checkGitClean(opts) {
  const { status, stdout } = capture('git', ['status', '--porcelain', '--', ...CODE_PATHS], { cwd: REPO_ROOT });
  if (status !== 0) fail('git status를 실행하지 못했습니다.');
  const dirty = stdout.trim();
  if (!dirty) {
    ok('코드 경로에 커밋하지 않은 변경 없음');
    return;
  }
  if (opts.flags.has('allow-dirty')) {
    console.log(`  ! 커밋하지 않은 변경이 있지만 --allow-dirty로 진행합니다:\n${dirty.replace(/^/gm, '      ')}`);
    return;
  }
  fail(
    `코드 경로에 커밋하지 않은 변경이 있습니다:\n${dirty.replace(/^/gm, '    ')}`,
    '커밋한 뒤 발행하세요. 업데이트가 어느 커밋인지 남기기 위해서입니다. 의도한 시험이면 --allow-dirty.',
  );
}

function checkSentryToken() {
  const file = join(CLIENT_DIR, SENTRY_ENV_FILE);
  const match = existsSync(file) ? readFileSync(file, 'utf8').match(/^SENTRY_AUTH_TOKEN=(.*)$/m) : null;
  const hasToken = !!match && match[1].trim().replace(/^["']|["']$/g, '').length > 0;
  if (!hasToken) {
    fail(
      `apps/client/${SENTRY_ENV_FILE}에 SENTRY_AUTH_TOKEN이 없습니다.`,
      'EAS의 토큰은 SECRET이라 로컬에서 읽을 수 없습니다. 로컬 파일에 토큰을 두어야 소스맵을 올릴 수 있습니다.',
    );
  }
  ok(`apps/client/${SENTRY_ENV_FILE}에 SENTRY_AUTH_TOKEN 있음`);
}

// ── 2. 깨끗한 재설치 ─────────────────────────────────────────

/** lockfile이 같아도 예전 설치가 남긴 중첩 사본이 fingerprint를 바꾼다(2026-11-17 첫 preview 빌드 실패의 원인). */
function cleanInstall() {
  const dirs = ['node_modules'];
  for (const group of ['apps', 'packages']) {
    for (const entry of readdirSync(join(REPO_ROOT, group), { withFileTypes: true })) {
      if (entry.isDirectory()) dirs.push(join(group, entry.name, 'node_modules'));
    }
  }
  for (const dir of dirs) rmSync(join(REPO_ROOT, dir), { recursive: true, force: true });
  ok('node_modules 삭제');
  if (run('pnpm', ['install', '--frozen-lockfile'], { cwd: REPO_ROOT }) !== 0) fail('pnpm install 실패');
  ok('pnpm install --frozen-lockfile');
}

// ── 3. 환경값 대조 ───────────────────────────────────────────

/**
 * eas update는 eas.json 빌드 프로필의 env를 쓰지 않고 EAS environment의 값만 쓴다.
 * 프로필 env(예: APP_VARIANT)가 EAS environment에 같은 값으로 없으면 빌드와 다른 번들이 나온다.
 * Sentry 업로드에 필요한 이름이 있는지도 함께 본다. 값은 비밀이 아닌 것만 출력한다.
 */
function checkEasEnvironment(channel, profile) {
  const profileEnv = profile.env ?? {};
  const names = Object.keys(profileEnv);
  const code = [
    'const e = process.env;',
    `const pick = ${JSON.stringify(names)};`,
    'const out = { values: Object.fromEntries(pick.map((k) => [k, e[k] ?? null])),',
    '  has: { SENTRY_ORG: !!e.SENTRY_ORG, SENTRY_PROJECT: !!e.SENTRY_PROJECT } };',
    'console.log("OTA_ENV=" + JSON.stringify(out));',
  ].join(' ');
  const { status, stdout } = easEnvExec(channel, `node -e '${code}'`);
  const result = extractJsonLine(stdout, 'OTA_ENV=');
  if (status !== 0 || !result) fail(`EAS environment "${channel}"의 값을 읽지 못했습니다.`);

  for (const [key, expected] of Object.entries(profileEnv)) {
    const actual = result.values[key];
    if (actual !== expected) {
      fail(
        `eas.json 프로필은 ${key}=${expected}로 빌드하지만 EAS environment "${channel}"에는 ${key}=${actual ?? '(없음)'}입니다.`,
        `eas update는 프로필 env를 쓰지 않습니다. EAS environment "${channel}"에 ${key}=${expected}를 넣으세요.`,
      );
    }
  }
  if (names.length) ok(`프로필 env가 EAS environment와 같음: ${names.map((k) => `${k}=${profileEnv[k]}`).join(', ')}`);
  if (!result.has.SENTRY_ORG || !result.has.SENTRY_PROJECT) {
    fail(`EAS environment "${channel}"에 SENTRY_ORG·SENTRY_PROJECT가 없어 소스맵을 올릴 수 없습니다.`);
  }
  ok('SENTRY_ORG·SENTRY_PROJECT 있음');
}

// ── 4. runtime 대조 ──────────────────────────────────────────

function resolveLocalRuntime(channel) {
  const { status, stdout } = easEnvExec(channel, `npx expo-updates runtimeversion:resolve --platform ${PLATFORM}`);
  const result = extractJsonLine(stdout, '{');
  if (status !== 0 || !result?.runtimeVersion) fail('로컬 runtime을 계산하지 못했습니다.');
  return result.runtimeVersion;
}

function listChannelBuilds(channel) {
  const { status, stdout } = capture(EAS, [
    'build:list',
    '--channel',
    channel,
    '--platform',
    PLATFORM,
    '--status',
    'finished',
    '--limit',
    '10',
    '--json',
    '--non-interactive',
  ]);
  const builds = extractJsonBlock(stdout);
  if (status !== 0 || !Array.isArray(builds)) fail(`채널 "${channel}"의 빌드 목록을 읽지 못했습니다.`);
  return builds;
}

function describeBuild(build) {
  const date = build.completedAt?.slice(0, 10) ?? '';
  return `${build.id.slice(0, 8)} (${build.appVersion} / ${build.appBuildVersion}, ${date})`;
}

/**
 * 업데이트는 runtime이 같은 빌드에만 간다. 로컬 runtime과 같은 빌드가 채널에 없으면 발행해도 받을 기기가 없다.
 * 가장 최근 빌드와 다르고 예전 빌드와만 같으면, 최신 빌드 사용자에게는 가지 않으므로 멈춘다.
 */
function compareRuntime(channel) {
  const local = resolveLocalRuntime(channel);
  ok(`로컬 runtime: ${local}`);
  const builds = listChannelBuilds(channel).filter((b) => b.runtimeVersion);
  if (!builds.length) {
    fail(
      `채널 "${channel}"에 runtime이 있는 빌드가 없습니다. expo-updates가 들어간 빌드를 먼저 배포해야 합니다.`,
      channel === 'production' ? '1.1.4 이후의 스토어 빌드가 필요합니다.' : undefined,
    );
  }
  const latest = builds[0];
  if (latest.runtimeVersion === local) {
    ok(`최신 빌드 ${describeBuild(latest)}와 runtime이 같음`);
    return { local, build: latest };
  }
  const older = builds.find((b) => b.runtimeVersion === local);
  const hint = older
    ? `예전 빌드 ${describeBuild(older)}와만 같습니다. 최신 빌드 사용자에게는 가지 않습니다.`
    : '이 채널의 어떤 빌드와도 같지 않습니다. 네이티브 의존성·app.config·환경값이 바뀌었는지 보세요. 바뀌었다면 OTA가 아니라 새 빌드가 필요합니다.';
  fail(
    `로컬 runtime이 채널 "${channel}"의 최신 빌드 ${describeBuild(latest)}(${latest.runtimeVersion})와 다릅니다.`,
    hint,
  );
}

// ── 5. 발행과 소스맵 업로드 ─────────────────────────────────

function publish(channel, message) {
  rmSync(join(CLIENT_DIR, 'dist'), { recursive: true, force: true });
  const { status, stdout } = capture(EAS, [
    'update',
    '--channel',
    channel,
    '--environment',
    channel,
    '--platform',
    PLATFORM,
    '--message',
    message,
    '--json',
    '--non-interactive',
  ]);
  const updates = extractJsonBlock(stdout);
  if (status !== 0 || !Array.isArray(updates) || !updates.length) {
    fail(
      'eas update가 실패했거나 결과를 읽지 못했습니다. 업데이트가 이미 올라갔을 수 있습니다.',
      `다시 실행하기 전에 EAS 대시보드에서 ${channel} 브랜치의 최신 업데이트를 확인하세요. 올라갔다면 소스맵만 따로 올리면 됩니다.`,
    );
  }
  return updates[0];
}

function uploadSourcemaps(channel) {
  const command = `node --env-file=${SENTRY_ENV_FILE} ${SENTRY_UPLOAD_SCRIPT} dist`;
  const { status, stdout } = easEnvExec(channel, command);
  console.log(stdout.trimEnd().replace(/^/gm, '    '));
  const debugIds = [...new Set([...stdout.matchAll(/debug id ([0-9a-f-]{36})/g)].map((m) => m[1]))];
  if (status !== 0 || !/successfully/i.test(stdout) || !debugIds.length) {
    fail(
      '업데이트는 발행됐지만 Sentry 소스맵 업로드가 실패했습니다.',
      `apps/client에서 다시 올리세요: EXPO_NO_DOTENV=1 eas env:exec ${channel} '${command}' --non-interactive`,
    );
  }
  return debugIds;
}

// ── 실행 ─────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv.slice(2));
  checkArgs(opts);
  const { channel } = opts;
  const dryRun = opts.flags.has('dry-run');
  console.log(
    `OTA 발행: channel=${channel}, environment=${channel}, platform=${PLATFORM}${dryRun ? ' (dry-run)' : ''}`,
  );

  step('1/5 사전 점검');
  const profile = checkEasJson(channel);
  checkGitClean(opts);
  checkSentryToken();

  step('2/5 깨끗한 재설치');
  if (opts.flags.has('skip-install')) {
    console.log('  ! --skip-install: 건너뜁니다. runtime 대조는 네이티브 쪽 차이만 잡습니다.');
    console.log('    JS 전용 패키지의 오래된 사본은 runtime에 드러나지 않아 그대로 번들에 들어갈 수 있습니다.');
  } else cleanInstall();

  step('3/5 EAS 환경값 대조');
  checkEasEnvironment(channel, profile);

  step('4/5 runtime 대조');
  const { local, build } = compareRuntime(channel);

  if (dryRun) {
    console.log(`\n✔ dry-run 통과. 발행하면 빌드 ${describeBuild(build)}를 쓰는 기기가 업데이트를 받습니다.`);
    return;
  }

  step('5/5 발행과 소스맵 업로드');
  const update = publish(channel, opts.message);
  if (update.runtimeVersion !== local) {
    fail(
      `발행된 업데이트의 runtime(${update.runtimeVersion})이 대조한 값(${local})과 다릅니다. 업데이트 그룹 ${update.group}을 확인하세요.`,
      `이 업데이트는 대조한 빌드에 가지 않습니다. 의도와 다르면 eas update:roll-back-to-embedded 또는 재발행으로 정리하세요.`,
    );
  }
  ok(`업데이트 그룹 ${update.group} (runtime ${update.runtimeVersion})`);
  const debugIds = uploadSourcemaps(channel);
  ok(`Sentry 소스맵 업로드 (debug id ${debugIds.join(', ') || '확인 안 됨'})`);

  console.log(`\n✔ 발행 완료: ${channel} 채널, 그룹 ${update.group}`);
  console.log(`  받을 빌드: ${describeBuild(build)}. 앱을 두 번 다시 열면 적용됩니다.`);
}

main();
