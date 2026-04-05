import { useEffect, useMemo, useRef, useState } from "react";
import { collectSelectedDots, getPercentPoint } from "../utils/points";
import { parseCoordinatePairsBackup, serializeCoordinatePairs } from "../utils/backup";
import {
  DEFAULT_BLOCK_SIZE,
  MAX_ZOOM_SCALE,
  MIN_BLOCK_SIZE,
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

export function useLinkedMapState() {
  const blobRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRequestIdRef = useRef(0);
  const nextPathIdRef = useRef(1);
  const viewport = useViewport();
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [mediaSource, setMediaSource] = useState(null);
  const [surfaceSize, setSurfaceSize] = useState(DEFAULT_SURFACE_SIZE);
  const [pendingPoint, setPendingPoint] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [activeMarkerId, setActiveMarkerId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [paths, setPaths] = useState([]);
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM_SCALE);
  const [zoomOrigin, setZoomOrigin] = useState(DEFAULT_ZOOM_ORIGIN);
  const [blockSize, setBlockSize] = useState(DEFAULT_BLOCK_SIZE);
  const [resizeState, setResizeState] = useState(null);

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
        setActiveMarkerId(null);
      }

      if (event.key.toLowerCase() === "d" && hoveredMarkerId != null) {
        setMarkers((current) => renumberMarkers(current.filter((marker) => marker.id !== hoveredMarkerId)));
        setHoveredMarkerId(null);
        setActiveMarkerId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hoveredMarkerId]);

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
    setSelectMode(false);
    setDragStart(null);
    setDragCurrent(null);
    setPaths([]);
    setZoomScale(MIN_ZOOM_SCALE);
    setZoomOrigin(DEFAULT_ZOOM_ORIGIN);
    setBlockSize(DEFAULT_BLOCK_SIZE);
    setResizeState(null);
    nextPathIdRef.current = 1;
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
    if (selectMode || resizeState) return;

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
    if (!selectMode) return;
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
      setBlockSize((current) => ({
        width: resizeState.affectsX
          ? clamp(Math.abs(point.x - marker.block.x) * 2, MIN_BLOCK_SIZE.width, 100)
          : current.width,
        height: resizeState.affectsY
          ? clamp(Math.abs(point.y - marker.block.y) * 2, MIN_BLOCK_SIZE.height, 100)
          : current.height,
      }));
      return;
    }

    if (!selectMode || !dragStart) return;
    setDragCurrent(getPercentPoint(event));
  }

  function handleMouseUp() {
    if (resizeState) {
      setResizeState(null);
      return;
    }

    if (!selectMode || !dragStart || !dragCurrent) return;
    const minX = Math.min(dragStart.x, dragCurrent.x);
    const maxX = Math.max(dragStart.x, dragCurrent.x);
    const minY = Math.min(dragStart.y, dragCurrent.y);
    const maxY = Math.max(dragStart.y, dragCurrent.y);
    const selected = collectSelectedDots(markers, { minX, maxX, minY, maxY });

    if (selected.length >= 2) {
      const pathId = nextPathIdRef.current++;
      setPaths((current) => [...current, { id: pathId, dots: shortestOpenPath(selected) }]);
    }

    setDragStart(null);
    setDragCurrent(null);
  }

  function toggleSelectMode() {
    setSelectMode((current) => !current);
    setDragStart(null);
    setDragCurrent(null);
    setPendingPoint(null);
    setActiveMarkerId(null);
    setResizeState(null);
  }

  function clearTransientState() {
    setPendingPoint(null);
    setHoveredMarkerId(null);
    setActiveMarkerId(null);
    setDragStart(null);
    setDragCurrent(null);
    setPaths([]);
    setResizeState(null);
  }

  function clearCoordinates() {
    setMarkers([]);
    setPendingPoint(null);
    setHoveredMarkerId(null);
    setActiveMarkerId(null);
    setDragStart(null);
    setDragCurrent(null);
    setResizeState(null);
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
    const blob = new Blob([serializeCoordinatePairs(markers, blockSize)], {
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
    setMarkers(restored.markers);
    setBlockSize(restored.blockSize);
    nextPathIdRef.current = 1;
  }

  function activateMarker(markerId) {
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

  return {
    activeMarkerId,
    blockSize,
    clearCoordinates,
    clearCoordinatesAndPaths,
    clearPaths: () => setPaths([]),
    changeMode,
    downloadCoordinates,
    dragCurrent,
    dragStart,
    handleFileChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
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
    toggleSelectMode,
    updateSurfaceSize,
    zoomOrigin,
    zoomScale,
  };
}
