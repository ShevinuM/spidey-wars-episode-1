export type SimEvent =
  | { t: "bat-hit"; x: number; y: number }
  | { t: "caught" }
  | { t: "impact" }
  | { t: "score"; delta: number }
  | { t: "web-spent"; remaining: number };

interface EventSink {
  events: SimEvent[];
}

export function emit(target: EventSink, e: SimEvent): void {
  target.events.push(e);
}

export function drain(target: EventSink): SimEvent[] {
  const events = target.events;
  target.events = [];
  return events;
}
