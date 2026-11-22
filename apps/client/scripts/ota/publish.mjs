#!/usr/bin/env node
/**
 * OTA 업데이트를 점검과 함께 발행한다 (Work 011 Ticket 02).
 *
 *   pnpm ota:publish preview --message "무엇을 고쳤는지"
 *   pnpm ota:publish production --message "..." --confirm-production
 *
 * 옵션:
 *   --dry-run             runtime 대조까지만 하고 발행하지 않는다
 *   --skip-install        깨끗한 재설치를 건너뛴다
 *   --allow-dirty         코드 경로에 커밋하지 않은 변경이 있어도 진행한다
 *   --confirm-production  production 발행에 필요하다
 *   --server-checked      서버 계약 경로가 바뀌었을 때, 서버를 먼저 배포했거나 서버 변경이 필요 없음을 확인한다
 *   --older-build         지금 runtime의 빌드가 채널의 최신 버전이 아닐 때, 그 예전 버전 사용자에게만 보냄을 확인한다
 *
 * 업데이트를 받을 빌드는 EAS 빌드 목록과 로컬 빌드 장부(local-builds.json)를 합쳐 지금 runtime과 같은 빌드로 고른다.
 * eas build --local로 만든 빌드는 register-local-build.mjs로 먼저 장부에 등록한다.
 *
 * eas update는 성공으로 끝나도 아무 기기에 가지 않거나(runtime 불일치), 잘못된 환경값·롤백할 수 없는
 * DB 변경을 실어 보낼 수 있다. 그래서 발행은 이 스크립트로만 하고, AI 도구의 직접 실행은
 * 공통 hook(.agents/hooks/block-direct-eas-update.py)이 막는다. 막을 변경의 규칙은 rules.mjs에 있다.
 *
 * 실행 명령은 루트 package.json에 둔다. Expo fingerprint가 apps/client/package.json의 scripts까지
 * runtime 계산에 넣어, 거기에 두면 runtime이 바뀌어 기존 빌드가 업데이트를 받지 못한다.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import {
  checkBuildProfile,
  checkChanges,
  checkEnvironment,
  checkLocalRuntime,
  checkSentryToken,
  checkWorkingTree,
  collectEnvNames,
  selectTargetBuilds,
} from './checks.mjs';
import { CHANNELS, CLIENT_DIR, PLATFORM, REPO_ROOT } from './config.mjs';
import { describeBuild, publishUpdate, uploadSourcemaps } from './eas.mjs';
import { fail, ok, run, step, warn } from './terminal.mjs';

const FLAGS = ['dry-run', 'skip-install', 'allow-dirty', 'confirm-production', 'server-checked', 'older-build'];

function main() {
  const { channel, message, flags } = parseOptions(process.argv.slice(2));
  const dryRun = flags.has('dry-run');

  console.log(
    `OTA 발행: channel=${channel}, environment=${channel}, platform=${PLATFORM}${dryRun ? ' (dry-run)' : ''}`,
  );

  step('1/5 사전 점검');
  const profileEnv = checkBuildProfile(channel);
  checkWorkingTree(flags.has('allow-dirty'));
  checkSentryToken();
  const envNames = collectEnvNames();

  step('2/5 깨끗한 재설치');
  if (flags.has('skip-install')) {
    warn(
      '--skip-install: 건너뜁니다. JS 전용 패키지의 오래된 사본은 runtime에 드러나지 않아 번들에 들어갈 수 있습니다.',
    );
  } else {
    cleanInstall();
  }

  // runtime은 설치된 패키지로 계산되므로 재설치 뒤에 계산해야 받을 빌드를 바르게 고른다.
  step('3/5 runtime과 받을 빌드');
  const runtime = checkLocalRuntime(channel);
  const targets = selectTargetBuilds(channel, runtime, flags.has('older-build'));
  checkChanges(targets, flags);

  step('4/5 EAS 환경값 대조');
  checkEnvironment(channel, profileEnv, envNames);
  const targetNames = targets.map(describeBuild).join(', ');

  if (dryRun) {
    console.log(`\n✔ dry-run 통과. 발행하면 ${targetNames}를 쓰는 기기가 업데이트를 받습니다.`);
    return;
  }

  step('5/5 발행과 소스맵 업로드');
  // 소스맵 업로드는 dist 전체를 올린다. 예전 발행의 번들이 남아 있으면 그 소스맵까지 섞인다.
  // 로컬 빌드 ipa는 등록·제출·재확인에 다시 쓰므로 남긴다. 소스맵 업로드는 .js·.map·.hbc만 읽는다.
  clearDistExceptIpa();
  const update = publishUpdate(channel, message);

  if (update.runtimeVersion !== runtime) {
    fail(
      `발행된 업데이트의 runtime(${update.runtimeVersion})이 대조한 값(${runtime})과 다릅니다. 업데이트 그룹 ${update.group}을 확인하세요.`,
      '이 업데이트는 대조한 빌드에 가지 않습니다. 의도와 다르면 eas update:roll-back-to-embedded 또는 재발행으로 정리하세요.',
    );
  }

  ok(`업데이트 그룹 ${update.group} (runtime ${update.runtimeVersion})`);
  const debugIds = uploadSourcemaps(channel);
  ok(`Sentry 소스맵 업로드 (debug id ${debugIds.join(', ')})`);

  console.log(`\n✔ 발행 완료: ${channel} 채널, 그룹 ${update.group}`);
  console.log(`  받을 빌드: ${targetNames}. 앱을 두 번 다시 열면 적용됩니다.`);
}

function parseOptions(argv) {
  const flags = new Set();
  let channel;
  let message;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--') {
      continue;
    }

    if (arg === '--message' || arg === '-m') {
      message = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--message=')) {
      message = arg.slice('--message='.length);
    } else if (arg.startsWith('--')) {
      flags.add(arg.slice(2));
    } else if (!channel) {
      channel = arg;
    } else {
      fail(`알 수 없는 인자: ${arg}`);
    }
  }

  const unknown = [...flags].find((flag) => !FLAGS.includes(flag));

  if (unknown) {
    fail(`알 수 없는 옵션: --${unknown}`);
  }

  if (!CHANNELS.includes(channel)) {
    fail(`채널을 지정하세요: ${CHANNELS.join(' | ')}`, '예: pnpm ota:publish preview --message "..."');
  }

  if (!message?.trim()) {
    fail('--message로 이 업데이트의 내용을 적으세요. EAS 대시보드와 기록에 남습니다.');
  }

  if (channel === 'production' && !flags.has('confirm-production') && !flags.has('dry-run')) {
    fail('production 발행에는 --confirm-production이 필요합니다.', '먼저 --dry-run으로 점검만 해 볼 수 있습니다.');
  }

  return { channel, message, flags };
}

/** lockfile이 같아도 예전 설치가 남긴 중첩 사본이 fingerprint를 바꾼다(2026-11-17 첫 preview 빌드 실패의 원인). */
function clearDistExceptIpa() {
  const dist = join(CLIENT_DIR, 'dist');

  if (!existsSync(dist)) {
    return;
  }

  for (const entry of readdirSync(dist, { withFileTypes: true })) {
    if (!(entry.isFile() && entry.name.endsWith('.ipa'))) {
      rmSync(join(dist, entry.name), { recursive: true, force: true });
    }
  }
}

function cleanInstall() {
  const workspaceDirs = ['apps', 'packages'].flatMap((group) =>
    readdirSync(join(REPO_ROOT, group), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(group, entry.name)),
  );

  for (const dir of ['.', ...workspaceDirs]) {
    rmSync(join(REPO_ROOT, dir, 'node_modules'), { recursive: true, force: true });
  }

  ok('node_modules 삭제');

  if (run('pnpm', ['install', '--frozen-lockfile'], { cwd: REPO_ROOT }) !== 0) {
    fail('pnpm install 실패');
  }

  ok('pnpm install --frozen-lockfile');
}

main();
