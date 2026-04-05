import { DEFAULT_GROUP_SPACING, MAX_ZOOM_SCALE, MIN_ZOOM_SCALE, ZOOM_STEP } from "../../constants"
import { clamp } from "../../utils/math"
import { collectSelectedBlocks, collectSelectedDots, getPercentPoint } from "../../utils/points"
import { shortestOpenPath } from "../../utils/pathing"
import { applyGroupLayouts, createGroupLayout, expandSelectedIdsWithGroups } from "./groupLayouts"

export function createPointerHandlers({
  activeMarkerId,
  blockSize,
  dragBlockState,
  dragCurrent,
  dragStart,
  groupSpacing,
  groupingMode,
  groups,
  markers,
  nextGroupIdRef,
  nextPathIdRef,
  pendingPoint,
  resizeState,
  selectMode,
  stageSize,
  setActiveMarkerId,
  setDragBlockState,
  setDragCurrent,
  setDragStart,
  setGroups,
  setMarkers,
  setPaths,
  setPendingPoint,
  setResizeState,
  setSpacingDragState,
  setZoomOrigin,
  setZoomScale,
  spacingDragState,
}) {
  function handleStageClick(event) {
    if (selectMode || groupingMode || resizeState || spacingDragState) return

    const { x, y } = getPercentPoint(event)

    if (activeMarkerId != null && !pendingPoint) {
      setActiveMarkerId(null)
      return
    }

    if (!pendingPoint) {
      setPendingPoint({ x, y })
      return
    }

    setMarkers((current) => [
      ...current,
      {
        id: current.length + 1,
        block: pendingPoint,
        dot: { x, y },
      },
    ])
    setPendingPoint(null)
  }

  function handleMouseDown(event) {
    if (!selectMode && !groupingMode) return
    event.preventDefault()
    const point = getPercentPoint(event)
    setDragStart(point)
    setDragCurrent(point)
  }

  function handleMouseUp() {
    if (resizeState) {
      setResizeState(null)
      return
    }

    if (dragBlockState) {
      setDragBlockState(null)
      return
    }

    if (spacingDragState) {
      setSpacingDragState(null)
      return
    }

    if ((!selectMode && !groupingMode) || !dragStart || !dragCurrent) return
    const minX = Math.min(dragStart.x, dragCurrent.x)
    const maxX = Math.max(dragStart.x, dragCurrent.x)
    const minY = Math.min(dragStart.y, dragCurrent.y)
    const maxY = Math.max(dragStart.y, dragCurrent.y)

    if (groupingMode) {
      const selectedBlockIds = collectSelectedBlocks(markers, { minX, maxX, minY, maxY })
      const expandedSelectedBlockIds = expandSelectedIdsWithGroups(selectedBlockIds, groups)

      if (expandedSelectedBlockIds.length >= 2) {
        const remainingGroups = groups.filter(
          (group) => !group.orderedIds.some((markerId) => expandedSelectedBlockIds.includes(markerId))
        )
        const nextGroup = createGroupLayout(markers, expandedSelectedBlockIds, blockSize, groupSpacing, stageSize)

        if (nextGroup) {
          const createdGroup = {
            ...nextGroup,
            id: nextGroupIdRef.current++,
          }
          const nextGroups = [...remainingGroups, createdGroup]
          setGroups(nextGroups)
          setSpacingDragState(null)
          setMarkers((current) => applyGroupLayouts(current, nextGroups, blockSize, groupSpacing, stageSize))
          setActiveMarkerId(null)
        }
      }
    }
    else {
      const selected = collectSelectedDots(markers, { minX, maxX, minY, maxY })

      if (selected.length >= 2) {
        const pathId = nextPathIdRef.current++
        setPaths((current) => [...current, { id: pathId, dots: shortestOpenPath(selected) }])
      }
    }

    setDragStart(null)
    setDragCurrent(null)
  }

  function handleStageWheel(event) {
    event.preventDefault()
    const nextOrigin = getPercentPoint(event)
    const multiplier = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP
    setZoomOrigin(nextOrigin)
    setZoomScale((current) =>
      clamp(Number((current * multiplier).toFixed(4)), MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)
    )
  }

  function restoreRestoredMarkers(restored, clearTransientState, setGroupSpacing, setBlockSize, setGroups) {
    clearTransientState()
    setMarkers(
      applyGroupLayouts(
        restored.markers,
        restored.groups ?? [],
        restored.blockSize,
        restored.groupSpacing ?? DEFAULT_GROUP_SPACING,
        stageSize
      )
    )
    setBlockSize(restored.blockSize)
    setGroupSpacing(restored.groupSpacing ?? DEFAULT_GROUP_SPACING)
    setGroups(restored.groups ?? [])
    nextPathIdRef.current = 1
    nextGroupIdRef.current =
      (restored.groups ?? []).reduce((maxGroupId, group) => Math.max(maxGroupId, group.id ?? 0), 0) + 1
  }

  return {
    handleMouseDown,
    handleMouseUp,
    handleStageClick,
    handleStageWheel,
    restoreRestoredMarkers,
  }
}
