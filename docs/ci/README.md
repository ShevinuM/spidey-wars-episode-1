# CI

What runs, when it runs, and what each run actually proves. The gates themselves — what
`pnpm typecheck`, `lint`, `architecture`, `format`, `duplication` and `knip` each check,
and the canary discipline that keeps them honest — are defined in
[`../rules/general/toolchain.md`](../rules/general/toolchain.md) and are not restated here.

## The workflows

| workflow                                                               | fires on                                                                                                     | jobs                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------- |
| [`ci.yml`](../../.github/workflows/ci.yml)                             | every pull request; every push to `main`                                                                     | `changes`, `gate`, `visual` |
| [`codeql.yml`](../../.github/workflows/codeql.yml)                     | every pull request; every push to `main`                                                                     | `CodeQL`, once per language |
| [`pr-title.yml`](../../.github/workflows/pr-title.yml)                 | a pull request opened, edited or pushed to                                                                   | `pr-title`                  |
| [`sonar.yml`](../../.github/workflows/sonar.yml)                       | every pull request; every push to `main`                                                                     | `sonar`                     |
| [`trivy-image.yml`](../../.github/workflows/trivy-image.yml)           | Mondays at 04:17 UTC; a pull request touching `Dockerfile.visual`, `.trivyignore` or itself; manual dispatch | `trivy-image`               |
| [`update-baselines.yml`](../../.github/workflows/update-baselines.yml) | manual dispatch only                                                                                         | `update-baselines`          |
| [`deploy.yml`](../../.github/workflows/deploy.yml)                     | every push to `main`; manual dispatch                                                                        | `build`, `deploy`           |
| [`deploy-itch.yml`](../../.github/workflows/deploy-itch.yml)           | a pushed tag matching `v*`; manual dispatch                                                                  | `deploy-itch`               |

## What each job proves

- **`changes`** — whether the commit touches anything the visual suite can see (scenes, UI,
  cutscenes, config, `public/`, the visual harness, `Dockerfile.visual`,
  `playwright.config.ts`). It proves nothing about the code; it decides whether `visual`
  runs. It is required in its own right because a `visual` skipped by a _broken_ filter
  reports the same SKIPPED as one skipped correctly.
- **`gate`** — the full `pnpm check` set plus the suites and scans that need a build:
  workflow linting, Gitleaks, Trivy's filesystem scan, unit coverage, both Vite builds, the
  bundle budget, and the smoke and e2e browser suites. Cheapest first, so a failure costs
  the minutes it saves rather than the minutes after it. Workflow linting lives here and
  nowhere else — `actionlint` ships no npm CLI, so unlike every other tool it cannot be run
  through `pnpm` or from a git hook; [`lefthook.yml`](../../lefthook.yml) records the same
  exception locally.
- **`visual`** — the golden-pixel suite, inside the pinned Playwright container. It exists
  only there: `playwright.config.ts` registers the `visual` project when `VISUAL_CONTAINER=1`
  is set, and baselines are captured against that exact image. See
  [`../rules/testing/visual-testing.md`](../rules/testing/visual-testing.md).
- **`CodeQL`** — GitHub's own analysis over two languages: the game's TypeScript, and this
  repo's workflow files (script injection through untrusted event input, over-broad
  permissions, unpinned actions). The job is named `CodeQL` and GitHub appends each matrix
  value in parentheses, so one job definition produces one check run per language.
- **`pr-title`** — that the pull request title is Conventional Commits. `main`
  squash-merges with the title as the commit message, so this is the check that keeps
  [`../rules/general/toolchain.md`](../rules/general/toolchain.md) R012 true of history.
- **`sonar`** — maintainability and duplication analysis, and only when `SONAR_TOKEN`
  exists. Without the secret every step past the announcement is skipped and the run costs
  nothing.
- **`trivy-image`** — that `Dockerfile.visual` still builds, and that the image it produces
  has no fixable CRITICAL or HIGH vulnerability. `ci.yml`'s `visual` job pulls the base
  image through `container:` and never builds the file, so this is the only place the
  Dockerfile is exercised at all. Weekly it reports; on a pull request it blocks.
- **`update-baselines`** — nothing. It is a producer, not a check: it regenerates the
  visual baselines and commits them back.
- **`build` / `deploy`** — that `pnpm build` still produces a `dist` and that Pages served
  it. No gate is re-run here; `ci.yml` already ran on the pull request the commit came from.
- **`deploy-itch`** — that the tagged build reached the itch.io channel. Skipped entirely
  until the `ITCH_TARGET` repository variable is set.

## Which checks gate a merge

Branch protection registers its required contexts from the live check-run names on a real
pull request, never from a list retyped into a document: GitHub matches a context by exact
string, and a name that matches nothing blocks every merge forever. The set it registers is
`changes`, `gate`, `visual`, `pr-title`, and CodeQL's per-language check runs — never the
aggregate `CodeQL` name, which is a job name rather than a check run. The payload, the
registration procedure and the merge settings are documented in `branch-protection.md` in
this directory, which lands together with the protection settings themselves.

The rest are deliberately not required, each for its own reason:

- **`sonar`** — a third-party analysis service must not be able to block a merge by being
  down, and an unconfigured one must not be able to block it by being absent.
- **`trivy-image`** — it does not run on most pull requests, and a required context that
  never reports leaves the pull request permanently pending. It blocks on the pull requests
  where it does run, which is where a Dockerfile change has an author to answer for it.
- **`update-baselines`** — manual, and it writes to a branch rather than judging it.
- **`deploy` and `deploy-itch`** — they run after a merge, not before one.

A skipped job satisfies a required check, so requiring `visual` does not block the pull
requests that touch no visual path.

## Re-baselining the visual suite

Baselines are produced by CI and committed back, never generated locally — the machine that
captures a golden must be the machine that later compares against it. To regenerate them
for a branch:

```sh
gh workflow run update-baselines.yml --ref <branch> -f ref=<branch>
gh run list --workflow=update-baselines.yml --branch <branch> --limit 1 --json databaseId,status,conclusion
```

The run commits only when the bytes actually moved; when they have not, it logs
`baselines unchanged` and pushes nothing, which is also how the container's determinism is
checked. A push made with `GITHUB_TOKEN` does not trigger another workflow run, so the
branch's next ordinary push is what re-runs CI against the new baselines.

## Deploy targets

**GitHub Pages**, at <https://shevinum.github.io/spidey-wars-episode-1/>, from every push to
`main`. `deploy.yml`'s `build` job runs `pnpm build` and uploads `dist` as the Pages
artifact; its `deploy` job publishes that artifact to the `github-pages` environment. The
publish job is the one job in this repo that is never cancelled by a newer run — a
cancelled deployment can leave Pages serving a half-updated site. The site sits under a
path prefix rather than at the domain root, which works because `vite.config.ts` sets
`base: './'` and every asset reference in `dist/index.html` is therefore relative; see
[`../rules/tech-stack/vite.md`](../rules/tech-stack/vite.md).

**itch.io**, from a pushed tag matching `v*`. The job is skipped until the target exists, so
the workflow is inert rather than red. To turn it on:

```sh
gh variable set ITCH_TARGET --body "<user>/<game>:<channel>"
gh secret set ITCH_API_KEY
```

Then a tag publishes: `git tag v0.1.0 && git push origin v0.1.0`. The tag name becomes the
build's user version on itch.

## Sources

- [`actions/deploy-pages`](https://github.com/actions/deploy-pages) — the job that deploys
  needs at minimum `pages: write` and `id-token: write`, and should target the
  `github-pages` environment.
- [`actions/configure-pages` `action.yml`](https://github.com/actions/configure-pages/blob/main/action.yml)
  — the `enablement` input defaults to `false`, so the action only reads the Pages site that
  already exists.
- [itch.io docs — installing butler](https://itch.io/docs/butler/installing.html) — the
  permanent broth URL to use from CI, and what its zip contains.
- [itch.io docs — pushing builds](https://itch.io/docs/butler/pushing.html) —
  `--userversion` supplies your own build number.
