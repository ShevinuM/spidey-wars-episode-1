import type Phaser from "phaser";
import {
  BALLOON_BEVEL,
  BALLOON_BORDER,
  BALLOON_INNER_BORDER,
  BALLOON_PAD,
  BALLOON_SLICE,
} from "../config/tuning.ts";
import { flowRuns, type PlacedSegment, type RunMetrics } from "../cutscene/layout.ts";
import type { Line, Run, RunAccent, RunStyle, Speaker } from "../cutscene/script.ts";
import { COLORS } from "./colors.ts";
import { bevel } from "./primitives.ts";
import { SPEAKER_STYLE } from "./speaker-style.ts";

export interface BalloonOptions {
  /** Left edge of the nine-slice, i.e. the ink ring's outer edge. */
  readonly x: number;
  /** Top edge, same convention as `x`. */
  readonly y: number;
  /** Full nine-slice width, ink ring included. */
  readonly width: number;
  readonly lines: readonly Line[];
  readonly speaker: Speaker;
  readonly tail: BalloonTail;
}

/**
 * Side tails (`Scene 2.1:135` `top: 52%`, `Scene 2:112` `top: 46%`) are placed as a fraction of the
 * balloon's own height, resolved against the final height after every line is laid out; bottom tails
 * (`Scene 1.1:144` `left: 104px`, `Scene 1.2:127` `right: 230px`) are placed as a pixel offset along the
 * balloon's bottom edge — the mockups use two different units, split cleanly by side.
 */
export type BalloonTail =
  | { readonly side: "left" | "right"; readonly atHeightFraction: number }
  | { readonly side: "bottom-left" | "bottom-right"; readonly offset: number };

export interface Balloon {
  readonly container: Phaser.GameObjects.Container;
  readonly height: number;
  setVisibleChars(n: number): void;
}

const FONT_OF: Record<RunStyle, string> = {
  body: "silkscreen-16",
  bold: "silkscreen-bold-16",
  shout: "pressstart-16",
  muted: "silkscreen-16",
};

/** `reference/design/Scene 2.1 - Spider-Sense.dc.html:131-133` — every `<p>`'s own colour, and the shout span's. */
const STYLE_TINT: Record<RunStyle, number> = {
  body: COLORS.ink,
  bold: COLORS.ink,
  shout: COLORS.redDeep,
  muted: COLORS.mutedInk,
};

/** A `Run.accent` overrides `STYLE_TINT` — editorial per span, not derivable from the speaker. */
const ACCENT_TINT: Record<RunAccent, number> = {
  red: COLORS.redDeep,
  scarlet: COLORS.red,
  purple: COLORS.purple,
  blue: COLORS.frameMid,
};

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:131` `font-size: 13px; line-height: 1.95` scaled to the
// 16px bake: 1.95 * 13 = 25.35, 25.35 * (16 / 13) = 31.2, rounds to 31.
const BODY_LINE_HEIGHT = 31;
// Same line's shout span, `font-size: 12px; line-height: 2.2` scaled to the 16px bake:
// 2.2 * 12 = 26.4, 26.4 * (16 / 12) = 35.2, rounds to 35.
const SHOUT_LINE_HEIGHT = 35;

const LINE_HEIGHT: Record<RunStyle, number> = {
  body: BODY_LINE_HEIGHT,
  bold: BODY_LINE_HEIGHT,
  shout: SHOUT_LINE_HEIGHT,
  muted: BODY_LINE_HEIGHT,
};

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:130` `gap: 13px` between the balloon's paragraphs.
const PARAGRAPH_GAP = 13;

// The baked font's own pixel size, used to offset a segment's `BitmapText` down from `PlacedSegment.y`
// (a row top) by `round((rowHeight - FONT_PIXEL_SIZE) / 2)` so it matches the glyph-box centring that
// CSS `line-height` applies within the line box.
const FONT_PIXEL_SIZE = 16;

// Same line's inner-frame `padding: 17px 18px 19px` (top / left&right / bottom), added to the baked
// ink+paper+frame band (`BALLOON_BORDER + BALLOON_PAD + BALLOON_INNER_BORDER`) to find the text box.
const FRAME_BAND = BALLOON_BORDER + BALLOON_PAD + BALLOON_INNER_BORDER;
const TEXT_INSET_X = FRAME_BAND + 18;
const TEXT_INSET_TOP = FRAME_BAND + 17;
const TEXT_INSET_BOTTOM = FRAME_BAND + 19;

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:129` `10px 12px 0 rgba(4, 10, 30, .55)` —
// `COLORS.titleFill` is exactly rgb(4, 10, 30).
const SHADOW_OFFSET_X = 10;
const SHADOW_OFFSET_Y = 12;
const SHADOW_ALPHA = 0.55;

// `reference/design/Scene 2.1 - Spider-Sense.dc.html:135` the left/right tail is a 28px square;
// `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:144` the bottom tails are 30px.
const TAIL_SIDE_SIZE = 28;
const TAIL_BOTTOM_SIZE = 30;

// The tail's ink copy, offset in the square's own (pre-rotation) frame before the 45° rotation carries both
// squares together — `Scene 2.1 - Spider-Sense.dc.html:135` (`left`), `Scene 2 - Rooftop Relief.dc.html:112`
// (`right`), `Scene 1.1 - Goblin Asks MJ.dc.html:144` and `Scene 1.2 - MJ rejects Goblin.dc.html:127` (bottom
// sides, same offset).
const TAIL_SHADOW_OFFSET: Record<BalloonTail["side"], readonly [number, number]> = {
  left: [-5, 5],
  right: [5, -5],
  "bottom-left": [5, 5],
  "bottom-right": [5, 5],
};

interface PlacedLine {
  readonly line: Line;
  readonly top: number;
  readonly segments: readonly PlacedSegment[];
}

/** Lays out every `Line` with its own `flowRuns` call and stacks the results — `flowRuns` has no paragraph concept of its own. */
function layoutLines(
  lines: readonly Line[],
  maxWidth: number,
  metrics: RunMetrics,
): { readonly lines: readonly PlacedLine[]; readonly textBlockHeight: number } {
  const placedLines: PlacedLine[] = [];
  let cursorY = 0;
  lines.forEach((line, i) => {
    const segments = flowRuns(line.runs, maxWidth, metrics);
    const lineHeight = segments.reduce(
      (max, seg) => Math.max(max, seg.y + LINE_HEIGHT[seg.style]),
      0,
    );
    placedLines.push({ line, top: cursorY, segments });
    cursorY += lineHeight;
    if (i < lines.length - 1) cursorY += PARAGRAPH_GAP;
  });
  return { lines: placedLines, textBlockHeight: cursorY };
}

/** Builds a `RunMetrics` backed by one throwaway off-display-list `BitmapText` per font, destroyed before returning. */
function withRealMetrics<T>(scene: Phaser.Scene, use: (metrics: RunMetrics) => T): T {
  const probes = new Map<string, Phaser.GameObjects.BitmapText>();
  const probeFor = (style: RunStyle): Phaser.GameObjects.BitmapText => {
    const font = FONT_OF[style];
    let probe = probes.get(font);
    if (!probe) {
      probe = scene.make.bitmapText({ font }, false);
      probes.set(font, probe);
    }
    return probe;
  };

  const metrics: RunMetrics = {
    width: (text, style) => {
      const probe = probeFor(style);
      probe.setText(text);
      return probe.width;
    },
    lineHeight: (style) => LINE_HEIGHT[style],
  };

  try {
    return use(metrics);
  } finally {
    for (const probe of probes.values()) probe.destroy();
  }
}

/** The tail's centre, on the paper edge (balloon edge inset by `BALLOON_BORDER`) — a side tail is placed by `atHeightFraction` of the final `height`, a bottom tail by its pixel `offset` along that edge. */
function tailCenter(
  x: number,
  y: number,
  width: number,
  height: number,
  tail: BalloonTail,
): readonly [number, number] {
  switch (tail.side) {
    case "left":
      return [x + BALLOON_BORDER, y + Math.round(tail.atHeightFraction * height)];
    case "right":
      return [x + width - BALLOON_BORDER, y + Math.round(tail.atHeightFraction * height)];
    case "bottom-left":
      return [x + tail.offset, y + height - BALLOON_BORDER];
    case "bottom-right":
      return [x + width - tail.offset, y + height - BALLOON_BORDER];
  }
}

/** Draws the paper diamond and its ink copy inside one rotated frame, so the ink offset rotates with the square exactly as the mockup's `box-shadow` does. */
function drawTail(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  tail: BalloonTail,
): void {
  const size = tail.side === "left" || tail.side === "right" ? TAIL_SIDE_SIZE : TAIL_BOTTOM_SIZE;
  const half = size / 2;
  const [cx, cy] = tailCenter(x, y, width, height, tail);
  const [dx, dy] = TAIL_SHADOW_OFFSET[tail.side];

  g.save();
  g.translateCanvas(cx, cy);
  g.rotateCanvas(Math.PI / 4);
  g.fillStyle(COLORS.ink, 1);
  g.fillRect(-half + dx, -half + dy, size, size);
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(-half, -half, size, size);
  g.restore();
}

interface RenderedSegment {
  readonly text: string;
  /** Cumulative character count of every segment before this one, in reading order. */
  readonly offset: number;
  readonly bmText: Phaser.GameObjects.BitmapText;
}

/**
 * Builds the dialogue balloon: a `balloon-9` nine-slice, a per-speaker inner-frame overdraw, a four-way
 * tail, and one `BitmapText` per laid-out run segment, progressively revealed by `setVisibleChars`.
 */
export function createBalloon(scene: Phaser.Scene, options: BalloonOptions): Balloon {
  const { x, y, width, lines, speaker, tail } = options;
  const textAreaWidth = width - 2 * TEXT_INSET_X;

  const layout = withRealMetrics(scene, (metrics) => layoutLines(lines, textAreaWidth, metrics));
  const height = layout.textBlockHeight + TEXT_INSET_TOP + TEXT_INSET_BOTTOM;

  const container = scene.add.container(0, 0);

  const shadow = scene.add.graphics();
  shadow.fillStyle(COLORS.titleFill, SHADOW_ALPHA);
  shadow.fillRect(x + SHADOW_OFFSET_X, y + SHADOW_OFFSET_Y, width, height);
  container.add(shadow);

  const corner = BALLOON_SLICE.corner;
  const nineSlice = scene.add
    .nineslice(x, y, "balloon-9", undefined, width, height, corner, corner, corner, corner)
    .setOrigin(0, 0);
  container.add(nineSlice);

  // Overdraws the baked band in the speaker's own colour; `frameInset` must stay under
  // `BALLOON_SLICE.corner` or the bake starts stretching underneath it.
  const frameInset = BALLOON_BORDER + BALLOON_PAD;
  const frame = scene.add.graphics();
  bevel(frame, x + frameInset, y + frameInset, width - 2 * frameInset, height - 2 * frameInset, {
    fillColor: COLORS.paper,
    highlightColor: COLORS.paper,
    // The mockups' border is flat with no bevel of its own; `frameMid` reuses the same neutral shadow band
    // the single-speaker `balloon-9` bake already used, so the depth cue doesn't shift per speaker.
    shadowColor: COLORS.frameMid,
    outlineColor: SPEAKER_STYLE[speaker].frameColor,
    outlineWidth: BALLOON_INNER_BORDER,
    bevelWidth: BALLOON_BEVEL,
  });
  container.add(frame);

  // `Scene 2.1:130-135` — the tail div is a sibling that FOLLOWS the bordered inner div in DOM order
  // and so paints above the frame, its inner half covering the paper padding and the 3px frame border,
  // whereas a tail drawn below the frame would have the frame's line run straight across its base and
  // the balloon read as closed.
  const tailGraphics = scene.add.graphics();
  drawTail(tailGraphics, x, y, width, height, tail);
  container.add(tailGraphics);

  const textOriginX = x + TEXT_INSET_X;
  const textOriginY = y + TEXT_INSET_TOP;
  const rendered: RenderedSegment[] = [];
  let charOffset = 0;
  for (const placedLine of layout.lines) {
    // Segments sharing a `PlacedSegment.y` share a row (within this Line's own `flowRuns` call);
    // the row's height is the max `LINE_HEIGHT` over the styles in it.
    const rowHeights = new Map<number, number>();
    for (const seg of placedLine.segments) {
      rowHeights.set(seg.y, Math.max(rowHeights.get(seg.y) ?? 0, LINE_HEIGHT[seg.style]));
    }
    for (const seg of placedLine.segments) {
      const run: Run = placedLine.line.runs[seg.runIndex];
      const tint = run.accent ? ACCENT_TINT[run.accent] : STYLE_TINT[seg.style];
      // Populated above from this same `placedLine.segments` array, so the key is always present.
      const rowHeight = rowHeights.get(seg.y)!;
      const centerOffset = Math.round((rowHeight - FONT_PIXEL_SIZE) / 2);
      const bmText = scene.add
        .bitmapText(
          textOriginX + seg.x,
          textOriginY + placedLine.top + seg.y + centerOffset,
          FONT_OF[seg.style],
          seg.text,
        )
        .setOrigin(0, 0)
        .setTint(tint);
      container.add(bmText);
      rendered.push({ text: seg.text, offset: charOffset, bmText });
      charOffset += seg.text.length;
    }
  }

  return {
    container,
    height,
    // `o` counts the segment stream, not `beatCharCount` — `flowRuns` drops each (run, row) group's edge
    // whitespace, so the stream can run short of the beat's count and every segment is fully shown once `n`
    // reaches it.
    setVisibleChars(n: number): void {
      for (const seg of rendered) {
        const shown = Math.min(seg.text.length, Math.max(0, n - seg.offset));
        seg.bmText.setText(seg.text.slice(0, shown));
      }
    },
  };
}
