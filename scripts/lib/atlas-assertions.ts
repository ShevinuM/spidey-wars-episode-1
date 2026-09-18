export interface AtlasRect {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

function rectsOverlap(a: AtlasRect, b: AtlasRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Throws listing every pair of rects whose bounds intersect — the shelf packer should never produce one. */
export function assertNoOverlap(rects: readonly AtlasRect[]): void {
  const offenders: string[] = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      if (rectsOverlap(rects[i]!, rects[j]!)) {
        offenders.push(`${rects[i]!.name}×${rects[j]!.name}`);
      }
    }
  }
  if (offenders.length > 0) {
    throw new Error(`overlapping atlas frames: ${offenders.join(", ")}`);
  }
}

/** Throws listing every rect whose bounds fall outside `0..width` × `0..height`. */
export function assertInBounds(rects: readonly AtlasRect[], width: number, height: number): void {
  const offenders = rects
    .filter((r) => r.x < 0 || r.y < 0 || r.x + r.w > width || r.y + r.h > height)
    .map((r) => r.name);
  if (offenders.length > 0) {
    throw new Error(`atlas frames out of ${width}x${height} bounds: ${offenders.join(", ")}`);
  }
}

/** Throws when `names.length` does not equal `expected` — pins the atlas frame count so a source-sprite addition or removal is caught rather than silently repacked. */
export function assertFrameCount(names: readonly string[], expected: number): void {
  if (names.length !== expected) {
    throw new Error(`expected ${expected} atlas frames, got ${names.length}: ${names.join(", ")}`);
  }
}
