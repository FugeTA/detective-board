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

// 線分同士の交差判定
const segmentsIntersect = (a, b, c, d) => {
  const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
  if (det === 0) return false;
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
  return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
};

// 線分と矩形の交差判定
export const lineIntersectsRect = (p1, p2, rect) => {
  const { x, y, width, height } = rect;
  const rLeft = x;
  const rRight = x + width;
  const rTop = y;
  const rBottom = y + height;

  // 1. 端点が矩形内にあるか
  if ((p1.x >= rLeft && p1.x <= rRight && p1.y >= rTop && p1.y <= rBottom) ||
      (p2.x >= rLeft && p2.x <= rRight && p2.y >= rTop && p2.y <= rBottom)) return true;

  // 2. 線分が矩形の辺と交差するか
  const sides = [
    [{x: rLeft, y: rTop}, {x: rRight, y: rTop}],       // Top
    [{x: rRight, y: rTop}, {x: rRight, y: rBottom}],   // Right
    [{x: rRight, y: rBottom}, {x: rLeft, y: rBottom}], // Bottom
    [{x: rLeft, y: rBottom}, {x: rLeft, y: rTop}]      // Left
  ];

  return sides.some(side => segmentsIntersect(p1, p2, side[0], side[1]));
};