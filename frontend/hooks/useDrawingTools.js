import { useStore } from '../store/useStore';

export const useDrawingTools = () => {
  const {
    isDrawingMode, setIsDrawingMode,
    currentDrawing, setCurrentDrawing,
    penColor, setPenColor,
    drawingTool, setDrawingTool,
    isErasing, setIsErasing,
    pushHistory,
    setDrawings,
    view
  } = useStore();

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