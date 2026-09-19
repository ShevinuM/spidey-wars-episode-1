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
}

export interface Beat {
  readonly bg: string;
  readonly actors: readonly ActorPlacement[];
  readonly speaker: Speaker;
  readonly lines: readonly Line[];
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
