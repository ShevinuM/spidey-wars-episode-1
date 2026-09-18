import { expect } from "@playwright/test";
import { test } from "../support/hooks-fixture.ts";

test("title screen", async ({ hooks, page }) => {
  await hooks.goto("TitleScene", { blink: false });
  await hooks.freeze();
  await expect(page.locator("canvas")).toHaveScreenshot("title.png");
});
