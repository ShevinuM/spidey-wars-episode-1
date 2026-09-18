import { fc, test } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";
import { DEFAULT_CPS, isComplete, stepsToComplete, visibleChars } from "./typewriter.ts";

describe("visibleChars boundaries", () => {
  it("reveals nothing at zero elapsed steps", () => {
    expect(visibleChars(10, 0, DEFAULT_CPS)).toBe(0);
  });

  it("reveals nothing for zero-length text regardless of elapsed steps", () => {
    expect(visibleChars(0, 1000, DEFAULT_CPS)).toBe(0);
  });

  it("clamps to totalChars once fully revealed", () => {
    const total = 10;
    const stepsNeeded = stepsToComplete(total, DEFAULT_CPS);
    expect(visibleChars(total, stepsNeeded, DEFAULT_CPS)).toBe(total);
  });

  it("stays clamped to totalChars well past completion", () => {
    expect(visibleChars(10, 10_000, DEFAULT_CPS)).toBe(10);
  });
});

describe("isComplete boundaries", () => {
  it("is false the step before completion and true at completion", () => {
    const total = 10;
    const stepsNeeded = stepsToComplete(total, DEFAULT_CPS);
    expect(isComplete(total, stepsNeeded - 1, DEFAULT_CPS)).toBe(false);
    expect(isComplete(total, stepsNeeded, DEFAULT_CPS)).toBe(true);
  });

  it("is true immediately for zero-length text", () => {
    expect(isComplete(0, 0, DEFAULT_CPS)).toBe(true);
  });
});

describe("stepsToComplete agreement with visibleChars", () => {
  it("returns 0 for zero-length text", () => {
    expect(stepsToComplete(0, DEFAULT_CPS)).toBe(0);
  });

  it("returns Infinity when cps is non-positive, never looping", () => {
    expect(stepsToComplete(10, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(stepsToComplete(10, -5)).toBe(Number.POSITIVE_INFINITY);
  });

  it("snaps down when the ceiling estimate overshoots due to floating-point drift", () => {
    // 11 / (11 * STEP_DT) evaluates to just over 60 in floating point, so a plain
    // Math.ceil would return 61 even though step 60 already reveals all 11 characters.
    const n = stepsToComplete(11, 11);
    expect(visibleChars(11, n, 11)).toBe(11);
    expect(visibleChars(11, n - 1, 11)).toBeLessThan(11);
    expect(n).toBe(60);
  });

  test.prop([fc.integer({ min: 1, max: 5000 }), fc.integer({ min: 1, max: 240 })])(
    "is the smallest step count at which visibleChars reaches totalChars",
    (totalChars, cps) => {
      const n = stepsToComplete(totalChars, cps);
      expect(visibleChars(totalChars, n, cps)).toBeGreaterThanOrEqual(totalChars);
      expect(visibleChars(totalChars, n - 1, cps)).toBeLessThan(totalChars);
    },
  );
});
