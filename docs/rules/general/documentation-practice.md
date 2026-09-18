# Documentation practice

How this project's own documentation — including `docs/rules/` itself — is written and kept honest.

- [ ] **R001** A rule is prescriptive and standalone: it states what to do and why in one entry. A normative rule says must/never; a guidance rule says prefer. A narrow exception is stated inline, never left implicit.
- [ ] **R002** Documentation cross-references rather than duplicates — each doc owns its own altitude and doesn't restate its neighbors (a testing rule that depends on a tool's config points at the `tech-stack/` file that owns that config, rather than re-explaining it).
- [ ] **R003** Docs are updated in the same change that invalidates them — a decision lands together with its rule entry; a mechanism change sweeps every doc that described the old mechanism.
- [ ] **R004** A new ruling is added to the relevant rules file as a short, prescriptive entry the moment it's decided — never batched for later.
- [ ] **R005** A code change that alters a canonical example file — one this rules doc or another doc points at — updates that doc's pointer in the same change.
- [ ] **R006** When docs and code drift, resolve by converging the code toward the documented decision, not by rewriting the doc to match wayward code — unless the doc never actually recorded a real decision to begin with.
- [ ] **R007** A working document (a design sketch, a migration plan) carries an explicit status header and names its own source of truth — a hypothesis is something to test, not something to build from as if it were already settled.
- [ ] **R008** A deferred or out-of-scope item is recorded explicitly ("not doing this," "deferred until X") so its absence reads as a decision, not an omission.
- [ ] **R009** README-level run instructions stay minimal and real — the commands that work today, nothing aspirational.
