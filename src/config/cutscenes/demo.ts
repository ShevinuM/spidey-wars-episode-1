import type { ActorPlacement, Beat } from "../../cutscene/script.ts";

const SPIDEY: ActorPlacement = {
  frame: "spidey-side-new",
  x: 620, // Left of centre in the play area, clear of the right-aligned balloon.
  flipX: true, // `Scene 2.1:86` `transform: scaleX(-1)`.
  scale: 7, // 8 × 0.82 = 6.56, rounded — a fractional scale samples unevenly under `pixelArt: true`.
  tag: "SPIDEY",
};

export const demo: readonly Beat[] = [
  {
    bg: "demo",
    actors: [SPIDEY],
    speaker: "SPIDEY",
    lines: [
      {
        runs: [
          { text: "THAT'S MJ.", style: "shout", accent: "red" },
          {
            text: " Half a second of scream and my skull already knows the street, the block, the fire escape she's standing on.",
            style: "body",
          },
        ],
      },
      {
        runs: [
          { text: "And under it, that ", style: "body" },
          { text: "laugh", style: "bold" },
          { text: ". There's exactly ", style: "body" },
          { text: "ONE", style: "bold", accent: "red" },
          { text: " guy in this city who laughs like a broken carnival ride.", style: "body" },
        ],
      },
      { runs: [{ text: "...Zipping up on the way.", style: "muted" }] },
    ],
  },
  {
    bg: "demo",
    actors: [SPIDEY],
    speaker: "SPIDEY",
    lines: [
      {
        runs: [
          { text: "No time to lose. ", style: "body" },
          { text: "GO.", style: "shout" },
        ],
      },
    ],
  },
];
