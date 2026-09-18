import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { visualStates } from "../support/visual-states.ts";

describe("visual-state manifest", () => {
  it("is an array", () => {
    expect(Array.isArray(visualStates)).toBe(true);
  });

  it("every state has a matching baseline PNG", () => {
    const missing = visualStates.filter((name) => !existsSync(`test/visual/baselines/${name}.png`));
    expect(missing).toEqual([]);
  });
});
