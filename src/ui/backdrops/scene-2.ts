import type Phaser from "phaser";
import { seedRand } from "../../sim/rng.ts";
import { COLORS } from "../colors.ts";
import { vGradient, type GradientStop } from "../primitives.ts";
import {
  buildSkyline2x,
  SKYLINE_2X_SEED,
  stageFill,
  STAGE_2X_ZOOM,
  stageX,
  stageY,
  type Stage2x,
} from "./stage-2x.ts";

// `reference/design/Scene 2 - Rooftop Relief.dc.html:30` five-stop sky gradient.
const SKY_GRADIENT: readonly GradientStop[] = [
  { stop: 0, color: COLORS.skyTop },
  { stop: 0.3, color: COLORS.skyUpper },
  { stop: 0.58, color: COLORS.skyMid },
  { stop: 0.82, color: COLORS.skyLow },
  { stop: 1, color: COLORS.skyBottom },
];

// `reference/design/Scene 2 - Rooftop Relief.dc.html:40` the stage wrapper: 1080px wide and centred.
const STAGE_WIDTH = 1080;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:34` the seed star, 3×3 at (40, 26), whose `box-shadow` clones are the generated field.
const STAR_ORIGIN_X = 40;
const STAR_ORIGIN_Y = 26;
const STAR_SIZE = 3;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:164-170` 44 stars, x up to 1500 and y up to 260 from that origin.
const STAR_COUNT = 44;
const STAR_X_RANGE = 1500;
const STAR_Y_RANGE = 260;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:35` the moon: a 52px disc inset 84px from the right and 52px from the top, with a 18px-spread glow.
const MOON_RIGHT = 84;
const MOON_TOP = 52;
const MOON_SIZE = 52;
const MOON_GLOW_SPREAD = 18;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:36` the single dim fixed star beside it.
const DIM_STAR_RIGHT = 112;
const DIM_STAR_TOP = 66;
const DIM_STAR_SIZE = 9;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:57` street haze: a three-stop alpha gradient 292px tall, overhanging the stage by 120px each side.
const HAZE_LEFT = -120;
const HAZE_WIDTH = STAGE_WIDTH + 240;
const HAZE_HEIGHT = 292;
const HAZE_MID_STOP = 0.55;
const HAZE_MID_ALPHA = 0.1;
const HAZE_BOTTOM_ALPHA = 0.26;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:60-63` the water tower: tank, lid and two legs, all bottom-anchored.
const TANK_LEFT = 36;
const TANK_BOTTOM = 290;
const TANK_W = 96;
const TANK_H = 96;
const TANK_RIM_H = 6;
const TANK_SHADE_W = 8;
const LID_LEFT = 24;
const LID_W = 120;
const LID_H = 20;
const LEG_LEFT_NEAR = 54;
const LEG_LEFT_FAR = 104;
const LEG_BOTTOM = 250;
const LEG_W = 10;
const LEG_H = 44;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:66-68` the antenna: pole, its crossbar, and the warning light the mockup blinks and this bake holds lit.
const POLE_LEFT = 222;
const POLE_BOTTOM = 250;
const POLE_W = 9;
const POLE_H = 200;
const POLE_LIGHT_LEFT = 216;
const POLE_LIGHT_BOTTOM = 450;
const POLE_LIGHT_W = 20;
const POLE_LIGHT_H = 10;
const CROSSBAR_LEFT = 206;
const CROSSBAR_BOTTOM = 380;
const CROSSBAR_W = 40;
const CROSSBAR_H = 6;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:71-72` the AC unit and the vent box on its lid.
const AC_LEFT = 318;
const AC_BOTTOM = 250;
const AC_W = 104;
const AC_H = 62;
const AC_RIM_H = 5;
const AC_SHADE_W = 8;
const VENT_LEFT = 334;
const VENT_BOTTOM = 312;
const VENT_W = 34;
const VENT_H = 14;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:75-79` the roof slab: a 1060×250 box whose ledge falls at stage-local x 820.
const SLAB_LEFT = -240;
const SLAB_W = 1060;
const SLAB_H = 250;
const SLAB_CAP_H = 30;
const SLAB_CAP_RIM_H = 4;
const SLAB_CAP_SHADE_H = 5;
const SLAB_EDGE_W = 22;
const SLAB_GLASS_W = 10;
// `reference/design/Scene 2 - Rooftop Relief.dc.html:77` the deck's two seams: a 3px light stripe every 22px across, and a 2px dark stripe every 26px down.
const SEAM_LIGHT_W = 3;
const SEAM_LIGHT_STEP = 22;
const SEAM_LIGHT_ALPHA = 0.035;
const SEAM_DARK_H = 2;
const SEAM_DARK_STEP = 26;
const SEAM_DARK_ALPHA = 0.3;

/**
 * Ground line, in px above the play area's own bottom edge.
 *
 * The roof slab's `bottom: 0; height: 250px` (line 75) puts its cap's top face 250 stage-px up, and the
 * stage's own `zoom: 0.82` (line 40) renders that as 205 play px — where Spidey's feet land.
 */
export const SCENE_2_GROUND_FROM_BOTTOM = 205;

interface Star {
  readonly x: number;
  readonly y: number;
  readonly color: number;
}

// `reference/design/Scene 2 - Rooftop Relief.dc.html:164-170` the mockup's own star formula: each star
// draws x, then y, then one comparison (white) or two (blue / deep blue) for its colour.
function stars(rand: () => number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => {
    const x = Math.round(rand() * STAR_X_RANGE);
    const y = Math.round(rand() * STAR_Y_RANGE);
    const color =
      rand() > 0.5 ? COLORS.starWhite : rand() > 0.5 ? COLORS.starBlue : COLORS.starBlueDeep;
    return { x, y, color };
  });
}

/** Draws the frame-level sky details, which sit outside the stage wrapper and so take none of its zoom. */
function drawSkyDetail(
  g: Phaser.GameObjects.Graphics,
  skyStars: readonly Star[],
  x: number,
  y: number,
  w: number,
): void {
  g.fillStyle(COLORS.star, 1);
  g.fillRect(x + STAR_ORIGIN_X, y + STAR_ORIGIN_Y, STAR_SIZE, STAR_SIZE);
  for (const star of skyStars) {
    // The field reaches 1500px right of its origin, well past the play area's own right edge.
    const left = x + STAR_ORIGIN_X + star.x;
    const right = Math.min(left + STAR_SIZE, x + w);
    if (right > left) {
      g.fillStyle(star.color, 1);
      g.fillRect(left, y + STAR_ORIGIN_Y + star.y, right - left, STAR_SIZE);
    }
  }

  const moonR = MOON_SIZE / 2;
  const moonCx = x + w - MOON_RIGHT - moonR;
  const moonCy = y + MOON_TOP + moonR;
  g.fillStyle(COLORS.moonGlow, 0.2);
  g.fillCircle(moonCx, moonCy, moonR + MOON_GLOW_SPREAD);
  g.fillStyle(COLORS.moon, 1);
  g.fillCircle(moonCx, moonCy, moonR);

  g.fillStyle(COLORS.starDim, 1);
  g.fillRect(
    x + w - DIM_STAR_RIGHT - DIM_STAR_SIZE,
    y + DIM_STAR_TOP,
    DIM_STAR_SIZE,
    DIM_STAR_SIZE,
  );
}

/** Draws the amber haze rising off the street, one play-area row at a time since `Graphics` has no gradient fill. */
function drawStreetHaze(g: Phaser.GameObjects.Graphics, stage: Stage2x): void {
  const left = Math.max(stageX(stage, HAZE_LEFT), stage.clip.left);
  const right = Math.min(stageX(stage, HAZE_LEFT + HAZE_WIDTH), stage.clip.right);
  const top = Math.max(stageY(stage, HAZE_HEIGHT), stage.clip.top);
  const bottom = Math.min(stage.bottomY, stage.clip.bottom);
  if (right <= left) return;
  for (let py = top; py < bottom; py++) {
    const t = (py - top) / (bottom - top - 1);
    if (t < HAZE_MID_STOP) {
      g.fillStyle(COLORS.hazeAmber1, (t / HAZE_MID_STOP) * HAZE_MID_ALPHA);
    } else {
      const localT = (t - HAZE_MID_STOP) / (1 - HAZE_MID_STOP);
      g.fillStyle(
        COLORS.hazeAmber2,
        HAZE_MID_ALPHA + localT * (HAZE_BOTTOM_ALPHA - HAZE_MID_ALPHA),
      );
    }
    g.fillRect(left, py, right - left, 1);
  }
}

function drawWaterTower(g: Phaser.GameObjects.Graphics, stage: Stage2x): void {
  g.fillStyle(COLORS.waterTower, 1);
  stageFill(g, stage, TANK_LEFT, TANK_BOTTOM, TANK_W, TANK_H);
  g.fillStyle(COLORS.groundShadow, 0.45);
  stageFill(g, stage, TANK_LEFT + TANK_W - TANK_SHADE_W, TANK_BOTTOM, TANK_SHADE_W, TANK_H);
  g.fillStyle(COLORS.waterTowerHighlight, 1);
  stageFill(g, stage, TANK_LEFT, TANK_BOTTOM + TANK_H - TANK_RIM_H, TANK_W, TANK_RIM_H);

  g.fillStyle(COLORS.waterTowerLid, 1);
  stageFill(g, stage, LID_LEFT, TANK_BOTTOM + TANK_H, LID_W, LID_H);

  g.fillStyle(COLORS.waterTowerLeg, 1);
  stageFill(g, stage, LEG_LEFT_NEAR, LEG_BOTTOM, LEG_W, LEG_H);
  stageFill(g, stage, LEG_LEFT_FAR, LEG_BOTTOM, LEG_W, LEG_H);
}

function drawAntenna(g: Phaser.GameObjects.Graphics, stage: Stage2x): void {
  g.fillStyle(COLORS.antennaPole, 1);
  stageFill(g, stage, POLE_LEFT, POLE_BOTTOM, POLE_W, POLE_H);
  g.fillStyle(COLORS.red, 1);
  stageFill(g, stage, POLE_LIGHT_LEFT, POLE_LIGHT_BOTTOM, POLE_LIGHT_W, POLE_LIGHT_H);
  g.fillStyle(COLORS.antennaPole, 1);
  stageFill(g, stage, CROSSBAR_LEFT, CROSSBAR_BOTTOM, CROSSBAR_W, CROSSBAR_H);
}

function drawAcUnit(g: Phaser.GameObjects.Graphics, stage: Stage2x): void {
  g.fillStyle(COLORS.acUnit, 1);
  stageFill(g, stage, AC_LEFT, AC_BOTTOM, AC_W, AC_H);
  g.fillStyle(COLORS.groundShadow, 0.4);
  stageFill(g, stage, AC_LEFT + AC_W - AC_SHADE_W, AC_BOTTOM, AC_SHADE_W, AC_H);
  g.fillStyle(COLORS.acUnitHighlight, 1);
  stageFill(g, stage, AC_LEFT, AC_BOTTOM + AC_H - AC_RIM_H, AC_W, AC_RIM_H);

  g.fillStyle(COLORS.roofCap, 1);
  stageFill(g, stage, VENT_LEFT, VENT_BOTTOM, VENT_W, VENT_H);
}

/** Draws the deck's two seam gratings, whose stripe phase starts at the deck box's own top-left corner. */
function drawDeckSeams(g: Phaser.GameObjects.Graphics, stage: Stage2x, deckH: number): void {
  g.fillStyle(COLORS.roofSlabSeamDark, SEAM_DARK_ALPHA);
  for (let dy = 0; dy < deckH; dy += SEAM_DARK_STEP) {
    const h = Math.min(SEAM_DARK_H, deckH - dy);
    stageFill(g, stage, SLAB_LEFT, deckH - dy - h, SLAB_W, h);
  }
  g.fillStyle(COLORS.starWhite, SEAM_LIGHT_ALPHA);
  for (let dx = 0; dx < SLAB_W; dx += SEAM_LIGHT_STEP) {
    const stripeW = Math.min(SEAM_LIGHT_W, SLAB_W - dx);
    stageFill(g, stage, SLAB_LEFT + dx, 0, stripeW, deckH);
  }
}

function drawRoofSlab(g: Phaser.GameObjects.Graphics, stage: Stage2x): void {
  const deckH = SLAB_H - SLAB_CAP_H;

  g.fillStyle(COLORS.roofDeckBase, 1);
  stageFill(g, stage, SLAB_LEFT, deckH, SLAB_W, SLAB_CAP_H);
  g.fillStyle(COLORS.groundShadow, 0.5);
  stageFill(g, stage, SLAB_LEFT, deckH, SLAB_W, SLAB_CAP_SHADE_H);
  g.fillStyle(COLORS.roofDeckHighlight, 1);
  stageFill(g, stage, SLAB_LEFT, SLAB_H - SLAB_CAP_RIM_H, SLAB_W, SLAB_CAP_RIM_H);

  g.fillStyle(COLORS.roofSlabSurface, 1);
  stageFill(g, stage, SLAB_LEFT, 0, SLAB_W, deckH);
  drawDeckSeams(g, stage, deckH);

  g.fillStyle(COLORS.roofSlabEdge, 1);
  stageFill(g, stage, SLAB_LEFT + SLAB_W - SLAB_EDGE_W, 0, SLAB_EDGE_W, SLAB_H);
  g.fillStyle(COLORS.skyHighlightBlue, 0.1);
  stageFill(g, stage, SLAB_LEFT + SLAB_W - SLAB_EDGE_W - SLAB_GLASS_W, 0, SLAB_GLASS_W, deckH);
}

/**
 * Draws the Scene 2 backdrop into the `w`×`h` play area at `(x, y)`.
 *
 * Sky, the star field and moon, the far and mid skylines, street haze, then the rooftop's own water tower,
 * antenna, AC unit and slab — everything behind Spidey (lines 30-80).
 *
 * Spidey, his stream and their overlays are placed by the cutscene scene, not baked here.
 */
export function drawScene2Backdrop(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  vGradient(g, x, y, w, h, SKY_GRADIENT);

  const rand = seedRand(SKYLINE_2X_SEED);
  const drawSkyline = buildSkyline2x(rand);
  const skyStars = stars(rand);

  const stage: Stage2x = {
    x: x + (w - STAGE_WIDTH * STAGE_2X_ZOOM) / 2,
    bottomY: y + h,
    zoom: STAGE_2X_ZOOM,
    clip: { left: x, top: y, right: x + w, bottom: y + h },
  };

  drawSkyDetail(g, skyStars, x, y, w);
  drawSkyline(g, stage);
  drawStreetHaze(g, stage);
  drawWaterTower(g, stage);
  drawAntenna(g, stage);
  drawAcUnit(g, stage);
  drawRoofSlab(g, stage);
}
