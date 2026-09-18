import type Phaser from "phaser";
import { BLINK_MS, PROMPT_PLAQUE_SLICE } from "../config/tuning.ts";
import { COLORS } from "./colors.ts";

// `reference/design/Scene 2 - Rooftop Relief.dc.html:120` `padding: 11px 26px` inside the prompt plaque's inner clip.
const PAD_X = 26;
const PAD_Y = 11;
// Same line's `gap: 14px`, trimmed to the space between the drawn marker and the label.
const MARKER_GAP = 14;
// `reference/design/Game UI.dc.html:220` draws its own `9px` square marker beside a Silkscreen label — the same idiom, since no font here has a `◼` glyph (missing-glyph lists in `scripts/lib/bmfont-xml.test.ts`).
const MARKER_SIZE = 9;
// `reference/design/Scene 2 - Rooftop Relief.dc.html:121`'s `.12em` at 13 px scales to `.12 * 16 = 1.92` for silkscreen-16 runs, rounded to a whole pixel.
const LETTER_SPACING = 2;

export interface PressPlaqueOptions {
  readonly label: string;
  /** The plaque is horizontally centred on this x. */
  readonly centerX: number;
  /** The y of the plaque's bottom edge, not its top. */
  readonly bottomY: number;
  readonly blink: boolean;
}

/** Builds the "◼ LABEL" prompt-plaque idiom — a `plaque-9` nine-slice, a square marker, and a Silkscreen label, horizontally centred on `centerX` with its bottom edge at `bottomY` — blinking the marker and label together when `blink` is set. */
export function createPressPlaque(
  scene: Phaser.Scene,
  options: PressPlaqueOptions,
): Phaser.GameObjects.Container {
  const { label: labelText, centerX, bottomY, blink } = options;

  const label = scene.add
    .bitmapText(0, 0, "silkscreen-16", labelText)
    .setLetterSpacing(LETTER_SPACING);
  const textW = Math.round(label.width);
  const textH = Math.round(label.height);

  const contentW = MARKER_SIZE + MARKER_GAP + textW;
  const contentH = Math.max(MARKER_SIZE, textH);
  const plaqueW = contentW + 2 * PAD_X;
  const plaqueH = contentH + 2 * PAD_Y;
  const plaqueX = Math.round((centerX * 2 - plaqueW) / 2);
  const plaqueY = bottomY - plaqueH;
  const corner = PROMPT_PLAQUE_SLICE.corner;

  const container = scene.add.container(0, 0);

  container.add(
    scene.add
      .nineslice(
        plaqueX,
        plaqueY,
        "plaque-9",
        undefined,
        plaqueW,
        plaqueH,
        corner,
        corner,
        corner,
        corner,
      )
      .setOrigin(0, 0),
  );

  const contentX = plaqueX + PAD_X;
  const contentY = plaqueY + PAD_Y;
  const markerY = contentY + Math.round((contentH - MARKER_SIZE) / 2);
  const textY = contentY + Math.round((contentH - textH) / 2);

  const marker = scene.add
    .rectangle(contentX, markerY, MARKER_SIZE, MARKER_SIZE, COLORS.promptText)
    .setOrigin(0, 0);
  container.add(marker);

  label
    .setPosition(contentX + MARKER_SIZE + MARKER_GAP, textY)
    .setOrigin(0, 0)
    .setTint(COLORS.promptText);
  container.add(label);

  if (blink) {
    scene.time.addEvent({
      delay: BLINK_MS,
      loop: true,
      callback: () => {
        const visible = !marker.visible;
        marker.setVisible(visible);
        label.setVisible(visible);
      },
    });
  }

  return container;
}
