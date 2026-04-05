import { DEFAULT_BLOCK_SIZE, DEFAULT_GROUP_SPACING } from "../constants";
import { clamp } from "./math";

function normalizeCoordinate(value, axis) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${axis} coordinate in backup file.`);
  }

  return clamp(value, 0, 100);
}

function normalizeNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${label} in backup file.`);
  }

  return value;
}

export function serializeCoordinatePairs(markers, blockSize, groupSpacing, groups = []) {
  return JSON.stringify(
    {
      version: 4,
      blockSize: {
        width: normalizeCoordinate(blockSize?.width ?? DEFAULT_BLOCK_SIZE.width, "block width"),
        height: normalizeCoordinate(blockSize?.height ?? DEFAULT_BLOCK_SIZE.height, "block height"),
      },
      groupSpacing: normalizeCoordinate(groupSpacing ?? DEFAULT_GROUP_SPACING, "group spacing"),
      groups: groups.map((group, groupIndex) => ({
        id: normalizeNonNegativeInteger(group?.id ?? groupIndex + 1, `group ${groupIndex + 1} id`),
        anchor: {
          x: normalizeCoordinate(group?.anchor?.x, `group ${groupIndex + 1} anchor x`),
          y: normalizeCoordinate(group?.anchor?.y, `group ${groupIndex + 1} anchor y`),
        },
        orderedIds: (group?.orderedIds ?? []).map((markerId, markerIndex) =>
          normalizeNonNegativeInteger(markerId, `group ${groupIndex + 1} marker ${markerIndex + 1} id`)
        ),
        slots: (group?.slots ?? []).map((slot, slotIndex) => ({
          column: normalizeNonNegativeInteger(slot?.column, `group ${groupIndex + 1} slot ${slotIndex + 1} column`),
          row: normalizeNonNegativeInteger(slot?.row, `group ${groupIndex + 1} slot ${slotIndex + 1} row`),
        })),
      })),
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
      groupSpacing: normalizeCoordinate(parsed?.groupSpacing ?? DEFAULT_GROUP_SPACING, "group spacing"),
      groups: Array.isArray(parsed?.groups)
        ? parsed.groups
            .map((group, groupIndex) => ({
              id: normalizeNonNegativeInteger(group?.id ?? groupIndex + 1, `group ${groupIndex + 1} id`),
              anchor: {
                x: normalizeCoordinate(group?.anchor?.x, `group ${groupIndex + 1} anchor x`),
                y: normalizeCoordinate(group?.anchor?.y, `group ${groupIndex + 1} anchor y`),
              },
              orderedIds: Array.isArray(group?.orderedIds)
                ? group.orderedIds.map((markerId, markerIndex) =>
                    normalizeNonNegativeInteger(markerId, `group ${groupIndex + 1} marker ${markerIndex + 1} id`)
                  )
                : [],
              slots: Array.isArray(group?.slots)
                ? group.slots.map((slot, slotIndex) => ({
                    column: normalizeNonNegativeInteger(slot?.column, `group ${groupIndex + 1} slot ${slotIndex + 1} column`),
                    row: normalizeNonNegativeInteger(slot?.row, `group ${groupIndex + 1} slot ${slotIndex + 1} row`),
                  }))
                : [],
            }))
            .filter((group) => group.orderedIds.length >= 2 && group.slots.length >= group.orderedIds.length)
        : [],
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
    groupSpacing: DEFAULT_GROUP_SPACING,
    groups: [],
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
