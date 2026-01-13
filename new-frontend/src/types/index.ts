export type Theme = "modern" | "retro";
export type NodeType = "text" | "image" | "pdf" | "audio" | "video";

export interface ThemeColors {
  bgColor: string;
  boardBg: string;
  boardBgImage: string;
  boardDots: string;
  nodeBg: string;
  nodeText: string;
  nodeBorder: string;
  nodeShadow: string;
  accentColor: string;
  connectionColor: string;
  fontMain: string;
  pinColor: string;
  pinBorder: string;
}

export const THEME_PRESETS: Record<Theme, ThemeColors> = {
  modern: {
    bgColor: '#2c2c2c',
    boardBg: '#2c2c2c',
    boardBgImage: 'none',
    boardDots: '#444',
    nodeBg: '#ffffff',
    nodeText: '#333333',
    nodeBorder: '1px solid #ccc',
    nodeShadow: '5px 10px 15px rgba(0, 0, 0, 0.5)',
    accentColor: '#00d2ff',
    connectionColor: '#d63031',
    fontMain: "'Inter', 'Segoe UI', sans-serif",
    pinColor: '#d32f2f',
    pinBorder: '2px solid rgba(0, 0, 0, 0.2)',
  },
  retro: {
    bgColor: '#5d4037',
    boardBg: '#bc9b6a',
    boardBgImage: "url('/assets/back_board.jpg')",
    boardDots: 'transparent',
    nodeBg: '#fff9c4',
    nodeText: '#212121',
    nodeBorder: '1px solid #bcaaa4',
    nodeShadow: '2px 4px 8px rgba(0, 0, 0, 0.3)',
    accentColor: '#d32f2f',
    connectionColor: '#d32f2f',
    fontMain: "'Special Elite', system-ui, serif",
    pinColor: 'radial-gradient(circle at 30% 30%, #ff6b6b, #c0392b)',
    pinBorder: '1px solid #a93226',
  },
};

export interface Vec2 {
  x: number;
  y: number;
}

export interface ViewState {
  x: number;
  y: number;
  scale: number;
}

export interface NodeData {
  id: string;
  type: NodeType;
  position: Vec2;
  title: string;
  width?: number;
  height?: number;
  rotation?: number;
  content?: string;
  fileHash?: string;
  metadata?: Record<string, unknown>;
}

export interface DragInfo {
  type: 'move' | 'resize' | 'rotate' | 'connect';
  id: string;
  startX: number;
  startY: number;
  initialNode?: NodeData;
  initialPosition?: Vec2;
  initialSize?: { width: number; height: number };
  initialRotation?: number;
  resizeHandle?: 'nw' | 'ne' | 'sw' | 'se' | 'e' | 'w' | 'n' | 's';
  centerX?: number;
  centerY?: number;
  startAngle?: number;
  fromNodeId?: string;
}

export interface ConnectionData {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  style?: 'solid' | 'dashed';
  color?: string;
}

export interface ConnectionDraft {
  sourceId: string;
  startX: number;
  startY: number;
  currX: number;
  currY: number;
}

export interface CaseData {
  id: string;
  name: string;
  updatedAt?: number;
}

export interface SaveData {
  id: string;
  nodes: NodeData[];
  connections: ConnectionData[];
  updatedAt: number;
}

export interface History {
  nodes: NodeData[];
  connections: ConnectionData[];
  timestamp: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}
