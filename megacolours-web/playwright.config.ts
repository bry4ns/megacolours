import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: [
    { command: 'node e2e/start-api.mjs', url: 'http://127.0.0.1:4100/api/catalog', reuseExistingServer: false, timeout: 60_000 },
    { command: 'npm run dev -- --port 3100', url: 'http://localhost:3100', reuseExistingServer: false, timeout: 120_000, env: { API_ORIGIN: 'http://127.0.0.1:4100' } },
  ],
});
