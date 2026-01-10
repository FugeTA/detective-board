import { useBoardState } from './useBoardState';
import { useCaseManagement } from './useCaseManagement';
import { useDrawingTools } from './useDrawingTools';
import { useBoardInteraction } from './useBoardInteraction';
import { useClipboardEvents } from './useClipboardEvents';
import { useNodeInteraction } from './useNodeInteraction';
import { useEdgeInteraction } from './useEdgeInteraction';
import { useMenuInteraction } from './useMenuInteraction';
import { useUIState } from './useUIState';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

export const useDetectiveBoard = () => {
  // モジュール化されたフックを使用
  const { nodes, setNodes, edges, setEdges, keywords, setKeywords, drawings, setDrawings, view, setView, history, pushHistory, pushSpecificHistory, undo, loadData } = useBoardState();
  const { activeSidebar, setActiveSidebar, editingId, setEditingId, selectedIds, setSelectedIds, connectionDraft, setConnectionDraft, menu, setMenu, fullscreenImage, setFullscreenImage, fileInputRef } = useUIState();
  const { currentCaseId, caseList, saveStatus, openCase: baseOpenCase, createCase, deleteCase, renameCase } = useCaseManagement({ nodes, edges, keywords, drawings, view, loadData });
  const { isDrawingMode, setIsDrawingMode, currentDrawing, setCurrentDrawing, penColor, setPenColor, drawingTool, setDrawingTool, isErasing, setIsErasing, toggleDrawingMode, clearDrawings, eraseAt } = useDrawingTools(pushHistory, setDrawings, view);

  // 派生ステート
  const isNotebookOpen = activeSidebar === 'notebook';
  const isCaseManagerOpen = activeSidebar === 'case';

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

  // クリップボード＆ドラッグドロップ操作のフック
  const { handleDragOver, handleDrop } = useClipboardEvents({
    view,
    setNodes,
    pushHistory,
    setSelectedIds,
    editingId
  });

  // ノード操作のフック
  const { nodeActions } = useNodeInteraction({
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
  });

  // エッジ操作のフック
  const { edgeActions } = useEdgeInteraction({
    edges,
    isDrawingMode,
    selectedIds, setSelectedIds,
    setMenu,
    view
  });

  // メニュー操作のフック
  const { handleBoardContextMenu, handleImageUpload, menuAction } = useMenuInteraction({
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
  });

  // キーボードショートカットのフック
  useKeyboardShortcuts({
    editingId,
    setIsDrawingMode,
    selectedIds, setSelectedIds,
    pushHistory,
    setNodes, setEdges, setDrawings,
    undo
  });

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

  return {
    nodes, edges, view, menu, keywords, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef, saveStatus,
    isNotebookOpen, isCaseManagerOpen,
    currentCaseId, caseList,
    drawings: drawings.map(d => ({ ...d, selected: selectedIds.has(d.id) })), currentDrawing, isDrawingMode, penColor, drawingTool, // ★描画用state
    isSpacePressed, isPanning,
    dragInfo,
    fullscreenImage, setFullscreenImage,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp, handleDragOver, handleDrop,
    notebookActions, nodeActions, edgeActions, menuAction, caseActions, handleImageUpload, drawingActions, // ★描画アクション
  };
};