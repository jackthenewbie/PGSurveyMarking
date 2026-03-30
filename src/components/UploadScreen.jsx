export function UploadScreen({ onUpload }) {
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
      <button
        type="button"
        onClick={onUpload}
        style={{
          padding: "10px 16px",
          border: "1px solid white",
          background: "#222",
          color: "white",
          cursor: "pointer",
        }}
      >
        Upload image
      </button>
    </div>
  );
}
