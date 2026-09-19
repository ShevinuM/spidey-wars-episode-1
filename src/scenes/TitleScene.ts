import Phaser from "phaser";
import { FLOW } from "../config/flow.ts";
import { TITLE_PLAQUE_SLICE } from "../config/tuning.ts";
import { COLORS } from "../ui/colors.ts";
import { createPressPlaque } from "../ui/press-plaque.ts";

interface TitleSceneData {
  readonly blink?: boolean;
}

const WIDTH = 1280;
const HEIGHT = 720;

const SUBTITLE = "EPISODE 1 — GOBLIN TOOK MY GIRL";
const PROMPT_LABEL = "CLICK TO START";

// `reference/design/Game UI.dc.html:162` `padding: 12px 34px` inside the title plaque's inner clip.
const TITLE_PAD_X = 34;
const TITLE_PAD_Y = 12;
const TITLE_TOP_Y = 96;
// `reference/design/Game UI.dc.html:163` `text-shadow: 0 3px 0 #14345e`.
const TITLE_SHADOW_OFFSET = 3;
// `reference/design/Game UI.dc.html:160` `gap: 8px` between the title plaque and the EP.1 strip.
const TITLE_STRIP_GAP = 8;
// `reference/design/Game UI.dc.html:170` `padding: 5px 12px` on the EP.1 strip.
const TITLE_STRIP_PAD_X = 12;
const TITLE_STRIP_PAD_Y = 5;
// `reference/design/Game UI.dc.html:170` `box-shadow: 0 0 0 3px #1a4f82`.
const TITLE_STRIP_BORDER = 3;
// Same line's `background: rgba(4, 10, 30, .82)` — `COLORS.titleFill` is that same rgb triple.
const TITLE_STRIP_FILL_ALPHA = 0.82;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:118` `bottom: 18px`.
const PROMPT_BOTTOM_Y = 18;

// `reference/design/Game UI.dc.html:163` `letter-spacing: .04em` at 19 px scales to `.04 * 24 = 0.96` for the pressstart-24 title run, rounded to a whole pixel.
const TITLE_LETTER_SPACING = 1;
// `reference/design/Game UI.dc.html:170-172`'s `.12em` at 11 px scales to `.12 * 16 = 1.92` for the EP.1 strip's silkscreen-16 run, rounded to a whole pixel.
const SILKSCREEN_LETTER_SPACING = 2;

export class TitleScene extends Phaser.Scene {
  private blinkEnabled = true;

  constructor() {
    super("TitleScene");
  }

  init(data: TitleSceneData): void {
    this.blinkEnabled = data?.blink ?? true;
  }

  create(): void {
    this.add.image(0, 0, "sky").setOrigin(0, 0).setDepth(0);

    this.buildTitleBlock();
    createPressPlaque(this, {
      label: PROMPT_LABEL,
      centerX: WIDTH / 2,
      bottomY: HEIGHT - PROMPT_BOTTOM_Y,
      blink: this.blinkEnabled,
    }).setDepth(1);

    this.add.image(0, 0, "crt").setOrigin(0, 0).setDepth(10);

    this.input.once(Phaser.Input.Events.POINTER_DOWN, () =>
      this.scene.start("CutsceneScene", { id: FLOW[0] }),
    );
  }

  private buildTitleBlock(): void {
    const shadowLabel = this.add
      .bitmapText(0, 0, "pressstart-24", "SPIDEY WARS")
      .setLetterSpacing(TITLE_LETTER_SPACING);
    const textW = Math.round(shadowLabel.width);
    const textH = Math.round(shadowLabel.height);

    const titleW = textW + 2 * TITLE_PAD_X;
    const titleH = textH + 2 * TITLE_PAD_Y;
    const titleX = Math.round((WIDTH - titleW) / 2);
    const titleY = TITLE_TOP_Y;
    const corner = TITLE_PLAQUE_SLICE.corner;

    this.add
      .nineslice(
        titleX,
        titleY,
        "title-plaque-9",
        undefined,
        titleW,
        titleH,
        corner,
        corner,
        corner,
        corner,
      )
      .setOrigin(0, 0)
      .setDepth(1);

    const textX = titleX + TITLE_PAD_X;
    const textY = titleY + TITLE_PAD_Y;
    shadowLabel
      .setPosition(textX, textY + TITLE_SHADOW_OFFSET)
      .setOrigin(0, 0)
      .setTint(COLORS.titleShadow)
      .setDepth(2);
    this.add
      .bitmapText(textX, textY, "pressstart-24", "SPIDEY WARS")
      .setLetterSpacing(TITLE_LETTER_SPACING)
      .setOrigin(0, 0)
      .setTint(COLORS.titleText)
      .setDepth(3);

    const subtitleLabel = this.add
      .bitmapText(0, 0, "silkscreen-16", SUBTITLE)
      .setLetterSpacing(SILKSCREEN_LETTER_SPACING);
    const subtitleTextW = Math.round(subtitleLabel.width);
    const subtitleTextH = Math.round(subtitleLabel.height);
    const stripW = subtitleTextW + 2 * TITLE_STRIP_PAD_X;
    const stripH = subtitleTextH + 2 * TITLE_STRIP_PAD_Y;
    const stripX = Math.round((WIDTH - stripW) / 2);
    const stripY = titleY + titleH + TITLE_STRIP_GAP;

    // A stroke centred on the rectangle's own path would eat half the coded padding, so the border is four opaque bands outside the fill's footprint, leaving the translucent fill to composite only against the sky underneath it.
    const stripBorderX = stripX - TITLE_STRIP_BORDER;
    const stripBorderY = stripY - TITLE_STRIP_BORDER;
    const stripOuterW = stripW + 2 * TITLE_STRIP_BORDER;
    this.add
      .rectangle(stripBorderX, stripBorderY, stripOuterW, TITLE_STRIP_BORDER, COLORS.frameMid)
      .setOrigin(0, 0)
      .setDepth(1);
    this.add
      .rectangle(stripBorderX, stripY + stripH, stripOuterW, TITLE_STRIP_BORDER, COLORS.frameMid)
      .setOrigin(0, 0)
      .setDepth(1);
    this.add
      .rectangle(stripBorderX, stripY, TITLE_STRIP_BORDER, stripH, COLORS.frameMid)
      .setOrigin(0, 0)
      .setDepth(1);
    this.add
      .rectangle(stripX + stripW, stripY, TITLE_STRIP_BORDER, stripH, COLORS.frameMid)
      .setOrigin(0, 0)
      .setDepth(1);

    this.add
      .rectangle(stripX, stripY, stripW, stripH, COLORS.titleFill, TITLE_STRIP_FILL_ALPHA)
      .setOrigin(0, 0)
      .setDepth(2);

    subtitleLabel
      .setPosition(stripX + TITLE_STRIP_PAD_X, stripY + TITLE_STRIP_PAD_Y)
      .setOrigin(0, 0)
      .setTint(COLORS.titleText)
      .setDepth(3);
  }
}
