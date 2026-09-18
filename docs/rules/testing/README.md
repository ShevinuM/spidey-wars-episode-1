# Testing — index

Rules shared across all four suites (unit, e2e, visual, replay) live here so no rule has two homes; each suite file opens with its own admission rule for what belongs there.

## Suite ownership

| file                | covers                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| `unit-testing.md`   | Pure, engine-free logic: `src/sim/**`, `src/cutscene/**`, `scripts/lib/**`.                                 |
| `e2e-testing.md`    | User-observable behavior in a real browser, driven through `window.__TEST__` against the single `<canvas>`. |
| `visual-testing.md` | Rendered appearance via golden pixel comparison, captured inside the pinned Playwright container.           |
| `replay-testing.md` | Deterministic input-log playback that cross-checks `src/sim/` alone against the full running game.          |

## Where test code lives

- [ ] **R001** A pure module under `src/sim/**`, `src/cutscene/**`, or `scripts/lib/**` keeps its unit test co-located beside it — `foo.ts` and `foo.test.ts` in the same folder — never in a separate top-level test tree.
- [ ] **R002** Everything that needs a real browser lives under the top-level `test/` folder, split by suite: `test/e2e/` for behavior specs, `test/visual/` for golden-image recipes, `test/replays/` for replay fixtures and the runner that plays them back, `test/audits/` for repo-wide, non-Playwright hygiene checks, and `test/support/` for harnesses and fixtures shared by more than one of the above. A spec never lives loose at the top of `test/` outside one of these five folders.
- [ ] **R003** Shared support code (the `__TEST__` driver helpers, visual-state lists, replay-runner internals) lives once in `test/support/`, imported by whichever suites need it — never copy-pasted per suite.
- [ ] **R004** Never export a Vitest or Playwright suite from a file that is also imported elsewhere as a test — importing one test file from another re-registers its cases.

## Cross-suite discipline

- [ ] **R005** A pure signature or file-relocation change with no behavior change needs no new test in any suite — the type checker (for logic) and unchanged goldens (for rendering) are already the proof.
- [ ] **R006** When a test exposes real misbehavior, fix the implementation, not the test — in any suite.
- [ ] **R007** An unhappy path — an empty world, a boundary tuning value, a malformed replay, an empty scene — carries at least equal weight to the happy path in every suite.
- [ ] **R008** Every time a bug surfaces, whether self-found or reported, add a test that reproduces it at the lowest suite that can reach it (unit before e2e, e2e before visual), and land the fix together with that test in the same commit.
- [ ] **R009** A new test-suite fitness check (a rule enforced by a test rather than by a build gate) is proven non-vacuous before it's trusted: fire it against a deliberate violation first, confirm it fails, then rely on it. This is the test-suite instance of the canary discipline `../general/toolchain.md` states for gates generally.

## Root-level audits

- [ ] **R010** `test/audits/` holds checks whose subject is the whole tree rather than one module — for example, a scan confirming every `test/replays/*` fixture parses as a valid `Replay`, or that every relative import under `test/**` carries its `.ts` extension, or a coverage-threshold assertion independent of the `vitest` reporter's own gate. It never holds a spec whose subject is a single scene or a single replay — those belong in `e2e-testing.md`, `visual-testing.md`, or `replay-testing.md`.
- [ ] **R011** The purity boundary itself (`src/sim/` never importing Phaser) is not re-asserted inside `test/audits/` — it is already enforced at lint speed and at CI speed by the two gates named in `../../architecture.md`'s Conventions section. Duplicating it as a Vitest audit would only be a second, weaker copy of an existing gate.
