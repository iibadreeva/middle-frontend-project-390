import { spawnSync } from 'node:child_process';

/**
 * Ensures APP_URL is available for browser tests without hardcoding it
 * inside the specs. Override via env or `APP_URL=... make test`.
 */
const env = {
  ...process.env,
  APP_URL: process.env.APP_URL || 'http://localhost:5173',
};

const result = spawnSync('npx', ['vitest', 'run', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 1);
