import {defineConfig} from 'playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {toHaveScreenshot: {animations: 'allow', maxDiffPixels: 0, threshold: 0.1}},
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
    command: 'node tests/visual/server.mjs',
    url: 'http://127.0.0.1:8765',
    reuseExistingServer: false,
  },
});
