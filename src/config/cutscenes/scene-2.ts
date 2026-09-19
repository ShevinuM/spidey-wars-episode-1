import type { Beat } from "../../cutscene/script.ts";

export const scene2: readonly Beat[] = [
  {
    bg: "scene-2",
    actors: [],
    speaker: "SPIDEY",
    // `reference/design/Scene 2 - Rooftop Relief.dc.html:107-109` — three paragraphs, so three lines.
    lines: [
      {
        runs: [
          { text: "OKAY.", style: "shout", accent: "blue" },
          { text: " Nobody's looking. Nobody's ", style: "body" },
          { text: "ever", style: "bold" },
          {
            text: " looking. Eight million people in this city and not one of them looks ",
            style: "body",
          },
          { text: "UP", style: "bold", accent: "red" },
          { text: ", which is great for me and terrible for my self-esteem.", style: "body" },
        ],
      },
      {
        runs: [
          {
            text: "Perks of the job, right? Best view in New York. Worst bathroom in New York.",
            style: "body",
          },
        ],
      },
      {
        runs: [
          { text: "...If this ends up on the Bugle, Jonah gets a ", style: "muted" },
          { text: "Pulitzer", style: "bold" },
          { text: ".", style: "muted" },
        ],
      },
    ],
    // `reference/design/Scene 2 - Rooftop Relief.dc.html:104` — a 454px paper box, 155px in from the play area's left edge and 150px down.
    balloon: {
      paperWidth: 454,
      anchorX: { from: "left", offset: 155 },
      top: 150,
      // `reference/design/Scene 2 - Rooftop Relief.dc.html:112` puts the right tail's 28px square at `top: 46%` of the mockup's own 282.8px paper box, which centres it at (4 + 0.46 × 282.8 + 14) / (282.8 + 2 × 4) = 0.51 of the ink-ring box this fraction is measured against.
      tail: { side: "right", atHeightFraction: 0.51 },
    },
  },
];
