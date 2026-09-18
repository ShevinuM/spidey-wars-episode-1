export const STEP_DT = 1 / 60;
export const MAX_FRAME = 0.25;

export interface Stepper {
  step: number;
  accumulator: number;
}

export function newStepper(): Stepper {
  return { step: 0, accumulator: 0 };
}

export function advance(s: Stepper, deltaMs: number): void {
  const deltaSeconds = Number.isFinite(deltaMs) && deltaMs > 0 ? deltaMs / 1000 : 0;
  s.accumulator += Math.min(deltaSeconds, MAX_FRAME);
  while (s.accumulator >= STEP_DT) {
    s.step += 1;
    s.accumulator -= STEP_DT;
  }
}

export function setStep(s: Stepper, n: number): void {
  if (n < 0) {
    throw new RangeError(`setStep: n (${n}) must not be negative`);
  }
  s.step = n;
}
