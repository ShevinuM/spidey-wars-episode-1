import { describe, expect, it } from "vitest";
import { advance, newPlayer, phaseOf, setStep, visibleCharsOf } from "./player.ts";
import type { PlayerState } from "./player.ts";
import { beatCharCount } from "./script.ts";
import type { Beat } from "./script.ts";
import { DEFAULT_CPS, stepsToComplete } from "./typewriter.ts";

function beat(text: string): Beat {
  return {
    bg: "rooftop",
    actors: [],
    speaker: "SPIDEY",
    lines: [{ runs: [{ text, style: "body" }] }],
  };
}

const SCRIPT: readonly Beat[] = [beat("Hi"), beat("There friend")];

describe("newPlayer", () => {
  it("starts at beat 0 with no elapsed steps and not finished", () => {
    expect(newPlayer()).toEqual({ beat: 0, elapsedSteps: 0, finished: false });
  });
});

describe("empty script", () => {
  it("is finished from newPlayer() onward", () => {
    expect(phaseOf(newPlayer(), [], DEFAULT_CPS)).toBe("finished");
  });

  it("shows no visible characters", () => {
    expect(visibleCharsOf(newPlayer(), [], DEFAULT_CPS)).toBe(0);
  });

  it("leaves advance() a no-op", () => {
    const state = newPlayer();
    expect(advance(state, [], DEFAULT_CPS)).toEqual(state);
  });
});

describe("phaseOf", () => {
  it("is typing before the beat's characters are fully revealed", () => {
    expect(phaseOf(newPlayer(), SCRIPT, DEFAULT_CPS)).toBe("typing");
  });

  it("is complete once every character of the beat is revealed", () => {
    const total = beatCharCount(SCRIPT[0]);
    const state = setStep(newPlayer(), stepsToComplete(total, DEFAULT_CPS));
    expect(phaseOf(state, SCRIPT, DEFAULT_CPS)).toBe("complete");
  });

  it("is complete at step 0 for a beat with zero characters", () => {
    const zeroBeat: Beat = { bg: "rooftop", actors: [], speaker: "MJ", lines: [] };
    expect(phaseOf(newPlayer(), [zeroBeat], DEFAULT_CPS)).toBe("complete");
  });

  it("is finished once the finished flag is set, regardless of beat index", () => {
    const state: PlayerState = { beat: 0, elapsedSteps: 0, finished: true };
    expect(phaseOf(state, SCRIPT, DEFAULT_CPS)).toBe("finished");
  });
});

describe("advance while typing", () => {
  it("completes the beat's line in place rather than skipping to the next beat", () => {
    const start = newPlayer();
    const next = advance(start, SCRIPT, DEFAULT_CPS);
    const total = beatCharCount(SCRIPT[0]);

    expect(next.beat).toBe(0);
    expect(phaseOf(next, SCRIPT, DEFAULT_CPS)).toBe("complete");
    expect(visibleCharsOf(next, SCRIPT, DEFAULT_CPS)).toBe(total);
  });
});

describe("advance while complete", () => {
  it("moves to the next beat with elapsedSteps reset to 0", () => {
    const total = beatCharCount(SCRIPT[0]);
    const complete = setStep(newPlayer(), stepsToComplete(total, DEFAULT_CPS));
    const next = advance(complete, SCRIPT, DEFAULT_CPS);

    expect(next).toEqual({ beat: 1, elapsedSteps: 0, finished: false });
  });

  it("finishes on advance from the last beat instead of overrunning the script", () => {
    const total = beatCharCount(SCRIPT[1]);
    const complete: PlayerState = {
      beat: 1,
      elapsedSteps: stepsToComplete(total, DEFAULT_CPS),
      finished: false,
    };
    const next = advance(complete, SCRIPT, DEFAULT_CPS);

    expect(next.finished).toBe(true);
    expect(phaseOf(next, SCRIPT, DEFAULT_CPS)).toBe("finished");
  });
});

describe("advance while finished", () => {
  it("returns the state unchanged", () => {
    const finished: PlayerState = { beat: 1, elapsedSteps: 0, finished: true };
    expect(advance(finished, SCRIPT, DEFAULT_CPS)).toEqual(finished);
  });
});

describe("visibleCharsOf", () => {
  it("is 0 once finished", () => {
    const finished: PlayerState = { beat: 1, elapsedSteps: 999, finished: true };
    expect(visibleCharsOf(finished, SCRIPT, DEFAULT_CPS)).toBe(0);
  });

  it("reflects the typewriter's progress through the current beat", () => {
    expect(visibleCharsOf(newPlayer(), SCRIPT, DEFAULT_CPS)).toBe(0);
    // SCRIPT[0] is "Hi" (2 chars) at DEFAULT_CPS 45: step 2 reveals exactly 1 character.
    expect(visibleCharsOf(setStep(newPlayer(), 2), SCRIPT, DEFAULT_CPS)).toBe(1);
  });
});
