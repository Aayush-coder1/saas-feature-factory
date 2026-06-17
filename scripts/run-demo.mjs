#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function green(s) { return `\x1b[32m${s}\x1b[0m`; }
function blue(s) { return `\x1b[34m${s}\x1b[0m`; }
function yellow(s) { return `\x1b[33m${s}\x1b[0m`; }

function run(cmd, cwd = ROOT, opts = {}) {
  console.log(`\n${yellow('$')} ${bold(cmd)}\n`);
  try {
    const output = execSync(cmd, { cwd, encoding: 'utf8', stdio: 'pipe', timeout: opts.timeout || 120000, ...opts });
    console.log(output);
    return { success: true, output };
  } catch (e) {
    console.log(e.stdout || '');
    console.error(e.stderr || '');
    return { success: false, output: e.stdout || '', error: e.stderr || '' };
  }
}

console.log(`
${green('╔══════════════════════════════════════════════════════════════╗')}
${green('║            SAAS FEATURE FACTORY - DEMO RUNNER               ║')}
${green('║     Multi-Agent System via Band Collaboration Layer         ║')}
${green('╚══════════════════════════════════════════════════════════════╝')}
`);

const appDir = resolve(ROOT, 'sample-app');
const agentsDir = resolve(ROOT, 'agents');

console.log(bold('Step 1: Installing sample app dependencies...'));
run('npm install', appDir);

console.log(bold('Step 2: Running baseline tests...'));
run('npx vitest run', appDir);

console.log(bold('Step 3: Running 5-agent collaboration demo...'));
const isWin = process.platform === 'win32';
const envCmd = isWin
  ? `set PYTHONPATH=${ROOT} && python -m agents.orchestrator.cli demo`
  : `PYTHONPATH=${ROOT} python -m agents.orchestrator.cli demo`;
run(envCmd, agentsDir);

console.log(bold('Step 4: Running tests again to verify no regressions...'));
run('npx vitest run', appDir);

console.log(`
${green('╔══════════════════════════════════════════════════════════════╗')}
${green('║                    DEMO COMPLETE!                            ║')}
${green('║                                                              ║')}
${green('║  5 agents collaborated via Band to plan, code, test,        ║')}
${green('║  document, and deploy new features for the SaaS app.        ║')}
${green('║                                                              ║')}
${green('║  Agents:  Spec -> CodeGen -> QA -> Docs -> Deploy           ║')}
${green('║  Dashboard: Next.js 15 + Tailwind CSS + PostgreSQL          ║')}
${green('║  Channel: feature-factory (Band Room)                       ║')}
${green('╚══════════════════════════════════════════════════════════════╝')}
`);
