import { AnnotationOverlay } from "./AnnotationOverlay";
import { MediaSurface } from "./MediaSurface";

export function MapStage({
  dragCurrent,
  dragStart,
  hoveredPairId,
  mediaSource,
  pairs,
  paths,
  pendingPoint,
  selectMode,
  stageSize,
  zoomOrigin,
  zoomScale,
  onSurfaceReady,
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
          style={{
            position: "relative",
            width: `${stageSize.width}px`,
            height: `${stageSize.height}px`,
            lineHeight: 0,
            transform: `scale(${zoomScale})`,
            transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
          }}
        >
          <MediaSurface media={mediaSource} onSurfaceReady={onSurfaceReady} />
          <AnnotationOverlay
            dragCurrent={dragCurrent}
            dragStart={dragStart}
            hoveredPairId={hoveredPairId}
            pairs={pairs}
            paths={paths}
            pendingPoint={pendingPoint}
            selectMode={selectMode}
            stageSize={stageSize}
            zoomScale={zoomScale}
            onHoverPair={onHoverPair}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onStageClick={onStageClick}
            onWheel={onWheel}
          />
        </div>
      </div>
    </div>
  );
}
