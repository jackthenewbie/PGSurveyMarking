import { useEffect } from "react"
import { remapGroups, renumberMarkers } from "./groupLayouts"

export const KEYBOARD_SHORTCUTS = [
  { key: "Ctrl/Cmd+Z", description: "Undo the last saved coordinate action." },
  { key: "Shift+Z", description: "Redo the last undone coordinate action." },
  { key: "Esc", description: "Clear active drag, resize, spacing drag, pending point, and active marker." },
  { key: "D", description: "Delete the hovered marker and renumber the remaining markers." },
  { key: "G", description: "Toggle grouping mode on or off." },
  { key: "P", description: "Toggle optimize-path selection mode on or off." },
  { key: "R", description: "Swap the selected marker's block and dot positions. Does nothing for grouped markers." },
]

function getShortcutTargetMarkerId(activeMarkerId, hoveredMarkerId) {
  return activeMarkerId ?? hoveredMarkerId
}

function isGroupedMarker(markerId, groups) {
  return groups.some((group) => group.orderedIds.includes(markerId))
}

function isSamePoint(left, right) {
  if (!left || !right) return false
  return Math.abs(left.x - right.x) < 0.0001 && Math.abs(left.y - right.y) < 0.0001
}

function isDeletedPathDot(dot, deletedMarkerId, deletedDot) {
  return dot.id == null ? isSamePoint(dot, deletedDot) : dot.id === deletedMarkerId
}

function remapPaths(paths, deletedMarkerId, deletedDot, idMapping) {
  let nextPathId = paths.reduce((maxPathId, path) => Math.max(maxPathId, path.id ?? 0), 0) + 1

  return paths.flatMap((path) => {
    const segments = []
    let currentSegment = []

    path.dots.forEach((dot) => {
      if (isDeletedPathDot(dot, deletedMarkerId, deletedDot)) {
        if (currentSegment.length >= 2) segments.push(currentSegment)
        currentSegment = []
        return
      }

      currentSegment.push({
        ...dot,
        id: dot.id == null ? dot.id : (idMapping.get(dot.id) ?? dot.id),
      })
    })

    if (currentSegment.length >= 2) segments.push(currentSegment)

    return segments.map((dots, segmentIndex) => ({
      ...path,
      id: segmentIndex === 0 ? path.id : nextPathId++,
      dots,
    }))
  })
}

export function useKeyboardShortcuts({
  activeMarkerId,
  blockSize,
  cancelGesture,
  canRedo,
  canUndo,
  focusTrackingMode,
  groupSpacing,
  groups,
  hoveredMarkerId,
  markers,
  onRedo,
  onUndo,
  pushHistorySnapshot,
  stageSize,
  setActiveMarkerId,
  setDragBlockState,
  setDragCurrent,
  setDragStart,
  setGroupingMode,
  setGroups,
  setHoveredMarkerId,
  setMarkers,
  setPaths,
  setPendingPoint,
  setResizeState,
  setSpacingDragState,
  toggleSelectMode,
  toggleGroupingMode,
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
        if (canUndo) {
          event.preventDefault()
          onUndo()
        }
        return
      }

      if (key === "z" && event.shiftKey && !event.altKey) {
        if (canRedo) {
          event.preventDefault()
          onRedo()
        }
        return
      }

      if (key === "escape") {
        if (focusTrackingMode) return
        cancelGesture()
        setPendingPoint(null)
        setDragStart(null)
        setDragCurrent(null)
        setResizeState(null)
        setSpacingDragState(null)
        setDragBlockState(null)
        setActiveMarkerId(null)
        return
      }

      if (key === "g") {
        if (focusTrackingMode) return
        toggleGroupingMode()
        return
      }

      if (key === "p") {
        if (focusTrackingMode) return
        toggleSelectMode()
        return
      }

      if (key === "d" && hoveredMarkerId != null) {
        pushHistorySnapshot()
        const deletedMarker = markers.find((marker) => marker.id === hoveredMarkerId)
        const filteredMarkers = markers.filter((marker) => marker.id !== hoveredMarkerId)
        const renumberedMarkers = renumberMarkers(filteredMarkers)
        const idMapping = new Map(filteredMarkers.map((marker, index) => [marker.id, index + 1]))
        const { groups: nextGroups, markers: nextMarkers } = remapGroups(
          groups,
          idMapping,
          renumberedMarkers,
          blockSize,
          groupSpacing,
          stageSize
        )

        setMarkers(nextMarkers)
        setHoveredMarkerId(null)
        setActiveMarkerId(null)
        setGroups(nextGroups)
        setPaths((current) => remapPaths(current, hoveredMarkerId, deletedMarker?.dot, idMapping))
        setSpacingDragState(null)
        return
      }

      if (key !== "r") return
      if (focusTrackingMode) return

      const targetMarkerId = getShortcutTargetMarkerId(activeMarkerId, hoveredMarkerId)
      if (targetMarkerId == null || isGroupedMarker(targetMarkerId, groups)) return

      pushHistorySnapshot()
      setMarkers((current) =>
        current.map((marker) =>
          marker.id === targetMarkerId
            ? {
                ...marker,
                block: marker.dot,
                dot: marker.block,
              }
            : marker
        )
      )
      setGroupingMode(false)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    activeMarkerId,
    blockSize,
    cancelGesture,
    canRedo,
    canUndo,
    focusTrackingMode,
    groupSpacing,
    groups,
    hoveredMarkerId,
    markers,
    onRedo,
    onUndo,
    pushHistorySnapshot,
    stageSize,
    setActiveMarkerId,
    setDragBlockState,
    setDragCurrent,
    setDragStart,
    setGroupingMode,
    setGroups,
    setHoveredMarkerId,
    setMarkers,
    setPaths,
    setPendingPoint,
    setResizeState,
    setSpacingDragState,
    toggleSelectMode,
    toggleGroupingMode,
  ])
}
