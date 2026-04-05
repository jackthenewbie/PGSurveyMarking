import { DEFAULT_BLOCK_SIZE, DEFAULT_GROUP_SPACING, MIN_ZOOM_SCALE } from "../../constants"

const DEFAULT_ZOOM_ORIGIN = { x: 50, y: 50 }

function clearInteractionState({
  setPendingPoint,
  setActiveMarkerId,
  setDragStart,
  setDragCurrent,
  setResizeState,
  setSpacingDragState,
  setDragBlockState,
}) {
  setPendingPoint(null)
  setActiveMarkerId(null)
  setDragStart(null)
  setDragCurrent(null)
  setResizeState(null)
  setSpacingDragState(null)
  setDragBlockState(null)
}

export function createAnnotationResetters({
  nextGroupIdRef,
  nextPathIdRef,
  setActiveMarkerId,
  setBlockSize,
  setDragBlockState,
  setDragCurrent,
  setDragStart,
  setGroupSpacing,
  setGroupingMode,
  setGroups,
  setHoveredMarkerId,
  setMarkers,
  setPaths,
  setPendingPoint,
  setResizeState,
  setSelectMode,
  setSpacingDragState,
  setZoomOrigin,
  setZoomScale,
}) {
  function resetAnnotationState() {
    setMarkers([])
    setHoveredMarkerId(null)
    setGroups([])
    setSelectMode(false)
    setGroupingMode(false)
    setPaths([])
    setZoomScale(MIN_ZOOM_SCALE)
    setZoomOrigin(DEFAULT_ZOOM_ORIGIN)
    setBlockSize(DEFAULT_BLOCK_SIZE)
    setGroupSpacing(DEFAULT_GROUP_SPACING)
    clearInteractionState({
      setPendingPoint,
      setActiveMarkerId,
      setDragStart,
      setDragCurrent,
      setResizeState,
      setSpacingDragState,
      setDragBlockState,
    })
    nextPathIdRef.current = 1
    nextGroupIdRef.current = 1
  }

  function clearTransientState() {
    setHoveredMarkerId(null)
    setGroups([])
    setPaths([])
    clearInteractionState({
      setPendingPoint,
      setActiveMarkerId,
      setDragStart,
      setDragCurrent,
      setResizeState,
      setSpacingDragState,
      setDragBlockState,
    })
  }

  function clearCoordinates() {
    setMarkers([])
    setHoveredMarkerId(null)
    setGroups([])
    clearInteractionState({
      setPendingPoint,
      setActiveMarkerId,
      setDragStart,
      setDragCurrent,
      setResizeState,
      setSpacingDragState,
      setDragBlockState,
    })
  }

  function clearCoordinatesAndPaths() {
    clearCoordinates()
    setPaths([])
  }

  return {
    clearCoordinates,
    clearCoordinatesAndPaths,
    clearTransientState,
    resetAnnotationState,
  }
}
