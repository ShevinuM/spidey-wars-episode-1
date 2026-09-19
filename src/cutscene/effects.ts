/**
 * Reproduces CSS `steps(n, end)`: holds each interval's starting value for the interval's whole
 * duration, so a tween eased with it reads as its own `from` value for the entire first interval.
 *
 * This is deliberately not Phaser's built-in `Stepped` ease, which implements `steps(n, start)` instead
 * (`node_modules/phaser/src/math/easing/stepped/Stepped.js`: `(((steps*v)|0)+1)*(1/steps)`) and so jumps
 * to the *second* step's value one frame after the tween begins — wrong for every mockup here, which all
 * write `steps(n, end)`.
 */
export function steppedEase(steps: number): (v: number) => number {
  if (!Number.isInteger(steps) || steps <= 0) {
    throw new RangeError(`steppedEase: steps (${steps}) must be a positive integer`);
  }
  return (v: number): number => {
    const clamped = v < 0 ? 0 : v > 1 ? 1 : v;
    return Math.floor(clamped * steps) / steps;
  };
}
