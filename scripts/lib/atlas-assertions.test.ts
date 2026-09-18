import { describe, expect, it } from "vitest";
import {
  assertFrameCount,
  assertInBounds,
  assertNoOverlap,
  type AtlasRect,
} from "./atlas-assertions.ts";

describe("assertNoOverlap", () => {
  it("passes when no two rects intersect", () => {
    const rects: AtlasRect[] = [
      { name: "a", x: 0, y: 0, w: 4, h: 4 },
      { name: "b", x: 4, y: 0, w: 4, h: 4 },
    ];
    expect(() => assertNoOverlap(rects)).not.toThrow();
  });

  it("throws naming every overlapping pair", () => {
    const rects: AtlasRect[] = [
      { name: "a", x: 0, y: 0, w: 4, h: 4 },
      { name: "b", x: 2, y: 2, w: 4, h: 4 },
      { name: "c", x: 100, y: 100, w: 2, h: 2 },
    ];
    expect(() => assertNoOverlap(rects)).toThrow("overlapping atlas frames: a×b");
  });
});

describe("assertInBounds", () => {
  it("passes when every rect fits within the sheet", () => {
    const rects: AtlasRect[] = [
      { name: "a", x: 0, y: 0, w: 4, h: 4 },
      { name: "b", x: 4, y: 4, w: 2, h: 2 },
    ];
    expect(() => assertInBounds(rects, 10, 10)).not.toThrow();
  });

  it("throws naming every rect that exceeds the sheet bounds", () => {
    const rects: AtlasRect[] = [
      { name: "a", x: 0, y: 0, w: 4, h: 4 },
      { name: "b", x: 8, y: 0, w: 4, h: 4 },
      { name: "c", x: -1, y: 0, w: 2, h: 2 },
    ];
    expect(() => assertInBounds(rects, 10, 10)).toThrow("atlas frames out of 10x10 bounds: b, c");
  });
});

describe("assertFrameCount", () => {
  it("passes when the count matches", () => {
    expect(() => assertFrameCount(["a", "b"], 2)).not.toThrow();
  });

  it("throws naming the actual frames when the count does not match", () => {
    expect(() => assertFrameCount(["a", "b", "c"], 2)).toThrow(
      "expected 2 atlas frames, got 3: a, b, c",
    );
  });
});
