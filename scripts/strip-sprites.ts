import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPRITES_DIR = join(ROOT_DIR, "assets/sprites");

async function decodeRaw(buffer: Buffer): Promise<Buffer> {
  return (await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;
}

async function stripSprite(file: string): Promise<void> {
  const path = join(SPRITES_DIR, file);
  const original = readFileSync(path);
  const originalRaw = await decodeRaw(original);

  const restripped = await sharp(original)
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
  const restrippedRaw = await decodeRaw(restripped);

  if (!originalRaw.equals(restrippedRaw)) {
    throw new Error(`pixel mismatch stripping ${file}: re-encode changed pixel data`);
  }

  writeFileSync(path, restripped);
  const changed = !original.equals(restripped);
  console.log(
    `${file}: ${changed ? "stripped" : "unchanged"} (${original.length} -> ${restripped.length} bytes, pixel-identical)`,
  );
}

async function main(): Promise<void> {
  const files = readdirSync(SPRITES_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort();
  for (const file of files) {
    await stripSprite(file);
  }
}

await main();
