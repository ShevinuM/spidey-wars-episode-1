# Playwright

Playwright-API mechanics for a single-`<canvas>` game: how state is driven and asserted at the tool level, fixture isolation, the screenshot-comparison knobs, and version pinning. Testing _strategy_ — what earns an e2e vs. a visual spec, file placement — lives in `../testing/e2e-testing.md` and `../testing/visual-testing.md`.

v2's locator-ranking rules (`getByRole`/`getByTestId`/no-CSS-selector) do not apply here and are replaced outright, not adapted: there is one `<canvas>` and no DOM tree to query.

## Driving state — no locators

- [ ] **R001** There is nothing to locate. Every spec drives the game exclusively through `window.__TEST__`'s API (`goto`, `freeze`, `stepTo`, `replay`, and the rest of the ten members `../../architecture.md` defines) — never `page.locator`, `page.click`, or any DOM/accessibility query against game content. See `../testing/e2e-testing.md` R003 and `../testing/replay-testing.md` R003 for which `__TEST__` calls each suite uses.
- [ ] **R002** The one real Playwright interaction in the whole suite is the boot smoke test's start gesture (`../testing/e2e-testing.md` R007) — a genuine `page.click` on the canvas element itself, because that test's entire job is proving a real user gesture unlocks Web Audio and starts the game. Every other spec reaches its starting state through `__TEST__.goto`/`freeze` instead of a click.

## Assertions & waiting

- [ ] **R003** Where a condition needs to settle before an assertion runs, use `expect.poll(() => page.evaluate(() => window.__TEST__.state()))` (or an equivalent web-first `expect(...).toEqual(...)` against a `__TEST__` read taken through `page.evaluate`, since `__TEST__` lives in the browser page, not in the Node test process), never a hand-rolled `while`/`sleep` loop — Playwright's own built-in retry-until-timeout is the mechanism; `../testing/e2e-testing.md` R005 is the policy this implements (never `page.waitForTimeout`).

## Fixtures & context isolation

- [ ] **R004** Each test gets a fresh, isolated browser context by default (Playwright's own guarantee) — never opt into context reuse for a real spec in `test/e2e/` or `test/visual/`; reused-context isolation is explicitly best-effort (permissions, geolocation, history are not reset between reused-context tests) and this suite has no component-gallery use case that would justify the trade.
- [ ] **R005** Shared setup — building the `__TEST__` driver handle, common `goto`/`freeze` sequences — is extracted into a custom fixture via `test.extend` in `test/support/`, not copy-pasted at the top of every spec file. This is the mechanism behind `../testing/README.md` R003's "shared support code lives once" rule.

## Screenshot comparison mechanics

- [ ] **R006** `toHaveScreenshot`'s comparator exposes two independent knobs, not one: `threshold` (0–1, YIQ color-space, default `0.2`) decides how different two pixels' _colors_ must be before they count as differing at all; `maxDiffPixels`/`maxDiffPixelRatio` decides how many already-differing pixels the whole comparison tolerates before failing. `../testing/visual-testing.md` R006 owns the policy (set both to `0` for true pixel-perfect); this rule is why that policy needs both knobs and not just one.
- [ ] **R007** On a failed screenshot assertion, look at the generated diff image before the differing-pixel count. A small overage concentrated in one region is usually a real rendering bug; scattered single-pixel noise across the frame is usually a determinism problem in what's being captured — `../testing/visual-testing.md` R010 owns fixing that at the source rather than loosening tolerance.

## Version pinning

- [ ] **R008** Pin the `@playwright/test` npm version and the CI Docker image tag (`mcr.microsoft.com/playwright:v<VERSION>-noble`) to the identical version string, derived from one place (for example, a single version value referenced by both `package.json` and the CI workflow file) — never two independently chosen pins that can drift apart. Since Playwright 1.38, the npm package no longer auto-downloads browsers on install; a mismatched image tag means the pinned npm version's browsers are not the ones baked into the image, and Playwright fails to find a browser executable at run time.

## One root config, one project per tier

- [ ] **R009** Every test tier is a `project` entry in a single root `playwright.config.ts`, not a separate config file per tier — mirroring v2's "every tier is a project" rule, adapted to this project's actual tiers: an e2e project covering `test/e2e/**` against `dist-test/`, a visual project covering `test/visual/**` against `dist-test/`, and a boot-smoke project covering the one boot-smoke spec against real `dist/` served from a nested subpath (`../testing/e2e-testing.md` R007). Each project points at its own build through its own `use.baseURL`; the top-level `webServer` option (an array, one entry per build) serves `dist-test/` and the nested-subpath `dist/` on separate ports for the projects to target. Keep the boot-smoke spec out of `test/e2e/` (or `testMatch` it explicitly into only the boot-smoke project and `testIgnore` it out of the e2e project) so the two projects never both run it. The visual project's container-only constraint (`../testing/visual-testing.md` R003/R004) is a run-time guard — registering that project only when an env var marks the run as inside the pinned Docker image — not a `use`-level option.

## Sources

- `/microsoft/playwright`
- https://github.com/microsoft/playwright/blob/main/docs/src/test-api/class-testproject.md — `threshold`/`maxDiffPixels`/`maxDiffPixelRatio` as independent options (R006); per-project `testMatch`/`testIgnore` and `use.baseURL` (R009)
- https://github.com/microsoft/playwright/blob/main/docs/src/test-api/class-testconfig.md — top-level `webServer` accepts an array, one entry per server (R009)
- https://github.com/microsoft/playwright/blob/main/docs/src/docker.md — pinned Docker image tags, baked-in browsers (R008)
- https://github.com/microsoft/playwright/blob/main/docs/src/release-notes-js.md — browsers stopped auto-downloading on install as of 1.38 (R008)
