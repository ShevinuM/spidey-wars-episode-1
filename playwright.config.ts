import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

const DIST_PORT = 4173;
const DIST_TEST_PORT = 4174;
const DIST_PREFIX = "/jam/7f3a9c/";

const projects: NonNullable<PlaywrightTestConfig["projects"]> = [
  {
    name: "smoke",
    testDir: "test/e2e",
    testMatch: "smoke.spec.ts",
    use: { baseURL: `http://localhost:${DIST_PORT}${DIST_PREFIX}` },
  },
  {
    name: "e2e",
    testDir: "test/e2e",
    testIgnore: "smoke.spec.ts",
    use: { baseURL: `http://localhost:${DIST_TEST_PORT}/` },
  },
];

export default defineConfig({
  globalTeardown: "./test/support/coverage-report.ts",
  webServer: [
    {
      command: `node test/support/static-server.ts dist ${DIST_PORT} ${DIST_PREFIX}`,
      port: DIST_PORT,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node test/support/static-server.ts dist-test ${DIST_TEST_PORT} /`,
      port: DIST_TEST_PORT,
      reuseExistingServer: !process.env.CI,
    },
  ],
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [["html"], ["list"]],
  projects,
});
