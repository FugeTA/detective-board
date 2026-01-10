import { useState, useRef, useEffect } from 'react';
import { isPointNearDrawing } from '../utils/geometry';

export const useBoardInteraction = ({
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
}) => {
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragInfo, setDragInfo] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const snapshotRef = useRef(null);
  const mouseDownData = useRef(null);

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

  const handleWheel = (e) => {
    setMenu(null);
    if (isDrawingMode) { e.preventDefault(); return; } // 描画中はズームしない
    e.preventDefault();
    const d = -e.deltaY * 0.001;
    const s = Math.min(5, Math.max(0.1, view.scale + d));
    const r = s / view.scale;
    setView({ x: e.clientX - (e.clientX - view.x) * r, y: e.clientY - (e.clientY - view.y) * r, scale: s });
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

  return {
    isPanning, dragInfo, selectionBox, isSpacePressed,
    handleWheel, handleBoardMouseDown, handleMouseMove, handleMouseUp,
    setDragInfo, snapshotRef, mouseDownData
  };
};