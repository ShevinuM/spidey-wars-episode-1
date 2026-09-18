import type Phaser from "phaser";
import {
  CRT_SCANLINE_ALPHA,
  CRT_SCANLINE_LINE_WIDTH,
  CRT_SCANLINE_STEP,
  CRT_VIGNETTE_ALPHA,
  CRT_VIGNETTE_RINGS,
  CRT_VIGNETTE_WIDTH,
} from "../config/tuning.ts";
import { COLORS } from "./colors.ts";

/** Draws the scanline + vignette overlay onto `g`, sized to `w`×`h` — bake once with `generateTexture`, never redraw per frame. */
export function crtOverlay(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.fillStyle(0x000000, CRT_SCANLINE_ALPHA);
  for (let y = 0; y < h; y += CRT_SCANLINE_STEP) {
    g.fillRect(0, y, w, CRT_SCANLINE_LINE_WIDTH);
  }

  const ringStep = CRT_VIGNETTE_WIDTH / CRT_VIGNETTE_RINGS;
  for (let i = 0; i < CRT_VIGNETTE_RINGS; i++) {
    const inset = i * ringStep;
    const alpha = CRT_VIGNETTE_ALPHA * (1 - i / CRT_VIGNETTE_RINGS);
    const innerW = w - 2 * inset;
    const innerH = h - 2 * inset;
    if (innerW <= 0 || innerH <= 0) break;

    g.fillStyle(COLORS.skyTop, alpha);
    g.fillRect(inset, inset, innerW, ringStep);
    g.fillRect(inset, h - inset - ringStep, innerW, ringStep);
    g.fillRect(inset, inset, ringStep, innerH);
    g.fillRect(w - inset - ringStep, inset, ringStep, innerH);
  }
}
