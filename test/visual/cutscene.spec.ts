import { expect } from "@playwright/test";
import { test } from "../support/hooks-fixture.ts";

test("cutscene demo typing", async ({ hooks, page }) => {
  await hooks.goto("CutsceneScene", { id: "demo", blink: false });
  await hooks.freeze();
  await hooks.stepTo(20);
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("cutscene-demo-typing.png", {
    timeout: 30_000,
  });
});

test("cutscene demo complete", async ({ hooks, page }) => {
  await hooks.goto("CutsceneScene", { id: "demo", blink: false });
  await hooks.freeze();
  await hooks.stepTo(600);
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("cutscene-demo-complete.png", {
    timeout: 30_000,
  });
});
