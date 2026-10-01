#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const rel = (target) => path.relative(root, target) || '.';
const exists = (target) => fs.existsSync(path.join(root, target));
const expectedExecutionAgents = [
  'noline-context-collector',
  'noline-harness-observer',
  'noline-policy-checker',
];
const expectedSkills = [
  'noline-work',
  'create-context-workspace',
  'read-project-context',
  'update-project-context',
  'work-discussion',
  'reconsider-work',
  'work-artifact-briefing',
  'explanation-recovery',
  'start-app',
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

function checkMarkdownLinks() {
  const activeInputs = [
    'CLAUDE.md',
    'README.md',
    'START_GUIDE.md',
    '.claude/README.md',
    '.claude/harness',
    '.claude/audits/2026-05-06-harness-execution-plan.md',
    '.claude/skills',
    '.claude/agents',
    '.claude/rules',
    '.claude/guards',
    '.claude/runbooks',
    '.claude/context',
    '.claude/decisions',
    'context',
    'apps/client/CLAUDE.md',
    'apps/server/CLAUDE.md',
    'packages/schema/CLAUDE.md',
    'packages/ui/CLAUDE.md',
  ];

  const files = [...new Set(activeInputs.flatMap(walkMarkdown))];
  const linkPattern = /\[[^\]]+\]\((?!https?:|mailto:|#)([^)]+)\)/g;

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = linkPattern.exec(text))) {
      let target = match[1].trim().replace(/^<|>$/g, '').split('#')[0];
      if (!target) continue;
      target = decodeURI(target);
      const absoluteTarget = path.resolve(path.dirname(file), target);
      if (!fs.existsSync(absoluteTarget)) {
        failures.push(`${rel(file)} links to missing ${match[1]}`);
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
  checkOnlyEntries('.claude/skills', [...expectedSkills, 'README.md']);
  checkOnlyEntries('.agents', ['skills']);
  checkOnlyEntries('.agents/skills', [...expectedSkills, 'README.md']);
  checkOnlyEntries('.claude/agents', expectedExecutionAgents.map((agent) => `${agent}.md`));
  checkOnlyEntries(
    '.codex',
    ['agents', 'config.toml', 'hooks', 'hooks.json', 'maintain.json'],
    ['agents', 'config.toml', 'hooks', 'hooks.json', 'maintain.json', 'maintain-runtime'],
  );
  checkOnlyEntries('.codex/agents', expectedExecutionAgents.map((agent) => `${agent}.toml`));

  for (const name of expectedSkills) {
    checkSymlink(`.agents/skills/${name}`, `../../.claude/skills/${name}`);
    if (!exists(`.claude/skills/${name}/SKILL.md`)) {
      failures.push(`.claude/skills/${name}/SKILL.md is missing`);
    }
  }

  for (const agent of expectedExecutionAgents) {
    const claudePath = path.join(root, '.claude/agents', `${agent}.md`);
    const codexPath = path.join(root, '.codex/agents', `${agent}.toml`);
    if (!fs.existsSync(claudePath) || !fs.existsSync(codexPath)) continue;

    const codexName = agent.replaceAll('-', '_');
    const claudeText = fs.readFileSync(claudePath, 'utf8');
    const codexText = fs.readFileSync(codexPath, 'utf8');

    if (!claudeText.includes('report-only')) {
      failures.push(`.claude/agents/${agent}.md must state report-only`);
    }
    if (!codexText.includes(`name = "${codexName}"`)) {
      failures.push(`.codex/agents/${agent}.toml must use name "${codexName}"`);
    }
    if (!codexText.includes('Inspect only. Do not edit files.')) {
      failures.push(`.codex/agents/${agent}.toml must be read-only/report-only`);
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

if (failures.length > 0) {
  console.error(`Harness check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Harness check passed.');
