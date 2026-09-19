import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import opentype, { type OpenTypeFont } from "opentype.js";
import {
  assertMonospaceAdvances,
  buildBmFontXml,
  findMissingGlyphs,
  type BmFontChar,
} from "./bmfont-xml.ts";
import { buildCharset, hasVisibleGlyph } from "./charset.ts";

function loadFont(fileName: string): OpenTypeFont {
  return opentype.parse(readFileSync(new URL(`../../assets/fonts/${fileName}`, import.meta.url)));
}

describe("buildBmFontXml", () => {
  const chars: BmFontChar[] = [
    { id: 65, x: 0, y: 0, width: 7, height: 7, xoffset: 0, yoffset: 1, xadvance: 8 },
    { id: 66, x: 8, y: 0, width: 6, height: 7, xoffset: 0, yoffset: 1, xadvance: 8 },
  ];

  it("produces valid BMFont XML with the exact required shape", () => {
    const xml = buildBmFontXml({
      info: { face: "Press Start 2P", size: 8 },
      common: { lineHeight: 8, base: 8, scaleW: 32, scaleH: 16 },
      pageFile: "pressstart-8.png",
      chars,
    });
    expect(xml).toContain('<?xml version="1.0"?>');
    expect(xml).toContain('<info face="Press Start 2P" size="8"/>');
    expect(xml).toContain('<common lineHeight="8" base="8" scaleW="32" scaleH="16" pages="1"/>');
    expect(xml).toContain('<page id="0" file="pressstart-8.png"/>');
    expect(xml).toContain('<chars count="2">');
    expect(xml).toContain(
      '<char id="65" x="0" y="0" width="7" height="7" xoffset="0" yoffset="1" xadvance="8" page="0" chnl="15"/>',
    );
  });

  it("escapes XML-significant characters in the face and page file", () => {
    const xml = buildBmFontXml({
      info: { face: `Font "Quoted" & <Tagged>`, size: 8 },
      common: { lineHeight: 8, base: 8, scaleW: 32, scaleH: 16 },
      pageFile: "a&b.png",
      chars: [],
    });
    expect(xml).toContain("Font &quot;Quoted&quot; &amp; &lt;Tagged&gt;");
    expect(xml).toContain('file="a&amp;b.png"');
    expect(xml).toContain('<chars count="0">');
  });
});

describe("assertMonospaceAdvances", () => {
  it("does not throw when every xadvance matches", () => {
    const chars: BmFontChar[] = [
      { id: 65, x: 0, y: 0, width: 7, height: 7, xoffset: 0, yoffset: 1, xadvance: 8 },
      { id: 66, x: 8, y: 0, width: 6, height: 7, xoffset: 0, yoffset: 1, xadvance: 8 },
    ];
    expect(() => assertMonospaceAdvances(chars, 8)).not.toThrow();
  });

  it("throws naming the offending chars when an xadvance is non-monospace", () => {
    const chars: BmFontChar[] = [
      { id: 65, x: 0, y: 0, width: 7, height: 7, xoffset: 0, yoffset: 1, xadvance: 8 },
      { id: 66, x: 8, y: 0, width: 6, height: 7, xoffset: 0, yoffset: 1, xadvance: 9 },
    ];
    expect(() => assertMonospaceAdvances(chars, 8)).toThrow(/monospace violation.*B\(9\)/);
  });
});

describe("findMissingGlyphs", () => {
  it("returns the chars for which hasGlyph is false", () => {
    const missing = findMissingGlyphs(["a", "b", "c"], (ch) => ch !== "b");
    expect(missing).toEqual(["b"]);
  });

  it("returns an empty list when every char has a glyph", () => {
    expect(findMissingGlyphs(["a", "b"], () => true)).toEqual([]);
  });

  // Pinned against the real committed font files so a silent change in glyph
  // coverage (e.g. a font upgrade) is caught instead of passing unnoticed.
  it.each([
    ["PressStart2P-Regular.ttf", ["◼"]],
    ["Silkscreen-Regular.ttf", ["◼", "▼", "▶"]],
    ["Silkscreen-Bold.ttf", ["◼", "▼", "▶"]],
  ])("pins the missing-glyph list for %s", (fileName, expected) => {
    const font = loadFont(fileName);
    const missing = findMissingGlyphs(buildCharset(), (ch) => hasVisibleGlyph(font, ch));
    expect(missing).toEqual(expected);
  });
});
