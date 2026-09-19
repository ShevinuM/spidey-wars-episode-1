import type Phaser from "phaser";
import { steppedEase } from "../cutscene/effects.ts";
import { COLORS } from "./colors.ts";

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

const RECIPES: Record<string, Recipe> = {
  bob,
  "flame-pulse": flamePulse,
  "ground-shadow": groundShadow,
  blush,
  "heart-eyes": heartEyes,
  "kiss-mouth": kissMouth,
  "flying-kiss": flyingKiss,
  bouquet,
  "floating-hearts": floatingHearts,
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
