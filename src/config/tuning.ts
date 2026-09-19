/** Outer octagon corner cut for the prompt-plaque bake ("◼ PRESS SPACE TO CONTINUE" / the input ticker), px — `reference/design/Game UI.dc.html` line 249, `reference/design/Scene 2 - Rooftop Relief.dc.html` line 119. */
export const PROMPT_PLAQUE_CUT = 7;

/** Inner-fill octagon corner cut for the prompt-plaque bake, px — `reference/design/Game UI.dc.html` line 250, `reference/design/Scene 2 - Rooftop Relief.dc.html` line 120. */
export const PROMPT_PLAQUE_INNER_CUT = 6;

/** Border thickness between the prompt plaque's outer and inner octagons, px — `reference/design/Game UI.dc.html` line 249's `padding: 3px`. */
export const PROMPT_PLAQUE_BORDER = 3;

/** Baked size and nine-slice corner of the `plaque-9` texture, px — the corner is `PROMPT_PLAQUE_CUT + PROMPT_PLAQUE_BORDER`, the minimum that keeps the stretched centre from eating the border. */
export const PROMPT_PLAQUE_SLICE = {
  width: 32,
  height: 32,
  corner: PROMPT_PLAQUE_CUT + PROMPT_PLAQUE_BORDER,
} as const;

/** Outer octagon corner cut for the title-plaque bake (the top-centre "SPIDEY ◉ WARS" block), px — `reference/design/Game UI.dc.html` line 161. */
export const TITLE_PLAQUE_CUT = 8;

/** Inner-fill octagon corner cut for the title-plaque bake, px — `reference/design/Game UI.dc.html` line 162. */
export const TITLE_PLAQUE_INNER_CUT = 6;

/** Border thickness between the title plaque's outer and inner octagons, px — `reference/design/Game UI.dc.html` line 161's `padding: 4px`. */
export const TITLE_PLAQUE_BORDER = 4;

/** Baked size and nine-slice corner of the `title-plaque-9` texture, px — the corner is `TITLE_PLAQUE_CUT + TITLE_PLAQUE_BORDER`, the minimum that keeps the stretched centre from eating the border. */
export const TITLE_PLAQUE_SLICE = {
  width: 40,
  height: 40,
  corner: TITLE_PLAQUE_CUT + TITLE_PLAQUE_BORDER,
} as const;

/** Ink outline thickness around the comic-balloon bake, px — `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html`'s balloon `box-shadow: 0 0 0 4px`. */
export const BALLOON_BORDER = 4;

/** Paper padding between the balloon's ink outline and its inner frame, px — the same balloon's `padding: 5px`. */
export const BALLOON_PAD = 5;

/** Inner frame thickness of the balloon bake, px — the same balloon's `border: 3px solid`. */
export const BALLOON_INNER_BORDER = 3;

/** Highlight/shadow band thickness of the balloon's inner-frame bevel, px. */
export const BALLOON_BEVEL = 2;

/** Baked size and nine-slice corner of the `balloon-9` texture, px — the corner must clear every drawn band (ink, paper, frame, bevel) or `NineSlice` would stretch one of them. */
export const BALLOON_SLICE = {
  width: 40,
  height: 40,
  corner: BALLOON_BORDER + BALLOON_PAD + BALLOON_INNER_BORDER + BALLOON_BEVEL,
} as const;

/** Scanline period of the CRT overlay bake, px — `reference/design/Game UI.dc.html`'s `repeating-linear-gradient(... 0 2px, transparent 2px 4px)`. */
export const CRT_SCANLINE_STEP = 4;

/** Opaque scanline thickness within each period, px, from the same gradient. */
export const CRT_SCANLINE_LINE_WIDTH = 2;

/** Scanline fill alpha, from the same gradient's `rgba(0, 0, 0, .16)`. */
export const CRT_SCANLINE_ALPHA = 0.16;

/** Vignette ring alpha at the frame edge, from `Game UI.dc.html`'s `box-shadow: inset 0 0 120px 30px rgba(3, 7, 20, .65)`. */
export const CRT_VIGNETTE_ALPHA = 0.65;

/** Vignette falloff distance from each edge, px — the same box-shadow's 120px blur plus 30px spread. */
export const CRT_VIGNETTE_WIDTH = 150;

/** Number of concentric rings `crtOverlay` layers across `CRT_VIGNETTE_WIDTH` to approximate the blurred falloff. */
export const CRT_VIGNETTE_RINGS = 30;

/** Prompt blink half-period, ms — `reference/design/Scene 2 - Rooftop Relief.dc.html`'s `animation: blink 0.9s steps(1, end)`, halved for a hard visible/hidden toggle. */
export const BLINK_MS = 450;

type SpriteFrame =
  | "bat"
  | "goblin"
  | "goblin-hover"
  | "mj"
  | "mj-falling"
  | "mj-standing"
  | "mj-standing-angry"
  | "mj-standing-crying"
  | "spider"
  | "spidey"
  | "spidey-crouch"
  | "spidey-side"
  | "spidey-side-new"
  | "spidey-v2";

/**
 * Final on-screen scale by atlas frame name (`public/sprites/atlas.json`).
 *
 * `spider`'s 3 is only a default — the mockups vary it 3/2/1 by scene, and a placement overrides it.
 * `spidey-crouch` sits inside a mockup stage wrapped at 0.66 zoom, and `spidey-side`/`spidey-side-new` at
 * 0.82 zoom; fold that zoom into a placement's own scale the way `config/cutscenes/demo.ts` does for
 * `spidey-side-new`, rather than looking for it in this table.
 */
export const SPRITE_SCALE = {
  bat: 3,
  goblin: 5,
  "goblin-hover": 7,
  mj: 5,
  "mj-falling": 1,
  "mj-standing": 6,
  "mj-standing-angry": 6,
  "mj-standing-crying": 6,
  spider: 3,
  spidey: 5,
  "spidey-crouch": 10,
  "spidey-side": 8,
  "spidey-side-new": 8,
  "spidey-v2": 5,
} as const satisfies Record<SpriteFrame, number>;
