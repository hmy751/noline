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
    'NOLINE_HARNESS_EXECUTION_PLAN.md',
    'CLAUDE.md',
    'README.md',
    'START_GUIDE.md',
    '.claude/README.md',
    '.claude/harness',
    '.claude/skills',
    '.claude/agents',
    '.claude/rules',
    '.claude/guards',
    '.claude/runbooks',
    '.claude/context',
    '.claude/decisions',
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

function checkOnlyEntries(target, allowed) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) {
    failures.push(`${target} is missing`);
    return;
  }

  const actual = listEntries(target);
  for (const entry of allowed) {
    if (!actual.includes(entry)) failures.push(`${target}/${entry} is missing`);
  }
  for (const entry of actual) {
    if (!allowed.includes(entry)) failures.push(`${target}/${entry} is not an expected harness execution surface`);
  }
}

function checkExecutionSurfaces() {
  checkOnlyEntries('.claude/skills', ['noline-work']);
  checkOnlyEntries('.agents', ['skills']);
  checkOnlyEntries('.agents/skills', ['noline-work']);
  checkOnlyEntries('.claude/agents', expectedExecutionAgents.map((agent) => `${agent}.md`));
  checkOnlyEntries('.codex', ['agents']);
  checkOnlyEntries('.codex/agents', expectedExecutionAgents.map((agent) => `${agent}.toml`));

  checkSymlink('.agents/skills/noline-work', '../../.claude/skills/noline-work');

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

function checkRootPlans() {
  const allowed = new Set(['NOLINE_HARNESS_EXECUTION_PLAN.md']);
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
checkRootPlans();
checkMarkdownLinks();
checkGitDiffWhitespace();

if (failures.length > 0) {
  console.error(`Harness check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Harness check passed.');
