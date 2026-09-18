import { test as base } from "@playwright/test";
import MCR from "monocart-coverage-reports";

/** Where each test's raw V8 coverage accumulates until `globalTeardown` reports it. */
export const COVERAGE_DIR = "coverage/e2e";

/** Records V8 JS coverage for the page and hands it to MCR's shared cache. */
export const test = base.extend<{ coverage: void }>({
  coverage: [
    async ({ page }, use) => {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      const jsCoverage = await page.coverage.stopJSCoverage();
      await MCR({ outputDir: COVERAGE_DIR }).add(jsCoverage);
    },
    { auto: true },
  ],
});
