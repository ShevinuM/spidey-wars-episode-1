# Phaser

Phaser-4-specific configuration and API facts that would otherwise cost debugging time — rendering config, asset formats, and the filter/texture APIs this project relies on. Where sim/scene boundaries and patterns come from, see `../../architecture.md`; this file is the engine's own behavior.

## Renderer config

- [ ] **R001** Set `pixelArt: true` alone in the game config and never also set `roundPixels` or `antialias`/`antialiasGL` beside it. Phaser's config reader (`phaser@4.2.1 src/core/Config.js`) reads an explicit `roundPixels` first, then unconditionally overwrites it — along with `antialias`/`antialiasGL` — the moment `pixelArt` is truthy. An explicit `roundPixels: false` next to `pixelArt: true` is silently discarded, not honored; it looks like a working override and is not one.
- [ ] **R002** Ship at **1280×720**, `Scale.FIT`, `CENTER_BOTH`, integer zoom — settled in `docs/tech-stack.md`, restated here because it's a `main.ts` config value like R001.

## Text

- [ ] **R003** `BitmapText` only — never `Text`. A `Text` object anti-aliases, needs a `document.fonts.ready` race guard, and re-rasterizes a canvas texture on every `setText`; `BitmapText` is crisp under WebGL and has none of those costs.
- [ ] **R004** A bitmap font's data file loaded via `load.bitmapFont(key, textureURL, dataURL)` must contain actual XML, not merely have a `.fnt`/`.xml` extension. Export from snowb.org or Hiero using the **XML** output format. Getting this wrong is not a silent failure: Phaser's XML parser (`phaser@4.2.1 src/dom/ParseXML.js`) rejects non-XML content and `XMLFile.onProcess` (`src/loader/filetypes/XMLFile.js`) raises a genuine loader error — an outright failed load, visible in the loader's error event, not a blank or missing font discovered later at render time.

## Generated textures

- [ ] **R005** Draw static chrome (`drawHudChrome`, the six `drawSceneBg` backdrops) once at boot with `Graphics`, snapshot it with `generateTexture(key, w, h)`, then `destroy()` the `Graphics` object — never redraw per frame. This is `docs/tech-stack.md`'s "draw once, `generateTexture`" decision; this file adds the API detail behind one of its consequences (R006).
- [ ] **R006** `generateTexture()` rasterizes through a real Canvas 2D context (`sys.textures.createCanvas` + `renderCanvas`, `phaser@4.2.1 src/gameobjects/graphics/Graphics.js`) regardless of whether the game's main renderer is WebGL — it is a genuine Canvas-API path, not a WebGL-equivalent shortcut. This is why `ui/primitives.ts`'s `vGradient` must be implemented as N solid horizontal bands rather than a true gradient fill: `Graphics` has no gradient-fill primitive that survives `generateTexture`, on either renderer.

## Filters

- [ ] **R007** `Phaser.Filters.Vignette` is available and confirmed in Phaser 4 — `camera.filters.internal.addVignette([x], [y], [radius], [strength], [color], [blendMode])` (or `.external.addVignette(...)`), the same filter family as the already-confirmed `addGlow`/`addBarrel`. Use it directly rather than routing the vignette through the generated-overlay-texture fallback for renderer-support reasons; `docs/tech-stack.md` still calls Vignette "not confirmed" and recommends the overlay as the safe path — that document is read-only to this phase, so the two now disagree on record (tracked for phase 03's handoff to reconcile). The generated-overlay-texture approach can still be the right _first_ implementation for other reasons (matching the scanline pass, one draw call with the rest of the chrome) — R007 only overturns the "unconfirmed, so avoid it" caution, not the sequencing.

## Classes

- [ ] **R008** Scene files (`BootScene.ts`, `TitleScene.ts`, `CutsceneScene.ts`, `GameScene.ts`, `UIScene.ts`, `GameOverScene.ts`) are `Phaser.Scene` subclasses. Together with FSM state objects (`sim/playerState.ts`), they are the only classes in this codebase — see `../general/classes.md`. Everything else, including all of `sim/`, exports functions operating on plain data.

## Sources

- `/websites/phaser_io_api-documentation`
- https://docs.phaser.io/api-documentation/class/filters-vignette — `Filters.Vignette` confirmed present (R007)
- https://docs.phaser.io/api-documentation/class/gameobjects-components-filterlist — `camera.filters.internal`/`.external` filter API (R007)
- https://docs.phaser.io/api-documentation/class/core-config — game config fields including `pixelArt`/`roundPixels` (R001)
- https://docs.phaser.io/api-documentation/class/loader-loaderplugin — `load.bitmapFont` (R004)
- https://docs.phaser.io/api-documentation/class/gameobjects-graphics — `Graphics.generateTexture` (R006)
- Installed `phaser@4.2.1` source (evidence beyond doc-site prose, verified directly): `src/core/Config.js` (R001), `src/dom/ParseXML.js` + `src/loader/filetypes/XMLFile.js` + `src/loader/filetypes/BitmapFontFile.js` (R004), `src/gameobjects/graphics/Graphics.js` (R006)
