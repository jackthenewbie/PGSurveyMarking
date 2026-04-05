import { useEffect, useMemo, useRef, useState } from "react";
import { collectSelectedBlocks, collectSelectedDots, getPercentPoint } from "../utils/points";
import { parseCoordinatePairsBackup, serializeCoordinatePairs } from "../utils/backup";
import {
  DEFAULT_BLOCK_SIZE,
  DEFAULT_GROUP_SPACING,
  MAX_ZOOM_SCALE,
  MIN_BLOCK_SIZE,
  MIN_GROUP_SPACING,
  MIN_ZOOM_SCALE,
  ZOOM_STEP,
} from "../constants";
import { clamp } from "../utils/math";
import { shortestOpenPath } from "../utils/pathing";
import { useViewport } from "./useViewport";

const DEFAULT_MODE = "screenshot";
const DEFAULT_SURFACE_SIZE = { width: 0, height: 0 };
const DEFAULT_ZOOM_ORIGIN = { x: 50, y: 50 };

function renumberMarkers(markers) {
  return markers.map((marker, index) => ({ ...marker, id: index + 1 }));
}

function distanceBetweenBlocks(left, right) {
  return Math.hypot(left.block.x - right.block.x, left.block.y - right.block.y);
}

function getTopLeftMostMarker(markers) {
  return [...markers].sort((left, right) => left.block.y - right.block.y || left.block.x - right.block.x)[0];
}

function buildNearestMarkerOrder(selectedMarkers) {
  if (selectedMarkers.length === 0) return [];

  const orderedIds = [];
  const remaining = new Map(selectedMarkers.map((marker) => [marker.id, marker]));
  let current = getTopLeftMostMarker(selectedMarkers);

  while (current) {
    orderedIds.push(current.id);
    remaining.delete(current.id);

    let nextMarker = null;

    remaining.forEach((candidate) => {
      if (
        !nextMarker ||
        distanceBetweenBlocks(current, candidate) < distanceBetweenBlocks(current, nextMarker) ||
        (
          distanceBetweenBlocks(current, candidate) === distanceBetweenBlocks(current, nextMarker) &&
          (candidate.block.y < nextMarker.block.y ||
            (candidate.block.y === nextMarker.block.y && candidate.block.x < nextMarker.block.x))
        )
      ) {
        nextMarker = candidate;
      }
    });

    current = nextMarker;
  }

  return orderedIds;
}

function getSlotKey(column, row) {
  return `${column},${row}`;
}

function getSlotNeighbors(column, row) {
  return [
    { column: column + 1, row },
    { column, row: row + 1 },
    { column: column - 1, row },
    { column, row: row - 1 },
  ].filter((slot) => slot.column >= 0 && slot.row >= 0);
}

function countOccupiedNeighbors(slot, occupiedKeys) {
  return getSlotNeighbors(slot.column, slot.row).filter((neighbor) =>
    occupiedKeys.has(getSlotKey(neighbor.column, neighbor.row))
  ).length;
}

function buildMagnetSlots(count) {
  if (count <= 0) return [];

  const slots = [{ column: 0, row: 0 }];
  const occupiedKeys = new Set([getSlotKey(0, 0)]);
  const frontier = new Map();

  getSlotNeighbors(0, 0).forEach((slot) => {
    frontier.set(getSlotKey(slot.column, slot.row), slot);
  });

  while (slots.length < count && frontier.size > 0) {
    const nextSlot = [...frontier.values()].sort((left, right) => {
      const leftDistance = left.column + left.row;
      const rightDistance = right.column + right.row;

      if (leftDistance !== rightDistance) return leftDistance - rightDistance;

      const leftNeighbors = countOccupiedNeighbors(left, occupiedKeys);
      const rightNeighbors = countOccupiedNeighbors(right, occupiedKeys);

      if (leftNeighbors !== rightNeighbors) return rightNeighbors - leftNeighbors;
      if (left.row !== right.row) return left.row - right.row;
      return left.column - right.column;
    })[0];

    slots.push(nextSlot);
    const slotKey = getSlotKey(nextSlot.column, nextSlot.row);
    frontier.delete(slotKey);
    occupiedKeys.add(slotKey);

    getSlotNeighbors(nextSlot.column, nextSlot.row).forEach((neighbor) => {
      const neighborKey = getSlotKey(neighbor.column, neighbor.row);
      if (!occupiedKeys.has(neighborKey)) {
        frontier.set(neighborKey, neighbor);
      }
    });
  }

  return slots;
}

function createGroupLayout(markers, selectedIds, blockSize, groupSpacing) {
  const selectedMarkers = markers.filter((marker) => selectedIds.includes(marker.id));

  if (selectedMarkers.length < 2) return null;

  const topLeftMarker = getTopLeftMostMarker(selectedMarkers);

  return {
    anchor: { x: topLeftMarker.block.x, y: topLeftMarker.block.y },
    orderedIds: buildNearestMarkerOrder(selectedMarkers),
    slots: buildMagnetSlots(selectedMarkers.length),
  };
}

function applyGroupLayout(markers, groupLayout, blockSize, groupSpacing) {
  if (!groupLayout) return markers;

  const nextBlocksById = new Map(
    groupLayout.orderedIds.map((markerId, index) => {
      const slot = groupLayout.slots[index] ?? { column: 0, row: 0 };

      return [
        markerId,
        {
          x: groupLayout.anchor.x + slot.column * (blockSize.width + groupSpacing),
          y: groupLayout.anchor.y + slot.row * (blockSize.height + groupSpacing),
        },
      ];
    })
  );

  return markers.map((marker) =>
    nextBlocksById.has(marker.id)
      ? { ...marker, block: nextBlocksById.get(marker.id) }
      : marker
  );
}

function applyGroupLayouts(markers, groups, blockSize, groupSpacing) {
  return groups.reduce(
    (currentMarkers, group) => applyGroupLayout(currentMarkers, group, blockSize, groupSpacing),
    markers
  );
}

function flattenGroupedMarkerIds(groups) {
  return [...new Set(groups.flatMap((group) => group.orderedIds))];
}

function remapGroups(groups, idMapping, markers, blockSize, groupSpacing) {
  const nextGroups = groups
    .map((group) => {
      const nextOrderedIds = group.orderedIds
        .map((markerId) => idMapping.get(markerId))
        .filter(Boolean);

      if (nextOrderedIds.length < 2) return null;

      return {
        ...group,
        orderedIds: nextOrderedIds,
        slots: buildMagnetSlots(nextOrderedIds.length),
      };
    })
    .filter(Boolean);

  return {
    groups: nextGroups,
    markers: applyGroupLayouts(markers, nextGroups, blockSize, groupSpacing),
  };
}

function getGroupAdjustedForResizedMarker(group, markerId, markerBlock, blockSize, groupSpacing) {
  if (!group?.orderedIds.includes(markerId)) return group;

  const slotIndex = group.orderedIds.indexOf(markerId);
  const slot = group.slots[slotIndex] ?? { column: 0, row: 0 };

  return {
    ...group,
    anchor: {
      x: markerBlock.x - slot.column * (blockSize.width + groupSpacing),
      y: markerBlock.y - slot.row * (blockSize.height + groupSpacing),
    },
  };
}

export function useLinkedMapState() {
  const blobRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRequestIdRef = useRef(0);
  const nextPathIdRef = useRef(1);
  const nextGroupIdRef = useRef(1);
  const viewport = useViewport();
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [mediaSource, setMediaSource] = useState(null);
  const [surfaceSize, setSurfaceSize] = useState(DEFAULT_SURFACE_SIZE);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [groupingMode, setGroupingMode] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [paths, setPaths] = useState([]);
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM_SCALE);
  const [zoomOrigin, setZoomOrigin] = useState(DEFAULT_ZOOM_ORIGIN);
  const [blockSize, setBlockSize] = useState(DEFAULT_BLOCK_SIZE);
  const [groupSpacing, setGroupSpacing] = useState(DEFAULT_GROUP_SPACING);
  const [resizeState, setResizeState] = useState(null);
  const [spacingDragState, setSpacingDragState] = useState(null);

  useEffect(() => {
    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPendingPoint(null);
        setDragStart(null);
        setDragCurrent(null);
        setResizeState(null);
        setSpacingDragState(null);
        setActiveMarkerId(null);
      }

      if (event.key.toLowerCase() === "d" && hoveredMarkerId != null) {
        const filteredMarkers = markers.filter((marker) => marker.id !== hoveredMarkerId);
        const renumberedMarkers = renumberMarkers(filteredMarkers);
        const idMapping = new Map(filteredMarkers.map((marker, index) => [marker.id, index + 1]));
        const { groups: nextGroups, markers: nextMarkers } = remapGroups(
          groups,
          idMapping,
          renumberedMarkers,
          blockSize,
          groupSpacing
        );

        setMarkers(nextMarkers);
        setHoveredMarkerId(null);
        setActiveMarkerId(null);
        setGroups(nextGroups);
        setSpacingDragState(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blockSize, groupSpacing, groups, hoveredMarkerId, markers]);

  const stageSize = useMemo(() => {
    if (!surfaceSize.width || !surfaceSize.height) return DEFAULT_SURFACE_SIZE;
    const scale = Math.min(viewport.width / surfaceSize.width, viewport.height / surfaceSize.height);
    return {
      width: Math.round(surfaceSize.width * scale),
      height: Math.round(surfaceSize.height * scale),
    };
  }, [surfaceSize, viewport]);

  function resetAnnotationState() {
    setMarkers([]);
    setPendingPoint(null);
    setHoveredMarkerId(null);
    setActiveMarkerId(null);
    setGroups([]);
    setSelectMode(false);
    setGroupingMode(false);
    setDragStart(null);
    setDragCurrent(null);
    setPaths([]);
    setZoomScale(MIN_ZOOM_SCALE);
    setZoomOrigin(DEFAULT_ZOOM_ORIGIN);
    setBlockSize(DEFAULT_BLOCK_SIZE);
    setGroupSpacing(DEFAULT_GROUP_SPACING);
    setResizeState(null);
    setSpacingDragState(null);
    nextPathIdRef.current = 1;
    nextGroupIdRef.current = 1;
  }

  function disposeCurrentMedia() {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      streamRef.current = null;
    }
  }

  function nextSourceRequestId() {
    sourceRequestIdRef.current += 1;
    return sourceRequestIdRef.current;
  }

  function clearSource() {
    nextSourceRequestId();
    disposeCurrentMedia();
    setMediaSource(null);
    setSurfaceSize(DEFAULT_SURFACE_SIZE);
    resetAnnotationState();
  }

  function updateSurfaceSize(width, height) {
    if (!width || !height) return;
    setSurfaceSize((current) =>
      current.width === width && current.height === height ? current : { width, height }
    );
  }

  function changeMode(nextMode) {
    if (nextMode === mode) return;
    clearSource();
    setMode(nextMode);
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const requestId = nextSourceRequestId();
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (sourceRequestIdRef.current !== requestId) {
        URL.revokeObjectURL(url);
        return;
      }

      disposeCurrentMedia();
      blobRef.current = url;
      setMode("screenshot");
      setMediaSource({ kind: "image", src: url });
      setSurfaceSize({ width: image.naturalWidth, height: image.naturalHeight });
      resetAnnotationState();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  }

  async function startScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Screen capture is not supported in this browser.");
    }

    const requestId = nextSourceRequestId();
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    if (sourceRequestIdRef.current !== requestId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    const [videoTrack] = stream.getVideoTracks();

    if (!videoTrack) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("The selected share source did not provide a video track.");
    }

    disposeCurrentMedia();
    streamRef.current = stream;
    videoTrack.onended = () => {
      if (streamRef.current !== stream) return;
      clearSource();
    };

    const settings = videoTrack.getSettings();
      setMode("stream");
      setMediaSource({ kind: "stream", stream });
      setSurfaceSize({
      width: Number(settings.width) || 0,
      height: Number(settings.height) || 0,
    });
    resetAnnotationState();
  }

  function handleStageClick(event) {
    if (selectMode || groupingMode || resizeState || spacingDragState) return;

    const { x, y } = getPercentPoint(event);

    if (activeMarkerId != null && !pendingPoint) {
      setActiveMarkerId(null);
      return;
    }

    if (!pendingPoint) {
      setPendingPoint({ x, y });
      return;
    }

    setMarkers((current) => [
      ...current,
      {
        id: current.length + 1,
        block: pendingPoint,
        dot: { x, y },
      },
    ]);
    setPendingPoint(null);
  }

  function handleMouseDown(event) {
    if (!selectMode && !groupingMode) return;
    event.preventDefault();
    const point = getPercentPoint(event);
    setDragStart(point);
    setDragCurrent(point);
  }

  function handleMouseMove(event) {
    if (resizeState) {
      const marker = markers.find((current) => current.id === resizeState.markerId);
      if (!marker) return;

      const point = getPercentPoint(event);
      const horizontalSize = Math.abs(point.x - marker.block.x) * 2;
      const verticalSize = Math.abs(point.y - marker.block.y) * 2;
      const nextSideLength = clamp(
        resizeState.affectsX && resizeState.affectsY
          ? Math.max(horizontalSize, verticalSize)
          : resizeState.affectsX
            ? horizontalSize
            : verticalSize,
        Math.max(MIN_BLOCK_SIZE.width, MIN_BLOCK_SIZE.height),
        100
      );
      const nextBlockSize = {
        width: nextSideLength,
        height: nextSideLength,
      };
      const resizedGroups = groups.map((group) =>
        getGroupAdjustedForResizedMarker(
          group,
          resizeState.markerId,
          marker.block,
          nextBlockSize,
          groupSpacing
        )
      );

      setBlockSize(nextBlockSize);
      if (groups.length > 0) {
        setGroups(resizedGroups);
        setMarkers((current) => applyGroupLayouts(current, resizedGroups, nextBlockSize, groupSpacing));
      }
      return;
    }

    if (spacingDragState) {
      const delta =
        spacingDragState.axis === "x"
          ? ((event.clientX - spacingDragState.startClientX) / event.currentTarget.getBoundingClientRect().width) * 100
          : ((event.clientY - spacingDragState.startClientY) / event.currentTarget.getBoundingClientRect().height) * 100;
      const nextSpacing = clamp(spacingDragState.startSpacing + delta * 2, MIN_GROUP_SPACING, 100);

      setGroupSpacing(nextSpacing);
      if (groups.length > 0) {
        setMarkers((current) => applyGroupLayouts(current, groups, blockSize, nextSpacing));
      }
      return;
    }

    if ((!selectMode && !groupingMode) || !dragStart) return;
    setDragCurrent(getPercentPoint(event));
  }

  function handleMouseUp() {
    if (resizeState) {
      setResizeState(null);
      return;
    }

    if (spacingDragState) {
      setSpacingDragState(null);
      return;
    }

    if ((!selectMode && !groupingMode) || !dragStart || !dragCurrent) return;
    const minX = Math.min(dragStart.x, dragCurrent.x);
    const maxX = Math.max(dragStart.x, dragCurrent.x);
    const minY = Math.min(dragStart.y, dragCurrent.y);
    const maxY = Math.max(dragStart.y, dragCurrent.y);

    if (groupingMode) {
      const selectedBlockIds = collectSelectedBlocks(markers, { minX, maxX, minY, maxY });

      if (selectedBlockIds.length >= 2) {
        const remainingGroups = groups.filter(
          (group) => !group.orderedIds.some((markerId) => selectedBlockIds.includes(markerId))
        );
        const nextGroup = createGroupLayout(markers, selectedBlockIds, blockSize, groupSpacing);

        if (nextGroup) {
          const createdGroup = {
            ...nextGroup,
            id: nextGroupIdRef.current++,
          };
          const nextGroups = [...remainingGroups, createdGroup];
          setGroups(nextGroups);
          setMarkers((current) => applyGroupLayouts(current, nextGroups, blockSize, groupSpacing));
          setActiveMarkerId(null);
        }
      }
    } else {
      const selected = collectSelectedDots(markers, { minX, maxX, minY, maxY });

      if (selected.length >= 2) {
        const pathId = nextPathIdRef.current++;
        setPaths((current) => [...current, { id: pathId, dots: shortestOpenPath(selected) }]);
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  }

  function toggleSelectMode() {
    setSelectMode((current) => !current);
    setGroupingMode(false);
    setDragStart(null);
    setDragCurrent(null);
    setPendingPoint(null);
    setActiveMarkerId(null);
    setResizeState(null);
    setSpacingDragState(null);
  }

  function toggleGroupingMode() {
    setGroupingMode((current) => !current);
    setSelectMode(false);
    setDragStart(null);
    setDragCurrent(null);
    setPendingPoint(null);
    setActiveMarkerId(null);
    setResizeState(null);
    setSpacingDragState(null);
  }

  function clearTransientState() {
    setPendingPoint(null);
    setHoveredMarkerId(null);
    setActiveMarkerId(null);
    setGroups([]);
    setDragStart(null);
    setDragCurrent(null);
    setPaths([]);
    setResizeState(null);
    setSpacingDragState(null);
  }

  function clearCoordinates() {
    setMarkers([]);
    setPendingPoint(null);
    setHoveredMarkerId(null);
    setActiveMarkerId(null);
    setGroups([]);
    setDragStart(null);
    setDragCurrent(null);
    setResizeState(null);
    setSpacingDragState(null);
  }

  function clearCoordinatesAndPaths() {
    clearCoordinates();
    setPaths([]);
  }

  function handleStageWheel(event) {
    event.preventDefault();
    const nextOrigin = getPercentPoint(event);
    const multiplier = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    setZoomOrigin(nextOrigin);
    setZoomScale((current) =>
      clamp(Number((current * multiplier).toFixed(4)), MIN_ZOOM_SCALE, MAX_ZOOM_SCALE)
    );
  }

  function downloadCoordinates() {
    const blob = new Blob([serializeCoordinatePairs(markers, blockSize, groupSpacing, groups)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "linked-map-coordinates.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function restoreCoordinates(text) {
    const restored = parseCoordinatePairsBackup(text);
    clearTransientState();
    setMarkers(
      applyGroupLayouts(
        restored.markers,
        restored.groups ?? [],
        restored.blockSize,
        restored.groupSpacing ?? DEFAULT_GROUP_SPACING
      )
    );
    setBlockSize(restored.blockSize);
    setGroupSpacing(restored.groupSpacing ?? DEFAULT_GROUP_SPACING);
    setGroups(restored.groups ?? []);
    nextPathIdRef.current = 1;
    nextGroupIdRef.current =
      (restored.groups ?? []).reduce((maxGroupId, group) => Math.max(maxGroupId, group.id ?? 0), 0) + 1;
  }

  function activateMarker(markerId) {
    if (selectMode || groupingMode) return;
    setPendingPoint(null);
    setActiveMarkerId(markerId);
  }

  function handleResizeStart(markerId, handle) {
    setPendingPoint(null);
    setActiveMarkerId(markerId);
    setResizeState({
      markerId,
      affectsX: handle.includes("e") || handle.includes("w"),
      affectsY: handle.includes("n") || handle.includes("s"),
    });
  }

  function handleSpacingDragStart(axis, startPoint) {
    if (groups.length === 0) return;
    setPendingPoint(null);
    setActiveMarkerId(null);
    setSpacingDragState({
      axis,
      startClientX: startPoint.clientX,
      startClientY: startPoint.clientY,
      startSpacing: groupSpacing,
    });
  }

  function clearGroups() {
    setGroups([]);
    setSpacingDragState(null);
  }

  return {
    activeMarkerId,
    blockSize,
    clearCoordinates,
    clearCoordinatesAndPaths,
    clearGroups,
    clearPaths: () => setPaths([]),
    changeMode,
    downloadCoordinates,
    dragCurrent,
    dragStart,
    groupSpacing,
    groupedMarkerIds: flattenGroupedMarkerIds(groups),
    groups,
    groupingMode,
    handleFileChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
    handleSpacingDragStart,
    handleStageClick,
    handleStageWheel,
    hasSource: mediaSource != null,
    hoveredMarkerId,
    markers,
    mediaSource,
    mode,
    paths,
    pendingPoint,
    restoreCoordinates,
    selectMode,
    setActiveMarkerId: activateMarker,
    setHoveredMarkerId,
    stageSize,
    startScreenShare,
    toggleGroupingMode,
    toggleSelectMode,
    updateSurfaceSize,
    zoomOrigin,
    zoomScale,
  };
}
