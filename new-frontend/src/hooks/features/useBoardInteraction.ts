'use client';

import { ConnectionData, ConnectionDraft, DragInfo, NodeData, SelectionBox, ViewState } from '@/types';
import { useEffect, useRef, useState, MutableRefObject } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface BoardInteractionProps {
  view: ViewState;
  setView: (view: ViewState | ((prev: ViewState) => ViewState)) => void;
  nodes: NodeData[];
  setNodes: (nodes: NodeData[] | ((prev: NodeData[]) => NodeData[])) => void;
  connections: ConnectionData[];
  setConnections: (conns: ConnectionData[] | ((prev: ConnectionData[]) => ConnectionData[])) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  dragInfo: DragInfo | null;
  setDragInfo: (dragInfo: DragInfo | null) => void;
  connectionDraft: ConnectionDraft | null;
  setConnectionDraft: (draft: ConnectionDraft | null) => void;
  pushHistory: () => void;
  snapshotRef?: MutableRefObject<NodeData[] | null>;
}

export function useBoardInteraction({
  view,
  setView,
  nodes,
  setNodes,
  connections,
  setConnections,
  selectedIds,
  setSelectedIds,
  dragInfo,
  setDragInfo,
  connectionDraft,
  setConnectionDraft,
  pushHistory,
  snapshotRef: externalSnapshotRef,
}: BoardInteractionProps) {
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const internalSnapshotRef = useRef<NodeData[] | null>(null);
  
  // 外部から渡された ref があればそれを使う、なければ内部の ref を使う
  const snapshotRef = externalSnapshotRef || internalSnapshotRef;

  // スペースキーでハンドツール
  useEffect(() => {
    const handleSpaceDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) setIsSpacePressed(true);
    };
    const handleSpaceUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleSpaceDown);
    window.addEventListener('keyup', handleSpaceUp);
    return () => {
      window.removeEventListener('keydown', handleSpaceDown);
      window.removeEventListener('keyup', handleSpaceUp);
    };
  }, []);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const nextScale = Math.min(5, Math.max(0.1, view.scale + delta));
    const ratio = nextScale / view.scale;
    setView({
      x: e.clientX - (e.clientX - view.x) * ratio,
      y: e.clientY - (e.clientY - view.y) * ratio,
      scale: nextScale,
    });
  };

  const handleBoardMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return;

    // 中クリック or Space+左クリックでパン開始
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX - view.x, y: e.clientY - view.y };
      return;
    }

    // ワールド座標に変換
    const worldX = (e.clientX - view.x) / view.scale;
    const worldY = (e.clientY - view.y) / view.scale;

    // ノード選択判定（後ろから前へ）
    let hitNode: NodeData | null = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const nx = node.position.x;
      const ny = node.position.y;
      const width = node.width || 240;
      const height = node.height || 120;
      if (worldX >= nx && worldX <= nx + width && worldY >= ny && worldY <= ny + height) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      e.stopPropagation();
      // Shift キーで追加選択、なければ単一選択
      if (e.shiftKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(hitNode!.id)) {
            next.delete(hitNode!.id);
          } else {
            next.add(hitNode!.id);
          }
          return next;
        });
      } else if (!selectedIds.has(hitNode.id)) {
        setSelectedIds(new Set([hitNode.id]));
      }

      // ドラッグ準備
      snapshotRef.current = [...nodes];
      setDragInfo({
        type: 'move',
        id: hitNode.id,
        startX: e.clientX,
        startY: e.clientY,
        initialNode: hitNode,
        initialPosition: { ...hitNode.position },
      });
      return;
    }

    // 範囲選択開始（デフォルト左ドラッグ）
    setSelectionBox({ startX: worldX, startY: worldY, curX: worldX, curY: worldY });
    if (!e.shiftKey) {
      setSelectedIds(new Set());
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setView({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y, scale: view.scale });
      return;
    }

    const worldX = (e.clientX - view.x) / view.scale;
    const worldY = (e.clientY - view.y) / view.scale;

    // 接続ドラッグ中
    if (connectionDraft) {
      setConnectionDraft({ ...connectionDraft, currX: worldX, currY: worldY });
      return;
    }

    // 範囲選択中
    if (selectionBox) {
      setSelectionBox((prev) => (prev ? { ...prev, curX: worldX, curY: worldY } : null));
      return;
    }

    // ドラッグ中
    if (dragInfo && snapshotRef.current) {
      const dx = (e.clientX - dragInfo.startX) / view.scale;
      const dy = (e.clientY - dragInfo.startY) / view.scale;

      if (dragInfo.type === 'move') {
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            if (node.id === dragInfo.id || selectedIds.has(node.id)) {
              const original = snapshotRef.current!.find((n) => n.id === node.id);
              if (original) {
                return {
                  ...node,
                  position: {
                    x: original.position.x + dx,
                    y: original.position.y + dy,
                  },
                };
              }
            }
            return node;
          })
        );
      } else if (dragInfo.type === 'resize') {
        console.log('📐 handleMouseMove - resize processing');
        const node = nodes.find((n) => n.id === dragInfo.id);
        const original = snapshotRef.current.find((n) => n.id === dragInfo.id);
        console.log('📐 resize check:', { nodeFound: !!node, originalFound: !!original, handle: dragInfo.resizeHandle });
        if (node && original && dragInfo.resizeHandle) {
          const minSize = 50;
          
          // 回転を考慮した座標変換
          const rotation = original.rotation || 0;
          const rad = (rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          
          // ドラッグ距離をノードのローカル座標に変換
          const localDx = dx * cos + dy * sin;
          const localDy = -dx * sin + dy * cos;
          
          let newWidth = original.width || 240;
          let newHeight = original.height || 120;
          let newX = original.position.x;
          let newY = original.position.y;

          const handle = dragInfo.resizeHandle;
          const centerDx = (newWidth / 2) * (handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0);
          const centerDy = (newHeight / 2) * (handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0);

          if (handle.includes('e')) newWidth = Math.max(minSize, original.width! + localDx);
          if (handle.includes('w')) {
            newWidth = Math.max(minSize, original.width! - localDx);
          }
          if (handle.includes('s')) newHeight = Math.max(minSize, original.height! + localDy);
          if (handle.includes('n')) {
            newHeight = Math.max(minSize, original.height! - localDy);
          }

          // 新しい中心位置を計算して、ノードが拡大縮小時に移動しないようにする
          const widthDiff = newWidth - (original.width || 240);
          const heightDiff = newHeight - (original.height || 120);
          
          if (handle.includes('w') || handle.includes('n')) {
            // 左/上からリサイズする場合、ノード位置を調整
            if (handle.includes('w')) {
              newX = original.position.x - widthDiff * (cos > 0 ? cos : 0);
              newY = original.position.y - widthDiff * (sin > 0 ? sin : 0);
            }
            if (handle.includes('n')) {
              newX = original.position.x + heightDiff * (sin > 0 ? sin : 0);
              newY = original.position.y - heightDiff * (cos > 0 ? cos : 0);
            }
          }

          setNodes((prev) =>
            prev.map((n) =>
              n.id === dragInfo.id
                ? { ...n, width: newWidth, height: newHeight, position: { x: newX, y: newY } }
                : n
            )
          );
        }
      } else if (dragInfo.type === 'rotate' && dragInfo.centerX && dragInfo.centerY) {
        const angle = Math.atan2(
          worldY - dragInfo.centerY,
          worldX - dragInfo.centerX
        ) * (180 / Math.PI);
        const delta = angle - dragInfo.startAngle!;

        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragInfo.id
              ? { ...n, rotation: ((dragInfo.initialRotation || 0) + delta + 360) % 360 }
              : n
          )
        );
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // 接続ドラッグ完了
    if (connectionDraft) {
      // 終了ノードをチェック
      const worldX = (e.clientX - view.x) / view.scale;
      const worldY = (e.clientY - view.y) / view.scale;
      let targetNode: NodeData | null = null;

      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.id === connectionDraft.sourceId) continue;
        const nx = node.position.x;
        const ny = node.position.y;
        const width = node.width || 240;
        const height = node.height || 120;
        if (worldX >= nx && worldX <= nx + width && worldY >= ny && worldY <= ny + height) {
          targetNode = node;
          break;
        }
      }

      if (targetNode) {
        const newConnection: ConnectionData = {
          id: uuidv4(),
          fromId: connectionDraft.sourceId,
          toId: targetNode.id,
        };
        setConnections((prev) => [...prev, newConnection]);
        pushHistory();
      }

      setConnectionDraft(null);
      return;
    }

    // 範囲選択終了
    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.curX);
      const x2 = Math.max(selectionBox.startX, selectionBox.curX);
      const y1 = Math.min(selectionBox.startY, selectionBox.curY);
      const y2 = Math.max(selectionBox.startY, selectionBox.curY);

      const newSelectedIds = new Set(e.shiftKey ? selectedIds : new Set<string>());
      nodes.forEach((node) => {
        const cx = node.position.x + (node.width || 240) / 2;
        const cy = node.position.y + (node.height || 120) / 2;
        if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
          newSelectedIds.add(node.id);
        }
      });
      setSelectedIds(newSelectedIds);
      setSelectionBox(null);
      return;
    }

    // ドラッグ終了
    if (dragInfo) {
      pushHistory();
      snapshotRef.current = null;
    }
    setDragInfo(null);
  };

  return {
    isPanning,
    isSpacePressed,
    selectionBox,
    handleWheel,
    handleBoardMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
