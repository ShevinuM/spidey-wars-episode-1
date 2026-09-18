import { replays } from "../replays/index.ts";
import { expect, test } from "../support/e2e-fixtures.ts";

test.skip(replays.length === 0, "corpus empty — see DEFERRED");

test("every replay matches its expected sim digest", async ({ hooks }) => {
  for (const replay of replays) {
    const result = await hooks.replay(replay);
    expect(result.digest).toBe(replay.expected.digest);
    expect(result.trajectory).toEqual(replay.expected.trajectory);
  }
});
