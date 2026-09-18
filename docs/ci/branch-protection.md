# Branch protection for `main`

How `main` is protected: the exact payload, the merge settings that have to agree with it, and
the procedure for registering required status checks. Recorded here rather than left in one
shell's history, so the configuration is reproducible from the repo.

What each check _is_ — which workflow produces it and what a green run proves — belongs to
[`README.md`](./README.md) in this directory and is not restated here. This document owns only
how `main` is protected.

**Status: not applied at the time this file was committed.** Branch protection is a `gh api`
call against repository configuration, not a file in a diff. The sequence is: this commit is
pushed to `main` → the phase's rules audit passes over the committed tree → the commands below
are run once, in order — this phase by the orchestrating agent on the developer's behalf →
the configuration is read back (section 4). Everything
below is written as what _will_ be run, because at the moment of this commit none of it has
been.

The order is not cosmetic. `enforce_admins: true` closes `main` to direct pushes for everyone
including the repo owner, so any correction that has not landed before the PUT cannot land
afterwards without going through a pull request.

## 1. Apply the protection payload

```
gh api -X PUT repos/ShevinuM/spidey-wars-episode-1/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": [] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "require_code_owner_reviews": false,
    "dismiss_stale_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

Every field is load-bearing. None of these are defaults left alone:

- **`contexts: []`, not `null`.** The empty array is what makes the incremental
  `POST .../protection/required_status_checks/contexts` calls in section 3 work; with the
  object disabled, every future addition means re-PUTting this entire payload instead of adding
  one context at a time. Contexts are registered after the PUT, not inside it, because a
  context may only be required once the workflow producing it is on `main` — see the invariant
  in section 3.
- **`strict: false`.** `strict` is GitHub's "require branches to be up to date before merging".
  With `true`, every merge to `main` invalidates every other open pull request's checks and
  forces a full re-run — on a stacked workflow with a gate this size, that is a treadmill.
  `false` lets independent pull requests merge without babysitting each other.
- **`enforce_admins: true`.** This is the only setting that actually stops the repo owner from
  pushing straight to `main`. With `false` every rule below is advisory for the owner and
  binding for no one, because this is a solo repo — there are no other admins to bind.
- **`required_approving_review_count: 0` and `require_code_owner_reviews: false`.** GitHub will
  not let a pull request author approve their own pull request, so on a solo repo any non-zero
  approval count deadlocks every future merge permanently. Including the
  `required_pull_request_reviews` object at all is what turns on "require a pull request before
  merging" in the first place; the `0` inside it only means no approval is needed to satisfy
  that requirement. `require_code_owner_reviews: false` for the same reason —
  [`.github/CODEOWNERS`](../../.github/CODEOWNERS) routes review requests, it does not gate
  merges.
- **`required_linear_history: true`.** Enforces a linear commit history by preventing merge
  commits from being pushed to the branch. This repo is squash-only (section 2), so one pull
  request produces exactly one commit on `main` and history stays a straight line.
- **`allow_force_pushes: false`, `allow_deletions: false`.** Baseline protection against
  destroying `main`'s history or the branch itself.
- **`required_conversation_resolution: true`.** Review conversations must be resolved before a
  pull request can merge.
- **`restrictions: null`.** Push restrictions apply to organization-owned repositories; this
  one is user-owned, so the field has to be sent as `null` rather than an allow-list.

## 2. Match the repo's merge settings to the linear-history rule

`required_linear_history: true` blocks merge commits, so the repo's own merge-button settings
have to agree with it:

```
gh api -X PATCH repos/ShevinuM/spidey-wars-episode-1 \
  -F allow_merge_commit=false -F allow_rebase_merge=false -F allow_squash_merge=true \
  -F squash_merge_commit_title=PR_TITLE -F squash_merge_commit_message=BLANK \
  -F allow_auto_merge=true -F delete_branch_on_merge=true
```

- **`allow_merge_commit=false`.** A merge commit is exactly what `required_linear_history`
  rejects; leaving the button enabled only offers a merge that will be refused.
- **`allow_rebase_merge=false`, `allow_squash_merge=true`.** This repo is squash-only. One pull
  request becomes one commit, and the pull request title becomes that commit's subject line,
  which is what makes the `pr-title` check load-bearing rather than decorative — see
  [`../rules/general/toolchain.md`](../rules/general/toolchain.md) R012.
- **`squash_merge_commit_title=PR_TITLE`.** Defaults the squash commit's subject to the pull
  request title. The only other accepted value, `COMMIT_OR_PR_TITLE`, uses the branch's own
  commit subject when there is a single commit, which would make the subject depend on how many
  commits a branch happened to have rather than on the title the `pr-title` check gates.
- **`squash_merge_commit_message=BLANK`, not `PR_BODY`.** `BLANK` defaults the squash commit to
  an empty message body. [`../rules/general/toolchain.md`](../rules/general/toolchain.md) R010
  forbids a commit body, and R012 makes the pull request title the commit message that
  persists; `PR_BODY` would paste the pull request description into the body of every squash
  commit from here on, breaking R010 on every future merge.
- **`allow_auto_merge=true`.** Lets `gh pr merge --auto --squash --delete-branch <n>` queue a
  merge that fires when the required checks go green, instead of someone watching a long gate
  finish. See "Who presses merge" below for who runs it.
- **`delete_branch_on_merge=true`.** Head branches are deleted on merge; the commit is already
  on `main` and the branch is noise from that point on.

## 3. Register required contexts, one at a time, only after each lands on `main`

```
gh api -X POST repos/ShevinuM/spidey-wars-episode-1/branches/main/protection/required_status_checks/contexts \
  -f "contexts[]=<exact check-run name>"
```

**The invariant: a check becomes required only after the workflow producing it is on `main` —
never the reverse.** A context that is required but never produced sits at "Expected — waiting
for status" forever, and under `enforce_admins: true` that is a hard lock with no bypass short
of dropping protection. Register one context per call, as each producing workflow lands, not a
speculative list up front.

### Reading the names

The names are read live off a real pull request and registered from what is read there:

```
gh pr checks <canary pr number> --json name,state
```

**Never retype a check-run name from any document, including this one.** GitHub matches a
required context by exact string. A job can be renamed between when a document was written and
when the context is registered, silently leaving a required context that nothing satisfies; and
a name mistyped once blocks every merge invisibly until somebody tries to merge and wonders why
the check never appears.

The live protection object is the record of what was actually registered — section 4 reads it
back. This list is what the registration is _aiming_ at:

- **`changes`, `gate`, `visual`** — the three jobs in
  [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml), each given an explicit
  `name:` for exactly this reason.
- **`pr-title`** — the job in
  [`../../.github/workflows/pr-title.yml`](../../.github/workflows/pr-title.yml). The squash
  commit subject is the pull request title, so this check is what keeps
  [`../rules/general/toolchain.md`](../rules/general/toolchain.md) R012 true of history.
- **CodeQL's two per-language check runs** — one per entry in the matrix in
  [`../../.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml). The exact strings
  are read off `gh pr checks`, never derived from the workflow by inspection. **GitHub appends
  _every_ key in a matrix `include` entry to the check-run name, not only the key that varies
  between entries** — this surprised the precedent repo, `ShevinuM/spidey-hub`, once, where
  both entries shared
  `build-mode: none` and GitHub appended it to both names anyway. The name you would guess from
  reading the matrix matches nothing that is ever produced, and by the invariant above that
  blocks every merge forever.

### Why `changes` is required in its own right

`changes` decides whether `visual` runs; it asserts nothing about the code. It is still
required, because a skipped job satisfies a required check. A `visual` that is skipped because
`changes` _failed_ reports the same SKIPPED as a `visual` skipped because the commit touched no
visual path — so a broken paths-filter would silently satisfy the `visual` requirement and
unblock every merge. Requiring `changes` is what makes the `visual` requirement mean anything.

`visual` itself is registered on the strength of the same "a skipped job satisfies a required
check" behaviour, confirmed on the canary pull request before it is registered: the canary
deliberately touches no visual path, so `visual` must be observed SKIPPED _and_ the pull request
must still be mergeable. If a skipped `visual` is instead found to block the merge, `visual`
stays unregistered and section 4's read-back is the authoritative record of that.

### Deliberately not required

- **`sonar`** — inert until a `SONAR_TOKEN` secret exists, and a third-party analysis service
  must not be able to block a merge by being absent or down.
- **`trivy-image`** — weekly and Dockerfile-scoped, so on most pull requests it never reports,
  and a required context that never reports leaves the pull request permanently pending. It is
  also **currently red**; because it is not a required check, that blocks nothing.
- **The aggregate check run literally named `CodeQL`** — GitHub emits it alongside the two
  per-language runs. Requiring it does not substitute for requiring those two, and it is not
  one of this repo's own checks.
- **`update-baselines`, `deploy`, `deploy-itch`** — a producer and two post-merge jobs; none of
  them judges a pull request.

[`README.md`](./README.md) carries the longer reasoning for each of these under "Which checks
gate a merge".

## 4. Verify by reading the configuration back

```
gh api repos/ShevinuM/spidey-wars-episode-1/branches/main/protection
```

Confirm at minimum: `enforce_admins.enabled: true`,
`required_pull_request_reviews.required_approving_review_count: 0`,
`required_linear_history.enabled: true`, `required_status_checks.strict: false`, and that
`required_status_checks.contexts` lists exactly the contexts registered in section 3. That
object, not this document, is the record of what is in force.

## Who presses merge

Agents open pull requests and read their checks; a human merges.
[`../../.claude/settings.json`](../../.claude/settings.json) denies `Bash(gh pr merge:*)`, so
the merge — including queueing an auto-merge — is performed by the developer, from the command
line or from the merge button. Nothing in this repo's automation can merge to `main` on its
own.

## Escape hatch — CI outage only

If a genuine CI outage blocks every merge and there is no way to get a required check green,
admin enforcement can be dropped temporarily so the owner can bypass protection:

```
gh api -X DELETE repos/ShevinuM/spidey-wars-episode-1/branches/main/protection/enforce_admins
# ... merge what is needed ...
gh api -X POST repos/ShevinuM/spidey-wars-episode-1/branches/main/protection/enforce_admins
```

Re-enabling is the second half of the same operation, not a follow-up task — between the two
calls `main` is unprotected for the owner.

**Never delete the protection object itself** (`DELETE .../branches/main/protection`) to work
around a stuck check. That removes every rule in section 1, not the one causing trouble, and
the contexts registered in section 3 go with it.

This hatch is for an outage, not for a red check. A failing `gate` is the system working.

## Sources

- [GitHub REST API — protected branches](https://docs.github.com/en/rest/branches/branch-protection?apiVersion=2022-11-28)
  — the `PUT .../branches/{branch}/protection` body used in section 1: `strict` is "Require
  branches to be up to date before merging"; `required_linear_history` "Enforces a linear commit
  Git history, which prevents anyone from pushing merge commits to a branch";
  `allow_force_pushes` "Permits force pushes to the protected branch by anyone with write access
  to the repository"; `allow_deletions` likewise for deleting it; and
  `required_conversation_resolution` "Requires all conversations on code to be resolved before a
  pull request can be merged into a branch". The same page documents the
  `POST .../protection/required_status_checks/contexts` endpoint used in section 3 and the
  `POST`/`DELETE .../protection/enforce_admins` pair used by the escape hatch. Note that the
  page carries a closing-down notice on `contexts` — "Use `checks` instead of `contexts` for
  more fine-grained control" — and documents a `checks` array of objects on the PUT body; the
  `contexts` field and the add-contexts POST are still documented and are what this repo uses,
  but expect this to need revisiting. `restrictions` is "required" and "Set to null to disable";
  "User, app, and team restrictions are only available for organization-owned repositories".
- [GitHub REST API — update a repository](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28)
  — the merge settings in section 2. `squash_merge_commit_message` accepts `PR_BODY`,
  `COMMIT_MESSAGES` and `BLANK`, where "BLANK - default to a blank commit message";
  `squash_merge_commit_title` accepts `PR_TITLE` and `COMMIT_OR_PR_TITLE`; `allow_auto_merge`
  and `delete_branch_on_merge` both default to `false`, so both have to be set explicitly.
