# Vitest

Coverage configuration mechanics for the unit suite. What earns a unit test and the 95% thresholds themselves are `../testing/unit-testing.md`'s policy — this file owns the config shape that enforces it. Not installed yet (phase 03 adds it as a dependency); this file states the config those specs must land with.

## Coverage provider

- [ ] **R001** Leave `coverage.provider` at its default, `v8` — writing `provider: "v8"` explicitly (as the example below does) is harmless; switching to `istanbul` needs a specific reason this project doesn't have.

## `coverage.include` is mandatory

- [ ] **R002** Set `coverage.include` explicitly to the three purity globs (`src/sim/**/*.ts`, `src/cutscene/**/*.ts`, `scripts/lib/**/*.ts`). Vitest 4 removed `coverage.all` and `coverage.extensions` entirely — there is no "include every file in the project regardless of whether a test imports it" default anymore. Without an explicit `coverage.include`, the report silently covers only files some test already happens to import, which understates what's missing rather than flagging it.

## Per-glob thresholds

- [ ] **R003** Each of the three purity globs carries its own `coverage.thresholds` entry at 95%, and each entry sets `perFile: true` explicitly on itself:
  ```ts
  coverage: {
    provider: "v8",
    include: ["src/sim/**/*.ts", "src/cutscene/**/*.ts", "scripts/lib/**/*.ts"],
    thresholds: {
      "src/sim/**/*.ts": { statements: 95, branches: 95, functions: 95, lines: 95, perFile: true },
      "src/cutscene/**/*.ts": { statements: 95, branches: 95, functions: 95, lines: 95, perFile: true },
      "scripts/lib/**/*.ts": { statements: 95, branches: 95, functions: 95, lines: 95, perFile: true },
    },
  }
  ```
  Do not rely on a glob threshold inheriting a top-level `perFile` setting — Vitest's own current docs and the version-pinned 4.0.7 docs disagree on whether inheritance happens at all, so writing `perFile: true` on each glob is the one form that is correct under either reading.

## Sources

- `/vitest-dev/vitest/v4.0.7`, `/vitest-dev/vitest`
- https://github.com/vitest-dev/vitest/blob/v4.0.7/docs/guide/migration.md — `coverage.all`/`coverage.extensions` removed in Vitest 4 (R002)
- https://github.com/vitest-dev/vitest/blob/main/docs/config/coverage.md — glob-threshold `perFile` behavior, unversioned/`main` docs (R003)
- https://github.com/vitest-dev/vitest/blob/v4.0.7/docs/config/index.md — same glob-threshold feature, version-pinned 4.0.7 docs, no `perFile` shown either way (R003)
