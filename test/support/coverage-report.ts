import MCR from "monocart-coverage-reports";
import { COVERAGE_DIR } from "./coverage.ts";

/**
 * Generates the `e2e` project's coverage report once, after every worker has
 * added its coverage to the shared MCR cache. `hasCache()` guards against
 * running for a project (`smoke`) that never populated it.
 */
export default async function globalTeardown(): Promise<void> {
  const mcr = MCR({
    outputDir: COVERAGE_DIR,
    reports: ["v8", "lcov", "raw"],
    sourceFilter: (sourcePath: string) => sourcePath.startsWith("src/"),
  });
  if (mcr.hasCache()) {
    await mcr.generate();
  }
}
