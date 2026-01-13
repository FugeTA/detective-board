'use client';

import React, { useRef, useEffect } from 'react';
import { ContextMenu } from '@/components/ContextMenu';
import { Edge } from '@/components/Edge';
import { Node, PIN_OVERLAP } from '@/components/Node';
import { db } from '@/lib/db';
import { useBoardInteraction } from '@/hooks/features/useBoardInteraction';
import { useKeyboardShortcuts } from '@/hooks/features/useKeyboardShortcuts';
import { useStore } from '@/store/useStore';
import { v4 as uuidv4 } from 'uuid';
import styles from './Page.module.css';

export default function Home() {
  const nodes = useStore((state) => state.nodes);
  const loadNodes = useStore((state) => state.loadNodes);
  const addNode = useStore((state) => state.addNode);
  const setNodes = useStore((state) => state.setNodes);
  const connections = useStore((state) => state.connections);
  const setConnections = useStore((state) => state.setConnections);
  const removeConnection = useStore((state) => state.removeConnection);
  const view = useStore((state) => state.view);
  const setView = useStore((state) => state.setView);
  const selectedIds = useStore((state) => state.selectedIds);
  const setSelectedIds = useStore((state) => state.setSelectedIds);
  const dragInfo = useStore((state) => state.dragInfo);
  const setDragInfo = useStore((state) => state.setDragInfo);
  const connectionDraft = useStore((state) => state.connectionDraft);
  const setConnectionDraft = useStore((state) => state.setConnectionDraft);
  const pushHistory = useStore((state) => state.pushHistory);
  const undo = useStore((state) => state.undo);
  const menu = useStore((state) => state.menu);
  const setMenu = useStore((state) => state.setMenu);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const snapshotRef = useRef<any>(null);

  const {
    selectionBox,
    handleWheel,
    handleBoardMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useBoardInteraction({
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
    snapshotRef,
  });

  useKeyboardShortcuts({
    nodes,
    setNodes,
    selectedIds,
    setSelectedIds,
    pushHistory,
    undo,
  });

  const isModern = theme === 'modern';
  const corkTileSize = 400;
  const gridSize = 48;
  const backgroundStyle = isModern
    ? {
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
        backgroundSize: `${gridSize * view.scale}px ${gridSize * view.scale}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: `${view.x}px ${view.y}px`,
      }
    : {
        backgroundImage: "url('/assets/back_board.jpg')",
        backgroundSize: `${corkTileSize * view.scale}px ${corkTileSize * view.scale}px`,
        backgroundRepeat: 'repeat',
        backgroundPosition: `${view.x}px ${view.y}px`,
      };

  const handleContextMenu = (e: React.MouseEvent, nodeId?: string) => {
    e.preventDefault();
    const worldX = (e.clientX - view.x) / view.scale;
    const worldY = (e.clientY - view.y) / view.scale;

    if (nodeId) {
      setSelectedIds(new Set([nodeId]));
    }
    setMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent, nodeId: string, handle: string) => {
    console.log('🔷 Resize handle clicked:', { nodeId, handle });
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      console.log('✅ Node found, setting dragInfo for resize');
      snapshotRef.current = [...nodes];
      setDragInfo({
        type: 'resize',
        id: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        initialNode: node,
        initialSize: { width: node.width || 240, height: node.height || 120 },
        resizeHandle: handle as any,
      });
    }
  };

  const handleRotateHandleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const centerX = node.position.x + (node.width || 240) / 2;
      const centerY = node.position.y + (node.height || 120) / 2;
      // スケールを反映させた座標変換
      const worldMouseX = (e.clientX - view.x) / view.scale;
      const worldMouseY = (e.clientY - view.y) / view.scale;
      const startAngle = Math.atan2(
        worldMouseY - centerY,
        worldMouseX - centerX
      ) * (180 / Math.PI);

      snapshotRef.current = [...nodes];
      setDragInfo({
        type: 'rotate',
        id: nodeId,
        startX: e.clientX,
        startY: e.clientY,
        initialRotation: node.rotation || 0,
        centerX,
        centerY,
        startAngle,
      });
    }
  };

  const handleRotateReset = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    pushHistory();
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, rotation: 0 } : n)));
  };

  const handleConnectStart = (e: React.MouseEvent, nodeId: string) => {
    console.log('🟢 Connect handle clicked:', { nodeId });
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      // 接続ハンドル位置を計算（回転を考慮）
      const width = node.width || 240;
      const height = node.height || 120;
      const rotation = node.rotation || 0;
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // 接続ハンドルのローカル位置（上中央のピン、ノードに少し重ねる）
      const handleLocalX = 0;
      const handleLocalY = -height / 2 + PIN_OVERLAP;
      
      // ワールド座標に変換
      const handleWorldX = node.position.x + centerX + handleLocalX * cos - handleLocalY * sin;
      const handleWorldY = node.position.y + centerY + handleLocalX * sin + handleLocalY * cos;
      
      console.log('✅ Starting connection from:', { handleWorldX, handleWorldY });
      setConnectionDraft({
        sourceId: nodeId,
        startX: handleWorldX,
        startY: handleWorldY,
        currX: handleWorldX,
        currY: handleWorldY,
      });
    }
  };

  // Document レベルのマウスムーブ/マウスアップを設定（ドラッグが画面外に出ても継続）
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      // dragInfo または connectionDraft がある場合のみ処理
      if (dragInfo || connectionDraft) {
        console.log('📄 Document mousemove - calling handleMouseMove:', { hasDragInfo: !!dragInfo, hasConnectionDraft: !!connectionDraft, dragType: dragInfo?.type });
        handleMouseMove(e as any);
      }
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      // dragInfo または connectionDraft がある場合のみ処理
      if (dragInfo || connectionDraft) {
        console.log('📄 Document mouseup - calling handleMouseUp');
        handleMouseUp(e as any);
      }
    };

    // ドラッグ中またはコネクト中のみリスナーを登録
    if (dragInfo || connectionDraft) {
      console.log('📄 Adding document event listeners');
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);

      return () => {
        console.log('📄 Removing document event listeners');
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
      };
    }
  }, [dragInfo, connectionDraft, handleMouseMove, handleMouseUp]);

  const handleDeleteFromMenu = () => {
    if (menu?.nodeId) {
      pushHistory();
      setNodes((prev) => prev.filter((n) => n.id !== menu.nodeId));
      // 接続も削除
      setConnections((prev) =>
        prev.filter((c) => c.fromId !== menu.nodeId && c.toId !== menu.nodeId)
      );
      setMenu(null);
    }
  };

  const handleDuplicate = () => {
    if (menu?.nodeId) {
      const nodeToDuplicate = nodes.find((n) => n.id === menu.nodeId);
      if (nodeToDuplicate) {
        pushHistory();
        const newNode: typeof nodeToDuplicate = {
          ...nodeToDuplicate,
          id: uuidv4(),
          position: {
            x: nodeToDuplicate.position.x + 20,
            y: nodeToDuplicate.position.y + 20,
          },
        };
        setNodes((prev) => [...prev, newNode]);
        setMenu(null);
      }
    }
  };

  useEffect(() => {
    const seedData = async () => {
      const count = await db.nodes.count();
      if (count === 0) {
        await addNode({
          id: uuidv4(),
          type: 'text',
          position: { x: 100, y: 100 },
          title: '最初の事件',
          content: 'ここから調査を開始する...',
          width: 240,
          height: 120,
        });
      }
      await loadNodes();
    };

    seedData();
  }, [addNode, loadNodes]);

  // テーマ初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('detective-board-theme') as 'modern' | 'retro' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [setTheme]);

  // テーマ切り替え時のDOMを更新
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // ホイールイベントのpassive属性対応
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      handleWheel(e as any);
    };

    mainElement.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      mainElement.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);

  return (
    <main
      className={styles.main}
      onMouseDown={handleBoardMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* テーマ切り替えボタン */}
      <div className={styles.themeToggle}>
        <button onClick={() => setTheme(theme === 'modern' ? 'retro' : 'modern')}>
          {theme === 'modern' ? '🕵️ Retro' : '💻 Modern'}
        </button>
      </div>
      <div
        className={styles.board}
        style={{
          cursor: dragInfo && dragInfo.type === 'move' ? 'grabbing' : 'grab',
          ...backgroundStyle,
        }}
      >
        {/* トランスフォーム適用されたボード全体コンテナ */}
        <div
          className={styles.transformLayer}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >

          {/* コンテンツ */}
        <div
          className={styles.contentLayer}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              onContextMenu={(e) => handleContextMenu(e, node.id)}
            >
              <Node
                node={node}
                isSelected={selectedIds.has(node.id)}
                onResizeHandleMouseDown={(e, handle) =>
                  handleResizeHandleMouseDown(e, node.id, handle)
                }
                onRotateHandleMouseDown={(e) => handleRotateHandleMouseDown(e, node.id)}
                onRotateReset={() => handleRotateReset(node.id)}
                onConnectStart={(e) => handleConnectStart(e, node.id)}
              />
            </div>
          ))}

          {/* SVG キャンバス（エッジ描画） */}
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {connections.map((conn) => (
              <Edge
                key={conn.id}
                connection={conn}
                nodes={nodes}
                isSelected={selectedIds.has(conn.id)}
                onDelete={() => {
                  pushHistory();
                  removeConnection(conn.id);
                }}
              />
            ))}

            {/* 接続ドラッグ中の線 */}
            {connectionDraft && (
              <line
                x1={connectionDraft.startX}
                y1={connectionDraft.startY}
                x2={connectionDraft.currX}
                y2={connectionDraft.currY}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="5,5"
                style={{ pointerEvents: 'none' }}
              />
            )}
          </svg>

          {/* 範囲選択ボックス */}
          {selectionBox && (
            <div
              className={styles.selectionBox}
              style={{
                left: Math.min(selectionBox.startX, selectionBox.curX),
                top: Math.min(selectionBox.startY, selectionBox.curY),
                width: Math.abs(selectionBox.curX - selectionBox.startX),
                height: Math.abs(selectionBox.curY - selectionBox.startY),
              }}
            />
          )}
        </div>
        </div>
      </div>

      <ContextMenu
        menu={menu}
        onClose={() => setMenu(null)}
        nodes={nodes}
        selectedIds={selectedIds}
        onDelete={handleDeleteFromMenu}
        onDuplicate={handleDuplicate}
      />
    </main>
  );
}
