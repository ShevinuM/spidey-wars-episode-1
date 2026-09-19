import type Phaser from "phaser";
import { drawDemoBackdrop } from "./backdrops/demo.ts";
import { COLORS } from "./colors.ts";
import { octagon } from "./primitives.ts";

/**
 * The play area's rect inside the three frame panels — `reference/design/Scene 2.1 - Spider-Sense.dc.html:28-32`'s
 * `padding: 4px` / `8px` / `3px` stack, arithmetic at 1280×720 (`min-height: 702` rounds to 690 at this canvas height).
 */
export const PLAY_AREA = { x: 15, y: 15, width: 1250, height: 690 } as const;

type BackdropDrawer = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
) => void;

/**
 * One entry per scene id, each backed by one file under `backdrops/`. Adding a backdrop means adding that
 * file and one line here — nothing else in `drawSceneBg` or its callers changes.
 */
const BACKDROPS: Record<string, BackdropDrawer> = {
  demo: drawDemoBackdrop,
};

/**
 * Draws the three nested octagon frame panels at 1280×720 (`reference/design/Scene 2.1 - Spider-Sense.dc.html:28-30`),
 * then the backdrop registered for `id` inside `PLAY_AREA`. Throws if `id` has no registered backdrop — a
 * missing backdrop is a bug to surface loudly, never a silently skipped draw.
 */
export function drawSceneBg(g: Phaser.GameObjects.Graphics, id: string): void {
  octagon(g, 0, 0, 1280, 720, 10, COLORS.frameBlue);
  octagon(g, 4, 4, 1272, 712, 9, COLORS.frameDeep);
  octagon(g, 12, 12, 1256, 696, 0, COLORS.frameMid);

  const draw = BACKDROPS[id];
  if (!draw) {
    throw new Error(`drawSceneBg: no backdrop registered for id "${id}"`);
  }
  draw(g, PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
}
