// Disposable fixture database: these credentials are used only by this test process.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = fileURLToPath(new URL('../../megacolours-api/', import.meta.url));
const fixture = mkdtempSync(path.join(tmpdir(), 'megacolours-e2e-'));
const child = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
  cwd: apiRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '4100',
    DATABASE_PATH: path.join(fixture, 'test.sqlite'),
    UPLOAD_DIR: path.join(fixture, 'uploads'),
    ADMIN_EMAIL: 'test-admin@megacolours.invalid',
    ADMIN_PASSWORD: 'Isolated-browser-test-password-2026!',
    SESSION_SECRET: 'isolated-test-only-session-secret-32-characters',
    WEB_ORIGIN: 'http://localhost:3100',
    NODE_ENV: 'development',
  },
});
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
child.on('exit', code => process.exit(code ?? 1));
