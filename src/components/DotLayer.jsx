import { DOT_SIZE, RESIZE_HANDLE_SIZE } from "../constants";

const HANDLE_POSITIONS = [
  { key: "nw", left: "0%", top: "0%", cursor: "nwse-resize" },
  { key: "n", left: "50%", top: "0%", cursor: "ns-resize" },
  { key: "ne", left: "100%", top: "0%", cursor: "nesw-resize" },
  { key: "e", left: "100%", top: "50%", cursor: "ew-resize" },
  { key: "se", left: "100%", top: "100%", cursor: "nwse-resize" },
  { key: "s", left: "50%", top: "100%", cursor: "ns-resize" },
  { key: "sw", left: "0%", top: "100%", cursor: "nesw-resize" },
  { key: "w", left: "0%", top: "50%", cursor: "ew-resize" },
];

export function DotLayer({
  activeMarkerId,
  blockSize,
  hoveredMarkerId,
  markers,
  onActivateMarker,
  onHoverMarker,
  onResizeStart,
  zoomScale,
}) {
  return markers.map((marker) => {
    const isHovered = hoveredMarkerId === marker.id;
    const isActive = activeMarkerId === marker.id;
    const accentColor = isHovered || isActive ? "lime" : "#00FFFF";

    return (
      <div key={marker.id}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`Marker ${marker.id} block`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onActivateMarker(marker.id);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            event.stopPropagation();
            onActivateMarker(marker.id);
          }}
          onMouseEnter={() => onHoverMarker(marker.id)}
          onMouseLeave={() => onHoverMarker((current) => (current === marker.id ? null : current))}
          style={{
            position: "absolute",
            left: `${marker.block.x}%`,
            top: `${marker.block.y}%`,
            width: `${blockSize.width}%`,
            height: `${blockSize.height}%`,
            transform: "translate(-50%, -50%)",
            border: `1.5px solid ${accentColor}`,
            background: isHovered || isActive ? "rgba(0,255,0,0.08)" : "rgba(0,229,255,0.08)",
            boxShadow:
              isHovered || isActive ? "0 0 0 1px rgba(0,255,0,0.55), 0 0 18px rgba(0,255,0,0.35)" : "none",
            zIndex: isActive ? 14 : 11,
            cursor: "pointer",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              color: accentColor,
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              textShadow:
                isHovered || isActive
                  ? "0 0 8px rgba(0,255,0,0.85)"
                  : "0 0 2px rgba(255,255,255,0.65)",
              pointerEvents: "none",
            }}
          >
            {marker.id}
          </span>
          {isActive &&
            HANDLE_POSITIONS.map((handle) => (
              <button
                key={handle.key}
                type="button"
                aria-label={`Resize marker ${marker.id} from ${handle.key}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onResizeStart(marker.id, handle.key);
                }}
                style={{
                  position: "absolute",
                  left: handle.left,
                  top: handle.top,
                  width: `${RESIZE_HANDLE_SIZE}px`,
                  height: `${RESIZE_HANDLE_SIZE}px`,
                  transform: `translate(-50%, -50%) scale(${1 / zoomScale})`,
                  transformOrigin: "center",
                  border: "1px solid white",
                  background: "#111",
                  boxShadow: "0 0 8px rgba(0,0,0,0.45)",
                  padding: 0,
                  cursor: handle.cursor,
                }}
              />
            ))}
        </div>
        <button
          type="button"
          aria-label={`Marker ${marker.id} dot`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onActivateMarker(marker.id);
          }}
          onMouseEnter={() => onHoverMarker(marker.id)}
          onMouseLeave={() => onHoverMarker((current) => (current === marker.id ? null : current))}
          style={{
            position: "absolute",
            left: `${marker.dot.x}%`,
            top: `${marker.dot.y}%`,
            padding: 0,
            margin: 0,
            width: 0,
            height: 0,
            border: "none",
            background: "transparent",
            zIndex: 12,
            cursor: "pointer",
            overflow: "visible",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: `${DOT_SIZE}px`,
              height: `${DOT_SIZE}px`,
              transform: `translate(-50%, -50%) scale(${1 / zoomScale})`,
              transformOrigin: "center",
              borderRadius: "9999px",
              border: "1px solid white",
              background: isHovered ? "lime" : "#00FFFF",
              transition: "box-shadow 0.15s ease, transform 0.15s ease",
              boxShadow: isHovered
                ? "0 0 0 4px rgba(0,255,0,0.4), 0 0 20px 18px rgba(0,255,0,0.35)"
                : "none",
            }}
          />
        </button>
      </div>
    );
  });
}
