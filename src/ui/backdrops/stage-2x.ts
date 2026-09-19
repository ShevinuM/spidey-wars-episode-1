import type Phaser from "phaser";
import { COLORS } from "../colors.ts";

/**
 * The `<!-- STAGE -->` wrapper the 2.x mockups draw their city into, mapped onto the play area.
 *
 * Everything inside that wrapper is written in stage-local px under its own `zoom`; everything outside it
 * (stars, moon, balloon, plaque) is frame px at 1:1 and is none of this module's business.
 */
export interface Stage2x {
  /** Play-area x of the stage wrapper's left edge. */
  readonly x: number;
  /** Play-area y of the stage wrapper's bottom edge. */
  readonly bottomY: number;
  /** The stage wrapper's own CSS `zoom`, which scales every stage-local length and offset below it. */
  readonly zoom: number;
  /** The box every fill is clamped to, since `drawSceneBg` paints the octagon frame panels before the backdrop and a fill outside this box would overwrite them. */
  readonly clip: StageClip;
}

interface StageClip {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** `reference/design/Scene 2 - Rooftop Relief.dc.html:40` — the stage wrapper's `zoom`, which Scenes 2 and 2.1 both run at. */
export const STAGE_2X_ZOOM = 0.82;

/** Play-area x of a stage-local `left:` offset, rounded so a fill lands on whole pixels. */
export function stageX(stage: Stage2x, sLeft: number): number {
  return Math.round(stage.x + sLeft * stage.zoom);
}

/** Play-area y of a stage-local `bottom:` offset, rounded the same way. */
export function stageY(stage: Stage2x, sBottom: number): number {
  return Math.round(stage.bottomY - sBottom * stage.zoom);
}

/**
 * Fills one stage-local box in the caller's current fill style, clamped to the stage's clip box.
 *
 * `sLeft` and `sBottom` are the mockup's own `left:` and `bottom:` offsets inside the stage wrapper, and
 * `sW`/`sH` its `width:`/`height:`.
 */
export function stageFill(
  g: Phaser.GameObjects.Graphics,
  stage: Stage2x,
  sLeft: number,
  sBottom: number,
  sW: number,
  sH: number,
): void {
  const left = Math.max(stageX(stage, sLeft), stage.clip.left);
  const right = Math.min(stageX(stage, sLeft + sW), stage.clip.right);
  const top = Math.max(stageY(stage, sBottom + sH), stage.clip.top);
  const bottom = Math.min(stageY(stage, sBottom), stage.clip.bottom);
  if (right > left && bottom > top) {
    g.fillRect(left, top, right - left, bottom - top);
  }
}

/** `reference/design/Scene 2 - Rooftop Relief.dc.html:151` — the seed Scenes 2 and 2.1 both draw their skylines from. */
export const SKYLINE_2X_SEED = 50218;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:43-47` far skyline: 24 buildings from stage-local -80, 8px gaps, alpha .75.
const FAR_COUNT = 24;
const FAR_LEFT = -80;
const FAR_GAP = 8;
const FAR_ALPHA = 0.75;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:50-53` mid skyline: 18 buildings from stage-local -120, 14px gaps, a 3px `border-top` edge cap.
// That div sets no `box-sizing`, so the cap sits above its `height:` rather than inside it.
// A CSS border snaps to whole device pixels, so the cap is drawn `round(MID_EDGE_CAP * zoom)` device px thick, converted back to stage units.
const MID_COUNT = 18;
const MID_LEFT = -120;
const MID_GAP = 14;
const MID_EDGE_CAP = 3;
// Same lines' two stacked window gradients combine into a 4×4px window on a 14×14px grid, phase (bx, by).
const MID_WINDOW_W = 4;
const MID_WINDOW_TILE = 14;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:156` the three window-tint options mid buildings pick from.
interface WindowTint {
  readonly color: number;
  readonly alpha: number;
}
const MID_WINDOW_TINTS: readonly WindowTint[] = [
  { color: COLORS.windowBlue, alpha: 0.5 },
  { color: COLORS.windowBlue, alpha: 0.42 },
  { color: COLORS.windowAmber, alpha: 0.32 },
];

interface Building {
  readonly w: number;
  readonly h: number;
}

interface MidBuilding extends Building {
  readonly tint: WindowTint;
  readonly bx: number;
  readonly by: number;
}

// `reference/design/Scene 2 - Rooftop Relief.dc.html:152-155` the mockup's own far-building-size formula.
function farBuildings(rand: () => number): Building[] {
  return Array.from({ length: FAR_COUNT }, () => ({
    w: Math.round(50 + rand() * 78),
    h: Math.round(80 + rand() * 140) + 142,
  }));
}

// `reference/design/Scene 2 - Rooftop Relief.dc.html:157-163` the mockup's own mid-building-size formula.
function midBuildings(rand: () => number): MidBuilding[] {
  return Array.from({ length: MID_COUNT }, () => {
    const w = Math.round(66 + rand() * 92);
    const h = Math.round(86 + rand() * 112) + 142;
    const tint = MID_WINDOW_TINTS[Math.floor(rand() * MID_WINDOW_TINTS.length)];
    const bx = Math.round(6 + rand() * 8);
    const by = Math.round(10 + rand() * 4);
    return { w, h, tint, bx, by };
  });
}

/**
 * Fills the lit windows of one mid building, in stage-local px.
 *
 * `dx`/`dy` are measured from the top-left of the building's padding box — the corner `b.h` above its
 * bottom — because `background-origin` defaults to `padding-box`, which is where the mockup anchors its
 * `background-position` phase. Both loops start a whole tile early so the cell straddling that corner is
 * not skipped.
 */
function drawWindowGrid(
  g: Phaser.GameObjects.Graphics,
  stage: Stage2x,
  sLeft: number,
  sBottom: number,
  b: MidBuilding,
): void {
  g.fillStyle(b.tint.color, b.tint.alpha);
  const sTop = sBottom + b.h;
  for (let dy = (b.by % MID_WINDOW_TILE) - MID_WINDOW_TILE; dy < b.h; dy += MID_WINDOW_TILE) {
    const cellTop = Math.max(dy, 0);
    const cellBottom = Math.min(dy + MID_WINDOW_W, b.h);
    if (cellBottom <= cellTop) continue;
    for (let dx = (b.bx % MID_WINDOW_TILE) - MID_WINDOW_TILE; dx < b.w; dx += MID_WINDOW_TILE) {
      const cellLeft = Math.max(dx, 0);
      const cellRight = Math.min(dx + MID_WINDOW_W, b.w);
      if (cellRight > cellLeft) {
        stageFill(
          g,
          stage,
          sLeft + cellLeft,
          sTop - cellBottom,
          cellRight - cellLeft,
          cellBottom - cellTop,
        );
      }
    }
  }
}

function drawFarSkyline(
  g: Phaser.GameObjects.Graphics,
  buildings: readonly Building[],
  stage: Stage2x,
): void {
  g.fillStyle(COLORS.buildingFar, FAR_ALPHA);
  let cx = FAR_LEFT;
  for (const b of buildings) {
    stageFill(g, stage, cx, 0, b.w, b.h);
    cx += b.w + FAR_GAP;
  }
}

function drawMidSkyline(
  g: Phaser.GameObjects.Graphics,
  buildings: readonly MidBuilding[],
  stage: Stage2x,
): void {
  const capDevicePx = Math.round(MID_EDGE_CAP * stage.zoom);
  let cx = MID_LEFT;
  for (const b of buildings) {
    g.fillStyle(COLORS.buildingMid, 1);
    stageFill(g, stage, cx, 0, b.w, b.h);
    drawWindowGrid(g, stage, cx, 0, b);
    g.fillStyle(COLORS.buildingEdge, 1);
    stageFill(g, stage, cx, b.h, b.w, capDevicePx / stage.zoom);
    cx += b.w + MID_GAP;
  }
}

/**
 * Generates the far and mid skylines from `rand`'s current position and returns their painter.
 *
 * Generating and painting are split because a scene's own seeded elements continue this stream — Scene 2's
 * 44 stars are drawn from it straight after these two arrays — yet paint behind the skyline.
 */
export function buildSkyline2x(
  rand: () => number,
): (g: Phaser.GameObjects.Graphics, stage: Stage2x) => void {
  const far = farBuildings(rand);
  const mid = midBuildings(rand);
  return (g, stage) => {
    drawFarSkyline(g, far, stage);
    drawMidSkyline(g, mid, stage);
  };
}
