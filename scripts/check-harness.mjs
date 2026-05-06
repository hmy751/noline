#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

const rel = (target) => path.relative(root, target) || '.';
const exists = (target) => fs.existsSync(path.join(root, target));

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
    '.claude/rules',
    '.claude/guards',
    '.claude/runbooks',
    '.claude/context',
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
    '.codex',
    '.agents',
    '.claude/agents',
    '.claude/skills',
  ];

  for (const target of forbidden) {
    if (exists(target)) failures.push(`${target} should not exist in the current Noline harness`);
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
checkRootPlans();
checkMarkdownLinks();
checkGitDiffWhitespace();

if (failures.length > 0) {
  console.error(`Harness check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Harness check passed.');
