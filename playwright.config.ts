import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

const DIST_PORT = 4173;
const DIST_TEST_PORT = 4174;
const DIST_PREFIX = "/jam/7f3a9c/";
const VISUAL_CONTAINER = process.env.VISUAL_CONTAINER === "1";

const VISUAL_LAUNCH_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--disable-skia-runtime-opts",
  "--force-device-scale-factor=1",
  "--font-render-hinting=none",
  "--hide-scrollbars",
];

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
  // Registered only inside the pinned container — visual-testing.md R003/R004.
  ...(VISUAL_CONTAINER
    ? [
        {
          name: "visual",
          testDir: "test/visual",
          snapshotPathTemplate: "test/visual/baselines/{arg}{ext}",
          retries: 0,
          expect: {
            toHaveScreenshot: { maxDiffPixels: 0, threshold: 0 },
          },
          use: {
            baseURL: `http://localhost:${DIST_TEST_PORT}/`,
            viewport: { width: 1280, height: 720 },
            deviceScaleFactor: 1,
            launchOptions: { args: VISUAL_LAUNCH_ARGS },
          },
        },
      ]
    : []),
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
