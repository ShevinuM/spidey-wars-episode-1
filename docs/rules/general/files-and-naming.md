# Files, naming & structure

How files are named across the codebase, and why `types/` folders are banned.

## Naming

- [ ] **R001** A `src/scenes/*.ts` file is `PascalCase.ts` matching the exported `Phaser.Scene` subclass name — `BootScene.ts` exports `class BootScene`, `GameScene.ts` exports `class GameScene`. This is the one place PascalCase filenames are correct in this codebase.
- [ ] **R002** Every other module — everything under `sim/`, `cutscene/`, `ui/`, `config/`, `scripts/`, and `test/` — is kebab-case: `draw-scene-bg.ts`, `fall-timer.ts`, `scene-1-1.ts`. A file exporting a function, a data table, or a plain object never takes PascalCase; PascalCase is reserved for the scene-class files in R001.
- [ ] **R003** A co-located unit test is named `foo.test.ts` for the module `foo.ts` it tests, kebab-case matching its subject, sitting in the same folder. `../testing/README.md` R001 owns where test code lives; this rule owns only the filename.

## No `types/` folders

- [ ] **R004** A generic `types/` folder is banned, at any depth. A type lives beside the code that owns it — `player-state.ts` exports its own state-union types, `world.ts` exports `World` — or, when a type is genuinely shared by more than one module, in the single module both sides already import rather than a folder invented to hold it. `../../architecture.md`'s directory map marks its `types/` entry as banned, pointing here.
- [ ] **R005** Export a type only when a real consumer outside its owning module needs it. A type used by a single file stays unexported in that file — don't hoist it "for tidiness" ahead of a second consumer that may never arrive.

## One concept, one file

- [ ] **R006** Give each meaningful concept its own file — a draw primitive, a state, a sim module. A file's name should name the one thing it's responsible for; a file growing a second unrelated responsibility is a sign it should split, not a sign its neighbor should absorb it.
