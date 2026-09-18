# Rules

Rules for Spidey Wars Ep.1 — a Phaser 4 + Vite + TypeScript jam game, no backend, no framework beyond the engine. Rules are numbered `R001`, `R002`, ... independently per file. A normative rule says must/never; a guidance rule says prefer, and states the narrow exception inline.

## `general/` — cross-cutting conventions

| file                                | covers                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `general/architecture.md`           | The `sim/cutscene/config/scenes/ui/scripts/test` skeleton and the two-layer purity gate (`.oxlintrc.json`'s edit-time layer, `.dependency-cruiser.mjs`'s transitive layer) — what each actually enforces, read from the configs themselves. |
| `general/files-and-naming.md`       | Scene files as `PascalCase.ts` matching their class, every other module kebab-case, the `types/`-folder ban, and co-located test naming.                                                                                                    |
| `general/comments.md`               | What earns a comment, the two kinds of comment, TODO discipline, commented-out code, one-sentence length/format, the phone test, and the ban on legacy/prior-implementation references.                                                     |
| `general/design-mirror.md`          | The DesignSync source-pull and mirror-push rituals, both main-session-only, `.design-sync/config.json`'s two pinned project identities, and C2PA stripping.                                                                                 |
| `general/documentation-practice.md` | How this ruleset and other project docs — including this index — stay accurate and cross-referenced as the codebase changes.                                                                                                                |
| `general/toolchain.md`              | The six `pnpm check` gates and what each proves, the `depcruise`/`jscpd` path-scoping rule, `preserveSymlinks`, the canary discipline, phase-level (not per-commit) gates, the lefthook glob-skip behavior, and the commit/PR conventions.  |
| `general/classes.md`                | Why `Phaser.Scene` subclasses and FSM state objects are the only classes in this codebase, and why `sim/`/`cutscene/`/`scripts/lib/` export functions instead.                                                                              |

## `tech-stack/` — framework and tool specifics

| file                       | covers                                                                                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tech-stack/typescript.md` | `erasableSyntaxOnly`/`verbatimModuleSyntax`/`.ts`-extension-import compiler reality, the `types/`-folder cross-reference, discriminated-union modelling, and strict-mode discipline.                                                                      |
| `tech-stack/phaser.md`     | Renderer config (`pixelArt` overriding `roundPixels`), `BitmapText`-only text and the XML bitmap-font-data requirement, `generateTexture`'s Canvas-2D rasterization path, and the confirmed `Filters.Vignette` API.                                       |
| `tech-stack/vite.md`       | The `dist/`/`dist-test/` two-build split, the `__TEST__` flag wired through `define` (not a `VITE_`-prefixed env var), and the `base: './'` itch deploy constraint.                                                                                       |
| `tech-stack/vitest.md`     | Coverage config mechanics: `provider: "v8"`, the mandatory explicit `coverage.include` (Vitest 4 removed `coverage.all`), and per-glob `perFile: true` thresholds.                                                                                        |
| `tech-stack/playwright.md` | Driving and asserting state entirely through `window.__TEST__` (no locators), fixture isolation, the `threshold`/`maxDiffPixels` screenshot knobs, exact-version pinning matched to the Docker tag, and one root config with one `project` per test tier. |

## `testing/` — what earns a test, per suite

| file                        | covers                                                                                                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testing/README.md`         | Cross-suite rules shared by all four suites: where test code lives, shared support code, root-level audits, and the non-vacuous-fitness-check discipline.                                                                    |
| `testing/unit-testing.md`   | Pure, engine-free logic: `src/sim/**`, `src/cutscene/**`, `scripts/lib/**` — scope, 95% coverage thresholds, determinism, export-for-testing sequencing against `knip`, and property-based tests.                            |
| `testing/replay-testing.md` | The `Replay` format, the two runners (sim-only Vitest, full-game Playwright) that must agree, trajectory-digest assertions, and why the corpus starts empty.                                                                 |
| `testing/e2e-testing.md`    | User-observable behavior in a real browser, driven and asserted only through `window.__TEST__`, the two-build rule, and spec isolation.                                                                                      |
| `testing/visual-testing.md` | Rendered appearance via golden pixel comparison: container-only capture, CI-owned baselines, the `maxDiffPixels`/`threshold` pixel-perfect contract, and checking a baseline against its source of truth before freezing it. |
