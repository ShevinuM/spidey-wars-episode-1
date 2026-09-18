import { describe, expect, it } from "vitest";
import type { OpenTypeFont, OpenTypePathCommand } from "opentype.js";
import { buildCharset, hasVisibleGlyph } from "./charset.ts";

function fakeFont(glyphs: ReadonlyMap<string, readonly OpenTypePathCommand[]>): OpenTypeFont {
  return {
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    hasChar: (char) => glyphs.has(char),
    charToGlyph: (char) => ({
      advanceWidth: 500,
      getPath: () => ({ commands: [...(glyphs.get(char) ?? [])] }),
    }),
  };
}

describe("buildCharset", () => {
  it("spans printable ASCII 32-126 followed by the extra glyphs", () => {
    const charset = buildCharset();
    expect(charset[0]).toBe(" ");
    expect(charset[94]).toBe("~");
    expect(charset.slice(95)).toEqual(["◼", "▼", "▶", "—", "…", "×"]);
    expect(charset).toHaveLength(95 + 6);
  });
});

describe("hasVisibleGlyph", () => {
  const outline: OpenTypePathCommand = { type: "L", x: 10, y: 10 };

  it("is false when the font has no glyph for the char", () => {
    const font = fakeFont(new Map());
    expect(hasVisibleGlyph(font, "A")).toBe(false);
  });

  it("is true for a space even though it draws no outline", () => {
    const font = fakeFont(new Map([[" ", []]]));
    expect(hasVisibleGlyph(font, " ")).toBe(true);
  });

  it("is false for a non-space char whose glyph outline is empty", () => {
    const font = fakeFont(new Map([["◼", []]]));
    expect(hasVisibleGlyph(font, "◼")).toBe(false);
  });

  it("is true for a non-space char whose glyph outline draws ink", () => {
    const font = fakeFont(new Map([["A", [outline]]]));
    expect(hasVisibleGlyph(font, "A")).toBe(true);
  });
});
