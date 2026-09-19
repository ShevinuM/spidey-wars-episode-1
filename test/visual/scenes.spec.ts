import { expect } from "@playwright/test";
import { test } from "../support/hooks-fixture.ts";

// Larger than any scene's single beat can ever type (Scene 1.1's totalChars is 207), shared across scenes.
const COMPLETE_STEPS = 3000;

test("scene 1.1 open", async ({ hooks, page }) => {
  await hooks.goto("CutsceneScene", { id: "scene-1-1", blink: false });
  await hooks.freeze();
  await hooks.stepTo(0);
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("scene-1-1-open.png", {
    timeout: 30_000,
  });
});

test("scene 1.1 last", async ({ hooks, page }) => {
  await hooks.goto("CutsceneScene", { id: "scene-1-1", blink: false });
  await hooks.freeze();
  await hooks.stepTo(COMPLETE_STEPS);
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("scene-1-1-last.png", {
    timeout: 30_000,
  });
});

test("scene 1.2 open", async ({ hooks, page }) => {
  await hooks.goto("CutsceneScene", { id: "scene-1-2", blink: false });
  await hooks.freeze();
  await hooks.stepTo(0);
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("scene-1-2-open.png", {
    timeout: 30_000,
  });
});

test("scene 1.2 last", async ({ hooks, page }) => {
  await hooks.goto("CutsceneScene", { id: "scene-1-2", blink: false });
  await hooks.freeze();
  await hooks.stepTo(COMPLETE_STEPS);
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("scene-1-2-last.png", {
    timeout: 30_000,
  });
});
