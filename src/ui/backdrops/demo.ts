import type Phaser from "phaser";
import { seedRand } from "../../sim/rng.ts";
import { COLORS } from "../colors.ts";
import { facade, vGradient, type GradientStop } from "../primitives.ts";

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:32` `linear-gradient(180deg, #04081c 0%, #071130 30%, #0d1c45 58%, #16274f 82%, #223256 100%)`.
const SKY_GRADIENT: readonly GradientStop[] = [
  { stop: 0, color: COLORS.skyTop },
  { stop: 0.3, color: COLORS.skyUpper },
  { stop: 0.58, color: COLORS.skyMid },
  { stop: 0.82, color: COLORS.skyLow },
  { stop: 1, color: COLORS.skyBottom },
];

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:212` — the mockup's own seed for its skyline arrays.
const SKYLINE_SEED = 50218;

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:44-48` far skyline: 24 buildings, 8 px gaps, alpha .75.
const FAR_COUNT = 24;
const FAR_GAP = 8;
const FAR_ALPHA = 0.75;

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:51-55` mid skyline: 18 buildings, 14 px gaps, a 3 px `border-top` edge cap.
const MID_COUNT = 18;
const MID_GAP = 14;
const MID_EDGE_CAP = 3;
// Same line's window `repeating-linear-gradient`s tile a 4×4 px window every 14 px in both axes.
const MID_WINDOW_SIZE = 4;
const MID_WINDOW_GAP = 10;

// Both skylines "extend to ground" (`:44`, `:51`) starting 80 px left of the backdrop's own left edge.
const SKYLINE_START_OFFSET = 80;

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:77-78` — the roof slab is 250 px tall with a 30 px cap on top.
const ROOF_BAND_HEIGHT = 250;
const ROOF_CAP_HEIGHT = 30;

interface Building {
  readonly w: number;
  readonly h: number;
}

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:213-215` — the mockup's own far-building-size formula.
function farBuildings(rand: () => number): Building[] {
  return Array.from({ length: FAR_COUNT }, () => ({
    w: Math.round(50 + rand() * 78),
    h: Math.round(80 + rand() * 140) + 142,
  }));
}

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:218-220` — the mockup's own mid-building-size formula.
function midBuildings(rand: () => number): Building[] {
  return Array.from({ length: MID_COUNT }, () => ({
    w: Math.round(66 + rand() * 92),
    h: Math.round(86 + rand() * 112) + 142,
  }));
}

/**
 * Lays out `buildings` left to right from `startX`, bottom-aligned to `bottomY`, clipping each one to
 * `[minX, maxX]` — `Graphics` has no clip region, and `drawSceneBg` draws the frame into the same target
 * before the backdrop, so a building drawn at its full width would paint over it.
 */
function drawSkyline(
  buildings: readonly Building[],
  startX: number,
  bottomY: number,
  gap: number,
  minX: number,
  maxX: number,
  draw: (x: number, y: number, w: number, h: number) => void,
): void {
  let cx = startX;
  for (const b of buildings) {
    if (cx >= maxX) break;
    const left = Math.max(cx, minX);
    const right = Math.min(cx + b.w, maxX);
    if (right > left) {
      draw(left, bottomY - b.h, right - left, b.h);
    }
    cx += b.w + gap;
  }
}

/**
 * Draws the demo backdrop into the `w`×`h` box at `(x, y)`: the mockup's own five-stop sky gradient, a far
 * skyline, a mid skyline, then a flat roof band. A deliberately reduced port of `Scene 2.1`'s backdrop —
 * no water tower, antenna, AC unit, street haze or textured roof slab, so the palette this backdrop draws
 * from stays closed.
 */
export function drawDemoBackdrop(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  vGradient(g, x, y, w, h, SKY_GRADIENT);

  const rand = seedRand(SKYLINE_SEED);
  const far = farBuildings(rand);
  const mid = midBuildings(rand);

  const bottomY = y + h;
  const startX = x - SKYLINE_START_OFFSET;
  const maxX = x + w;

  drawSkyline(far, startX, bottomY, FAR_GAP, x, maxX, (bx, by, bw, bh) => {
    g.fillStyle(COLORS.buildingFar, FAR_ALPHA);
    g.fillRect(bx, by, bw, bh);
  });

  drawSkyline(mid, startX, bottomY, MID_GAP, x, maxX, (bx, by, bw, bh) => {
    facade(g, bx, by, bw, bh, {
      baseColor: COLORS.buildingMid,
      windowColor: COLORS.amber,
      windowW: MID_WINDOW_SIZE,
      windowH: MID_WINDOW_SIZE,
      gapX: MID_WINDOW_GAP,
      gapY: MID_WINDOW_GAP,
    });
    g.fillStyle(COLORS.buildingEdge, 1);
    g.fillRect(bx, by, bw, MID_EDGE_CAP);
  });

  const roofTop = bottomY - ROOF_BAND_HEIGHT;
  g.fillStyle(COLORS.roofCap, 1);
  g.fillRect(x, roofTop, w, ROOF_CAP_HEIGHT);
  g.fillStyle(COLORS.buildingFar, 1);
  g.fillRect(x, roofTop + ROOF_CAP_HEIGHT, w, ROOF_BAND_HEIGHT - ROOF_CAP_HEIGHT);
}
