export type Speaker = "SPIDEY" | "MJ" | "GOBLIN";
export type RunStyle = "body" | "bold" | "shout" | "muted";
export type RunAccent = "red" | "scarlet" | "purple" | "blue";

export interface Run {
  readonly text: string;
  readonly style: RunStyle;
  readonly accent?: RunAccent;
}

export interface Line {
  readonly runs: readonly Run[];
}

/**
 * `x` is a play-area pixel; the sprite is anchored bottom-centre at that point.
 *
 * An omitted `y` means the actor stands on `bg`'s backdrop ground line; a given `y` is a play-area pixel
 * the same way `x` is.
 */
export interface ActorPlacement {
  readonly frame: string;
  readonly x: number;
  readonly y?: number;
  readonly scale?: number;
  readonly flipX?: boolean;
  readonly tag?: Speaker;
  /**
   * `dx`/`dy` place the tag's fill-box top-left that many mockup CSS pixels from the sprite's own
   * rendered top-left.
   *
   * Omitted keeps the engine's own placement: the tag centred above the sprite's top edge.
   */
  readonly tagAt?: { readonly dx: number; readonly dy: number };
  /** Kebab-case ids looked up in `src/ui/effects.ts`'s registry; omitted or empty means no overlay. */
  readonly effects?: readonly string[];
}

/** A balloon's horizontal anchor, in the mockup's own CSS terms — an edge offset or dead centre. */
export type BalloonAnchorX =
  { readonly from: "left" | "right"; readonly offset: number } | { readonly from: "center" };

/**
 * Per-beat balloon placement, written in the mockup's own paper-box terms.
 *
 * `CutsceneScene` converts this to `createBalloon`'s outer nine-slice edge the same way its existing
 * balloon constants already do; `tail` mirrors `src/ui/balloon.ts`'s `BalloonTail` structurally so it
 * passes straight through with no mapping code.
 */
export interface BalloonPlacement {
  /** The mockup's own `width: min(<N>px, ...)` — the paper box, ink ring excluded. */
  readonly paperWidth: number;
  readonly anchorX: BalloonAnchorX;
  /** The mockup's `top: <N>px`, from the play area's top edge. */
  readonly top: number;
  readonly tail:
    | { readonly side: "left" | "right"; readonly atHeightFraction: number }
    | { readonly side: "bottom-left" | "bottom-right"; readonly offset: number };
}

export interface Beat {
  readonly bg: string;
  readonly actors: readonly ActorPlacement[];
  readonly speaker: Speaker;
  readonly lines: readonly Line[];
  /** Absent keeps `CutsceneScene`'s own default placement. */
  readonly balloon?: BalloonPlacement;
}

export function beatCharCount(beat: Beat): number {
  let total = 0;
  for (const line of beat.lines) {
    for (const run of line.runs) {
      total += run.text.length;
    }
  }
  return total;
}
