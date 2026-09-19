import type { Beat } from "../../cutscene/script.ts";

export const scene11: readonly Beat[] = [
  {
    bg: "scene-1-1",
    actors: [],
    speaker: "GOBLIN",
    lines: [
      {
        runs: [
          { text: "AH, MISS WATSON!", style: "shout", accent: "purple" },
          {
            text: " Radiant! Incandescent! A face like that shouldn't be wasted on wall-crawlers and wage slaves. The Goblin has made his selection. ",
            style: "body",
          },
          { text: "Dinner. Tonight.", style: "bold", accent: "red" },
          { text: " You'll say yes — they always do, in the end!", style: "body" },
        ],
      },
    ],
    // `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:138,144` — a 760px paper box centred, 76px from the play area's top, tail at the bottom-left 104px in.
    balloon: {
      paperWidth: 760,
      anchorX: { from: "center" },
      top: 76,
      tail: { side: "bottom-left", offset: 104 },
    },
  },
];
