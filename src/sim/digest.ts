import type { World } from "./world.ts";

export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function digest(w: World): string {
  const payload = `${w.step}:${w.seed}:${w.alpha.toFixed(4)}`;
  return fnv1a(payload).toString(16);
}
