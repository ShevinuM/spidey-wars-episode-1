import { type World, newWorld } from "./world.ts";
import { FIXED_DT, step } from "./tick.ts";
import { digest } from "./digest.ts";

type Action = { t: "noop" };

export interface Replay {
  seed: number;
  inputs: Array<[number, Action]>;
  expected: { digest: string; trajectory: string[] };
}

interface ReplayResult {
  world: World;
  digest: string;
  trajectory: string[];
}

const TRAJECTORY_INTERVAL = 60;

function assertValidReplay(replay: Replay): void {
  if (!Number.isFinite(replay.seed)) {
    throw new Error("malformed replay: seed must be a finite number");
  }
  for (const [inputStep] of replay.inputs) {
    if (!Number.isInteger(inputStep) || inputStep < 0) {
      throw new Error(`malformed replay: input step ${inputStep} must be a non-negative integer`);
    }
  }
}

function applyAction(action: Action): void {
  switch (action.t) {
    case "noop":
      return;
  }
}

export function runReplay(replay: Replay): ReplayResult {
  assertValidReplay(replay);
  const world = newWorld(replay.seed);
  const actionsByStep = new Map(replay.inputs);
  const totalSteps = replay.inputs.reduce((max, [inputStep]) => Math.max(max, inputStep), 0);
  const trajectory: string[] = [];
  for (let n = 1; n <= totalSteps; n += 1) {
    const action = actionsByStep.get(n);
    if (action !== undefined) {
      applyAction(action);
    }
    step(world, FIXED_DT);
    if (world.step % TRAJECTORY_INTERVAL === 0) {
      trajectory.push(digest(world));
    }
  }
  return { world, digest: digest(world), trajectory };
}
