import {
  DEFAULT_BLOCK_SIZE,
  DEFAULT_GROUP_SPACING,
  LEGACY_REFERENCE_STAGE_SIZE,
} from "../constants";
import { blockSizeFromPixels, getSquareSidePixels, hasStageSize } from "./blockSize";
import { getGroupSpacingPixels, groupSpacingFromPixels } from "./groupSpacing";

function cloneStageSize(stageSize) {
  return { width: stageSize.width, height: stageSize.height };
}

export function getReferenceStageSize(referenceStageSize) {
  if (hasStageSize(referenceStageSize)) return referenceStageSize;
  return LEGACY_REFERENCE_STAGE_SIZE;
}

export function scaleOverlaySizingToStage({
  blockSize = DEFAULT_BLOCK_SIZE,
  groupSpacing = DEFAULT_GROUP_SPACING,
  referenceStageSize,
  targetStageSize,
}) {
  if (!hasStageSize(targetStageSize)) {
    return {
      blockSize,
      groupSpacing,
      referenceStageSize: getReferenceStageSize(referenceStageSize),
    };
  }

  const resolvedReferenceStageSize = getReferenceStageSize(referenceStageSize);

  return {
    blockSize: blockSizeFromPixels(
      getSquareSidePixels(blockSize, resolvedReferenceStageSize),
      targetStageSize
    ),
    groupSpacing: groupSpacingFromPixels(
      getGroupSpacingPixels(groupSpacing, resolvedReferenceStageSize),
      targetStageSize
    ),
    referenceStageSize: cloneStageSize(targetStageSize),
  };
}
