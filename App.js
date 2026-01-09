import React from 'react';
import './App.css';
import { useDetectiveBoard } from './hooks/useDetectiveBoard';
import Node from './components/Node';
import ConnectionLayer from './components/ConnectionLayer';
import Notebook from './components/Notebook';
import ContextMenu from './components/ContextMenu';

function App() {
  const {
    nodes, edges, view, menu, keywords, isNotebookOpen, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp,
    notebookActions, nodeActions, menuAction, handleImageUpload
  } = useDetectiveBoard();

  return (
    <div className="board" 
      onMouseDown={handleBoardMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onContextMenu={handleBoardContextMenu}
      style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
    >
      <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageUpload} />
      
      <Notebook 
        isOpen={isNotebookOpen} onToggleOpen={notebookActions.toggleOpen}
        keywords={keywords} onAddKeyword={notebookActions.addKeyword} onDeleteKeyword={notebookActions.deleteKeyword} onToggleKeyword={notebookActions.toggleKeyword}
      />

      <div className="transform-layer" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <ConnectionLayer edges={edges} nodes={nodes} connectionDraft={connectionDraft} menu={menu} />
        {selectionBox && (
          <div className="selection-box" style={{
            left: Math.min(selectionBox.startX, selectionBox.curX), top: Math.min(selectionBox.startY, selectionBox.curY),
            width: Math.abs(selectionBox.curX - selectionBox.startX), height: Math.abs(selectionBox.curY - selectionBox.startY),
          }} />
        )}
        {nodes.map(node => (
          <Node
            key={node.id} node={node}
            isSelected={selectedIds.has(node.id)}
            isEditing={editingId === node.id}
            keywords={keywords}
            onMouseDown={nodeActions.onMouseDown} onContextMenu={nodeActions.onContextMenu} onDoubleClick={nodeActions.onDoubleClick}
            onPinMouseDown={nodeActions.onPinMouseDown} onPinMouseUp={nodeActions.onPinMouseUp}
            onRotateMouseDown={nodeActions.onRotateMouseDown} onRotateReset={nodeActions.onRotateReset}
            onResizeMouseDown={nodeActions.onResizeMouseDown}
            onContentChange={nodeActions.onContentChange} onBlur={nodeActions.onBlur}
          />
        ))}
      </div>
      <ContextMenu menu={menu} onAction={menuAction} />
    </div>
  );
}

export default App;