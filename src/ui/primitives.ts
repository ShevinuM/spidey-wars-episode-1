import type Phaser from "phaser";

/** A single stop in a top-to-bottom vertical gradient, packed RGB at `stop` in [0, 1]. */
export interface GradientStop {
  readonly stop: number;
  readonly color: number;
}

interface PlaqueStyle {
  readonly cut: number;
  readonly innerCut: number;
  readonly border: number;
  readonly borderColor: number;
  readonly fillColor: number;
}

interface BevelStyle {
  readonly fillColor: number;
  readonly outlineColor: number;
  readonly highlightColor: number;
  readonly shadowColor: number;
  readonly outlineWidth: number;
  readonly bevelWidth: number;
}

interface FacadeStyle {
  readonly baseColor: number;
  readonly windowColor: number;
  readonly windowW: number;
  readonly windowH: number;
  readonly gapX: number;
  readonly gapY: number;
}

/** The eight corners of a `w`×`h` box with each corner cut back by `cut` px, clockwise from top-left. */
function octagonPoints(
  x: number,
  y: number,
  w: number,
  h: number,
  cut: number,
): ReadonlyArray<readonly [number, number]> {
  return [
    [x + cut, y],
    [x + w - cut, y],
    [x + w, y + cut],
    [x + w, y + h - cut],
    [x + w - cut, y + h],
    [x + cut, y + h],
    [x, y + h - cut],
    [x, y + cut],
  ];
}

export function octagon(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  cut: number,
  color: number,
  alpha = 1,
): void {
  g.fillStyle(color, alpha);
  if (cut <= 0) {
    g.fillRect(x, y, w, h);
    return;
  }
  const points = octagonPoints(x, y, w, h, cut);
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.closePath();
  g.fillPath();
}

export function plaque(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  style: PlaqueStyle,
): void {
  octagon(g, x, y, w, h, style.cut, style.borderColor);
  const b = style.border;
  octagon(g, x + b, y + b, w - 2 * b, h - 2 * b, style.innerCut, style.fillColor);
}

export function bevel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  style: BevelStyle,
): void {
  const { outlineWidth: ow, bevelWidth: bw } = style;

  g.fillStyle(style.fillColor, 1);
  g.fillRect(x, y, w, h);

  g.fillStyle(style.outlineColor, 1);
  g.fillRect(x, y, w, ow);
  g.fillRect(x, y + h - ow, w, ow);
  g.fillRect(x, y, ow, h);
  g.fillRect(x + w - ow, y, ow, h);

  g.fillStyle(style.highlightColor, 1);
  g.fillRect(x + ow, y + ow, w - 2 * ow, bw);
  g.fillRect(x + ow, y + ow, bw, h - 2 * ow);

  g.fillStyle(style.shadowColor, 1);
  g.fillRect(x + ow, y + h - ow - bw, w - 2 * ow, bw);
  g.fillRect(x + w - ow - bw, y + ow, bw, h - 2 * ow);
}

export function facade(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  style: FacadeStyle,
): void {
  g.fillStyle(style.baseColor, 1);
  g.fillRect(x, y, w, h);

  g.fillStyle(style.windowColor, 1);
  const stepX = style.gapX + style.windowW;
  const stepY = style.gapY + style.windowH;
  for (let wy = y + style.gapY; wy + style.windowH <= y + h; wy += stepY) {
    for (let wx = x + style.gapX; wx + style.windowW <= x + w; wx += stepX) {
      g.fillRect(wx, wy, style.windowW, style.windowH);
    }
  }
}

/** Interpolates `stops` at `t` in [0, 1], lerping the R, G and B channels separately — never the packed integer, which muddies hue. */
function colorAt(t: number, stops: readonly GradientStop[]): number {
  const clamped = Math.min(1, Math.max(0, t));

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].stop && clamped <= stops[i + 1].stop) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const span = upper.stop - lower.stop;
  const localT = span === 0 ? 0 : (clamped - lower.stop) / span;

  const lr = (lower.color >> 16) & 0xff;
  const lg = (lower.color >> 8) & 0xff;
  const lb = lower.color & 0xff;
  const ur = (upper.color >> 16) & 0xff;
  const ug = (upper.color >> 8) & 0xff;
  const ub = upper.color & 0xff;

  const r = Math.round(lr + (ur - lr) * localT);
  const g = Math.round(lg + (ug - lg) * localT);
  const b = Math.round(lb + (ub - lb) * localT);

  return (r << 16) | (g << 8) | b;
}

/** Fills a `w`×`h` box with a top-to-bottom gradient as `h` solid one-pixel bands — `Graphics` has no gradient fill that survives `generateTexture` (`docs/rules/tech-stack/phaser.md` R006). */
export function vGradient(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  stops: readonly GradientStop[],
): void {
  for (let py = 0; py < h; py++) {
    const t = h <= 1 ? 0 : py / (h - 1);
    g.fillStyle(colorAt(t, stops), 1);
    g.fillRect(x, y + py, w, 1);
  }
}
