import { describe, expect, it } from "vitest";
import { beatCharCount } from "./script.ts";
import type { Beat } from "./script.ts";

describe("beatCharCount", () => {
  it("sums run text length across every line in order", () => {
    const beat: Beat = {
      bg: "rooftop",
      actors: [],
      speaker: "SPIDEY",
      lines: [
        {
          runs: [
            { text: "Hey", style: "body" },
            { text: " you!", style: "shout" },
          ],
        },
        { runs: [{ text: " Ready?", style: "body" }] },
      ],
    };
    expect(beatCharCount(beat)).toBe(3 + 5 + 7);
  });

  it("is zero for a beat with no lines", () => {
    const beat: Beat = { bg: "rooftop", actors: [], speaker: "MJ", lines: [] };
    expect(beatCharCount(beat)).toBe(0);
  });

  it("is zero for a beat whose lines contain no runs", () => {
    const beat: Beat = { bg: "rooftop", actors: [], speaker: "GOBLIN", lines: [{ runs: [] }] };
    expect(beatCharCount(beat)).toBe(0);
  });
});
