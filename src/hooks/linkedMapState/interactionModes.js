export function createAnnotationModeActions({
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
    setSelectMode((current) => !current)
    setGroupingMode(false)
    clearActiveInteraction()
  }

  function toggleGroupingMode() {
    setGroupingMode((current) => !current)
    setSelectMode(false)
    clearActiveInteraction()
  }

  function activateMarker(markerId) {
    if (selectMode || groupingMode) return
    setPendingPoint(null)
    setActiveMarkerId(markerId)
  }

  function handleResizeStart(markerId, handle) {
    setPendingPoint(null)
    setActiveMarkerId(markerId)
    setDragBlockState(null)
    setResizeState({
      markerId,
      affectsX: handle.includes("e") || handle.includes("w"),
      affectsY: handle.includes("n") || handle.includes("s"),
    })
  }

  function handleSpacingDragStart(axis, startPoint) {
    if (groups.length === 0) return
    setPendingPoint(null)
    setActiveMarkerId(null)
    setDragBlockState(null)
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
    if (selectMode || groupingMode || resizeState || spacingDragState) return

    const marker = markers.find((current) => current.id === markerId)
    if (!marker) return

    const containingGroup = groups.find((group) => group.orderedIds.includes(markerId))

    setPendingPoint(null)
    setActiveMarkerId(markerId)
    setResizeState(null)
    setSpacingDragState(null)
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
    toggleGroupingMode,
    toggleSelectMode,
  }
}
