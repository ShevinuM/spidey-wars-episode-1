# Architecture — Spidey Wars Ep.1

_Decision record. Written 2026-09-18. Companion to [tech-stack.md](./tech-stack.md)._

## Stance

This is designed so the **codebase survives the jam** — Episode 2, more scenes, more villains —
not only so it ships by Sept 26. Where a choice costs jam time, the cost is stated inline so
you can take it or drop it with open eyes.

The organising principle is **layering by purity, not by ceremony.** One hard boundary, four
patterns that each solve a problem this game actually has, and an explicit reject list.

---

## The one rule

> **`src/sim/` never imports Phaser. Ever.**

Everything else follows from this. `sim/` is plain TypeScript describing what the game _is_:
positions, velocities, timers, states, rules. `scenes/` is Phaser describing what the game
_looks like_: sprites, cameras, tweens, input, audio.

The "adapter" between them is four lines:

```ts
// GameScene.update(time, delta)  — delta is variable, from requestAnimationFrame
update(_time: number, delta: number) {
  this.sim.tick(delta);          // sim drains it in fixed steps internally
  this.syncSprites();            // copy sim state → Phaser display objects
}
```

There is no port interface, no adapter class, no dependency injection. The boundary is a
directory and an import rule.

**Why this one and not more:** it is the only boundary with a payoff that arrives immediately
— the swing physics become testable in Vitest without a browser, and the fixed-timestep fix
below becomes possible at all.

---

## Directory map

```
src/
  main.ts                 Phaser.Game config, scene registration

  sim/                    PURE TypeScript — no Phaser, no DOM, no Math.random, no Date.now
    world.ts                the mutable state struct: every number the game is
    tick.ts                 fixed-timestep accumulator; the only entry point
    pendulum.ts             swing integration (semi-implicit Euler)
    fall-timer.ts           MJ descent + impact countdown
    bat-spawner.ts          deterministic wave patterns from a seed
    collide.ts              AABB checks the sim owns (bat↔spidey, spidey↔MJ)
    player-state.ts         the FSM: Idle | Aiming | Swinging | Airborne | Catching | Hit
    rng.ts                  seeded PRNG, ported from the .dc.html DCLogic
    events.ts               SimEvent union type + a tiny emitter

  scenes/                 PHASER — reads sim, draws
    BootScene.ts            preload; generateTexture() for all chrome
    TitleScene.ts           click-to-start (also unlocks Web Audio)
    CutsceneScene.ts        plays a Beat[]; data-driven, reused for all six
    GameScene.ts            owns the World, runs tick(), syncs sprites, input
    UIScene.ts              parallel HUD; listens to registry + sim events
    GameOverScene.ts

  ui/
    primitives.ts           octagon, plaque, bevel, facade, vGradient
    draw-hud-chrome.ts      the HUD, drawn once → texture
    draw-scene-bg.ts        six cutscene backdrops, drawn once → textures

  config/
    tuning.ts               EVERY magic number: gravity, swing torque, bat speed, fall time
    cutscenes/1-3.ts        Beat[] data per scene

  types/                   BANNED — a type lives with its owner; see docs/rules/general/files-and-naming.md
```

---

## Pattern 1 — Fixed timestep (the one with a player-visible failure mode)

**Rule: the simulation advances in fixed 1/60s steps. Phaser stays variable-step.**

`requestAnimationFrame` fires at the monitor's refresh rate. If the swing integrates against a
raw `delta`, the game is _literally a different game_ on a 144Hz laptop than on the 60Hz lab
machines — different swing arcs, different jump heights, different difficulty. For a
physics-and-timing game where the whole verb is "swing and catch," that is a shipping bug, and
it will only show up on someone else's monitor.

The accumulator lives in `sim/tick.ts`, not in Phaser:

```ts
const FIXED_DT = 1 / 60;
const MAX_FRAME = 0.25; // clamp: never death-spiral after a tab-switch stall

let accumulator = 0;

export function tick(w: World, deltaMs: number): void {
  accumulator += Math.min(deltaMs / 1000, MAX_FRAME);
  while (accumulator >= FIXED_DT) {
    step(w, FIXED_DT); // the only place the world mutates
    accumulator -= FIXED_DT;
  }
  w.alpha = accumulator / FIXED_DT; // leftover, for render interpolation
}
```

`GameScene` calls `tick(world, delta)` and reads positions. If motion looks steppy at high
refresh rates, lerp sprite positions by `world.alpha` between `prev` and `curr` — add that only
if you actually see it.

**Note:** `forceSingleUpdate` appears in old tutorials — that is Phaser CE (2.x) and does not
exist in Phaser 3/4. Arcade physics has its own `fps` / `fixedStep` config, but it governs
Arcade bodies only; our swing is hand-rolled, so the accumulator above is what governs it.

**Integrator:** use **semi-implicit (symplectic) Euler**, not explicit Euler:

```ts
w.omega += -(TUNING.g / w.ropeLen) * Math.sin(w.theta) * dt;
w.theta += w.omega * dt;
```

Explicit Euler (updating `theta` from the _old_ omega) injects energy every step and the swing
will visibly spiral wider. Semi-implicit conserves it and is the same two lines.

---

## Pattern 2 — Finite state machine for Spidey

**Rule: one state at a time, transitions are explicit, no boolean soup.**

The alternative is `if (isSwinging && !isHit && canCatch)` — which is where character code goes
to die around day 4, exactly when you are tuning feel.

```
Idle ──aim──▶ Aiming ──fire──▶ Swinging ──release──▶ Airborne ──▶ Idle
                                   │                     │
                                   └───── hit ───────────┴──▶ Hit ──▶ Idle
                                                         └──▶ Catching ──▶ Win
```

Each state is an object with `enter() / update(dt) / exit()`. Working on `Swinging` means you
do not have to hold `Idle` and `Hit` in your head. The FSM lives in `sim/player-state.ts` —
sprite/animation changes happen in `GameScene` by reacting to the state _name_, so the FSM
itself stays Phaser-free.

---

## Pattern 3 — Observer: the sim announces, it never reaches

**Rule: `sim/` emits typed events. It does not know what a sound or a sprite is.**

```ts
export type SimEvent =
  | { t: "bat-hit"; x: number; y: number }
  | { t: "caught" }
  | { t: "impact" }
  | { t: "score"; delta: number }
  | { t: "web-spent"; remaining: number };
```

`GameScene` drains `world.events` each frame and turns them into screen shake, particles and
ZzFX blips. `UIScene` listens for HUD changes via the Phaser registry
(`registry.events.on('changedata-score', …)`), which is Observer that Phaser already built.

This is the pattern that keeps `sim/` pure without any interface ceremony: an event is data,
and data crosses the boundary freely.

---

## Pattern 4 — Object pool for the bats

**Rule: bats are recycled, never created and destroyed at runtime.**

Razor bats spawn continuously across a 6000px level. Allocating and destroying sprites per
bat produces GC pauses — a stutter during a swing is a lost run.

Phaser's `Group` _is_ the pool, no library needed:

```ts
this.bats = this.add.group({ classType: Bat, maxSize: 48, runChildUpdate: false });

const bat = this.bats.get(x, y); // recycles an inactive member, or creates one
if (bat) bat.setActive(true).setVisible(true);

// off-screen or consumed:
bat.setActive(false).setVisible(false); // returned to the pool, not destroyed
```

The discipline that matters: **release as soon as it is no longer needed.** A pool with a leak
is just a slower allocator. The sim owns bat _positions_ in a plain array; the Group owns the
sprites that mirror them.

---

## Pattern 5 — Data-driven: numbers and scripts are not code

**Rule: no magic numbers outside `config/`.**

`config/tuning.ts` holds every value that changes how the game feels — gravity, swing torque,
rope length, web fluid drain, bat speed and spawn rate, fall duration, catch radius, invuln
frames. One file, one import, and the day-6 tuning session is editing constants with HMR
rather than hunting numbers across scenes.

`config/cutscenes/*.ts` holds each scene as a `Beat[]`. Six cutscenes become one
`CutsceneScene` plus six data files — adding Episode 2 dialogue touches no scene code.

This is the cheapest maintainability win in the whole document and it costs about twenty
minutes.

---

## Determinism

**Rule: `sim/` never calls `Math.random()` or `Date.now()`.**

All randomness goes through `sim/rng.ts` — the seeded PRNG ported verbatim from the `.dc.html`
`DCLogic` scripts (`0x6D2B79F5` / `Math.imul`), seeded from `World`. Time comes only from the
`dt` passed into `step()`.

Payoff: bat waves are reproducible, so "that one unfair wave" is debuggable; tests assert exact
outcomes; and the skylines match the design mockups for free when you reuse the original seeds
(`20260912` for the Game UI, `90613` for Scene 1.3).

---

## ECS: no — but know why, and know the exit

**Phaser 4 does use bitECS internally.** All Game Objects are entities with Transform, Color,
Permissions and Hierarchy components, and bitECS serves as both system manager and data store.
You will find this the moment you search, so: the Phaser devlog is explicit that this is an
implementation detail — _"You don't have to use any of the ECS approaches in your own code if
you don't wish to… Classes are not outlawed in Phaser 4. However, they are optional."_

**We do not use ECS in game code.** ECS pays off at hundreds of entities with heterogeneous,
mix-and-match component sets. This game has three named actors, one homogeneous swarm, and six
HUD widgets. The swarm is the only many-entity case, and `Group` + pooling already solves it.
Adding an ECS layer here buys a modelling tax and a second mental model for no benefit.

**The exit, if Episode 2 needs it:** when enemy types multiply and behaviours start needing
arbitrary combinations (a bat that homes _and_ splits _and_ shields), `Group`-per-type + FSM
stops composing and the natural refactor is component-per-behaviour. bitECS is already a
transitive dependency at that point. The `sim/` boundary is what makes that refactor local —
it touches `sim/`, not the scenes.

---

## Rejected patterns

Nystrom's rule applies: _a pattern earns its place when the problem it solves is already
present, not in anticipation of one that may never arrive._

| Pattern                                     | Why not                                                                                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hexagonal / ports & adapters**            | Isolates a domain from _swappable_ infrastructure. We have one adapter — the engine — and never swap it. Cost every frame, benefit never arrives. The sim/render split is the part that was worth keeping. |
| **DI container / Service Locator**          | ES module imports _are_ the locator. A container adds indirection and startup wiring to resolve dependencies that are statically known.                                                                    |
| **Repository**                              | Nothing is persisted beyond a `localStorage` high score. That is three lines, not an abstraction.                                                                                                          |
| **Command**                                 | Earns its place with undo, replay, or remappable input. We have none of the three. Revisit if a replay/ghost feature is ever wanted — the deterministic sim makes it cheap then.                           |
| **Abstract factory / builder for entities** | Three actor types. A constructor is a factory.                                                                                                                                                             |
| **Generic EventBus class**                  | The typed `SimEvent` union + Phaser's registry cover both directions. A hand-rolled generic bus loses type safety and adds a file.                                                                         |

---

## Testing

**Test the sim. Do not unit-test scenes.**

Vitest, no browser, no WebGL, runs in about a second — because `sim/` imports nothing.

| File                   | What it asserts                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pendulum.test.ts`     | released from θ, returns to ≈θ (energy conserved — catches an explicit-Euler regression); reaches bottom in the expected time for a given `g` and rope length |
| `fall-timer.test.ts`   | impact fires at exactly `t = fallDuration`; a catch before that flips the outcome and cancels impact                                                          |
| `bat-spawner.test.ts`  | same seed → identical wave; waves stay within reachable bounds                                                                                                |
| `player-state.test.ts` | illegal transitions are rejected (`Hit` cannot go straight to `Catching`)                                                                                     |
| `tick.test.ts`         | 100 × 16.6ms and 60 × 27.7ms advance the world to the same state (the 144Hz guarantee, asserted)                                                              |

That last one is the test that protects the decision at the top of this document.

Scenes are verified by playing the game, plus one Playwright boot smoke test against `dist/`
served from a nested subpath (that reproduces itch's hashed path and catches the silent
asset-404 class of failure).

Visual regression runs in the pinned Playwright Docker image with SwiftShader software
rendering — see the CI notes. Scope it to the chrome textures first; gameplay frames once the
visuals stop moving.

> Set the SonarQube coverage exclusions to `src/scenes/**` and `src/ui/draw*.ts` before the
> first gate run. Rendering code has no unit tests by design, and without the exclusion the
> quality gate fails on correct code.

### Replays are an architectural artifact, not just a test fixture

Because inputs are keyed by **sim step** (never wall-clock) and all randomness is seeded, a
`Replay = { seed, inputs: Array<[step, action]>, expected }` is reproducible on any machine at
any refresh rate. That makes one file serve three purposes: a regression spec, a bug report,
and — later — a ghost run or attract-mode demo.

The same replay runs through `sim/` alone (Vitest, ~1 ms) and through the full game
(Playwright). **If the two outcomes differ, the bug is in the `GameScene` ↔ `sim` adapter** —
input mapping, a sprite holding authoritative state, a scene mutating the world. No other test
can see that class of bug, and it costs one extra assertion.

Assert the **trajectory digest** every 60 steps, not only the final outcome: a tuning change
can alter the arc while the catch still lands. A changed digest with an unchanged outcome means
the physics moved.

### `__TEST__` hook and the two-build rule

Driving the game deterministically needs an API the shipped game must not have:

```ts
// src/test-hooks.ts — tree-shaken out entirely when the flag is unset
if (import.meta.env.VITE_TEST_HOOKS) {
  window.__TEST__ = { ready, stepTo, replay, record, dump, freeze, state, digest, renderHud, goto };
}
```

| Build        | Flag                | Used by                                  |
| ------------ | ------------------- | ---------------------------------------- |
| `dist/`      | —                   | the itch upload, and the boot smoke test |
| `dist-test/` | `VITE_TEST_HOOKS=1` | replay specs, visual tiers, coverage     |

> Two builds means two guarantees. The smoke test verifies **the shipped artifact**; replay and
> visual specs verify **the game logic** in a hooked build. Keeping the smoke test on real
> `dist/` is what stops "it passed CI but the itch page is black."

Rejected: shipping the hook inert behind a `?__test=1` query param. `stepTo` in the shipped
bundle is a speed cheat in a democratically ranked jam.

---

## Conventions

- **`World` is a plain mutable struct.** No classes, no getters. The sim mutates it in `step()`.
  One place to `console.log` the entire game.
- **`sim/` exports functions, not classes.** `step(world, dt)`, not `world.step(dt)`. Keeps the
  data/behaviour split honest and makes everything trivially callable from a test.
- **Scenes own Phaser objects; the sim owns numbers.** A sprite never stores authoritative
  state — it mirrors `world`.
- **No `any`.** `strict: true` in `tsconfig`.
- **Enforced, not optional — and at two speeds.** _Superseded 2026-09-18 (phase 02, step 5): this
  bullet used to restate the linter/config-file mechanics inline, and drifted — it named ESLint
  where the project uses oxlint, `.dependency-cruiser.cjs` where the real file is `.mjs`, and an
  object-form `no-restricted-imports` pattern the installed config doesn't use. The exact,
  currently-correct mechanics — read from the live `.oxlintrc.json` and
  `.dependency-cruiser.mjs`, not restated here — now live in
  [`docs/rules/general/architecture.md`](./rules/general/architecture.md) R003–R004 and
  [`docs/rules/general/toolchain.md`](./rules/general/toolchain.md) R001. Per
  [`documentation-practice.md`](./rules/general/documentation-practice.md) R002, this file
  points there instead of keeping a second copy that can drift again. `--output-type mermaid`
  (`pnpm architecture` supports it as a flag) also emits a dependency graph worth putting in the
  PR._

---

## When to break these rules

Deliberately, and write down why:

- **Day 6, something is not fun.** Feel beats purity. Reach into the scene and hack the number;
  move it into `tuning.ts` afterwards.
- **A one-off effect needs `Phaser.Math`.** Copy the six lines into `sim/` rather than importing
  Phaser. The rule is worth more than the duplication.
- **A test is hard to write.** That usually means the sim is reaching for rendering state.
  Fix the design, not the test.

The failure mode this document exists to prevent is not _too little_ architecture. It is adding
a layer on day 3 because it felt professional, and discovering on day 6 that the game is not
finished.

---

## Sources

- https://phaser.io/devlogs/260 — Phaser 4 + bitECS internals; ECS optional in user code
- https://gameprogrammingpatterns.com/contents.html — Nystrom, Game Programming Patterns
- https://gafferongames.com/post/fix_your_timestep/ — the accumulator / fixed timestep
- https://blog.ourcade.co/posts/2021/character-logic-state-machine-typescript/ — TS state machine
- https://blog.ourcade.co/posts/2020/state-pattern-character-movement-phaser-3/ — state pattern in Phaser
- https://blog.ourcade.co/posts/2020/phaser-3-optimization-object-pool-basic/ — Group pooling
- https://docs.phaser.io/api-documentation/class/gameobjects-group — `Group.get()`, `maxSize`
- https://bitecs.dev/docs/introduction — bitECS
- https://www.webgamedev.com/code-architecture/ecs — ECS in web game dev
