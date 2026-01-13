'use client';

import { NodeData, THEME_PRESETS } from '@/types';
import { useStore } from '@/store/useStore';

interface NodeProps {
  node: NodeData;
  isSelected?: boolean;
  onResizeHandleMouseDown?: (e: React.MouseEvent, handle: string) => void;
  onRotateHandleMouseDown?: (e: React.MouseEvent) => void;
  onConnectStart?: (e: React.MouseEvent) => void;
}

const HANDLE_SIZE = 8;

export function Node({
  node,
  isSelected = false,
  onResizeHandleMouseDown,
  onRotateHandleMouseDown,
  onConnectStart,
}: NodeProps) {
  const theme = useStore((state) => state.theme);
  const themeColors = THEME_PRESETS[theme];
  const HANDLE_COLOR = themeColors.accentColor;

  const width = node.width || 240;
  const height = node.height || 120;
  const rotation = node.rotation || 0;

  // ハンドルの位置を回転を考慮して計算
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const centerX = width / 2;
  const centerY = height / 2;

  // 2D回転変換関数
  const rotatePoint = (x: number, y: number): [number, number] => {
    return [
      centerX + x * cos - y * sin,
      centerY + x * sin + y * cos,
    ];
  };

  // コーナーハンドルの相対位置（中心から）
  const [seX, seY] = rotatePoint(width / 2, height / 2);
  const [nwX, nwY] = rotatePoint(-width / 2, -height / 2);
  const [neX, neY] = rotatePoint(width / 2, -height / 2);
  const [swX, swY] = rotatePoint(-width / 2, height / 2);

  // 回転ハンドル（上部）
  const [rotateHandleX, rotateHandleY] = rotatePoint(0, -height / 2 - 24);

  // 接続ハンドル（右側）
  const [connectHandleX, connectHandleY] = rotatePoint(width / 2 + 12, 0);

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width,
        height,
        overflow: 'visible',
      }}
    >
      {/* メインのノード要素（回転は内側で適用） */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: '12px 14px',
          border: isSelected ? `2px solid ${themeColors.accentColor}` : themeColors.nodeBorder,
          borderRadius: 8,
          background: themeColors.nodeBg,
          boxShadow: themeColors.nodeShadow,
          color: themeColors.nodeText,
          cursor: 'grab',
          userSelect: 'none',
          transform: `rotate(${rotation}deg)`,
          transformOrigin: 'center',
          pointerEvents: 'auto',
          fontFamily: themeColors.fontMain,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: themeColors.nodeText,
          }}
        >
          {node.title}
        </div>
        {node.content ? (
          <div
            style={{
              fontSize: 14,
              color: themeColors.nodeText,
              lineHeight: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              opacity: 0.8,
            }}
          >
            {node.content}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: themeColors.nodeText, opacity: 0.5 }}>No content</div>
        )}
      </div>

      {/* コントロールハンドル（回転に追従） */}
      {isSelected && (
        <>
          {/* SE リサイズ */}
          <div
            onMouseDown={(e) => {
              console.log('🔵 SE handle mousedown at:', { x: e.clientX, y: e.clientY });
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'se');
            }}
            style={{
              position: 'absolute',
              left: seX - HANDLE_SIZE / 2,
              top: seY - HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: HANDLE_COLOR,
              border: '1px solid white',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
          {/* NW リサイズ */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'nw');
            }}
            style={{
              position: 'absolute',
              left: nwX - HANDLE_SIZE / 2,
              top: nwY - HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: HANDLE_COLOR,
              border: '1px solid white',
              borderRadius: '50%',
              cursor: 'nw-resize',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
          {/* NE リサイズ */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'ne');
            }}
            style={{
              position: 'absolute',
              left: neX - HANDLE_SIZE / 2,
              top: neY - HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: HANDLE_COLOR,
              border: '1px solid white',
              borderRadius: '50%',
              cursor: 'ne-resize',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
          {/* SW リサイズ */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'sw');
            }}
            style={{
              position: 'absolute',
              left: swX - HANDLE_SIZE / 2,
              top: swY - HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: HANDLE_COLOR,
              border: '1px solid white',
              borderRadius: '50%',
              cursor: 'sw-resize',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />

          {/* 回転ハンドル（上部） */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onRotateHandleMouseDown?.(e);
            }}
            style={{
              position: 'absolute',
              left: rotateHandleX - 6,
              top: rotateHandleY - 6,
              width: 12,
              height: 12,
              background: '#ef4444',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'grab',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />

          {/* 接続ハンドル（右側） */}
          <div
            onMouseDown={(e) => {
              console.log('🟢 Connect handle mousedown at:', { x: e.clientX, y: e.clientY });
              e.stopPropagation();
              onConnectStart?.(e);
            }}
            style={{
              position: 'absolute',
              left: connectHandleX - 5,
              top: connectHandleY - 5,
              width: 10,
              height: 10,
              background: '#10b981',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'crosshair',
              zIndex: 10,
              pointerEvents: 'auto',
            }}
          />
        </>
      )}
    </div>
  );
}
