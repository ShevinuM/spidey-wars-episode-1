import type Phaser from "phaser";
import { DEMO_GROUND_FROM_BOTTOM, drawDemoBackdrop } from "./backdrops/demo.ts";
import { drawScene11Backdrop, SCENE_1_1_GROUND_FROM_BOTTOM } from "./backdrops/scene-1-1.ts";
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

interface Backdrop {
  readonly draw: BackdropDrawer;
  /** Play-area y of the surface actors stand on. */
  readonly groundY: number;
}

/**
 * One entry per scene id, each backed by one file under `backdrops/`.
 *
 * Adding a backdrop means adding that file and one line here — nothing else in `drawSceneBg`,
 * `groundYOf`, or their callers changes. A backdrop file exports its ground line measured up from the
 * play area's own bottom edge, since importing `PLAY_AREA` back from here would cycle; this registry is
 * the one place that owns `PLAY_AREA.height` and converts that offset into the from-top `groundY` stored
 * below.
 */
const BACKDROPS: Record<string, Backdrop> = {
  demo: { draw: drawDemoBackdrop, groundY: PLAY_AREA.height - DEMO_GROUND_FROM_BOTTOM },
  "scene-1-1": {
    draw: drawScene11Backdrop,
    groundY: PLAY_AREA.height - SCENE_1_1_GROUND_FROM_BOTTOM,
  },
};

function backdropOf(id: string, caller: string): Backdrop {
  const backdrop = BACKDROPS[id];
  if (!backdrop) {
    throw new Error(`${caller}: no backdrop registered for id "${id}"`);
  }
  return backdrop;
}

/**
 * Fills 1280×720 with page background, then draws the three nested octagon frame panels (`reference/design/Scene 2.1 - Spider-Sense.dc.html:28-30`) and the backdrop registered for `id` inside `PLAY_AREA`.
 *
 * Throws if `id` has no registered backdrop — a missing backdrop is a bug to surface loudly, never a
 * silently skipped draw.
 */
export function drawSceneBg(g: Phaser.GameObjects.Graphics, id: string): void {
  // Fills the full canvas with page background first so the outer octagon's corner cuts show `#060d22` rather than whatever scene is still resident underneath, matching `reference/design/Scene 2.1 - Spider-Sense.dc.html:15`'s `background: #060d22`.
  g.fillStyle(COLORS.bgDeep, 1);
  g.fillRect(0, 0, 1280, 720);

  octagon(g, 0, 0, 1280, 720, 10, COLORS.frameBlue);
  octagon(g, 4, 4, 1272, 712, 9, COLORS.frameDeep);
  octagon(g, 12, 12, 1256, 696, 0, COLORS.frameMid);

  backdropOf(id, "drawSceneBg").draw(
    g,
    PLAY_AREA.x,
    PLAY_AREA.y,
    PLAY_AREA.width,
    PLAY_AREA.height,
  );
}

/**
 * The play-area y of `id`'s ground line, throwing if `id` has no registered backdrop exactly as
 * `drawSceneBg` does.
 */
export function groundYOf(id: string): number {
  return backdropOf(id, "groundYOf").groundY;
}
