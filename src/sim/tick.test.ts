import { describe, expect, it } from "vitest";
import { digest } from "./digest.ts";
import { FIXED_DT, MAX_FRAME, step, stepTo, tick } from "./tick.ts";
import { newWorld } from "./world.ts";

describe("tick frame independence", () => {
  it("reaches the same step and digest for equal total time at different frame rates", () => {
    const fast = newWorld(1);
    for (let i = 0; i < 100; i += 1) tick(fast, 16.6);

    const slow = newWorld(1);
    for (let i = 0; i < 50; i += 1) tick(slow, 33.2);

    expect(fast.step).toBe(slow.step);
    expect(digest(fast)).toBe(digest(slow));
  });
});

describe("tick MAX_FRAME clamp", () => {
  it("advances at most MAX_FRAME / FIXED_DT steps for one huge delta", () => {
    const w = newWorld(1);
    tick(w, 5000);
    expect(w.step).toBe(Math.floor(MAX_FRAME / FIXED_DT));
  });
});

describe("tick alpha invariant", () => {
  it("keeps alpha in [0, 1) across a run of varied deltas", () => {
    const w = newWorld(1);
    const deltas = [16.6, 8, 40, 16.6, 1000, 0, 16.6];
    for (const d of deltas) {
      tick(w, d);
      expect(w.alpha).toBeGreaterThanOrEqual(0);
      expect(w.alpha).toBeLessThan(1);
    }
  });
});

describe("tick unhappy paths", () => {
  it("does nothing to a freshly created world before any tick", () => {
    const w = newWorld(1);
    expect(w.step).toBe(0);
    expect(w.accumulator).toBe(0);
    expect(w.alpha).toBe(0);
  });

  it("does not advance the step on a zero delta", () => {
    const w = newWorld(1);
    tick(w, 0);
    expect(w.step).toBe(0);
    expect(w.accumulator).toBe(0);
  });

  it("treats a negative delta as no time passing", () => {
    const w = newWorld(1);
    tick(w, -100);
    expect(w.step).toBe(0);
    expect(w.accumulator).toBe(0);
  });

  it("treats a NaN delta as no time passing", () => {
    const w = newWorld(1);
    tick(w, Number.NaN);
    expect(w.step).toBe(0);
    expect(w.accumulator).toBe(0);
    expect(Number.isNaN(w.alpha)).toBe(false);
  });
});

describe("step", () => {
  it("advances w.step by exactly one", () => {
    const w = newWorld(1);
    step(w, FIXED_DT);
    expect(w.step).toBe(1);
    step(w, FIXED_DT);
    expect(w.step).toBe(2);
  });
});

describe("stepTo", () => {
  it("advances the world until w.step equals n", () => {
    const w = newWorld(1);
    stepTo(w, 5);
    expect(w.step).toBe(5);
  });

  it("is a no-op when the world is already at n", () => {
    const w = newWorld(1);
    stepTo(w, 5);
    stepTo(w, 5);
    expect(w.step).toBe(5);
  });

  it("throws a RangeError when n is behind the current step", () => {
    const w = newWorld(1);
    stepTo(w, 5);
    expect(() => stepTo(w, 3)).toThrow(RangeError);
  });
});
