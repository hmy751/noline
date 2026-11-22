/**
 * 업데이트를 받을 수 있는 스토어·preview 빌드 목록. EAS 빌드 목록과 로컬 빌드 장부를 합친다.
 *
 * `eas build --local`로 만든 빌드는 EAS 빌드 목록에 남지 않는다. 그래서 로컬 빌드는
 * register-local-build.mjs로 local-builds.json에 적고, 발행 점검은 두 목록을 함께 본다.
 * 장부는 빌드를 만든 브랜치에 커밋되므로 main과 release 브랜치의 장부를 모두 읽는다.
 * 한 브랜치에서 발행해도 다른 브랜치에서 등록한 더 새 버전을 알아야 "예전 빌드" 판단이 맞기 때문이다.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';

import { LOCAL_BUILDS_FILE, REPO_ROOT } from './config.mjs';
import { listFinishedBuilds } from './eas.mjs';
import { capture, fail } from './terminal.mjs';

const REGISTRY_PATH = relative(REPO_ROOT, LOCAL_BUILDS_FILE);
const REGISTRY_REFS = [
  'refs/heads/main',
  'refs/heads/release/',
  'refs/remotes/origin/main',
  'refs/remotes/origin/release/',
];

/** 채널의 업데이트를 받을 수 있는 빌드(runtime 있음)를 새 버전 순으로 돌려준다. */
export function listChannelBuilds(channel, platform) {
  const remote = listFinishedBuilds(channel)
    .filter((build) => build.runtimeVersion)
    .map((build) => ({ ...build, source: 'eas' }));
  const local = readAllRegistries()
    .filter((build) => build.channel === channel && build.platform === platform)
    .map((build) => ({ ...build, source: 'local' }));

  return sortNewestFirst([...remote, ...local]);
}

/** 앱 버전, 빌드 번호, 완료 시각 순으로 새 빌드가 앞에 온다. */
export function sortNewestFirst(builds) {
  return [...builds].sort(
    (a, b) =>
      compareVersions(b.appVersion, a.appVersion) ||
      Number(b.appBuildVersion ?? 0) - Number(a.appBuildVersion ?? 0) ||
      String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')),
  );
}

export function compareVersions(a = '0', b = '0') {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);

  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] || 0) - (pb[i] || 0);

    if (diff) {
      return diff;
    }
  }

  return 0;
}

export function buildKey(build) {
  return [build.platform, build.channel, build.appVersion, build.appBuildVersion].join(' ');
}

/** 작업 트리의 장부. 등록할 때 이 파일에 쓴다. */
export function readWorkingRegistry() {
  if (!existsSync(LOCAL_BUILDS_FILE)) {
    return [];
  }

  return parseRegistry(readFileSync(LOCAL_BUILDS_FILE, 'utf8'), REGISTRY_PATH);
}

export function writeWorkingRegistry(builds) {
  const sorted = sortNewestFirst(builds).map(({ source, ...build }) => build);

  writeFileSync(LOCAL_BUILDS_FILE, `${JSON.stringify({ builds: sorted }, null, 2)}\n`);
}

export function recordSignature(build) {
  return [buildKey(build), build.runtimeVersion, build.gitCommitHash].join(' ');
}

/**
 * 작업 트리와 main·release 브랜치(로컬·origin)의 장부를 합친다.
 * 한 곳에서라도 retracted로 표시한 기록(빌드·runtime·커밋이 모두 같은 기록)은 뺀다. 이미 다른 브랜치·origin에
 * 퍼진 잘못된 기록을 그 브랜치들을 고쳐 쓰지 않고 거두고, 같은 빌드의 바른 기록을 새로 적을 수 있게 하려는 것이다.
 * 거두지 않은 같은 빌드가 다르게 적혀 있으면 멈춘다.
 */
export function readLedger() {
  const sources = [{ name: REGISTRY_PATH, builds: readWorkingRegistry() }];

  for (const ref of registryRefs()) {
    const text = readRegistryAt(ref);

    if (text !== undefined) {
      sources.push({ name: `${ref}:${REGISTRY_PATH}`, builds: parseRegistry(text, ref) });
    }
  }

  const retracted = new Set(
    sources.flatMap(({ builds }) => builds.filter((build) => build.retracted).map(recordSignature)),
  );
  const byKey = new Map();

  for (const { name, builds } of sources) {
    for (const build of builds) {
      if (retracted.has(recordSignature(build))) {
        continue;
      }

      const key = buildKey(build);
      const known = byKey.get(key);

      if (!known) {
        byKey.set(key, { build, names: [name] });
      } else if (recordSignature(known.build) !== recordSignature(build)) {
        fail(
          `로컬 빌드 장부에 같은 빌드(${key})가 다르게 적혀 있습니다:\n      ${known.names.join(', ')}\n      ${name}`,
          '실제 ipa와 맞지 않는 기록을 거두려면, 작업 트리 장부에 그 기록을 그대로 두고 "retracted": true만 더해 커밋·push하세요.',
        );
      } else {
        known.names.push(name);
      }
    }
  }

  return { builds: [...byKey.values()].map(({ build }) => build), retracted };
}

export function readAllRegistries() {
  return readLedger().builds;
}

/** ref의 장부 내용. 그 ref에 장부 파일이 없으면 undefined, 읽는 데 실패하면 멈춘다. */
function readRegistryAt(ref) {
  const listed = capture('git', ['ls-tree', '--name-only', ref, '--', REGISTRY_PATH], { cwd: REPO_ROOT });

  if (listed.status !== 0) {
    fail(`${ref}의 파일 목록을 읽지 못했습니다.`);
  }

  if (!listed.stdout.trim()) {
    return undefined;
  }

  const shown = capture('git', ['show', `${ref}:${REGISTRY_PATH}`], { cwd: REPO_ROOT });

  if (shown.status !== 0) {
    fail(`${ref}의 로컬 빌드 장부를 읽지 못했습니다.`);
  }

  return shown.stdout;
}

function registryRefs() {
  const { status, stdout } = capture('git', ['for-each-ref', '--format=%(refname)', ...REGISTRY_REFS], {
    cwd: REPO_ROOT,
  });

  if (status !== 0) {
    fail('git 브랜치 목록을 읽지 못했습니다.');
  }

  return stdout.split('\n').filter(Boolean);
}

const REQUIRED_FIELDS = ['platform', 'channel', 'appVersion', 'appBuildVersion', 'runtimeVersion', 'gitCommitHash'];

function parseRegistry(text, name) {
  let builds;

  try {
    builds = JSON.parse(text).builds;
  } catch {
    fail(`로컬 빌드 장부를 읽지 못했습니다: ${name}`);
  }

  if (!Array.isArray(builds)) {
    fail(`로컬 빌드 장부에 builds 배열이 없습니다: ${name}`);
  }

  const broken = builds.find((build) => REQUIRED_FIELDS.some((field) => !build?.[field]));

  if (broken) {
    fail(`로컬 빌드 장부의 항목에 ${REQUIRED_FIELDS.join(', ')} 중 빠진 값이 있습니다: ${name}`);
  }

  return builds;
}
