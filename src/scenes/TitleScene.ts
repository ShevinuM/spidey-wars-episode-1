import Phaser from "phaser";
import { BLINK_MS, PROMPT_PLAQUE_SLICE, TITLE_PLAQUE_SLICE } from "../config/tuning.ts";
import { COLORS } from "../ui/colors.ts";

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
const TITLE_STRIP_STROKE_WIDTH = 3;
// Same line's `background: rgba(4, 10, 30, .82)` — `COLORS.titleFill` is that same rgb triple.
const TITLE_STRIP_FILL_ALPHA = 0.82;

// `reference/design/Scene 2 - Rooftop Relief.dc.html:120` `padding: 11px 26px` inside the prompt plaque's inner clip.
const PROMPT_PAD_X = 26;
const PROMPT_PAD_Y = 11;
// Same line's `gap: 14px`, trimmed to the space between the drawn marker and the label.
const PROMPT_MARKER_GAP = 14;
// `reference/design/Game UI.dc.html:220` draws its own `9px` square marker beside a Silkscreen label — the same idiom, since no font here has a `◼` glyph (missing-glyph lists in `scripts/lib/bmfont-xml.test.ts`).
const PROMPT_MARKER_SIZE = 9;
// `reference/design/Scene 2 - Rooftop Relief.dc.html:118` `bottom: 18px`.
const PROMPT_BOTTOM_Y = 18;

export class TitleScene extends Phaser.Scene {
  private blinkEnabled = true;
  private promptMarker!: Phaser.GameObjects.Rectangle;
  private promptLabel!: Phaser.GameObjects.BitmapText;

  constructor() {
    super("TitleScene");
  }

  init(data: TitleSceneData): void {
    this.blinkEnabled = data?.blink ?? true;
  }

  create(): void {
    this.add.image(0, 0, "sky").setOrigin(0, 0).setDepth(0);

    this.buildTitleBlock();
    this.buildPromptBlock();

    this.add.image(0, 0, "crt").setOrigin(0, 0).setDepth(10);

    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => this.scene.restart());
  }

  private buildTitleBlock(): void {
    const shadowLabel = this.add.bitmapText(0, 0, "pressstart-24", "SPIDEY WARS");
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
      .setOrigin(0, 0)
      .setTint(COLORS.titleText)
      .setDepth(3);

    const subtitleLabel = this.add.bitmapText(0, 0, "silkscreen-16", SUBTITLE);
    const subtitleTextW = Math.round(subtitleLabel.width);
    const subtitleTextH = Math.round(subtitleLabel.height);
    const stripW = subtitleTextW + 2 * TITLE_STRIP_PAD_X;
    const stripH = subtitleTextH + 2 * TITLE_STRIP_PAD_Y;
    const stripX = Math.round((WIDTH - stripW) / 2);
    const stripY = titleY + titleH + TITLE_STRIP_GAP;

    this.add
      .rectangle(stripX, stripY, stripW, stripH, COLORS.titleFill, TITLE_STRIP_FILL_ALPHA)
      .setOrigin(0, 0)
      .setStrokeStyle(TITLE_STRIP_STROKE_WIDTH, COLORS.frameMid)
      .setDepth(1);

    subtitleLabel
      .setPosition(stripX + TITLE_STRIP_PAD_X, stripY + TITLE_STRIP_PAD_Y)
      .setOrigin(0, 0)
      .setTint(COLORS.titleText)
      .setDepth(2);
  }

  private buildPromptBlock(): void {
    const label = this.add.bitmapText(0, 0, "silkscreen-16", PROMPT_LABEL);
    const textW = Math.round(label.width);
    const textH = Math.round(label.height);

    const contentW = PROMPT_MARKER_SIZE + PROMPT_MARKER_GAP + textW;
    const contentH = Math.max(PROMPT_MARKER_SIZE, textH);
    const plaqueW = contentW + 2 * PROMPT_PAD_X;
    const plaqueH = contentH + 2 * PROMPT_PAD_Y;
    const plaqueX = Math.round((WIDTH - plaqueW) / 2);
    const plaqueY = HEIGHT - PROMPT_BOTTOM_Y - plaqueH;
    const corner = PROMPT_PLAQUE_SLICE.corner;

    this.add
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
      .setOrigin(0, 0)
      .setDepth(1);

    const contentX = plaqueX + PROMPT_PAD_X;
    const contentY = plaqueY + PROMPT_PAD_Y;
    const markerY = contentY + Math.round((contentH - PROMPT_MARKER_SIZE) / 2);
    const textY = contentY + Math.round((contentH - textH) / 2);

    this.promptMarker = this.add
      .rectangle(contentX, markerY, PROMPT_MARKER_SIZE, PROMPT_MARKER_SIZE, COLORS.promptText)
      .setOrigin(0, 0)
      .setDepth(2);

    this.promptLabel = label
      .setPosition(contentX + PROMPT_MARKER_SIZE + PROMPT_MARKER_GAP, textY)
      .setOrigin(0, 0)
      .setTint(COLORS.promptText)
      .setDepth(2);

    if (this.blinkEnabled) {
      this.time.addEvent({
        delay: BLINK_MS,
        loop: true,
        callback: () => {
          const visible = !this.promptMarker.visible;
          this.promptMarker.setVisible(visible);
          this.promptLabel.setVisible(visible);
        },
      });
    }
  }
}
