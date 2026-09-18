# Visual testing

What earns a visual recipe, the container-only capture discipline, and the golden-image contract that keeps a baseline trustworthy. Playwright-tool mechanics live in `../tech-stack/playwright.md`; general test-code placement lives in `README.md`.

## What belongs here

- [ ] **R001** A visual recipe proves rendered appearance — pixels, not flow. It navigates straight to the state it needs through `__TEST__.goto`/`freeze`, never by re-driving a multi-step interaction — driving a flow to prove it works is `e2e-testing.md`'s job.
- [ ] **R002** A visual recipe never asserts on behavior (a click firing, a value changing) — that assertion belongs in `e2e-testing.md`. This suite compares pixels only.

## Capture environment

- [ ] **R003** Visual specs run only inside the pinned Playwright Docker image (SwiftShader software rendering; see `../tech-stack/playwright.md` for the pinned tag) — never against a developer's local GPU-backed browser. GPU and software rasterization produce different pixels for the same scene, which shows up as a false diff.
- [ ] **R004** Baselines are owned by CI, not by a developer's local machine: a golden is accepted only from a container run performed by the CI job. A developer never commits a snapshot produced by a local `--update-snapshots` pass.

## Coverage

- [ ] **R005** Chrome textures (the HUD bake, the six cutscene backdrops) get visual coverage first; gameplay frames are added only once gameplay visuals have stopped changing day to day — matching `../../architecture.md`'s build order.

## Golden-image discipline

- [ ] **R006** `maxDiffPixels: 0` alone is not pixel-perfect comparison. Playwright's `threshold` (a per-pixel color-difference tolerance) defaults to `0.2` independently of `maxDiffPixels`, so a check that sets only `maxDiffPixels: 0` still lets every pixel drift up to that per-pixel tolerance — it only forbids any pixel from exceeding it. Every visual recipe sets both `maxDiffPixels: 0` and `threshold: 0` explicitly.
- [ ] **R007** Rebaseline only in the same change as a deliberate visual change, followed by several clean re-runs and a manual look at every changed image — never to make an unrelated diff pass, and never as a separate follow-up commit.
- [ ] **R008** Never hand-edit a golden image file.
- [ ] **R009** Nothing is baselined until the thing it depicts has been checked against its source of truth, the matching `.dc.html` mockup in `reference/design/` — a golden accepted without that check can freeze a rendering defect as "correct" forever. Phase 01's sky-gradient bug (flat banding where the mockup interpolates smoothly, and the final gradient stop never painted at all) was caught by that check one phase before tier-1 baselines would have captured it — after which no diff would ever have flagged it again.
- [ ] **R010** Keep a golden deterministic at the source, not by tolerance: seed fixtures with the mockup's own seeds (`src/sim/rng.ts`), freeze animations with `__TEST__.freeze()` at capture time, and mask any residual non-deterministic content — never loosen `threshold`/`maxDiffPixels` to compensate for a golden that isn't actually deterministic.
