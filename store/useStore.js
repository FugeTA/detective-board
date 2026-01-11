import { create } from 'zustand';
import { generateId } from '../utils/id';

export const useStore = create((set, get) => ({
  // --- Board Data ---
  nodes: [
    { id: 1, x: 100, y: 150, width: 220, height: 260, type: 'photo', content: 'Suspect A', imageSrc: null, rotation: -5, parentId: null },
  ],
  edges: [],
  keywords: [],
  drawings: [],
  view: { x: 0, y: 0, scale: 1 },
  history: [],

  // --- UI State ---
  activeSidebar: null,
  editingId: null,
  selectedIds: new Set(),
  connectionDraft: null,
  menu: null,
  fullscreenContent: null,
  dragInfo: null,
  
  // --- Drawing Tools State ---
  isDrawingMode: false,
  currentDrawing: null,
  penColor: '#000000',
  drawingTool: 'pen',
  isErasing: false,

  // --- Setters (Functional updates supported) ---
  setNodes: (nodes) => set(state => ({ nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes })),
  setEdges: (edges) => set(state => ({ edges: typeof edges === 'function' ? edges(state.edges) : edges })),
  setKeywords: (keywords) => set(state => ({ keywords: typeof keywords === 'function' ? keywords(state.keywords) : keywords })),
  setDrawings: (drawings) => set(state => ({ drawings: typeof drawings === 'function' ? drawings(state.drawings) : drawings })),
  setView: (view) => set(state => ({ view: typeof view === 'function' ? view(state.view) : view })),
  
  setActiveSidebar: (activeSidebar) => set(state => ({ activeSidebar: typeof activeSidebar === 'function' ? activeSidebar(state.activeSidebar) : activeSidebar })),
  setEditingId: (editingId) => set({ editingId }),
  setSelectedIds: (selectedIds) => set(state => ({ selectedIds: typeof selectedIds === 'function' ? selectedIds(state.selectedIds) : selectedIds })),
  setConnectionDraft: (connectionDraft) => set(state => ({ connectionDraft: typeof connectionDraft === 'function' ? connectionDraft(state.connectionDraft) : connectionDraft })),
  setMenu: (menu) => set(state => ({ menu: typeof menu === 'function' ? menu(state.menu) : menu })),
  setFullscreenContent: (fullscreenContent) => set({ fullscreenContent }),
  setDragInfo: (dragInfo) => set(state => ({ dragInfo: typeof dragInfo === 'function' ? dragInfo(state.dragInfo) : dragInfo })),

  setIsDrawingMode: (isDrawingMode) => set(state => ({ isDrawingMode: typeof isDrawingMode === 'function' ? isDrawingMode(state.isDrawingMode) : isDrawingMode })),
  setCurrentDrawing: (currentDrawing) => set(state => ({ currentDrawing: typeof currentDrawing === 'function' ? currentDrawing(state.currentDrawing) : currentDrawing })),
  setPenColor: (penColor) => set({ penColor }),
  setDrawingTool: (drawingTool) => set({ drawingTool }),
  setIsErasing: (isErasing) => set(state => ({ isErasing: typeof isErasing === 'function' ? isErasing(state.isErasing) : isErasing })),

  // --- Actions ---
  pushHistory: () => {
    const { nodes, edges, drawings, history } = get();
    set({ history: [...history.slice(-49), { nodes, edges, drawings }] });
  },
  pushSpecificHistory: (nodes, edges, drawings) => {
    const { history } = get();
    set({ history: [...history.slice(-49), { nodes, edges, drawings }] });
  },
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      nodes: lastState.nodes,
      edges: lastState.edges,
      drawings: lastState.drawings
    });
  },
  loadData: (data) => {
    set({
      nodes: data.nodes || [],
      edges: (data.edges || []).map(e => e.id ? e : { ...e, id: generateId('edge') }),
      keywords: data.keywords || [],
      drawings: data.drawings || [],
      view: data.view || { x: 0, y: 0, scale: 1 },
      history: []
    });
  }
}));