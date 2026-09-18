# Unit testing

What earns a unit test, coverage thresholds, determinism, and the export-for-testing sequencing that keeps `knip` from failing. Cross-suite rules live in `README.md` — not repeated here.

## Scope

- [ ] **R001** Unit tests cover pure, engine-free logic only: `src/sim/**`, `src/cutscene/**`, `scripts/lib/**`. If an assertion needs a running Phaser instance or a real browser, it belongs in `e2e-testing.md` or `visual-testing.md` instead — reaching for a DOM/canvas workaround here defeats the reason this suite stays fast.
- [ ] **R002** Coverage pressure follows the architecture, not the file tree: `src/sim/**`, `src/cutscene/**`, and `scripts/lib/**` earn the richest coverage — cheapest to test, costliest to get wrong. `src/scenes/**` and `src/ui/**` carry no unit-test obligation; their assurance comes from `e2e-testing.md` and `visual-testing.md` instead.
- [ ] **R003** A module earns a test file when it owns a runtime branch or invariant of its own — not because every source file is expected to have a sibling test. A type-only file or a pure passthrough is proven by the type checker, not a spec.
- [ ] **R004** The unit under test is a behavior, not a file or a single method — a state machine (`playerState`) is specified through its public transitions (state in, event, state out), grouped by behavior, never one test per getter.

## Coverage thresholds

- [ ] **R005** `src/sim/**`, `src/cutscene/**`, and `scripts/lib/**` each carry a 95% coverage threshold in `vitest.config.ts`'s per-glob `coverage.thresholds`. Every one of those three glob entries sets `perFile: true` explicitly on the entry itself — never rely on it inheriting from a top-level `perFile` setting, since whether a glob threshold inherits the top-level value is not consistent across Vitest's own documentation. See `../tech-stack/vitest.md` for the exact config shape.

## Determinism

- [ ] **R006** No module under `src/sim/**`, `src/cutscene/**`, or `scripts/lib/**` calls `Math.random()` or `Date.now()` directly — randomness enters only through a seed threaded in from the caller (`src/sim/rng.ts`), and time enters only through the `dt` passed into `step()`. This is what lets a given seed and input log reproduce byte-identical output, which both this suite's assertions and `replay-testing.md` depend on.

## Export sequencing

- [ ] **R007** A module-private helper is made public (exported) only in the same change that adds the unit test importing it — never speculatively, ahead of the test that needs it. `knip` treats an export with no importer as unused and fails the build, so exporting first and testing later leaves a red gate in between for no reason. Phase 01's `skyColorAt` in `src/scenes/BootScene.ts` is the case that established this: it could not be exported and tested as two separate steps.
- [ ] **R008** The sequencing in R007 does not apply to `src/main.ts` — it matches `knip`'s default entry-file pattern, and `knip` never reports an unused export from an entry file regardless of whether any test imports it. Do not export a helper from `src/main.ts` early "because entry files are exempt," and do not write a test against `src/main.ts` solely to satisfy `knip` — the exemption means no such test is needed.

## Property-based tests

- [ ] **R009** A property-based test against `src/sim/**` (for example, energy conservation across many `(theta, ropeLen, steps)` inputs in `pendulum.test.ts`) is written with `@fast-check/vitest`'s `test.prop([...])` (or `it.prop([...])`), not bare `fc.assert(fc.property(...))` inside a plain `it()` — `test.prop` is fast-check's own documented, recommended integration with Vitest.
