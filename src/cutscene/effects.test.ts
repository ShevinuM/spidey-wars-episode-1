import { describe, expect, it } from "vitest";
import { steppedEase } from "./effects.ts";

/** Phaser's own `Stepped(v, steps)` for `0 < v < 1` (`node_modules/phaser/src/math/easing/stepped/Stepped.js`), pinned here only to prove `steppedEase` disagrees with it. */
function phaserStepped(v: number, steps: number): number {
  return (((steps * v) | 0) + 1) * (1 / steps);
}

describe("steppedEase", () => {
  it("holds 0 for the whole first interval, the tween's from value", () => {
    const ease = steppedEase(4);
    expect(ease(0)).toBe(0);
    expect(ease(0.1)).toBe(0);
    expect(ease(0.24)).toBe(0);
  });

  it("jumps to the next step's value exactly at each interval boundary", () => {
    const ease = steppedEase(4);
    expect(ease(0.25)).toBe(0.25);
    expect(ease(0.5)).toBe(0.5);
    expect(ease(0.75)).toBe(0.75);
  });

  it("reaches 1 at v=1", () => {
    expect(steppedEase(4)(1)).toBe(1);
  });

  it("clamps out-of-range input instead of stepping past [0, 1]", () => {
    const ease = steppedEase(4);
    expect(ease(-0.5)).toBe(0);
    expect(ease(1.5)).toBe(1);
  });

  it("throws on a non-positive or non-integer step count", () => {
    expect(() => steppedEase(0)).toThrow(RangeError);
    expect(() => steppedEase(-2)).toThrow(RangeError);
    expect(() => steppedEase(1.5)).toThrow(RangeError);
  });

  // Canary (docs/rules/general/toolchain.md R004): proves `steppedEase` does NOT behave like Phaser's
  // `ease: "Stepped"`, which is `steps(n, start)` and so has already jumped off its `from` value here.
  it("disagrees with Phaser's Stepped ease at the same input, unlike steps(n, start)", () => {
    const steps = 2;
    const v = 0.1;
    expect(steppedEase(steps)(v)).toBe(0);
    expect(phaserStepped(v, steps)).not.toBe(0);
  });
});
