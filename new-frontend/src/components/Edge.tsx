'use client';

import { ConnectionData, NodeData, THEME_PRESETS, Vec2 } from '@/types';
import { useStore } from '@/store/useStore';

interface EdgeProps {
  connection: ConnectionData;
  nodes: NodeData[];
  isSelected?: boolean;
  onDelete?: (id: string) => void;
}

function getNodeCenter(node: NodeData): Vec2 {
  return {
    x: node.position.x + (node.width || 240) / 2,
    y: node.position.y + (node.height || 120) / 2,
  };
}

export function Edge({ connection, nodes, isSelected = false, onDelete }: EdgeProps) {
  const theme = useStore((state) => state.theme);
  const themeColors = THEME_PRESETS[theme];

  const fromNode = nodes.find((n) => n.id === connection.fromId);
  const toNode = nodes.find((n) => n.id === connection.toId);

  if (!fromNode || !toNode) return null;

  const from = getNodeCenter(fromNode);
  const to = getNodeCenter(toNode);

  const strokeWidth = isSelected ? 2.5 : 1.5;
  const stroke = isSelected ? themeColors.accentColor : (connection.color || themeColors.connectionColor);
  const strokeDasharray = connection.style === 'dashed' ? '5,5' : 'none';

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <g>
      {/* メインの線 */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'stroke' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* 矢印ヘッド */}
      <defs>
        <marker
          id={`arrow-${connection.id}`}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={stroke} />
        </marker>
      </defs>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={`url(#arrow-${connection.id})`}
        fill="none"
        strokeDasharray={strokeDasharray}
        style={{ pointerEvents: 'none' }}
      />

      {/* ラベル背景 */}
      {connection.label && (
        <rect
          x={midX - 25}
          y={midY - 10}
          width="50"
          height="20"
          fill="white"
          stroke={stroke}
          strokeWidth="0.5"
          rx="3"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* ラベルテキスト */}
      {connection.label && (
        <text
          x={midX}
          y={midY + 4}
          textAnchor="middle"
          fontSize="10"
          fill={stroke}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {connection.label}
        </text>
      )}

      {/* 削除ボタン（選択時） */}
      {isSelected && (
        <circle
          cx={midX}
          cy={midY}
          r="6"
          fill="white"
          stroke="#ef4444"
          strokeWidth="1.5"
          style={{ cursor: 'pointer' }}
          onClick={() => onDelete?.(connection.id)}
        />
      )}
    </g>
  );
}
