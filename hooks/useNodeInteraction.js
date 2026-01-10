import { getPinLocation } from '../utils/math';
import { generateId } from '../utils/id';

export const useNodeInteraction = ({
  nodes, setNodes,
  edges, setEdges,
  drawings,
  isDrawingMode,
  isSpacePressed,
  selectedIds, setSelectedIds,
  editingId, setEditingId,
  setMenu,
  setDragInfo,
  connectionDraft, setConnectionDraft,
  pushHistory,
  pushSpecificHistory,
  snapshotRef,
  mouseDownData,
  setFullscreenImage
}) => {
  const nodeActions = {
    onMouseDown: (e, node) => {
      if (isSpacePressed || e.button === 1) return;
      if (isDrawingMode) return;
      e.stopPropagation();
      setMenu(null);
      if (e.shiftKey) {
        setSelectedIds(prev => { const next = new Set(prev); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; });
        return;
      }
      if (!selectedIds.has(node.id)) setSelectedIds(new Set([node.id]));
      if (editingId === node.id) return;

      snapshotRef.current = { nodes, edges, drawings };
      mouseDownData.current = { type: 'move', id: node.id, startX: e.clientX, startY: e.clientY, initialNode: { ...node } };
    },
    onContextMenu: (e, node) => {
      e.preventDefault(); e.stopPropagation(); 
      if (!selectedIds.has(node.id)) {
        setSelectedIds(new Set([node.id]));
      }
      setMenu({ 
        type: 'node', 
        targetId: node.id, 
        nodeType: node.type, 
        left: e.clientX, 
        top: e.clientY, 
        currentFontSize: node.fontSize || '16px',
        currentColor: node.color,
        currentTextColor: node.textColor
      });
    },
    onDoubleClick: (e, id) => { 
      e.stopPropagation(); 
      const node = nodes.find(n => n.id === id);
      if (node) {
        if (node.type === 'pin') return;
        if (node.type === 'photo' && node.imageSrc) {
          setFullscreenImage(node.imageSrc);
          return;
        }
      }
      snapshotRef.current = { nodes, edges, drawings }; setEditingId(id); 
    },
    onPinMouseDown: (e, id) => {
      if (isSpacePressed || e.button === 1) return;
      if (isDrawingMode) return;
      e.stopPropagation(); e.preventDefault(); setMenu(null);
      const node = nodes.find(n => n.id === id);
      const pinLoc = getPinLocation(node);
      setConnectionDraft({ sourceId: id, startX: pinLoc.x, startY: pinLoc.y, currX: pinLoc.x, currY: pinLoc.y });
    },
    onPinMouseUp: (e, id) => {
      if (isDrawingMode) return;
      e.stopPropagation();
      setMenu(null);
      if (connectionDraft && connectionDraft.sourceId !== id) { setEdges([...edges, { id: generateId('edge'), from: connectionDraft.sourceId, to: id }]); }
      setConnectionDraft(null);
    },
    onRotateMouseDown: (e, node) => {
      if (isSpacePressed || e.button === 1) return;
      if (isDrawingMode) return;
      e.stopPropagation(); e.preventDefault(); snapshotRef.current = { nodes, edges, drawings };
      setMenu(null);
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      setDragInfo({ type: 'rotate', id: node.id, centerX, centerY, initialNode: { ...node } });
    },
    onRotateReset: (e, id) => { e.stopPropagation(); pushHistory(); setNodes(prev => prev.map(n => n.id === id ? { ...n, rotation: 0 } : n)); },
    onResizeMouseDown: (e, node) => {
      if (isSpacePressed || e.button === 1) return;
      if (isDrawingMode) return;
      e.stopPropagation(); snapshotRef.current = { nodes, edges, drawings };
      setMenu(null);
      setDragInfo({ type: 'resize', id: node.id, startX: e.clientX, startY: e.clientY, initialNode: { ...node } });
    },
    onContentChange: (id, val) => setNodes(nodes.map(n => n.id === id ? { ...n, content: val } : n)),
    onBlur: () => {
      if (snapshotRef.current) { 
        const pastState = snapshotRef.current;
        pushSpecificHistory(pastState.nodes, pastState.edges, pastState.drawings);
        snapshotRef.current = null;
      }
      setEditingId(null);
    }
  };

  return { nodeActions };
};