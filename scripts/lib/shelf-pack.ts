export interface ShelfPackItem {
  readonly id: string;
  readonly width: number;
  readonly height: number;
}

interface ShelfPackedRect extends ShelfPackItem {
  readonly x: number;
  readonly y: number;
}

export interface ShelfPackOptions {
  readonly width: number;
  readonly padding: number;
}

export interface ShelfPackResult {
  readonly rects: readonly ShelfPackedRect[];
  readonly width: number;
  readonly height: number;
}

function compareItems(a: ShelfPackItem, b: ShelfPackItem): number {
  if (b.height !== a.height) return b.height - a.height;
  if (b.width !== a.width) return b.width - a.width;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Packs items onto shelves in a deterministic order: height desc, then width desc, then id asc.
 *
 * A shelf wraps once an item would exceed `options.width`; an item wider than
 * `options.width` on its own still gets its own shelf, growing the result's
 * `width` to fit it.
 */
export function shelfPack(
  items: readonly ShelfPackItem[],
  options: ShelfPackOptions,
): ShelfPackResult {
  const { width: targetWidth, padding } = options;
  const sorted = [...items].sort(compareItems);

  const rects: ShelfPackedRect[] = [];
  let cursorX = 0;
  let cursorY = 0;
  let shelfHeight = 0;
  let maxX = 0;

  for (const item of sorted) {
    if (cursorX > 0 && cursorX + item.width > targetWidth) {
      cursorX = 0;
      cursorY += shelfHeight + padding;
      shelfHeight = 0;
    }
    rects.push({ ...item, x: cursorX, y: cursorY });
    maxX = Math.max(maxX, cursorX + item.width);
    cursorX += item.width + padding;
    shelfHeight = Math.max(shelfHeight, item.height);
  }

  return {
    rects,
    width: Math.max(targetWidth, maxX),
    height: cursorY + shelfHeight,
  };
}
