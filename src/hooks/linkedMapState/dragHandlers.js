import { MIN_BLOCK_SIZE, MIN_GROUP_SPACING } from "../../constants"
import { clamp } from "../../utils/math"
import { getPercentPoint } from "../../utils/points"
import { applyGroupLayouts, getGroupAdjustedForResizedMarker } from "./groupLayouts"

export function createDragHandlers({
  blockSize,
  dragBlockState,
  dragStart,
  groupSpacing,
  groupingMode,
  groups,
  markers,
  resizeState,
  selectMode,
  setBlockSize,
  setDragCurrent,
  setGroupSpacing,
  setGroups,
  setMarkers,
  spacingDragState,
}) {
  function handleMouseMove(event) {
    if (resizeState) {
      const marker = markers.find((current) => current.id === resizeState.markerId)
      if (!marker) return

      const point = getPercentPoint(event)
      const horizontalSize = Math.abs(point.x - marker.block.x) * 2
      const verticalSize = Math.abs(point.y - marker.block.y) * 2
      const nextSideLength = clamp(
        resizeState.affectsX && resizeState.affectsY
          ? Math.max(horizontalSize, verticalSize)
          : resizeState.affectsX
            ? horizontalSize
            : verticalSize,
        Math.max(MIN_BLOCK_SIZE.width, MIN_BLOCK_SIZE.height),
        100
      )
      const nextBlockSize = {
        width: nextSideLength,
        height: nextSideLength,
      }
      const resizedGroups = groups.map((group) =>
        getGroupAdjustedForResizedMarker(
          group,
          resizeState.markerId,
          marker.block,
          nextBlockSize,
          groupSpacing
        )
      )

      setBlockSize(nextBlockSize)
      if (groups.length > 0) {
        setGroups(resizedGroups)
        setMarkers((current) => applyGroupLayouts(current, resizedGroups, nextBlockSize, groupSpacing))
      }
      return
    }

    if (dragBlockState) {
      const rect = event.currentTarget.getBoundingClientRect()
      const deltaX = ((event.clientX - dragBlockState.startClientX) / rect.width) * 100
      const deltaY = ((event.clientY - dragBlockState.startClientY) / rect.height) * 100

      if (dragBlockState.groupId != null) {
        const nextGroups = groups.map((group) =>
          group.id === dragBlockState.groupId
            ? {
                ...group,
                anchor: {
                  x: clamp(dragBlockState.startAnchor.x + deltaX, 0, 100),
                  y: clamp(dragBlockState.startAnchor.y + deltaY, 0, 100),
                },
              }
            : group
        )

        setGroups(nextGroups)
        setMarkers((current) => applyGroupLayouts(current, nextGroups, blockSize, groupSpacing))
      } else {
        setMarkers((current) =>
          current.map((marker) =>
            marker.id === dragBlockState.markerId
              ? {
                  ...marker,
                  block: {
                    x: clamp(dragBlockState.startBlock.x + deltaX, 0, 100),
                    y: clamp(dragBlockState.startBlock.y + deltaY, 0, 100),
                  },
                }
              : marker
          )
        )
      }
      return
    }

    if (spacingDragState) {
      const delta =
        spacingDragState.axis === "x"
          ? ((event.clientX - spacingDragState.startClientX) / event.currentTarget.getBoundingClientRect().width) * 100
          : ((event.clientY - spacingDragState.startClientY) / event.currentTarget.getBoundingClientRect().height) * 100
      const nextSpacing = clamp(spacingDragState.startSpacing + delta * 2, MIN_GROUP_SPACING, 100)

      setGroupSpacing(nextSpacing)
      if (groups.length > 0) {
        setMarkers((current) => applyGroupLayouts(current, groups, blockSize, nextSpacing))
      }
      return
    }

    if ((!selectMode && !groupingMode) || !dragStart) return
    setDragCurrent(getPercentPoint(event))
  }

  return { handleMouseMove }
}
