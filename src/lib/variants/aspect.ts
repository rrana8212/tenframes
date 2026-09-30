export const ASPECT_RATIOS = [
  "1:1",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "2:3",
  "3:2",
  "9:19.5",
  "19.5:9",
  "9:20",
  "20:9",
  "1:2",
  "2:1",
  "21:9",
  "5:2",
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number];

const ASPECT_VALUES: ReadonlyArray<readonly [AspectRatio, number]> = [
  ["1:1", 1],
  ["4:3", 4 / 3],
  ["3:2", 3 / 2],
  ["16:9", 16 / 9],
  ["2:1", 2],
  ["21:9", 21 / 9],
  ["5:2", 5 / 2],
  ["20:9", 20 / 9],
  ["19.5:9", 19.5 / 9],
  ["3:4", 3 / 4],
  ["2:3", 2 / 3],
  ["9:16", 9 / 16],
  ["1:2", 1 / 2],
  ["9:20", 9 / 20],
  ["9:19.5", 9 / 19.5],
];

export function isAspectRatio(value: string): value is AspectRatio {
  return (ASPECT_RATIOS as readonly string[]).includes(value);
}

/** Closest supported photographic frame for a source pixel size. */
export function nearestAspect(width: number, height: number): AspectRatio {
  const ratio = width / Math.max(1, height);
  let best: AspectRatio = "3:2";
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const [label, value] of ASPECT_VALUES) {
    const diff = Math.abs(Math.log(ratio) - Math.log(value));
    if (diff < bestDiff) {
      best = label;
      bestDiff = diff;
    }
  }
  return best;
}

export function aspectToCss(aspect: string): string {
  const [w, h] = aspect.split(":");
  const width = Number(w);
  const height = Number(h);
  if (!Number.isFinite(width) || !Number.isFinite(height) || height === 0) return "3 / 2";
  return `${width} / ${height}`;
}
