import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './styles/themes.css';
import styles from './App.module.css';
import clsx from 'clsx';
import { useDetectiveBoard } from './hooks/board/useDetectiveBoard';
import Node from './components/node/Node';
import ConnectionLayer from './components/canvas/ConnectionLayer';
import Notebook from './components/sidebar/Notebook';
import ContextMenu from './components/ui/ContextMenu';
import CaseManager from './components/sidebar/CaseManager';
import DrawingLayer from './components/canvas/DrawingLayer'; // ★描画レイヤーを追加
import { Pencil, Trash2, Save, Check, X, Monitor, Trees } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FullscreenPdfViewer from './components/ui/FullscreenPdfViewer';
import FullscreenPhotoViewer from './components/ui/FullscreenPhotoViewer';

function App() {
  const {
    theme, setTheme,
    nodes, edges, view, menu, keywords, isNotebookOpen, editingId, selectedIds, connectionDraft, selectionBox, fileInputRef, saveStatus,
    isCaseManagerOpen, currentCaseId, caseList,
    drawings, currentDrawing, isDrawingMode, // ★描画state
    isSpacePressed, isPanning,
    dragInfo,
    fullscreenContent, setFullscreenContent,
    handleWheel, handleBoardMouseDown, handleBoardContextMenu, handleMouseMove, handleMouseUp, handleDragOver, handleDrop,
    notebookActions, nodeActions, edgeActions, menuAction, handleImageUpload, caseActions, drawingActions, // ★描画アクション
  } = useDetectiveBoard();

  return (
    <div 
      data-theme={theme}
      data-is-dragging={!!dragInfo}
      className={clsx(styles.board, { [styles.drawingMode]: isDrawingMode })}
      onMouseDown={handleBoardMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onContextMenu={handleBoardContextMenu}
      onDragOver={handleDragOver} onDrop={handleDrop}
      style={{ 
        backgroundImage: theme === 'modern' ? `radial-gradient(var(--board-dots) 1px, transparent 1px)` : `var(--board-bg-image)`, 
        backgroundSize: theme === 'modern' 
          ? `${20 * view.scale}px ${20 * view.scale}px` 
          : `${500 * view.scale}px auto`, 
        backgroundPosition: `${view.x}px ${view.y}px`,
        cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : (dragInfo?.type === 'move' ? 'move' : undefined))
      }}
    >
      {/* 特殊エフェクト用SVGフィルタ */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          {/* 毛糸の毛羽立ち */}
          <filter id="yarn-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
            <feGaussianBlur stdDeviation="0.3" />
          </filter>
          {/* コルクの表面の凹凸感 */}
          <filter id="cork-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0.1" />
            <feComponentTransfer>
              <feFuncR type="gamma" exponent="1.5" />
              <feFuncG type="gamma" exponent="1.5" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageUpload} />
      
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={styles.saveStatus}
          >
            {saveStatus === 'saving' && <><Save size={14}/> Saving...</>}
            {saveStatus === 'saved' && <><Check size={14}/> Saved</>}
            {saveStatus === 'error' && <><X size={14}/> Error!</>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ツールバー */}
      <div className={styles.toolbar}>
        <button 
          className={styles.toolButton}
          onClick={() => setTheme(theme === 'modern' ? 'retro' : 'modern')}
          title="Switch Theme"
        >
          {theme === 'modern' ? <Monitor size={20} /> : <Trees size={20} />}
        </button>
        <button 
          className={clsx(styles.toolButton, { [styles.toolButtonActive]: isDrawingMode })}
          onClick={drawingActions.toggleDrawingMode}
          title="Toggle Drawing Mode (Esc)"
        >
          <Pencil size={20} />
        </button>
        {isDrawingMode && (
          <button
            className={styles.toolButton}
            onClick={drawingActions.clearDrawings}
            title="Clear All Drawings"
          >
            <Trash2 size={20} />
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
        onCleanupCache={caseActions.cleanupUnusedCache}
        onShareCase={caseActions.shareCase}
        onImportCase={caseActions.importCase}
      />

      {/* Notebook (サイドバー) */}
      <Notebook 
        isOpen={isNotebookOpen} onToggleOpen={notebookActions.toggleOpen}
        keywords={keywords} onAddKeyword={notebookActions.addKeyword} onDeleteKeyword={notebookActions.deleteKeyword} onToggleKeyword={notebookActions.toggleKeyword}
      />

      <div className={styles.transformLayer} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <AnimatePresence>
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
              onImageDoubleClick={nodeActions.onImageDoubleClick}
              onContentChange={nodeActions.onContentChange} onBlur={nodeActions.onBlur}
            />
          ))}
        </AnimatePresence>

        <ConnectionLayer 
          edges={edges} nodes={nodes} connectionDraft={connectionDraft} menu={menu} 
          selectedIds={selectedIds}
          theme={theme}
          onEdgeMouseDown={edgeActions.onMouseDown}
          onEdgeContextMenu={edgeActions.onContextMenu}
        />
        
        {/* ★描画レイヤーをここに追加 */}
        <DrawingLayer drawings={drawings} currentDrawing={currentDrawing} scale={view.scale} />

        {selectionBox && (
          <div className={styles.selectionBox} style={{
            left: Math.min(selectionBox.startX, selectionBox.curX), top: Math.min(selectionBox.startY, selectionBox.curY),
            width: Math.abs(selectionBox.curX - selectionBox.startX), height: Math.abs(selectionBox.curY - selectionBox.startY),
          }} />
        )}
      </div>
      <AnimatePresence>
        {menu && <ContextMenu menu={menu} onAction={menuAction} selectedIds={selectedIds} />}
      </AnimatePresence>
      
      {fullscreenContent && (
        <div className={styles.fullscreenOverlay}
          onClick={() => setFullscreenContent(null)}
          onWheel={(e) => e.stopPropagation()}
        >
          {fullscreenContent.type === 'photo' && (
            <FullscreenPhotoViewer src={fullscreenContent.src} />
          )}
          {fullscreenContent.type === 'pdf' && (
            <FullscreenPdfViewer src={fullscreenContent.src} reloadToken={fullscreenContent.reloadToken} onClose={() => setFullscreenContent(null)} />
          )}
        </div>
      )}
    </div>
  );
}
export default App;
