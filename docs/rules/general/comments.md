# Comments & in-source documentation

The comment discipline for everything under `src/` and `scripts/`. A comment is for a future reader, never a scratch note.

## What earns a comment

- [ ] **R001** A comment earns its place by adding meaning or a non-obvious "why" the code itself can't express — never by narrating a language feature or restating what the next line already says. Code is self-documenting first.
- [ ] **R002** A comment never explains a language feature or walks through a concept the reader is assumed to already know. Teaching and rationale belong in project docs, not shipped source.
- [ ] **R003** A comment found to be misleading or to add no value is deleted, not reworded — the code should carry the meaning on its own.
- [ ] **R004** A boundary assumption or edge case earns a comment only when TypeScript itself cannot express it — a runtime invariant, an ordering guarantee, a caller contract no type captures. If the constraint can instead be encoded as a narrower type or a discriminated union (see `../tech-stack/typescript.md`), encode it there and skip the comment.

## Two kinds of comment

- [ ] **R005** `/** ... */` doc comments sit on declarations and surface on hover — they describe what the thing is or does. `//` line comments are internal notes (implementation "why," a structural banner) that never surface in hover.
- [ ] **R006** A doc comment stays attached to its declaration — a new declaration goes above an existing doc comment, never wedged between it and the thing it documents — and an existing doc comment is not reworded just because a signature changed with no behavior change.

## One home per concept

- [ ] **R007** Each non-obvious concept is documented in exactly one home. A getter that merely exposes a value already documented on its type or owning state object carries no doc comment of its own.
- [ ] **R008** A caveat that applies system-wide (for example, a constraint that holds for every `World` field) is documented once at the site that owns it; every other call site gets a one-line pointer, never a duplicate essay.

## Process prose and TODOs

- [ ] **R009** A shipped comment states only a current constraint — never a plan, an iteration marker, or a "locked decision" reference. No "for now," no "once X lands," no "day 6 will...". The one exception is a real `// TODO` parking a genuine deferred decision at its code site. The moment the constraint a comment describes stops holding, delete the comment rather than leaving it stale.
- [ ] **R010** A TODO points at real future work — never at a settled decision or a known-wrong current state dressed up as a plan. A TODO restating a choice already made is stale; delete it.
- [ ] **R011** A deliberate simplification with a known ceiling is marked `// TODO(scaling)`, naming both the ceiling and the upgrade path (for example: "linear scan over 48 bats is fine; pool by lane if that grows").

## Commented-out code

- [ ] **R012** Never leave commented-out code under `src/` or `scripts/`, no exceptions for "just in case" — delete it outright, since git history already is that record. This includes a stray debug `console.log` left in place with a comment explaining why it's there: delete the whole line, not just the explanation.

## Length and format

- [ ] **R013** A `//` line comment is one sentence. A `/** ... */` doc comment's summary line is one sentence too — anything beyond that is a separate paragraph below it, never a run-on first line. Needing several paragraphs to land the point is a sign the function or type underneath is doing too much; split it before reaching for more prose.

## Before you write

- [ ] **R014** Re-read this file before adding or editing a comment under `src/` or `scripts/`. Over-commenting is the recurring failure this discipline exists to prevent.
- [ ] **R015** Before keeping a comment, run the phone test: could you explain the reasoning to someone on a call using only the comment's words, without pointing at the line it sits on? If it doesn't clear that bar, sharpen it or delete it.

## Legacy references

- [ ] **R016** A shipped comment never references a prior implementation or "the old way" — no "unlike before," no "this replaces X," no "v1 used to...". Describe only what the current code does and why; git history is the record of what it used to be.
