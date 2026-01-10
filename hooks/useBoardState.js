import { useState, useCallback } from 'react';
import { generateId } from '../utils/id';

export const DEFAULT_STATE = {
  nodes: [
    { id: 1, x: 100, y: 150, width: 220, height: 260, type: 'photo', content: 'Suspect A', imageSrc: null, rotation: -5, parentId: null },
  ],
  edges: [],
  keywords: [],
  drawings: [],
  view: { x: 0, y: 0, scale: 1 }
};

export const useBoardState = () => {
  const [nodes, setNodes] = useState(DEFAULT_STATE.nodes);
  const [edges, setEdges] = useState(DEFAULT_STATE.edges);
  const [keywords, setKeywords] = useState(DEFAULT_STATE.keywords);
  const [drawings, setDrawings] = useState(DEFAULT_STATE.drawings);
  const [view, setView] = useState(DEFAULT_STATE.view);
  const [history, setHistory] = useState([]);

  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-49), { nodes, edges, drawings }]);
  }, [nodes, edges, drawings]);

  const pushSpecificHistory = useCallback((pastNodes, pastEdges, pastDrawings) => {
    setHistory(prev => [...prev.slice(-49), { nodes: pastNodes, edges: pastEdges, drawings: pastDrawings }]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
    setDrawings(lastState.drawings);
  }, [history]);

  const loadData = useCallback((data) => {
    setNodes(data.nodes || []);
    setEdges((data.edges || []).map(e => e.id ? e : { ...e, id: generateId('edge') }));
    setKeywords(data.keywords || []);
    setDrawings(data.drawings || []);
    setView(data.view || { x: 0, y: 0, scale: 1 });
    setHistory([]);
  }, []);

  return { nodes, setNodes, edges, setEdges, keywords, setKeywords, drawings, setDrawings, view, setView, history, pushHistory, pushSpecificHistory, undo, loadData };
};