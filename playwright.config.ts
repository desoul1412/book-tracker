/**
 * @file playwright.config.ts
 * @description Playwright configuration for cross-browser E2E testing.
 *
 * Browsers under test
 * ─────────────────────────────────────────────────────────────────────────────
 * • chromium  — Desktop Chrome  (v8 JS engine, Blink renderer)
 * • firefox   — Desktop Firefox (SpiderMonkey, Gecko renderer)
 * • webkit    — Desktop Safari  (JavaScriptCore, WebKit renderer)
 *
 * The test server is the Next.js dev server started automatically by
 * `webServer`. Tests run headlessly in CI; locally pass --headed to debug.
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  /* Maximum time one test can run */
  timeout: 30_000,
  /* Retry once on CI to absorb flaky animation timing */
  retries: process.env.CI ? 1 : 0,
  /* Parallelise across browsers */
  fullyParallel: true,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: "http://localhost:3000",
    /* Capture trace on first retry for debugging */
    trace: "on-first-retry",
    /* Screenshots on failure */
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    /* Mobile viewports — exercises responsive canvas sizing & swipe controls */
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  /* Spin up the Next.js dev server before tests run */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
