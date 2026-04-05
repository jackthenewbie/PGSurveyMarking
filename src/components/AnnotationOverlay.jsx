import { DotLayer } from "./DotLayer";
import { PathOverlay } from "./PathOverlay";
import { PendingDot } from "./PendingDot";
import { SelectionRect } from "./SelectionRect";

export function AnnotationOverlay({
  activeMarkerId,
  blockSize,
  dragCurrent,
  dragStart,
  hoveredMarkerId,
  markers,
  paths,
  pendingPoint,
  selectMode,
  stageSize,
  zoomScale,
  onActivateMarker,
  onHoverMarker,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onResizeStart,
  onStageClick,
  onWheel,
}) {
  return (
    <div
      onClick={onStageClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "crosshair",
        userSelect: "none",
      }}
    >
      <PathOverlay paths={paths} stageSize={stageSize} />
      <DotLayer
        activeMarkerId={activeMarkerId}
        blockSize={blockSize}
        hoveredMarkerId={hoveredMarkerId}
        markers={markers}
        onActivateMarker={onActivateMarker}
        onHoverMarker={onHoverMarker}
        onResizeStart={onResizeStart}
        zoomScale={zoomScale}
      />
      <PendingDot blockSize={blockSize} point={pendingPoint} />
      {selectMode && <SelectionRect dragCurrent={dragCurrent} dragStart={dragStart} />}
    </div>
  );
}
