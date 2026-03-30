import { useEffect, useMemo, useRef, useState } from "react";
import { collectSelectedDots, getPercentPoint } from "../utils/points";
import { parseCoordinatePairsBackup, serializeCoordinatePairs } from "../utils/backup";
import { MAX_ZOOM_SCALE, MIN_ZOOM_SCALE, ZOOM_STEP } from "../constants";
import { clamp } from "../utils/math";
import { shortestOpenPath } from "../utils/pathing";
import { useViewport } from "./useViewport";

function renumberPairs(pairs) {
  return pairs.map((pair, index) => ({ ...pair, id: index + 1 }));
}

export function useLinkedMapState() {
  const blobRef = useRef(null);
  const nextDotIdRef = useRef(1);
  const nextPathIdRef = useRef(1);
  const viewport = useViewport();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [pendingPoint, setPendingPoint] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [hoveredPairId, setHoveredPairId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [paths, setPaths] = useState([]);
  const [zoomScale, setZoomScale] = useState(MIN_ZOOM_SCALE);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setPendingPoint(null);
        setDragStart(null);
        setDragCurrent(null);
      }
      if (event.key.toLowerCase() === "d" && hoveredPairId != null) {
        setPairs((current) => renumberPairs(current.filter((pair) => pair.id !== hoveredPairId)));
        setHoveredPairId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hoveredPairId]);

  const stageSize = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return { width: 0, height: 0 };
    const scale = Math.min(
      viewport.width / imageSize.width,
      viewport.height / imageSize.height
    );
    return {
      width: Math.round(imageSize.width * scale),
      height: Math.round(imageSize.height * scale),
    };
  }, [imageSize, viewport]);

  function resetInteractiveState() {
    setPairs([]);
    setPendingPoint(null);
    setHoveredPairId(null);
    setPaths([]);
    setZoomScale(MIN_ZOOM_SCALE);
    setZoomOrigin({ x: 50, y: 50 });
    nextDotIdRef.current = 1;
    nextPathIdRef.current = 1;
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = url;
    const image = new Image();
    image.onload = () => {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      setImageUrl(url);
      resetInteractiveState();
    };
    image.src = url;
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = "";
  }

  function handleStageClick(event) {
    if (selectMode) return;
    const { x, y } = getPercentPoint(event);
    if (!pendingPoint) return setPendingPoint({ id: nextDotIdRef.current++, x, y });
    const dot1 = pendingPoint;
    const dot2 = { id: nextDotIdRef.current++, x, y };
    setPairs((current) => [...current, { id: current.length + 1, dots: [dot1, dot2] }]);
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
    if (!selectMode || !dragStart) return;
    setDragCurrent(getPercentPoint(event));
  }

  function handleMouseUp() {
    if (!selectMode || !dragStart || !dragCurrent) return;
    const minX = Math.min(dragStart.x, dragCurrent.x);
    const maxX = Math.max(dragStart.x, dragCurrent.x);
    const minY = Math.min(dragStart.y, dragCurrent.y);
    const maxY = Math.max(dragStart.y, dragCurrent.y);
    const selected = collectSelectedDots(pairs, { minX, maxX, minY, maxY });

    if (selected.length >= 2) {
      const pathId = nextPathIdRef.current++;
      setPaths((current) => [
        ...current,
        { id: pathId, dots: shortestOpenPath(selected) },
      ]);
    }

    setDragStart(null);
    setDragCurrent(null);
  }

  function toggleSelectMode() {
    setSelectMode((current) => !current);
    setDragStart(null);
    setDragCurrent(null);
    setPendingPoint(null);
  }

  function clearTransientState() {
    setPendingPoint(null);
    setHoveredPairId(null);
    setDragStart(null);
    setDragCurrent(null);
    setPaths([]);
  }

  function clearCoordinates() {
    setPairs([]);
    setPendingPoint(null);
    setHoveredPairId(null);
    setDragStart(null);
    setDragCurrent(null);
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
    const blob = new Blob([serializeCoordinatePairs(pairs)], {
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
    const restoredPairs = parseCoordinatePairsBackup(text);
    clearTransientState();
    setPairs(restoredPairs);
    nextPathIdRef.current = 1;
    nextDotIdRef.current =
      restoredPairs.reduce((maxId, pair) => Math.max(maxId, ...pair.dots.map((dot) => dot.id)), 0) +
      1;
  }

  return {
    dragCurrent,
    dragStart,
    downloadCoordinates,
    handleFileChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleStageClick,
    handleStageWheel,
    hoveredPairId,
    imageUrl,
    pairs,
    paths,
    pendingPoint,
    selectMode,
    setHoveredPairId,
    stageSize,
    toggleSelectMode,
    clearCoordinates,
    clearCoordinatesAndPaths,
    clearPaths: () => setPaths([]),
    restoreCoordinates,
    zoomOrigin,
    zoomScale,
  };
}
