# Replay testing

The `Replay` format, the two runners that play it back, and why the corpus starts empty. No v2 equivalent — replays are new to this project.

## What a replay is

- [ ] **R001** A `Replay` is `{ seed: number, inputs: Array<[step, action]>, expected }` — every input is keyed to a sim step, never to wall-clock time or a frame count at a particular refresh rate. This is what lets a replay reproduce byte-identical output on any machine, at any refresh rate — the same guarantee `../../architecture.md`'s fixed-timestep accumulator provides for a single tick.
- [ ] **R002** Replay fixtures live in `test/replays/`, one file per recorded scenario. The runner that plays them back and the digest function both live in `test/support/`, shared by the sim-only path and the full-game path (`README.md`'s suite-ownership rules).

## Two runners, one purpose

- [ ] **R003** Every replay runs through two paths — `src/sim/` alone in Vitest, and the full running game in Playwright via `__TEST__.replay()` — never only one. If the two outcomes differ, the bug is in the `GameScene` ↔ `sim` adapter (an input mapping error, a sprite holding authoritative state, a scene mutating the world directly) — no other test in this project can see that class of bug.
- [ ] **R004** Assert the trajectory digest every 60 steps, not only the final outcome. A tuning change can alter the arc of a swing while the catch still lands at the end; a changed digest with an unchanged final outcome means the physics moved and needs review even though a final-outcome-only assertion would pass.

## Determinism and frame independence

- [ ] **R005** A replay must produce an identical digest whether the sim is advanced 60 times at `1/60s` or driven through a single `stepTo(60)` call. A replay that only passes when single-stepped is masking state carried outside `World` — see `unit-testing.md` R006 for the underlying no-`Math.random`/no-`Date.now` rule this depends on.

## Corpus status

- [ ] **R006** The replay corpus is empty today — recording a real scenario needs player input capture, which does not exist yet. This is a deliberate deferral (`Tasks/DEFERRED[H].md` item 2), not an oversight: replay specs are written and wired into the runner, then marked skipped, never deleted and never backed by fabricated input data, until the first real replay is recorded.
