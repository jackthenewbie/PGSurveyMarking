const EXACT_PATH_LIMIT = 12;
const TWO_OPT_PASSES = 8;
const EPSILON = 1e-9;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildDistanceMatrix(dots) {
  return dots.map((from, rowIndex) =>
    dots.map((to, columnIndex) =>
      rowIndex === columnIndex ? 0 : distance(from, to)
    )
  );
}

function exactShortestOpenPath(dots) {
  const count = dots.length;
  const distances = buildDistanceMatrix(dots);
  const stateCount = 1 << count;
  const best = Array.from({ length: stateCount }, () => Array(count).fill(Infinity));
  const previous = Array.from({ length: stateCount }, () => Array(count).fill(-1));

  for (let index = 0; index < count; index += 1) {
    best[1 << index][index] = 0;
  }

  for (let mask = 1; mask < stateCount; mask += 1) {
    for (let end = 0; end < count; end += 1) {
      if ((mask & (1 << end)) === 0 || !Number.isFinite(best[mask][end])) continue;

      for (let next = 0; next < count; next += 1) {
        if ((mask & (1 << next)) !== 0) continue;
        const nextMask = mask | (1 << next);
        const nextCost = best[mask][end] + distances[end][next];

        if (nextCost + EPSILON < best[nextMask][next]) {
          best[nextMask][next] = nextCost;
          previous[nextMask][next] = end;
        }
      }
    }
  }

  const finalMask = stateCount - 1;
  let endIndex = 0;

  for (let index = 1; index < count; index += 1) {
    if (best[finalMask][index] + EPSILON < best[finalMask][endIndex]) {
      endIndex = index;
    }
  }

  const order = [];
  let mask = finalMask;
  let current = endIndex;

  while (current !== -1) {
    order.push(current);
    const prior = previous[mask][current];
    mask ^= 1 << current;
    current = prior;
  }

  return order.reverse().map((index) => dots[index]);
}

function buildCheapestInsertionPath(dots) {
  let startIndex = 0;
  let endIndex = 1;
  let longestDistance = -1;

  for (let left = 0; left < dots.length - 1; left += 1) {
    for (let right = left + 1; right < dots.length; right += 1) {
      const currentDistance = distance(dots[left], dots[right]);
      if (currentDistance > longestDistance) {
        longestDistance = currentDistance;
        startIndex = left;
        endIndex = right;
      }
    }
  }

  const route = [dots[startIndex], dots[endIndex]];
  const remaining = dots.filter((_, index) => index !== startIndex && index !== endIndex);

  while (remaining.length > 0) {
    let bestPointIndex = 0;
    let bestInsertIndex = 0;
    let bestDelta = Infinity;

    for (let pointIndex = 0; pointIndex < remaining.length; pointIndex += 1) {
      const point = remaining[pointIndex];

      for (let insertIndex = 0; insertIndex <= route.length; insertIndex += 1) {
        let delta;

        if (insertIndex === 0) {
          delta = distance(point, route[0]);
        } else if (insertIndex === route.length) {
          delta = distance(route[route.length - 1], point);
        } else {
          delta =
            distance(route[insertIndex - 1], point) +
            distance(point, route[insertIndex]) -
            distance(route[insertIndex - 1], route[insertIndex]);
        }

        if (delta + EPSILON < bestDelta) {
          bestDelta = delta;
          bestPointIndex = pointIndex;
          bestInsertIndex = insertIndex;
        }
      }
    }

    route.splice(bestInsertIndex, 0, remaining.splice(bestPointIndex, 1)[0]);
  }

  return route;
}

function reverseRange(path, start, end) {
  while (start < end) {
    [path[start], path[end]] = [path[end], path[start]];
    start += 1;
    end -= 1;
  }
}

function improveOpenPathWithTwoOpt(dots) {
  const route = [...dots];
  if (route.length < 4) return route;

  for (let pass = 0; pass < TWO_OPT_PASSES; pass += 1) {
    let changed = false;

    for (let left = 0; left < route.length - 3; left += 1) {
      for (let right = left + 2; right < route.length - 1; right += 1) {
        const currentCost =
          distance(route[left], route[left + 1]) +
          distance(route[right], route[right + 1]);
        const swappedCost =
          distance(route[left], route[right]) +
          distance(route[left + 1], route[right + 1]);

        if (swappedCost + EPSILON < currentCost) {
          reverseRange(route, left + 1, right);
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  return route;
}

export function shortestOpenPath(dots) {
  if (dots.length < 2) return [...dots];
  if (dots.length <= EXACT_PATH_LIMIT) return exactShortestOpenPath(dots);
  return improveOpenPathWithTwoOpt(buildCheapestInsertionPath(dots));
}
