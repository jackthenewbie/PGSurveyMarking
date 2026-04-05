import { useMemo, useRef, useState } from "react"
import { DEFAULT_BLOCK_SIZE, DEFAULT_GROUP_SPACING, MIN_ZOOM_SCALE } from "../constants"
import { createDragHandlers } from "./linkedMapState/dragHandlers"
import { flattenGroupedMarkerIds } from "./linkedMapState/groupLayouts"
import { createAnnotationModeActions } from "./linkedMapState/interactionModes"
import { createAnnotationResetters } from "./linkedMapState/annotationResets"
import { createPersistenceActions } from "./linkedMapState/persistence"
import { createPointerHandlers } from "./linkedMapState/pointerHandlers"
import { DEFAULT_SURFACE_SIZE, useLinkedMapSource } from "./linkedMapState/sourceState"
import { useMarkerDeletionShortcut } from "./linkedMapState/useMarkerDeletionShortcut"
import { useViewport } from "./useViewport"

export function useLinkedMapState() {
  const nextPathIdRef = useRef(1)
  const nextGroupIdRef = useRef(1)
  const viewport = useViewport()

  const [pendingPoint, setPendingPoint] = useState(null)
  const [markers, setMarkers] = useState([])
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null)
  const [activeMarkerId, setActiveMarkerId] = useState(null)
  const [groups, setGroups] = useState([])
  const [selectMode, setSelectMode] = useState(false)
  const [groupingMode, setGroupingMode] = useState(false)

  const [dragStart, setDragStart] = useState(null)
  const [dragCurrent, setDragCurrent] = useState(null)
  const [paths, setPaths] = useState([])
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM_SCALE)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const [blockSize, setBlockSize] = useState(DEFAULT_BLOCK_SIZE)
  const [groupSpacing, setGroupSpacing] = useState(DEFAULT_GROUP_SPACING)
  const [showMarkerLabels, setShowMarkerLabels] = useState(true)
  const [resizeState, setResizeState] = useState(null)
  const [spacingDragState, setSpacingDragState] = useState(null)
  const [dragBlockState, setDragBlockState] = useState(null)
  const resetters = createAnnotationResetters({
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
  })
  const source = useLinkedMapSource({ resetAnnotationState: resetters.resetAnnotationState })
  useMarkerDeletionShortcut({
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
  })
  const stageSize = useMemo(() => {
    if (!source.surfaceSize.width || !source.surfaceSize.height) return DEFAULT_SURFACE_SIZE
    const scale = Math.min(viewport.width / source.surfaceSize.width, viewport.height / source.surfaceSize.height)
    return { width: Math.round(source.surfaceSize.width * scale), height: Math.round(source.surfaceSize.height * scale) }
  }, [source.surfaceSize, viewport])
  const modeActions = createAnnotationModeActions({
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
  })
  const pointerHandlers = createPointerHandlers({
    activeMarkerId,
    blockSize,
    dragBlockState,
    dragCurrent,
    dragStart,
    groupSpacing,
    groupingMode,
    groups,
    markers,
    nextGroupIdRef,
    nextPathIdRef,
    pendingPoint,
    resizeState,
    selectMode,
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
  })
  const dragHandlers = createDragHandlers({
    blockSize,
    dragBlockState,
    dragStart,
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
  return {
    activeMarkerId,
    blockSize,
    changeMode: source.changeMode,
    clearCoordinates: resetters.clearCoordinates,
    clearCoordinatesAndPaths: resetters.clearCoordinatesAndPaths,
    clearGroups: modeActions.clearGroups,
    clearPaths: () => setPaths([]),
    downloadCoordinates: persistenceActions.downloadCoordinates,
    dragCurrent,
    dragStart,
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
    restoreCoordinates: persistenceActions.restoreCoordinates,
    selectMode,
    setActiveMarkerId: modeActions.setActiveMarkerId,
    setHoveredMarkerId,
    showMarkerLabels,
    stageSize,
    startScreenShare: source.startScreenShare,
    toggleGroupingMode: modeActions.toggleGroupingMode,
    toggleMarkerLabels: () => setShowMarkerLabels((current) => !current),
    toggleSelectMode: modeActions.toggleSelectMode,
    updateSurfaceSize: source.updateSurfaceSize,
    zoomOrigin, zoomScale,
  }
}
