export default {
  forbidden: [
    {
      name: "sim-must-stay-pure",
      severity: "error",
      comment: "src/sim is engine-agnostic. See docs/architecture.md.",
      from: { path: "^src/sim" },
      to: {
        path: "^phaser|^node_modules/phaser|^src/scenes|^src/ui|^src/cutscene|^src/main\\.ts|^src/test-hooks",
      },
    },
    {
      name: "cutscene-must-stay-pure",
      severity: "error",
      comment: "src/cutscene is engine-agnostic. See docs/architecture.md.",
      from: { path: "^src/cutscene" },
      to: {
        path: "^phaser|^node_modules/phaser|^src/scenes|^src/ui|^src/sim|^src/main\\.ts|^src/test-hooks",
      },
    },
    {
      name: "config-is-data",
      severity: "error",
      comment: "src/config is data only, no rendering.",
      from: { path: "^src/config" },
      to: { path: "^phaser|^node_modules/phaser|^src/scenes|^src/ui" },
    },
    {
      name: "scripts-never-import-game",
      severity: "error",
      comment: "scripts/ is tooling, not game code.",
      from: { path: "^scripts" },
      to: { path: "^src/" },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "No circular dependencies.",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    doNotFollow: {
      path: "node_modules",
    },
    preserveSymlinks: true,
  },
};
