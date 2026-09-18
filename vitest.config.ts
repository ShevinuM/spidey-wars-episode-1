import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "test/audits/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/sim/**/*.ts", "src/cutscene/**/*.ts", "scripts/lib/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reportsDirectory: "coverage/unit",
      reporter: ["text", "lcov"],
      thresholds: {
        "src/sim/**/*.ts": {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
          perFile: true,
        },
        "src/cutscene/**/*.ts": {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
          perFile: true,
        },
        "scripts/lib/**/*.ts": {
          statements: 95,
          branches: 95,
          functions: 95,
          lines: 95,
          perFile: true,
        },
      },
    },
  },
});
