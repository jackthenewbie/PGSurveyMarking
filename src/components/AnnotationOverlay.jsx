import { DotLayer } from "./DotLayer";
import { GroupSpacingHandle } from "./GroupSpacingHandle";
import { PathOverlay } from "./PathOverlay";
import { PendingDot } from "./PendingDot";
import { SelectionRect } from "./SelectionRect";

export function AnnotationOverlay({
  activeMarkerId,
  blockSize,
  dragCurrent,
  dragStart,
  groupSpacing,
  groupedMarkerIds,
  groups,
  groupingMode,
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
  onStartSpacingDrag,
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
        groupedMarkerIds={groupedMarkerIds}
        groupingMode={groupingMode}
        hoveredMarkerId={hoveredMarkerId}
        markers={markers}
        onActivateMarker={onActivateMarker}
        onHoverMarker={onHoverMarker}
        onResizeStart={onResizeStart}
        selectMode={selectMode}
        zoomScale={zoomScale}
      />
      {groupingMode &&
        groups.map((group) => (
          <GroupSpacingHandle
            key={group.id}
            blockSize={blockSize}
            groupLayout={group}
            groupSpacing={groupSpacing}
            onStartSpacingDrag={onStartSpacingDrag}
          />
        ))}
      <PendingDot blockSize={blockSize} point={pendingPoint} />
      {(selectMode || groupingMode) && (
        <SelectionRect
          background={groupingMode ? "rgba(255,64,64,0.08)" : undefined}
          borderColor={groupingMode ? "#ff5a5a" : undefined}
          dragCurrent={dragCurrent}
          dragStart={dragStart}
        />
      )}
    </div>
  );
}
