# Replay corpus

`index.ts` exports `replays: Replay[]`, currently empty.

Recording a real scenario needs player input capture, which does not exist
yet. This is a deliberate deferral (`Tasks/DEFERRED[H].md` item 2), not an
oversight: `test/e2e/replay.spec.ts` and `test/audits/replay-corpus.test.ts`
are written and wired against this corpus now, and both pass vacuously on the
empty list. Nothing here is fabricated input data.

When the first real scenario is recorded, add its fixture as
`<name>.replay.ts` in this directory and re-export it from `index.ts`.
