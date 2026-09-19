import Phaser from "phaser";
import { CUTSCENES, nextCutsceneId } from "../config/flow.ts";
import { BALLOON_BORDER, SPRITE_SCALE } from "../config/tuning.ts";
import {
  advance as advancePlayer,
  newPlayer,
  phaseOf,
  setStep as setPlayerStep,
  visibleCharsOf,
  type PlayerPhase,
  type PlayerState,
} from "../cutscene/player.ts";
import { beatCharCount, type Beat, type Speaker } from "../cutscene/script.ts";
import {
  advance as advanceStepper,
  newStepper,
  setStep as setStepperStep,
  type Stepper,
} from "../cutscene/stepper.ts";
import { DEFAULT_CPS } from "../cutscene/typewriter.ts";
import {
  createBalloon,
  type Balloon,
  type BalloonOptions,
  type BalloonTail,
} from "../ui/balloon.ts";
import { crtOverlay } from "../ui/crt-overlay.ts";
import { drawSceneBg, groundYOf, PLAY_AREA } from "../ui/draw-scene-bg.ts";
import { createPressPlaque } from "../ui/press-plaque.ts";
import { createSpeakerTag } from "../ui/speaker-tag.ts";

interface CutsceneSceneData {
  readonly id?: string;
}

interface CutsceneState {
  readonly id: string;
  readonly beat: number;
  readonly phase: PlayerPhase;
  readonly visibleChars: number;
  readonly totalChars: number;
}

const WIDTH = 1280;
const HEIGHT = 720;

const CRT_PLAY_KEY = "crt-play";

// Px between a tagged actor's sprite top and the name tag's ring.
const TAG_GAP_ABOVE_SPRITE = 10;

// Ruling 43 — `Scene 2.1 - Spider-Sense.dc.html:128-129` puts a 400px paper box 25px from the play
// area's right edge and 118px from its top, and the nine-slice `createBalloon` draws is that box plus
// the `BALLOON_BORDER`-wide ink ring on every edge.
const BALLOON_PAPER_WIDTH = 400;
const BALLOON_RIGHT_INSET = 25;
const BALLOON_TOP_INSET = 118;
const BALLOON_WIDTH = BALLOON_PAPER_WIDTH + 2 * BALLOON_BORDER;
const BALLOON_X =
  PLAY_AREA.x + PLAY_AREA.width - (BALLOON_RIGHT_INSET - BALLOON_BORDER) - BALLOON_WIDTH;
const BALLOON_Y = PLAY_AREA.y + (BALLOON_TOP_INSET - BALLOON_BORDER);

// `Scene 2.1 - Spider-Sense.dc.html:135` puts the tail's centre at `top: 52%` of the balloon's own
// height, but `createBalloon` needs `tail` before that height exists (ruling 43) — 192 is ≈52% of the
// demo's first-beat balloon height of 369px, read back once against the real bitmap-font metrics while
// building this scene.
const BALLOON_TAIL_OFFSET = 192;

// `Scene 2.1 - Spider-Sense.dc.html:144` `bottom: 18px` of the play area.
const PROMPT_BOTTOM_INSET = 18;

/**
 * Plays one `Beat[]` script looked up by id (`src/config/flow.ts`'s `CUTSCENES`).
 *
 * Draws a backdrop, per-beat actors and name tags, a typewriter dialogue balloon, and a "press space"
 * prompt once the beat's line is fully shown, advancing on Space or a click; the last beat hands off to
 * the next cutscene in `FLOW` or back to `TitleScene`.
 */
export class CutsceneScene extends Phaser.Scene {
  private id!: string;
  private script!: readonly Beat[];

  /**
   * Invariant: `stepper.step` and `player.elapsedSteps` stay equal at all times.
   *
   * Every path that changes one — `update`, `advance`, `stepTo`, and a beat change (which resets both to
   * 0) — changes the other in the same step, or a later skip silently rewinds the typewriter.
   */
  private stepper: Stepper = newStepper();
  private player: PlayerState = newPlayer();

  private beatObjects: Phaser.GameObjects.GameObject[] = [];
  private balloon: Balloon | undefined;
  private plaque: Phaser.GameObjects.Container | undefined;

  constructor() {
    super("CutsceneScene");
  }

  init(data: CutsceneSceneData): void {
    const id = data.id;
    const script = id !== undefined ? CUTSCENES[id] : undefined;
    if (id === undefined || !script) {
      throw new Error(`CutsceneScene.init: unknown cutscene id "${id}"`);
    }
    this.id = id;
    this.script = script;
    this.stepper = newStepper();
    this.player = newPlayer();
    this.beatObjects = [];
    this.balloon = undefined;
    this.plaque = undefined;
  }

  create(): void {
    const beat = this.script[this.player.beat];
    const bgKey = `bg-${beat.bg}`;

    if (!this.textures.exists(bgKey)) {
      this.bake(bgKey, WIDTH, HEIGHT, (g) => drawSceneBg(g, beat.bg));
    }
    if (!this.textures.exists(CRT_PLAY_KEY)) {
      this.bake(CRT_PLAY_KEY, PLAY_AREA.width, PLAY_AREA.height, (g) =>
        crtOverlay(g, PLAY_AREA.width, PLAY_AREA.height),
      );
    }

    this.add.image(0, 0, bgKey).setOrigin(0, 0).setDepth(0);
    this.rebuildBeat();
    this.sync();
    this.add.image(PLAY_AREA.x, PLAY_AREA.y, CRT_PLAY_KEY).setOrigin(0, 0).setDepth(10);

    this.input.keyboard?.on("keydown-SPACE", () => this.advance());
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => this.advance());
  }

  update(_time: number, delta: number): void {
    if (this.time.paused === false) {
      advanceStepper(this.stepper, delta);
      this.player = setPlayerStep(this.player, this.stepper.step);
    }
    this.sync();
  }

  /** Sets the current beat's elapsed steps absolutely (never accumulating) and syncs the visuals. */
  stepTo(n: number): void {
    this.player = setPlayerStep(this.player, n);
    this.stepper = newStepper();
    setStepperStep(this.stepper, n);
    this.sync();
  }

  state(): CutsceneState {
    const phase = phaseOf(this.player, this.script, DEFAULT_CPS);
    const visibleChars = visibleCharsOf(this.player, this.script, DEFAULT_CPS);
    const totalChars =
      this.player.beat < this.script.length ? beatCharCount(this.script[this.player.beat]) : 0;
    return { id: this.id, beat: this.player.beat, phase, visibleChars, totalChars };
  }

  private advance(): void {
    const beatBefore = this.player.beat;
    const result = advancePlayer(this.player, this.script, DEFAULT_CPS);

    if (result.finished) {
      const next = nextCutsceneId(this.id);
      if (next === null) {
        this.scene.start("TitleScene");
      } else {
        this.scene.start("CutsceneScene", { id: next });
      }
      return;
    }

    this.player = result;
    this.stepper = newStepper();
    setStepperStep(this.stepper, this.player.elapsedSteps);
    if (this.player.beat !== beatBefore) {
      this.rebuildBeat();
    }
    this.sync();
  }

  /** Destroys the previous beat's actors, tags, balloon and plaque, then builds the current beat's. */
  private rebuildBeat(): void {
    for (const obj of this.beatObjects) obj.destroy();
    this.beatObjects = [];

    const beat = this.script[this.player.beat];
    const groundY = groundYOf(beat.bg);

    for (const placement of beat.actors) {
      const localY = placement.y ?? groundY;
      const scale = placement.scale ?? SPRITE_SCALE[placement.frame as keyof typeof SPRITE_SCALE];
      const image = this.add
        .image(PLAY_AREA.x + placement.x, PLAY_AREA.y + localY, "sprites", placement.frame)
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setFlipX(placement.flipX ?? false);
      this.beatObjects.push(image);

      if (placement.tag) {
        this.beatObjects.push(this.buildSpeakerTag(image, placement.tag));
      }
    }

    const tail: BalloonTail = { side: "left", offset: BALLOON_TAIL_OFFSET };
    const balloonOptions: BalloonOptions = {
      x: BALLOON_X,
      y: BALLOON_Y,
      width: BALLOON_WIDTH,
      lines: beat.lines,
      speaker: beat.speaker,
      tail,
    };
    const balloon = createBalloon(this, balloonOptions);
    // Ruling 39 — set once here, in the same `create`/`rebuildBeat` pass that builds the balloon, so it
    // never renders fully typed for one frame before the typewriter takes over.
    balloon.setVisibleChars(visibleCharsOf(this.player, this.script, DEFAULT_CPS));
    this.balloon = balloon;
    this.beatObjects.push(balloon.container);

    const plaque = createPressPlaque(this, {
      label: "PRESS SPACE TO CONTINUE",
      centerX: WIDTH / 2,
      bottomY: HEIGHT - PLAY_AREA.y - PROMPT_BOTTOM_INSET,
      blink: true,
    });
    this.plaque = plaque;
    this.beatObjects.push(plaque);
  }

  /** Builds a name tag centred above `image`'s top edge, offset by `TAG_GAP_ABOVE_SPRITE`. */
  private buildSpeakerTag(
    image: Phaser.GameObjects.Image,
    tag: Speaker,
  ): Phaser.GameObjects.Container {
    const container = createSpeakerTag(this, 0, 0, tag);
    const bounds = container.getBounds();
    const top = image.getTopCenter();
    const desiredLeft = top.x - bounds.width / 2;
    const desiredTop = top.y - TAG_GAP_ABOVE_SPRITE - bounds.height;
    container.setPosition(desiredLeft - bounds.x, desiredTop - bounds.y);
    return container;
  }

  private sync(): void {
    const visibleChars = visibleCharsOf(this.player, this.script, DEFAULT_CPS);
    this.balloon?.setVisibleChars(visibleChars);
    const phase = phaseOf(this.player, this.script, DEFAULT_CPS);
    this.plaque?.setVisible(phase === "complete");
  }

  /** Draws into a throwaway `Graphics` object, snapshots it as a texture, then destroys it — never left in the display list (`docs/rules/tech-stack/phaser.md` R005), same idiom as `BootScene.bake`. */
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
