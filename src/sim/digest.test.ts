import { describe, expect, it } from "vitest";
import { digest, fnv1a } from "./digest.ts";
import { newWorld } from "./world.ts";

describe("fnv1a", () => {
  it("is deterministic for the same input", () => {
    expect(fnv1a("spidey")).toBe(fnv1a("spidey"));
  });

  it("produces different hashes for different inputs", () => {
    expect(fnv1a("spidey")).not.toBe(fnv1a("wars"));
  });

  it("hashes the empty string to the FNV-1a offset basis", () => {
    expect(fnv1a("")).toBe(0x811c9dc5);
  });
});

describe("digest", () => {
  it("is deterministic for the same world fields", () => {
    const a = newWorld(20260912);
    const b = newWorld(20260912);
    expect(digest(a)).toBe(digest(b));
  });

  it("changes when step changes", () => {
    const a = newWorld(1);
    const b = newWorld(1);
    b.step = 1;
    expect(digest(a)).not.toBe(digest(b));
  });

  it("changes when seed changes", () => {
    const a = newWorld(1);
    const b = newWorld(2);
    expect(digest(a)).not.toBe(digest(b));
  });

  it("rounds alpha to 4 decimal places", () => {
    const a = newWorld(1);
    a.alpha = 0.12344;
    const b = newWorld(1);
    b.alpha = 0.123449;
    expect(digest(a)).toBe(digest(b));
  });
});
