import { AnnotationOverlay } from "./AnnotationOverlay";
import { MediaSurface } from "./MediaSurface";

export function MapStage({
  activeMarkerId,
  blockSize,
  dragCurrent,
  dragStart,
  groupSpacing,
  groupedMarkerIds,
  groups,
  groupingMode,
  hoveredMarkerId,
  mediaSource,
  markers,
  paths,
  pendingPoint,
  selectMode,
  stageSize,
  zoomOrigin,
  zoomScale,
  onActivateMarker,
  onResizeStart,
  onStartSpacingDrag,
  onSurfaceReady,
  onHoverMarker,
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
            activeMarkerId={activeMarkerId}
            blockSize={blockSize}
            dragCurrent={dragCurrent}
            dragStart={dragStart}
            groupSpacing={groupSpacing}
            groupedMarkerIds={groupedMarkerIds}
            groups={groups}
            groupingMode={groupingMode}
            hoveredMarkerId={hoveredMarkerId}
            markers={markers}
            paths={paths}
            pendingPoint={pendingPoint}
            selectMode={selectMode}
            stageSize={stageSize}
            zoomScale={zoomScale}
            onActivateMarker={onActivateMarker}
            onHoverMarker={onHoverMarker}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onResizeStart={onResizeStart}
            onStartSpacingDrag={onStartSpacingDrag}
            onStageClick={onStageClick}
            onWheel={onWheel}
          />
        </div>
      </div>
    </div>
  );
}
