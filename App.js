import React from 'react';
import './App.css';
import { useDetectiveBoard } from './hooks/useDetectiveBoard';
import Node from './components/Node';
import ConnectionLayer from './components/ConnectionLayer';
import Notebook from './components/Notebook';
import ContextMenu from './components/ContextMenu';
import CaseManager from './components/CaseManager';
import DrawingLayer from './components/DrawingLayer'; // ★描画レイヤーを追加

function App() {
  const {
    nodes, edges, view, menu, keywords, isNotebookOpen, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef, saveStatus,
    isCaseManagerOpen, currentCaseId, caseList,
    drawings, currentDrawing, isDrawingMode, // ★描画state
    isSpacePressed, isPanning,
    dragInfo,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp,
    notebookActions, nodeActions, menuAction, handleImageUpload, caseActions, drawingActions, // ★描画アクション
  } = useDetectiveBoard();

  return (
    <div className={`board ${isDrawingMode ? 'drawing-mode' : ''}`}
      onMouseDown={handleBoardMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onContextMenu={handleBoardContextMenu}
      style={{ 
        backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
        backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`, 
        backgroundPosition: `${view.x}px ${view.y}px`,
        cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : (dragInfo?.type === 'move' ? 'move' : undefined))
      }}
    >
      <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageUpload} />
      
      <div style={{
        color: 'white',
        fontSize: '0.8rem',
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        padding: '2px 8px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: '10px',
        pointerEvents: 'none'
      }}>
        {saveStatus === 'saving' && '💾 Saving...'}
        {saveStatus === 'saved' && '✅ Saved'}
        {saveStatus === 'error' && '❌ Error!'}
      </div>

      {/* ツールバー */}
      <div className="toolbar">
        <button 
          className={`tool-button ${isDrawingMode ? 'active' : ''}`}
          onClick={drawingActions.toggleDrawingMode}
          title="Toggle Drawing Mode (Esc)"
        >
          ✏️
        </button>
        {isDrawingMode && (
          <button
            className="tool-button"
            onClick={drawingActions.clearDrawings}
            title="Clear All Drawings"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Case Manager (サイドバー) */}
      <CaseManager 
        isOpen={isCaseManagerOpen}
        onToggleOpen={caseActions.toggleOpen}
        cases={caseList}
        currentCaseId={currentCaseId}
        onOpenCase={caseActions.openCase}
        onCreateCase={caseActions.createCase}
        onDeleteCase={caseActions.deleteCase}
        onRenameCase={caseActions.renameCase}
      />

      {/* Notebook (サイドバー) */}
      <Notebook 
        isOpen={isNotebookOpen} onToggleOpen={notebookActions.toggleOpen}
        keywords={keywords} onAddKeyword={notebookActions.addKeyword} onDeleteKeyword={notebookActions.deleteKeyword} onToggleKeyword={notebookActions.toggleKeyword}
      />

      <div className="transform-layer" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <ConnectionLayer edges={edges} nodes={nodes} connectionDraft={connectionDraft} menu={menu} />
        
        {/* ★描画レイヤーをここに追加 */}
        <DrawingLayer drawings={drawings} currentDrawing={currentDrawing} scale={view.scale} />

        {selectionBox && (
          <div className="selection-box" style={{
            left: Math.min(selectionBox.startX, selectionBox.curX), top: Math.min(selectionBox.startY, selectionBox.curY),
            width: Math.abs(selectionBox.curX - selectionBox.startX), height: Math.abs(selectionBox.curY - selectionBox.startY),
          }} />
        )}
        {[...nodes].sort((a, b) => {
          if (a.type === 'frame' && b.type !== 'frame') return -1;
          if (a.type !== 'frame' && b.type === 'frame') return 1;
          return 0;
        }).map(node => (
          <Node
            key={node.id} node={node}
            isSelected={selectedIds.has(node.id)} isEditing={editingId === node.id}
            keywords={keywords}
            isSpacePressed={isSpacePressed}
            isDragging={dragInfo?.type === 'move'}
            onMouseDown={nodeActions.onMouseDown} onContextMenu={nodeActions.onContextMenu} onDoubleClick={nodeActions.onDoubleClick}
            onPinMouseDown={nodeActions.onPinMouseDown} onPinMouseUp={nodeActions.onPinMouseUp}
            onRotateMouseDown={nodeActions.onRotateMouseDown} onRotateReset={nodeActions.onRotateReset}
            onResizeMouseDown={nodeActions.onResizeMouseDown}
            onContentChange={nodeActions.onContentChange} onBlur={nodeActions.onBlur}
          />
        ))}
      </div>
      <ContextMenu menu={menu} onAction={menuAction} selectedIds={selectedIds} />
    </div>
  );
}
export default App;
