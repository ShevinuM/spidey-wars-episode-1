import { describe, expect, it } from "vitest";
import { nextRand, pick, randInt, seedRand } from "./rng.ts";

describe("seedRand", () => {
  it("reproduces the DCLogic reference sequence for seed 20260912", () => {
    const rand = seedRand(20260912);
    const values = Array.from({ length: 5 }, () => rand());
    expect(values).toEqual([
      0.2859411621466279, 0.5796769957523793, 0.1911674167495221, 0.53301125112921,
      0.42429537256248295,
    ]);
  });

  it("reproduces the DCLogic reference sequence for seed 90613", () => {
    const rand = seedRand(90613);
    const values = Array.from({ length: 5 }, () => rand());
    expect(values).toEqual([
      0.3197727259248495, 0.6985265363473445, 0.36717200465500355, 0.343548031989485,
      0.19731178740039468,
    ]);
  });
});

describe("nextRand / seedRand equivalence", () => {
  it("matches seedRand's first value for the same seed", () => {
    const seed = 20260912;
    expect(nextRand(seed).value).toBe(seedRand(seed)());
  });

  it("threads state so chained nextRand calls match a seedRand closure", () => {
    const seed = 90613;
    const rand = seedRand(seed);
    let state = seed;
    for (let i = 0; i < 5; i += 1) {
      const next = nextRand(state);
      expect(next.value).toBe(rand());
      state = next.state;
    }
  });
});

describe("randInt", () => {
  it("stays within an inclusive [min, max] range across many draws", () => {
    let state = 1;
    for (let i = 0; i < 200; i += 1) {
      const next = randInt(state, 3, 7);
      expect(next.value).toBeGreaterThanOrEqual(3);
      expect(next.value).toBeLessThanOrEqual(7);
      expect(Number.isInteger(next.value)).toBe(true);
      state = next.state;
    }
  });

  it("collapses to a single value when min equals max", () => {
    const next = randInt(42, 5, 5);
    expect(next.value).toBe(5);
  });

  it("throws when min exceeds max", () => {
    expect(() => randInt(1, 10, 5)).toThrow(RangeError);
  });
});

describe("pick", () => {
  it("returns one of the supplied items across many draws", () => {
    const items = ["a", "b", "c"] as const;
    let state = 7;
    for (let i = 0; i < 50; i += 1) {
      const next = pick(state, items);
      expect(items).toContain(next.value);
      state = next.state;
    }
  });

  it("returns the only element from a single-item list", () => {
    const next = pick(9, ["only"]);
    expect(next.value).toBe("only");
  });

  it("throws when items is empty", () => {
    expect(() => pick(1, [])).toThrow(RangeError);
  });
});
