import type { World } from "./world.ts";

export const FIXED_DT = 1 / 60;
export const MAX_FRAME = 0.25;

export function tick(w: World, deltaMs: number): void {
  const deltaSeconds = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs / 1000 : 0;
  w.accumulator += Math.min(deltaSeconds, MAX_FRAME);
  while (w.accumulator >= FIXED_DT) {
    step(w, FIXED_DT);
    w.accumulator -= FIXED_DT;
  }
  w.alpha = w.accumulator / FIXED_DT;
}

export function step(w: World, _dt: number): void {
  w.step += 1;
}

export function stepTo(w: World, n: number): void {
  if (n < w.step) {
    throw new RangeError(`stepTo: target step ${n} is behind current step ${w.step}`);
  }
  while (w.step < n) {
    step(w, FIXED_DT);
  }
}
