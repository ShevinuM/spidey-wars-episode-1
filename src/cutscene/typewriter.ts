import { STEP_DT } from "./stepper.ts";

export const DEFAULT_CPS = 45;

export function visibleChars(totalChars: number, elapsedSteps: number, cps: number): number {
  const raw = Math.floor(elapsedSteps * cps * STEP_DT);
  return Math.max(0, Math.min(totalChars, raw));
}

export function isComplete(totalChars: number, elapsedSteps: number, cps: number): boolean {
  return visibleChars(totalChars, elapsedSteps, cps) >= totalChars;
}

export function stepsToComplete(totalChars: number, cps: number): number {
  if (totalChars <= 0) {
    return 0;
  }
  if (cps <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  // Floating-point error in `totalChars / (cps * STEP_DT)` can round the ceiling estimate one
  // step higher than necessary; snap back down to the real boundary so this never disagrees
  // with visibleChars.
  let n = Math.ceil(totalChars / (cps * STEP_DT));
  while (n > 0 && visibleChars(totalChars, n - 1, cps) >= totalChars) {
    n -= 1;
  }
  return n;
}
