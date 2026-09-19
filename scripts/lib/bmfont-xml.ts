export interface BmFontInfo {
  readonly face: string;
  readonly size: number;
}

export interface BmFontCommon {
  readonly lineHeight: number;
  readonly base: number;
  readonly scaleW: number;
  readonly scaleH: number;
}

export interface BmFontChar {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly xoffset: number;
  readonly yoffset: number;
  readonly xadvance: number;
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Builds a BMFont XML document — Phaser's `load.bitmapFont` loader rejects any other format (`tech-stack/phaser.md` R004). */
export function buildBmFontXml(params: {
  readonly info: BmFontInfo;
  readonly common: BmFontCommon;
  readonly pageFile: string;
  readonly chars: readonly BmFontChar[];
}): string {
  const { info, common, pageFile, chars } = params;
  const charLines = chars
    .map(
      (c) =>
        `    <char id="${c.id}" x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" xoffset="${c.xoffset}" yoffset="${c.yoffset}" xadvance="${c.xadvance}" page="0" chnl="15"/>`,
    )
    .join("\n");
  return [
    '<?xml version="1.0"?>',
    "<font>",
    `  <info face="${escapeXmlAttr(info.face)}" size="${info.size}"/>`,
    `  <common lineHeight="${common.lineHeight}" base="${common.base}" scaleW="${common.scaleW}" scaleH="${common.scaleH}" pages="1"/>`,
    "  <pages>",
    `    <page id="0" file="${escapeXmlAttr(pageFile)}"/>`,
    "  </pages>",
    `  <chars count="${chars.length}">`,
    charLines,
    "  </chars>",
    "</font>",
    "",
  ].join("\n");
}

/** Throws if any char's `xadvance` differs from `expectedAdvance` — the monospace invariant Press Start 2P must hold at every size. */
export function assertMonospaceAdvances(
  chars: readonly BmFontChar[],
  expectedAdvance: number,
): void {
  const offenders = chars.filter((c) => c.xadvance !== expectedAdvance);
  if (offenders.length > 0) {
    const list = offenders.map((c) => `${String.fromCharCode(c.id)}(${c.xadvance})`).join(", ");
    throw new Error(`monospace violation: expected xadvance ${expectedAdvance}, got ${list}`);
  }
}

/** Returns the subset of `charset` for which `hasGlyph` is false — the per-font missing-glyph list a caller should warn about and omit. */
export function findMissingGlyphs(
  charset: readonly string[],
  hasGlyph: (char: string) => boolean,
): string[] {
  return charset.filter((ch) => !hasGlyph(ch));
}
