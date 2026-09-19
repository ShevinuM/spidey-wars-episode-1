import type { Speaker } from "../cutscene/script.ts";
import { COLORS } from "./colors.ts";

/** Per-speaker palette: the balloon's inner border colour and the name tag's fill, ring, dot, text and letter-spacing. */
interface SpeakerStyle {
  readonly frameColor: number;
  readonly tagFill: number;
  readonly tagRing: number;
  readonly tagDot: number;
  readonly tagText: number;
  readonly tagLetterSpacing: number;
}

/** `reference/design/Scene 2.1 - Spider-Sense.dc.html:99-102` (SPIDEY), `reference/design/Scene 1.1 - Goblin Asks MJ.dc.html:94-96` (MJ) and `:124-126` (GOBLIN). */
export const SPEAKER_STYLE: Record<Speaker, SpeakerStyle> = {
  SPIDEY: {
    frameColor: COLORS.frameBlue,
    tagFill: COLORS.tagSpidey,
    tagRing: COLORS.frameBlue,
    tagDot: COLORS.red,
    tagText: COLORS.promptText,
    tagLetterSpacing: 2,
  },
  MJ: {
    frameColor: COLORS.red,
    tagFill: COLORS.tagMj,
    tagRing: COLORS.red,
    tagDot: COLORS.redSoft,
    tagText: COLORS.textWarm,
    tagLetterSpacing: 2,
  },
  GOBLIN: {
    frameColor: COLORS.purple,
    tagFill: COLORS.tagGoblin,
    tagRing: COLORS.purple,
    tagDot: COLORS.green,
    tagText: COLORS.textGoblin,
    tagLetterSpacing: 1,
  },
};
