import { describe, expect, it } from "vitest";
import { shelfPack, type ShelfPackItem } from "./shelf-pack.ts";

function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: typeof a,
): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

describe("shelfPack", () => {
  it("packs items on a single shelf when they fit within the width", () => {
    const items: ShelfPackItem[] = [
      { id: "a", width: 3, height: 5 },
      { id: "b", width: 3, height: 5 },
    ];
    const result = shelfPack(items, { width: 10, padding: 1 });
    expect(result.rects).toEqual([
      { id: "a", width: 3, height: 5, x: 0, y: 0 },
      { id: "b", width: 3, height: 5, x: 4, y: 0 },
    ]);
    expect(result.height).toBe(5);
  });

  it("wraps to a new shelf once an item would exceed the width", () => {
    const items: ShelfPackItem[] = [
      { id: "a", width: 6, height: 4 },
      { id: "b", width: 6, height: 2 },
    ];
    const result = shelfPack(items, { width: 10, padding: 1 });
    expect(result.rects).toEqual([
      { id: "a", width: 6, height: 4, x: 0, y: 0 },
      { id: "b", width: 6, height: 2, x: 0, y: 5 },
    ]);
    expect(result.height).toBe(7);
  });

  it("sorts by height desc, then width desc, then id asc for a deterministic layout", () => {
    const items: ShelfPackItem[] = [
      { id: "z-short", width: 2, height: 2 },
      { id: "a-tall", width: 2, height: 9 },
      { id: "b-tall", width: 4, height: 9 },
    ];
    const result = shelfPack(items, { width: 20, padding: 0 });
    expect(result.rects.map((r) => r.id)).toEqual(["b-tall", "a-tall", "z-short"]);
  });

  it("gives an oversized item its own shelf and grows the result width to fit it", () => {
    const items: ShelfPackItem[] = [{ id: "huge", width: 30, height: 5 }];
    const result = shelfPack(items, { width: 10, padding: 1 });
    expect(result.rects).toEqual([{ id: "huge", width: 30, height: 5, x: 0, y: 0 }]);
    expect(result.width).toBe(30);
  });

  it("breaks a height/width tie by id ascending", () => {
    const items: ShelfPackItem[] = [
      { id: "c", width: 3, height: 3 },
      { id: "a", width: 3, height: 3 },
      { id: "b", width: 3, height: 3 },
    ];
    const result = shelfPack(items, { width: 20, padding: 1 });
    expect(result.rects.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("orders identical items stably when height, width and id all tie", () => {
    const items: ShelfPackItem[] = [
      { id: "dup", width: 3, height: 3 },
      { id: "dup", width: 3, height: 3 },
    ];
    const result = shelfPack(items, { width: 20, padding: 1 });
    expect(result.rects).toEqual([
      { id: "dup", width: 3, height: 3, x: 0, y: 0 },
      { id: "dup", width: 3, height: 3, x: 4, y: 0 },
    ]);
  });

  it("returns an empty, zero-height result for no items", () => {
    const result = shelfPack([], { width: 10, padding: 1 });
    expect(result.rects).toEqual([]);
    expect(result.width).toBe(10);
    expect(result.height).toBe(0);
  });

  it("never overlaps any two placed rects", () => {
    const items: ShelfPackItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      width: 3 + (i % 4),
      height: 2 + (i % 5),
    }));
    const result = shelfPack(items, { width: 16, padding: 1 });
    for (let i = 0; i < result.rects.length; i += 1) {
      for (let j = i + 1; j < result.rects.length; j += 1) {
        expect(overlaps(result.rects[i]!, result.rects[j]!)).toBe(false);
      }
    }
  });
});
