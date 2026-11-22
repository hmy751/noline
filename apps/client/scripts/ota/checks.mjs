/** 발행 전 점검. 하나라도 어긋나면 이유와 다음 행동을 알리고 멈춘다. 거부가 기본이다. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { listChannelBuilds } from './builds.mjs';
import { CLIENT_DIR, PLATFORM, REPO_ROOT, SENTRY_ENV_FILE } from './config.mjs';
import { describeBuild, readEnvironment, resolveLocalRuntime } from './eas.mjs';
import { BUNDLE_SOURCES, CHANGE_RULES, CODE_PATHS, ENV_SOURCE_DIRS } from './rules.mjs';
import { capture, fail, indentLines, ok, report, warn } from './terminal.mjs';

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// 빌드 프로필

/** eas.json에서 그 채널로 빌드하는 프로필을 찾아, environment가 같은 이름인지 확인하고 env를 돌려준다. */
export function checkBuildProfile(channel) {
  const profiles = JSON.parse(readFileSync(join(CLIENT_DIR, 'eas.json'), 'utf8')).build ?? {};
  const entry = Object.entries(profiles).find(([, profile]) => profile.channel === channel);

  if (!entry) {
    fail(`eas.json에 channel "${channel}"을 쓰는 빌드 프로필이 없습니다.`);
  }

  const [name, profile] = entry;

  if (profile.environment !== channel) {
    fail(
      `eas.json의 "${name}" 프로필은 channel "${channel}"인데 environment가 "${profile.environment}"입니다.`,
      '빌드와 발행이 같은 EAS environment를 써야 runtime이 맞습니다.',
    );
  }

  ok(`eas.json "${name}" 프로필: channel·environment 모두 "${channel}"`);

  return resolveProfileEnv(profiles, name);
}

/** extends로 물려받은 env까지 합친다. 자식 프로필의 값이 우선한다. */
function resolveProfileEnv(profiles, name, visited = new Set()) {
  if (visited.has(name)) {
    fail(`eas.json 프로필 extends가 순환합니다: ${name}`);
  }

  const profile = profiles[name];

  if (!profile) {
    fail(`eas.json에 "${name}" 프로필이 없습니다.`);
  }

  visited.add(name);
  const inherited = profile.extends ? resolveProfileEnv(profiles, profile.extends, visited) : {};

  return { ...inherited, ...(profile.env ?? {}) };
}

// 작업 트리와 토큰

export function checkWorkingTree(allowDirty) {
  const { status, stdout } = capture('git', ['status', '--porcelain', '--', ...CODE_PATHS], { cwd: REPO_ROOT });

  if (status !== 0) {
    fail('git status를 실행하지 못했습니다.');
  }

  const dirty = stdout.trimEnd().split('\n').filter(Boolean);

  if (!dirty.length) {
    ok('코드 경로에 커밋하지 않은 변경 없음');
    return;
  }

  if (!allowDirty) {
    fail(
      `코드 경로에 커밋하지 않은 변경이 있습니다:\n${indentLines(dirty)}`,
      '커밋한 뒤 발행하세요. 업데이트가 어느 커밋인지 남기기 위해서입니다. 의도한 시험이면 --allow-dirty.',
    );
  }

  warn(`커밋하지 않은 변경이 있지만 --allow-dirty로 진행합니다:\n${indentLines(dirty)}`);
}

export function checkSentryToken() {
  const file = join(CLIENT_DIR, SENTRY_ENV_FILE);
  const line = existsSync(file) ? readFileSync(file, 'utf8').match(/^SENTRY_AUTH_TOKEN=(.*)$/m) : null;
  const token = line?.[1].trim().replace(/^["']|["']$/g, '');

  if (!token) {
    fail(
      `apps/client/${SENTRY_ENV_FILE}에 SENTRY_AUTH_TOKEN이 없습니다.`,
      'EAS의 토큰은 SECRET이라 로컬에서 읽을 수 없습니다. 로컬 파일에 토큰을 두어야 소스맵을 올릴 수 있습니다.',
    );
  }

  ok(`apps/client/${SENTRY_ENV_FILE}에 SENTRY_AUTH_TOKEN 있음`);
}

// 업데이트를 받을 빌드

const REGISTER_HINT =
  '이 코드로 eas build --local을 했다면 먼저 pnpm ota:register-local-build <ipa>로 장부에 등록하세요.';

/** 지금 작업 트리를 그 채널의 환경값으로 빌드했을 때의 runtime. 업데이트를 받을 빌드를 고르는 기준이다. */
export function checkLocalRuntime(channel) {
  const runtime = resolveLocalRuntime(channel);

  ok(`로컬 runtime: ${runtime}`);

  return runtime;
}

/**
 * 채널의 빌드(EAS 빌드 목록 + 로컬 빌드 장부) 가운데 지금 runtime과 같은 빌드를 업데이트 대상으로 고른다.
 * 업데이트는 runtime이 같은 빌드에만 간다. 대상이 채널의 최신 버전이 아니면 그 예전 버전 사용자에게만 가므로
 * --older-build로 사람이 확인해야 한다.
 */
export function selectTargetBuilds(channel, runtime, olderBuildConfirmed) {
  const builds = listChannelBuilds(channel, PLATFORM);

  if (!builds.length) {
    fail(
      `채널 "${channel}"에 runtime이 있는 빌드가 없습니다. expo-updates가 들어간 빌드를 먼저 배포해야 합니다.`,
      REGISTER_HINT,
    );
  }

  const latest = builds[0];
  const targets = builds.filter((build) => build.runtimeVersion === runtime);

  if (!targets.length) {
    fail(
      `로컬 runtime이 채널 "${channel}"의 어떤 빌드와도 같지 않습니다. 최신 빌드: ${describeBuild(latest)}(${latest.runtimeVersion})`,
      `네이티브 의존성·app.config·버전·환경값이 바뀌었다면 OTA가 아니라 새 빌드가 필요합니다. ${REGISTER_HINT}`,
    );
  }

  const names = targets.map(describeBuild).join(', ');

  if (latest.runtimeVersion === runtime) {
    ok(`업데이트를 받을 빌드: ${names}`);
    return targets;
  }

  const sameNumber =
    targets[0].appVersion === latest.appVersion &&
    String(targets[0].appBuildVersion) === String(latest.appBuildVersion);
  // preview처럼 같은 버전·빌드 번호로 runtime이 다른 빌드를 여러 번 만들면 버전으로는 구별되지 않는다.
  const message = sameNumber
    ? `이 runtime의 빌드 ${names}는 채널에서 가장 최근 빌드 ${describeBuild(latest)}와 버전·빌드 번호는 같지만 runtime이 다릅니다. 업데이트는 이 runtime의 빌드를 설치한 기기에만 가고, 가장 최근 빌드를 설치한 기기에는 가지 않습니다.`
    : `이 runtime의 빌드 ${names}는 채널의 최신 빌드 ${describeBuild(latest)}보다 예전 버전입니다. 업데이트는 ${targets[0].appVersion} 빌드를 쓰는 사용자에게만 가고, 최신 버전 사용자에게는 가지 않습니다.`;

  if (!olderBuildConfirmed) {
    fail(message, '그 기기에만 보내려는 것이면 --older-build를 붙이세요.');
  }

  warn(`${message} --older-build로 진행합니다.`);

  return targets;
}

// OTA로 내면 안 되는 변경

/**
 * 받을 빌드들의 커밋 이후 바뀐 파일을 rules.mjs의 규칙에 대조한다.
 * 빌드를 커밋하지 않은 변경과 함께 만들었다면 이미 빌드에 들어간 변경도 보인다. 그때는 거부 쪽으로 틀린다.
 */
export function checkChanges(targets, flags) {
  const commits = buildCommits(targets);
  const files = [...new Set(commits.flatMap(changedFilesSince))];
  const sources = readBundleSources(files);
  const base = `기준: 빌드 커밋 ${commits.map((c) => c.slice(0, 8)).join(', ')}`;
  let blocked = false;

  for (const rule of CHANGE_RULES) {
    const matched = matchRule(rule, files, sources);

    if (!matched.length) {
      continue;
    }

    const confirmed = rule.kind === 'confirm' && flags.has(rule.flag);

    if (rule.kind === 'warn') {
      warn(`${rule.label}: 빌드 이후 바뀜. ${rule.hint}\n${indentLines(matched)}`);
    } else if (confirmed) {
      warn(`${rule.label}: --${rule.flag}로 확인하고 진행합니다.\n${indentLines(matched)}`);
    } else {
      // block 규칙, 또는 확인 플래그가 없는 confirm 규칙. 모든 규칙을 본 뒤 한꺼번에 멈춘다.
      report(`OTA로 낼 수 없는 변경: ${rule.label} (${base})\n${indentLines(matched)}`, rule.hint);
      blocked = true;
    }
  }

  if (blocked) {
    process.exit(1);
  }

  ok(`OTA를 막는 변경 없음 (${base})`);
}

function buildCommits(targets) {
  const unknown = targets.find((build) => !build.gitCommitHash);

  if (unknown) {
    fail(`빌드 ${describeBuild(unknown)}에 git 커밋이 기록돼 있지 않아 변경을 검사할 수 없습니다.`);
  }

  return [...new Set(targets.map((build) => build.gitCommitHash))];
}

/** 커밋 이후 바뀐 파일. 커밋하지 않은 변경과 추적하지 않는 새 파일을 포함한다. */
function changedFilesSince(commit) {
  if (capture('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: REPO_ROOT }).status !== 0) {
    fail(`빌드의 커밋 ${commit.slice(0, 8)}이 이 저장소에 없습니다.`, 'git fetch로 가져온 뒤 다시 실행하세요.');
  }

  return [
    ...gitPaths(['diff', '--name-only', commit, '--', '.']),
    ...gitPaths(['ls-files', '--others', '--exclude-standard', '--', '.']),
  ];
}

/** -z로 받아 한글 같은 경로도 그대로 읽는다. -z는 pathspec(--) 앞에 와야 경로로 오인되지 않는다. */
function gitPaths([command, ...args]) {
  const { status, stdout } = capture('git', [command, '-z', ...args], { cwd: REPO_ROOT });

  if (status !== 0) {
    fail(`git ${command}을 실행하지 못했습니다.`);
  }

  return stdout.split('\0').filter(Boolean);
}

/** 번들에 들어가는 바뀐 소스의 현재 내용. 삭제된 파일은 뺀다. */
function readBundleSources(files) {
  return files
    .filter((file) => BUNDLE_SOURCES.some((dir) => file.startsWith(dir)))
    .filter((file) => [...SOURCE_EXTENSIONS, '.sql'].includes(extname(file)))
    .filter((file) => existsSync(join(REPO_ROOT, file)))
    .map((file) => ({ file, text: readFileSync(join(REPO_ROOT, file), 'utf8') }));
}

function matchRule(rule, files, sources) {
  const include = (rule.paths ?? []).map(toPathPattern);
  const exclude = (rule.except ?? []).map(toPathPattern);
  const byPath = files.filter((file) => include.some((p) => p.test(file)) && !exclude.some((p) => p.test(file)));
  const byContent = sources
    .filter(({ text }) => (rule.content ?? []).some((pattern) => pattern.test(text)))
    .map(({ file }) => file);

  return [...new Set([...byPath, ...byContent])];
}

function toPathPattern(path) {
  const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+');

  return new RegExp(`^${escaped}${path.endsWith('/') ? '' : '$'}`);
}

// 환경값

/**
 * 번들을 만들 때 값이 박히는 이름(@env, process.env.EXPO_PUBLIC_*)을 모은다.
 * @env를 이름 없이 가져오면 EAS와 대조할 수 없으니 거부한다.
 */
export function collectEnvNames() {
  const names = new Set();

  for (const file of ENV_SOURCE_DIRS.flatMap((dir) => listSourceFiles(join(REPO_ROOT, dir)))) {
    const text = readFileSync(file, 'utf8');

    for (const [, name] of text.matchAll(/process\.env\.(EXPO_PUBLIC_[A-Za-z0-9_]+)/g)) {
      names.add(name);
    }

    for (const [, clause] of text.matchAll(/import\s+([^;]*?)\s+from\s+['"]@env['"]/g)) {
      const named = clause.trim().match(/^\{([^}]*)\}$/);

      if (!named) {
        fail(
          `${relative(REPO_ROOT, file)}: @env를 이름 없이 가져와 EAS 값과 대조할 수 없습니다.`,
          "import { NAME } from '@env' 형태로 쓰세요.",
        );
      }

      for (const specifier of named[1].split(',')) {
        const name = specifier.trim().split(/\s+as\s+/)[0];

        if (name) {
          names.add(name);
        }
      }
    }
  }

  return [...names].sort();
}

function listSourceFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listSourceFiles(path);
    }

    return SOURCE_EXTENSIONS.includes(extname(entry.name)) ? [path] : [];
  });
}

/**
 * eas update는 eas.json 프로필의 env를 쓰지 않고 EAS environment의 값만 쓴다.
 * 그래서 프로필 env와 코드가 읽는 이름이 EAS environment에 같은 값으로 있어야 빌드와 같은 번들이 나온다.
 */
export function checkEnvironment(channel, profileEnv, envNames) {
  const environment = readEnvironment(channel, {
    values: Object.keys(profileEnv),
    has: ['SENTRY_ORG', 'SENTRY_PROJECT', ...envNames],
  });

  for (const [key, expected] of Object.entries(profileEnv)) {
    const actual = environment.values[key];

    if (actual !== expected) {
      fail(
        `eas.json 프로필은 ${key}=${expected}로 빌드하지만 EAS environment "${channel}"에는 ${key}=${actual ?? '(없음)'}입니다.`,
        `eas update는 프로필 env를 쓰지 않습니다. EAS environment "${channel}"에 ${key}=${expected}를 넣으세요.`,
      );
    }
  }

  if (!environment.has.SENTRY_ORG || !environment.has.SENTRY_PROJECT) {
    fail(`EAS environment "${channel}"에 SENTRY_ORG·SENTRY_PROJECT가 없어 소스맵을 올릴 수 없습니다.`);
  }

  const missing = envNames.filter((name) => !environment.has[name]);

  if (missing.length) {
    fail(
      `코드가 읽는 환경 변수 이름이 EAS environment "${channel}"에 없습니다: ${missing.join(', ')}`,
      `없으면 로컬 .env 파일의 값이 번들에 들어갑니다. EAS environment "${channel}"에 넣으세요.`,
    );
  }

  const profileSummary = Object.entries(profileEnv).map(([key, value]) => `${key}=${value}`);

  if (profileSummary.length) {
    ok(`프로필 env가 EAS environment와 같음: ${profileSummary.join(', ')}`);
  }

  ok('SENTRY_ORG·SENTRY_PROJECT 있음');
  ok(`코드가 읽는 환경 변수 ${envNames.length}개 모두 EAS environment에 있음`);
}
