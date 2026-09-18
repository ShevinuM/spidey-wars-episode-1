import Phaser from "phaser";

/** Sky gradient stops, ported from reference/design/*.dc.html. */
const SKY_GRADIENT: ReadonlyArray<{ stop: number; color: number }> = [
  { stop: 0, color: 0x04081c },
  { stop: 0.3, color: 0x071130 },
  { stop: 0.58, color: 0x0d1c45 },
  { stop: 0.82, color: 0x16274f },
  { stop: 1, color: 0x223256 },
];

/**
 * Interpolates the packed-RGB sky gradient at t in [0, 1], lerping the R, G
 * and B channels separately (never the packed integer — that muddies hue).
 */
function skyColorAt(
  t: number,
  stops: ReadonlyArray<{ stop: number; color: number }> = SKY_GRADIENT,
): number {
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

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();

    for (let y = 0; y < height; y++) {
      const t = y / height;
      graphics.fillStyle(skyColorAt(t), 1);
      graphics.fillRect(0, y, width, 1);
    }

    window.__READY__ = true;
  }
}
