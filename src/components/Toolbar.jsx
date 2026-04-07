import { useState } from "react";
import { KEYBOARD_SHORTCUTS } from "../hooks/linkedMapState/useKeyboardShortcuts";

export function Toolbar({
  focusTrackingMode,
  groupingMode,
  hasCoordinates,
  hasGroups,
  hasPaths,
  mode,
  selectMode,
  showModeNotifications,
  showMarkerLabels,
  onBackupCoordinates,
  onRestoreCoordinates,
  onClearCoordinates,
  onClearCoordinatesAndPaths,
  onClearGroups,
  onClearPaths,
  onChangeMode,
  onToggleFocusTrackingMode,
  onResetSavedSettings,
  onSelectImage,
  onStartSharing,
  onToggleGroupingMode,
  onToggleModeNotifications,
  onToggleMarkerLabels,
  onToggleSelectMode,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShortcutHelpPinned, setIsShortcutHelpPinned] = useState(false);
  const [isShortcutHelpHovered, setIsShortcutHelpHovered] = useState(false);
  const isScreenshotMode = mode === "screenshot";
  const isShortcutHelpOpen = isShortcutHelpPinned || isShortcutHelpHovered;

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
      <div style={toolbarControlsRowStyle}>
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
        <div
          style={shortcutHelpWrapperStyle}
          onMouseEnter={() => setIsShortcutHelpHovered(true)}
          onMouseLeave={() => setIsShortcutHelpHovered(false)}
        >
          <button
            type="button"
            aria-label="Show keyboard shortcuts"
            aria-expanded={isShortcutHelpOpen}
            onClick={() => setIsShortcutHelpPinned((current) => !current)}
            style={shortcutHelpButtonStyle}
          >
            ?
          </button>
          {isShortcutHelpOpen && (
            <div style={shortcutHelpPanelStyle}>
              <div style={shortcutHelpTitleStyle}>Shortcuts</div>
              {KEYBOARD_SHORTCUTS.map((shortcut) => (
                <div key={shortcut.key} style={shortcutRowStyle}>
                  <span style={shortcutKeyStyle}>{shortcut.key}</span>
                  <span style={shortcutDescriptionStyle}>{shortcut.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
            onClick={(event) => onToggleFocusTrackingMode(event)}
            style={
              focusTrackingMode
                ? buttonStyle("1px solid #ffd54a", "rgba(255,213,74,0.16)", "#ffd54a")
                : buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")
            }
          >
            {focusTrackingMode ? "✔ Focus tracking" : "⬚ Focus tracking"}
          </button>
          <button
            type="button"
            onClick={onResetSavedSettings}
            style={buttonStyle("1px solid #ff3355", "rgba(255,32,64,0.2)", "#ff9aaa")}
          >
            Reset saved settings
          </button>
          <button
            type="button"
            onClick={(event) => onToggleSelectMode(event)}
            style={
              selectMode
                ? buttonStyle("1px solid lime", "rgba(0,255,0,0.15)", "lime")
                : buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")
            }
          >
            {selectMode ? "✔ Selecting to draw optimize path" : "⬚ Select to draw optimize path"}
          </button>
          <button
            type="button"
            onClick={(event) => onToggleGroupingMode(event)}
            style={
              groupingMode
                ? buttonStyle("1px solid #ff6666", "rgba(255,64,64,0.18)", "#ff8d8d")
                : buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")
            }
          >
            {groupingMode ? "✔ Grouping block" : "⬚ Group block"}
          </button>
          <button
            type="button"
            onClick={onToggleMarkerLabels}
            style={
              showMarkerLabels
                ? buttonStyle("1px solid #00e5ff", "rgba(0,229,255,0.12)", "#00e5ff")
                : buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")
            }
          >
            {showMarkerLabels ? "✔ Show marker labels" : "⬚ Show marker labels"}
          </button>
          <button
            type="button"
            onClick={onToggleModeNotifications}
            style={
              showModeNotifications
                ? buttonStyle("1px solid #9bf06b", "rgba(155,240,107,0.14)", "#9bf06b")
                : buttonStyle("1px solid white", "rgba(0,0,0,0.7)", "white")
            }
          >
            {showModeNotifications ? "✔ Show mode notifications" : "⬚ Show mode notifications"}
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
          {hasGroups && (
            <button
              type="button"
              onClick={onClearGroups}
              style={buttonStyle("1px solid #ff6666", "rgba(255,64,64,0.18)", "#ff8d8d")}
            >
              Ungroup all
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

const toolbarControlsRowStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
};

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

const shortcutHelpWrapperStyle = {
  position: "relative",
};

const shortcutHelpButtonStyle = {
  width: "42px",
  height: "42px",
  padding: 0,
  border: "1px solid rgba(255,255,255,0.85)",
  background: "rgba(0,0,0,0.7)",
  color: "white",
  cursor: "pointer",
  fontSize: "20px",
  lineHeight: 1,
};

const shortcutHelpPanelStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: "280px",
  padding: 10,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(10,10,10,0.95)",
  color: "white",
};

const shortcutHelpTitleStyle = {
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#00e5ff",
};

const shortcutRowStyle = {
  display: "grid",
  gridTemplateColumns: "42px 1fr",
  gap: 8,
  alignItems: "start",
};

const shortcutKeyStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "24px",
  padding: "2px 6px",
  border: "1px solid rgba(255,255,255,0.35)",
  background: "rgba(255,255,255,0.06)",
  fontSize: "12px",
};

const shortcutDescriptionStyle = {
  fontSize: "12px",
  lineHeight: 1.35,
  color: "rgba(255,255,255,0.88)",
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
