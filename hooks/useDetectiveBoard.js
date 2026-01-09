// src/hooks/useDetectiveBoard.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { getPinLocation } from '../utils/math';

export const useDetectiveBoard = () => {
  // --- State ---
  const [nodes, setNodes] = useState([
    { id: 1, x: 100, y: 150, width: 220, height: 260, type: 'photo', content: 'Suspect A', imageSrc: null, rotation: -5 },
    { id: 2, x: 500, y: 250, width: 180, height: 120, type: 'note', content: 'Found fingerprint', imageSrc: null, rotation: 3 },
  ]);
  const [edges, setEdges] = useState([{ from: 1, to: 2 }]);
  
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set()); // 複数選択対応
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState(null);
  const [connectionDraft, setConnectionDraft] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null); // 矩形選択

  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [keywords, setKeywords] = useState([
    { id: 1, text: "Suspect A", active: true },
    { id: 2, text: "Fingerprint", active: true },
  ]);

  const [menu, setMenu] = useState(null); 
  const fileInputRef = useRef(null);
  
  // 履歴
  const [history, setHistory] = useState([]);
  const snapshotRef = useRef(null);

  // --- Logic Helpers ---
  const pushHistory = useCallback(() => { setHistory(prev => [...prev.slice(-49), { nodes, edges }]); }, [nodes, edges]);
  const pushSpecificHistory = (pastNodes, pastEdges) => { setHistory(prev => [...prev.slice(-49), { nodes: pastNodes, edges: pastEdges }]); };

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
    setSelectedIds(new Set());
  }, [history]);

  // キーボード操作
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId !== null) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault(); pushHistory();
          setNodes(prev => prev.filter(n => !selectedIds.has(n.id)));
          setEdges(prev => prev.filter(edge => !selectedIds.has(edge.from) && !selectedIds.has(edge.to)));
          setSelectedIds(new Set());
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, editingId, undo, pushHistory]);

  // --- Actions ---
  const notebookActions = {
    addKeyword: (text) => setKeywords([...keywords, { id: Date.now(), text, active: true }]),
    deleteKeyword: (id) => setKeywords(keywords.filter(k => k.id !== id)),
    toggleKeyword: (id) => setKeywords(keywords.map(k => k.id === id ? { ...k, active: !k.active } : k)),
    toggleOpen: () => setIsNotebookOpen(!isNotebookOpen)
  };

  // --- Mouse / Board Handlers ---
  const handleWheel = (e) => {
    e.preventDefault();
    const d = -e.deltaY * 0.001;
    const s = Math.min(5, Math.max(0.1, view.scale + d));
    const r = s / view.scale;
    setView({ x: e.clientX - (e.clientX - view.x) * r, y: e.clientY - (e.clientY - view.y) * r, scale: s });
  };

  const handleBoardMouseDown = (e) => {
    if (e.button === 2) return;
    setEditingId(null); setMenu(null);
    
    if (e.shiftKey) {
      const worldX = (e.clientX - view.x) / view.scale;
      const worldY = (e.clientY - view.y) / view.scale;
      setSelectionBox({ startX: worldX, startY: worldY, curX: worldX, curY: worldY });
    } else {
      setSelectedIds(new Set());
      setIsPanning(true); setPanStart({ x: e.clientX - view.x, y: e.clientY - view.y });
    }
  };

  const handleBoardContextMenu = (e) => {
    e.preventDefault(); setEditingId(null); setSelectedIds(new Set());
    setMenu({ type: 'board', left: e.clientX, top: e.clientY, worldX: (e.clientX - view.x) / view.scale, worldY: (e.clientY - view.y) / view.scale });
  };

  const handleMouseMove = (e) => {
    if (selectionBox) {
      const worldX = (e.clientX - view.x) / view.scale;
      const worldY = (e.clientY - view.y) / view.scale;
      setSelectionBox(prev => ({ ...prev, curX: worldX, curY: worldY }));
      return;
    }
    if (isPanning) { setView({ ...view, x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    
    if (dragInfo) {
      const worldMouseX = (e.clientX - view.x) / view.scale;
      const worldMouseY = (e.clientY - view.y) / view.scale;
      if (dragInfo.type === 'rotate') {
        setNodes(prev => prev.map(n => {
          if (n.id === dragInfo.id) {
            const radians = Math.atan2(worldMouseY - dragInfo.centerY, worldMouseX - dragInfo.centerX);
            return { ...n, rotation: (radians * (180 / Math.PI)) + 45 };
          }
          return n;
        }));
      } else {
        const dx = (e.clientX - dragInfo.startX) / view.scale;
        const dy = (e.clientY - dragInfo.startY) / view.scale;
        setNodes(prev => prev.map(n => {
          if (n.id === dragInfo.id) {
            if (dragInfo.type === 'move') return { ...n, x: dragInfo.initialNode.x + dx, y: dragInfo.initialNode.y + dy };
            if (dragInfo.type === 'resize') return { ...n, width: Math.max(100, dragInfo.initialNode.width + dx), height: Math.max(100, dragInfo.initialNode.height + dy) };
          }
          return n;
        }));
      }
    }
    if (connectionDraft) { setConnectionDraft(prev => ({ ...prev, currX: (e.clientX - view.x) / view.scale, currY: (e.clientY - view.y) / view.scale })); }
  };

  const handleMouseUp = (e) => {
    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.curX);
      const x2 = Math.max(selectionBox.startX, selectionBox.curX);
      const y1 = Math.min(selectionBox.startY, selectionBox.curY);
      const y2 = Math.max(selectionBox.startY, selectionBox.curY);
      const newSelectedIds = new Set(e.shiftKey ? selectedIds : null);
      nodes.forEach(node => {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) newSelectedIds.add(node.id);
      });
      setSelectedIds(newSelectedIds);
      setSelectionBox(null);
      return;
    }

    setIsPanning(false);
    if (dragInfo && snapshotRef.current) { pushHistory(); snapshotRef.current = null; }
    setDragInfo(null);
    if (connectionDraft) {
      setMenu({ type: 'connection', sourceId: connectionDraft.sourceId, left: e.clientX, top: e.clientY, worldX: (e.clientX - view.x) / view.scale, worldY: (e.clientY - view.y) / view.scale });
      setConnectionDraft(null);
    }
  };

  // --- Node Actions ---
  const nodeActions = {
    onMouseDown: (e, node) => {
      e.stopPropagation();
      if (e.shiftKey) {
        setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
          return next;
        });
        return;
      }
      if (!selectedIds.has(node.id)) setSelectedIds(new Set([node.id]));
      if (editingId === node.id) return;
      snapshotRef.current = { nodes, edges };
      setDragInfo({ type: 'move', id: node.id, startX: e.clientX, startY: e.clientY, initialNode: { ...node } });
    },
    onContextMenu: (e, node) => {
      e.preventDefault(); e.stopPropagation(); setSelectedIds(new Set([node.id]));
      setMenu({ type: 'node', targetId: node.id, nodeType: node.type, left: e.clientX, top: e.clientY });
    },
    onDoubleClick: (e, id) => { e.stopPropagation(); snapshotRef.current = { nodes, edges }; setEditingId(id); },
    onPinMouseDown: (e, id) => {
      e.stopPropagation(); e.preventDefault(); setMenu(null);
      const node = nodes.find(n => n.id === id);
      const pinLoc = getPinLocation(node);
      setConnectionDraft({ sourceId: id, startX: pinLoc.x, startY: pinLoc.y, currX: pinLoc.x, currY: pinLoc.y });
    },
    onPinMouseUp: (e, id) => {
      e.stopPropagation();
      if (connectionDraft && connectionDraft.sourceId !== id) {
        setEdges([...edges, { from: connectionDraft.sourceId, to: id }]);
      }
      setConnectionDraft(null);
    },
    onRotateMouseDown: (e, node) => {
      e.stopPropagation(); e.preventDefault(); snapshotRef.current = { nodes, edges };
      const centerX = node.x + node.width / 2;
      const centerY = node.y + node.height / 2;
      setDragInfo({ type: 'rotate', id: node.id, centerX, centerY, initialNode: { ...node } });
    },
    onRotateReset: (e, id) => {
      e.stopPropagation(); pushHistory();
      setNodes(prev => prev.map(n => n.id === id ? { ...n, rotation: 0 } : n));
    },
    onResizeMouseDown: (e, node) => {
      e.stopPropagation(); snapshotRef.current = { nodes, edges };
      setDragInfo({ type: 'resize', id: node.id, startX: e.clientX, startY: e.clientY, initialNode: { ...node } });
    },
    onContentChange: (id, val) => setNodes(nodes.map(n => n.id === id ? { ...n, content: val } : n)),
    onBlur: () => {
      if (snapshotRef.current) { pushSpecificHistory(snapshotRef.current.nodes, snapshotRef.current.edges); snapshotRef.current = null; }
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
        const newWidth = 220;
        const newHeight = (newWidth / ratio) + 50; 
        setNodes(prev => prev.map(node => node.id === menu.targetId ? { ...node, imageSrc: base64, width: newWidth, height: newHeight, aspectRatio: ratio } : node));
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
      const newNode = { id: newId, x: menu.worldX, y: menu.worldY, width: 180, height: payload === 'photo' ? 220 : 150, type: payload, content: '', imageSrc: null, rotation: (Math.random() * 20) - 10 };
      setNodes([...nodes, newNode]);
      if (menu.type === 'connection') { setEdges([...edges, { from: menu.sourceId, to: newNode.id }]); }
      setEditingId(newId); setSelectedIds(new Set([newId]));
    } 
    else if (action === 'delete') { 
      pushHistory();
      setNodes(nodes.filter(n => n.id !== menu.targetId)); setEdges(edges.filter(e => e.from !== menu.targetId && e.to !== menu.targetId));
      if (selectedIds.has(menu.targetId)) setSelectedIds(new Set());
    }
    else if (action === 'edit') { setEditingId(menu.targetId); }
    else if (action === 'changePhoto') { if (fileInputRef.current) fileInputRef.current.click(); return; }
    setMenu(null);
  };

  return {
    nodes, edges, view, menu, keywords, isNotebookOpen, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp,
    notebookActions, nodeActions, menuAction, handleImageUpload
  };
};