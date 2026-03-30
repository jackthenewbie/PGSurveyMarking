import { DOT_SIZE } from "../constants";

export function PendingDot({ point, zoomScale }) {
  if (!point) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${point.x}%`,
        top: `${point.y}%`,
        width: `${DOT_SIZE}px`,
        height: `${DOT_SIZE}px`,
        transform: `translate(-50%, -50%) scale(${1 / zoomScale})`,
        transformOrigin: "center",
        borderRadius: "9999px",
        border: "1px solid white",
        background: "orange",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
}
