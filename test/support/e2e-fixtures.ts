import { mergeTests } from "@playwright/test";
import { test as coverageTest } from "./coverage.ts";
import { test as hooksTest } from "./hooks-fixture.ts";

/** The `e2e` project's specs drive `__TEST__` and record MCR coverage together. */
export const test = mergeTests(hooksTest, coverageTest);

export { expect } from "@playwright/test";
