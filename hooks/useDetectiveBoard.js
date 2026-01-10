import { useCaseManagement } from './useCaseManagement';
import { useDrawingTools } from './useDrawingTools';
import { useBoardInteraction } from './useBoardInteraction';
import { useClipboardEvents } from './useClipboardEvents';
import { useNodeInteraction } from './useNodeInteraction';
import { useEdgeInteraction } from './useEdgeInteraction';
import { useMenuInteraction } from './useMenuInteraction';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useStore } from '../store/useStore';
import { useRef } from 'react';

export const useDetectiveBoard = () => {
  // ストアから状態と関数を取得
  const store = useStore();
  const { nodes, edges, keywords, drawings, view, activeSidebar, editingId, selectedIds, connectionDraft, menu, fullscreenImage, isDrawingMode, currentDrawing, penColor, drawingTool, isErasing, dragInfo } = store;
  const fileInputRef = useRef(null);

  // 各種フック
  const { currentCaseId, caseList, saveStatus, openCase: baseOpenCase, createCase, deleteCase, renameCase } = useCaseManagement();
  const { toggleDrawingMode, clearDrawings, eraseAt } = useDrawingTools();

  // 派生ステート
  const isNotebookOpen = activeSidebar === 'notebook';
  const isCaseManagerOpen = activeSidebar === 'case';

  // ボード操作ロジックのフック
  const { 
    isPanning, selectionBox, isSpacePressed,
    handleWheel, handleBoardMouseDown, handleMouseMove, handleMouseUp,
    snapshotRef, mouseDownData 
  } = useBoardInteraction({
    view, setView: store.setView,
    nodes, setNodes: store.setNodes,
    edges, setEdges: store.setEdges,
    drawings, setDrawings: store.setDrawings,
    selectedIds, setSelectedIds: store.setSelectedIds,
    setEditingId: store.setEditingId,
    setMenu: store.setMenu,
    connectionDraft, setConnectionDraft: store.setConnectionDraft,
    isDrawingMode,
    drawingTool,
    penColor,
    currentDrawing, setCurrentDrawing: store.setCurrentDrawing,
    isErasing, setIsErasing: store.setIsErasing,
    pushHistory: store.pushHistory,
    pushSpecificHistory: store.pushSpecificHistory,
    eraseAt,
    dragInfo, // ストアの値を渡す
    setDragInfo: store.setDragInfo // ストアの関数を渡す
  });

  // クリップボード＆ドラッグドロップ操作のフック
  const { handleDragOver, handleDrop } = useClipboardEvents({
    view,
    setNodes: store.setNodes,
    pushHistory: store.pushHistory,
    setSelectedIds: store.setSelectedIds,
    editingId
  });

  // ノード操作のフック
  const { nodeActions } = useNodeInteraction({
    nodes, setNodes: store.setNodes,
    edges, setEdges: store.setEdges,
    drawings,
    isDrawingMode,
    isSpacePressed,
    selectedIds, setSelectedIds: store.setSelectedIds,
    editingId, setEditingId: store.setEditingId,
    setMenu: store.setMenu,
    setDragInfo: store.setDragInfo, // ストアの関数を渡す
    connectionDraft, setConnectionDraft: store.setConnectionDraft,
    pushHistory: store.pushHistory,
    pushSpecificHistory: store.pushSpecificHistory,
    snapshotRef,
    mouseDownData,
    setFullscreenImage: store.setFullscreenImage,
    view
  });

  // エッジ操作のフック
  const { edgeActions } = useEdgeInteraction({
    edges,
    isDrawingMode,
    selectedIds, setSelectedIds: store.setSelectedIds,
    setMenu: store.setMenu,
    view
  });

  // メニュー操作のフック
  const { handleBoardContextMenu, handleImageUpload, menuAction } = useMenuInteraction({
    menu, setMenu: store.setMenu,
    nodes, setNodes: store.setNodes,
    edges, setEdges: store.setEdges,
    drawings, setDrawings: store.setDrawings,
    selectedIds, setSelectedIds: store.setSelectedIds,
    setEditingId: store.setEditingId,
    view,
    pushHistory: store.pushHistory,
    fileInputRef,
    setPenColor: store.setPenColor,
    setDrawingTool: store.setDrawingTool,
    setIsDrawingMode: store.setIsDrawingMode,
    isDrawingMode,
    drawingTool
  });

  // キーボードショートカットのフック
  useKeyboardShortcuts({
    editingId,
    setIsDrawingMode: store.setIsDrawingMode,
    selectedIds, setSelectedIds: store.setSelectedIds,
    pushHistory: store.pushHistory,
    setNodes: store.setNodes, setEdges: store.setEdges, setDrawings: store.setDrawings,
    undo: store.undo
  });

  // --- Case Actions ---
  const openCase = async (id) => {
    await baseOpenCase(id);
    store.setActiveSidebar(null);
  };

  const caseActions = {
    openCase, createCase, deleteCase, renameCase,
    toggleOpen: () => store.setActiveSidebar(prev => prev === 'case' ? null : 'case')
  };

  // --- Notebook Actions ---
  const notebookActions = {
    addKeyword: (text) => store.setKeywords(prev => [...prev, { id: Date.now(), text, active: true }]),
    deleteKeyword: (id) => store.setKeywords(prev => prev.filter(k => k.id !== id)),
    toggleKeyword: (id) => store.setKeywords(prev => prev.map(k => k.id === id ? { ...k, active: !k.active } : k)),
    toggleOpen: () => store.setActiveSidebar(prev => prev === 'notebook' ? null : 'notebook')
  };
  
  // ★描画アクション
  const drawingActions = {
    toggleDrawingMode,
    clearDrawings
  };

  return {
    nodes, edges, view, menu, keywords, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef, saveStatus,
    isNotebookOpen, isCaseManagerOpen,
    currentCaseId, caseList,
    drawings: drawings.map(d => ({ ...d, selected: selectedIds.has(d.id) })), currentDrawing, isDrawingMode, penColor, drawingTool,
    isSpacePressed, isPanning,
    dragInfo,
    fullscreenImage, setFullscreenImage: store.setFullscreenImage,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp, handleDragOver, handleDrop,
    notebookActions, nodeActions, edgeActions, menuAction, caseActions, handleImageUpload, drawingActions, // ★描画アクション
  };
};