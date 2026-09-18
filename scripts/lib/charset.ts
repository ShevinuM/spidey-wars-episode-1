import type { OpenTypeFont } from "opentype.js";

const EXTRA_CHARS: readonly string[] = ["◼", "▼", "▶", "—", "…", "×"];

function buildPrintableAscii(): string[] {
  const ascii: string[] = [];
  for (let code = 32; code <= 126; code += 1) ascii.push(String.fromCharCode(code));
  return ascii;
}

/** The full charset the bitmap-font generator rasterizes: printable ASCII (32–126) plus the extra glyphs the UI draws outside that range. */
export function buildCharset(): string[] {
  return [...buildPrintableAscii(), ...EXTRA_CHARS];
}

/** True when `ch` has a glyph in `font` that actually draws ink — space counts as present despite drawing nothing, and any other char whose outline is empty counts as missing. */
export function hasVisibleGlyph(font: OpenTypeFont, ch: string): boolean {
  if (!font.hasChar(ch)) return false;
  if (ch === " ") return true;
  return font.charToGlyph(ch).getPath(0, 0, font.unitsPerEm).commands.length > 0;
}
