import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import opentype, { type OpenTypeFont } from "opentype.js";
import {
  contourBounds,
  flattenPath,
  rasterizeGlyph,
  type PathCommand,
} from "./lib/rasterize-glyph.ts";
import { shelfPack, type ShelfPackItem } from "./lib/shelf-pack.ts";
import {
  assertMonospaceAdvances,
  buildBmFontXml,
  findMissingGlyphs,
  type BmFontChar,
} from "./lib/bmfont-xml.ts";
import { buildCharset, hasVisibleGlyph } from "./lib/charset.ts";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONTS_SRC_DIR = join(ROOT_DIR, "assets/fonts");
const FONTS_OUT_DIR = join(ROOT_DIR, "public/fonts");
const SHEET_PADDING = 1;

const CHARSET = buildCharset();

interface FontSpec {
  readonly key: string;
  readonly file: string;
  readonly face: string;
  readonly sizes: readonly number[];
  readonly monospace: boolean;
}

const FONT_SPECS: readonly FontSpec[] = [
  {
    key: "pressstart",
    file: "PressStart2P-Regular.ttf",
    face: "Press Start 2P",
    sizes: [8, 16, 24],
    monospace: true,
  },
  {
    key: "silkscreen",
    file: "Silkscreen-Regular.ttf",
    face: "Silkscreen",
    sizes: [8, 16],
    monospace: false,
  },
  {
    key: "silkscreen-bold",
    file: "Silkscreen-Bold.ttf",
    face: "Silkscreen Bold",
    sizes: [16],
    monospace: false,
  },
];

interface GlyphRecord {
  readonly width: number;
  readonly height: number;
  readonly xoffset: number;
  readonly yoffset: number;
  readonly xadvance: number;
  readonly bitmap: Uint8Array;
}

function buildGlyphRecord(
  commands: readonly PathCommand[],
  scale: number,
  base: number,
  xadvance: number,
): GlyphRecord | undefined {
  const bounds = contourBounds(flattenPath(commands));
  if (!bounds) return undefined;
  const x0 = Math.ceil(bounds.minX * scale - 0.5);
  const x1 = Math.floor(bounds.maxX * scale - 0.5);
  const y0 = Math.ceil(bounds.minY * scale - 0.5);
  const y1 = Math.floor(bounds.maxY * scale - 0.5);
  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  const bitmap = rasterizeGlyph(commands, scale, -x0, -y0, width, height);
  return { width, height, xoffset: x0, yoffset: base + y0, xadvance, bitmap };
}

function blitGlyph(
  rgba: Buffer,
  sheetWidth: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
  bitmap: Uint8Array,
): void {
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const alpha = bitmap[y * w + x]!;
      const idx = ((oy + y) * sheetWidth + (ox + x)) * 4;
      rgba[idx] = 255;
      rgba[idx + 1] = 255;
      rgba[idx + 2] = 255;
      rgba[idx + 3] = alpha;
    }
  }
}

async function generateFontSheet(
  spec: FontSpec,
  font: OpenTypeFont,
  size: number,
  presentChars: readonly string[],
): Promise<void> {
  const scale = size / font.unitsPerEm;
  const base = Math.round(font.ascender * scale);
  const lineHeight = Math.round((font.ascender - font.descender) * scale);

  const bmChars: BmFontChar[] = [];
  const packItems: ShelfPackItem[] = [];
  const glyphByCode = new Map<number, GlyphRecord>();

  for (const ch of presentChars) {
    const code = ch.codePointAt(0)!;
    const glyph = font.charToGlyph(ch);
    const xadvance = Math.round(glyph.advanceWidth * scale);
    const commands = glyph.getPath(0, 0, font.unitsPerEm).commands as PathCommand[];
    const record = buildGlyphRecord(commands, scale, base, xadvance);

    if (!record) {
      // A char with no visible outline (space) still needs a zero-size entry.
      bmChars.push({ id: code, x: 0, y: 0, width: 0, height: 0, xoffset: 0, yoffset: 0, xadvance });
      continue;
    }

    glyphByCode.set(code, record);
    packItems.push({ id: String(code), width: record.width, height: record.height });
  }

  const totalArea = packItems.reduce(
    (sum, it) => sum + (it.width + SHEET_PADDING) * (it.height + SHEET_PADDING),
    0,
  );
  const maxItemWidth = packItems.reduce((max, it) => Math.max(max, it.width), 0);
  const targetWidth = Math.max(maxItemWidth, Math.ceil(Math.sqrt(totalArea) / 8) * 8, 8);
  const packed = shelfPack(packItems, { width: targetWidth, padding: SHEET_PADDING });
  const rectByCode = new Map(packed.rects.map((r) => [Number(r.id), r]));

  const rgba = Buffer.alloc(packed.width * packed.height * 4, 0);
  for (const [code, record] of glyphByCode) {
    const rect = rectByCode.get(code)!;
    blitGlyph(rgba, packed.width, rect.x, rect.y, record.width, record.height, record.bitmap);
    bmChars.push({
      id: code,
      x: rect.x,
      y: rect.y,
      width: record.width,
      height: record.height,
      xoffset: record.xoffset,
      yoffset: record.yoffset,
      xadvance: record.xadvance,
    });
  }
  bmChars.sort((a, b) => a.id - b.id);

  if (spec.monospace) assertMonospaceAdvances(bmChars, size);

  const key = `${spec.key}-${size}`;
  mkdirSync(FONTS_OUT_DIR, { recursive: true });
  await sharp(rgba, { raw: { width: packed.width, height: packed.height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(join(FONTS_OUT_DIR, `${key}.png`));

  const xml = buildBmFontXml({
    info: { face: spec.face, size },
    common: { lineHeight, base, scaleW: packed.width, scaleH: packed.height },
    pageFile: `${key}.png`,
    chars: bmChars,
  });
  writeFileSync(join(FONTS_OUT_DIR, `${key}.xml`), xml);
  console.log(
    `wrote ${key}.png / ${key}.xml (${packed.width}x${packed.height}, ${bmChars.length} chars)`,
  );
}

async function main(): Promise<void> {
  for (const spec of FONT_SPECS) {
    const buffer = readFileSync(join(FONTS_SRC_DIR, spec.file));
    const font = opentype.parse(buffer);
    const missing = findMissingGlyphs(CHARSET, (ch) => hasVisibleGlyph(font, ch));
    const presentChars = CHARSET.filter((ch) => hasVisibleGlyph(font, ch));

    for (const size of spec.sizes) {
      await generateFontSheet(spec, font, size, presentChars);
    }

    if (missing.length > 0) {
      console.warn(`missing in ${spec.key}: ${missing.join(" ")}`);
    }
  }
}

await main();
