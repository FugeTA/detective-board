'use client';

import { NodeData } from '@/types';
import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  nodes: NodeData[];
  setNodes: (nodes: NodeData[] | ((prev: NodeData[]) => NodeData[])) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  pushHistory: () => void;
  undo: () => void;
}

export function useKeyboardShortcuts({
  nodes,
  setNodes,
  selectedIds,
  setSelectedIds,
  pushHistory,
  undo,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete キーで選択ノードを削除
      if (e.key === 'Delete') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          pushHistory();
          setNodes((prev) => prev.filter((node) => !selectedIds.has(node.id)));
          setSelectedIds(new Set());
        }
      }

      // Ctrl+A (or Cmd+A on Mac) で全ノード選択
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allIds = new Set(nodes.map((n) => n.id));
        setSelectedIds(allIds);
      }

      // Ctrl+Z (or Cmd+Z on Mac) でアンドゥ
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, selectedIds, setNodes, setSelectedIds, pushHistory, undo]);
}
