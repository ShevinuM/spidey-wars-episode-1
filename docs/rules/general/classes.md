# Classes

When a class is the right shape in this codebase. Compiler-level constraints on classes (parameter properties, etc.) live in `../tech-stack/typescript.md` — not repeated here.

## The only two class shapes

- [ ] **R001** `Phaser.Scene` subclasses (`src/scenes/*.ts` — `BootScene`, `TitleScene`, `CutsceneScene`, `GameScene`, `UIScene`, `GameOverScene`) and FSM state objects (`src/sim/player-state.ts`) are the only classes in this codebase. Nothing else reaches for `class` — see `../tech-stack/phaser.md` R008.
- [ ] **R002** `src/sim/`, `src/cutscene/`, and `scripts/lib/` export functions operating on plain data, never classes — `step(world, dt)`, not `world.step(dt)`. This keeps the pure layer trivially callable from a test with no instantiation ceremony and matches `../../architecture.md`'s "`World` is a plain mutable struct" convention.

## Scene subclasses

- [ ] **R003** A `Scene` subclass's own constructor takes no game-specific arguments beyond what `super({ key })` needs — state that a scene reads at runtime comes from the registry or from data passed via `scene.start(key, data)`, not from custom constructor parameters.
- [ ] **R004** `erasableSyntaxOnly` bans parameter properties (`constructor(private x: T)`) project-wide, scenes included — see `../tech-stack/typescript.md` R002 for the compiler mechanics.

## FSM state objects

- [ ] **R005** Each state in `src/sim/player-state.ts` is an object with `enter()` / `update(dt)` / `exit()` — `../../architecture.md`'s Pattern 2 owns the shape and the rationale; this rule only names where it lives.
