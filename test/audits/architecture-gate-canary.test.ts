import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const VIOLATION_PATH = "src/sim/__canary-violation.ts";

function runDepcruise(): { status: number; output: string } {
  try {
    const stdout = execFileSync(
      "node_modules/.bin/depcruise",
      [
        "src",
        "test",
        "scripts",
        "--config",
        ".dependency-cruiser.mjs",
        "--output-type",
        "err-long",
      ],
      { encoding: "utf8" },
    );
    return { status: 0, output: stdout };
  } catch (error) {
    const failure = error as { status: number | null; stdout?: string; stderr?: string };
    return {
      status: failure.status ?? 1,
      output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
    };
  }
}

// Asserts only depcruise's exit code and rule name on a deliberate violation, never the
// import graph itself — the purity boundary is already enforced elsewhere (testing/README.md R011).
describe("architecture gate canary", () => {
  it("depcruise fails and names sim-must-stay-pure when src/sim imports phaser", () => {
    writeFileSync(VIOLATION_PATH, 'import "phaser";\n\nexport const canary = true;\n');
    try {
      const result = runDepcruise();
      expect(result.status).not.toBe(0);
      expect(result.output).toContain("sim-must-stay-pure");
    } finally {
      rmSync(VIOLATION_PATH, { force: true });
    }
  });
});
