#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const preservedHistoricalReferences = [];

const rel = (target) => path.relative(root, target) || '.';
const exists = (target) => fs.existsSync(path.join(root, target));
const expectedSkills = [
  'create-context-workspace',
  'work-discussion',
  'reconsider-work',
  'start-app',
  'context-update',
  'explain',
  'development',
  'improvement-loop',
];

function checkSymlink(linkPath, expectedTarget) {
  const absolute = path.join(root, linkPath);
  if (!fs.existsSync(absolute)) {
    failures.push(`${linkPath} is missing`);
    return;
  }
  const stat = fs.lstatSync(absolute);
  if (!stat.isSymbolicLink()) {
    failures.push(`${linkPath} must be a symlink`);
    return;
  }
  const actual = fs.readlinkSync(absolute);
  if (actual !== expectedTarget) {
    failures.push(`${linkPath} points to ${actual}, expected ${expectedTarget}`);
  }
}

function walkMarkdown(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return absolute.endsWith('.md') ? [absolute] : [];

  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const child = path.join(absolute, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(rel(child)));
    if (entry.isFile() && child.endsWith('.md')) files.push(child);
  }
  return files;
}

// 코드 블록의 예시·보존 원문은 현재 문서에서 이동할 수 있는 링크가 아니다.
function withoutFencedCode(text) {
  let fence = null;
  return text.split('\n').map((line) => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (match && match[1][0] === fence[0]
        && match[1].length >= fence.length && match[2].trim() === '') {
        fence = null;
      }
      return '';
    }
    if (match) {
      fence = match[1];
      return '';
    }
    return line;
  }).join('\n');
}

// 원문 보존 대상인 두 과거 기록의 옛 링크만 교체 직전 보존판으로 대조한다.
// 현재 링크나 변경된 기록은 이 예외를 얻지 않으며 일반 missing 검사에서 실패한다.
const historicalSkillRecords = new Map([
  ['context/work/workspaces/002-code-readability-refactoring/records/2026-09-14-05-project-context-structure-reading-and-maintenance.md', 'f5acb5611d35f1b39e2f75b20ef96e01ee4b7ba4605de1cd6ad60bbcf4bfc922'],
  ['context/work/workspaces/002-code-readability-refactoring/records/2026-09-14-06-project-context-reference-insights-and-retest-direction.md', '7219239249f7c868ae3c69b866ea3639b5224bf11f65c6f550d5c10d5a91e593'],
]);

function hasPreservedHistoricalTarget(file, target) {
  const expectedRecordHash = historicalSkillRecords.get(rel(file));
  if (!expectedRecordHash || rel(target) !== '.claude/skills/update-project-context/SKILL.md') return false;
  const sha256 = (filePath) => createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  const snapshot = path.join(root, '.claude/_archive/skill-transition-2026-10-30/update-project-context.txt');
  return fs.existsSync(snapshot)
    && sha256(file) === expectedRecordHash
    && sha256(snapshot) === '90fe055b2c01d1c62c9570851384eeeade613fd856b3bf79fb478cabba2d30f6';
}

function checkMarkdownLinks() {
  const activeInputs = [
    'CLAUDE.md',
    'README.md',
    'START_GUIDE.md',
    '.claude/README.md',
    '.claude/harness',
    '.agents/skills',
    '.claude/context',
    'context',
    'apps/client/CLAUDE.md',
    'apps/server/CLAUDE.md',
    'packages/schema/CLAUDE.md',
    'packages/ui/CLAUDE.md',
  ];

  const files = [...new Set(activeInputs.flatMap(walkMarkdown))];
  const linkPattern = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)/g;

  for (const file of files) {
    const text = withoutFencedCode(fs.readFileSync(file, 'utf8'));
    let match;
    while ((match = linkPattern.exec(text))) {
      let target = match[1].trim().replace(/^<|>$/g, '').split('#')[0];
      if (!target) continue;
      target = decodeURI(target);
      const absoluteTarget = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(absoluteTarget)) {
        if (hasPreservedHistoricalTarget(file, absoluteTarget)) {
          preservedHistoricalReferences.push(`${rel(file)} -> ${rel(absoluteTarget)}`);
        } else {
          failures.push(`${rel(file)} links to missing ${match[1]}`);
        }
      }
    }
  }
}

function checkNoLegacySurfaces() {
  const forbidden = [
    '.claude/core',
    '.claude/features',
    '.claude/implementation',
    '.claude/references',
    '.claude/rules',
    '.claude/guards',
    '.claude/runbooks',
    '.claude/workflows',
    '.claude/commands',
    '.claude/audits',
    '.claude/decisions',
    '.claude/sessions',
    '.claude/agents',
    '.codex/agents',
    '.claude/skills/noline-work',
    '.agents/skills/noline-work',
    '.claude/commands/check-docs.md',
    '.claude/commands/doc-save.md',
    '.claude/commands/doc-discuss.md',
    '.claude/commands/doc-refactor.md',
  ];

  for (const target of forbidden) {
    if (exists(target)) failures.push(`${target} should not exist in the current Noline harness`);
  }
}

function listEntries(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute).filter((entry) => entry !== '.DS_Store').sort();
}

function checkOnlyEntries(target, required, allowed = required) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) {
    failures.push(`${target} is missing`);
    return;
  }

  const actual = listEntries(target);
  for (const entry of required) {
    if (!actual.includes(entry)) failures.push(`${target}/${entry} is missing`);
  }
  for (const entry of actual) {
    if (!allowed.includes(entry)) failures.push(`${target}/${entry} is not an expected harness execution surface`);
  }
}

function checkExecutionSurfaces() {
  checkSymlink('.claude/skills', '../.agents/skills');
  checkOnlyEntries('.agents', ['skills']);
  checkOnlyEntries('.agents/skills', [
    ...expectedSkills,
    'README.md',
    'shared',
    'SKILLS-CONTENT-POLICY.md',
    '_background',
  ]);
  if (exists('.agents/skills') && !fs.lstatSync(path.join(root, '.agents/skills')).isDirectory()) {
    failures.push('.agents/skills must be the canonical directory');
  }
  checkOnlyEntries(
    '.codex',
    ['config.toml', 'hooks', 'hooks.json', 'maintain.json'],
    ['config.toml', 'hooks', 'hooks.json', 'maintain.json', 'maintain-runtime'],
  );

  for (const name of expectedSkills) {
    const directory = `.agents/skills/${name}`;
    const skill = `${directory}/SKILL.md`;
    if (!exists(directory) || !fs.lstatSync(path.join(root, directory)).isDirectory()) {
      failures.push(`${directory} must be a canonical directory`);
    }
    if (!exists(skill) || !fs.lstatSync(path.join(root, skill)).isFile()) {
      failures.push(`${skill} must be a regular file`);
    }
  }

}

function checkContextHarnessSurface() {
  const required = [
    'context/README.md',
    'context/project/README.md',
    'context/project/MAINTENANCE.md',
    'context/project/REFERENCE/README.md',
    'context/project/REFERENCE/composition.md',
    'context/project/REFERENCE/reading.md',
    'context/project/common/README.md',
    'context/project/current/README.md',
    'context/project/guidance/README.md',
    'context/project/guidance/travel-access/INDEX.md',
    'context/project/guidance/data-lifecycle/INDEX.md',
    'context/project/guidance/development-boundaries/schema-and-types.md',
    'context/project/guidance/api-contracts.md',
    'context/project/common/date-and-time.md',
    'context/project/decisions/README.md',
    'context/work/README.md',
    'context/work/workspaces/README.md',
    'context/work/workspaces/CREATE-AND-TRANSITION.md',
    'context/work/workspaces/spec-and-tickets/README.md',
    'context/work/workspaces/spec-and-tickets/EXECUTION-CRITERIA.md',
    'context/work/workspaces/spec-and-tickets/SPEC.md',
    'context/work/workspaces/spec-and-tickets/TICKET.md',
    'context/work/workspaces/spec-and-tickets/MAINTENANCE.md',
    'context/work/harness/README.md',
    '.codex/config.toml',
    '.codex/hooks.json',
    '.codex/hooks/maintain.py',
    '.codex/maintain.json',
    '.claude/settings.json',
    '.claude/hooks/maintain.py',
  ];

  for (const target of required) {
    if (!exists(target)) failures.push(`${target} is missing from the Context Harness surface`);
  }

  const maintainConfig = path.join(root, '.codex/maintain.json');
  if (fs.existsSync(maintainConfig)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(maintainConfig, 'utf8'));
      if (parsed.schema_version !== 2 || parsed.mode !== 'explicit') {
        failures.push('.codex/maintain.json must use schema v2 explicit admission');
      }
    } catch {
      failures.push('.codex/maintain.json must be valid JSON');
    }
  }

  const codexConfig = path.join(root, '.codex/config.toml');
  if (fs.existsSync(codexConfig)) {
    try {
      // Maintain already requires Python 3.11+; use its TOML parser rather than
      // duplicating TOML syntax or adding a second parser dependency.
      const parsed = JSON.parse(execFileSync('python3', [
        '-c', 'import json, sys, tomllib; print(json.dumps(tomllib.loads(sys.stdin.read())))',
      ], { input: fs.readFileSync(codexConfig, 'utf8'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }));
      if (parsed.features?.hooks !== true) {
        failures.push('.codex/config.toml must enable features.hooks');
      }
      const rolePath = parsed.agents?.workspace_context_maintainer?.config_file;
      const expectedRole = path.join(root, 'context/work/harness/maintain/workspace-context-maintainer.toml');
      if (typeof rolePath !== 'string'
        || path.resolve(path.dirname(codexConfig), rolePath) !== expectedRole
        || !fs.existsSync(expectedRole)
        || !fs.lstatSync(expectedRole).isFile()) {
        failures.push('.codex/config.toml must discover the shared Maintain role file');
      }
    } catch {
      failures.push('.codex/config.toml must be valid TOML readable with Python 3.11+');
    }
  }

  const codexHooks = path.join(root, '.codex/hooks.json');
  if (fs.existsSync(codexHooks)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(codexHooks, 'utf8'));
      for (const [eventName, command] of Object.entries({
        SessionStart: 'session-start',
        UserPromptSubmit: 'user-prompt',
        Stop: 'response-end',
        SessionEnd: 'session-end',
        PreToolUse: 'tool-event',
        PostToolUse: 'tool-event',
        Interrupt: 'interrupt',
      })) {
        const handlers = parsed.hooks?.[eventName];
        const expectedCommand = `python3 "$(git rev-parse --show-toplevel)/.codex/hooks/maintain.py" ${command}`;
        const maintainHandler = handlers?.flatMap((group) => group.hooks ?? []).find(
          (handler) => handler.type === 'command' && handler.command === expectedCommand,
        );
        if (!maintainHandler) {
          failures.push(`.codex/hooks.json must route ${eventName} through the Codex project wrapper`);
        }
      }
    } catch {
      failures.push('.codex/hooks.json must be valid JSON');
    }
  }

  const claudeSettings = path.join(root, '.claude/settings.json');
  if (fs.existsSync(claudeSettings)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(claudeSettings, 'utf8'));
      for (const [eventName, command] of Object.entries({
        SessionStart: 'session-start',
        UserPromptSubmit: 'user-prompt',
        Stop: 'response-end',
        SessionEnd: 'session-end',
      })) {
        const handlers = parsed.hooks?.[eventName];
        const maintainHandler = handlers?.flatMap((group) => group.hooks ?? []).find(
          (handler) => handler.type === 'command'
            && handler.command === 'python3'
            && Array.isArray(handler.args)
            && ((handler.args[0] === '${CLAUDE_PROJECT_DIR}/.claude/hooks/maintain.py'
              && handler.args[1] === command)
              || (handler.args[0] === path.join(root, 'evidence-collector/integration/dispatch.py')
                && handler.args[1] === '--host' && handler.args[2] === 'claude'
                && handler.args[3] === '--project-root' && handler.args[4] === root
                && handler.args[5] === command
                && exists('evidence-collector/integration/dispatch.py'))),
        );
        if (!maintainHandler) {
          failures.push(`.claude/settings.json must route ${eventName} through a supported Claude lifecycle entrypoint`);
        }
      }
    } catch {
      failures.push('.claude/settings.json must be valid JSON');
    }
  }
}

function checkWorkspaceGuideContract() {
  const workspaceGuides = {
    'apps/client/CLAUDE.md': 140,
    'apps/server/CLAUDE.md': 130,
    'packages/schema/CLAUDE.md': 130,
    'packages/ui/CLAUDE.md': 120,
  };

  for (const [guide, maxLines] of Object.entries(workspaceGuides)) {
    const text = fs.readFileSync(path.join(root, guide), 'utf8');
    if (!text.includes('## Harness Role')) {
      failures.push(`${guide} must document its path-scoped Harness Role`);
    }
    if (!text.includes('AGENTS.md')) {
      failures.push(`${guide} must state the local AGENTS.md bridge boundary`);
    }
    const lines = text.trimEnd().split('\n').length;
    if (lines > maxLines) {
      failures.push(`${guide} has ${lines} lines; keep workspace harness guides at or below ${maxLines} lines`);
    }
  }
}

function checkRootPlans() {
  const allowed = new Set();
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (/^NOLINE_.*PLAN.*\.md$/.test(entry.name) && !allowed.has(entry.name)) {
      failures.push(`${entry.name} is an old root plan; archive or remove it`);
    }
  }
}

function checkGitDiffWhitespace() {
  for (const args of [
    ['diff', '--check'],
    ['diff', '--cached', '--check'],
  ]) {
    try {
      execFileSync('git', args, { cwd: root, stdio: 'pipe' });
    } catch (error) {
      failures.push(`git ${args.join(' ')} failed:\n${error.stdout?.toString() ?? ''}${error.stderr?.toString() ?? ''}`);
    }
  }
}

checkSymlink('AGENTS.md', 'CLAUDE.md');
checkSymlink('apps/client/AGENTS.md', 'CLAUDE.md');
checkSymlink('apps/server/AGENTS.md', 'CLAUDE.md');
checkSymlink('packages/schema/AGENTS.md', 'CLAUDE.md');
checkSymlink('packages/ui/AGENTS.md', 'CLAUDE.md');
checkNoLegacySurfaces();
checkExecutionSurfaces();
checkContextHarnessSurface();
checkWorkspaceGuideContract();
checkRootPlans();
checkMarkdownLinks();
// Durable Verify snapshots regular inputs; Git/index whitespace is checked by the default run.
if (!process.argv.includes('--no-git-diff')) checkGitDiffWhitespace();

if (preservedHistoricalReferences.length > 0) {
  console.log(`보존 원문으로 대조한 과거 스킬 참조: ${preservedHistoricalReferences.length}건 (옛 URL은 현재 실행 경로가 아님)`);
}

if (failures.length > 0) {
  console.error(`Harness check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Harness check passed.');
