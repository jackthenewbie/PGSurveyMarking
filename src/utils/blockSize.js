export function hasStageSize(stageSize) {
  return Boolean(stageSize?.width && stageSize?.height)
}

export function getSquareSidePixels(blockSize, stageSize) {
  if (!hasStageSize(stageSize) || !blockSize) return 0

  const width = Number(blockSize.width) || 0
  const height = Number(blockSize.height) || 0

  if (width > 0) return (width / 100) * stageSize.width
  if (height > 0) return (height / 100) * stageSize.height

  return 0
}

export function blockSizeFromPixels(sidePixels, stageSize) {
  if (!hasStageSize(stageSize) || !Number.isFinite(sidePixels) || sidePixels <= 0) {
    return { width: 0, height: 0 }
  }

  return {
    width: (sidePixels / stageSize.width) * 100,
    height: (sidePixels / stageSize.height) * 100,
  }
}

export function normalizeSquareBlockSize(blockSize, stageSize) {
  const sidePixels = getSquareSidePixels(blockSize, stageSize)

  if (sidePixels <= 0) return blockSize

  return blockSizeFromPixels(sidePixels, stageSize)
}
