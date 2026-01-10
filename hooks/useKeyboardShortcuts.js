import { useEffect } from 'react';

export const useKeyboardShortcuts = ({
  editingId,
  setIsDrawingMode,
  selectedIds, setSelectedIds,
  pushHistory,
  setNodes,
  setEdges,
  setDrawings,
  undo
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId !== null) return;
      // Escキーで描画モードをオフ
      if (e.key === 'Escape') {
        setIsDrawingMode(false);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault(); pushHistory();
          setNodes(prev => prev.filter(n => !selectedIds.has(n.id)));
          setEdges(prev => prev.filter(edge => !selectedIds.has(edge.from) && !selectedIds.has(edge.to) && !selectedIds.has(edge.id)));
          setDrawings(prev => prev.filter(d => !selectedIds.has(d.id)));
          setSelectedIds(new Set());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editingId, undo, pushHistory, setIsDrawingMode, setNodes, setEdges, setDrawings, setSelectedIds]);
};