# Architecture & layering

The directory skeleton and the enforcement mechanics behind `../../architecture.md`'s purity rule. Patterns (fixed timestep, FSM, observer, pooling, data-driven config) live in `../../architecture.md` itself and are not restated here — this file owns the skeleton and the two-layer gate that keeps it real.

## The skeleton

- [ ] **R001** Top level is organized by purity, not by feature:
  ```
  src/
    main.ts        Phaser.Game config, scene registration
    sim/            PURE — no Phaser, no DOM, no Math.random, no Date.now
    cutscene/       PURE — same constraints as sim/, isolated from it too (R003)
    config/         data only — tuning constants, cutscene Beat[] data
    scenes/         Phaser Scene subclasses — reads sim/cutscene, draws
    ui/             Phaser draw primitives and generateTexture bakes
  scripts/          build-time tooling, never imports src/ (R004)
  test/             e2e/visual/replay/audit suites — see ../testing/README.md
  ```
  Co-located unit tests (`foo.test.ts` beside `foo.ts`) live inside `sim/`, `cutscene/`, and `scripts/lib/` themselves; they are not a separate top-level tree — see `../testing/README.md` R001.

## The one rule, and the two-layer gate that enforces it

- [ ] **R002** `src/sim/` never imports Phaser. Ever. This is `../../architecture.md`'s one hard boundary — read it there for the "why"; this file states only how it's checked.
- [ ] **R003** Two independent layers enforce purity, at two different speeds, and they check different things:
  - **`.oxlintrc.json`** — edit-time, syntactic. Its `overrides` block applies `no-restricted-imports` to `src/sim/**/*.ts`, `src/cutscene/**/*.ts`, and `src/config/**/*.ts`, banning the literal specifiers `phaser`, `phaser/*`, any `**/scenes/**` or `**/ui/**` relative import, and any `**/test-hooks*` import. This catches a **direct** import as you type it.
  - **`.dependency-cruiser.mjs`** (`pnpm architecture`, CI-speed) — graph-based, catches what oxlint structurally cannot: a **transitive** import (`sim` → some innocent-looking helper → `phaser`). Its `forbidden` rules are stricter than `../../architecture.md`'s prose states: `sim-must-stay-pure` forbids `^src/sim` from reaching `phaser`, `node_modules/phaser`, `src/scenes`, `src/ui`, `src/cutscene`, `src/main.ts`, or `src/test-hooks` — so `sim/` and `cutscene/` are mutually isolated from each other, not only from Phaser. `cutscene-must-stay-pure` is the symmetric rule for `^src/cutscene`. `config-is-data` forbids `^src/config` from reaching Phaser, `scenes/`, or `ui/` (but not `sim/`/`cutscene/` — config data may describe them). `scripts-never-import-game` forbids `^scripts` from importing anything under `^src/` at all. `no-circular` bans any dependency cycle project-wide.
- [ ] **R004** Both layers are load-bearing and neither substitutes for the other — a change that "simplifies" one because the other already covers it removes real coverage; the canary discipline that protects this is `toolchain.md`'s, not restated here.

## Everything else

- [ ] **R005** Fixed timestep, the sim/render split, the FSM shape, the observer pattern for `SimEvent`, and bat pooling are `../../architecture.md`'s patterns — read them there. This file does not restate pattern rationale, only where the code implementing them lives.
- [ ] **R006** `src/config/` holds data only: `tuning.ts`'s magic numbers and `cutscenes/*.ts`'s `Beat[]` arrays. No function with rendering or simulation behavior lives in `config/` — `config-is-data` (R003) enforces the rendering half of that at CI speed; there is no gate for "no simulation behavior in config," so review it by hand.
- [ ] **R007** `scripts/` is build-time tooling — asset generation, the design-mirror export, repo-wide audits invoked from `package.json`. It never imports `src/` (R003's `scripts-never-import-game`), and its own testable logic lives under `scripts/lib/` so it can be unit-tested the same way `sim/` and `cutscene/` are.
- [ ] **R008** Phaser-engine-specific facts (renderer config, text, generated textures, filters) live in `../tech-stack/phaser.md` — this file owns the directory shape and the gates, not the engine's own API surface.
