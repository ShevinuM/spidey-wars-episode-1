# e2e testing

What earns an e2e spec against the single `<canvas>`, how state is driven and asserted, and the two-build rule that keeps the shipped game hook-free. Playwright-tool mechanics live in `../tech-stack/playwright.md`.

## What belongs here

- [ ] **R001** An e2e spec exists only for behavior that genuinely needs a running game in a real browser — if what it asserts is provable from `src/sim/**` alone, write that as a unit test instead (`unit-testing.md`) and skip the e2e spec.
- [ ] **R002** An e2e spec proves a flow works — drive state forward and observe the resulting state. It never exists just to reach a scene for a screenshot; reaching a state to compare pixels is `visual-testing.md`'s job.

## Driving and asserting state

- [ ] **R003** There is one `<canvas>` and no DOM to query, so locator-based page objects do not apply here. Drive the game only through `window.__TEST__`'s methods — for example `goto(scene)`, `freeze()`, `stepTo(step)`, `replay()` — never through `page.locator`/`page.click` against game content. The one exception is the boot smoke test (R007), which needs a real user gesture.
- [ ] **R004** Assert only through `__TEST__.state()`, `__TEST__.digest()`, and screenshots — never by inspecting DOM nodes (there are none to inspect) and never by hand-deriving expected pixel values; compare `state()`/`digest()` output structurally.
- [ ] **R005** Never `page.waitForTimeout`. The game's state advances deterministically through `__TEST__.stepTo`/`freeze`, so there is always an exact step to wait for instead of a wall-clock delay — await the `__TEST__` call itself, or poll `__TEST__.state()`/readiness with Playwright's own expect-polling, never a fixed sleep.

## Two builds

- [ ] **R006** Every e2e, visual, and full-game replay spec runs against `dist-test/` (built with the test-hooks flag on, exposing `window.__TEST__`) — never against `dist/`, which ships with no test hooks at all.
- [ ] **R007** The one exception is the boot smoke test: it runs against real `dist/`, served from a nested subpath that reproduces itch's hashed embed path, and drives the real "click to start" gesture rather than `__TEST__` — its whole job is proving the shipped artifact boots for a real user, which a `dist-test/` run cannot verify.

## Isolation

- [ ] **R008** No shared state between specs — each spec drives its own state from a fresh `goto`/`freeze`/`stepTo` sequence and never depends on state a previous spec happened to leave behind.
