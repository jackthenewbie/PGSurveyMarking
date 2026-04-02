import { DotLayer } from "./DotLayer";
import { PathOverlay } from "./PathOverlay";
import { PendingDot } from "./PendingDot";
import { SelectionRect } from "./SelectionRect";

export function AnnotationOverlay({
  dragCurrent,
  dragStart,
  hoveredPairId,
  pairs,
  paths,
  pendingPoint,
  selectMode,
  stageSize,
  zoomScale,
  onHoverPair,
  onMouseDown,
  onMouseMove,
  onMouseUp,
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
        hoveredPairId={hoveredPairId}
        pairs={pairs}
        onHoverPair={onHoverPair}
        zoomScale={zoomScale}
      />
      <PendingDot point={pendingPoint} zoomScale={zoomScale} />
      {selectMode && <SelectionRect dragCurrent={dragCurrent} dragStart={dragStart} />}
    </div>
  );
}
