import { clamp } from "./math";

function normalizeCoordinate(value, axis) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${axis} coordinate in backup file.`);
  }

  return clamp(value, 0, 100);
}

export function serializeCoordinatePairs(pairs) {
  return JSON.stringify(
    {
      version: 1,
      pairs: pairs.map((pair) => pair.dots.map(({ x, y }) => ({ x, y }))),
    },
    null,
    2
  );
}

export function parseCoordinatePairsBackup(text) {
  const parsed = JSON.parse(text);
  const rawPairs = Array.isArray(parsed) ? parsed : parsed?.pairs;

  if (!Array.isArray(rawPairs)) {
    throw new Error("Backup file must contain a pairs array.");
  }

  let nextDotId = 1;

  return rawPairs.map((rawPair, pairIndex) => {
    if (!Array.isArray(rawPair) || rawPair.length !== 2) {
      throw new Error(`Pair ${pairIndex + 1} must contain exactly 2 coordinates.`);
    }

    return {
      id: pairIndex + 1,
      dots: rawPair.map((dot) => ({
        id: nextDotId++,
        x: normalizeCoordinate(dot?.x, "x"),
        y: normalizeCoordinate(dot?.y, "y"),
      })),
    };
  });
}
