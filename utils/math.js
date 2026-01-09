// src/utils/math.js

// ノードの中心からピンの位置を計算する関数
export const getPinLocation = (node) => {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const rad = (node.rotation || 0) * (Math.PI / 180);
  const pinDist = (node.height / 2) + 7; 
  return {
    x: cx + Math.sin(rad) * pinDist,
    y: cy - Math.cos(rad) * pinDist
  };
};

// IDからピンの位置を取得する関数
export const getPinLocationById = (nodes, id) => {
  const n = nodes.find(x => x.id === id);
  return n ? getPinLocation(n) : { x: 0, y: 0 };
};