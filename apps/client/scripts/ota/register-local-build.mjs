#!/usr/bin/env node
/**
 * eas build --local로 만든 빌드를 로컬 빌드 장부(local-builds.json)에 등록한다.
 *
 *   pnpm ota:register-local-build apps/client/build/noline-1.2.0-20.ipa
 *   pnpm ota:register-local-build <ipa> --commit <빌드한 커밋>
 *
 * 로컬 빌드는 EAS 빌드 목록에 남지 않아 발행 점검(publish.mjs)이 그 빌드를 모른다.
 * ipa에서 버전·빌드 번호·채널·runtime과 번들을 만든 시각을 읽고, 지금 작업 트리의 runtime과 같을 때만 적는다.
 *
 * 빌드 커밋은 발행 점검이 "빌드 이후 바뀐 파일"을 셀 기준이다. 실제보다 늦은 커밋을 적으면 그 사이의
 * JS 변경(예: 기기 DB 구조)이 검사에서 빠진다. runtime은 JS 변경으로 바뀌지 않아 이를 잡지 못한다.
 * 그래서 번들 시각에 빌드가 볼 수 있었던 가장 늦은 커밋을 브랜치 reflog와 커밋 시각으로 찾아 빌드 커밋으로 삼고
 * (resolveCommit), --commit은 그 커밋이거나 그보다 이른 커밋만 받는다. 이른 커밋은 검사를 더 엄격하게 할 뿐이다.
 * 빌드한 브랜치·기기에서 실행해야 한다. 빌드 중에 그 브랜치에 커밋하거나, 커밋하지 않은 변경으로 빌드하면
 * 이 기준이 빌드 내용과 어긋나므로 빌드는 커밋한 상태에서 하고 끝날 때까지 커밋하지 않는다.
 *
 * 등록한 뒤 장부를 커밋·push해야 다른 브랜치·기기의 발행 점검이 이 빌드를 안다.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';

import { buildKey, readLedger, readWorkingRegistry, recordSignature, writeWorkingRegistry } from './builds.mjs';
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
  const { commit, base } = resolveCommit(commitArg, build.completedAt);
  ok(`번들 시각 ${build.completedAt} 이전의 마지막 커밋: ${base.slice(0, 8)} ${commitSubject(base)}`);

  if (commit !== base) {
    ok(`빌드 커밋으로 더 이른 ${commit.slice(0, 8)}을 적습니다 (--commit)`);
  }

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
  // 다른 브랜치·origin의 장부까지 본다. 여기서 놓치면 다음 발행에서야 충돌로 멈춘다.
  const ledger = readLedger();

  if (ledger.retracted.has(recordSignature(entry))) {
    fail(
      `이 기록(${key}, 커밋 ${commit.slice(0, 8)})은 장부에서 거둬진 기록입니다.`,
      '거둔 이유를 확인하세요. 같은 빌드의 바른 기록이라면 빌드 커밋이 달라야 합니다.',
    );
  }

  const known = ledger.builds.find((item) => buildKey(item) === key);

  if (known) {
    if (known.runtimeVersion === entry.runtimeVersion && known.gitCommitHash === entry.gitCommitHash) {
      ok(`이미 등록돼 있습니다: ${key}`);
      return;
    }

    fail(
      `같은 빌드(${key})가 다른 runtime·커밋(${known.gitCommitHash.slice(0, 8)})으로 이미 장부에 있습니다.`,
      `그 기록이 잘못됐다면 ${relativePath()}에 그 기록을 그대로 두고 "retracted": true만 더해 거둔 뒤 다시 등록하세요.`,
    );
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
  console.log(`\n✔ 등록 완료. 장부를 커밋하고 push해야 다른 브랜치와 기기의 발행 점검이 이 빌드를 압니다.`);
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
    const wanted = ['Info.plist', 'Expo.plist', 'EXUpdates.bundle/fingerprint', 'EXUpdates.bundle/app.manifest'].map(
      (file) => `${appDir}/${file}`,
    );
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

    // 내장 번들 manifest의 commitTime은 이름과 달리 git 커밋이 아니라 번들을 만든 시각(ms)이다.
    const manifestFile = join(dir, appDir, 'EXUpdates.bundle', 'app.manifest');
    const bundledAt = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')).commitTime : undefined;

    if (!Number.isFinite(bundledAt)) {
      fail('ipa의 EXUpdates.bundle/app.manifest에서 번들 시각(commitTime)을 읽지 못했습니다.');
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
      completedAt: new Date(bundledAt).toISOString(),
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
 * 번들 시각에 빌드가 볼 수 있었던 가장 늦은 커밋(base)을 두 근거 중 이른 쪽으로 정한다.
 * - 브랜치 reflog: 그 시각에 이 브랜치가 가리키던 커밋. 나중에 fast-forward·pull로 붙은 커밋을 뺀다.
 * - 커밋 시각: HEAD의 first-parent 이력에서 번들 시각 이전에 커밋된 마지막 커밋. reflog가 실제 이동보다
 *   늦게 기록된 경우를 덮는다.
 * --commit이 없으면 base를 적고, 있으면 base이거나 그 조상일 때만 받는다. 머리말처럼 늦은 커밋을 막기 위해서다.
 * reflog가 없거나(detached HEAD, 만료, 다른 기기) 두 근거가 갈라지면 --commit을 요구한다.
 */
function resolveCommit(commitArg, bundledAt) {
  // git의 날짜 해석이 밀리초를 받지 않으므로 초 단위로 넘긴다.
  const bundledSec = Math.floor(Date.parse(bundledAt) / 1000);
  const byDate = git(['rev-list', '-1', '--first-parent', `--before=${bundledSec}`, 'HEAD']);
  const byReflog = branchAt(bundledSec);
  let base;
  let problem;

  if (!byDate) {
    problem = `HEAD 이력에 번들 시각(${bundledAt}) 이전의 커밋이 없습니다. 이 ipa를 빌드한 브랜치에서 실행하세요.`;
  } else if (!byReflog.commit) {
    problem = `${byReflog.reason} 그래서 번들 시각에 브랜치가 어디 있었는지 확인할 수 없습니다.`;
  } else if (isAncestor(byReflog.commit, byDate)) {
    base = byReflog.commit;
  } else if (isAncestor(byDate, byReflog.commit)) {
    base = byDate;
  } else {
    problem = `reflog(${byReflog.commit.slice(0, 8)})와 커밋 시각(${byDate.slice(0, 8)})이 가리키는 커밋이 갈라집니다.`;
  }

  if (!commitArg) {
    if (problem) {
      fail(problem, '빌드한 커밋을 --commit <커밋>으로 직접 지정하세요.');
    }

    return { commit: base, base };
  }

  const { status, stdout } = capture('git', ['rev-parse', '--verify', `${commitArg}^{commit}`], {
    cwd: REPO_ROOT,
    quiet: true,
  });

  if (status !== 0) {
    fail(`커밋을 찾지 못했습니다: ${commitArg}`);
  }

  const commit = stdout.trim();
  // 근거가 부족해도 커밋 시각 기준보다 늦은 커밋은 받지 않는다.
  const limit = base ?? byDate;

  if (!limit || !isAncestor(commit, limit)) {
    fail(
      `--commit ${commitArg}이 번들 시각 이전의 마지막 커밋${limit ? ` ${limit.slice(0, 8)}` : ''}이거나 그 조상이 아닙니다.`,
      '빌드보다 늦은 커밋을 적으면 빌드 이후 변경이 발행 점검에서 빠집니다.',
    );
  }

  return { commit, base: limit };
}

/** 지금 브랜치의 reflog에서 그 시각(초)에 브랜치가 가리키던 커밋. */
function branchAt(sec) {
  const { status, stdout } = capture('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: REPO_ROOT, quiet: true });

  if (status !== 0) {
    return { reason: 'HEAD가 브랜치가 아닙니다(detached).' };
  }

  const ref = stdout.trim();
  const entries = git(['log', '-g', '--format=%H %gd', '--date=unix', ref])
    .split('\n')
    .map((line) => line.match(/^([0-9a-f]{40}) .*@\{(\d+)\}$/))
    .filter(Boolean)
    .map(([, commit, time]) => ({ commit, time: Number(time) }));
  const entry = entries.find((item) => item.time <= sec);

  if (!entry) {
    return { reason: `${ref}의 reflog에 번들 시각 이전 기록이 없습니다.` };
  }

  return { commit: entry.commit };
}

function isAncestor(a, b) {
  return capture('git', ['merge-base', '--is-ancestor', a, b], { cwd: REPO_ROOT }).status === 0;
}

function commitSubject(commit) {
  return git(['log', '-1', '--format=%s', commit]);
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
    fail('등록할 ipa 경로를 지정하세요.', '예: pnpm ota:register-local-build apps/client/build/noline-1.2.0-20.ipa');
  }

  // pnpm은 루트에서 실행하므로 상대 경로는 실행한 위치(INIT_CWD) 기준으로 푼다.
  const path = resolve(process.env.INIT_CWD ?? process.cwd(), ipa);

  if (!existsSync(path)) {
    fail(`ipa가 없습니다: ${path}`);
  }

  return { ipa: path, commit };
}

main();
