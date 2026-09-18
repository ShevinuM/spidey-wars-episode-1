import type { Page } from "@playwright/test";
import { bootHooks } from "../support/hooks-fixture.ts";
import { expect, test } from "../support/e2e-fixtures.ts";

interface SceneClockState {
  sceneClockMs: number | null;
}

/** Resolves after `frames` real animation frames, never a fixed-duration sleep. */
function waitFrames(page: Page, frames: number): Promise<void> {
  return page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let seen = 0;
        function tick(): void {
          seen += 1;
          if (seen >= count) {
            resolve();
          } else {
            requestAnimationFrame(tick);
          }
        }
        requestAnimationFrame(tick);
      }),
    frames,
  );
}

test.describe("__TEST__ hooks", () => {
  test("ready() reports true once the game has booted", async ({ hooks }) => {
    expect(await hooks.ready()).toBe(true);
  });

  test("stepTo advances the sim to the requested step", async ({ hooks }) => {
    await hooks.stepTo(60);
    expect(await hooks.state()).toMatchObject({ step: 60 });
  });

  test("digest returns a string", async ({ hooks }) => {
    await hooks.stepTo(60);
    expect(typeof (await hooks.digest())).toBe("string");
  });

  test("the same stepTo sequence digests identically from a fresh context", async ({
    page,
    hooks,
    browser,
  }) => {
    await hooks.stepTo(60);
    const firstDigest = await hooks.digest();

    const context = await browser.newContext();
    const secondPage = await context.newPage();
    const secondHooks = await bootHooks(secondPage, page.url());
    await secondHooks.stepTo(60);
    const secondDigest = await secondHooks.digest();
    await context.close();

    expect(secondDigest).toBe(firstDigest);
  });

  test("goto and freeze drive a real scene", async ({ hooks }) => {
    await hooks.goto("BootScene");
    await hooks.freeze();
    expect(await hooks.ready()).toBe(true);
  });

  test("freeze stops the scene clock from advancing", async ({ hooks, page }) => {
    await hooks.goto("BootScene");

    const before = ((await hooks.state()) as SceneClockState).sceneClockMs;
    expect(typeof before).toBe("number");

    await waitFrames(page, 10);
    const running = ((await hooks.state()) as SceneClockState).sceneClockMs;
    expect(running).toBeGreaterThan(before as number);

    await hooks.freeze();
    const frozen = ((await hooks.state()) as SceneClockState).sceneClockMs;
    await waitFrames(page, 10);
    const stillFrozen = ((await hooks.state()) as SceneClockState).sceneClockMs;
    expect(stillFrozen).toBe(frozen);
  });
});
