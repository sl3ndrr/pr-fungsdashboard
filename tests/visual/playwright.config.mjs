import {defineConfig} from 'playwright/test';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {toHaveScreenshot: {animations: 'disabled', maxDiffPixels: 0, threshold: 0.1}},
  use: {
    baseURL: 'http://127.0.0.1:8765',
    timezoneId: 'Europe/Berlin',
    locale: 'de-DE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName, use: {browserName},
  })),
  webServer: {
    command: 'python3 -m http.server 8765 --bind 127.0.0.1',
    cwd: process.env.DASHBOARD_ROOT || root,
    url: 'http://127.0.0.1:8765',
    reuseExistingServer: false,
  },
});

