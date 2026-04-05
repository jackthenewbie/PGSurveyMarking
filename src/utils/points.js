import { clamp } from "./math";

export function getPercentPoint(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100,
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1) * 100,
  };
}

export function collectSelectedDots(markers, bounds) {
  const selected = [];

  markers.forEach((marker) => {
    if (
      marker.dot.x >= bounds.minX &&
      marker.dot.x <= bounds.maxX &&
      marker.dot.y >= bounds.minY &&
      marker.dot.y <= bounds.maxY
    ) {
      selected.push({ id: marker.id, x: marker.dot.x, y: marker.dot.y });
    }
  });

  return selected;
}

export function collectSelectedBlocks(markers, bounds) {
  return markers
    .filter(
      (marker) =>
        marker.block.x >= bounds.minX &&
        marker.block.x <= bounds.maxX &&
        marker.block.y >= bounds.minY &&
        marker.block.y <= bounds.maxY
    )
    .map((marker) => marker.id);
}
