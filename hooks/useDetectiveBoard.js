import { useState, useRef, useEffect, useCallback } from 'react';
import { db } from '../db';
import { getPinLocation } from '../utils/math';

// デフォルトデータ
const DEFAULT_STATE = {
  nodes: [
    { id: 1, x: 100, y: 150, width: 220, height: 260, type: 'photo', content: 'Suspect A', imageSrc: null, rotation: -5, parentId: null },
  ],
  edges: [],
  keywords: [],
  drawings: [], // ★描画データを追加
  view: { x: 0, y: 0, scale: 1 }
};

// ヘルパー関数：点と線分の距離
const distanceToSegment = (p, v, w) => {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
};

const isPointNearDrawing = (x, y, drawing, threshold) => {
  if (!drawing.points || drawing.points.length < 2) return false;
  return drawing.points.some((p, i) => {
    if (i === 0) return false;
    return distanceToSegment({x, y}, drawing.points[i-1], p) < threshold;
  });
};

export const useDetectiveBoard = () => {
  // --- State ---
  const [activeSidebar, setActiveSidebar] = useState(null);
  const isNotebookOpen = activeSidebar === 'notebook';
  const isCaseManagerOpen = activeSidebar === 'case';

  // データ系
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [caseList, setCaseList] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [drawings, setDrawings] = useState([]); // ★描画配列
  
  // UI操作系
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState(null);
  const [connectionDraft, setConnectionDraft] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [menu, setMenu] = useState(null); 
  const [saveStatus, setSaveStatus] = useState('saved');

  // ★描画モード系
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [penColor, setPenColor] = useState('#000000'); // ペンの色
  const [drawingTool, setDrawingTool] = useState('pen'); // 'pen' or 'eraser'
  const [isErasing, setIsErasing] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const fileInputRef = useRef(null);
  const [history, setHistory] = useState([]);
  const snapshotRef = useRef(null);
  const mouseDownData = useRef(null); // ドラッグ開始判定用

  // --- 初期化 ---
  useEffect(() => {
    const init = async () => {
      const allSaves = await db.saves.toArray();
      if (allSaves.length === 0) {
        const newId = `case-${Date.now()}`;
        const newCase = { id: newId, name: 'Case #1', updatedAt: Date.now(), ...DEFAULT_STATE };
        await db.saves.add(newCase);
        setCaseList([{ id: newId, name: 'Case #1', updatedAt: Date.now() }]);
        setCurrentCaseId(newId);
        loadCaseData(newCase);
      } else {
        const sorted = allSaves.sort((a, b) => b.updatedAt - a.updatedAt);
        setCaseList(sorted.map(s => ({ id: s.id, name: s.name || 'Untitled', updatedAt: s.updatedAt })));
        setCurrentCaseId(sorted[0].id);
        loadCaseData(sorted[0]);
      }
    };
    init();
  }, []);

  const loadCaseData = (data) => {
    setNodes(data.nodes || []);
    setEdges(data.edges || []);
    setKeywords(data.keywords || []);
    setDrawings(data.drawings || []); // ★描画データをロード
    setView(data.view || { x: 0, y: 0, scale: 1 });
    setHistory([]);
  };

  // --- 自動保存 ---
  useEffect(() => {
    if (!currentCaseId) return;
    setSaveStatus('saving');
    const handler = setTimeout(async () => {
      try {
        await db.saves.update(currentCaseId, { nodes, edges, keywords, view, drawings, updatedAt: Date.now() }); // ★描画データを保存
        setSaveStatus('saved');
        setCaseList(prev => prev.map(c => c.id === currentCaseId ? { ...c, updatedAt: Date.now() } : c));
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus('error');
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [nodes, edges, keywords, view, drawings, currentCaseId]); // ★drawingsを追加

  // --- 履歴管理 ---
  const pushHistory = useCallback(() => { setHistory(prev => [...prev.slice(-49), { nodes, edges, drawings }]); }, [nodes, edges, drawings]);
  const pushSpecificHistory = (pastNodes, pastEdges, pastDrawings) => { setHistory(prev => [...prev.slice(-49), { nodes: pastNodes, edges: pastEdges, drawings: pastDrawings }]); };
  const undo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
    setDrawings(lastState.drawings); // ★描画もUndo
    setSelectedIds(new Set());
  }, [history]);

  // スペースキーの状態監視
  useEffect(() => {
    const handleSpaceDown = (e) => {
      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
    };
    const handleSpaceUp = (e) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleSpaceDown);
    window.addEventListener('keyup', handleSpaceUp);
    return () => { window.removeEventListener('keydown', handleSpaceDown); window.removeEventListener('keyup', handleSpaceUp); };
  }, []);

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
    if (id === currentCaseId) return;
    await db.saves.update(currentCaseId, { nodes, edges, keywords, view, drawings, updatedAt: Date.now() });
    const targetCase = await db.saves.get(id);
    if (targetCase) {
      setCurrentCaseId(id);
      loadCaseData(targetCase);
      setActiveSidebar(null);
    }
  };

  const createCase = async () => {
    const newId = `case-${Date.now()}`;
    const newName = `Case #${caseList.length + 1}`;
    const newCase = { id: newId, name: newName, updatedAt: Date.now(), ...DEFAULT_STATE };
    await db.saves.add(newCase);
    setCaseList(prev => [{ id: newId, name: newName, updatedAt: Date.now() }, ...prev]);
    setCurrentCaseId(newId);
    loadCaseData(newCase);
  };

  const deleteCase = async (id) => {
    if (!window.confirm("このケースファイルを完全に削除しますか？")) return;
    await db.saves.delete(id);
    const newList = caseList.filter(c => c.id !== id);
    setCaseList(newList);
    if (id === currentCaseId) {
      const nextCase = newList[0];
      if (nextCase) {
        const data = await db.saves.get(nextCase.id);
        setCurrentCaseId(nextCase.id);
        loadCaseData(data);
      } else {
        createCase();
      }
    }
  };

  const renameCase = async (id, newName) => {
    await db.saves.update(id, { name: newName });
    setCaseList(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
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
    toggleDrawingMode: () => setIsDrawingMode(prev => !prev),
    clearDrawings: () => {
      if (window.confirm('すべての手書き線を消去しますか？')) {
        pushHistory();
        setDrawings([]);
      }
    }
  };

  // --- Main Board Handlers ---
  const handleWheel = (e) => {
    setMenu(null);
    if (isDrawingMode) { e.preventDefault(); return; } // 描画中はズームしない
    e.preventDefault();
    const d = -e.deltaY * 0.001;
    const s = Math.min(5, Math.max(0.1, view.scale + d));
    const r = s / view.scale;
    setView({ x: e.clientX - (e.clientX - view.x) * r, y: e.clientY - (e.clientY - view.y) * r, scale: s });
  };

  // 消しゴム機能
  const eraseAt = (clientX, clientY) => {
    const worldX = (clientX - view.x) / view.scale;
    const worldY = (clientY - view.y) / view.scale;
    const threshold = 20 / view.scale; // 消しゴムの判定範囲

    setDrawings(prev => {
      const remaining = prev.filter(d => {
        // 線を構成する点のいずれかが範囲内にあるかチェック
        return !d.points.some(p => Math.hypot(p.x - worldX, p.y - worldY) < threshold);
      });
      return remaining.length !== prev.length ? remaining : prev;
    });
  };

  const handleBoardMouseDown = (e) => {
    if (e.button === 2) return;

    // パン移動 (中クリック or スペース+左クリック)
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setMenu(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - view.x, y: e.clientY - view.y });
      return;
    }

    // ★描画モードの処理
    if (isDrawingMode) {
      e.stopPropagation();
      if (drawingTool === 'eraser') {
        pushHistory();
        setIsErasing(true);
        eraseAt(e.clientX, e.clientY);
      } else {
        const point = { x: (e.clientX - view.x) / view.scale, y: (e.clientY - view.y) / view.scale };
        setCurrentDrawing({
          id: `draw-${Date.now()}`,
          points: [point],
          color: penColor,
        });
      }
      return;
    }

    setEditingId(null); setMenu(null);

    // 線の選択判定
    const worldX = (e.clientX - view.x) / view.scale;
    const worldY = (e.clientY - view.y) / view.scale;
    const hitThreshold = 10 / view.scale;
    let hitDrawing = null;
    // 上にあるもの（配列の後ろ）から判定
    for (let i = drawings.length - 1; i >= 0; i--) {
      if (isPointNearDrawing(worldX, worldY, drawings[i], hitThreshold)) {
        hitDrawing = drawings[i];
        break;
      }
    }

    if (hitDrawing) {
      e.stopPropagation();
      if (!selectedIds.has(hitDrawing.id)) {
        setSelectedIds(new Set([hitDrawing.id]));
      }
      snapshotRef.current = { nodes, edges, drawings };
      setDragInfo({ type: 'move', id: hitDrawing.id, startX: e.clientX, startY: e.clientY });
      return;
    }

    // 範囲選択 (デフォルトの左ドラッグ)
    setSelectionBox({ startX: worldX, startY: worldY, curX: worldX, curY: worldY });
    if (!e.shiftKey) {
      setSelectedIds(new Set());
    }
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

  const handleMouseMove = (e) => {
    if (isPanning) { setView({ ...view, x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }

    // ★描画中の処理
    if (isDrawingMode) {
      if (isErasing) {
        eraseAt(e.clientX, e.clientY);
      } else if (currentDrawing) {
        const newPoint = { x: (e.clientX - view.x) / view.scale, y: (e.clientY - view.y) / view.scale };
        setCurrentDrawing(prev => ({...prev, points: [...prev.points, newPoint]}));
      }
      return;
    }

    if (selectionBox) {
      const worldX = (e.clientX - view.x) / view.scale;
      const worldY = (e.clientY - view.y) / view.scale;
      setSelectionBox(prev => ({ ...prev, curX: worldX, curY: worldY }));
      return;
    }

    // ドラッグ開始判定（閾値を超えたらドラッグ開始）
    if (mouseDownData.current && !dragInfo) {
      const moveDist = Math.hypot(e.clientX - mouseDownData.current.startX, e.clientY - mouseDownData.current.startY);
      if (moveDist > 5) {
        setDragInfo(mouseDownData.current);
        mouseDownData.current = null;
      }
    }

    if (dragInfo) {
      if (!snapshotRef.current) return; // Add a guard clause
      const worldMouseX = (e.clientX - view.x) / view.scale;
      const worldMouseY = (e.clientY - view.y) / view.scale;
      if (dragInfo.type === 'rotate') {
        setNodes(prev => prev.map(n => n.id === dragInfo.id ? { ...n, rotation: (Math.atan2(worldMouseY - dragInfo.centerY, worldMouseX - dragInfo.centerX) * (180 / Math.PI)) + 45 } : n));
      } else {
        const dx = (e.clientX - dragInfo.startX) / view.scale;
        const dy = (e.clientY - dragInfo.startY) / view.scale;
        
        const snapshot = snapshotRef.current;
        const initialDraggedNode = snapshot.nodes.find(n => n.id === dragInfo.id);
        
        const isFrameMove = initialDraggedNode && initialDraggedNode.type === 'frame' && dragInfo.type === 'move';
        
        const childIdsToMove = isFrameMove
            ? new Set(snapshot.nodes.filter(n => n.parentId === dragInfo.id).map(n => n.id))
            : new Set();

        setNodes(currentNodes => currentNodes.map(node => {
            const originalNodeState = snapshot.nodes.find(n => n.id === node.id);
            if (!originalNodeState) return node;

            if (dragInfo.type === 'move') {
                if (node.id === dragInfo.id || selectedIds.has(node.id) || (isFrameMove && childIdsToMove.has(node.id))) {
                    return { ...node, x: originalNodeState.x + dx, y: originalNodeState.y + dy };
                }
            } else if (dragInfo.type === 'resize' && node.id === dragInfo.id) {
                return { ...node, width: Math.max(100, originalNodeState.width + dx), height: Math.max(100, originalNodeState.height + dy) };
            }


            return node;
        }));

        // 線の移動
        setDrawings(currentDrawings => currentDrawings.map(drawing => {
          const originalDrawing = snapshot.drawings.find(d => d.id === drawing.id);
          if (!originalDrawing) return drawing;

          if (selectedIds.has(drawing.id) || drawing.id === dragInfo.id) {
             const newPoints = originalDrawing.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
             return { ...drawing, points: newPoints };
          }
          return drawing;
        }));
      }
    }
    if (connectionDraft) { setConnectionDraft(prev => ({ ...prev, currX: (e.clientX - view.x) / view.scale, currY: (e.clientY - view.y) / view.scale })); }
  };

  const handleMouseUp = (e) => {
    mouseDownData.current = null; // ドラッグ未成立で終了した場合のクリア

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // ★描画完了の処理
    if (isDrawingMode) {
      if (isErasing) {
        setIsErasing(false);
      } else if (currentDrawing) {
        pushHistory(); // 描画前に履歴保存
        setDrawings(prev => [...prev, currentDrawing]);
        setCurrentDrawing(null);
      }
      return;
    }

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
      // 手書き線の範囲選択
      drawings.forEach(d => {
        if (d.points.some(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2)) {
          newSelectedIds.add(d.id);
        }
      });
      setSelectedIds(newSelectedIds);
      setSelectionBox(null);
      return;
    }
    if (dragInfo && snapshotRef.current) {
      const pastState = snapshotRef.current;
      pushSpecificHistory(pastState.nodes, pastState.edges, pastState.drawings);
      snapshotRef.current = null;

      // 自動グループ化のロジック
      if (dragInfo.type === 'move') {
        setNodes(prevNodes => {
          const targetNode = prevNodes.find(n => n.id === dragInfo.id);
          // フレーム自体はグループ化しない
          if (!targetNode || targetNode.type === 'frame') return prevNodes;

          const centerX = targetNode.x + targetNode.width / 2;
          const centerY = targetNode.y + targetNode.height / 2;

          let newParentId = null;

          // 中心点が含まれるフレームを探す（後勝ち＝上にあるフレーム優先）
          prevNodes.forEach(node => {
            if (node.type === 'frame' && node.id !== targetNode.id) {
              if (centerX >= node.x && centerX <= node.x + node.width && centerY >= node.y && centerY <= node.y + node.height) {
                newParentId = node.id;
              }
            }
          });

          if (targetNode.parentId !== newParentId) {
            return prevNodes.map(n => n.id === targetNode.id ? { ...n, parentId: newParentId } : n);
          }
          return prevNodes;
        });
      }
    }
    setDragInfo(null);
    if (connectionDraft) {
      setMenu({ type: 'connection', sourceId: connectionDraft.sourceId, left: e.clientX, top: e.clientY, worldX: (e.clientX - view.x) / view.scale, worldY: (e.clientY - view.y) / view.scale });
      setConnectionDraft(null);
    }
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