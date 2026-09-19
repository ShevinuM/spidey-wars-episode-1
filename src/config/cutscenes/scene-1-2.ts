import type { ActorPlacement, Beat } from "../../cutscene/script.ts";

// `Scene 1.2 - MJ rejects Goblin.dc.html:63,90` MJ's 113-wide img sits `right: 118px` inside the same
// 620-wide hero wrapper as Scene 1.1, whose centring in the 1250 play area puts its right edge at 935, so
// her centre is 935 - 118 - 113 / 2 = 760.5, rounded to 761.
const MJ: ActorPlacement = {
  frame: "mj-standing-angry",
  x: 761,
  flipX: true, // `Scene 1.2 - MJ rejects Goblin.dc.html:90` `transform: scaleX(-1)`.
  tag: "MJ",
  // `Scene 1.2 - MJ rejects Goblin.dc.html:92` the tag sits in the wrapper, not the flipped `<img>`, so its offset is unaffected by `flipX`.
  tagAt: { dx: 4, dy: -6 },
  effects: ["ground-shadow"], // `Scene 1.2 - MJ rejects Goblin.dc.html:91` the wrapper's only overlay.
};

// `Scene 1.2 - MJ rejects Goblin.dc.html:63,99` the Goblin's 150-wide img sits `left: 70px` inside the
// same wrapper, whose left edge is 315, so his centre is 315 + 70 + 150 / 2 = 460.
const GOBLIN: ActorPlacement = {
  frame: "goblin-hover",
  x: 460,
  tag: "GOBLIN",
  tagAt: { dx: 2, dy: -6 }, // `Scene 1.2 - MJ rejects Goblin.dc.html:112`.
  // `Scene 1.2 - MJ rejects Goblin.dc.html:99-111` in DOM order — `droop` is the wrapper's own animation and adds no child, so it leads.
  effects: ["droop", "sad-eyebrows", "sad-eyes", "tear-drip", "frown-mouth", "flame-pulse"],
};

export const scene12: readonly Beat[] = [
  {
    bg: "scene-1-2",
    actors: [MJ, GOBLIN],
    speaker: "MJ",
    lines: [
      {
        runs: [
          { text: "YOU WANT ME TO LOOK AT YOU?", style: "shout" },
          {
            text: " I can't. Not because you frighten me — because there's nothing there. ",
            style: "body",
          },
          { text: "Peter", style: "bold", accent: "purple" },
          {
            text: " has more courage in one bruised knuckle than you've got in that whole costume. Do your worst, Osborn. You'll still lose.",
            style: "body",
          },
        ],
      },
    ],
    // `reference/design/Scene 1.2 - MJ rejects Goblin.dc.html:121,127` — a 760px paper box centred, tail at the bottom-right 230px in.
    balloon: {
      paperWidth: 760,
      anchorX: { from: "center" },
      // Held low, not `Scene 1.2 - MJ rejects Goblin.dc.html:121`'s `top: 76`, because our baked balloon
      // runs taller than the mockup's 15px text assumes, and at 76 it would cover both tags.
      top: 20,
      tail: { side: "bottom-right", offset: 230 },
    },
  },
];
