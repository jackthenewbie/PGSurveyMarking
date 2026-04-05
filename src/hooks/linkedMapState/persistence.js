import { DEFAULT_GROUP_SPACING } from "../../constants"
import { parseCoordinatePairsBackup, serializeCoordinatePairs } from "../../utils/backup"

export function createPersistenceActions({
  blockSize,
  clearTransientState,
  groupSpacing,
  groups,
  markers,
  setBlockSize,
  setGroupSpacing,
  setGroups,
  restoreRestoredMarkers,
}) {
  function downloadCoordinates() {
    const blob = new Blob([serializeCoordinatePairs(markers, blockSize, groupSpacing, groups)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "linked-map-coordinates.json"
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function restoreCoordinates(text) {
    const restored = parseCoordinatePairsBackup(text)
    restoreRestoredMarkers(
      {
        ...restored,
        groupSpacing: restored.groupSpacing ?? DEFAULT_GROUP_SPACING,
      },
      clearTransientState,
      setGroupSpacing,
      setBlockSize,
      setGroups
    )
  }

  return {
    downloadCoordinates,
    restoreCoordinates,
  }
}
