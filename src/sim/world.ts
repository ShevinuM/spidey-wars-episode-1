import type { SimEvent } from "./events.ts";

export interface World {
  seed: number;
  step: number;
  alpha: number;
  accumulator: number;
  rng: number;
  events: SimEvent[];
}

export function newWorld(seed: number): World {
  return {
    seed,
    step: 0,
    alpha: 0,
    accumulator: 0,
    rng: seed,
    events: [],
  };
}
