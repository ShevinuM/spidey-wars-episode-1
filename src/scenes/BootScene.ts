import Phaser from "phaser";
import {
  BALLOON_BEVEL,
  BALLOON_BORDER,
  BALLOON_INNER_BORDER,
  BALLOON_PAD,
  BALLOON_SLICE,
  PROMPT_PLAQUE_BORDER,
  PROMPT_PLAQUE_CUT,
  PROMPT_PLAQUE_INNER_CUT,
  PROMPT_PLAQUE_SLICE,
  TITLE_PLAQUE_BORDER,
  TITLE_PLAQUE_CUT,
  TITLE_PLAQUE_INNER_CUT,
  TITLE_PLAQUE_SLICE,
} from "../config/tuning.ts";
import { crtOverlay } from "../ui/crt-overlay.ts";
import { COLORS } from "../ui/colors.ts";
import { bevel, octagon, plaque, type GradientStop, vGradient } from "../ui/primitives.ts";

/** Sky gradient stops, ported from `reference/design/*.dc.html`'s scene backdrop (the six non-HUD mockups share this stop set). */
const SKY_GRADIENT: readonly GradientStop[] = [
  { stop: 0, color: COLORS.skyTop },
  { stop: 0.3, color: COLORS.skyUpper },
  { stop: 0.58, color: COLORS.skyMid },
  { stop: 0.82, color: COLORS.skyLow },
  { stop: 1, color: COLORS.skyBottom },
];

const BAKE_WIDTH = 1280;
const BAKE_HEIGHT = 720;

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.bitmapFont("pressstart-8", "fonts/pressstart-8.png", "fonts/pressstart-8.xml");
    this.load.bitmapFont("pressstart-16", "fonts/pressstart-16.png", "fonts/pressstart-16.xml");
    this.load.bitmapFont("pressstart-24", "fonts/pressstart-24.png", "fonts/pressstart-24.xml");
    this.load.bitmapFont("silkscreen-8", "fonts/silkscreen-8.png", "fonts/silkscreen-8.xml");
    this.load.bitmapFont("silkscreen-16", "fonts/silkscreen-16.png", "fonts/silkscreen-16.xml");
    this.load.bitmapFont(
      "silkscreen-bold-16",
      "fonts/silkscreen-bold-16.png",
      "fonts/silkscreen-bold-16.xml",
    );
    this.load.atlas("sprites", "sprites/atlas.png", "sprites/atlas.json");
  }

  create(): void {
    this.bake("sky", BAKE_WIDTH, BAKE_HEIGHT, (g) => {
      vGradient(g, 0, 0, BAKE_WIDTH, BAKE_HEIGHT, SKY_GRADIENT);
    });

    this.bake("crt", BAKE_WIDTH, BAKE_HEIGHT, (g) => {
      crtOverlay(g, BAKE_WIDTH, BAKE_HEIGHT);
    });

    this.bake("plaque-9", PROMPT_PLAQUE_SLICE.width, PROMPT_PLAQUE_SLICE.height, (g) => {
      plaque(g, 0, 0, PROMPT_PLAQUE_SLICE.width, PROMPT_PLAQUE_SLICE.height, {
        cut: PROMPT_PLAQUE_CUT,
        innerCut: PROMPT_PLAQUE_INNER_CUT,
        border: PROMPT_PLAQUE_BORDER,
        borderColor: COLORS.frameBlue,
        fillColor: COLORS.plaqueFill,
      });
    });

    this.bake("title-plaque-9", TITLE_PLAQUE_SLICE.width, TITLE_PLAQUE_SLICE.height, (g) => {
      plaque(g, 0, 0, TITLE_PLAQUE_SLICE.width, TITLE_PLAQUE_SLICE.height, {
        cut: TITLE_PLAQUE_CUT,
        innerCut: TITLE_PLAQUE_INNER_CUT,
        border: TITLE_PLAQUE_BORDER,
        borderColor: COLORS.frameBlue,
        fillColor: COLORS.titleFill,
      });
    });

    this.bake("balloon-9", BALLOON_SLICE.width, BALLOON_SLICE.height, (g) => {
      const { width: w, height: h } = BALLOON_SLICE;
      octagon(g, 0, 0, w, h, 0, COLORS.ink);
      octagon(
        g,
        BALLOON_BORDER,
        BALLOON_BORDER,
        w - 2 * BALLOON_BORDER,
        h - 2 * BALLOON_BORDER,
        0,
        COLORS.paper,
      );
      const frameInset = BALLOON_BORDER + BALLOON_PAD;
      bevel(g, frameInset, frameInset, w - 2 * frameInset, h - 2 * frameInset, {
        fillColor: COLORS.paper,
        outlineColor: COLORS.frameBlue,
        highlightColor: COLORS.paper,
        shadowColor: COLORS.frameMid,
        outlineWidth: BALLOON_INNER_BORDER,
        bevelWidth: BALLOON_BEVEL,
      });
    });

    window.__READY__ = true;
    this.scene.launch("TitleScene");
  }

  /** Draws into a throwaway `Graphics` object, snapshots it as a texture, then destroys it — never left in the display list (`docs/rules/tech-stack/phaser.md` R005). */
  private bake(
    key: string,
    width: number,
    height: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    const g = this.make.graphics({}, false);
    draw(g);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
