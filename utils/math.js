// src/utils/math.js

// ノードの中心からピンの位置を計算する関数
export const getPinLocation = (node) => {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const rad = (node.rotation || 0) * (Math.PI / 180);
  
  // ピンノードの場合は中心を返す
  if (node.type === 'pin') return { x: cx, y: cy };

  // フレームの場合はピンの位置が内側（ヘッダー付近）にあるため調整
  const offset = node.type === 'frame' ? -15 : 7;
  const pinDist = (node.height / 2) + offset; 

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

export const getRandomRotation = () => (Math.random() * 20) - 10;