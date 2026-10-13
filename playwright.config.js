// Playwright config. Owner: Kenji (starter by Lena in Step 0).
// Uses the preinstalled Playwright 1.56.1 and Chromium in /opt/pw-browsers. Never run
// `playwright install`. Run `npm run setup` once (links the global playwright package).
import { defineConfig, devices } from 'playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `http-server app -p ${PORT} -c-1 -s`,
    port: PORT,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'] } },
    { name: 'phone-dark', use: { ...devices['Pixel 7'], colorScheme: 'dark' } },
    {
      name: 'small',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 740 },
        screen: { width: 360, height: 740 },
      },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
