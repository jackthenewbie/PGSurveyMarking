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

  async function handleStartSharing() {
    try {
      await state.startScreenShare();
    } catch (error) {
      if (error instanceof DOMException && ["AbortError", "NotAllowedError"].includes(error.name)) {
        return;
      }
      window.alert(error instanceof Error ? error.message : "Failed to start screen sharing.");
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
      {!state.hasSource ? (
        <UploadScreen
          mode={state.mode}
          onChangeMode={state.changeMode}
          onSelectImage={() => inputRef.current?.click()}
          onStartSharing={handleStartSharing}
        />
      ) : (
        <>
          <Toolbar
            hasCoordinates={state.markers.length > 0}
            hasPaths={state.paths.length > 0}
            mode={state.mode}
            selectMode={state.selectMode}
            onBackupCoordinates={state.downloadCoordinates}
            onRestoreCoordinates={() => restoreInputRef.current?.click()}
            onClearCoordinates={state.clearCoordinates}
            onClearCoordinatesAndPaths={state.clearCoordinatesAndPaths}
            onClearPaths={state.clearPaths}
            onChangeMode={state.changeMode}
            onSelectImage={() => inputRef.current?.click()}
            onStartSharing={handleStartSharing}
            onToggleSelectMode={state.toggleSelectMode}
          />
          <MapStage
            activeMarkerId={state.activeMarkerId}
            blockSize={state.blockSize}
            dragCurrent={state.dragCurrent}
            dragStart={state.dragStart}
            hoveredMarkerId={state.hoveredMarkerId}
            mediaSource={state.mediaSource}
            markers={state.markers}
            paths={state.paths}
            pendingPoint={state.pendingPoint}
            selectMode={state.selectMode}
            stageSize={state.stageSize}
            zoomOrigin={state.zoomOrigin}
            zoomScale={state.zoomScale}
            onActivateMarker={state.setActiveMarkerId}
            onResizeStart={state.handleResizeStart}
            onSurfaceReady={state.updateSurfaceSize}
            onHoverMarker={state.setHoveredMarkerId}
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
