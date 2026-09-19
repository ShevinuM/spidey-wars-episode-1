import type { ActorPlacement, Beat } from "../../cutscene/script.ts";

// `Scene 1.1 - Goblin Asks MJ.dc.html:63,91` MJ's 113-wide img sits `right: 118px` inside the 620-wide hero wrapper, whose centring in the 1250 play area puts the wrapper's right edge at 935, so her centre is 935 - 118 - 113 / 2 = 760.5, rounded to 761.
const MJ: ActorPlacement = {
  frame: "mj-standing",
  x: 761,
  flipX: true, // `Scene 1.1 - Goblin Asks MJ.dc.html:92` `transform: scaleX(-1)`.
  tag: "MJ",
  effects: ["ground-shadow"], // `Scene 1.1 - Goblin Asks MJ.dc.html:93` the wrapper's only overlay.
};

// `Scene 1.1 - Goblin Asks MJ.dc.html:63,101` the Goblin's 150-wide img sits `left: 70px` inside the same wrapper, whose left edge is 315, so his centre is 315 + 70 + 150 / 2 = 460.
const GOBLIN: ActorPlacement = {
  frame: "goblin-hover",
  x: 460,
  tag: "GOBLIN",
  // `Scene 1.1 - Goblin Asks MJ.dc.html:101-132` in DOM order — `bob` is the wrapper's own animation and adds no child, so it leads.
  effects: [
    "bob",
    "blush",
    "heart-eyes",
    "kiss-mouth",
    "flying-kiss",
    "bouquet",
    "flame-pulse",
    "floating-hearts",
  ],
};

export const scene11: readonly Beat[] = [
  {
    bg: "scene-1-1",
    actors: [MJ, GOBLIN],
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
