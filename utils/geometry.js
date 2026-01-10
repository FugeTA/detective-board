// ヘルパー関数：点と線分の距離
export const distanceToSegment = (p, v, w) => {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
};

export const isPointNearDrawing = (x, y, drawing, threshold) => {
  if (!drawing.points || drawing.points.length < 2) return false;
  return drawing.points.some((p, i) => {
    if (i === 0) return false;
    return distanceToSegment({x, y}, drawing.points[i-1], p) < threshold;
  });
};