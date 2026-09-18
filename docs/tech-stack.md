# Spidey Wars Ep.1 — Tech stack decision

_Researched 2026-09-18. Jam closes **2026-09-26 02:30 UTC** (= 08:00 IST, Sept 26) → **~8 days**._

## Verdict

**Phaser 4 + Vite + TypeScript. Everything renders in Phaser — gameplay, HUD, and cutscenes.**
One canvas, one scale model, one render pipeline.

Scaffold: `pnpm create game-app` → Web Bundler: **Vite** → **TypeScript**.

## Why Phaser 4

The deciding constraint is eight days with art already drawn. Phaser 4 is both current and low-risk:

- **Current.** v4.0.0 "Caladan" shipped April 2026 (ground-up WebGL renderer rebuild, node-based render graph, unified Filter system); 4.2.1 "Giedi" July 2026.
- **Not a learning tax.** Phaser 4 deliberately preserved the Phaser 3 API surface, so a decade of tutorials, forum answers, and model training data still applies.
- **Everything this game needs is built in:** Arcade physics (bats vs. Spidey), camera follow + `setBounds` for the 6000px level, Web Audio, tweens, `NineSlice`, `BitmapText`, parallel scenes, `Scale.FIT` + `pixelArt`.
- **~500KB, instant load.** A "computer lab game" has to start before the bell rings.
- **Claude Code iterates fastest in TS.** Types + Vite HMR = tight loop.

## Why HUD-in-Phaser (decided)

Rejected the DOM/CSS-overlay alternative. In Phaser:

- **One scaling model.** itch's "click to launch in fullscreen" scales a single canvas cleanly. A DOM overlay would need its own matching transform math at every viewport size — a class of bug that eats jam days and only shows up on someone else's monitor.
- **Consistent rasterization.** Canvas pixel art next to browser-antialiased CSS text reads as two different games. Everything through one renderer means everything shares the same pixel grid.
- **Shippable.** One codebase, one asset pipeline, no `z-index` / `pointer-events` coordination layer, and screenshots/GIFs capture the whole frame.
- **Filters apply to everything.** CRT/scanline/vignette over both gameplay and HUD in one pass.

## Scene architecture

```
BootScene      preload atlas, bitmap fonts, baked backdrops → TitleScene
TitleScene     "CLICK TO START" (also unlocks Web Audio)
CutsceneScene  data-driven; plays a Script[]; → next scene
GameScene      world, camera, physics, player, bats, MJ  (+ scanline/vignette filter)
UIScene        launched in parallel, always on top — the HUD
GameOverScene  retry / score
```

```ts
// GameScene.create()
this.scene.launch("UIScene");
this.scene.bringToTop("UIScene");
```

**State flows through the registry, never scene references:**

```ts
// GameScene
this.registry.set("score", 4250);
// UIScene
this.registry.events.on("changedata-score", (_p, v) => this.scoreText.setText(pad6(v)));
```

## Chrome is hand-drawn in `Graphics` — make it cheap with primitives

**Decision: no baked PNGs.** Every bevel, octagon frame, facade gradient and parapet block is TS draw calls. The `.dc.html` files are _visual reference only_.

This is the more expensive route (~3–4 days vs ~1.5). Two techniques cut that down substantially.

### 1. Build `src/ui/primitives.ts` first (half a day, pays for itself immediately)

The mockups use only about six CSS idioms, repeated everywhere. Wrap each once:

```ts
/** clip-path: polygon(Npx 0, calc(100% - Npx) 0, ...) — the cut-corner octagon */
export function octagon(
  x: number,
  y: number,
  w: number,
  h: number,
  cut: number,
): Phaser.Geom.Point[];

/** the blue-outer / dark-inner double-octagon used by every plaque in the HUD */
/** two NESTED octagons: outer at `cut`, inner inset by `pad` at `cut - 1`. Two fills. */
export function plaque(
  s: Phaser.Scene,
  g: Graphics,
  x,
  y,
  w,
  h,
  outer = 0x4a9fd8,
  inner = 0x071129,
  pad = 3,
  cut = 5,
): void;

/** box-shadow: inset -4px -4px 0 #a9b4c2, inset 4px 4px 0 #fff — the raised key-cap bevel.
 *  Order matters: face, then light as TWO rects (top strip + left strip), then dark as
 *  TWO rects (bottom + right) drawn LAST so it wins the bottom-right corner and the
 *  highlight wins top-left. That diagonal overlap is what CSS inset shadows produce. */
export function bevel(g: Graphics, x, y, w, h, face, light, dark, t = 4): void;

/** window grid. The mockup stacks TWO repeating-linear-gradients (180deg rows AND 90deg
 *  columns), which composites to a 2D grid of lit cells — so this is a NESTED loop of
 *  rects, not a single pass of stripes. */
export function facade(
  g: Graphics,
  x,
  y,
  w,
  h,
  bg: number,
  win: number,
  cw = 7,
  ch = 7,
  gw = 24,
  gh = 24,
  ox = 0,
  oy = 0,
): void;

/** linear-gradient(180deg, ...stops) as N horizontal bands — sky, street haze */
export function vGradient(g: Graphics, x, y, w, h, stops: [number, number, number][]): void;

/** seeded RNG, ported verbatim from the .dc.html DCLogic — keeps skylines identical */
export function seedRand(seed: number): () => number;
```

After that, every panel in `Game UI.dc.html` is 3–5 lines. The title plaque, score box, web-fluid box, ability chips, and input ticker are all the same `plaque()` call with different contents.

Port `seedRand` exactly as written in the `.dc.html` scripts (`0x6D2B79F5` / `Math.imul`) with the same seeds — `20260912` for the Game UI skyline, `90613` for Scene 1.3. You get the _same_ skyline as the mockup for free.

### 2. Draw once at boot, then `generateTexture` — never per frame

`Graphics` is fine to author with and expensive to keep in the display list. Draw the static chrome once, snapshot it, throw the `Graphics` away:

```ts
// BootScene.create()
const g = this.make.graphics({ x: 0, y: 0 }, false); // not added to the scene
drawHudChrome(g); // ~150 lines using primitives.ts
g.generateTexture("hud-chrome", 1280, 720);
g.destroy();

// UIScene.create()
this.add.image(0, 0, "hud-chrome").setOrigin(0); // one draw call, forever
```

You get fully code-defined chrome _and_ single-draw-call rendering — no performance cost versus the baked route, and a design tweak is an edit to TS rather than a re-screenshot. Do the same for the six cutscene backdrops (`bg-scene-1-3`, …).

**Still never draw text into the texture.** All labels stay live `BitmapText` on top.

## Architecture

**See [architecture.md](./architecture.md)** — the canonical decision record.

Summary: layered by purity, not ceremony. One hard rule — `src/sim/` (plain TS: physics,
timers, FSM, rules) never imports Phaser; `src/scenes/` reads it and draws. The adapter is
`GameScene.update()` calling `sim.tick(delta)`, which drains a fixed 1/60s accumulator
internally — that is what stops the game playing differently on a 144Hz monitor.

Patterns that earn their place: fixed timestep, FSM for Spidey, typed sim events + Phaser
registry for the HUD, `Group` pooling for bats, `config/tuning.ts` for every magic number.
Rejected: hexagonal/ports, DI container, repository, Command, user-level ECS.

## Build order — this matters more than the chrome

At ~3–4 days for chrome out of ~7.5 remaining, the sequencing is the real risk. Gameplay first:

| Day | Work                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Scaffold, atlas, bitmap fonts, `primitives.ts`, GameScene with a swinging Spidey. **Placeholder HUD: plain `BitmapText` in the corners.** |
| 2–3 | Core loop: bats, collision, MJ fall timer, catch, win/lose, score. **Make it fun.**                                                       |
| 4   | `drawHudChrome()` — the real HUD.                                                                                                         |
| 5   | `CutsceneScene` + `drawSceneBg()` × 6, dialogue `NineSlice`, typewriter.                                                                  |
| 6   | Audio (ZzFX), title/game-over screens, tuning.                                                                                            |
| 7   | Build, upload to itch, test in the embed, buffer.                                                                                         |

**Checkpoint at end of day 5:** if chrome isn't done, ship the placeholder HUD. A jam game with a plain HUD and great feel ranks above a beautiful HUD wrapped around an unfinished game. The `generateTexture` split above means the HUD is one swappable function either way.

## Cutscenes

Read `Scene 1.3` — the structure is consistent and cheap to generalize:

- **Backdrop** → `drawSceneBg()` using `primitives.ts` + `seedRand(90613)`, snapshotted with `generateTexture` at boot (one per scene).
- **Characters** → existing sprites (`mj-standing.png`, `goblin-hover.png`, …), positioned per scene.
- **Sprite overlays** → the goblin's cackling mouth and MJ's tears are drawn as CSS divs _on top of_ the sprite. Draw them as 3 `Rectangle`s parented to the sprite (consistent with the no-baking decision).
- **Dialogue balloon** → the one genuine `NineSlice`: cream fill, 4px black outline, purple inner border, offset drop shadow, rotated-square tail. Build once, reuse for all six scenes. Text is `BitmapText` with `setMaxWidth()` for wrapping, revealed by a typewriter tween.
- **"PRESS SPACE TO CONTINUE" plaque** → shared object, blink tween.
- **Animations to re-create as tweens** (only five distinct ones): `blink` (antenna/cursor), `bob`, `sway`, `flamePulse`, `haFloat`, `tearFall`. Use `ease: 'Stepped'` or a `time.addEvent` toggle — a smooth ease will look wrong next to the reference.

Data model:

```ts
type Beat = { bg: string; actors: Actor[]; speaker: "GOBLIN" | "MJ" | "SPIDEY"; text: string };
const SCENE_1_3: Beat[] = [/* ... */];
```

Six scenes become a data file plus one `CutsceneScene`. The port is mechanical.

## Text: bitmap fonts, not web fonts

`Text` objects with Google Fonts are anti-aliased, need a `document.fonts.ready` race guard, and re-rasterize a canvas texture on every `setText`. Use `BitmapText` — crisp, no loading race, very fast under WebGL.

```ts
this.load.bitmapFont("pressstart", "fonts/pressstart.png", "fonts/pressstart.fnt");
this.add.bitmapText(16, 14, "pressstart", "004250", 16);
```

Generate with [snowb.org](https://snowb.org) (browser, TTF in → `.fnt` + `.png` out) or Hiero. **Disable smoothing/anti-aliasing on export** — each glyph should be two colors.

Two gotchas:

1. **Sizes must be integer multiples of the glyph grid.** Press Start 2P and Silkscreen are 8px-grid fonts. The mockup uses 11/13/15/16/19px, which render unevenly in any pixel pipeline. **Regenerate at 8 / 16 / 24.** This is a design improvement the Phaser route forces.
2. **Charset coverage.** The mockups use `▼ — ◼ ╲ ╱`. Press Start 2P likely lacks `▼ ╲ ╱`. Either include them in the generated charset and verify each glyph, or substitute ASCII (`v`, `-`, `#`). Missing glyphs render as silent blanks.

## Logical resolution — commit now, it's load-bearing

**1280×720**, `pixelArt: true`, `Scale.FIT`, `CENTER_BOTH`, integer zoom. Set the itch embed to the same dimensions so 1:1 is the common case.

The mockup implies a 702px play area inside a 15px frame (4+8+3 padding each side); at 1280×720 that becomes 690. Adjust the chrome bake to 720 total height rather than fighting it.

## Scanlines + vignette

`camera.filters.internal` / `.external` in Phaser 4 ship Barrel, Blur, ColorMatrix, Glow, Pixelate and others. **Vignette is not confirmed present in the 4.x list** (it was `postFX.addVignette` in 3.x) — check before relying on it.

Two safe paths:

1. **Generated overlay texture** — draw the scanline rows + vignette rings with `Graphics` at boot, `generateTexture('crt', 1280, 720)`, place at `setScrollFactor(0)` with `depth` between GameScene and UIScene. Consistent with the chrome decision, zero risk. **Do this first.**
2. **Custom GLSL filter** — Phaser 4 exposes `BaseFilterShader` for custom fragment shaders, so scanlines + vignette + slight barrel in one pass is ~20 lines of GLSL and looks properly CRT. Nice-to-have, day 7.

Note the overlay belongs over the _map_ and under the HUD frame.

## Scope call: desktop only

Presentation is in person at MUN EN 2036, and the mockup's input ticker reads **MOUSE + CLICK · HOLD SPACE · PRESS X**. Build keyboard + mouse at a fixed logical resolution; skip mobile and say so on the itch page.

## What was rejected and why

| Option                                          | Why not                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Godot 4.7 web export**                        | 30MB+ wasm before a pixel renders. Threaded builds need COOP/COEP — itch has a SharedArrayBuffer checkbox, but Firefox lacks `credentialless` and itch falls back to a _popup_, which fights the jam's "playable directly in the submission page" rule. Non-threaded export is larger still. |
| **Unity WebGL**                                 | Heavier, longer load, worse iteration loop.                                                                                                                                                                                                                                                  |
| **Construct 3 / GameMaker**                     | Fine web builds, explicitly allowed — but paid, editor-driven, largely no-code. Throws away the Claude Code advantage.                                                                                                                                                                       |
| **KAPLAY** (ex-Kaboom.js)                       | Good jam engine, fastest to first moving sprite. Thinner physics/camera story for a 6000px scroller, no `NineSlice`/`BitmapText` equivalent for HUD work. Fallback only.                                                                                                                     |
| **Excalibur.js**                                | Clean TS-first API, ~300KB. Nothing wrong with it — just no reason over Phaser given the ecosystem gap.                                                                                                                                                                                      |
| **PixiJS** (~200KB) / **LittleJS** / raw canvas | Renderer only. Hand-building physics, input, camera, audio, and scenes is not an 8-day proposition.                                                                                                                                                                                          |

## Gotchas to handle at scaffold time

1. **`base: './'` in `vite.config.ts`.** itch serves HTML games from a hashed subpath; absolute `/assets/...` paths 404 _silently_ — the game just never starts. itch's docs are explicit: relative paths only.
2. **itch is case-sensitive.** `Spidey.png` ≠ `spidey.png`. macOS won't catch it locally.
3. **Audio needs a user gesture.** The TitleScene "CLICK TO START" handles it — and fits the Newgrounds/Kongregate feel anyway.
4. **`sprites/_sheet.png`** — check the frame layout when scaffolding. Phaser needs a uniform `frameWidth`/`frameHeight` or a JSON atlas. Pack all sprites into one atlas for a single draw call.
5. **Swinging:** hand-roll a pendulum (angle + angular velocity + gravity, a few dozen lines) before reaching for Matter.js rope constraints. Arcade physics has no joints; Matter tuning eats jam days. Matter is available in Phaser if the hand-rolled version truly isn't fun.
6. **ZzFX / jsfxr** for SFX — procedural chiptune blips, a few hundred bytes, era-appropriate, zero sound-design time.
7. **Escape hatch:** if Phaser 4's new renderer hits an edge case mid-jam, Phaser 3.90 is close to a drop-in (API preserved) and has `NineSlice`, `BitmapText`, and `postFX.addVignette`. Swap the dep; do **not** debug renderer internals on jam time.

## itch.io upload limits (confirmed)

- ZIP: 500MB extracted max, 200MB per file, **≤1000 files**, filenames ≤240 chars, UTF-8, case-sensitive
- Must contain `index.html` at the root
- Display: "Embed in page" (fixed dimensions) or "Click to launch in fullscreen" — embed-in-page at 1280×720 with a fullscreen button matches the jam's browser-only rule best
- A Vite production build is a handful of files and a few MB — nowhere near any limit

## Resolved decisions

- **Chrome:** hand-drawn in `Graphics`, snapshotted via `generateTexture`. No baked PNGs, no Playwright tooling. `.dc.html` files are reference only.
- **Text:** `BitmapText` only, regenerated at 8/16/24px with a verified charset.
- **Resolution:** 1280×720, `pixelArt`, `Scale.FIT`, `CENTER_BOTH`.
- **Scope:** desktop, keyboard + mouse.
- **Architecture:** `sim/` (pure TS) + `scenes/` (Phaser), one rule, no ports/adapters. See [architecture.md](./architecture.md).

## Sources

- https://phaser.io/phaser4 · https://phaser.io/news/2026/05/phaser-3-vs-phaser-4 · https://github.com/phaserjs/phaser/releases
- https://docs.phaser.io/phaser/concepts/gameobjects/nine-slice · https://docs.phaser.io/phaser/concepts/gameobjects/bitmap-text
- https://docs.phaser.io/api-documentation/class/gameobjects-components-filterlist
- https://phaser.io/news/2026/04/phaser-vs-kaplay-vs-excalibur-2d-web-game-framework
- https://emanueleferonato.com/2026/04/17/getting-started-with-phaser-4-vite-typescript-setup-using-the-official-create-game-app/
- https://itch.io/docs/creators/html5 · https://itch.io/t/2025776/experimental-sharedarraybuffer-support
- https://godotengine.org/article/progress-report-web-export-in-4-3/ · https://www.rafa.ee/articles/deploying-godot-4-html-exports/
- https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
- https://itch.io/jam/gump-jam-3
