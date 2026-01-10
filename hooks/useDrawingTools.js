import { useState } from 'react';

export const useDrawingTools = (pushHistory, setDrawings, view) => {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [penColor, setPenColor] = useState('#000000');
  const [drawingTool, setDrawingTool] = useState('pen');
  const [isErasing, setIsErasing] = useState(false);

  const toggleDrawingMode = () => setIsDrawingMode(prev => !prev);

  const clearDrawings = () => {
    if (window.confirm('すべての手書き線を消去しますか？')) {
      pushHistory();
      setDrawings([]);
    }
  };

  const eraseAt = (clientX, clientY) => {
    const worldX = (clientX - view.x) / view.scale;
    const worldY = (clientY - view.y) / view.scale;
    const threshold = 20 / view.scale;

    setDrawings(prev => {
      const remaining = prev.filter(d => {
        return !d.points.some(p => Math.hypot(p.x - worldX, p.y - worldY) < threshold);
      });
      return remaining.length !== prev.length ? remaining : prev;
    });
  };

  return {
    isDrawingMode, setIsDrawingMode, currentDrawing, setCurrentDrawing, penColor, setPenColor, drawingTool, setDrawingTool, isErasing, setIsErasing, toggleDrawingMode, clearDrawings, eraseAt
  };
};