import { DEFAULT_BLOCK_SIZE, DEFAULT_GROUP_SPACING } from "../constants"
import { clamp } from "./math"

const STORAGE_KEY = "linked-map.annotation-state.v1"
const SETTINGS_STORAGE_KEY = "linked-map.annotation-settings.v1"

function normalizeCoordinate(value, axis) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${axis} in saved browser state.`)
  }

  return clamp(value, 0, 100)
}

function normalizeNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${label} in saved browser state.`)
  }

  return value
}

function normalizePath(path, pathIndex) {
  return {
    id: normalizeNonNegativeInteger(path?.id ?? pathIndex + 1, `path ${pathIndex + 1} id`),
    dots: Array.isArray(path?.dots)
      ? path.dots.map((dot, dotIndex) => ({
          id:
            dot?.id == null
              ? undefined
              : normalizeNonNegativeInteger(dot.id, `path ${pathIndex + 1} dot ${dotIndex + 1} id`),
          x: normalizeCoordinate(dot?.x, `path ${pathIndex + 1} dot ${dotIndex + 1} x`),
          y: normalizeCoordinate(dot?.y, `path ${pathIndex + 1} dot ${dotIndex + 1} y`),
        }))
      : [],
  }
}

function serializeAnnotationState({ blockSize, groupSpacing, groups, markers, paths }) {
  return JSON.stringify({
    version: 1,
    blockSize: {
      width: normalizeCoordinate(blockSize?.width ?? DEFAULT_BLOCK_SIZE.width, "block width"),
      height: normalizeCoordinate(blockSize?.height ?? DEFAULT_BLOCK_SIZE.height, "block height"),
    },
    groupSpacing: normalizeCoordinate(groupSpacing ?? DEFAULT_GROUP_SPACING, "group spacing"),
    groups: Array.isArray(groups)
      ? groups.map((group, groupIndex) => ({
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
      : [],
    markers: Array.isArray(markers)
      ? markers.map((marker, markerIndex) => ({
          id: normalizeNonNegativeInteger(marker?.id ?? markerIndex + 1, `marker ${markerIndex + 1} id`),
          block: {
            x: normalizeCoordinate(marker?.block?.x, `marker ${markerIndex + 1} block x`),
            y: normalizeCoordinate(marker?.block?.y, `marker ${markerIndex + 1} block y`),
          },
          dot: {
            x: normalizeCoordinate(marker?.dot?.x, `marker ${markerIndex + 1} dot x`),
            y: normalizeCoordinate(marker?.dot?.y, `marker ${markerIndex + 1} dot y`),
          },
        }))
      : [],
    paths: Array.isArray(paths) ? paths.map(normalizePath) : [],
  })
}

function parsePersistedAnnotationSettings(text) {
  const parsed = JSON.parse(text)

  return {
    blockSize: {
      width: normalizeCoordinate(parsed?.blockSize?.width ?? DEFAULT_BLOCK_SIZE.width, "block width"),
      height: normalizeCoordinate(parsed?.blockSize?.height ?? DEFAULT_BLOCK_SIZE.height, "block height"),
    },
    groupSpacing: normalizeCoordinate(parsed?.groupSpacing ?? DEFAULT_GROUP_SPACING, "group spacing"),
  }
}

export function parsePersistedAnnotationState(text) {
  const parsed = JSON.parse(text)

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
    markers: Array.isArray(parsed?.markers)
      ? parsed.markers.map((marker, markerIndex) => ({
          id: normalizeNonNegativeInteger(marker?.id ?? markerIndex + 1, `marker ${markerIndex + 1} id`),
          block: {
            x: normalizeCoordinate(marker?.block?.x, `marker ${markerIndex + 1} block x`),
            y: normalizeCoordinate(marker?.block?.y, `marker ${markerIndex + 1} block y`),
          },
          dot: {
            x: normalizeCoordinate(marker?.dot?.x, `marker ${markerIndex + 1} dot x`),
            y: normalizeCoordinate(marker?.dot?.y, `marker ${markerIndex + 1} dot y`),
          },
        }))
      : [],
    paths: Array.isArray(parsed?.paths) ? parsed.paths.map(normalizePath) : [],
  }
}

export function loadPersistedAnnotationState() {
  if (typeof window === "undefined" || !window.localStorage) return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parsePersistedAnnotationState(raw)
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function savePersistedAnnotationState(state) {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    const hasOverlayState =
      (state.markers?.length ?? 0) > 0 ||
      (state.groups?.length ?? 0) > 0 ||
      (state.paths?.length ?? 0) > 0

    if (!hasOverlayState) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, serializeAnnotationState(state))
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function loadPersistedAnnotationSettings() {
  if (typeof window === "undefined" || !window.localStorage) return null

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return null
    return parsePersistedAnnotationSettings(raw)
  } catch {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
    return null
  }
}

export function savePersistedAnnotationSettings({ blockSize, groupSpacing }) {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        blockSize: {
          width: normalizeCoordinate(blockSize?.width ?? DEFAULT_BLOCK_SIZE.width, "block width"),
          height: normalizeCoordinate(blockSize?.height ?? DEFAULT_BLOCK_SIZE.height, "block height"),
        },
        groupSpacing: normalizeCoordinate(groupSpacing ?? DEFAULT_GROUP_SPACING, "group spacing"),
      })
    )
  } catch {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
  }
}

export function clearPersistedAnnotationState() {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage cleanup errors.
  }
}

export function clearPersistedAnnotationSettings() {
  if (typeof window === "undefined" || !window.localStorage) return

  try {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
  } catch {
    // Ignore storage cleanup errors.
  }
}
