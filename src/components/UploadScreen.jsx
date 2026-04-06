export function UploadScreen({ mode, onChangeMode, onSelectImage, onStartSharing }) {
  const isScreenshotMode = mode === "screenshot";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(460px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          padding: "24px",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(8,8,8,0.92)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <strong style={{ fontSize: "20px", fontWeight: 700 }}>
            Choose a media source
          </strong>
          <span style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
            Choose the Project Gorgon game tab for streaming, or upload a screenshot instead.
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => onChangeMode("screenshot")}
            style={isScreenshotMode ? activeModeButtonStyle : inactiveModeButtonStyle}
          >
            Screenshot mode
          </button>
          <button
            type="button"
            onClick={() => onChangeMode("stream")}
            style={!isScreenshotMode ? activeModeButtonStyle : inactiveModeButtonStyle}
          >
            Live stream mode
          </button>
        </div>
        <div style={flowIndicatorStyle} aria-hidden="true">
          <span style={flowArrowStyle}>↓</span>
        </div>
        <button
          type="button"
          onClick={isScreenshotMode ? onSelectImage : onStartSharing}
          style={primaryButtonStyle}
        >
          {isScreenshotMode ? "Upload image" : "Start sharing"}
        </button>
        {!isScreenshotMode && (
          <span style={{ color: "rgba(255,255,255,0.62)", fontSize: "14px", lineHeight: 1.5 }}>
            Press F11 to fullscreen the tab for the best experience.
          </span>
        )}
      </div>
    </div>
  );
}

const flowIndicatorStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginTop: "-6px",
  marginBottom: "-6px",
};

const flowArrowStyle = {
  fontSize: "20px",
  lineHeight: 1,
  color: "#00e5ff",
};

const inactiveModeButtonStyle = {
  padding: "12px 14px",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  cursor: "pointer",
  transition: "border-color 140ms ease, background-color 140ms ease, color 140ms ease",
};

const activeModeButtonStyle = {
  ...inactiveModeButtonStyle,
  border: "1px solid #00e5ff",
  background: "rgba(0,229,255,0.12)",
  color: "#00e5ff",
  boxShadow: "inset 0 -2px 0 rgba(0,229,255,0.45)",
};

const primaryButtonStyle = {
  padding: "14px 16px",
  border: "1px solid white",
  background: "#222",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
};
