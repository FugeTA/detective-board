import React from 'react';
import './App.css';
import { useDetectiveBoard } from './hooks/useDetectiveBoard';
import Node from './components/Node';
import ConnectionLayer from './components/ConnectionLayer';
import Notebook from './components/Notebook';
import ContextMenu from './components/ContextMenu';
import CaseManager from './components/CaseManager'; // ★追加

function App() {
  const {
    nodes, edges, view, menu, keywords, isNotebookOpen, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef, saveStatus,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp,
    notebookActions, nodeActions, menuAction, handleImageUpload,
    // ★追加
    isCaseManagerOpen, currentCaseId, caseList, caseActions
  } = useDetectiveBoard();

  return (
    <div className="board" 
      onMouseDown={handleBoardMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onContextMenu={handleBoardContextMenu}
      style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
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
        {/* ツールバーのボタンはCaseManagerとNotebookに内蔵するUIに変えたため、空にしています */}
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
      {/* CaseManagerとボタンが被らないように、少し位置をずらすスタイルを適用する必要があります */}
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
            isSelected={selectedIds.has(node.id)} isEditing={editingId === node.id}
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
