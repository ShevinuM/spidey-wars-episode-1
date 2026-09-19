import Phaser from "phaser";
import {
  PROMPT_PLAQUE_BORDER,
  PROMPT_PLAQUE_CUT,
  PROMPT_PLAQUE_INNER_CUT,
  TITLE_PLAQUE_BORDER,
  TITLE_PLAQUE_CUT,
  TITLE_PLAQUE_INNER_CUT,
} from "../config/tuning.ts";
import { COLORS } from "../ui/colors.ts";
import { bevel, facade, octagon, plaque, vGradient } from "../ui/primitives.ts";

const WIDTH = 1280;
const HEIGHT = 720;
const BACKDROP_KEY = "primitives-gallery-backdrop";

const ROW_Y = 40;
const ROW_W = 220;
const ROW_H = 100;
const ROW_GAP = 20;

/** The plaque column stacks the prompt and title idioms in the space of one `ROW_H` slot. */
const PLAQUE_BOX_H = 45;
const PLAQUE_BOX_GAP = 10;

/** ◼ has no glyph in any generated font; ▼ has no glyph in either Silkscreen — pinned per font in `scripts/lib/bmfont-xml.test.ts`. */
const PRESSSTART_SAMPLE = "THE QUICK BROWN FOX 0123456789 #▼";
const SILKSCREEN_SAMPLE = "THE QUICK BROWN FOX 0123456789 #v";

const FONT_ROWS: ReadonlyArray<{
  readonly key: string;
  readonly size: number;
  readonly sample: string;
}> = [
  { key: "pressstart-8", size: 8, sample: PRESSSTART_SAMPLE },
  { key: "pressstart-16", size: 16, sample: PRESSSTART_SAMPLE },
  { key: "pressstart-24", size: 24, sample: PRESSSTART_SAMPLE },
  { key: "silkscreen-8", size: 8, sample: SILKSCREEN_SAMPLE },
  { key: "silkscreen-16", size: 16, sample: SILKSCREEN_SAMPLE },
  { key: "silkscreen-bold-16", size: 16, sample: SILKSCREEN_SAMPLE },
];

const FONT_ROW_Y = 200;
const FONT_ROW_GAP = 44;

/** Test-build-only scene: renders every UI primitive and every bitmap font at fixed coordinates so a visual baseline can catch a regression in either. */
export class PrimitivesGalleryScene extends Phaser.Scene {
  constructor() {
    super("PrimitivesGalleryScene");
  }

  create(): void {
    const g = this.make.graphics({}, false);
    g.fillStyle(COLORS.bgDeep, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);

    let x = 40;
    octagon(g, x, ROW_Y, ROW_W, ROW_H, 12, COLORS.frameBlue);
    x += ROW_W + ROW_GAP;

    plaque(g, x, ROW_Y, ROW_W, PLAQUE_BOX_H, {
      cut: PROMPT_PLAQUE_CUT,
      innerCut: PROMPT_PLAQUE_INNER_CUT,
      border: PROMPT_PLAQUE_BORDER,
      borderColor: COLORS.frameBlue,
      fillColor: COLORS.plaqueFill,
    });
    plaque(g, x, ROW_Y + PLAQUE_BOX_H + PLAQUE_BOX_GAP, ROW_W, PLAQUE_BOX_H, {
      cut: TITLE_PLAQUE_CUT,
      innerCut: TITLE_PLAQUE_INNER_CUT,
      border: TITLE_PLAQUE_BORDER,
      borderColor: COLORS.frameBlue,
      fillColor: COLORS.titleFill,
    });
    x += ROW_W + ROW_GAP;

    bevel(g, x, ROW_Y, ROW_W, ROW_H, {
      fillColor: COLORS.frameDeep,
      outlineColor: COLORS.ink,
      highlightColor: COLORS.paper,
      shadowColor: COLORS.buildingEdge,
      outlineWidth: 3,
      bevelWidth: 4,
    });
    x += ROW_W + ROW_GAP;

    facade(g, x, ROW_Y, ROW_W, ROW_H, {
      baseColor: COLORS.buildingMid,
      windowColor: COLORS.amber,
      windowW: 6,
      windowH: 10,
      gapX: 6,
      gapY: 8,
    });
    x += ROW_W + ROW_GAP;

    vGradient(g, x, ROW_Y, ROW_W, ROW_H, [
      { stop: 0, color: COLORS.frameDeep },
      { stop: 1, color: COLORS.frameBlue },
    ]);

    g.generateTexture(BACKDROP_KEY, WIDTH, HEIGHT);
    g.destroy();

    this.add.image(0, 0, BACKDROP_KEY).setOrigin(0, 0);

    FONT_ROWS.forEach(({ key, size, sample }, i) => {
      this.add.bitmapText(40, FONT_ROW_Y + i * FONT_ROW_GAP, key, sample, size).setOrigin(0, 0);
    });
  }
}
