import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { digest } from "./digest.ts";
import { tick } from "./tick.ts";
import { newWorld } from "./world.ts";

const FUZZ_PARAMS = { numRuns: 300, seed: 20260912 };

test.prop(
  [
    fc.integer({ min: -1_000_000, max: 1_000_000 }),
    fc.array(fc.double({ min: 0, max: 300, noNaN: true }), { minLength: 0, maxLength: 50 }),
  ],
  FUZZ_PARAMS,
)(
  "produces an integer step and alpha in [0, 1) deterministically for any delta sequence",
  (seed, deltas) => {
    const run = (): ReturnType<typeof newWorld> => {
      const w = newWorld(seed);
      for (const d of deltas) tick(w, d);
      return w;
    };
    const first = run();
    const second = run();

    expect(Number.isInteger(first.step)).toBe(true);
    expect(first.step).toBeGreaterThanOrEqual(0);
    expect(first.alpha).toBeGreaterThanOrEqual(0);
    expect(first.alpha).toBeLessThan(1);
    expect(first.step).toBe(second.step);
    expect(digest(first)).toBe(digest(second));
  },
);

test.prop(
  [fc.integer({ min: 1, max: 30 }), fc.double({ min: 1, max: 40, noNaN: true })],
  FUZZ_PARAMS,
)("agrees on step and digest when the frame rate doubles for half as many frames", (n, d) => {
  const a = newWorld(7);
  for (let i = 0; i < n; i += 1) tick(a, d);

  const b = newWorld(7);
  for (let i = 0; i < 2 * n; i += 1) tick(b, d / 2);

  expect(a.step).toBe(b.step);
  expect(digest(a)).toBe(digest(b));
});
