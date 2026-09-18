import { bootHooks } from "../support/hooks-fixture.ts";
import { expect, test } from "../support/e2e-fixtures.ts";

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
});
