import { expect } from "@playwright/test";
import { test } from "../support/hooks-fixture.ts";

test("BootScene sky gradient", async ({ hooks, page }) => {
  await hooks.goto("BootScene");
  await hooks.freeze();
  await expect(page.locator("canvas")).toHaveScreenshot("probe-boot.png");
});
