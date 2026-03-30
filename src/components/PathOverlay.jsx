import { PATH_COLORS } from "../constants";

export function PathOverlay({ paths, stageSize }) {
  return (
    <svg
      viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: `${stageSize.width}px`,
        height: `${stageSize.height}px`,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {paths.map((path, index) => {
        const color = PATH_COLORS[index % PATH_COLORS.length];
        const d = path.dots
          .map((point, pointIndex) => {
            const x = (point.x / 100) * stageSize.width;
            const y = (point.y / 100) * stageSize.height;
            return `${pointIndex === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        return (
          <path
            key={path.id}
            d={d}
            stroke={color}
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="6 3"
            opacity="1"
          />
        );
      })}
    </svg>
  );
}
