#!/usr/bin/env node
/**
 * eas build --local로 만든 빌드를 로컬 빌드 장부(local-builds.json)에 등록한다.
 *
 *   pnpm ota:register-local-build apps/client/dist/noline-1.2.0-20.ipa
 *   pnpm ota:register-local-build <ipa> --commit <빌드한 커밋>   # 빌드 뒤 커밋이 더 쌓였을 때
 *
 * 로컬 빌드는 EAS 빌드 목록에 남지 않아 발행 점검(publish.mjs)이 그 빌드를 모른다.
 * ipa에서 버전·빌드 번호·채널·runtime을 읽고, 지금 작업 트리의 runtime과 같을 때만 적는다.
 * 다른 커밋에서 만든 ipa를 잘못 적으면 업데이트가 엉뚱한 빌드를 기준으로 점검되기 때문이다.
 * 등록한 뒤 장부를 커밋해야 다른 브랜치·기기의 발행 점검이 이 빌드를 안다.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { buildKey, readWorkingRegistry, writeWorkingRegistry } from './builds.mjs';
import { checkWorkingTree } from './checks.mjs';
import { CHANNELS, LOCAL_BUILDS_FILE, PLATFORM, REPO_ROOT } from './config.mjs';
import { listFinishedBuilds, resolveLocalRuntime } from './eas.mjs';
import { capture, fail, ok, step } from './terminal.mjs';

function main() {
  const { ipa, commit: commitArg } = parseOptions(process.argv.slice(2));

  step('1/4 ipa 읽기');
  const build = readIpa(ipa);
  ok(
    `${build.bundleIdentifier} ${build.appVersion} (${build.appBuildVersion}), channel ${build.channel}, runtime ${build.runtimeVersion}`,
  );

  step('2/4 빌드 커밋');
  checkWorkingTree(false);
  const commit = resolveCommit(commitArg);
  ok(`빌드 커밋: ${commit.slice(0, 8)}${commitArg ? ' (--commit)' : ' (HEAD)'}`);

  step('3/4 runtime 대조');
  const runtime = resolveLocalRuntime(build.channel);

  if (runtime !== build.runtimeVersion) {
    fail(
      `ipa의 runtime(${build.runtimeVersion})이 지금 작업 트리의 runtime(${runtime})과 다릅니다.`,
      '이 ipa를 만든 커밋으로 checkout하고 그때와 같은 패키지를 설치한 뒤 등록하세요.',
    );
  }

  ok(`지금 작업 트리의 runtime과 같음`);

  step('4/4 장부에 적기');
  const entry = { ...build, gitCommitHash: commit };
  const key = buildKey(entry);
  const registry = readWorkingRegistry();
  const known = registry.find((item) => buildKey(item) === key);

  if (known) {
    if (known.runtimeVersion === entry.runtimeVersion && known.gitCommitHash === entry.gitCommitHash) {
      ok(`이미 등록돼 있습니다: ${key}`);
      return;
    }

    fail(`같은 빌드(${key})가 다른 runtime·커밋으로 이미 적혀 있습니다.`, `${relativePath()}를 확인하세요.`);
  }

  const onEas = listFinishedBuilds(build.channel).find(
    (item) => item.appVersion === entry.appVersion && String(item.appBuildVersion) === entry.appBuildVersion,
  );

  if (onEas) {
    fail(
      `EAS 빌드 목록에 같은 버전·빌드 번호의 빌드(${onEas.id.slice(0, 8)})가 이미 있습니다.`,
      '발행 점검은 EAS 빌드를 이미 압니다. 같은 번호로 로컬 빌드를 다시 만들었다면 빌드 번호를 올리세요.',
    );
  }

  writeWorkingRegistry([...registry, entry]);
  ok(`${relativePath()}에 적었습니다: ${key}`);
  console.log(`\n✔ 등록 완료. 장부를 커밋해야 다른 브랜치와 기기의 발행 점검이 이 빌드를 압니다.`);
}

/** ipa의 Info.plist·Expo.plist·내장 fingerprint에서 빌드 정보를 읽는다. */
function readIpa(ipa) {
  const listing = capture('unzip', ['-Z1', ipa]);

  if (listing.status !== 0) {
    fail(`ipa를 열지 못했습니다: ${ipa}`);
  }

  const appDir = listing.stdout
    .split('\n')
    .map((line) => line.match(/^(Payload\/[^/]+\.app)\/Info\.plist$/)?.[1])
    .find(Boolean);

  if (!appDir) {
    fail(`ipa에서 Payload/*.app/Info.plist를 찾지 못했습니다: ${ipa}`);
  }

  const dir = mkdtempSync(join(tmpdir(), 'noline-ipa-'));

  try {
    const wanted = ['Info.plist', 'Expo.plist', 'EXUpdates.bundle/fingerprint'].map((file) => `${appDir}/${file}`);
    // fingerprint 파일은 runtime 정책이 fingerprint일 때만 있다. 없어도 unzip이 실패로 끝나므로 결과는 파일로 판단한다.
    capture('unzip', ['-o', '-q', ipa, ...wanted, '-d', dir], { quiet: true });

    const info = readPlist(join(dir, appDir, 'Info.plist'));
    const expo = readPlist(join(dir, appDir, 'Expo.plist'));
    const channel = expo.EXUpdatesRequestHeaders?.['expo-channel-name'];
    let runtimeVersion = expo.EXUpdatesRuntimeVersion;

    if (runtimeVersion === 'file:fingerprint') {
      const file = join(dir, appDir, 'EXUpdates.bundle', 'fingerprint');
      runtimeVersion = existsSync(file) ? readFileSync(file, 'utf8').trim() : undefined;
    }

    if (!CHANNELS.includes(channel)) {
      fail(`ipa의 업데이트 채널이 ${CHANNELS.join(' | ')} 중 하나가 아닙니다: ${channel}`);
    }

    if (!runtimeVersion || expo.EXUpdatesEnabled === false) {
      fail('ipa에서 runtime을 읽지 못했습니다. expo-updates가 켜진 빌드인지 확인하세요.');
    }

    return {
      platform: PLATFORM,
      channel,
      bundleIdentifier: info.CFBundleIdentifier,
      appVersion: String(info.CFBundleShortVersionString),
      appBuildVersion: String(info.CFBundleVersion),
      runtimeVersion,
      completedAt: statSync(ipa).mtime.toISOString(),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function readPlist(file) {
  if (!existsSync(file)) {
    fail(`ipa에 ${file.split('/').slice(-2).join('/')}가 없습니다.`);
  }

  const { status, stdout } = capture('plutil', ['-convert', 'json', '-o', '-', file]);

  if (status !== 0) {
    fail(`plist를 읽지 못했습니다: ${file}`);
  }

  return JSON.parse(stdout);
}

/**
 * 기본은 HEAD다. 빌드 뒤 커밋이 쌓였으면 --commit으로 빌드한 커밋을 적는다.
 * 발행 점검은 이 커밋 이후 바뀐 파일을 보므로, 실제보다 이른 커밋은 더 많이 막을 뿐이지만
 * 실제보다 늦은 커밋은 빌드에 없는 변경을 놓친다. 그래서 HEAD의 조상인 커밋만 받는다.
 */
function resolveCommit(commitArg) {
  const head = git(['rev-parse', 'HEAD']);

  if (!commitArg) {
    return head;
  }

  const { status, stdout } = capture('git', ['rev-parse', '--verify', `${commitArg}^{commit}`], {
    cwd: REPO_ROOT,
    quiet: true,
  });

  if (status !== 0) {
    fail(`커밋을 찾지 못했습니다: ${commitArg}`);
  }

  const commit = stdout.trim();

  if (capture('git', ['merge-base', '--is-ancestor', commit, head], { cwd: REPO_ROOT }).status !== 0) {
    fail(`--commit ${commitArg}이 HEAD의 조상이 아닙니다.`, '빌드한 커밋이나 그 이전 커밋을 지정하세요.');
  }

  return commit;
}

function git(args) {
  const { status, stdout } = capture('git', args, { cwd: REPO_ROOT });

  if (status !== 0) {
    fail(`git ${args[0]}을 실행하지 못했습니다.`);
  }

  return stdout.trim();
}

function relativePath() {
  return relative(REPO_ROOT, LOCAL_BUILDS_FILE);
}

function parseOptions(argv) {
  let ipa;
  let commit;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '--commit') {
      commit = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--commit=')) {
      commit = arg.slice('--commit='.length);
    } else if (arg.startsWith('--')) {
      fail(`알 수 없는 옵션: ${arg}`);
    } else if (!ipa) {
      ipa = arg;
    } else {
      fail(`알 수 없는 인자: ${arg}`);
    }
  }

  if (!ipa) {
    fail('등록할 ipa 경로를 지정하세요.', '예: pnpm ota:register-local-build apps/client/dist/noline-1.2.0-20.ipa');
  }

  // pnpm은 루트에서 실행하므로 상대 경로는 실행한 위치(INIT_CWD) 기준으로 푼다.
  const path = resolve(process.env.INIT_CWD ?? process.cwd(), ipa);

  if (!existsSync(path)) {
    fail(`ipa가 없습니다: ${path}`);
  }

  return { ipa: path, commit };
}

main();
