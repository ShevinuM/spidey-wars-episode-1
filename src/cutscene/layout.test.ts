import { describe, expect, it } from "vitest";
import { flowRuns } from "./layout.ts";
import type { PlacedSegment, RunMetrics } from "./layout.ts";
import type { Run, RunStyle } from "./script.ts";

const CHAR_WIDTH = 10;
const LINE_HEIGHT: Record<RunStyle, number> = { body: 16, bold: 16, shout: 24, muted: 16 };

/** A trivially predictable fake measure: every character is CHAR_WIDTH wide, monospace. */
const fakeMetrics: RunMetrics = {
  width: (text) => text.length * CHAR_WIDTH,
  lineHeight: (style) => LINE_HEIGHT[style],
};

function run(text: string, style: RunStyle = "body"): Run {
  return { text, style };
}

function positions(segments: readonly PlacedSegment[]): Array<[string, number, number]> {
  return segments.map((s) => [s.text, s.x, s.y]);
}

describe("flowRuns wrapping", () => {
  it("returns nothing for an empty run list", () => {
    expect(flowRuns([], 1000, fakeMetrics)).toEqual([]);
  });

  it("keeps a row that exactly fits maxWidth on one line", () => {
    // "hello"=50, gap=10, "world"=50 -> row content is exactly 110 wide.
    const segments = flowRuns([run("hello world foo")], 110, fakeMetrics);
    expect(positions(segments)).toEqual([
      ["hello world", 0, 0],
      ["foo", 0, 16],
    ]);
  });

  it("wraps as soon as a row would exceed maxWidth by even one unit", () => {
    // At maxWidth=110 (the previous test) "hello world" shares row 0; dropping to 109
    // must push "world" (and the still-fitting "foo" after it) down to row 1.
    const segments = flowRuns([run("hello world foo")], 109, fakeMetrics);
    expect(positions(segments)).toEqual([
      ["hello", 0, 0],
      ["world foo", 0, 16],
    ]);
  });

  it("wraps each row independently once neither of the next two words fits alongside it", () => {
    const segments = flowRuns([run("hello world foo")], 55, fakeMetrics);
    expect(positions(segments)).toEqual([
      ["hello", 0, 0],
      ["world", 0, 16],
      ["foo", 0, 32],
    ]);
  });

  it("keeps a word split across two runs as one unbreakable segment pair", () => {
    const segments = flowRuns([run("lau"), run("gh.")], 1000, fakeMetrics);
    expect(segments).toEqual([
      { runIndex: 0, text: "lau", style: "body", x: 0, y: 0 },
      { runIndex: 1, text: "gh.", style: "body", x: 30, y: 0 },
    ]);
  });

  it("wraps a run-spanning word as one unit rather than splitting it mid-word", () => {
    // "hi"=20, gap=10, "lau"+"gh."=60 -> 20+10+60=90 would fit in isolation,
    // but forcing maxWidth=25 (less than "hi"+gap+"lau") must push the whole word down together.
    const segments = flowRuns([run("hi"), run(" lau"), run("gh.")], 25, fakeMetrics);
    expect(segments).toEqual([
      { runIndex: 0, text: "hi", style: "body", x: 0, y: 0 },
      { runIndex: 1, text: "lau", style: "body", x: 0, y: 16 },
      { runIndex: 2, text: "gh.", style: "body", x: 30, y: 16 },
    ]);
  });

  it("gives a single token wider than maxWidth its own row instead of looping forever", () => {
    const segments = flowRuns([run("hi"), run(" reallylongword")], 50, fakeMetrics);
    expect(positions(segments)).toEqual([
      ["hi", 0, 0],
      ["reallylongword", 0, 16],
    ]);
  });

  it("sizes a row's height by the tallest style it contains", () => {
    const segments = flowRuns(
      [run("AB", "body"), run(" CD", "shout"), run(" EF", "body")],
      60,
      fakeMetrics,
    );
    // Row 0 ("AB CD", width 50) mixes body (16) and shout (24) -> row height 24,
    // so row 1 ("EF", pushed past maxWidth=60) starts at y=24, not y=16.
    expect(positions(segments)).toEqual([
      ["AB", 0, 0],
      ["CD", 30, 0],
      ["EF", 0, 24],
    ]);
  });

  it("treats an empty run's text as contributing nothing", () => {
    const segments = flowRuns([run(""), run("hi")], 1000, fakeMetrics);
    expect(positions(segments)).toEqual([["hi", 0, 0]]);
  });
});
