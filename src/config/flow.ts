import type { Beat } from "../cutscene/script.ts";
import { demo } from "./cutscenes/demo.ts";

/** One `Beat[]` script per cutscene id, keyed for a static lookup by id. */
export const CUTSCENES: Record<string, readonly Beat[]> = { demo };

/** Playback order of cutscene ids. */
export const FLOW: readonly string[] = ["demo"];

/**
 * The cutscene id that follows `id` in `FLOW`, or `null` once `id` is the last one.
 *
 * Throws if `id` is not in `FLOW` at all, since a silent `null` there would be indistinguishable from "that
 * was the last one" — a caller passing an unknown id has a real bug to see, not a quiet fallback.
 */
export function nextCutsceneId(id: string): string | null {
  const index = FLOW.indexOf(id);
  if (index === -1) {
    throw new Error(`nextCutsceneId: "${id}" is not in FLOW`);
  }
  return FLOW[index + 1] ?? null;
}
