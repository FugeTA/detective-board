// src/components/DrawingLayer.js
import React from 'react';

// 点の配列からSVGパスのd属性文字列を生成するヘルパー関数
const createSvgPath = (points) => {
  if (!points || points.length === 0) return '';
  const firstPoint = points[0];
  const remainingPoints = points.slice(1);
  return `M ${firstPoint.x},${firstPoint.y} ` + remainingPoints.map(p => `L ${p.x},${p.y}`).join(' ');
};

const DrawingLayer = ({ drawings, currentDrawing, scale }) => {
  // 線の太さ。ズームしても見た目の太さが変わらないように調整
  const strokeWidth = 2.5 / scale;

  return (
    <svg
      className="drawing-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible', // SVGがはみ出しても表示されるようにする
      }}
    >
      <g>
        {/* 確定済みの線 */}
        {drawings.map((drawing) => (
          <React.Fragment key={drawing.id}>
            {/* 選択時のハイライト（背面に太い半透明の線を描画） */}
            {drawing.selected && (
              <path
                d={createSvgPath(drawing.points)}
                stroke="rgba(33, 150, 243, 0.5)"
                strokeWidth={strokeWidth * 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            <path
              d={createSvgPath(drawing.points)}
              stroke={drawing.color || "#ff3b30"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </React.Fragment>
        ))}

        {/* 現在描画中の線 */}
        {currentDrawing && (
          <path
            d={createSvgPath(currentDrawing.points)}
            stroke={currentDrawing.color || "#ff3b30"}
            strokeOpacity="0.7"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </g>
    </svg>
  );
};

export default DrawingLayer;