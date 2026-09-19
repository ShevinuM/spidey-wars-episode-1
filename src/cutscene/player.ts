import type { Beat } from "./script.ts";
import { beatCharCount } from "./script.ts";
import { isComplete, stepsToComplete, visibleChars } from "./typewriter.ts";

export type PlayerPhase = "typing" | "complete" | "finished";

export interface PlayerState {
  readonly beat: number;
  readonly elapsedSteps: number;
  readonly finished: boolean;
}

export function newPlayer(): PlayerState {
  return { beat: 0, elapsedSteps: 0, finished: false };
}

export function setStep(state: PlayerState, steps: number): PlayerState {
  return { beat: state.beat, elapsedSteps: steps, finished: state.finished };
}

export function phaseOf(state: PlayerState, script: readonly Beat[], cps: number): PlayerPhase {
  if (state.finished || state.beat >= script.length) {
    return "finished";
  }
  const total = beatCharCount(script[state.beat]);
  return isComplete(total, state.elapsedSteps, cps) ? "complete" : "typing";
}

export function advance(state: PlayerState, script: readonly Beat[], cps: number): PlayerState {
  const phase = phaseOf(state, script, cps);
  if (phase === "finished") {
    return state;
  }
  if (phase === "typing") {
    const total = beatCharCount(script[state.beat]);
    return { beat: state.beat, elapsedSteps: stepsToComplete(total, cps), finished: false };
  }
  const nextBeat = state.beat + 1;
  if (nextBeat >= script.length) {
    return { beat: state.beat, elapsedSteps: state.elapsedSteps, finished: true };
  }
  return { beat: nextBeat, elapsedSteps: 0, finished: false };
}

export function visibleCharsOf(state: PlayerState, script: readonly Beat[], cps: number): number {
  if (state.finished || state.beat >= script.length) {
    return 0;
  }
  const total = beatCharCount(script[state.beat]);
  return visibleChars(total, state.elapsedSteps, cps);
}
