import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { useDetectiveBoard } from './hooks/useDetectiveBoard';
import Node from './components/Node';
import ConnectionLayer from './components/ConnectionLayer';
import Notebook from './components/Notebook';
import ContextMenu from './components/ContextMenu';
import CaseManager from './components/CaseManager';
import DrawingLayer from './components/DrawingLayer'; // ★描画レイヤーを追加
import { Pencil, Trash2, Save, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { db } from './db';

// オプションをコンポーネントの外で定義して固定する（再レンダリング時のリロード防止）
const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
};

const FullscreenPdfViewer = ({ src, reloadToken, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [initialScale, setInitialScale] = useState(null);
  const containerRef = useRef(null);
  const [isInitialScaleSet, setIsInitialScaleSet] = useState(false);

useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadPdf = async () => {
      if (!src) return;
      setPdfData(null);

      if (src.startsWith('data:')) {
        if (isMounted) setPdfData(src);
        return;
      }

      let blob = null;

      if (!reloadToken) {
        try {
          const cached = await db.pdfCache.get(src);
          if (cached) blob = cached.blob;
        } catch (e) { console.error(e); }
      }

      if (!blob) {
        // ★ 修正ポイント: 環境変数からベースURLを取得し、末尾の / を除いて結合
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        
        const url = `${cleanBase}/api/proxy-pdf?url=${encodeURIComponent(src)}${reloadToken ? '&refresh=true' : ''}`;
        
        try {
          const res = await fetch(url);
          if (res.ok) {
            blob = await res.blob();
          }
        } catch (e) { console.error(e); }
      }

      if (isMounted && blob) {
        objectUrl = URL.createObjectURL(blob);
        setPdfData(objectUrl);
      }
    };
    loadPdf();
    return () => { 
      isMounted = false; 
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, reloadToken]);

  // srcが変わったら初期化
  useEffect(() => {
    setIsInitialScaleSet(false);
    setScale(1.0);
    setInitialScale(null);
  }, [src]);

  // Ctrl + ホイールでズーム
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY * -0.002;
    setScale(prev => Math.min(Math.max(0.1, prev + delta), 5.0));
  };

  // ページ読み込み完了時に枠に合わせてサイズ調整
  const onPageLoadSuccess = (page) => {
    if (!isInitialScaleSet && containerRef.current) {
      const viewport = page.getViewport({ scale: 1 });
      const containerHeight = containerRef.current.clientHeight;
      const containerWidth = containerRef.current.clientWidth;
      // パディング(40px)を考慮してフィットさせる
      const newScale = Math.min((containerHeight - 40) / viewport.height, (containerWidth - 40) / viewport.width);
      setScale(newScale);
      setInitialScale(newScale);
      setIsInitialScaleSet(true);
    }
  };

  return (
    <div style={{width: '90%', height: '90%', background: '#525659', display: 'flex', flexDirection: 'column', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 0 20px rgba(0,0,0,0.5)'}} onClick={e => e.stopPropagation()}>
      <div style={{background: '#333', padding: '10px', color: 'white', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center'}}>
         <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber<=1}>Prev</button>
         <span>{pageNumber} / {numPages || '--'}</span>
         <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber>=numPages}>Next</button>
         <div style={{width: '20px'}}></div>
         <button onClick={() => initialScale && setScale(initialScale)} disabled={!initialScale}>Reset Zoom</button>
         <div style={{flex: 1}}></div>
         <button onClick={onClose} style={{background: '#d63031', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '2px', cursor: 'pointer'}}>Close</button>
      </div>
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        style={{flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px'}}
      >
         {pdfData && (
           <Document file={pdfData} onLoadSuccess={({ numPages }) => setNumPages(numPages)} options={pdfOptions} onLoadError={(e) => console.error("Fullscreen PDF Error:", e)}>
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} onLoadSuccess={onPageLoadSuccess} />
           </Document>
         )}
         {!pdfData && <div style={{color: 'white', marginTop: '20px'}}>Loading PDF...</div>}
      </div>
    </div>
  );
};

function App() {
  const {
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
    <div className={`board ${isDrawingMode ? 'drawing-mode' : ''}`}
      onMouseDown={handleBoardMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel} onContextMenu={handleBoardContextMenu}
      onDragOver={handleDragOver} onDrop={handleDrop}
      style={{ 
        backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', 
        backgroundSize: `${20 * view.scale}px ${20 * view.scale}px`, 
        backgroundPosition: `${view.x}px ${view.y}px`,
        cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : (dragInfo?.type === 'move' ? 'move' : undefined))
      }}
    >
      <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={handleImageUpload} />
      
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              color: 'white', fontSize: '0.8rem', position: 'absolute', top: '10px', left: '50%',
              zIndex: 10, padding: '2px 8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', pointerEvents: 'none'
            }}
          >
            {saveStatus === 'saving' && <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Save size={14}/> Saving...</span>}
            {saveStatus === 'saved' && <span style={{display:'flex', alignItems:'center', gap:'4px'}}><Check size={14}/> Saved</span>}
            {saveStatus === 'error' && <span style={{display:'flex', alignItems:'center', gap:'4px'}}><X size={14}/> Error!</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ツールバー */}
      <div className="toolbar">
        <button 
          className={`tool-button ${isDrawingMode ? 'active' : ''}`}
          onClick={drawingActions.toggleDrawingMode}
          title="Toggle Drawing Mode (Esc)"
        >
          <Pencil size={20} />
        </button>
        {isDrawingMode && (
          <button
            className="tool-button"
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
      />

      {/* Notebook (サイドバー) */}
      <Notebook 
        isOpen={isNotebookOpen} onToggleOpen={notebookActions.toggleOpen}
        keywords={keywords} onAddKeyword={notebookActions.addKeyword} onDeleteKeyword={notebookActions.deleteKeyword} onToggleKeyword={notebookActions.toggleKeyword}
      />

      <div className="transform-layer" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <ConnectionLayer 
          edges={edges} nodes={nodes} connectionDraft={connectionDraft} menu={menu} 
          selectedIds={selectedIds}
          onEdgeMouseDown={edgeActions.onMouseDown}
          onEdgeContextMenu={edgeActions.onContextMenu}
        />
        
        {/* ★描画レイヤーをここに追加 */}
        <DrawingLayer drawings={drawings} currentDrawing={currentDrawing} scale={view.scale} />

        {selectionBox && (
          <div className="selection-box" style={{
            left: Math.min(selectionBox.startX, selectionBox.curX), top: Math.min(selectionBox.startY, selectionBox.curY),
            width: Math.abs(selectionBox.curX - selectionBox.startX), height: Math.abs(selectionBox.curY - selectionBox.startY),
          }} />
        )}
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
              onContentChange={nodeActions.onContentChange} onBlur={nodeActions.onBlur}
            />
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {menu && <ContextMenu menu={menu} onAction={menuAction} selectedIds={selectedIds} />}
      </AnimatePresence>
      
      {fullscreenContent && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'default'
          }}
          onClick={() => setFullscreenContent(null)}
          onWheel={(e) => e.stopPropagation()}
        >
          {fullscreenContent.type === 'photo' && (
            <img src={fullscreenContent.src} style={{maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', boxShadow: '0 0 20px rgba(0,0,0,0.5)'}} alt="Fullscreen" />
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
