import { clamp } from "./math";

export function getPercentPoint(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100,
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1) * 100,
  };
}

export function collectSelectedDots(pairs, bounds) {
  const selected = [];

  pairs.forEach((pair) => {
    pair.dots.forEach((dot) => {
      if (
        dot.x >= bounds.minX &&
        dot.x <= bounds.maxX &&
        dot.y >= bounds.minY &&
        dot.y <= bounds.maxY
      ) {
        selected.push({ id: dot.id, x: dot.x, y: dot.y });
      }
    });
  });

  return selected;
}
