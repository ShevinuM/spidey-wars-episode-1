# Toolchain & tooling

The gates in `pnpm check`, what each one proves, the canary discipline that keeps a gate honest, and the commit/PR conventions.

## The gates

- [ ] **R001** `pnpm check` runs six gates in sequence, each proving something different — a later gate does not re-check what an earlier one already covers:
  - `pnpm typecheck` (`tsc --noEmit`) — the compiler's own soundness check over `tsconfig.json`'s `include` (`src`, `vite.config.ts`). Proves the types hold; proves nothing about runtime behavior.
  - `pnpm lint` (`oxlint --deny-warnings`) — fast syntactic rules plus the purity layer's edit-time half (`../general/architecture.md` R003). `.oxlintrc.json` ignores `reference/**` (vendored design source, not project code).
  - `pnpm architecture` (`depcruise src --config .dependency-cruiser.mjs --output-type err-long`) — the purity layer's transitive half plus the project-wide no-circular-dependency rule. See `architecture.md` R003 for exactly what its `forbidden` rules check; not restated here.
  - `pnpm format` (`prettier --check .`) — tree-wide formatting. `.prettierignore` and `.oxlintrc.json`'s `ignorePatterns` both exclude `reference/**` (vendored design source, not project code). Read-only; use `pnpm format:write` to fix.
  - `pnpm duplication` (`jscpd`) — duplicate-code detection, scoped by `.jscpd.json`'s `path`.
  - `pnpm knip` (`knip`) — unused exports and unused dependencies, scoped by `knip.jsonc`'s `project`/`entry`/`ignore`.
- [ ] **R002** `depcruise` and `jscpd` must only be given paths that exist — a path argument or config entry pointing at a directory not yet created errors outright rather than skipping it. Today `package.json`'s `architecture` script runs `depcruise src` and `.jscpd.json`'s `path` is `["src"]`; `test` is added to both once phase 03 creates `test/`, and `scripts` is added to both once phase 05 creates `scripts/` — to both configs together, never just one, or the two gates scope to different trees.
- [ ] **R003** `.dependency-cruiser.mjs`'s `options.preserveSymlinks: true` is load-bearing and must never be removed or "simplified" away — and neither may the dual `^phaser|^node_modules/phaser` pattern each `forbidden` rule matches against, which exists precisely because `preserveSymlinks` changes which of the two a real violation resolves to. Without `preserveSymlinks: true`, dependency-cruiser resolves imports through pnpm's virtual store (`node_modules/.pnpm/phaser@4.2.1/...`) instead of the top-level `phaser` specifier, and the purity rules in `architecture.md` R003 silently match nothing — the architecture gate goes green on a real violation instead of failing. This is evidenced by phase 01's own canary testing against the installed toolchain, not by any dependency-cruiser documentation page — cite it that way; do not invent a doc URL for it.

## The canary rule

- [ ] **R004** Every gate that asserts a prohibition ships with a canary that proves it fails on a deliberate violation, and that canary is re-run whenever the gate's own config changes — not just written once and forgotten. A gate that has never been seen to fail is unverified, not passing. The case that motivated this: without `preserveSymlinks` (R003), the architecture gate's purity rules matched nothing, so it would have stayed green on a deliberate violation for as long as nobody ran one through it — a gate that cannot fail is worse than no gate, because it reads as a guarantee and isn't one.

## Gates are phase-level, not per-commit

- [ ] **R005** A gate failing on one commit inside a multi-commit phase is not itself a defect. `prettier --check .` is tree-scoped: it checks every file in the working tree, not only the files a given commit touched, so a commit may legitimately land with `format` red when the file that needs reformatting belongs to a later commit in the same phase. Do not write, or read this file as implying, a rule that every individual commit must leave every gate green — the phase as a whole must, by the time it's declared done.

## Git hooks

- [ ] **R006** A lefthook (or equivalent) hook scoped by `glob` is skipped entirely when no staged file matches that glob — even when the hook's `run` template contains no `{staged_files}` placeholder to filter. A commit touching only `docs/**` does not run a hook globbed to `*.ts`/`*.tsx`; that is the tool working as designed, not a gap to route around.

## Invocation

- [ ] **R007** Every tool is invoked through `pnpm` (`pnpm lint`, `pnpm knip`, ...), never through `npx` or a globally installed binary — `pnpm` resolves the exact pinned `devDependencies` version.
- [ ] **R008** A `package.json` script is the command itself, with no `echo`/brace-group/shell-plumbing wrapper and no `... | grep || echo "clean"` pipeline — a wrapper that swallows a tool's real exit code turns a failing gate into a silent pass.

## Commit convention

- [ ] **R009** A commit message is a single imperative subject line — no body, no trailers, no `Generated with` line. This is the standing rule from phase 03 onward. Commits made through the end of phase 02 carry exactly one trailer, `Co-Authored-By: <name> <noreply@anthropic.com>`, as project history from that period — that trailer is not part of the ongoing convention and is not to be added to any new commit.
- [ ] **R010** One reviewable unit of work per commit.

## PR titles

- [ ] **R011** A pull request title follows Conventional Commits (`feat: ...`, `fix: ...`, `docs: ...`) — `main` squash-merges with the PR title as the resulting commit message (`PR_TITLE`), so the title is the commit history that persists, and R009's subject-line discipline applies to it directly.
