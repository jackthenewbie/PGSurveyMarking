import { DOT_SIZE } from "../constants";

export function DotLayer({ hoveredPairId, pairs, onHoverPair, zoomScale }) {
  return pairs.map((pair) =>
    pair.dots.map((dot) => {
      const isHovered = hoveredPairId === pair.id;
      return (
        <button
          key={dot.id}
          type="button"
          aria-label={`Pair ${pair.id} marker`}
          onClick={(event) => event.stopPropagation()}
          onMouseEnter={() => onHoverPair(pair.id)}
          onMouseLeave={() => onHoverPair((current) => (current === pair.id ? null : current))}
          style={{
            position: "absolute",
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            padding: 0,
            margin: 0,
            width: 0,
            height: 0,
            border: "none",
            background: "transparent",
            zIndex: 10,
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
                ? "0 0 0 4px rgba(0,255,0,0.4), 0 0 20px 40px rgba(0,255,0,0.5)"
                : "none",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${DOT_SIZE / 2 + 6}px`,
              top: 0,
              transform: `translateY(-50%) scale(${1 / zoomScale})`,
              transformOrigin: "left center",
              color: isHovered ? "lime" : "#00FFFF",
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
              transition: "text-shadow 0.15s ease, color 0.15s ease",
              textShadow: isHovered
                ? "0 0 8px rgba(0,255,0,0.95), 0 0 18px rgba(0,255,0,0.9)"
                : "0 0 1px rgba(255,255,255,0.5)",
            }}
          >
            {pair.id}
          </span>
        </button>
      );
    })
  );
}
