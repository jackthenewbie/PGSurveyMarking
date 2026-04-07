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
  showModeToast,
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

  function toggleSelectMode(event) {
    if (focusTrackingMode) return
    const nextSelectMode = !selectMode
    setSelectMode(nextSelectMode)
    setGroupingMode(false)
    clearActiveInteraction()
    if (nextSelectMode) {
      showModeToast?.("Path optimization enabled", event)
    }
  }

  function toggleGroupingMode(event) {
    if (focusTrackingMode) return
    const nextGroupingMode = !groupingMode
    setGroupingMode(nextGroupingMode)
    setSelectMode(false)
    clearActiveInteraction()
    if (nextGroupingMode) {
      showModeToast?.("Grouping mode enabled", event)
    }
  }

  function toggleFocusTrackingMode(event) {
    const nextFocusTrackingMode = !focusTrackingMode
    setFocusTrackingMode(nextFocusTrackingMode)
    setSelectMode(false)
    setGroupingMode(false)
    clearActiveInteraction()
    if (nextFocusTrackingMode) {
      showModeToast?.("Focus tracking enabled", event)
    }
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
