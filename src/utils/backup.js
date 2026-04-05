import { DEFAULT_BLOCK_SIZE } from "../constants";
import { clamp } from "./math";

function normalizeCoordinate(value, axis) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${axis} coordinate in backup file.`);
  }

  return clamp(value, 0, 100);
}

export function serializeCoordinatePairs(markers, blockSize) {
  return JSON.stringify(
    {
      version: 2,
      blockSize: {
        width: normalizeCoordinate(blockSize?.width ?? DEFAULT_BLOCK_SIZE.width, "block width"),
        height: normalizeCoordinate(blockSize?.height ?? DEFAULT_BLOCK_SIZE.height, "block height"),
      },
      markers: markers.map((marker) => ({
        block: {
          x: normalizeCoordinate(marker.block?.x, "block x"),
          y: normalizeCoordinate(marker.block?.y, "block y"),
        },
        dot: {
          x: normalizeCoordinate(marker.dot?.x, "dot x"),
          y: normalizeCoordinate(marker.dot?.y, "dot y"),
        },
      })),
    },
    null,
    2
  );
}

export function parseCoordinatePairsBackup(text) {
  const parsed = JSON.parse(text);
  const isMarkerArray =
    Array.isArray(parsed) &&
    parsed.every(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        item.block &&
        item.dot
    );
  const rawMarkers = Array.isArray(parsed?.markers) ? parsed.markers : (isMarkerArray ? parsed : null);
  const rawPairs = Array.isArray(parsed?.pairs) ? parsed.pairs : (Array.isArray(parsed) && !isMarkerArray ? parsed : null);

  if (Array.isArray(rawMarkers)) {
    let nextMarkerId = 1;

    return {
      blockSize: {
        width: normalizeCoordinate(parsed?.blockSize?.width ?? DEFAULT_BLOCK_SIZE.width, "block width"),
        height: normalizeCoordinate(parsed?.blockSize?.height ?? DEFAULT_BLOCK_SIZE.height, "block height"),
      },
      markers: rawMarkers.map((rawMarker, markerIndex) => ({
        id: nextMarkerId++,
        block: {
          x: normalizeCoordinate(rawMarker?.block?.x, `marker ${markerIndex + 1} block x`),
          y: normalizeCoordinate(rawMarker?.block?.y, `marker ${markerIndex + 1} block y`),
        },
        dot: {
          x: normalizeCoordinate(rawMarker?.dot?.x, `marker ${markerIndex + 1} dot x`),
          y: normalizeCoordinate(rawMarker?.dot?.y, `marker ${markerIndex + 1} dot y`),
        },
      })),
    };
  }

  if (!Array.isArray(rawPairs)) {
    throw new Error("Backup file must contain a markers or pairs array.");
  }

  let nextMarkerId = 1;

  return {
    blockSize: { ...DEFAULT_BLOCK_SIZE },
    markers: rawPairs.map((rawPair, pairIndex) => {
      if (!Array.isArray(rawPair) || rawPair.length !== 2) {
        throw new Error(`Pair ${pairIndex + 1} must contain exactly 2 coordinates.`);
      }

      return {
        id: nextMarkerId++,
        block: {
          x: normalizeCoordinate(rawPair[0]?.x, `pair ${pairIndex + 1} first x`),
          y: normalizeCoordinate(rawPair[0]?.y, `pair ${pairIndex + 1} first y`),
        },
        dot: {
          x: normalizeCoordinate(rawPair[1]?.x, `pair ${pairIndex + 1} second x`),
          y: normalizeCoordinate(rawPair[1]?.y, `pair ${pairIndex + 1} second y`),
        },
      };
    }),
  };
}
