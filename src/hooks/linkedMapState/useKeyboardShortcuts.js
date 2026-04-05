import { useEffect } from "react"
import { remapGroups, renumberMarkers } from "./groupLayouts"

export const KEYBOARD_SHORTCUTS = [
  { key: "Esc", description: "Clear active drag, resize, spacing drag, pending point, and active marker." },
  { key: "D", description: "Delete the hovered marker and renumber the remaining markers." },
  { key: "G", description: "Toggle grouping mode on or off." },
  { key: "R", description: "Swap the selected marker's block and dot positions. Does nothing for grouped markers." },
]

function getShortcutTargetMarkerId(activeMarkerId, hoveredMarkerId) {
  return activeMarkerId ?? hoveredMarkerId
}

function isGroupedMarker(markerId, groups) {
  return groups.some((group) => group.orderedIds.includes(markerId))
}

export function useKeyboardShortcuts({
  activeMarkerId,
  blockSize,
  groupSpacing,
  groups,
  hoveredMarkerId,
  markers,
  setActiveMarkerId,
  setDragBlockState,
  setDragCurrent,
  setDragStart,
  setGroupingMode,
  setGroups,
  setHoveredMarkerId,
  setMarkers,
  setPendingPoint,
  setResizeState,
  setSpacingDragState,
  toggleGroupingMode,
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase()

      if (key === "escape") {
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
        toggleGroupingMode()
        return
      }

      if (key === "d" && hoveredMarkerId != null) {
        const filteredMarkers = markers.filter((marker) => marker.id !== hoveredMarkerId)
        const renumberedMarkers = renumberMarkers(filteredMarkers)
        const idMapping = new Map(filteredMarkers.map((marker, index) => [marker.id, index + 1]))
        const { groups: nextGroups, markers: nextMarkers } = remapGroups(
          groups,
          idMapping,
          renumberedMarkers,
          blockSize,
          groupSpacing
        )

        setMarkers(nextMarkers)
        setHoveredMarkerId(null)
        setActiveMarkerId(null)
        setGroups(nextGroups)
        setSpacingDragState(null)
        return
      }

      if (key !== "r") return

      const targetMarkerId = getShortcutTargetMarkerId(activeMarkerId, hoveredMarkerId)
      if (targetMarkerId == null || isGroupedMarker(targetMarkerId, groups)) return

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
    groupSpacing,
    groups,
    hoveredMarkerId,
    markers,
    setActiveMarkerId,
    setDragBlockState,
    setDragCurrent,
    setDragStart,
    setGroupingMode,
    setGroups,
    setHoveredMarkerId,
    setMarkers,
    setPendingPoint,
    setResizeState,
    setSpacingDragState,
    toggleGroupingMode,
  ])
}
