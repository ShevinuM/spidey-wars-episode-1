interface RandStep<T> {
  value: T;
  state: number;
}

export function nextRand(state: number): RandStep<number> {
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: a };
}

export function seedRand(seed: number): () => number {
  let state = seed;
  return () => {
    const next = nextRand(state);
    state = next.state;
    return next.value;
  };
}

export function randInt(state: number, min: number, max: number): RandStep<number> {
  const next = nextRand(state);
  const span = max - min + 1;
  return { value: min + Math.floor(next.value * span), state: next.state };
}

export function pick<T>(state: number, items: readonly T[]): RandStep<T> {
  const next = randInt(state, 0, items.length - 1);
  return { value: items[next.value], state: next.state };
}
