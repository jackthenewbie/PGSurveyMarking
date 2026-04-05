export function PendingDot({ blockSize, point }) {
  if (!point) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${point.x}%`,
        top: `${point.y}%`,
        width: `${blockSize.width}%`,
        height: `${blockSize.height}%`,
        transform: "translate(-50%, -50%)",
        transformOrigin: "center",
        border: "1.5px dashed orange",
        background: "rgba(255,165,0,0.12)",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}
