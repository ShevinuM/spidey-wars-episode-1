/** A point in whatever coordinate space its containing contour is currently expressed in. */
export interface PathPoint {
  readonly x: number;
  readonly y: number;
}

export type PathCommand =
  | { readonly type: "M"; readonly x: number; readonly y: number }
  | { readonly type: "L"; readonly x: number; readonly y: number }
  | {
      readonly type: "Q";
      readonly x1: number;
      readonly y1: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "C";
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly x: number;
      readonly y: number;
    }
  | { readonly type: "Z" };

const CURVE_STEPS = 8;

function quadraticPoint(p0: PathPoint, p1: PathPoint, p2: PathPoint, t: number): PathPoint {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function cubicPoint(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  t: number,
): PathPoint {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

/**
 * Splits a glyph path into closed contours, flattening any quadratic/cubic segment into line segments.
 *
 * A new contour starts at every `M`; `Z` is never emitted by opentype.js for
 * a fill-only path, so contour boundaries come from `M` alone, and every
 * contour is treated as implicitly closed back to its first point.
 */
export function flattenPath(commands: readonly PathCommand[]): PathPoint[][] {
  const contours: PathPoint[][] = [];
  let current: PathPoint[] = [];
  let cursor: PathPoint = { x: 0, y: 0 };

  for (const cmd of commands) {
    if (cmd.type === "M") {
      if (current.length > 0) contours.push(current);
      current = [{ x: cmd.x, y: cmd.y }];
      cursor = { x: cmd.x, y: cmd.y };
    } else if (cmd.type === "L") {
      current.push({ x: cmd.x, y: cmd.y });
      cursor = { x: cmd.x, y: cmd.y };
    } else if (cmd.type === "Q") {
      const p1 = { x: cmd.x1, y: cmd.y1 };
      const p2 = { x: cmd.x, y: cmd.y };
      for (let i = 1; i <= CURVE_STEPS; i += 1) {
        current.push(quadraticPoint(cursor, p1, p2, i / CURVE_STEPS));
      }
      cursor = p2;
    } else if (cmd.type === "C") {
      const p1 = { x: cmd.x1, y: cmd.y1 };
      const p2 = { x: cmd.x2, y: cmd.y2 };
      const p3 = { x: cmd.x, y: cmd.y };
      for (let i = 1; i <= CURVE_STEPS; i += 1) {
        current.push(cubicPoint(cursor, p1, p2, p3, i / CURVE_STEPS));
      }
      cursor = p3;
    }
  }
  if (current.length > 0) contours.push(current);
  return contours;
}

/** Scales and translates flattened contours — a pure affine transform, no axis flip (opentype.js's `getPath` already negates Y). */
export function transformContours(
  contours: readonly PathPoint[][],
  scale: number,
  offsetX: number,
  offsetY: number,
): PathPoint[][] {
  return contours.map((contour) =>
    contour.map((p) => ({ x: p.x * scale + offsetX, y: p.y * scale + offsetY })),
  );
}

export interface ContourBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** The bounding box of a set of contours, or `undefined` for an empty glyph (e.g. space). */
export function contourBounds(contours: readonly PathPoint[][]): ContourBounds | undefined {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const contour of contours) {
    for (const p of contour) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return minX === Infinity ? undefined : { minX, minY, maxX, maxY };
}

/** Even-odd point-in-polygon test against a set of closed contours, sampling exactly at `(x, y)`. */
export function isInsideEvenOdd(contours: readonly PathPoint[][], x: number, y: number): boolean {
  let inside = false;
  for (const contour of contours) {
    const n = contour.length;
    for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
      const pi = contour[i]!;
      const pj = contour[j]!;
      const crosses = pi.y > y !== pj.y > y;
      if (crosses && x < pi.x + ((y - pi.y) * (pj.x - pi.x)) / (pj.y - pi.y)) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/** Rasterizes closed contours to a `width`×`height` alpha bitmap (0 or 255), sampling each pixel cell's centre. */
export function rasterizeContours(
  contours: readonly PathPoint[][],
  width: number,
  height: number,
): Uint8Array {
  const pixels = new Uint8Array(width * height);
  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      if (isInsideEvenOdd(contours, px + 0.5, py + 0.5)) {
        pixels[py * width + px] = 255;
      }
    }
  }
  return pixels;
}

/** Flattens, scales, translates and rasterizes a glyph path in one call — the entry point `gen-bitmap-fonts.ts` uses per glyph. */
export function rasterizeGlyph(
  commands: readonly PathCommand[],
  scale: number,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): Uint8Array {
  return rasterizeContours(
    transformContours(flattenPath(commands), scale, offsetX, offsetY),
    width,
    height,
  );
}
