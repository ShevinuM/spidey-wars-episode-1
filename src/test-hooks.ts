import Phaser from "phaser";
import { digest as simDigest } from "./sim/digest.ts";
import { type Replay, runReplay } from "./sim/replay.ts";
import { stepTo as simStepTo } from "./sim/tick.ts";
import { newWorld, type World } from "./sim/world.ts";

const DEFAULT_SEED = 20260912;
const SCENE_CLOCK_PROBE_DELAY_MS = 24 * 60 * 60 * 1000;

export interface TestHooks {
  ready(): boolean;
  goto(scene: string, data?: unknown): Promise<void>;
  freeze(): void;
  stepTo(n: number): void;
  state(): unknown;
  digest(): string;
  replay(input: Replay): { digest: string; trajectory: string[] };
}

export function installTestHooks(game: Phaser.Game): void {
  let world: World = newWorld(DEFAULT_SEED);
  // Advances only while the current scene's clock runs, so a test can observe freeze() stop it.
  let sceneClockProbe: Phaser.Time.TimerEvent | undefined;

  window.__TEST__ = {
    ready(): boolean {
      return window.__READY__ === true;
    },

    goto(scene: string, data?: unknown): Promise<void> {
      return new Promise((resolve, reject) => {
        // Phaser types getScene() as always returning a Scene, but it returns null at
        // runtime for an unregistered key (SceneManager.getScene, phaser@4.2.1).
        const target = game.scene.getScene(scene) as Phaser.Scene | null;
        if (target === null) {
          reject(new Error(`goto: no scene registered with key "${scene}"`));
          return;
        }
        target.events.once(Phaser.Scenes.Events.CREATE, () => {
          sceneClockProbe = target.time.addEvent({ delay: SCENE_CLOCK_PROBE_DELAY_MS });
          game.events.once(Phaser.Core.Events.POST_RENDER, () => resolve());
        });
        game.scene.start(scene, data as object | undefined);
      });
    },

    freeze(): void {
      for (const active of game.scene.getScenes(true)) {
        active.tweens.pauseAll();
        active.anims.pauseAll();
        active.time.paused = true;
      }
    },

    stepTo(n: number): void {
      simStepTo(world, n);
    },

    state(): unknown {
      return {
        ...JSON.parse(JSON.stringify(world)),
        sceneClockMs: sceneClockProbe?.getElapsed() ?? null,
      };
    },

    digest(): string {
      return simDigest(world);
    },

    replay(input: Replay): { digest: string; trajectory: string[] } {
      const result = runReplay(input);
      world = result.world;
      return { digest: result.digest, trajectory: result.trajectory };
    },
  };
}
