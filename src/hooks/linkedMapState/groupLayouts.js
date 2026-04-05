function getTopLeftMostMarker(markers) {
  return [...markers].sort((left, right) => left.block.y - right.block.y || left.block.x - right.block.x)[0]
}

function getGroupingRowThreshold(blockSize, groupSpacing) {
  return Math.max((blockSize.height + groupSpacing) / 2, blockSize.height * 0.75, 0.5)
}

function buildMarkersGroupedIntoRows(selectedMarkers, blockSize, groupSpacing) {
  const sortedMarkers = [...selectedMarkers].sort(
    (left, right) => left.block.y - right.block.y || left.block.x - right.block.x
  )
  const rowThreshold = getGroupingRowThreshold(blockSize, groupSpacing)
  const rows = []

  sortedMarkers.forEach((marker) => {
    const currentRow = rows[rows.length - 1]

    if (!currentRow || Math.abs(marker.block.y - currentRow.anchorY) > rowThreshold) {
      rows.push({
        anchorY: marker.block.y,
        markers: [marker],
      })
      return
    }

    currentRow.markers.push(marker)
    currentRow.markers.sort((left, right) => left.block.x - right.block.x || left.block.y - right.block.y)
    currentRow.anchorY =
      currentRow.markers.reduce((sum, current) => sum + current.block.y, 0) / currentRow.markers.length
  })

  return rows.map((row) => row.markers)
}

function buildGroupLayoutFromRows(rows) {
  const orderedIds = []
  const slots = []

  rows.forEach((row, rowIndex) => {
    row.forEach((marker, columnIndex) => {
      orderedIds.push(marker.id)
      slots.push({ column: columnIndex, row: rowIndex })
    })
  })

  return { orderedIds, slots }
}

export function renumberMarkers(markers) {
  return markers.map((marker, index) => ({ ...marker, id: index + 1 }))
}

export function createGroupLayout(markers, selectedIds, blockSize, groupSpacing) {
  const selectedMarkers = markers.filter((marker) => selectedIds.includes(marker.id))

  if (selectedMarkers.length < 2) return null

  const topLeftMarker = getTopLeftMostMarker(selectedMarkers)
  const rows = buildMarkersGroupedIntoRows(selectedMarkers, blockSize, groupSpacing)
  const { orderedIds, slots } = buildGroupLayoutFromRows(rows)

  return {
    anchor: { x: topLeftMarker.block.x, y: topLeftMarker.block.y },
    orderedIds,
    slots,
  }
}

function applyGroupLayout(markers, groupLayout, blockSize, groupSpacing) {
  if (!groupLayout) return markers

  const nextBlocksById = new Map(
    groupLayout.orderedIds.map((markerId, index) => {
      const slot = groupLayout.slots[index] ?? { column: 0, row: 0 }

      return [
        markerId,
        {
          x: groupLayout.anchor.x + slot.column * (blockSize.width + groupSpacing),
          y: groupLayout.anchor.y + slot.row * (blockSize.height + groupSpacing),
        },
      ]
    })
  )

  return markers.map((marker) =>
    nextBlocksById.has(marker.id)
      ? { ...marker, block: nextBlocksById.get(marker.id) }
      : marker
  )
}

export function applyGroupLayouts(markers, groups, blockSize, groupSpacing) {
  return groups.reduce(
    (currentMarkers, group) => applyGroupLayout(currentMarkers, group, blockSize, groupSpacing),
    markers
  )
}

export function flattenGroupedMarkerIds(groups) {
  return [...new Set(groups.flatMap((group) => group.orderedIds))]
}

export function expandSelectedIdsWithGroups(selectedIds, groups) {
  const expandedIds = new Set(selectedIds)
  let changed = true

  while (changed) {
    changed = false

    groups.forEach((group) => {
      if (!group.orderedIds.some((markerId) => expandedIds.has(markerId))) return

      group.orderedIds.forEach((markerId) => {
        if (expandedIds.has(markerId)) return
        expandedIds.add(markerId)
        changed = true
      })
    })
  }

  return [...expandedIds]
}

export function remapGroups(groups, idMapping, markers, blockSize, groupSpacing) {
  const singleMarkerBlocks = new Map()
  const nextGroups = groups
    .map((group) => {
      const nextOrderedIds = group.orderedIds
        .map((markerId) => idMapping.get(markerId))
        .filter((markerId) => markerId != null)

      if (nextOrderedIds.length === 1) {
        const slot = group.slots?.[0] ?? { column: 0, row: 0 }

        singleMarkerBlocks.set(nextOrderedIds[0], {
          x: group.anchor.x + slot.column * (blockSize.width + groupSpacing),
          y: group.anchor.y + slot.row * (blockSize.height + groupSpacing),
        })
        return null
      }

      if (nextOrderedIds.length < 2) return null

      return {
        ...group,
        orderedIds: nextOrderedIds,
        slots: (group.slots ?? []).slice(0, nextOrderedIds.length),
      }
    })
    .filter(Boolean)

  const nextMarkers = markers.map((marker) =>
    singleMarkerBlocks.has(marker.id)
      ? { ...marker, block: singleMarkerBlocks.get(marker.id) }
      : marker
  )

  return {
    groups: nextGroups,
    markers: applyGroupLayouts(nextMarkers, nextGroups, blockSize, groupSpacing),
  }
}

export function getGroupAdjustedForResizedMarker(group, markerId, markerBlock, blockSize, groupSpacing) {
  if (!group?.orderedIds.includes(markerId)) return group

  const slotIndex = group.orderedIds.indexOf(markerId)
  const slot = group.slots[slotIndex] ?? { column: 0, row: 0 }

  return {
    ...group,
    anchor: {
      x: markerBlock.x - slot.column * (blockSize.width + groupSpacing),
      y: markerBlock.y - slot.row * (blockSize.height + groupSpacing),
    },
  }
}
