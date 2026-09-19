import type { ActorPlacement, Beat } from "../../cutscene/script.ts";

// `Scene 1.3 - Goblin Gets Triggered.dc.html:63,90-91` MJ's 113-wide img sits `right: 118px` inside the
// same 620-wide hero wrapper as Scene 1.1, whose centring in the 1250 play area puts its right edge at
// 935, so her centre is 935 - 118 - 113 / 2 = 760.5, rounded to 761.
const MJ: ActorPlacement = {
  frame: "mj-standing-crying",
  x: 761,
  flipX: true, // `Scene 1.3 - Goblin Gets Triggered.dc.html:91` `transform: scaleX(-1)`.
  tag: "MJ",
  // `Scene 1.3 - Goblin Gets Triggered.dc.html:96` the tag sits in the wrapper, not the flipped `<img>`, so its offset is unaffected by `flipX`.
  tagAt: { dx: 4, dy: -6 },
  // `Scene 1.3 - Goblin Gets Triggered.dc.html:93-95` in DOM order — the tears precede the shadow.
  effects: ["tear-fall", "ground-shadow"],
};

// `Scene 1.3 - Goblin Gets Triggered.dc.html:63,103` the Goblin's 150-wide img sits `left: 70px` inside
// the same wrapper, whose left edge is 315, so his centre is 315 + 70 + 150 / 2 = 460.
const GOBLIN: ActorPlacement = {
  frame: "goblin-hover",
  x: 460,
  tag: "GOBLIN",
  tagAt: { dx: 2, dy: -6 }, // `Scene 1.3 - Goblin Gets Triggered.dc.html:113`.
  // `Scene 1.3 - Goblin Gets Triggered.dc.html:105-112` in DOM order — the wrapper itself has no
  // animation of its own here, unlike 1.1's `bob` or 1.2's `droop`.
  effects: ["cackle-mouth", "ha-float", "flame-pulse"],
};

export const scene13: readonly Beat[] = [
  {
    bg: "scene-1-3",
    actors: [MJ, GOBLIN],
    speaker: "GOBLIN",
    lines: [
      {
        runs: [
          { text: "OH, MARVELOUS!", style: "shout", accent: "purple" },
          {
            text: " The girl has a spine! Then let's see what it sounds like when it snaps! I'll take them all, my dear — every last one — and I'll save the boy for the end so he can watch. ",
            style: "body",
          },
          { text: "GOODNIGHT, MISS WATSON!", style: "bold", accent: "red" },
          { text: " HAHAHAHAHA!", style: "body" },
        ],
      },
    ],
    // `reference/design/Scene 1.3 - Goblin Gets Triggered.dc.html:122,128` — a 760px paper box centred, tail at the bottom-left 104px in.
    balloon: {
      paperWidth: 760,
      anchorX: { from: "center" },
      // Held at 20 like `scene-1-1.ts`/`scene-1-2.ts`, not `Scene 1.3 - Goblin Gets Triggered.dc.html:122`'s `top: 76`, for the same reason — our baked balloon runs taller than the mockup's 15px text assumes.
      top: 20,
      tail: { side: "bottom-left", offset: 104 },
    },
  },
];
