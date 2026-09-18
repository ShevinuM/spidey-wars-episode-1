# Docs

A map of this project's documentation, and when to read each piece.

- **[`architecture.md`](./architecture.md)** — the canonical decision record: the `src/sim`/`src/scenes` purity boundary, the five patterns that earn their place (fixed timestep, FSM, observer, pooling, data-driven config), the rejected-patterns table, and the testing strategy. Read it before touching `src/sim/`, `src/cutscene/`, or anything that crosses the purity boundary.
- **[`tech-stack.md`](./tech-stack.md)** — why Phaser 4 + Vite + TypeScript was chosen, the HUD-in-Phaser decision, chrome-drawing technique, build order, and stack-specific gotchas (itch deploy, bitmap fonts, logical resolution). Read it before making a stack-level decision, or when you need the reasoning behind a decision `rules/` only states as a fact.
- **[`rules/`](./rules/README.md)** — the prescriptive, `R001`-numbered rulebook this codebase is audited against: `general/` (cross-cutting conventions and toolchain), `tech-stack/` (framework/tool-specific facts), `testing/` (what earns a test, per suite). Read `rules/README.md` before editing any rule file, and read the specific rule file that governs the code you're about to write before writing it.
- **[`ci/`](./ci/README.md)** — the pipeline: every workflow and what its jobs prove, which checks gate a merge and why the rest deliberately don't, how to re-baseline the visual suite, and the GitHub Pages and itch.io deploy targets. Read it before changing anything under `.github/workflows/`.
