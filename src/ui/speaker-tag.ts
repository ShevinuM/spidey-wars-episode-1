import type Phaser from "phaser";
import type { Speaker } from "../cutscene/script.ts";
import { SPEAKER_STYLE } from "./speaker-style.ts";

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:99` `padding: 4px 8px`, `gap: 6px`, a 7×7 dot.
const PAD_X = 8;
const PAD_Y = 4;
const GAP = 6;
const DOT_SIZE = 7;
// Same line's `box-shadow: 0 0 0 3px` — an outset ring, not an inset border.
const RING_WIDTH = 3;

/**
 * Builds the speaker name tag: a filled box holding a dot and a Silkscreen label of `speaker`'s own name,
 * ringed in the speaker's palette (`speaker-style.ts`).
 *
 * `x`/`y` are the **fill box's** top-left, not the ring's — the 3 px ring is drawn outside the fill's
 * footprint, so it extends 3 px above and to the left of `(x, y)` and 3 px past the fill's other two edges.
 */
export function createSpeakerTag(
  scene: Phaser.Scene,
  x: number,
  y: number,
  speaker: Speaker,
): Phaser.GameObjects.Container {
  const style = SPEAKER_STYLE[speaker];

  const label = scene.add
    .bitmapText(0, 0, "silkscreen-16", speaker)
    .setLetterSpacing(style.tagLetterSpacing);
  const textW = Math.round(label.width);
  const textH = Math.round(label.height);

  const contentH = Math.max(DOT_SIZE, textH);
  const fillW = 2 * PAD_X + DOT_SIZE + GAP + textW;
  const fillH = 2 * PAD_Y + contentH;

  const container = scene.add.container(0, 0);

  // Four opaque bands outside the fill's footprint, the same idiom `TitleScene.buildTitleBlock` uses for its EP.1 strip border.
  const ringX = x - RING_WIDTH;
  const ringY = y - RING_WIDTH;
  const ringOuterW = fillW + 2 * RING_WIDTH;
  container.add(
    scene.add.rectangle(ringX, ringY, ringOuterW, RING_WIDTH, style.tagRing).setOrigin(0, 0),
  );
  container.add(
    scene.add.rectangle(ringX, y + fillH, ringOuterW, RING_WIDTH, style.tagRing).setOrigin(0, 0),
  );
  container.add(scene.add.rectangle(ringX, y, RING_WIDTH, fillH, style.tagRing).setOrigin(0, 0));
  container.add(
    scene.add.rectangle(x + fillW, y, RING_WIDTH, fillH, style.tagRing).setOrigin(0, 0),
  );

  container.add(scene.add.rectangle(x, y, fillW, fillH, style.tagFill).setOrigin(0, 0));

  const dotY = y + Math.round((fillH - DOT_SIZE) / 2);
  container.add(
    scene.add.rectangle(x + PAD_X, dotY, DOT_SIZE, DOT_SIZE, style.tagDot).setOrigin(0, 0),
  );

  const textY = y + Math.round((fillH - textH) / 2);
  label
    .setPosition(x + PAD_X + DOT_SIZE + GAP, textY)
    .setOrigin(0, 0)
    .setTint(style.tagText);
  container.add(label);

  return container;
}
