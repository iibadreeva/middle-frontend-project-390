import { spawnSync } from 'node:child_process';

/**
 * Задаёт APP_URL для browser-тестов без хардкода в спеках.
 * Переопределение: `APP_URL=... npm run test` или через Makefile.
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
