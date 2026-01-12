// src/hooks/useDrawing.js
import { useState, useCallback } from 'react';
import { generateId } from '../utils/id';

export const useDrawing = (view, scale, penColor = '#ff3b30') => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);

  const startDrawing = (e) => {
    if (e.button !== 0) return; // 左クリックのみ
    e.stopPropagation();
    setIsDrawing(true);

    // グローバル座標をローカル（SVG内）座標に変換
    const x = (e.clientX - view.x) / scale;
    const y = (e.clientY - view.y) / scale;
    
    setCurrentPath({
      id: generateId('path'),
      points: [`M ${x},${y}`], // Move to
      color: penColor,
      strokeWidth: 3 / scale, // ズームしても線の太さが同じに見えるように調整
    });
  };

  const draw = (e) => {
    if (!isDrawing || !currentPath) return;
    e.stopPropagation();

    const x = (e.clientX - view.x) / scale;
    const y = (e.clientY - view.y) / scale;

    setCurrentPath(prev => ({
      ...prev,
      points: [...prev.points, `L ${x},${y}`] // Line to
    }));
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath && currentPath.points.length > 1) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath(null);
  };
  
  const clearDrawing = () => {
    setPaths([]);
  };

  return {
    isDrawing,
    paths,
    currentPath,
    startDrawing,
    draw,
    endDrawing,
    clearDrawing,
    setPaths //
  };
};
