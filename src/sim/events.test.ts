import { describe, expect, it } from "vitest";
import { drain, emit } from "./events.ts";
import { newWorld } from "./world.ts";

describe("emit", () => {
  it("appends an event to the target's event list", () => {
    const w = newWorld(1);
    emit(w, { t: "caught" });
    emit(w, { t: "score", delta: 5 });
    expect(w.events).toEqual([{ t: "caught" }, { t: "score", delta: 5 }]);
  });
});

describe("drain", () => {
  it("returns the queued events and empties the target's list", () => {
    const w = newWorld(1);
    emit(w, { t: "impact" });
    emit(w, { t: "bat-hit", x: 1, y: 2 });

    const drained = drain(w);

    expect(drained).toEqual([{ t: "impact" }, { t: "bat-hit", x: 1, y: 2 }]);
    expect(w.events).toEqual([]);
  });

  it("returns an empty array when there is nothing queued", () => {
    const w = newWorld(1);
    expect(drain(w)).toEqual([]);
  });
});
