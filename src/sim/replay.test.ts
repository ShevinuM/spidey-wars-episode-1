import { describe, expect, it } from "vitest";
import { digest } from "./digest.ts";
import { type Replay, runReplay } from "./replay.ts";
import { newWorld } from "./world.ts";

const EMPTY_EXPECTED = { digest: "", trajectory: [] };

describe("runReplay", () => {
  it("runs an empty replay to a step-0 world with no trajectory", () => {
    const replay: Replay = { seed: 42, inputs: [], expected: EMPTY_EXPECTED };
    const result = runReplay(replay);
    expect(result.world.step).toBe(0);
    expect(result.digest).toBe(digest(newWorld(42)));
    expect(result.trajectory).toEqual([]);
  });

  it("advances to the highest step named in its inputs, applying actions keyed by step", () => {
    const replay: Replay = {
      seed: 1,
      inputs: [
        [5, { t: "noop" }],
        [2, { t: "noop" }],
      ],
      expected: EMPTY_EXPECTED,
    };
    const result = runReplay(replay);
    expect(result.world.step).toBe(5);
  });

  it("records a trajectory digest every 60 steps, matching an independent run to the same step", () => {
    const seed = 20260912;
    const at60 = runReplay({ seed, inputs: [[60, { t: "noop" }]], expected: EMPTY_EXPECTED });
    const at120 = runReplay({ seed, inputs: [[120, { t: "noop" }]], expected: EMPTY_EXPECTED });

    expect(at120.trajectory).toHaveLength(2);
    expect(at120.trajectory[0]).toBe(at60.digest);
    expect(at120.trajectory[1]).toBe(at120.digest);
  });

  it("rejects a non-finite seed", () => {
    const replay: Replay = { seed: Number.NaN, inputs: [], expected: EMPTY_EXPECTED };
    expect(() => runReplay(replay)).toThrow(/seed/);
  });

  it("rejects an input keyed to a negative step", () => {
    const replay: Replay = { seed: 1, inputs: [[-1, { t: "noop" }]], expected: EMPTY_EXPECTED };
    expect(() => runReplay(replay)).toThrow(/step/);
  });

  it("rejects an input keyed to a non-integer step", () => {
    const replay: Replay = { seed: 1, inputs: [[1.5, { t: "noop" }]], expected: EMPTY_EXPECTED };
    expect(() => runReplay(replay)).toThrow(/step/);
  });

  it("rejects a duplicate input step instead of silently keeping the last one", () => {
    const replay: Replay = {
      seed: 1,
      inputs: [
        [3, { t: "noop" }],
        [3, { t: "noop" }],
      ],
      expected: EMPTY_EXPECTED,
    };
    expect(() => runReplay(replay)).toThrow(/duplicate/);
  });

  it("applies an input keyed to step 0 before any transition, so it is reachable", () => {
    const replay = {
      seed: 1,
      inputs: [[0, { t: "bogus" }]],
      expected: EMPTY_EXPECTED,
    } as unknown as Replay;
    expect(() => runReplay(replay)).toThrow(/at step 0/);
  });

  it("applies an input keyed to step s while w.step === s, not s - 1", () => {
    const replay = {
      seed: 1,
      inputs: [[3, { t: "bogus" }]],
      expected: EMPTY_EXPECTED,
    } as unknown as Replay;
    expect(() => runReplay(replay)).toThrow(/at step 3/);
  });
});
