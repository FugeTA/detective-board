export const useEdgeInteraction = ({
  edges,
  isDrawingMode,
  selectedIds, setSelectedIds,
  setMenu,
  view
}) => {
  const edgeActions = {
    onMouseDown: (e, edgeId) => {
      if (isDrawingMode) return;
      e.stopPropagation();
      setMenu(null);
      if (!selectedIds.has(edgeId)) setSelectedIds(new Set([edgeId]));
    },
    onContextMenu: (e, edgeId) => {
      e.preventDefault(); e.stopPropagation();
      if (!selectedIds.has(edgeId)) {
        setSelectedIds(new Set([edgeId]));
      }
      const edge = edges.find(e => e.id === edgeId);
      setMenu({ 
        type: 'edge', 
        targetId: edgeId, 
        left: e.clientX, 
        top: e.clientY, 
        worldX: (e.clientX - view.x) / view.scale, 
        worldY: (e.clientY - view.y) / view.scale, 
        currentColor: edge ? edge.color : null 
      });
    }
  };

  return { edgeActions };
};