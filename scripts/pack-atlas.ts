import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { shelfPack, type ShelfPackItem } from "./lib/shelf-pack.ts";
import {
  assertFrameCount,
  assertInBounds,
  assertNoOverlap,
  type AtlasRect,
} from "./lib/atlas-assertions.ts";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPRITES_SRC_DIR = join(ROOT_DIR, "assets/sprites");
const SPRITES_OUT_DIR = join(ROOT_DIR, "public/sprites");
const SHEET_WIDTH = 1024;
const SHEET_PADDING = 2;
const EXPECTED_FRAME_COUNT = 14;

interface SourceSprite {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly data: Buffer;
}

function listSpriteFiles(): string[] {
  return readdirSync(SPRITES_SRC_DIR)
    .filter((f) => f.endsWith(".png"))
    .filter((f) => f !== "_sheet.png" && !f.endsWith("-zoom.png"))
    .sort();
}

async function loadSprite(file: string): Promise<SourceSprite> {
  const name = basename(file, extname(file));
  const { data, info } = await sharp(join(SPRITES_SRC_DIR, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { name, width: info.width, height: info.height, data };
}

function blitSprite(
  rgba: Buffer,
  sheetWidth: number,
  x: number,
  y: number,
  sprite: SourceSprite,
): void {
  const rowBytes = sprite.width * 4;
  for (let row = 0; row < sprite.height; row += 1) {
    const srcStart = row * rowBytes;
    const destStart = ((y + row) * sheetWidth + x) * 4;
    sprite.data.copy(rgba, destStart, srcStart, srcStart + rowBytes);
  }
}

interface AtlasFrame {
  readonly frame: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  };
  readonly rotated: false;
  readonly trimmed: false;
  readonly spriteSourceSize: {
    readonly x: number;
    readonly y: number;
    readonly w: number;
    readonly h: number;
  };
  readonly sourceSize: { readonly w: number; readonly h: number };
}

function buildAtlasJson(rects: readonly AtlasRect[]): {
  frames: Record<string, AtlasFrame>;
  meta: { scale: string };
} {
  const frames: Record<string, AtlasFrame> = {};
  for (const r of rects) {
    frames[r.name] = {
      frame: { x: r.x, y: r.y, w: r.w, h: r.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: r.w, h: r.h },
      sourceSize: { w: r.w, h: r.h },
    };
  }
  return { frames, meta: { scale: "1" } };
}

async function main(): Promise<void> {
  const files = listSpriteFiles();
  assertFrameCount(files, EXPECTED_FRAME_COUNT);

  const sprites = await Promise.all(files.map(loadSprite));
  const items: ShelfPackItem[] = sprites.map((s) => ({
    id: s.name,
    width: s.width,
    height: s.height,
  }));
  const packed = shelfPack(items, { width: SHEET_WIDTH, padding: SHEET_PADDING });

  const rects: AtlasRect[] = packed.rects.map((r) => ({
    name: r.id,
    x: r.x,
    y: r.y,
    w: r.width,
    h: r.height,
  }));
  assertNoOverlap(rects);
  assertInBounds(rects, packed.width, packed.height);

  const spriteByName = new Map(sprites.map((s) => [s.name, s]));
  const rgba = Buffer.alloc(packed.width * packed.height * 4, 0);
  for (const rect of rects) {
    blitSprite(rgba, packed.width, rect.x, rect.y, spriteByName.get(rect.name)!);
  }

  mkdirSync(SPRITES_OUT_DIR, { recursive: true });
  await sharp(rgba, { raw: { width: packed.width, height: packed.height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(join(SPRITES_OUT_DIR, "atlas.png"));

  const json = buildAtlasJson(rects);
  writeFileSync(join(SPRITES_OUT_DIR, "atlas.json"), JSON.stringify(json, null, 2) + "\n");

  console.log(
    `wrote atlas.png / atlas.json (${packed.width}x${packed.height}, ${rects.length} frames)`,
  );
}

await main();
