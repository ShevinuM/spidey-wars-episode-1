import type Phaser from "phaser";
import { steppedEase } from "../cutscene/effects.ts";
import { COLORS } from "./colors.ts";
import { PLAY_AREA } from "./draw-scene-bg.ts";

export interface EffectHandle {
  readonly tweens: readonly Phaser.Tweens.Tween[];
}

type Recipe = (
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
) => EffectHandle;

// Step count for a mockup animation whose own easing isn't `steps(n)`; a floor-eased tween always
// freezes to the interval's start value, so the exact density never shows up in a baseline.
const DEFAULT_STEPS = 8;

/** Converts a mockup's `left`/`top`, measured from the sprite's own rendered box, into container-local coordinates. */
function localOf(
  sprite: Phaser.GameObjects.Image,
  left: number,
  top: number,
): readonly [number, number] {
  return [-sprite.displayWidth / 2 + left, -sprite.displayHeight + top];
}

/**
 * Converts a mockup's `left` and a height above the sprite's own rendered bottom edge into
 * container-local coordinates, for an overlay the actor's feet anchor rather than his head.
 *
 * A 2.x mockup's stage zoom makes our integer-scaled sprite a little taller than the one it draws, so a
 * shadow measured down from the head would float clear of the roof; measured up from the feet it lands.
 */
function localOfFeet(
  sprite: Phaser.GameObjects.Image,
  left: number,
  aboveFeet: number,
): readonly [number, number] {
  return [-sprite.displayWidth / 2 + left, -aboveFeet];
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:107` — the eye's box-shadow squares, in 3px cell
// units; every other heart glyph in this module reuses the same 5×5 cell pattern, scaled.
const HEART_CELLS: readonly (readonly [number, number])[] = [
  [1, 0],
  [3, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [4, 1],
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [1, 3],
  [2, 3],
  [3, 3],
  [2, 4],
];

/** Draws one `HEART_CELLS` heart with its top-left pixel at `(x, y)`, `cell`-px per pixel. */
function drawHeart(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  cell: number,
  color: number,
): void {
  g.fillStyle(color, 1);
  for (const [cx, cy] of HEART_CELLS) {
    g.fillRect(x + cx * cell, y + cy * cell, cell, cell);
  }
}

/** Draws one `HEART_CELLS` heart centred on the `Graphics` object's own origin, `cell`-px per pixel. */
function drawHeartCentered(g: Phaser.GameObjects.Graphics, cell: number, color: number): void {
  const span = 5 * cell;
  g.fillStyle(color, 1);
  for (const [cx, cy] of HEART_CELLS) {
    g.fillRect(cx * cell - span / 2, cy * cell - span / 2, cell, cell);
  }
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:101` `animation: bob 2.6s ease-in-out infinite` — translateY 0 to -9px and back.
const BOB_AMPLITUDE = 9;
const BOB_DURATION_MS = 1300;

function bob(scene: Phaser.Scene, container: Phaser.GameObjects.Container): EffectHandle {
  const tween = scene.tweens.add({
    targets: container,
    y: container.y - BOB_AMPLITUDE,
    duration: BOB_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: steppedEase(DEFAULT_STEPS),
  });
  return { tweens: [tween] };
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:123` `animation: flamePulse 0.6s steps(2, end)` on the glider's engine glow, 130×16 at left 10, top 148.
const FLAME_LEFT = 10;
const FLAME_TOP = 148;
const FLAME_W = 130;
const FLAME_H = 16;
const FLAME_ALPHA_FROM = 0.45;
const FLAME_ALPHA_TO = 0.9;
const FLAME_STEPS = 2;
const FLAME_DURATION_MS = 300;

function flamePulse(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [left, top] = localOf(sprite, FLAME_LEFT, FLAME_TOP);
  const glow = scene.add
    .ellipse(left + FLAME_W / 2, top + FLAME_H / 2, FLAME_W, FLAME_H, COLORS.flameGlow)
    .setAlpha(FLAME_ALPHA_FROM);
  container.add(glow);
  const tween = scene.tweens.add({
    targets: glow,
    alpha: FLAME_ALPHA_TO,
    duration: FLAME_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: steppedEase(FLAME_STEPS),
  });
  return { tweens: [tween] };
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:93` MJ's ground shadow, 120×12 at left -4, top 138 — a flat fill approximates the mockup's radial gradient, since a Shape has no gradient fill.
const GROUND_SHADOW_LEFT = -4;
const GROUND_SHADOW_TOP = 138;
const GROUND_SHADOW_W = 120;
const GROUND_SHADOW_H = 12;
const GROUND_SHADOW_ALPHA = 0.5;

function groundShadow(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [left, top] = localOf(sprite, GROUND_SHADOW_LEFT, GROUND_SHADOW_TOP);
  const shadow = scene.add
    .ellipse(
      left + GROUND_SHADOW_W / 2,
      top + GROUND_SHADOW_H / 2,
      GROUND_SHADOW_W,
      GROUND_SHADOW_H,
      COLORS.groundShadow,
    )
    .setAlpha(GROUND_SHADOW_ALPHA);
  container.add(shadow);
  return { tweens: [] };
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:104-105` two blush ellipses, 12×8, left 34/90, top 47.
const BLUSH_TOP = 47;
const BLUSH_W = 12;
const BLUSH_H = 8;
const BLUSH_ALPHA = 0.55;
const BLUSH_LEFTS: readonly number[] = [34, 90];

function blush(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  for (const left of BLUSH_LEFTS) {
    const [x, y] = localOf(sprite, left, BLUSH_TOP);
    const cheek = scene.add
      .ellipse(x + BLUSH_W / 2, y + BLUSH_H / 2, BLUSH_W, BLUSH_H, COLORS.blushPink)
      .setAlpha(BLUSH_ALPHA);
    container.add(cheek);
  }
  return { tweens: [] };
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:107-108` two hearts, 3px cells, left 50/71, top 30.
const HEART_EYES_CELL = 3;
const HEART_EYES: readonly (readonly [number, number])[] = [
  [50, 30],
  [71, 30],
];

function heartEyes(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const g = scene.add.graphics();
  for (const [left, top] of HEART_EYES) {
    const [x, y] = localOf(sprite, left, top);
    drawHeart(g, x, y, HEART_EYES_CELL, COLORS.heartEye);
  }
  container.add(g);
  return { tweens: [] };
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:110` the puckered kiss mouth, 7×5 at left 63, top 47.
const KISS_MOUTH_LEFT = 63;
const KISS_MOUTH_TOP = 47;
const KISS_MOUTH_W = 7;
const KISS_MOUTH_H = 5;

function kissMouth(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [x, y] = localOf(sprite, KISS_MOUTH_LEFT, KISS_MOUTH_TOP);
  const mouth = scene.add.ellipse(
    x + KISS_MOUTH_W / 2,
    y + KISS_MOUTH_H / 2,
    KISS_MOUTH_W,
    KISS_MOUTH_H,
    COLORS.kissMouth,
  );
  container.add(mouth);
  return { tweens: [] };
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:112` — the CSS arc (0→52,-22px, scale .5→1.3, opacity dipping at 15%) is ported as a symmetric yoyo, since only the frozen `from` value a baseline ever sees needs to match.
const FLYING_KISS_LEFT = 74;
const FLYING_KISS_TOP = 40;
const FLYING_KISS_CELL = 3;
const FLYING_KISS_DX = 52;
const FLYING_KISS_DY = -22;
const FLYING_KISS_SCALE_TO = 1.3;
const FLYING_KISS_ALPHA_FROM = 0;
const FLYING_KISS_DURATION_MS = 1800;

function flyingKiss(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const span = 5 * FLYING_KISS_CELL;
  const [left, top] = localOf(sprite, FLYING_KISS_LEFT, FLYING_KISS_TOP);
  const heart = scene.add.graphics();
  drawHeartCentered(heart, FLYING_KISS_CELL, COLORS.blushPink);
  heart
    .setPosition(left + span / 2, top + span / 2)
    .setScale(0.5)
    .setAlpha(FLYING_KISS_ALPHA_FROM);
  container.add(heart);
  const tween = scene.tweens.add({
    targets: heart,
    x: heart.x + FLYING_KISS_DX,
    y: heart.y + FLYING_KISS_DY,
    scale: FLYING_KISS_SCALE_TO,
    alpha: 1,
    duration: FLYING_KISS_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: steppedEase(DEFAULT_STEPS),
  });
  return { tweens: [tween] };
}

interface FloatingHeart {
  readonly left: number;
  readonly top: number;
  readonly fontSize: number;
  readonly color: number;
  readonly amplitude: number;
  readonly scaleTo: number;
  readonly alphaFrom: number;
  readonly durationMs: number;
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:130-132` one heart per row, in mockup order.
const FLOATING_HEARTS: readonly FloatingHeart[] = [
  {
    left: -22,
    top: 8,
    fontSize: 18,
    color: COLORS.blushPink,
    amplitude: 14,
    scaleTo: 1.15,
    alphaFrom: 0.95,
    durationMs: 1800,
  },
  {
    left: 152,
    top: -4,
    fontSize: 14,
    color: COLORS.heartFloat2,
    amplitude: 10,
    scaleTo: 1.08,
    alphaFrom: 0.85,
    durationMs: 2200,
  },
  {
    left: 66,
    top: -40,
    fontSize: 12,
    color: COLORS.heartFloat3,
    amplitude: 18,
    scaleTo: 1.2,
    alphaFrom: 0.9,
    durationMs: 2000,
  },
];

function floatingHearts(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const tweens: Phaser.Tweens.Tween[] = [];
  for (const heart of FLOATING_HEARTS) {
    const cell = Math.round(heart.fontSize / 5);
    const span = 5 * cell;
    const [left, top] = localOf(sprite, heart.left, heart.top);
    const g = scene.add.graphics();
    drawHeartCentered(g, cell, heart.color);
    g.setPosition(left + span / 2, top + span / 2).setAlpha(heart.alphaFrom);
    container.add(g);
    tweens.push(
      scene.tweens.add({
        targets: g,
        y: g.y - heart.amplitude,
        scale: heart.scaleTo,
        alpha: 1,
        duration: heart.durationMs / 2,
        yoyo: true,
        repeat: -1,
        ease: steppedEase(DEFAULT_STEPS),
      }),
    );
  }
  return { tweens };
}

interface BouquetPetal {
  readonly left: number;
  readonly top: number;
  readonly size: number;
  readonly color: number;
}

// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:114-122` the bouquet, its own -12,58 wrapper folded into every offset below.
const BOUQUET_STEM = { left: -2, top: 74, w: 3, h: 24 } as const;
const BOUQUET_PETALS: readonly BouquetPetal[] = [
  { left: -12, top: 58, size: 9, color: COLORS.blushPink },
  { left: -12, top: 61, size: 3, color: COLORS.petalCenter },
  { left: -4, top: 54, size: 9, color: COLORS.petalGold },
  { left: -4, top: 57, size: 3, color: COLORS.kissMouth },
  { left: 3, top: 60, size: 9, color: COLORS.paper },
  { left: 3, top: 63, size: 3, color: COLORS.petalGold },
];

function bouquet(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [stemX, stemY] = localOf(sprite, BOUQUET_STEM.left, BOUQUET_STEM.top);
  const stem = scene.add
    .rectangle(stemX, stemY, BOUQUET_STEM.w, BOUQUET_STEM.h, COLORS.stemGreen)
    .setOrigin(0, 0);
  container.add(stem);
  for (const petal of BOUQUET_PETALS) {
    const [x, y] = localOf(sprite, petal.left, petal.top);
    const bloom = scene.add.ellipse(
      x + petal.size / 2,
      y + petal.size / 2,
      petal.size,
      petal.size,
      petal.color,
    );
    container.add(bloom);
  }
  return { tweens: [] };
}

// `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:99` `animation: droop 3.2s ease-in-out infinite` on the glider wrapper — rest pose rotate(3deg), dipping to translateY(5px) rotate(1deg).
const DROOP_ROTATION_FROM_DEG = 3;
const DROOP_ROTATION_TO_DEG = 1;
const DROOP_TRANSLATE_Y = 5;
const DROOP_DURATION_MS = 1600;

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function droop(scene: Phaser.Scene, container: Phaser.GameObjects.Container): EffectHandle {
  container.setRotation(degToRad(DROOP_ROTATION_FROM_DEG));
  const tween = scene.tweens.add({
    targets: container,
    y: container.y + DROOP_TRANSLATE_Y,
    rotation: degToRad(DROOP_ROTATION_TO_DEG),
    duration: DROOP_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: steppedEase(DEFAULT_STEPS),
  });
  return { tweens: [tween] };
}

// `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:102-103` two 12x2 brows, left 48/74, top 25, rotated 22deg and -22deg about their own centre.
const SAD_EYEBROW_TOP = 25;
const SAD_EYEBROW_W = 12;
const SAD_EYEBROW_H = 2;
const SAD_EYEBROWS: readonly (readonly [left: number, angleDeg: number])[] = [
  [48, 22],
  [74, -22],
];

function sadEyebrows(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  for (const [left, angleDeg] of SAD_EYEBROWS) {
    const [x, y] = localOf(sprite, left + SAD_EYEBROW_W / 2, SAD_EYEBROW_TOP + SAD_EYEBROW_H / 2);
    const brow = scene.add
      .rectangle(x, y, SAD_EYEBROW_W, SAD_EYEBROW_H, COLORS.ink)
      .setRotation(degToRad(angleDeg));
    container.add(brow);
  }
  return { tweens: [] };
}

// `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:105-106` two 5px dots, left 55/76, top 34.
const SAD_EYE_TOP = 34;
const SAD_EYE_SIZE = 5;
const SAD_EYE_LEFTS: readonly number[] = [55, 76];

function sadEyes(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  for (const left of SAD_EYE_LEFTS) {
    const [x, y] = localOf(sprite, left + SAD_EYE_SIZE / 2, SAD_EYE_TOP + SAD_EYE_SIZE / 2);
    const eye = scene.add.ellipse(x, y, SAD_EYE_SIZE, SAD_EYE_SIZE, COLORS.ink);
    container.add(eye);
  }
  return { tweens: [] };
}

// `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:108` the 4x6 tear, left 54, top 40, falling 14px as it fades in then out.
const TEAR_LEFT = 54;
const TEAR_TOP = 40;
const TEAR_W = 4;
const TEAR_H = 6;
const TEAR_FALL = 14;
const TEAR_ALPHA_FROM = 0;
const TEAR_ALPHA_TO = 0.9;
const TEAR_DURATION_MS = 2400;

function tearDrip(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [x, y] = localOf(sprite, TEAR_LEFT + TEAR_W / 2, TEAR_TOP + TEAR_H / 2);
  const drop = scene.add.ellipse(x, y, TEAR_W, TEAR_H, COLORS.tearBlue).setAlpha(TEAR_ALPHA_FROM);
  container.add(drop);
  const tween = scene.tweens.add({
    targets: drop,
    y: drop.y + TEAR_FALL,
    alpha: TEAR_ALPHA_TO,
    duration: TEAR_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: steppedEase(DEFAULT_STEPS),
  });
  return { tweens: [tween] };
}

// `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:110` a 16x8 box, border-top only, top corners rounded 50% — its endpoints (0,4)/(16,4) and apex (8,0) sit on a radius-10 circle centred ten px below the box's top edge.
const FROWN_LEFT = 59;
const FROWN_TOP = 50;
const FROWN_W = 16;
const FROWN_RADIUS = 10;
const FROWN_HALF_ANGLE = Math.asin(FROWN_W / 2 / FROWN_RADIUS);
const FROWN_LINE_WIDTH = 3;

function frownMouth(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [cx, cy] = localOf(sprite, FROWN_LEFT + FROWN_W / 2, FROWN_TOP + FROWN_RADIUS);
  const g = scene.add.graphics();
  g.lineStyle(FROWN_LINE_WIDTH, COLORS.ink, 1);
  g.beginPath();
  g.arc(
    cx,
    cy,
    FROWN_RADIUS,
    Math.PI + (Math.PI / 2 - FROWN_HALF_ANGLE),
    2 * Math.PI - (Math.PI / 2 - FROWN_HALF_ANGLE),
  );
  g.strokePath();
  container.add(g);
  return { tweens: [] };
}

// `reference/design/Scene 1.3 - Goblin Gets Triggered.dc.html:106-108` the Goblin's wide cackling mouth — a 24x18 box (radii 6/6/12/12), a 20x4 tooth strip, and a 3x6 tongue, all static.
const CACKLE_MOUTH_LEFT = 55;
const CACKLE_MOUTH_TOP = 44;
const CACKLE_MOUTH_W = 24;
const CACKLE_MOUTH_H = 18;
const CACKLE_TEETH_LEFT = 57;
const CACKLE_TEETH_TOP = 47;
const CACKLE_TEETH_W = 20;
const CACKLE_TEETH_H = 4;
const CACKLE_TONGUE_LEFT = 61;
const CACKLE_TONGUE_TOP = 53;
const CACKLE_TONGUE_W = 3;
const CACKLE_TONGUE_H = 6;

function cackleMouth(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [mouthX, mouthY] = localOf(sprite, CACKLE_MOUTH_LEFT, CACKLE_MOUTH_TOP);
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 1);
  g.fillRoundedRect(mouthX, mouthY, CACKLE_MOUTH_W, CACKLE_MOUTH_H, {
    tl: 6,
    tr: 6,
    bl: 12,
    br: 12,
  });
  container.add(g);

  const [teethX, teethY] = localOf(sprite, CACKLE_TEETH_LEFT, CACKLE_TEETH_TOP);
  container.add(
    scene.add
      .rectangle(teethX, teethY, CACKLE_TEETH_W, CACKLE_TEETH_H, COLORS.paper)
      .setOrigin(0, 0),
  );

  const [tongueX, tongueY] = localOf(sprite, CACKLE_TONGUE_LEFT, CACKLE_TONGUE_TOP);
  container.add(
    scene.add.ellipse(
      tongueX + CACKLE_TONGUE_W / 2,
      tongueY + CACKLE_TONGUE_H / 2,
      CACKLE_TONGUE_W,
      CACKLE_TONGUE_H,
      COLORS.kissMouth,
    ),
  );
  return { tweens: [] };
}

interface FallingTear {
  readonly left: number;
  readonly delayMs: number;
}

// `reference/design/Scene 1.3 - Goblin Gets Triggered.dc.html:93-94` MJ's two tears, 4x7 at top 47, left 48/68 — the fill colour matches `COLORS.frameBlue`'s hex.
const TEAR_FALL_TOP = 47;
const TEAR_FALL_W = 4;
const TEAR_FALL_H = 7;
const TEAR_FALL_AMOUNT = 16;
const TEAR_FALL_SCALE_FROM = 0.6;
const TEAR_FALL_ALPHA_FROM = 0;
const TEAR_FALL_DURATION_MS = 1400;
const TEAR_FALLS: readonly FallingTear[] = [
  { left: 48, delayMs: 0 },
  { left: 68, delayMs: 500 }, // `...:94` `animation-delay: .5s` on the second tear.
];

function tearFall(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const tweens: Phaser.Tweens.Tween[] = [];
  for (const tear of TEAR_FALLS) {
    const [x, y] = localOf(sprite, tear.left + TEAR_FALL_W / 2, TEAR_FALL_TOP + TEAR_FALL_H / 2);
    const drop = scene.add
      .ellipse(x, y, TEAR_FALL_W, TEAR_FALL_H, COLORS.frameBlue)
      .setScale(1, TEAR_FALL_SCALE_FROM)
      .setAlpha(TEAR_FALL_ALPHA_FROM);
    container.add(drop);
    tweens.push(
      scene.tweens.add({
        targets: drop,
        y: drop.y + TEAR_FALL_AMOUNT,
        scaleY: 1,
        alpha: 1,
        duration: TEAR_FALL_DURATION_MS,
        delay: tear.delayMs,
        yoyo: true,
        repeat: -1,
        ease: steppedEase(DEFAULT_STEPS),
      }),
    );
  }
  return { tweens };
}

interface HaSpan {
  readonly left: number;
  readonly top: number;
  readonly fontKey: "pressstart-16" | "pressstart-8";
  readonly delayMs: number;
}

// `reference/design/Scene 1.3 - Goblin Gets Triggered.dc.html:110-111` two "HA" spans, Press Start 2P at 13px and 11px — the nearest baked bitmap fonts are `pressstart-16` and `pressstart-8`, since a fractional scale would sample unevenly under `pixelArt: true`.
const HA_SPANS: readonly HaSpan[] = [
  { left: 96, top: 6, fontKey: "pressstart-16", delayMs: 0 },
  { left: -18, top: 20, fontKey: "pressstart-8", delayMs: 500 }, // `...:111` `animation-delay: .5s`.
];
const HA_SHADOW_OFFSET = 2; // `...:110` `text-shadow: 2px 2px 0 #7b2fbe`.
const HA_SCALE_FROM = 0.6;
const HA_SCALE_TO = 1.2;
const HA_DX = 18;
const HA_DY = -30;
const HA_ALPHA_FROM = 0;
const HA_DURATION_MS = 1600;

function haFloat(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const tweens: Phaser.Tweens.Tween[] = [];
  for (const span of HA_SPANS) {
    const [left, top] = localOf(sprite, span.left, span.top);
    const main = scene.add.bitmapText(0, 0, span.fontKey, "HA");
    const cx = left + main.width / 2;
    const cy = top + main.height / 2;
    const shadow = scene.add
      .bitmapText(cx + HA_SHADOW_OFFSET, cy + HA_SHADOW_OFFSET, span.fontKey, "HA")
      .setOrigin(0.5, 0.5)
      .setTint(COLORS.purple)
      .setScale(HA_SCALE_FROM)
      .setAlpha(HA_ALPHA_FROM);
    main
      .setPosition(cx, cy)
      .setOrigin(0.5, 0.5)
      .setTint(COLORS.textGoblin)
      .setScale(HA_SCALE_FROM)
      .setAlpha(HA_ALPHA_FROM);
    container.add(shadow);
    container.add(main);
    tweens.push(
      scene.tweens.add({
        targets: [shadow, main],
        x: `+=${HA_DX}`,
        y: `+=${HA_DY}`,
        scale: HA_SCALE_TO,
        alpha: 1,
        duration: HA_DURATION_MS,
        delay: span.delayMs,
        yoyo: true,
        repeat: -1,
        ease: steppedEase(DEFAULT_STEPS),
      }),
    );
  }
  return { tweens };
}

// `reference/design/Scene 2 - Rooftop Relief.dc.html:40` the stage wrapper's own `zoom`, which scales
// every stage-local length below it — an overlay's width and height as much as its offsets.
const SCENE_2_ZOOM = 0.82;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:83` Spidey's wrapper, whose box is his `<img>`'s box.
const SPIDEY_WRAPPER_LEFT = 556;
const SPIDEY_WRAPPER_BOTTOM = 250;
const SPIDEY_WRAPPER_HEIGHT = 400;
// The wrapper's top edge, as a height above the stage's own bottom, which is what a dot's `bottom:` is measured from.
const SPIDEY_WRAPPER_TOP = SPIDEY_WRAPPER_BOTTOM + SPIDEY_WRAPPER_HEIGHT;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:21,84` `animation: shiver 3.4s steps(2, end)` — translateX 0 to 2px and back, on the whole actor.
const SHIVER_DX = 2;
const SHIVER_STEPS = 2;
const SHIVER_DURATION_MS = 1700;

function shiver(scene: Phaser.Scene, container: Phaser.GameObjects.Container): EffectHandle {
  const tween = scene.tweens.add({
    targets: container,
    x: container.x + Math.round(SHIVER_DX * SCENE_2_ZOOM),
    duration: SHIVER_DURATION_MS,
    yoyo: true,
    repeat: -1,
    ease: steppedEase(SHIVER_STEPS),
  });
  return { tweens: [tween] };
}

// `reference/design/Scene 2 - Rooftop Relief.dc.html:85` a 224x16 shadow at `left: -8; top: 394` in the 400-tall wrapper, so its top sits 6px above his feet.
const FEET_SHADOW_LEFT = -8;
const FEET_SHADOW_TOP = 394;
const FEET_SHADOW_W = 224;
const FEET_SHADOW_H = 16;
// The gradient's `rgba(6, 12, 32, .7)` centre stop fades to nothing at 70%, so the flat fill that stands in
// for it is taken down to the same 0.5 the 1.x ground shadow uses, since a Shape has no gradient fill.
const FEET_SHADOW_ALPHA = 0.5;

function feetShadow(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  const [left, top] = localOfFeet(
    sprite,
    FEET_SHADOW_LEFT * SCENE_2_ZOOM,
    (SPIDEY_WRAPPER_HEIGHT - FEET_SHADOW_TOP) * SCENE_2_ZOOM,
  );
  const w = FEET_SHADOW_W * SCENE_2_ZOOM;
  const h = FEET_SHADOW_H * SCENE_2_ZOOM;
  const shadow = scene.add
    .ellipse(left + w / 2, top + h / 2, w, h, COLORS.groundShadow)
    .setAlpha(FEET_SHADOW_ALPHA);
  container.add(shadow);
  return { tweens: [] };
}

interface StreamDot {
  /** The mockup's own stage-local `left:`. */
  readonly x: number;
  /** The mockup's own stage-local `bottom:`. */
  readonly bottom: number;
  readonly size: number;
  readonly delayMs: number;
}

// `reference/design/Scene 2 - Rooftop Relief.dc.html:176-191` the arc's own 44-step arithmetic at the
// default `streamReach` of 1: the outward travel eases off, the fall accelerates, and the dot grows in
// two thresholds, ported as arithmetic rather than a baked table so it stays the mockup's own numbers.
const STREAM_COUNT = 44;
const STREAM_START_X = 668;
const STREAM_START_BOTTOM = 394;
const STREAM_END_BOTTOM = -40;
const STREAM_END_X = STREAM_START_X + 470;
const STREAM_DELAY_STEP_MS = 50;

function streamDots(): readonly StreamDot[] {
  const dots: StreamDot[] = [];
  for (let i = 0; i < STREAM_COUNT; i++) {
    const t = i / (STREAM_COUNT - 1);
    const xt = 1 - (1 - t) * (1 - t);
    const bt = t * t;
    dots.push({
      x: Math.round(STREAM_START_X + (STREAM_END_X - STREAM_START_X) * xt),
      bottom: Math.round(STREAM_START_BOTTOM - (STREAM_START_BOTTOM - STREAM_END_BOTTOM) * bt),
      size: i < 6 ? 6 : i < 22 ? 7 : 8,
      delayMs: i * STREAM_DELAY_STEP_MS,
    });
  }
  return dots;
}

const STREAM_DOTS = streamDots();

// `reference/design/Scene 2 - Rooftop Relief.dc.html:20,97` `animation: stream 0.5s steps(2, end)` — opacity 1 to .55 and back, each dot 50ms behind the last.
const STREAM_ALPHA_TO = 0.55;
const STREAM_STEPS = 2;
const STREAM_DURATION_MS = 250;

function streamArc(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
): EffectHandle {
  // The tail of the arc falls past the bottom of the mockup's own frame, and `drawSceneBg` has already
  // painted the octagon frame panels by the time an overlay draws, so a dot below the play area is dropped.
  const playBottom = PLAY_AREA.y + PLAY_AREA.height;
  const tweens: Phaser.Tweens.Tween[] = [];
  for (const dot of STREAM_DOTS) {
    const [left, top] = localOf(
      sprite,
      (dot.x - SPIDEY_WRAPPER_LEFT) * SCENE_2_ZOOM,
      (SPIDEY_WRAPPER_TOP - dot.bottom - dot.size) * SCENE_2_ZOOM,
    );
    if (container.y + top >= playBottom) {
      continue;
    }
    const size = dot.size * SCENE_2_ZOOM;
    const drop = scene.add
      .rectangle(left + size / 2, top + size / 2, size, size, COLORS.streamDrop)
      .setAlpha(1);
    container.add(drop);
    tweens.push(
      scene.tweens.add({
        targets: drop,
        alpha: STREAM_ALPHA_TO,
        duration: STREAM_DURATION_MS,
        delay: dot.delayMs,
        yoyo: true,
        repeat: -1,
        ease: steppedEase(STREAM_STEPS),
      }),
    );
  }
  return { tweens };
}

const RECIPES: Record<string, Recipe> = {
  bob,
  droop,
  "flame-pulse": flamePulse,
  "ground-shadow": groundShadow,
  blush,
  "sad-eyebrows": sadEyebrows,
  "sad-eyes": sadEyes,
  "heart-eyes": heartEyes,
  "kiss-mouth": kissMouth,
  "tear-drip": tearDrip,
  "frown-mouth": frownMouth,
  "flying-kiss": flyingKiss,
  bouquet,
  "floating-hearts": floatingHearts,
  "cackle-mouth": cackleMouth,
  "tear-fall": tearFall,
  "ha-float": haFloat,
  shiver,
  "feet-shadow": feetShadow,
  "stream-arc": streamArc,
};

/**
 * Attaches the effect registered as `id` to `container`/`sprite`, adding its overlay children (if any)
 * and starting its tweens (if any).
 *
 * Throws if `id` has no registered effect — a missing effect is a bug to surface loudly, never a silently
 * skipped attach. The returned handle's `tweens` is what a caller kills before destroying `container`.
 */
export function attachEffect(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  sprite: Phaser.GameObjects.Image,
  id: string,
): EffectHandle {
  const recipe = RECIPES[id];
  if (!recipe) {
    throw new Error(`attachEffect: no effect registered for id "${id}"`);
  }
  return recipe(scene, container, sprite);
}
