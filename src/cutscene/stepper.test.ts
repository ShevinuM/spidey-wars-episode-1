import { describe, expect, it } from "vitest";
import { advance, MAX_FRAME, newStepper, setStep, STEP_DT } from "./stepper.ts";

describe("stepper frame independence", () => {
  it("reaches the same step for equal total time at different frame rates", () => {
    const fast = newStepper();
    for (let i = 0; i < 100; i += 1) advance(fast, 16.6);

    const slow = newStepper();
    for (let i = 0; i < 50; i += 1) advance(slow, 33.2);

    expect(fast.step).toBe(slow.step);
  });
});

describe("advance MAX_FRAME clamp", () => {
  it("advances at most MAX_FRAME / STEP_DT steps for one huge delta", () => {
    const s = newStepper();
    advance(s, 5000);
    expect(s.step).toBe(Math.floor(MAX_FRAME / STEP_DT));
  });
});

describe("advance unhappy paths", () => {
  it("does nothing to a freshly created stepper before any advance", () => {
    const s = newStepper();
    expect(s.step).toBe(0);
    expect(s.accumulator).toBe(0);
  });

  it("does not advance the step on a zero delta", () => {
    const s = newStepper();
    advance(s, 0);
    expect(s.step).toBe(0);
    expect(s.accumulator).toBe(0);
  });

  it("treats a negative delta as no time passing", () => {
    const s = newStepper();
    advance(s, -100);
    expect(s.step).toBe(0);
    expect(s.accumulator).toBe(0);
  });

  it("treats a NaN delta as no time passing", () => {
    const s = newStepper();
    advance(s, Number.NaN);
    expect(s.step).toBe(0);
    expect(s.accumulator).toBe(0);
  });
});

describe("setStep", () => {
  it("sets the step absolutely, forward or backward", () => {
    const s = newStepper();
    setStep(s, 5);
    expect(s.step).toBe(5);
    setStep(s, 2);
    expect(s.step).toBe(2);
  });

  it("accepts 0", () => {
    const s = newStepper();
    setStep(s, 5);
    setStep(s, 0);
    expect(s.step).toBe(0);
  });

  it("throws a RangeError on a negative n", () => {
    const s = newStepper();
    expect(() => setStep(s, -1)).toThrow(RangeError);
  });
});
