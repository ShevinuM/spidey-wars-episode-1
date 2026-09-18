import { describe, expect, it } from "vitest";
import { runReplay } from "../../src/sim/replay.ts";
import { replays } from "../replays/index.ts";

describe("replay corpus", () => {
  it("is an array", () => {
    expect(Array.isArray(replays)).toBe(true);
  });

  it("every entry parses as a valid Replay and matches its expected digest", () => {
    for (const replay of replays) {
      const result = runReplay(replay);
      expect(result.digest).toBe(replay.expected.digest);
      expect(result.trajectory).toEqual(replay.expected.trajectory);
    }
  });
});
