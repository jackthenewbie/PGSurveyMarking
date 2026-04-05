export function SelectionRect({
  background = "rgba(0,255,0,0.07)",
  borderColor = "lime",
  dragCurrent,
  dragStart,
}) {
  if (!dragStart || !dragCurrent) return null;

  const rect = {
    left: Math.min(dragStart.x, dragCurrent.x),
    top: Math.min(dragStart.y, dragCurrent.y),
    width: Math.abs(dragCurrent.x - dragStart.x),
    height: Math.abs(dragCurrent.y - dragStart.y),
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${rect.left}%`,
        top: `${rect.top}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        border: `1.5px dashed ${borderColor}`,
        background,
        pointerEvents: "none",
        zIndex: 15,
      }}
    />
  );
}
