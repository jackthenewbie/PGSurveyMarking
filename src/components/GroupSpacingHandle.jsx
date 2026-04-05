import { useState } from "react";
import { getGroupSpacingPercent } from "../utils/groupSpacing";

export function GroupSpacingHandle({
  blockSize,
  groupLayout,
  groupSpacing,
  stageSize,
  onStartSpacingDrag,
}) {
  const [hoveredHandleKey, setHoveredHandleKey] = useState(null);

  if (!groupLayout || groupLayout.orderedIds.length < 2) return null;

  const slots = groupLayout.slots ?? [{ column: 0, row: 0 }];
  const occupiedSlots = new Map(
    slots.map((slot, index) => [groupLayout.orderedIds[index], slot])
  );
  const horizontalSpacing = getGroupSpacingPercent(groupSpacing, stageSize, "x");
  const verticalSpacing = getGroupSpacingPercent(groupSpacing, stageSize, "y");
  const handles = [];

  groupLayout.orderedIds.forEach((markerId) => {
    const slot = occupiedSlots.get(markerId);
    if (!slot) return;

    const rightNeighbor = groupLayout.orderedIds.find((candidateId) => {
      const candidateSlot = occupiedSlots.get(candidateId);
      return candidateSlot?.column === slot.column + 1 && candidateSlot?.row === slot.row;
    });

    if (rightNeighbor) {
      handles.push({
        key: `x-${markerId}-${rightNeighbor}`,
        axis: "x",
        left: groupLayout.anchor.x + slot.column * (blockSize.width + horizontalSpacing) + (blockSize.width + horizontalSpacing) / 2,
        top: groupLayout.anchor.y + slot.row * (blockSize.height + verticalSpacing),
      });
    }

    const lowerNeighbor = groupLayout.orderedIds.find((candidateId) => {
      const candidateSlot = occupiedSlots.get(candidateId);
      return candidateSlot?.column === slot.column && candidateSlot?.row === slot.row + 1;
    });

    if (lowerNeighbor) {
      handles.push({
        key: `y-${markerId}-${lowerNeighbor}`,
        axis: "y",
        left: groupLayout.anchor.x + slot.column * (blockSize.width + horizontalSpacing),
        top: groupLayout.anchor.y + slot.row * (blockSize.height + verticalSpacing) + (blockSize.height + verticalSpacing) / 2,
      });
    }
  });

  return handles.map((handle) => {
    const isHorizontalGap = handle.axis === "x";

    return (
      <button
        key={handle.key}
        type="button"
        aria-label="Adjust grouped block spacing"
        onPointerEnter={() => setHoveredHandleKey(handle.key)}
        onPointerLeave={() => setHoveredHandleKey((current) => (current === handle.key ? null : current))}
        onFocus={() => setHoveredHandleKey(handle.key)}
        onBlur={() => setHoveredHandleKey((current) => (current === handle.key ? null : current))}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onStartSpacingDrag(handle.axis, {
            clientX: event.clientX,
            clientY: event.clientY,
          });
        }}
        style={{
          position: "absolute",
          left: `${handle.left}%`,
          top: `${handle.top}%`,
          width: isHorizontalGap ? "24px" : `calc(${blockSize.width}% + 16px)`,
          height: isHorizontalGap ? `calc(${blockSize.height}% + 16px)` : "24px",
          transform: "translate(-50%, -50%)",
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          cursor: isHorizontalGap ? "ew-resize" : "ns-resize",
          zIndex: 25,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: isHorizontalGap ? "6px" : `${blockSize.width}%`,
            height: isHorizontalGap ? `${blockSize.height}%` : "6px",
            transform: "translate(-50%, -50%)",
            border: "1px solid rgba(255,160,160,0.9)",
            background: "rgba(255,50,50,0.7)",
            boxShadow: "0 0 14px rgba(255,60,60,0.55)",
            opacity: hoveredHandleKey === handle.key ? 0.82 : 0,
            transition: "opacity 0.12s ease",
            pointerEvents: "none",
          }}
        />
      </button>
    );
  });
}
