'use client';

import { NodeData } from '@/types';

interface ContextMenu {
  x: number;
  y: number;
  nodeId?: string;
}

interface ContextMenuProps {
  menu: ContextMenu | null;
  onClose: () => void;
  nodes: NodeData[];
  selectedIds: Set<string>;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function ContextMenu({
  menu,
  onClose,
  nodes,
  selectedIds,
  onDelete,
  onDuplicate,
}: ContextMenuProps) {
  if (!menu) return null;

  const node = menu.nodeId ? nodes.find((n) => n.id === menu.nodeId) : null;

  return (
    <>
      {/* 背景クリックで閉じる */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* メニュー */}
      <div
        style={{
          position: 'fixed',
          left: menu.x,
          top: menu.y,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: 160,
          overflow: 'hidden',
        }}
      >
        {node && (
          <div
            style={{
              padding: '4px 0',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 600,
              }}
            >
              {node.title}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            onDuplicate();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            fontSize: 14,
            color: '#374151',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = '#f3f4f6';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'none';
          }}
        >
          複製
        </button>

        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: 'none',
            textAlign: 'left',
            fontSize: 14,
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = '#fee2e2';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = 'none';
          }}
        >
          削除
        </button>
      </div>
    </>
  );
}
