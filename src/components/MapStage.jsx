import { DotLayer } from "./DotLayer";
import { PathOverlay } from "./PathOverlay";
import { PendingDot } from "./PendingDot";
import { SelectionRect } from "./SelectionRect";

export function MapStage({
  dragCurrent,
  dragStart,
  hoveredPairId,
  imageUrl,
  pairs,
  paths,
  pendingPoint,
  selectMode,
  stageSize,
  zoomOrigin,
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
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      >
        <div
          style={{
            position: "relative",
            width: `${stageSize.width}px`,
            height: `${stageSize.height}px`,
            overflow: "hidden",
          }}
        >
          <div
            onClick={onStageClick}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onWheel={onWheel}
            style={{
              position: "relative",
              width: `${stageSize.width}px`,
              height: `${stageSize.height}px`,
              lineHeight: 0,
              cursor: "crosshair",
              userSelect: "none",
              transform: `scale(${zoomScale})`,
              transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
            }}
          >
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "contain",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
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
        </div>
    </div>
  );
}
