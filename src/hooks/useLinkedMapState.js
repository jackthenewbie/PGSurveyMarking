import { useEffect, useMemo, useRef, useState } from "react"
import { DEFAULT_BLOCK_SIZE, DEFAULT_GROUP_SPACING, MIN_ZOOM_SCALE } from "../constants"
import { normalizeSquareBlockSize } from "../utils/blockSize"
import {
  clearPersistedAnnotationSettings,
  clearPersistedAnnotationState,
  loadPersistedAnnotationSettings,
  loadPersistedAnnotationState,
  savePersistedAnnotationSettings,
  savePersistedAnnotationState,
} from "../utils/browserStorage"
import { createDragHandlers } from "./linkedMapState/dragHandlers"
import { applyGroupLayouts, flattenGroupedMarkerIds } from "./linkedMapState/groupLayouts"
import { createAnnotationModeActions } from "./linkedMapState/interactionModes"
import { createAnnotationResetters } from "./linkedMapState/annotationResets"
import { createPersistenceActions } from "./linkedMapState/persistence"
import { createPointerHandlers } from "./linkedMapState/pointerHandlers"
import { DEFAULT_SURFACE_SIZE, useLinkedMapSource } from "./linkedMapState/sourceState"
import { useKeyboardShortcuts } from "./linkedMapState/useKeyboardShortcuts"
import { useViewport } from "./useViewport"

function clonePoint(point) {
  return point ? { ...point } : point
}

function cloneMarker(marker) {
  return {
    ...marker,
    block: clonePoint(marker.block),
    dot: clonePoint(marker.dot),
  }
}

function cloneGroup(group) {
  return {
    ...group,
    anchor: clonePoint(group.anchor),
    orderedIds: [...group.orderedIds],
  }
}

function createAnnotationSnapshot({ blockSize, groupSpacing, groups, markers, paths }) {
  return {
    blockSize: { ...blockSize },
    groupSpacing,
    groups: groups.map(cloneGroup),
    markers: markers.map(cloneMarker),
    paths: paths.map((path) => ({
      ...path,
      dots: path.dots.map(clonePoint),
    })),
  }
}

function areSnapshotsEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function useLinkedMapState() {
  const persistedSettingsRef = useRef(loadPersistedAnnotationSettings())
  const nextPathIdRef = useRef(1)
  const nextGroupIdRef = useRef(1)
  const hasLoadedPersistedStateRef = useRef(false)
  const skipNextPersistenceRef = useRef(true)
  const annotationSnapshotRef = useRef(null)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const gestureStartSnapshotRef = useRef(null)
  const viewport = useViewport()

  const [pendingPoint, setPendingPoint] = useState(null)
  const [markers, setMarkers] = useState([])
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null)
  const [activeMarkerId, setActiveMarkerId] = useState(null)
  const [groups, setGroups] = useState([])
  const [selectMode, setSelectMode] = useState(false)
  const [groupingMode, setGroupingMode] = useState(false)
  const [focusTrackingMode, setFocusTrackingMode] = useState(false)

  const [dragStart, setDragStart] = useState(null)
  const [dragCurrent, setDragCurrent] = useState(null)
  const [paths, setPaths] = useState([])
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM_SCALE)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const [blockSize, setBlockSize] = useState(persistedSettingsRef.current?.blockSize ?? DEFAULT_BLOCK_SIZE)
  const [groupSpacing, setGroupSpacing] = useState(
    persistedSettingsRef.current?.groupSpacing ?? DEFAULT_GROUP_SPACING
  )
  const [showMarkerLabels, setShowMarkerLabels] = useState(true)
  const [resizeState, setResizeState] = useState(null)
  const [spacingDragState, setSpacingDragState] = useState(null)
  const [dragBlockState, setDragBlockState] = useState(null)

  const applyAnnotationSnapshot = (snapshot) => {
    cancelGesture()
    resetters.clearTransientState()
    setMarkers(snapshot.markers.map(cloneMarker))
    setGroups(snapshot.groups.map(cloneGroup))
    setPaths(
      snapshot.paths.map((path) => ({
        ...path,
        dots: path.dots.map(clonePoint),
      }))
    )
    setBlockSize({ ...snapshot.blockSize })
    setGroupSpacing(snapshot.groupSpacing)
    nextPathIdRef.current = snapshot.paths.reduce((maxPathId, path) => Math.max(maxPathId, path.id ?? 0), 0) + 1
    nextGroupIdRef.current =
      snapshot.groups.reduce((maxGroupId, group) => Math.max(maxGroupId, group.id ?? 0), 0) + 1
  }

  const clearHistory = () => {
    undoStackRef.current = []
    redoStackRef.current = []
    gestureStartSnapshotRef.current = null
  }

  const cancelGesture = () => {
    gestureStartSnapshotRef.current = null
  }

  const pushUndoSnapshot = (snapshot) => {
    undoStackRef.current = [...undoStackRef.current, snapshot]
    redoStackRef.current = []
  }

  const captureGestureStart = () => {
    if (gestureStartSnapshotRef.current || !annotationSnapshotRef.current) return
    gestureStartSnapshotRef.current = createAnnotationSnapshot(annotationSnapshotRef.current)
  }

  const finishGesture = () => {
    const startSnapshot = gestureStartSnapshotRef.current
    gestureStartSnapshotRef.current = null
    if (!startSnapshot || !annotationSnapshotRef.current) return

    const currentSnapshot = createAnnotationSnapshot(annotationSnapshotRef.current)
    if (areSnapshotsEqual(startSnapshot, currentSnapshot)) return
    pushUndoSnapshot(startSnapshot)
  }

  const undo = () => {
    const previousSnapshot = undoStackRef.current.at(-1)
    if (!previousSnapshot || !annotationSnapshotRef.current) return

    const currentSnapshot = createAnnotationSnapshot(annotationSnapshotRef.current)
    cancelGesture()
    undoStackRef.current = undoStackRef.current.slice(0, -1)
    redoStackRef.current = [...redoStackRef.current, currentSnapshot]
    applyAnnotationSnapshot(previousSnapshot)
  }

  const redo = () => {
    const nextSnapshot = redoStackRef.current.at(-1)
    if (!nextSnapshot || !annotationSnapshotRef.current) return

    const currentSnapshot = createAnnotationSnapshot(annotationSnapshotRef.current)
    cancelGesture()
    redoStackRef.current = redoStackRef.current.slice(0, -1)
    undoStackRef.current = [...undoStackRef.current, currentSnapshot]
    applyAnnotationSnapshot(nextSnapshot)
  }

  const resetters = createAnnotationResetters({
    getDefaultBlockSize: () => persistedSettingsRef.current?.blockSize ?? DEFAULT_BLOCK_SIZE,
    getDefaultGroupSpacing: () => persistedSettingsRef.current?.groupSpacing ?? DEFAULT_GROUP_SPACING,
    nextGroupIdRef,
    nextPathIdRef,
    setActiveMarkerId,
    setBlockSize,
    setDragBlockState,
    setDragCurrent,
    setDragStart,
    setFocusTrackingMode,
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
  })
  const resetAnnotationStateAndHistory = () => {
    clearHistory()
    resetters.resetAnnotationState()
  }
  const resetSavedSettings = () => {
    clearHistory()
    clearPersistedAnnotationState()
    clearPersistedAnnotationSettings()
    persistedSettingsRef.current = null
    resetters.resetAnnotationState()
  }
  const source = useLinkedMapSource({
    clearSavedAnnotationState: clearPersistedAnnotationState,
    resetAnnotationState: resetAnnotationStateAndHistory,
  })
  const stageSize = useMemo(() => {
    if (!source.surfaceSize.width || !source.surfaceSize.height) return DEFAULT_SURFACE_SIZE
    const scale = Math.min(viewport.width / source.surfaceSize.width, viewport.height / source.surfaceSize.height)
    return { width: Math.round(source.surfaceSize.width * scale), height: Math.round(source.surfaceSize.height * scale) }
  }, [source.surfaceSize, viewport])

  useEffect(() => {
    const persisted = loadPersistedAnnotationState()
    hasLoadedPersistedStateRef.current = true

    if (!persisted) {
      skipNextPersistenceRef.current = false
      return
    }

    resetters.clearTransientState()
    setMarkers(persisted.markers)
    setGroups(persisted.groups)
    setPaths(persisted.paths)
    setBlockSize(persisted.blockSize)
    setGroupSpacing(persisted.groupSpacing)
    nextPathIdRef.current =
      persisted.paths.reduce((maxPathId, path) => Math.max(maxPathId, path.id ?? 0), 0) + 1
    nextGroupIdRef.current =
      persisted.groups.reduce((maxGroupId, group) => Math.max(maxGroupId, group.id ?? 0), 0) + 1
  }, [])

  useEffect(() => {
    if (!stageSize.width || !stageSize.height) return

    setBlockSize((current) => {
      const next = normalizeSquareBlockSize(current, stageSize)

      if (
        Math.abs(next.width - current.width) < 0.0001 &&
        Math.abs(next.height - current.height) < 0.0001
      ) {
        return current
      }

      return next
    })
  }, [stageSize.height, stageSize.width])

  useEffect(() => {
    if (groups.length === 0 || !stageSize.width || !stageSize.height) return

    setMarkers((current) => applyGroupLayouts(current, groups, blockSize, groupSpacing, stageSize))
  }, [blockSize, groupSpacing, groups, stageSize.height, stageSize.width])

  useEffect(() => {
    if (!hasLoadedPersistedStateRef.current) return
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false
      return
    }

    savePersistedAnnotationState({
      blockSize,
      groupSpacing,
      groups,
      markers,
      paths,
    })
  }, [blockSize, groupSpacing, groups, markers, paths])

  useEffect(() => {
    persistedSettingsRef.current = { blockSize, groupSpacing }
    savePersistedAnnotationSettings({
      blockSize,
      groupSpacing,
    })
  }, [blockSize, groupSpacing])

  useEffect(() => {
    annotationSnapshotRef.current = {
      blockSize,
      groupSpacing,
      groups,
      markers,
      paths,
    }
  }, [blockSize, groupSpacing, groups, markers, paths])

  const modeActions = createAnnotationModeActions({
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
  })
  useKeyboardShortcuts({
    activeMarkerId,
    blockSize,
    cancelGesture,
    canRedo: redoStackRef.current.length > 0,
    canUndo: undoStackRef.current.length > 0,
    focusTrackingMode,
    groupSpacing,
    groups,
    hoveredMarkerId,
    markers,
    onRedo: redo,
    onUndo: undo,
    pushHistorySnapshot: () => {
      if (!annotationSnapshotRef.current) return
      pushUndoSnapshot(createAnnotationSnapshot(annotationSnapshotRef.current))
    },
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
    toggleSelectMode: modeActions.toggleSelectMode,
    toggleGroupingMode: modeActions.toggleGroupingMode,
  })
  const pointerHandlers = createPointerHandlers({
    activeMarkerId,
    blockSize,
    dragBlockState,
    dragCurrent,
    dragStart,
    finishGesture,
    focusTrackingMode,
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
    pushHistorySnapshot: () => {
      if (!annotationSnapshotRef.current) return
      pushUndoSnapshot(createAnnotationSnapshot(annotationSnapshotRef.current))
    },
  })
  const dragHandlers = createDragHandlers({
    blockSize,
    dragBlockState,
    dragStart,
    focusTrackingMode,
    groupSpacing,
    groupingMode,
    groups,
    markers,
    resizeState,
    selectMode,
    setBlockSize,
    setDragCurrent,
    setGroupSpacing,
    setGroups,
    setMarkers,
    stageSize,
    spacingDragState,
  })
  const persistenceActions = createPersistenceActions({
    blockSize,
    clearTransientState: resetters.clearTransientState,
    groupSpacing,
    groups,
    markers,
    setBlockSize,
    setGroupSpacing,
    setGroups,
    restoreRestoredMarkers: pointerHandlers.restoreRestoredMarkers,
  })

  const clearCoordinates = () => {
    if (markers.length === 0 && groups.length === 0) return
    cancelGesture()
    pushUndoSnapshot(createAnnotationSnapshot(annotationSnapshotRef.current))
    resetters.clearCoordinates()
  }

  const clearCoordinatesAndPaths = () => {
    if (markers.length === 0 && groups.length === 0 && paths.length === 0) return
    cancelGesture()
    pushUndoSnapshot(createAnnotationSnapshot(annotationSnapshotRef.current))
    resetters.clearCoordinatesAndPaths()
  }

  const clearGroups = () => {
    if (groups.length === 0) return
    cancelGesture()
    pushUndoSnapshot(createAnnotationSnapshot(annotationSnapshotRef.current))
    modeActions.clearGroups()
  }

  const clearPaths = () => {
    if (paths.length === 0) return
    cancelGesture()
    pushUndoSnapshot(createAnnotationSnapshot(annotationSnapshotRef.current))
    setPaths([])
  }

  const restoreCoordinates = (text) => {
    const snapshotBeforeRestore = createAnnotationSnapshot(annotationSnapshotRef.current)
    cancelGesture()
    persistenceActions.restoreCoordinates(text)
    pushUndoSnapshot(snapshotBeforeRestore)
  }

  return {
    activeMarkerId,
    blockSize,
    changeMode: source.changeMode,
    clearCoordinates,
    clearCoordinatesAndPaths,
    clearGroups,
    clearPaths,
    downloadCoordinates: persistenceActions.downloadCoordinates,
    dragCurrent,
    dragStart,
    focusTrackingMode,
    groupSpacing,
    groupedMarkerIds: flattenGroupedMarkerIds(groups),
    groups, groupingMode,
    handleBlockDragStart: modeActions.handleBlockDragStart,
    handleFileChange: source.handleFileChange,
    handleMouseDown: pointerHandlers.handleMouseDown,
    handleMouseMove: dragHandlers.handleMouseMove,
    handleMouseUp: pointerHandlers.handleMouseUp,
    handleResizeStart: modeActions.handleResizeStart,
    handleSpacingDragStart: modeActions.handleSpacingDragStart,
    handleStageClick: pointerHandlers.handleStageClick,
    handleStageWheel: pointerHandlers.handleStageWheel,
    hasSource: source.hasSource,
    hoveredMarkerId, markers,
    mediaSource: source.mediaSource,
    mode: source.mode,
    paths,
    pendingPoint,
    restoreCoordinates,
    resetSavedSettings,
    selectMode,
    setActiveMarkerId: modeActions.setActiveMarkerId,
    setHoveredMarkerId,
    showMarkerLabels,
    stageSize,
    startScreenShare: source.startScreenShare,
    toggleFocusTrackingMode: modeActions.toggleFocusTrackingMode,
    toggleGroupingMode: modeActions.toggleGroupingMode,
    toggleMarkerLabels: () => setShowMarkerLabels((current) => !current),
    toggleSelectMode: modeActions.toggleSelectMode,
    updateSurfaceSize: source.updateSurfaceSize,
    zoomOrigin, zoomScale,
  }
}
