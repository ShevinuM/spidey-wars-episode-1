# TypeScript

Compiler-configuration and type-modelling rules for this project's `erasableSyntaxOnly`, extension-required setup — adapted from spidey-hub-v2, which ran under a different (non-erasable) compiler config.

## Compiler reality

- [ ] **R001** Every relative import carries its `.ts` extension (`import { tick } from "./tick.ts"`, never `"./tick"`). `tsconfig.json` sets `allowImportingTsExtensions` alongside `noEmit`: `tsc` only type-checks here, Vite does the actual bundling, and Vite resolves `.ts` specifiers directly — there is no separate "emit" step that would otherwise reject the extension.
- [ ] **R002** `erasableSyntaxOnly` bans, as a compile error rather than a style preference: no `enum` (even non-const), no namespace carrying runtime code (a non-ambient, value-producing `namespace`/`module` block), no parameter properties (`constructor(private x: T)`). Each of these needs TypeScript to emit real JS beyond stripping types, which this config forbids outright. Write the equivalent by hand: a string-literal union or `const` object for what would have been an enum, an assigned field for what would have been a parameter property.
- [ ] **R003** `verbatimModuleSyntax` requires every type-only import to say so explicitly — `import type { World } from "./world.ts"`, or an inline `import { type World, tick } from "./world.ts"` when a module exports both types and values. Importing a type without the modifier is a compile error here, not just noise; a class used only in a type position is the one exception (it is a value, so it imports normally).

## File organization

- [ ] **R004** `types/` folders are banned — see `../general/files-and-naming.md`. A type lives beside the code that owns it (`playerState.ts` exports its own state-union types) or, when genuinely shared, in the single module both sides already import.
- [ ] **R005** A `.d.ts` file with a `declare global` block becomes a module, which stops its top-level ambient declarations from merging into the global scope the way a plain script `.d.ts` does. `src/vite-env.d.ts` is kept a plain script file (no top-level `import`/`export`, no `declare global`) for exactly this reason — adding either converts it to a module silently, and any `declare const` in it stops being globally visible.

## Type modelling

- [ ] **R006** Model a closed set of variants with different shapes as a discriminated union — one interface per variant, a unique literal on a shared discriminant field — rather than one interface with a pile of optional fields. `sim/events.ts`'s `SimEvent` union (`{ t: "bat-hit"; ... } | { t: "caught" } | ...`) is the canonical example.
- [ ] **R007** Narrow a discriminated union with a `switch` on its discriminant, not a chain of `if`/`instanceof`, once there are 3+ variants — the compiler flags a newly added variant left unhandled in every switch that isn't exhaustive. `playerState.ts`'s FSM transitions are the case this protects.
- [ ] **R008** Destructuring a discriminated union's fields before narrowing still narrows correctly — checking the destructured discriminant narrows the destructured payload too. Prefer destructuring for readability; don't avoid it defensively.
- [ ] **R009** Prefer a string-literal union for a closed set of values over the `const`-object-with-derived-type pattern — reach for the `const` object only when something at runtime actually needs to iterate or validate the set. This is the positive half of R002's enum ban: it names what to write instead, not just what not to write.
- [ ] **R010** Use `readonly` for fields that must not change after construction (`config/tuning.ts`'s exported constants, a `Beat`'s fields). `World` (`sim/world.ts`) is the deliberate exception — `docs/architecture.md` specifies it as a plain mutable struct the sim mutates in place, so its fields stay non-`readonly` by design, not by oversight.

## Strict-mode discipline

- [ ] **R011** When strict mode or `erasableSyntaxOnly` flags something, fix the code — narrow the type, rewrite the construct — rather than reaching for a blanket suppression flag or an `any` escape hatch. If a single line genuinely needs an exception, suppress narrowly at that line with a comment saying why, so the rest of the codebase keeps the real check.

## Sources

- `/microsoft/typescript`
- https://github.com/microsoft/typescript/blob/main/packages/typescript/src/compiler/checker.ts — `erasableSyntaxOnly` diagnostics for parameter properties, non-ambient namespaces, and non-ambient enums (R002)
- https://github.com/microsoft/typescript/blob/main/tsc/testdata/baselines/reference/conformance/verbatimModuleSyntaxNoElisionESM.errors.txt — `verbatimModuleSyntax` type-only import/export requirements (R003)
