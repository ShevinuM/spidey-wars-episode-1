import { expect } from "@playwright/test";
import { test } from "../support/hooks-fixture.ts";

test("primitives gallery", async ({ hooks, page }) => {
  await hooks.goto("PrimitivesGalleryScene");
  await hooks.freeze();
  // Software-rendered 1280x720 canvas capture, not a DOM snapshot, needs longer than the 5s default to stabilize.
  await expect(page.locator("canvas")).toHaveScreenshot("primitives-gallery.png", {
    timeout: 30_000,
  });
});
