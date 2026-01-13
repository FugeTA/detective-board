'use client';

import { db } from '@/lib/db';
import { ConnectionData, ConnectionDraft, DragInfo, History, NodeData, Theme, ViewState } from '@/types';
import { create } from 'zustand';

interface StoreState {
  nodes: NodeData[];
  connections: ConnectionData[];
  view: ViewState;
  selectedIds: Set<string>;
  dragInfo: DragInfo | null;
  history: History[];
  menu: { x: number; y: number; nodeId?: string } | null;
  connectionDraft: ConnectionDraft | null;
  theme: Theme;
  loadNodes: () => Promise<void>;
  addNode: (node: NodeData) => Promise<void>;
  removeNode: (id: string) => Promise<void>;
  addConnection: (conn: ConnectionData) => void;
  removeConnection: (id: string) => void;
  setNodes: (nodes: NodeData[] | ((prev: NodeData[]) => NodeData[])) => void;
  setConnections: (conns: ConnectionData[] | ((prev: ConnectionData[]) => ConnectionData[])) => void;
  setView: (view: ViewState | ((prev: ViewState) => ViewState)) => void;
  setSelectedIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setDragInfo: (dragInfo: DragInfo | null) => void;
  setMenu: (menu: { x: number; y: number; nodeId?: string } | null) => void;
  setConnectionDraft: (draft: ConnectionDraft | null) => void;
  pushHistory: () => void;
  undo: () => void;
  setTheme: (theme: Theme) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  nodes: [],
  connections: [],
  view: { x: 0, y: 0, scale: 1 },
  selectedIds: new Set(),
  dragInfo: null,
  history: [],
  menu: null,
  connectionDraft: null,
  theme: 'modern',
  loadNodes: async () => {
    const nodes = await db.nodes.toArray();
    set({ nodes });
  },
  addNode: async (node) => {
    await db.nodes.put(node);
    set((state) => ({
      nodes: [...state.nodes.filter((existing) => existing.id !== node.id), node],
    }));
  },
  removeNode: async (id) => {
    await db.nodes.delete(id);
    set((state) => ({ nodes: state.nodes.filter((node) => node.id !== id) }));
  },
  addConnection: (conn) => {
    set((state) => ({ connections: [...state.connections, conn] }));
  },
  removeConnection: (id) => {
    set((state) => ({ connections: state.connections.filter((c) => c.id !== id) }));
  },
  setNodes: (nodes) =>
    set((state) => ({ nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes })),
  setConnections: (conns) =>
    set((state) => ({ connections: typeof conns === 'function' ? conns(state.connections) : conns })),
  setView: (view) =>
    set((state) => ({ view: typeof view === 'function' ? view(state.view) : view })),
  setSelectedIds: (ids) =>
    set((state) => ({ selectedIds: typeof ids === 'function' ? ids(state.selectedIds) : ids })),
  setDragInfo: (dragInfo) => set({ dragInfo }),
  setMenu: (menu) => set({ menu }),
  setConnectionDraft: (draft) => set({ connectionDraft: draft }),
  pushHistory: () => {
    const { nodes, connections } = get();
    set((state) => ({
      history: [
        ...state.history.slice(-49),
        { nodes, connections, timestamp: Date.now() },
      ],
    }));
  },
  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    set({
      history: history.slice(0, -1),
      nodes: lastState.nodes,
      connections: lastState.connections,
    });
  },
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('detective-board-theme', theme);
    }
  },
}));
