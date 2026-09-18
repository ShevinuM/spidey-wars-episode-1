import type { Replay } from "../../src/sim/replay.ts";

/**
 * The replay corpus, re-exporting each `*.replay.ts` fixture as it is
 * recorded. Static so Playwright can resolve it without a runtime `fs` glob
 * or a computed dynamic `import()`.
 */
export const replays: Replay[] = [];
