// E2E tests (tests/e2e/*.spec.js). `npm run test:e2e` builds the site and
// serves dist/ with `wrangler dev` (the same Workers static assets serving as
// production, including _redirects and _headers), then runs Chromium against
// it. Playwright stops the server when the run ends.
import { defineConfig, devices } from "@playwright/test";

const PORT = 8788;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.js",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // No retries: a flaky test should fail, not pass on the second try.
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  // playwright-report/ (and the traces and screenshots of failed tests in
  // test-results/) are kept as CI artifacts.
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npx wrangler dev --port ${PORT} --ip localhost`,
    url: `http://localhost:${PORT}/lab`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
