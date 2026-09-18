import type { Run, RunStyle } from "./script.ts";

export interface RunMetrics {
  readonly width: (text: string, style: RunStyle) => number;
  readonly lineHeight: (style: RunStyle) => number;
}

export interface PlacedSegment {
  readonly runIndex: number;
  readonly text: string;
  readonly style: RunStyle;
  readonly x: number;
  readonly y: number;
}

/** A whitespace or non-whitespace slice of one run's text, tracking its offsets into that run. */
interface Fragment {
  readonly runIndex: number;
  readonly runText: string;
  readonly style: RunStyle;
  readonly start: number;
  readonly end: number;
  readonly isSpace: boolean;
}

/** A word, possibly spanning several runs with no whitespace between them. */
interface Token {
  readonly pieces: readonly Fragment[];
  readonly width: number;
  readonly gapBefore: number;
}

/** One placed word-fragment, before same-run fragments on the same row are coalesced into a segment. */
interface PlacedPiece {
  readonly runIndex: number;
  readonly runText: string;
  readonly style: RunStyle;
  readonly start: number;
  readonly end: number;
  readonly x: number;
  readonly row: number;
}

const WORD_OR_SPACE = /\S+|\s+/g;

function fragmentsOf(runs: readonly Run[]): Fragment[] {
  const fragments: Fragment[] = [];
  runs.forEach((run, runIndex) => {
    for (const match of run.text.matchAll(WORD_OR_SPACE)) {
      const text = match[0];
      const start = match.index;
      fragments.push({
        runIndex,
        runText: run.text,
        style: run.style,
        start,
        end: start + text.length,
        isSpace: /^\s/.test(text),
      });
    }
  });
  return fragments;
}

/** Groups fragments into unbreakable word tokens; whitespace becomes the gap before the next token. */
function tokenize(runs: readonly Run[], metrics: RunMetrics): Token[] {
  const tokens: Token[] = [];
  let pieces: Fragment[] = [];
  let gapBefore = 0;

  const flush = () => {
    if (pieces.length === 0) return;
    let width = 0;
    for (const piece of pieces)
      width += metrics.width(piece.runText.slice(piece.start, piece.end), piece.style);
    tokens.push({ pieces, width, gapBefore });
    pieces = [];
    gapBefore = 0;
  };

  for (const fragment of fragmentsOf(runs)) {
    if (fragment.isSpace) {
      flush();
      gapBefore += metrics.width(
        fragment.runText.slice(fragment.start, fragment.end),
        fragment.style,
      );
      continue;
    }
    pieces.push(fragment);
  }
  flush();

  return tokens;
}

/** Greedily places tokens into rows against `maxWidth`; an oversize token gets its own row. */
function placeTokens(
  tokens: readonly Token[],
  maxWidth: number,
  metrics: RunMetrics,
): PlacedPiece[] {
  const placed: PlacedPiece[] = [];
  let row = 0;
  let rowWidth = 0;

  for (const token of tokens) {
    const isRowStart = rowWidth === 0;
    const gap = isRowStart ? 0 : token.gapBefore;
    if (!isRowStart && rowWidth + gap + token.width > maxWidth) {
      row += 1;
      rowWidth = 0;
    }
    let x = rowWidth === 0 ? 0 : rowWidth + token.gapBefore;
    for (const piece of token.pieces) {
      const text = piece.runText.slice(piece.start, piece.end);
      placed.push({
        runIndex: piece.runIndex,
        runText: piece.runText,
        style: piece.style,
        start: piece.start,
        end: piece.end,
        x,
        row,
      });
      x += metrics.width(text, piece.style);
    }
    rowWidth = x;
  }

  return placed;
}

/** Merges consecutive same-run fragments on the same row, slicing the run's own text so interior spacing survives. */
function coalesce(placed: readonly PlacedPiece[], metrics: RunMetrics): PlacedSegment[] {
  const rowHeight: number[] = [];
  for (const p of placed) {
    rowHeight[p.row] = Math.max(rowHeight[p.row] ?? 0, metrics.lineHeight(p.style));
  }

  const segments: PlacedSegment[] = [];
  let rowTop = 0;
  let lastRow = -1;
  let i = 0;
  while (i < placed.length) {
    const first = placed[i];
    if (first.row !== lastRow) {
      if (lastRow >= 0) rowTop += rowHeight[lastRow];
      lastRow = first.row;
    }
    let j = i + 1;
    let end = first.end;
    while (
      j < placed.length &&
      placed[j].row === first.row &&
      placed[j].runIndex === first.runIndex
    ) {
      end = placed[j].end;
      j += 1;
    }
    segments.push({
      runIndex: first.runIndex,
      text: first.runText.slice(first.start, end),
      style: first.style,
      x: first.x,
      y: rowTop,
    });
    i = j;
  }
  return segments;
}

/**
 * Word-wraps a flat run stream against `maxWidth`, tokenising across run boundaries so a word
 * split between two runs stays one unbreakable unit, and emits one segment per run that
 * contributes text to a row.
 */
export function flowRuns(
  runs: readonly Run[],
  maxWidth: number,
  metrics: RunMetrics,
): PlacedSegment[] {
  const tokens = tokenize(runs, metrics);
  const placed = placeTokens(tokens, maxWidth, metrics);
  return coalesce(placed, metrics);
}
