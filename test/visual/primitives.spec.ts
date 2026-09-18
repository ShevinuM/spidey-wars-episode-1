import { expect } from "@playwright/test";
import { test } from "../support/hooks-fixture.ts";

test("primitives gallery", async ({ hooks, page }) => {
  await hooks.goto("PrimitivesGalleryScene");
  await hooks.freeze();
  await expect(page.locator("canvas")).toHaveScreenshot("primitives-gallery.png");
});
