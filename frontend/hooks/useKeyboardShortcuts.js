import { useHotkeys } from 'react-hotkeys-hook';

export const useKeyboardShortcuts = ({
  nodes,
  edges,
  drawings,
  editingId,
  setIsDrawingMode,
  selectedIds, setSelectedIds,
  pushHistory,
  setNodes,
  setEdges,
  setDrawings,
  undo,
  saveCase
}) => {
  const isEditing = editingId !== null;
  const options = { enabled: !isEditing };

  // Esc: 描画モード終了
  useHotkeys('escape', () => {
    setIsDrawingMode(false);
  }, options);

  // Delete / Backspace: 削除
  useHotkeys('delete, backspace', (e) => {
    if (selectedIds.size > 0) {
      e.preventDefault();
      pushHistory();
      setNodes(prev => prev.filter(n => !selectedIds.has(n.id)));
      setEdges(prev => prev.filter(edge => !selectedIds.has(edge.from) && !selectedIds.has(edge.to) && !selectedIds.has(edge.id)));
      setDrawings(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    }
  }, options, [selectedIds, pushHistory, setNodes, setEdges, setDrawings, setSelectedIds]);

  // Ctrl+Z: Undo
  useHotkeys('meta+z, ctrl+z', (e) => {
    e.preventDefault();
    undo();
  }, options, [undo]);

  // Ctrl+A: 全選択
  useHotkeys('meta+a, ctrl+a', (e) => {
    e.preventDefault();
    const allIds = new Set();
    nodes.forEach(n => allIds.add(n.id));
    edges.forEach(e => allIds.add(e.id));
    drawings.forEach(d => allIds.add(d.id));
    setSelectedIds(allIds);
  }, options, [nodes, edges, drawings, setSelectedIds]);

  // Ctrl+S: 保存 (編集中でも有効)
  useHotkeys('meta+s, ctrl+s', (e) => {
    e.preventDefault();
    saveCase();
  }, { enableOnFormTags: true }, [saveCase]);
};