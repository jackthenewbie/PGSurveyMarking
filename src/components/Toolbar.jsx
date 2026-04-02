import { useState } from "react";

export function Toolbar({
  hasCoordinates,
  hasPaths,
  mode,
  selectMode,
  onBackupCoordinates,
  onRestoreCoordinates,
  onClearCoordinates,
  onClearCoordinatesAndPaths,
  onClearPaths,
  onChangeMode,
  onSelectImage,
  onStartSharing,
  onToggleSelectMode,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isScreenshotMode = mode === "screenshot";

  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 6,
      }}
    >
      <button
        type="button"
        aria-label={isOpen ? "Collapse toolbar" : "Expand toolbar"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        style={menuButtonStyle}
      >
        <span style={menuLineStyle} />
        <span style={menuLineStyle} />
        <span style={menuLineStyle} />
      </button>
      {isOpen && (
        <div style={panelStyle}>
          <div style={modeGroupStyle}>
            <button
              type="button"
              onClick={() => onChangeMode("screenshot")}
              style={isScreenshotMode ? activeModeButtonStyle : inactiveModeButtonStyle}
            >
              Screenshot
            </button>
            <button
              type="button"
              onClick={() => onChangeMode("stream")}
              style={!isScreenshotMode ? activeModeButtonStyle : inactiveModeButtonStyle}
            >
              Live stream
            </button>
          </div>
          <button
            type="button"
            onClick={isScreenshotMode ? onSelectImage : onStartSharing}
            style={buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")}
          >
            {isScreenshotMode ? "New image" : "Start sharing"}
          </button>
          <button
            type="button"
            onClick={onBackupCoordinates}
            style={buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")}
          >
            Backup coords
          </button>
          <button
            type="button"
            onClick={onRestoreCoordinates}
            style={buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")}
          >
            Restore coords
          </button>
          <button
            type="button"
            onClick={onToggleSelectMode}
            style={
              selectMode
                ? buttonStyle("1px solid lime", "rgba(0,255,0,0.15)", "lime")
                : buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")
            }
          >
            {selectMode ? "✔ Select to draw optimize path" : "⬚ Select to draw optimize path"}
          </button>
          {hasPaths && (
            <button
              type="button"
              onClick={onClearPaths}
              style={buttonStyle("1px solid #ff4444", "rgba(255,0,0,0.15)", "#ff4444")}
            >
              Clear paths
            </button>
          )}
          {hasCoordinates && (
            <button
              type="button"
              onClick={onClearCoordinates}
              style={buttonStyle("1px solid #ff8844", "rgba(255,136,0,0.15)", "#ff8844")}
            >
              Clear coords
            </button>
          )}
          {(hasCoordinates || hasPaths) && (
            <button
              type="button"
              onClick={onClearCoordinatesAndPaths}
              style={buttonStyle("1px solid #ff4444", "rgba(255,0,0,0.25)", "#ff4444")}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function buttonStyle(border, background, color) {
  return {
    width: "100%",
    minWidth: "160px",
    padding: "6px 10px",
    border,
    background,
    color,
    cursor: "pointer",
    textAlign: "left",
  };
}

const panelStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  padding: 8,
  minWidth: "176px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(10,10,10,0.92)",
};

const modeGroupStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  width: "100%",
};

const menuButtonStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 4,
  width: "42px",
  height: "42px",
  padding: "8px",
  border: "1px solid white",
  background: "rgba(0,0,0,0.7)",
  cursor: "pointer",
};

const menuLineStyle = {
  display: "block",
  width: "100%",
  height: "2px",
  background: "white",
};

const inactiveModeButtonStyle = {
  ...buttonStyle("1px solid rgba(255,255,255,0.35)", "rgba(0,0,0,0.7)", "white"),
  minWidth: 0,
  textAlign: "center",
};

const activeModeButtonStyle = {
  ...buttonStyle("1px solid #00e5ff", "rgba(0,229,255,0.12)", "#00e5ff"),
  minWidth: 0,
  textAlign: "center",
};
