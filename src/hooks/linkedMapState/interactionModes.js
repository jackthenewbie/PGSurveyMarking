export function createAnnotationModeActions({
  captureGestureStart,
  focusTrackingMode,
  groupingMode,
  groupSpacing,
  groups,
  markers,
  resizeState,
  selectMode,
  setActiveMarkerId,
  setDragBlockState,
  setDragCurrent,
  setDragStart,
  setFocusTrackingMode,
  setGroupingMode,
  setGroups,
  setPendingPoint,
  setResizeState,
  setSelectMode,
  setSpacingDragState,
  spacingDragState,
}) {
  function clearActiveInteraction() {
    setPendingPoint(null)
    setActiveMarkerId(null)
    setDragStart(null)
    setDragCurrent(null)
    setResizeState(null)
    setSpacingDragState(null)
    setDragBlockState(null)
  }

  function toggleSelectMode() {
    if (focusTrackingMode) return
    setSelectMode((current) => !current)
    setGroupingMode(false)
    clearActiveInteraction()
  }

  function toggleGroupingMode() {
    if (focusTrackingMode) return
    setGroupingMode((current) => !current)
    setSelectMode(false)
    clearActiveInteraction()
  }

  function toggleFocusTrackingMode() {
    setFocusTrackingMode((current) => !current)
    setSelectMode(false)
    setGroupingMode(false)
    clearActiveInteraction()
  }

  function activateMarker(markerId) {
    if (focusTrackingMode || selectMode || groupingMode) return
    setPendingPoint(null)
    setActiveMarkerId(markerId)
  }

  function handleResizeStart(markerId, handle) {
    if (focusTrackingMode) return
    setPendingPoint(null)
    setActiveMarkerId(markerId)
    setDragBlockState(null)
    captureGestureStart()
    setResizeState({
      markerId,
      affectsX: handle.includes("e") || handle.includes("w"),
      affectsY: handle.includes("n") || handle.includes("s"),
    })
  }

  function handleSpacingDragStart(axis, startPoint) {
    if (focusTrackingMode || groups.length === 0) return
    setPendingPoint(null)
    setActiveMarkerId(null)
    setDragBlockState(null)
    captureGestureStart()
    setSpacingDragState({
      axis,
      startClientX: startPoint.clientX,
      startClientY: startPoint.clientY,
      startSpacing: groupSpacing,
    })
  }

  function clearGroups() {
    setGroups([])
    setSpacingDragState(null)
    setDragBlockState(null)
  }

  function handleBlockDragStart(markerId, startPoint) {
    if (focusTrackingMode || selectMode || groupingMode || resizeState || spacingDragState) return

    const marker = markers.find((current) => current.id === markerId)
    if (!marker) return

    const containingGroup = groups.find((group) => group.orderedIds.includes(markerId))

    setPendingPoint(null)
    setActiveMarkerId(markerId)
    setResizeState(null)
    setSpacingDragState(null)
    captureGestureStart()
    setDragBlockState(
      containingGroup
        ? {
            markerId,
            groupId: containingGroup.id,
            startClientX: startPoint.clientX,
            startClientY: startPoint.clientY,
            startAnchor: { ...containingGroup.anchor },
          }
        : {
            markerId,
            groupId: null,
            startClientX: startPoint.clientX,
            startClientY: startPoint.clientY,
            startBlock: { ...marker.block },
          }
    )
  }

  return {
    clearGroups,
    handleBlockDragStart,
    handleResizeStart,
    handleSpacingDragStart,
    setActiveMarkerId: activateMarker,
    toggleFocusTrackingMode,
    toggleGroupingMode,
    toggleSelectMode,
  }
}
