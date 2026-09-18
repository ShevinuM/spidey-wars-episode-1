import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import opentype from "opentype.js";
import {
  contourBounds,
  flattenPath,
  isInsideEvenOdd,
  rasterizeContours,
  rasterizeGlyph,
  transformContours,
  type PathCommand,
  type PathPoint,
} from "./rasterize-glyph.ts";

const NOTCHED_SQUARE: readonly PathCommand[] = [
  { type: "M", x: 0, y: 0 },
  { type: "L", x: 4, y: 0 },
  { type: "L", x: 4, y: 4 },
  { type: "L", x: 2, y: 4 },
  { type: "L", x: 2, y: 2 },
  { type: "L", x: 0, y: 2 },
];

describe("flattenPath", () => {
  it("starts a new contour at every M and closes each implicitly", () => {
    const contours = flattenPath([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 1, y: 0 },
      { type: "L", x: 1, y: 1 },
      { type: "M", x: 5, y: 5 },
      { type: "L", x: 6, y: 5 },
    ]);
    expect(contours).toEqual([
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
      ],
    ]);
  });

  it("returns no contours for an empty path", () => {
    expect(flattenPath([])).toEqual([]);
  });

  it("treats a trailing Z as a no-op — the contour is already implicitly closed", () => {
    const contours = flattenPath([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 1, y: 0 },
      { type: "Z" },
    ]);
    expect(contours).toEqual([
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    ]);
  });

  it("flattens a quadratic curve into line segments", () => {
    const contours = flattenPath([
      { type: "M", x: 0, y: 0 },
      { type: "Q", x1: 5, y1: 10, x: 10, y: 0 },
    ]);
    expect(contours).toHaveLength(1);
    // 8 subdivisions plus the initial M point.
    expect(contours[0]).toHaveLength(9);
    const last = contours[0]![8]!;
    expect(last.x).toBeCloseTo(10);
    expect(last.y).toBeCloseTo(0);
  });

  it("flattens a cubic curve into line segments", () => {
    const contours = flattenPath([
      { type: "M", x: 0, y: 0 },
      { type: "C", x1: 0, y1: 10, x2: 10, y2: 10, x: 10, y: 0 },
    ]);
    expect(contours).toHaveLength(1);
    expect(contours[0]).toHaveLength(9);
    const last = contours[0]![8]!;
    expect(last.x).toBeCloseTo(10);
    expect(last.y).toBeCloseTo(0);
  });
});

describe("transformContours", () => {
  it("scales and translates without flipping either axis", () => {
    const result = transformContours([[{ x: 1, y: 2 }]], 2, 10, -5);
    expect(result).toEqual([[{ x: 12, y: -1 }]]);
  });
});

describe("contourBounds", () => {
  it("returns undefined for no contours", () => {
    expect(contourBounds([])).toBeUndefined();
  });

  it("returns the bounding box across all contours", () => {
    // The trailing (2, 1) extends none of the four extremes, so every
    // comparison in contourBounds sees both a triggering and a non-triggering case.
    const bounds = contourBounds([
      [
        { x: 0, y: 0 },
        { x: 4, y: 2 },
      ],
      [
        { x: -1, y: 5 },
        { x: 2, y: 1 },
      ],
    ]);
    expect(bounds).toEqual({ minX: -1, minY: 0, maxX: 4, maxY: 5 });
  });
});

describe("isInsideEvenOdd", () => {
  const square: PathPoint[] = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ];

  it("is true for a point inside a simple square", () => {
    expect(isInsideEvenOdd([square], 2, 2)).toBe(true);
  });

  it("is false for a point outside a simple square", () => {
    expect(isInsideEvenOdd([square], 5, 5)).toBe(false);
  });

  it("is false with no contours", () => {
    expect(isInsideEvenOdd([], 2, 2)).toBe(false);
  });
});

describe("rasterizeContours", () => {
  it("rasterizes a plain rectilinear square fully filled", () => {
    const contours = flattenPath([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 4, y: 0 },
      { type: "L", x: 4, y: 4 },
      { type: "L", x: 0, y: 4 },
    ]);
    const pixels = rasterizeContours(contours, 4, 4);
    expect(Array.from(pixels)).toEqual(Array.from<number>({ length: 16 }).fill(255));
  });

  it("rasterizes a notched rectilinear polygon with the notch left empty", () => {
    const contours = flattenPath(NOTCHED_SQUARE);
    const pixels = rasterizeContours(contours, 4, 4);
    // Row-major 4x4 grid, row index = increasing y (no flip): the polygon is
    // full width for y 0-2, then only its right half for y 2-4.
    // prettier-ignore
    const expected = [
      255, 255, 255, 255,
      255, 255, 255, 255,
      0,   0,   255, 255,
      0,   0,   255, 255,
    ];
    expect(Array.from(pixels)).toEqual(expected);
  });
});

describe("rasterizeGlyph — Press Start 2P pinned bitmaps", () => {
  const font = opentype.parse(
    readFileSync(new URL("../../assets/fonts/PressStart2P-Regular.ttf", import.meta.url)),
  );
  const scale = 8 / font.unitsPerEm;

  it("pins the 'A' glyph at size 8 as an exact 8x8 bitmap", () => {
    const glyph = font.charToGlyph("A");
    const commands = glyph.getPath(0, 0, font.unitsPerEm).commands as PathCommand[];
    const pixels = rasterizeGlyph(commands, scale, 0, 8, 8, 8);
    // prettier-ignore
    const expected = [
      "..###...",
      ".##.##..",
      "##...##.",
      "##...##.",
      "#######.",
      "##...##.",
      "##...##.",
      "........",
    ];
    const flat = expected.flatMap((row) => Array.from(row, (ch) => (ch === "#" ? 255 : 0)));
    expect(Array.from(pixels)).toEqual(flat);
  });
});
