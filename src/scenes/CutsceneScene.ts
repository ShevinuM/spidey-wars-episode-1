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
import {
  beatCharCount,
  type ActorPlacement,
  type BalloonAnchorX,
  type BalloonPlacement,
  type Beat,
  type Speaker,
} from "../cutscene/script.ts";
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
import { attachEffect } from "../ui/effects.ts";
import { createPressPlaque } from "../ui/press-plaque.ts";
import { createSpeakerTag } from "../ui/speaker-tag.ts";

interface CutsceneSceneData {
  readonly id?: string;
  readonly blink?: boolean;
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

// `Scene 2.1 - Spider-Sense.dc.html:128-129,135` — a beat with no `balloon` of its own gets this
// placement: a 400px paper box 25px from the play area's right edge, 118px from its top, its tail
// centred at 52% of the balloon's own final height.
const DEFAULT_BALLOON: BalloonPlacement = {
  paperWidth: 400,
  anchorX: { from: "right", offset: 25 },
  top: 118,
  tail: { side: "left", atHeightFraction: 0.52 },
};

/** `anchorX`'s left edge, resolved against a balloon of the given outer `width` — the nine-slice draws `BALLOON_BORDER` px outside the mockup's own paper-box edge in every direction. */
function resolveBalloonX(anchorX: BalloonAnchorX, width: number): number {
  switch (anchorX.from) {
    case "center":
      return PLAY_AREA.x + (PLAY_AREA.width - width) / 2;
    case "left":
      return PLAY_AREA.x + anchorX.offset - BALLOON_BORDER;
    case "right":
      return PLAY_AREA.x + PLAY_AREA.width - (anchorX.offset - BALLOON_BORDER) - width;
  }
}

/** Converts a `BalloonPlacement`'s mockup paper-box terms into `createBalloon`'s outer nine-slice edge. */
function resolveBalloon(placement: BalloonPlacement): {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly tail: BalloonTail;
} {
  const width = placement.paperWidth + 2 * BALLOON_BORDER;
  return {
    x: resolveBalloonX(placement.anchorX, width),
    y: PLAY_AREA.y + (placement.top - BALLOON_BORDER),
    width,
    tail: placement.tail,
  };
}

// `Scene 2.1 - Spider-Sense.dc.html:144` `bottom: 18px` of the play area.
const PROMPT_BOTTOM_INSET = 18;

function isSpriteScaleKey(frame: string): frame is keyof typeof SPRITE_SCALE {
  return Object.hasOwn(SPRITE_SCALE, frame);
}

/**
 * The scale an actor frame gets when its placement gives none. Ruling 48 — `ActorPlacement.frame` is a
 * plain `string` in `src/cutscene/` (narrowing it to `SPRITE_SCALE`'s key union there would need
 * `cutscene` to import `config`, closing a cycle against `config/flow.ts`'s import of `Beat`), so an
 * unscaled placement with a frame absent from the table has no default scale and must fail loudly rather
 * than silently rendering at Phaser's `setScale(undefined)` fallback of 1.
 */
function defaultScaleOf(frame: string): number {
  if (!isSpriteScaleKey(frame)) {
    throw new Error(`CutsceneScene: no SPRITE_SCALE entry for actor frame "${frame}"`);
  }
  return SPRITE_SCALE[frame];
}

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
  private blinkEnabled = true;

  /**
   * Invariant: `stepper.step` and `player.elapsedSteps` stay equal at all times.
   *
   * Every path that changes one — `update`, `advance`, `stepTo`, and a beat change (which resets both to
   * 0) — changes the other in the same step, or a later skip silently rewinds the typewriter.
   */
  private stepper: Stepper = newStepper();
  private player: PlayerState = newPlayer();

  private beatObjects: Phaser.GameObjects.GameObject[] = [];
  private effectTweens: Phaser.Tweens.Tween[] = [];
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
    this.blinkEnabled = data.blink ?? true;
    this.stepper = newStepper();
    this.player = newPlayer();
    this.beatObjects = [];
    this.effectTweens = [];
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
    const stepper = newStepper();
    setStepperStep(stepper, n);
    this.player = setPlayerStep(this.player, n);
    this.stepper = stepper;
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

  /** Destroys the previous beat's actors, tags, effects, balloon and plaque, then builds the current beat's. */
  private rebuildBeat(): void {
    for (const tween of this.effectTweens) this.tweens.remove(tween);
    this.effectTweens = [];
    for (const obj of this.beatObjects) obj.destroy();
    this.beatObjects = [];

    const beat = this.script[this.player.beat];
    const groundY = groundYOf(beat.bg);

    for (const placement of beat.actors) {
      const localY = placement.y ?? groundY;
      const scale = placement.scale ?? defaultScaleOf(placement.frame);
      const container = this.add.container(PLAY_AREA.x + placement.x, PLAY_AREA.y + localY);
      const image = this.add
        .image(0, 0, "sprites", placement.frame)
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setFlipX(placement.flipX ?? false);
      container.add(image);

      for (const effectId of placement.effects ?? []) {
        const handle = attachEffect(this, container, image, effectId);
        this.effectTweens.push(...handle.tweens);
      }

      this.beatObjects.push(container);

      if (placement.tag) {
        this.beatObjects.push(this.buildSpeakerTag(image, placement.tag, placement.tagAt));
      }
    }

    const resolvedBalloon = resolveBalloon(beat.balloon ?? DEFAULT_BALLOON);
    const balloonOptions: BalloonOptions = {
      x: resolvedBalloon.x,
      y: resolvedBalloon.y,
      width: resolvedBalloon.width,
      lines: beat.lines,
      speaker: beat.speaker,
      tail: resolvedBalloon.tail,
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
      blink: this.blinkEnabled,
    });
    this.plaque = plaque;
    this.beatObjects.push(plaque);
  }

  /**
   * Builds `image`'s name tag.
   *
   * `tagAt`, when given, plants the tag's fill-box top-left at the sprite's rendered top-left plus
   * `(dx, dy)`; omitted, the tag centres above the sprite's top edge, offset by `TAG_GAP_ABOVE_SPRITE`.
   */
  private buildSpeakerTag(
    image: Phaser.GameObjects.Image,
    tag: Speaker,
    tagAt: ActorPlacement["tagAt"],
  ): Phaser.GameObjects.Container {
    if (tagAt) {
      // includeParent: true, so a sprite later parented to a container still reports its world position.
      const spriteTop = image.getTopCenter(undefined, true);
      const fillX = spriteTop.x - image.displayWidth / 2 + tagAt.dx;
      const fillY = spriteTop.y + tagAt.dy;
      return createSpeakerTag(this, fillX, fillY, tag);
    }
    const container = createSpeakerTag(this, 0, 0, tag);
    const bounds = container.getBounds();
    // `image` is a child of its actor container, so its world position must include that parent.
    const top = image.getTopCenter(undefined, true);
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
