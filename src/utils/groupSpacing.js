import { hasStageSize } from "./blockSize"

function normalizeSpacing(groupSpacing) {
  return Number.isFinite(groupSpacing) ? Math.max(groupSpacing, 0) : 0
}

export function getGroupSpacingPixels(groupSpacing, stageSize) {
  const normalizedSpacing = normalizeSpacing(groupSpacing)

  if (!hasStageSize(stageSize)) return normalizedSpacing

  return (normalizedSpacing / 100) * Math.min(stageSize.width, stageSize.height)
}

export function getGroupSpacingPercent(groupSpacing, stageSize, axis) {
  if (!hasStageSize(stageSize)) return normalizeSpacing(groupSpacing)

  const axisSize = axis === "y" ? stageSize.height : stageSize.width
  if (!axisSize) return 0

  return (getGroupSpacingPixels(groupSpacing, stageSize) / axisSize) * 100
}

export function groupSpacingFromPixels(groupSpacingPixels, stageSize) {
  if (!hasStageSize(stageSize) || !Number.isFinite(groupSpacingPixels) || groupSpacingPixels <= 0) {
    return 0
  }

  return (groupSpacingPixels / Math.min(stageSize.width, stageSize.height)) * 100
}
