import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // The dev server backing these tests is a single Node process sharing one
  // Prisma connection pool — too many workers registering/logging in at once
  // (each several sequential DB round trips + bcrypt) causes queuing that
  // blows past even a generous per-assertion timeout. Capped, not unlimited.
  workers: process.env.CI ? 1 : 3,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
