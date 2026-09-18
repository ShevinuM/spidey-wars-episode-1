# Vite

Build configuration: the two-output-directory split, the test-hooks flag mechanism, and the itch deploy constraint. Vite is the bundler only — TypeScript's own compiler flags live in `typescript.md`.

## Two builds

- [ ] **R001** `vite.config.ts` branches on `mode`: `pnpm build` (`vite build`, default mode) writes `dist/` — the artifact that ships to itch, with no test hooks. `pnpm build:test` (`vite build --mode test`) writes `dist-test/` — the artifact every e2e, visual, and replay spec runs against. Never point a Playwright spec at `dist/` except the boot smoke test (`../testing/e2e-testing.md` R007), and never ship `dist-test/`.
- [ ] **R002** `dist-test/` additionally builds with `sourcemap: true` (already set in `vite.config.ts`'s `mode === "test"` branch) — a debuggable test artifact is worth the extra size; the shipped `dist/` build stays sourcemap-free.

## The `__TEST__` flag — one mechanism, stated once

- [ ] **R003** The test-hooks flag is `__TEST__`, wired through Vite's `define`, not through a `VITE_`-prefixed `import.meta.env` variable. Extend the existing `mode === "test"` branch in `vite.config.ts`:
  ```ts
  define: { __TEST__: JSON.stringify(mode === "test") },
  ```
  and declare it as a top-level ambient value in `src/vite-env.d.ts`:
  ```ts
  declare const __TEST__: boolean;
  ```
  `src/vite-env.d.ts` stays a plain script file for this (see `typescript.md` R005) — no `declare global`, no top-level `import`/`export`.
- [ ] **R004** `docs/architecture.md` gates `src/test-hooks.ts` on `import.meta.env.VITE_TEST_HOOKS`, a `VITE_`-prefixed env var; `docs/tech-stack.md` and the plan both point at a `window.__TEST__` runtime object instead, which implies a `__TEST__`-named flag. `vite.config.ts` wires up neither — it branches on `mode === "test"` for `outDir`/`sourcemap` only, with no `define` block and no `.env.test`. `__TEST__` via `define` (R003) is the one actual rule; do not reintroduce `VITE_TEST_HOOKS` or add a `.env.test` file to implement it — `define` needs no env-file plumbing and its name matches `window.__TEST__`. Wiring this up is code, not a docs change — it is phase 03's job, not this rule file's; this rule exists so phase 03 has no mechanism to choose between.
- [ ] **R005** Both `define` entries and `import.meta.env.*` constants are replaced with literal values at build time, so either mechanism tree-shakes the gated `src/test-hooks.ts` block out of `dist/` correctly once wired — the reason to prefer `define` here is the naming match and the absence of env-file plumbing, not a tree-shaking difference between the two.

## Deploy constraint

- [ ] **R006** `base: './'` in `vite.config.ts` (already set) is load-bearing, never `/`. itch.io serves an uploaded HTML game from a hashed subpath; an absolute `/assets/...` reference resolves against the wrong origin and 404s with no visible error — the game just never starts.

## Sources

- `/vitejs/vite`
- https://github.com/vitejs/vite/blob/main/docs/config/shared-options.md — `define`: statically replaced at build time (R003, R005)
- https://github.com/vitejs/vite/blob/main/docs/guide/env-and-mode.md — `import.meta.env.*`, mode-based config (R004, R005)

Note: the above two pages were fetched from Vite's `main`-branch docs during research; installed is `vite@7.3.6`. The `define`/`import.meta.env` static-replacement contract is stable across that gap, but a future rule citing a Vite-version-specific detail should re-query a version-pinned id (e.g. `/vitejs/vite/v7.3.1`) rather than reuse these URLs as if they were version-matched.
