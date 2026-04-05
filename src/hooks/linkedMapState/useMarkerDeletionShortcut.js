import { useEffect } from "react"
import { remapGroups, renumberMarkers } from "./groupLayouts"

export function useMarkerDeletionShortcut({
  blockSize,
  groupSpacing,
  groups,
  hoveredMarkerId,
  markers,
  setActiveMarkerId,
  setDragBlockState,
  setDragCurrent,
  setDragStart,
  setGroups,
  setHoveredMarkerId,
  setMarkers,
  setPendingPoint,
  setResizeState,
  setSpacingDragState,
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPendingPoint(null)
        setDragStart(null)
        setDragCurrent(null)
        setResizeState(null)
        setSpacingDragState(null)
        setDragBlockState(null)
        setActiveMarkerId(null)
      }

      if (event.key.toLowerCase() === "d" && hoveredMarkerId != null) {
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
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    blockSize,
    groupSpacing,
    groups,
    hoveredMarkerId,
    markers,
    setActiveMarkerId,
    setDragBlockState,
    setDragCurrent,
    setDragStart,
    setGroups,
    setHoveredMarkerId,
    setMarkers,
    setPendingPoint,
    setResizeState,
    setSpacingDragState,
  ])
}
