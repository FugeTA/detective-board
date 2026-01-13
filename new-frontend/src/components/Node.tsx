'use client';

import { NodeData, THEME_PRESETS } from '@/types';
import { useStore } from '@/store/useStore';
import styles from './Node.module.css';

interface NodeProps {
  node: NodeData;
  isSelected?: boolean;
  onResizeHandleMouseDown?: (e: React.MouseEvent, handle: string) => void;
  onRotateHandleMouseDown?: (e: React.MouseEvent) => void;
  onRotateReset?: () => void;
  onConnectStart?: (e: React.MouseEvent) => void;
}

const HANDLE_SIZE = 8;
const PIN_SIZE = 24;
export const PIN_OVERLAP = 0; // ピンをノード内に少し重ねる量

export function Node({
  node,
  isSelected = false,
  onResizeHandleMouseDown,
  onRotateHandleMouseDown,
  onRotateReset,
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

  // 回転ハンドル（右上外側、さらに外へ）
  const [rotateHandleX, rotateHandleY] = rotatePoint(width / 2 + 24, -height / 2 - 16);

  // 接続ピン（上中央、ノードに重ねる）
  const [connectHandleX, connectHandleY] = rotatePoint(0, -height / 2 + PIN_OVERLAP);

  return (
    <div
      className={styles.container}
      style={{
        left: node.position.x,
        top: node.position.y,
        width,
        height,
        ['--node-bg' as any]: themeColors.nodeBg,
        ['--node-text' as any]: themeColors.nodeText,
        ['--node-border' as any]: themeColors.nodeBorder,
        ['--node-shadow' as any]: themeColors.nodeShadow,
        ['--pin-color' as any]: themeColors.pinColor,
        ['--pin-border' as any]: themeColors.pinBorder,
        ['--accent-color' as any]: themeColors.accentColor,
        ['--font-main' as any]: themeColors.fontMain,
      }}
    >
      {/* メインのノード要素（回転は内側で適用） */}
      <div
        className={`${styles.body} ${isSelected ? styles.bodySelected : ''}`}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className={styles.title}>{node.title}</div>
        {node.content ? (
          <div className={styles.content}>{node.content}</div>
        ) : (
          <div className={styles.contentEmpty}>No content</div>
        )}
      </div>

      {/* 回転に追従するハンドル */}
      {isSelected && (
        <>
          {/* SE リサイズ */}
          <div
            className={`${styles.handle} ${styles.se}`}
            onMouseDown={(e) => {
              console.log('🔵 SE handle mousedown at:', { x: e.clientX, y: e.clientY });
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'se');
            }}
            style={{
              left: seX - HANDLE_SIZE / 2,
              top: seY - HANDLE_SIZE / 2,
              background: HANDLE_COLOR,
            }}
          />
          {/* NW リサイズ */}
          <div
            className={`${styles.handle} ${styles.nw}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'nw');
            }}
            style={{
              left: nwX - HANDLE_SIZE / 2,
              top: nwY - HANDLE_SIZE / 2,
              background: HANDLE_COLOR,
            }}
          />
          {/* NE リサイズ */}
          <div
            className={`${styles.handle} ${styles.ne}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'ne');
            }}
            style={{
              left: neX - HANDLE_SIZE / 2,
              top: neY - HANDLE_SIZE / 2,
              background: HANDLE_COLOR,
            }}
          />
          {/* SW リサイズ */}
          <div
            className={`${styles.handle} ${styles.sw}`}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeHandleMouseDown?.(e, 'sw');
            }}
            style={{
              left: swX - HANDLE_SIZE / 2,
              top: swY - HANDLE_SIZE / 2,
              background: HANDLE_COLOR,
            }}
          />

          {/* 回転ハンドル（右上外側） */}
          <div
            className={styles.rotateHandle}
            onMouseDown={(e) => {
              e.stopPropagation();
              onRotateHandleMouseDown?.(e);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onRotateReset?.();
            }}
            style={{
              left: rotateHandleX - 12,
              top: rotateHandleY - 12,
            }}
          >
            <span style={{ fontSize: 12, color: '#444', lineHeight: 1 }}>⟳</span>
          </div>

        </>
      )}

      {/* 接続ハンドル（常時表示・回転追従） */}
      <div
        className={styles.connectHandle}
        onMouseDown={(e) => {
          console.log('🟢 Connect handle mousedown at:', { x: e.clientX, y: e.clientY });
          e.stopPropagation();
          onConnectStart?.(e);
        }}
        style={{
          left: connectHandleX - PIN_SIZE / 2,
          top: connectHandleY - PIN_SIZE / 2,
          width: PIN_SIZE,
          height: PIN_SIZE,
        }}
      />
    </div>
  );
}
