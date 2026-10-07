#!/usr/bin/env node
// Start (or confirm) the local backend for an unattended quality-audit wave.
//
// `npm run audit:backend` — one pre-approved command instead of the shell
// pipelines (nohup … &, curl || echo, lsof; ps) that the scheduled waves used
// to improvise. Each improvised compound command needed its own permission
// approval, and with nobody there to give it the run stalled — every wave from
// 2026-08-29 to 2026-10-07 died that way. Prints one status line; exits 0 when
// the backend is healthy with an API key, 1 otherwise. Never prints the key.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.AUDIT_PORT) || 3001;
const LOG = path.join(require('os').tmpdir(), 'deftbrain-audit-backend.log');
const HEALTH = `http://localhost:${PORT}/api/health`;

async function healthy() {
  try { return (await fetch(HEALTH, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; }
}

(async () => {
  const env = fs.existsSync(path.join(ROOT, 'backend', '.env')) ? fs.readFileSync(path.join(ROOT, 'backend', '.env'), 'utf8') : '';
  if (!/^ANTHROPIC_API_KEY=\S+/m.test(env)) {
    console.log('AUDIT-BACKEND: FAIL — backend/.env has no ANTHROPIC_API_KEY. Stop and report this.');
    process.exit(1);
  }
  if (await healthy()) {
    console.log(`AUDIT-BACKEND: OK — already running at ${HEALTH}`);
    return;
  }
  const out = fs.openSync(LOG, 'a');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(ROOT, 'backend'), env: { ...process.env, PORT: String(PORT) },
    detached: true, stdio: ['ignore', out, out],
  });
  child.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await healthy()) {
      console.log(`AUDIT-BACKEND: OK — started (pid ${child.pid}) at ${HEALTH}; log ${LOG}`);
      return;
    }
  }
  console.log(`AUDIT-BACKEND: FAIL — did not become healthy in 20s. Last log lines:\n${fs.readFileSync(LOG, 'utf8').split('\n').slice(-15).join('\n')}`);
  process.exit(1);
})();
