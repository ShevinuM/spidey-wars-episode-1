import { expect, type Page, test as base } from "@playwright/test";
import type { Replay } from "../../src/sim/replay.ts";
import type { TestHooks } from "../../src/test-hooks.ts";

/** Promise-wrapped `window.__TEST__`, driven through `page.evaluate`. */
interface HooksDriver {
  ready(): Promise<ReturnType<TestHooks["ready"]>>;
  goto(scene: string, data?: unknown): Promise<void>;
  freeze(): Promise<void>;
  stepTo(n: number): Promise<void>;
  state(): Promise<ReturnType<TestHooks["state"]>>;
  digest(): Promise<ReturnType<TestHooks["digest"]>>;
  replay(input: Replay): Promise<ReturnType<TestHooks["replay"]>>;
}

function createHooksDriver(page: Page): HooksDriver {
  return {
    ready: () => page.evaluate(() => window.__TEST__!.ready()),
    goto: (scene, data) =>
      page.evaluate(({ scene, data }) => window.__TEST__!.goto(scene, data), { scene, data }),
    freeze: () => page.evaluate(() => window.__TEST__!.freeze()),
    stepTo: (n) => page.evaluate((n) => window.__TEST__!.stepTo(n), n),
    state: () => page.evaluate(() => window.__TEST__!.state()),
    digest: () => page.evaluate(() => window.__TEST__!.digest()),
    replay: (input) => page.evaluate((input) => window.__TEST__!.replay(input), input),
  };
}

/** Navigates to `url` and waits for `__TEST__` to report the game ready. */
export async function bootHooks(page: Page, url = "/"): Promise<HooksDriver> {
  const driver = createHooksDriver(page);
  await page.goto(url);
  await expect.poll(() => driver.ready()).toBe(true);
  return driver;
}

export const test = base.extend<{ hooks: HooksDriver }>({
  hooks: async ({ page }, use) => {
    await use(await bootHooks(page));
  },
});
