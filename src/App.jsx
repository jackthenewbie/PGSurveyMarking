import { useRef } from "react";
import { Toolbar } from "./components/Toolbar";
import { MapStage } from "./components/MapStage";
import { UploadScreen } from "./components/UploadScreen";
import { useLinkedMapState } from "./hooks/useLinkedMapState";

export default function LinkedMapMarkerSite() {
  const inputRef = useRef(null);
  const restoreInputRef = useRef(null);
  const state = useLinkedMapState();

  async function handleRestoreChange(event) {
    const file = event.target.files?.[0];

    try {
      if (!file) return;
      const text = await file.text();
      state.restoreCoordinates(text);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to restore coordinates.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#111", overflow: "hidden" }}>
      <input ref={inputRef} type="file" accept="image/*" onChange={state.handleFileChange} style={{ display: "none" }} />
      <input
        ref={restoreInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestoreChange}
        style={{ display: "none" }}
      />
      {!state.imageUrl ? (
        <UploadScreen onUpload={() => inputRef.current?.click()} />
      ) : (
        <>
          <Toolbar
            hasCoordinates={state.pairs.length > 0}
            hasPaths={state.paths.length > 0}
            selectMode={state.selectMode}
            onBackupCoordinates={state.downloadCoordinates}
            onRestoreCoordinates={() => restoreInputRef.current?.click()}
            onClearCoordinates={state.clearCoordinates}
            onClearCoordinatesAndPaths={state.clearCoordinatesAndPaths}
            onClearPaths={state.clearPaths}
            onNewImage={() => inputRef.current?.click()}
            onToggleSelectMode={state.toggleSelectMode}
          />
          <MapStage
            dragCurrent={state.dragCurrent}
            dragStart={state.dragStart}
            hoveredPairId={state.hoveredPairId}
            imageUrl={state.imageUrl}
            pairs={state.pairs}
            paths={state.paths}
            pendingPoint={state.pendingPoint}
            selectMode={state.selectMode}
            stageSize={state.stageSize}
            zoomOrigin={state.zoomOrigin}
            zoomScale={state.zoomScale}
            onHoverPair={state.setHoveredPairId}
            onMouseDown={state.handleMouseDown}
            onMouseMove={state.handleMouseMove}
            onMouseUp={state.handleMouseUp}
            onStageClick={state.handleStageClick}
            onWheel={state.handleStageWheel}
          />
        </>
      )}
    </div>
  );
}
