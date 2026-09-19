import type Phaser from "phaser";
import { seedRand } from "../../sim/rng.ts";
import { COLORS } from "../colors.ts";
import { vGradient, type GradientStop } from "../primitives.ts";

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:35` five-stop sky gradient.
const SKY_GRADIENT: readonly GradientStop[] = [
  { stop: 0, color: COLORS.skyTop },
  { stop: 0.3, color: COLORS.skyUpper },
  { stop: 0.58, color: COLORS.skyMid },
  { stop: 0.82, color: COLORS.skyLow },
  { stop: 1, color: COLORS.skyBottom },
];

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:183` — the mockup's own seed for this scene's stream.
const SEED = 90613;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:184-187,197-202` — `renderVals()`'s draw order is far buildings (26 × 2 draws), then mid buildings (20 × 5 draws), then 46 stars.

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:46-50` far skyline: 26 buildings, left offset 10px, 8px gaps, alpha .8.
const FAR_COUNT = 26;
const FAR_LEFT_OFFSET = 10;
const FAR_GAP = 8;
const FAR_ALPHA = 0.8;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:53-57` mid skyline: 20 buildings, left offset 30px, 12px gaps, a 3px border-top edge cap.
const MID_COUNT = 20;
const MID_LEFT_OFFSET = 30;
const MID_GAP = 12;
const MID_EDGE_CAP = 3;
// Same lines' two stacked window gradients combine into a 4×4px window on a 14×14px grid, phase (bx, by).
const MID_WINDOW_W = 4;
const MID_WINDOW_TILE = 14;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:188` the three window-tint options mid buildings pick from.
interface WindowTint {
  readonly color: number;
  readonly alpha: number;
}
const MID_WINDOW_TINTS: readonly WindowTint[] = [
  { color: COLORS.windowBlue, alpha: 0.5 },
  { color: COLORS.windowBlue, alpha: 0.42 },
  { color: COLORS.windowAmber, alpha: 0.32 },
];

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:60` street haze: three-stop alpha gradient, 170px tall.
const HAZE_HEIGHT = 170;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:63` the hero building wrapper's own box.
const HERO_WIDTH = 620;
const HERO_HEIGHT = 320;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:66` facade: starts 44px below the wrapper's top, a 14×10px window on a 46×34px grid, phase (26, 24).
const FACADE_TOP = 44;
const FACADE_WINDOW_OFFSET_X = 26;
const FACADE_WINDOW_OFFSET_Y = 24;
const FACADE_WINDOW_W = 14;
const FACADE_WINDOW_H = 10;
const FACADE_WINDOW_TILE_X = 46;
const FACADE_WINDOW_TILE_Y = 34;
const FACADE_EDGE_LEFT_W = 14;
const FACADE_EDGE_RIGHT_W = 16;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:69-70` roof deck: 18px overhang each side, a 26px band 22px down, then an 8px cap.
const ROOF_DECK_OVERHANG = 18;
const ROOF_DECK_TOP = 22;
const ROOF_DECK_HEIGHT = 26;
const ROOF_DECK_HIGHLIGHT_H = 3;
const ROOF_DECK_SHADOW_H = 4;
const ROOF_DECK_CAP_TOP = 48;
const ROOF_DECK_CAP_HEIGHT = 8;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:73-74` 17 parapet blocks (see `renderVals()`, not the `hint-placeholder-count="14"` on the element).
const PARAPET_COUNT = 17;
const PARAPET_FIRST_LEFT = -14;
const PARAPET_STEP = 38;
const PARAPET_TOP = 6;
const PARAPET_W = 26;
const PARAPET_H = 18;
const PARAPET_HIGHLIGHT_H = 3;

/**
 * Ground line, in px above the play area's own bottom edge.
 *
 * The hero wrapper's `bottom: 0; height: 320px` (line 63) puts its top at `bottomEdge - 320`.
 *
 * MJ's and the Goblin's sprite wrappers both sit at `top: -137px` inside it (lines 91, 101) with no
 * explicit height, so each wrapper's own box height is its `img`'s rendered height, 143px (lines 92, 102).
 *
 * A sprite's feet are therefore at `bottomEdge - 320 - 137 + 143 = bottomEdge - 314`.
 */
export const SCENE_1_1_GROUND_FROM_BOTTOM = 314;

interface Building {
  readonly w: number;
  readonly h: number;
}

interface MidBuilding extends Building {
  readonly tint: WindowTint;
  readonly bx: number;
  readonly by: number;
}

interface Star {
  readonly x: number;
  readonly y: number;
  readonly color: number;
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:196-202` 46 stars, x in [0, 1500), y in [0, 280).
const STAR_COUNT = 46;
const STAR_X_RANGE = 1500;
const STAR_Y_RANGE = 280;

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:184-187` the mockup's own far-building-size formula.
function farBuildings(rand: () => number): Building[] {
  return Array.from({ length: FAR_COUNT }, () => ({
    w: Math.round(48 + rand() * 78),
    h: Math.round(90 + rand() * 150),
  }));
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:189-195` the mockup's own mid-building-size formula.
function midBuildings(rand: () => number): MidBuilding[] {
  return Array.from({ length: MID_COUNT }, () => {
    const w = Math.round(62 + rand() * 92);
    const h = Math.round(92 + rand() * 118);
    const tint = MID_WINDOW_TINTS[Math.floor(rand() * MID_WINDOW_TINTS.length)];
    const bx = Math.round(6 + rand() * 8);
    const by = Math.round(10 + rand() * 4);
    return { w, h, tint, bx, by };
  });
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:196-202` the mockup's own star formula: each star
// draws x, then y, then one comparison (white) or two (blue / deep blue) for its color.
function stars(rand: () => number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => {
    const x = Math.round(rand() * STAR_X_RANGE);
    const y = Math.round(rand() * STAR_Y_RANGE);
    const color =
      rand() > 0.5 ? COLORS.starWhite : rand() > 0.5 ? COLORS.starBlue : COLORS.starBlueDeep;
    return { x, y, color };
  });
}

/**
 * Fills the windows of a `repeating-linear-gradient` window grid.
 *
 * `boxLeft`/`boxTop`/`boxRight`/`boxBottom` are the background box the mockup's own `background-position`
 * phase is measured from; `clipLeft`/`clipRight` additionally bound what actually gets drawn, for a
 * building clipped by the canvas edge.
 */
function drawWindowGrid(
  g: Phaser.GameObjects.Graphics,
  boxLeft: number,
  boxTop: number,
  boxRight: number,
  boxBottom: number,
  clipLeft: number,
  clipRight: number,
  phaseX: number,
  phaseY: number,
  cellW: number,
  cellH: number,
  tileX: number,
  tileY: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  // Starts one tile early in both axes so the previous tile's cell, which can still poke into the box when
  // its phase leaves less than a cell's width or height before the box edge, is not skipped.
  for (let wy = boxTop + (phaseY % tileY) - tileY; wy < boxBottom; wy += tileY) {
    const cellTop = Math.max(wy, boxTop);
    const cellBottom = Math.min(wy + cellH, boxBottom);
    for (let wx = boxLeft + (phaseX % tileX) - tileX; wx < boxRight; wx += tileX) {
      const cellLeft = Math.max(wx, clipLeft);
      const cellRight = Math.min(wx + cellW, clipRight, boxRight);
      if (cellRight > cellLeft && cellBottom > cellTop) {
        g.fillRect(cellLeft, cellTop, cellRight - cellLeft, cellBottom - cellTop);
      }
    }
  }
}

function drawFarSkyline(
  g: Phaser.GameObjects.Graphics,
  buildings: readonly Building[],
  x: number,
  bottomY: number,
  maxX: number,
): void {
  let cx = x - FAR_LEFT_OFFSET;
  for (const b of buildings) {
    if (cx >= maxX) break;
    const left = Math.max(cx, x);
    const right = Math.min(cx + b.w, maxX);
    if (right > left) {
      g.fillStyle(COLORS.buildingFar, FAR_ALPHA);
      g.fillRect(left, bottomY - b.h, right - left, b.h);
    }
    cx += b.w + FAR_GAP;
  }
}

function drawMidSkyline(
  g: Phaser.GameObjects.Graphics,
  buildings: readonly MidBuilding[],
  x: number,
  bottomY: number,
  maxX: number,
): void {
  let cx = x - MID_LEFT_OFFSET;
  for (const b of buildings) {
    if (cx >= maxX) break;
    const left = Math.max(cx, x);
    const right = Math.min(cx + b.w, maxX);
    if (right > left) {
      const top = bottomY - b.h;
      g.fillStyle(COLORS.buildingMid, 1);
      g.fillRect(left, top, right - left, b.h);

      drawWindowGrid(
        g,
        cx,
        top,
        cx + b.w,
        bottomY,
        left,
        right,
        b.bx,
        b.by,
        MID_WINDOW_W,
        MID_WINDOW_W,
        MID_WINDOW_TILE,
        MID_WINDOW_TILE,
        b.tint.color,
        b.tint.alpha,
      );

      g.fillStyle(COLORS.buildingEdge, 1);
      g.fillRect(left, top, right - left, MID_EDGE_CAP);
    }
    cx += b.w + MID_GAP;
  }
}

function drawStreetHaze(
  g: Phaser.GameObjects.Graphics,
  x: number,
  bottomY: number,
  w: number,
): void {
  const top = bottomY - HAZE_HEIGHT;
  for (let py = 0; py < HAZE_HEIGHT; py++) {
    const t = py / (HAZE_HEIGHT - 1);
    // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:60` transparent at 0%, `hazeAmber1` at 55%, `hazeAmber2` at 100%.
    if (t < 0.55) {
      const alpha = (t / 0.55) * 0.12;
      g.fillStyle(COLORS.hazeAmber1, alpha);
    } else {
      const localT = (t - 0.55) / 0.45;
      const alpha = 0.12 + localT * (0.3 - 0.12);
      g.fillStyle(COLORS.hazeAmber2, alpha);
    }
    g.fillRect(x, top + py, w, 1);
  }
}

/**
 * Draws the Scene 1.1 backdrop into the `w`×`h` play area at `(x, y)`.
 *
 * Sky, stars and moon, far and mid skylines, street haze, then the hero building's facade, roof deck,
 * parapet, rooftop props and antenna — everything behind the actors (lines 35-89).
 *
 * MJ, the Goblin and their overlays are placed by the cutscene scene, not baked here.
 */
export function drawScene11Backdrop(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  vGradient(g, x, y, w, h, SKY_GRADIENT);

  const rand = seedRand(SEED);
  const far = farBuildings(rand);
  const mid = midBuildings(rand);
  const skyStars = stars(rand);

  const bottomY = y + h;
  const maxX = x + w;

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:39` the seed element itself, drawn once (not part of the 46-star clone list).
  g.fillStyle(COLORS.star, 1);
  g.fillRect(x + 40, y + 30, 3, 3);
  for (const star of skyStars) {
    g.fillStyle(star.color, 1);
    g.fillRect(x + 40 + star.x, y + 30 + star.y, 3, 3);
  }

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:40` the moon, with a soft halo approximating its blurred box-shadow glow.
  const moonCx = x + w - 96 - 29;
  const moonCy = y + 64 + 29;
  g.fillStyle(COLORS.moonGlow, 0.2);
  g.fillCircle(moonCx, moonCy, 47);
  g.fillStyle(COLORS.moon, 1);
  g.fillCircle(moonCx, moonCy, 29);

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:41-42` two dim fixed stars.
  g.fillStyle(COLORS.starDim, 1);
  g.fillRect(x + w - 128 - 10, y + 80, 10, 10);
  g.fillRect(x + w - 110 - 7, y + 100, 7, 7);

  drawFarSkyline(g, far, x, bottomY, maxX);
  drawMidSkyline(g, mid, x, bottomY, maxX);
  drawStreetHaze(g, x, bottomY, w);

  const heroX = x + (w - HERO_WIDTH) / 2;
  const heroTop = bottomY - HERO_HEIGHT;
  const heroLeft = (offset: number) => heroX + offset;
  const heroRight = (offset: number, blockW: number) => heroX + HERO_WIDTH - offset - blockW;
  const heroY = (top: number) => heroTop + top;

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:66` facade, windows, and its two inset edge bands.
  const facadeTop = heroY(FACADE_TOP);
  const facadeH = bottomY - facadeTop;
  g.fillStyle(COLORS.towerSpidey, 1);
  g.fillRect(heroX, facadeTop, HERO_WIDTH, facadeH);
  drawWindowGrid(
    g,
    heroX,
    facadeTop,
    heroX + HERO_WIDTH,
    bottomY,
    heroX,
    heroX + HERO_WIDTH,
    FACADE_WINDOW_OFFSET_X,
    FACADE_WINDOW_OFFSET_Y,
    FACADE_WINDOW_W,
    FACADE_WINDOW_H,
    FACADE_WINDOW_TILE_X,
    FACADE_WINDOW_TILE_Y,
    COLORS.windowAmber,
    0.62,
  );
  g.fillStyle(COLORS.skyHighlightBlue, 0.07);
  g.fillRect(heroX, facadeTop, FACADE_EDGE_LEFT_W, facadeH);
  g.fillStyle(COLORS.groundShadow, 0.45);
  g.fillRect(heroX + HERO_WIDTH - FACADE_EDGE_RIGHT_W, facadeTop, FACADE_EDGE_RIGHT_W, facadeH);

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:69-70` roof deck band and its lower cap.
  const roofDeckLeft = heroLeft(-ROOF_DECK_OVERHANG);
  const roofDeckW = HERO_WIDTH + 2 * ROOF_DECK_OVERHANG;
  const roofDeckTop = heroY(ROOF_DECK_TOP);
  g.fillStyle(COLORS.roofDeckBase, 1);
  g.fillRect(roofDeckLeft, roofDeckTop, roofDeckW, ROOF_DECK_HEIGHT);
  g.fillStyle(COLORS.roofDeckHighlight, 1);
  g.fillRect(roofDeckLeft, roofDeckTop, roofDeckW, ROOF_DECK_HIGHLIGHT_H);
  g.fillStyle(COLORS.groundShadow, 0.5);
  g.fillRect(
    roofDeckLeft,
    roofDeckTop + ROOF_DECK_HEIGHT - ROOF_DECK_SHADOW_H,
    roofDeckW,
    ROOF_DECK_SHADOW_H,
  );
  g.fillStyle(COLORS.roofDeckShade, 1);
  g.fillRect(roofDeckLeft, heroY(ROOF_DECK_CAP_TOP), roofDeckW, ROOF_DECK_CAP_HEIGHT);

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:73-74` 17 parapet blocks along the roof deck.
  for (let i = 0; i < PARAPET_COUNT; i++) {
    const px = heroLeft(PARAPET_FIRST_LEFT + i * PARAPET_STEP);
    const py = heroY(PARAPET_TOP);
    g.fillStyle(COLORS.roofCap, 1);
    g.fillRect(px, py, PARAPET_W, PARAPET_H);
    g.fillStyle(COLORS.frameBlue, 1);
    g.fillRect(px, py, PARAPET_W, PARAPET_HIGHLIGHT_H);
  }

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:78-81` right-side rooftop AC unit, its cap, and two small vent boxes.
  g.fillStyle(COLORS.acUnit, 1);
  g.fillRect(heroRight(116, 62), heroY(-70), 62, 76);
  g.fillStyle(COLORS.acUnitHighlight, 1);
  g.fillRect(heroRight(116, 62), heroY(-70), 62, 5);
  g.fillStyle(COLORS.roofCap, 1);
  g.fillRect(heroRight(108, 78), heroY(-80), 78, 12);
  g.fillStyle(COLORS.towerSpidey, 1);
  g.fillRect(heroRight(138, 18), heroY(6), 18, 22);
  g.fillRect(heroRight(100, 18), heroY(6), 18, 22);

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:83-84` left-side rooftop AC unit and its cap.
  g.fillStyle(COLORS.acUnit, 1);
  g.fillRect(heroLeft(210), heroY(-34), 54, 40);
  g.fillStyle(COLORS.acUnitHighlight, 1);
  g.fillRect(heroLeft(210), heroY(-34), 54, 4);
  g.fillStyle(COLORS.roofCap, 1);
  g.fillRect(heroLeft(222), heroY(-46), 30, 12);

  // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:86-88` antenna: pole, a baked-lit light (the mockup's `blink` animation is baked "on"), and its cap.
  g.fillStyle(COLORS.antennaPole, 1);
  g.fillRect(heroLeft(44), heroY(-132), 10, 140);
  g.fillStyle(COLORS.red, 1);
  g.fillRect(heroLeft(40), heroY(-142), 18, 10);
  g.fillStyle(COLORS.antennaPole, 1);
  g.fillRect(heroLeft(30), heroY(-96), 38, 6);
}
