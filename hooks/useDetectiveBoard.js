import { useState, useRef, useEffect } from 'react';
import { getPinLocation } from '../utils/math';
import { isPointNearDrawing } from '../utils/geometry';
import { useBoardState } from './useBoardState';
import { useCaseManagement } from './useCaseManagement';
import { useDrawingTools } from './useDrawingTools';
import { useBoardInteraction } from './useBoardInteraction';

export const useDetectiveBoard = () => {
  // --- State ---
  const [activeSidebar, setActiveSidebar] = useState(null);
  const isNotebookOpen = activeSidebar === 'notebook';
  const isCaseManagerOpen = activeSidebar === 'case';

  // モジュール化されたフックを使用
  const { nodes, setNodes, edges, setEdges, keywords, setKeywords, drawings, setDrawings, view, setView, history, pushHistory, pushSpecificHistory, undo, loadData } = useBoardState();
  const { currentCaseId, caseList, saveStatus, openCase: baseOpenCase, createCase, deleteCase, renameCase } = useCaseManagement({ nodes, edges, keywords, drawings, view, loadData });
  const { isDrawingMode, setIsDrawingMode, currentDrawing, setCurrentDrawing, penColor, setPenColor, drawingTool, setDrawingTool, isErasing, setIsErasing, toggleDrawingMode, clearDrawings, eraseAt } = useDrawingTools(pushHistory, setDrawings, view);

  // UI操作系
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [connectionDraft, setConnectionDraft] = useState(null);
  const [menu, setMenu] = useState(null); 
  
  const fileInputRef = useRef(null);

  // ボード操作ロジックのフック
  const { 
    isPanning, dragInfo, selectionBox, isSpacePressed,
    handleWheel, handleBoardMouseDown, handleMouseMove, handleMouseUp,
    setDragInfo, snapshotRef, mouseDownData 
  } = useBoardInteraction({
    view, setView,
    nodes, setNodes,
    edges, setEdges,
    drawings, setDrawings,
    selectedIds, setSelectedIds,
    setEditingId,
    setMenu,
    connectionDraft, setConnectionDraft,
    isDrawingMode,
    drawingTool,
    penColor,
    currentDrawing, setCurrentDrawing,
    isErasing, setIsErasing,
    pushHistory,
    pushSpecificHistory,
    eraseAt
  });

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
          setEdges(prev => prev.filter(edge => !selectedIds.has(edge.from) && !selectedIds.has(edge.to)));
          setDrawings(prev => prev.filter(d => !selectedIds.has(d.id)));
          setSelectedIds(new Set());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editingId, undo, pushHistory]);

    useEffect(() => {
    const handlePaste = (event) => {
      if (editingId !== null) return;
      const items = event.clipboardData.items;
      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
      if (!imageItem) return;

      event.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;

      pushHistory();
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          const newWidth = 220;
          const newHeight = (newWidth / ratio) + 50;
          
          const centerX = (window.innerWidth / 2 - view.x) / view.scale;
          const centerY = (window.innerHeight / 2 - view.y) / view.scale;

          const newId = Date.now();
          const newNode = {
            id: newId,
            x: centerX - newWidth / 2,
            y: centerY - newHeight / 2,
            width: newWidth,
            height: newHeight,
            type: 'photo',
            content: '',
            imageSrc: base64,
            rotation: (Math.random() * 10) - 5,
            aspectRatio: ratio,
            parentId: null,
          };
          setNodes(prev => [...prev, newNode]);
          setSelectedIds(new Set([newId]));
        };
      };
      reader.readAsDataURL(file);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [view.x, view.y, view.scale, editingId, pushHistory]);

  // --- Case Actions ---
  const openCase = async (id) => {
    await baseOpenCase(id);
    setActiveSidebar(null);
  };

  const caseActions = {
    openCase, createCase, deleteCase, renameCase,
    toggleOpen: () => setActiveSidebar(prev => prev === 'case' ? null : 'case')
  };

  // --- Notebook Actions ---
  const notebookActions = {
    addKeyword: (text) => setKeywords(prev => [...prev, { id: Date.now(), text, active: true }]),
    deleteKeyword: (id) => setKeywords(prev => prev.filter(k => k.id !== id)),
    toggleKeyword: (id) => setKeywords(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k)),
    toggleOpen: () => setActiveSidebar(prev => prev === 'notebook' ? null : 'notebook')
  };
  
  // ★描画アクション
  const drawingActions = {
    toggleDrawingMode,
    clearDrawings
  };

  const handleBoardContextMenu = (e) => {
    e.preventDefault(); setEditingId(null);
    if (isDrawingMode) {
      setMenu({ type: 'drawing', left: e.clientX, top: e.clientY, currentTool: drawingTool });
      return;
    }

    // 線の右クリック判定
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
      setMenu({ type: 'node', targetId: hitDrawing.id, nodeType: 'drawing', left: e.clientX, top: e.clientY });
      return;
    }

    setSelectedIds(new Set());
    setMenu({ type: 'board', left: e.clientX, top: e.clientY, worldX: (e.clientX - view.x) / view.scale, worldY: (e.clientY - view.y) / view.scale });
  };

  const nodeActions = {
    onMouseDown: (e, node) => {
      if (isSpacePressed || e.button === 1) return; // パン移動のためにバブリングさせる
      if (isDrawingMode) return;
      e.stopPropagation();
      setMenu(null);
      if (e.shiftKey) {
        setSelectedIds(prev => { const next = new Set(prev); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; });
        return;
      }
      if (!selectedIds.has(node.id)) setSelectedIds(new Set([node.id]));
      if (editingId === node.id) return;

      // ドラッグ準備（まだカーソルは変えない）
      snapshotRef.current = { nodes, edges, drawings };
      mouseDownData.current = { type: 'move', id: node.id, startX: e.clientX, startY: e.clientY, initialNode: { ...node } };
    },
    onContextMenu: (e, node) => {
      e.preventDefault(); e.stopPropagation(); 
      if (!selectedIds.has(node.id)) {
        setSelectedIds(new Set([node.id]));
      }
      setMenu({ type: 'node', targetId: node.id, nodeType: node.type, left: e.clientX, top: e.clientY });
    },
    onDoubleClick: (e, id) => { e.stopPropagation(); snapshotRef.current = { nodes, edges, drawings }; setEditingId(id); },
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
      if (connectionDraft && connectionDraft.sourceId !== id) { setEdges([...edges, { from: connectionDraft.sourceId, to: id }]); }
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
      const newId = Date.now();
      let newNode;
      if (payload === 'frame') {
        newNode = { id: newId, x: menu.worldX, y: menu.worldY, width: 400, height: 300, type: 'frame', content: 'Group', imageSrc: null, rotation: 0, parentId: null };
      } else {
        newNode = { id: newId, x: menu.worldX, y: menu.worldY, width: 180, height: payload === 'photo' ? 220 : 150, type: payload, content: '', imageSrc: null, rotation: (Math.random() * 30) - 15, parentId: null };
      }
      setNodes([...nodes, newNode]);
      if (menu.type === 'connection') { setEdges([...edges, { from: menu.sourceId, to: newNode.id }]); }
      setEditingId(newId); setSelectedIds(new Set([newId]));
    } 
    else if (action === 'delete') { 
      pushHistory();
      const targets = selectedIds.has(menu.targetId) ? selectedIds : new Set([menu.targetId]);
      setNodes(nodes.filter(n => !targets.has(n.id))); setEdges(edges.filter(e => !targets.has(e.from) && !targets.has(e.to)));
      setDrawings(drawings.filter(d => !targets.has(d.id)));
      setSelectedIds(new Set());
    }
    else if (action === 'edit') { setEditingId(menu.targetId); }
    else if (action === 'groupInFrame') {
      if (selectedIds.size < 1) { setMenu(null); return; }
      pushHistory();

      const newFrameId = Date.now(); // IDを先に生成

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
      return;
    }
    else if (action === 'changePenColor') {
      setPenColor(payload);
      setDrawingTool('pen'); // 色を変えたらペンモードに戻す
    }
    else if (action === 'setDrawingTool') {
      setDrawingTool(payload);
    }
    else if (action === 'exitDrawingMode') {
      setIsDrawingMode(false);
    }
    setMenu(null);
  };

  return {
    nodes, edges, view, menu, keywords, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef, saveStatus,
    isNotebookOpen, isCaseManagerOpen,
    currentCaseId, caseList,
    drawings: drawings.map(d => ({ ...d, selected: selectedIds.has(d.id) })), currentDrawing, isDrawingMode, penColor, drawingTool, // ★描画用state
    isSpacePressed, isPanning,
    dragInfo,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp,
    notebookActions, nodeActions, menuAction, caseActions, handleImageUpload, drawingActions, // ★描画アクション
  };
};