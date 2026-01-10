import { isPointNearDrawing } from '../utils/geometry';
import { generateId } from '../utils/id';
import { getRandomRotation } from '../utils/math';

export const useMenuInteraction = ({
  menu, setMenu,
  nodes, setNodes,
  edges, setEdges,
  drawings, setDrawings,
  selectedIds, setSelectedIds,
  setEditingId,
  view,
  pushHistory,
  fileInputRef,
  setPenColor,
  setDrawingTool,
  setIsDrawingMode,
  isDrawingMode,
  drawingTool
}) => {

  const handleBoardContextMenu = (e) => {
    e.preventDefault(); setEditingId(null);
    if (isDrawingMode) {
      setMenu({ type: 'drawing', left: e.clientX, top: e.clientY, currentTool: drawingTool });
      return;
    }

    const worldX = (e.clientX - view.x) / view.scale;
    const worldY = (e.clientY - view.y) / view.scale;
    const hitThreshold = 10 / view.scale;
    let hitDrawing = null;
    for (let i = drawings.length - 1; i >= 0; i--) {
      if (isPointNearDrawing(worldX, worldY, drawings[i], hitThreshold)) {
        hitDrawing = drawings[i];
        break;
      }
    }

    if (hitDrawing) {
      if (!selectedIds.has(hitDrawing.id)) {
        setSelectedIds(new Set([hitDrawing.id]));
      }
      setMenu({ type: 'node', targetId: hitDrawing.id, nodeType: 'drawing', left: e.clientX, top: e.clientY, currentColor: hitDrawing.color });
      return;
    }

    setSelectedIds(new Set());
    setMenu({ type: 'board', left: e.clientX, top: e.clientY, worldX: (e.clientX - view.x) / view.scale, worldY: (e.clientY - view.y) / view.scale });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !menu || menu.type !== 'node') return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        pushHistory();
        const ratio = img.naturalWidth / img.naturalHeight;
        setNodes(prev => prev.map(node => node.id === menu.targetId ? { ...node, imageSrc: base64, width: 220, height: (220 / ratio) + 50, aspectRatio: ratio } : node));
      };
      setMenu(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const menuAction = (action, payload) => {
    if (!menu) return;
    if (action === 'addNode') {
      pushHistory();
      const newId = generateId('node');
      let newNode;
      if (payload === 'frame') {
        newNode = { id: newId, x: menu.worldX, y: menu.worldY, width: 400, height: 300, type: 'frame', content: 'Group', imageSrc: null, rotation: 0, parentId: null, textColor: '#ffffff' };
      } else if (payload === 'pin') {
        newNode = { id: newId, x: menu.worldX - 15, y: menu.worldY - 15, width: 30, height: 30, type: 'pin', content: '', imageSrc: null, rotation: 0, parentId: null, color: '#d63031' };
      } else {
        newNode = { id: newId, x: menu.worldX, y: menu.worldY, width: 180, height: payload === 'photo' ? 220 : 150, type: payload, content: '', imageSrc: null, rotation: getRandomRotation(), parentId: null };
      }
      setNodes([...nodes, newNode]);
      if (menu.type === 'connection') { 
        setEdges([...edges, { id: generateId('edge'), from: menu.sourceId, to: newNode.id }]); 
      } else if (menu.type === 'edge') {
        const originalEdge = edges.find(e => e.id === menu.targetId);
        if (originalEdge) {
          const edge1 = { ...originalEdge, id: generateId('edge'), to: newNode.id };
          const edge2 = { ...originalEdge, id: generateId('edge'), from: newNode.id };
          setEdges(prev => [...prev.filter(e => e.id !== menu.targetId), edge1, edge2]);
        }
      }
      if (payload !== 'pin') setEditingId(newId);
      setSelectedIds(new Set([newId]));
    } 
    else if (action === 'delete') { 
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setNodes(nodes.filter(n => !targets.has(n.id))); setEdges(edges.filter(e => !targets.has(e.from) && !targets.has(e.to) && !targets.has(e.id)));
      setDrawings(drawings.filter(d => !targets.has(d.id)));
      setSelectedIds(new Set());
    }
    else if (action === 'edit') { setEditingId(menu.targetId); }
    else if (action === 'groupInFrame') {
      if (selectedIds.size < 1) { setMenu(null); return; }
      pushHistory();

      const newFrameId = generateId('frame');

      setNodes(prevNodes => {
        const nodesToGroup = prevNodes.filter(n => selectedIds.has(n.id));
        if (nodesToGroup.length < 1) {
            return prevNodes;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodesToGroup.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });

        const padding = 40;
        const frameX = minX - padding;
        const frameY = minY - padding;
        const frameWidth = (maxX - minX) + (padding * 2);
        const frameHeight = (maxY - minY) + (padding * 2);

        const newFrame = {
            id: newFrameId, x: frameX, y: frameY,
            width: frameWidth, height: frameHeight,
            type: 'frame', content: 'New Group',
            imageSrc: null, rotation: 0, parentId: null
        };

        const updatedNodes = prevNodes.map(node => {
            if (nodesToGroup.some(n => n.id === node.id)) {
                return { ...node, parentId: newFrameId };
            }
            return node;
        });

        return [newFrame, ...updatedNodes];
      });

      setSelectedIds(new Set([newFrameId]));
    }
    else if (action === 'changePhoto') { if (fileInputRef.current) fileInputRef.current.click(); return; }
    else if (action === 'changeColor') {
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setNodes(prev => prev.map(n => targets.has(n.id) ? { ...n, color: payload } : n));
      setDrawings(prev => prev.map(d => targets.has(d.id) ? { ...d, color: payload } : d));
      setMenu(prev => ({ ...prev, currentColor: payload }));
      return;
    }
    else if (action === 'changeTextColor') {
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setNodes(prev => prev.map(n => targets.has(n.id) ? { ...n, textColor: payload } : n));
      setMenu(prev => ({ ...prev, currentTextColor: payload }));
      return;
    }
    else if (action === 'changeFontSize') {
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setNodes(prev => prev.map(n => targets.has(n.id) ? { ...n, fontSize: payload } : n));
      setMenu(prev => ({ ...prev, currentFontSize: payload || '16px' }));
      return;
    }
    else if (action === 'changeEdgeColor') {
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setEdges(prev => prev.map(e => targets.has(e.id) ? { ...e, color: payload } : e));
      setMenu(prev => ({ ...prev, currentColor: payload }));
      return;
    }
    else if (action === 'changeEdgeStyle') {
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setEdges(prev => prev.map(e => targets.has(e.id) ? { ...e, style: payload } : e));
      return;
    }
    else if (action === 'changePenColor') {
      setPenColor(payload);
      setDrawingTool('pen'); 
    }
    else if (action === 'setDrawingTool') {
      setDrawingTool(payload);
    }
    else if (action === 'exitDrawingMode') {
      setIsDrawingMode(false);
    }
    setMenu(null);
  };

  return { handleBoardContextMenu, handleImageUpload, menuAction };
};