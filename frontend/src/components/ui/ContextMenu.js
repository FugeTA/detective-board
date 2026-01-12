// src/components/ContextMenu.js
import React from 'react';
import { FolderPlus, StickyNote, Image, MapPin, Layout, Edit2, Trash2, PenTool, Eraser, RefreshCw } from 'lucide-react';
import styles from './ContextMenu.module.css';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const ContextMenu = ({ menu, onAction, selectedIds }) => {
  const colors = ['#fff9c4', '#ffcdd2', '#c8e6c9', '#bbdefb', '#e1bee7', '#ffffff'];
  const penColors = ['#000000', '#e74c3c', '#2196f3', '#2ecc71', '#f1c40f', '#9b59b6'];
  const textColors = ['#000000', '#ffffff', '#d32f2f', '#1976d2', '#388e3c', '#fbc02d'];
  const fontSizes = ['12px', '16px', '20px', '24px', '32px', '48px', '64px'];

  return (
    <motion.div 
      className={styles.menu} 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.1 }}
      style={{ left: menu.left, top: menu.top }} 
      onMouseDown={(e) => e.stopPropagation()} 
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 複数選択時の特別メニュー */}
      {selectedIds && selectedIds.size > 1 && (
        <>
          <button className={styles.button} onClick={() => onAction('groupInFrame')}><FolderPlus size={14}/> Group in Frame</button>
          <div className={styles.divider}></div>
        </>
      )}

      {/* 背景クリック or 線をドロップした時 */}
      {(menu.type === 'board' || menu.type === 'connection') && (
        <>
          <div className={styles.label}>New Evidence</div>
          <button className={styles.button} onClick={() => onAction('addNode', 'note')}><StickyNote size={14}/> Note</button>
          <button className={styles.button} onClick={() => onAction('addNode', 'photo')}><Image size={14}/> Photo</button>
          <button className={styles.button} onClick={() => onAction('addNode', 'pin')}><MapPin size={14}/> Pin</button>
          <button className={styles.button} onClick={() => onAction('addNode', 'frame')}><Layout size={14}/> Frame</button>
        </>
      )}

      {/* ノードを右クリックした時 */}
      {menu.type === 'node' && (
        <>
          {menu.nodeType !== 'drawing' && menu.nodeType !== 'pin' && <button className={styles.button} onClick={() => onAction('edit')}><Edit2 size={14}/> Edit Text</button>}
          {menu.nodeType === 'photo' && (
             <button className={styles.button} onClick={() => onAction('changePhoto')}><Image size={14}/> Change Image</button>
          )}
          {menu.nodeType === 'pdf' && (
             <button className={styles.button} onClick={() => onAction('reloadPdf')}><RefreshCw size={14}/> Reload PDF</button>
          )}
          <div className={styles.divider}></div>
          {menu.nodeType !== 'drawing' && menu.nodeType !== 'pin' && <div className={styles.label}>Background</div>}
          {menu.nodeType === 'pin' && <div className={styles.label}>Pin Color</div>}
          <div className={styles.colorGrid}>
            {((menu.nodeType === 'drawing' || menu.nodeType === 'pin') ? penColors : colors).map(c => (
              <div 
                key={c}
                onClick={() => onAction('changeColor', c)}
                className={clsx(styles.colorCircle, { [styles.colorCircleActive]: menu.currentColor === c })}
                style={{ backgroundColor: c }}
              />
            ))}
            <div 
              onClick={() => onAction('changeColor', undefined)}
              className={clsx(styles.colorCircle, styles.resetCircle, { [styles.colorCircleActive]: !menu.currentColor })}
              title="Reset Color"
            >✕</div>
          </div>

          {menu.nodeType !== 'drawing' && menu.nodeType !== 'pin' && (
            <>
              <div className={styles.label}>Text</div>
              <div className={styles.colorGrid}>
                {textColors.map(c => (
                  <div 
                    key={c}
                    onClick={() => onAction('changeTextColor', c)}
                    className={clsx(styles.colorCircle, { [styles.colorCircleActive]: menu.currentTextColor === c })}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div 
                  onClick={() => onAction('changeTextColor', undefined)}
                  className={clsx(styles.colorCircle, styles.resetCircle, { [styles.colorCircleActive]: !menu.currentTextColor })}
                  title="Reset Text Color"
                >✕</div>
              </div>

              <div className={styles.label}>Font Size</div>
              <div className={styles.fontSizeGrid}>
                {fontSizes.map(size => (
                  <button 
                    key={size} 
                    onClick={() => onAction('changeFontSize', size)}
                    style={{ 
                      fontSize: '12px', padding: '2px 6px', minWidth: '24px', cursor: 'pointer', width: 'auto',
                      backgroundColor: menu.currentFontSize === size ? '#2196f3' : '#f0f0f0',
                      color: menu.currentFontSize === size ? '#fff' : '#000',
                      border: '1px solid #ccc'
                    }}
                  >
                    {size.replace('px', '')}
                  </button>
                ))}
                <div 
                  onClick={() => onAction('changeFontSize', undefined)}
                  className={clsx(styles.colorCircle, styles.resetCircle)}
                  title="Reset Font Size"
                >✕</div>
              </div>
            </>
          )}
          <div className={styles.divider}></div>
          <button className={clsx(styles.button, styles.deleteButton)} onClick={() => onAction('delete')}><Trash2 size={14}/> Delete</button>
        </>
      )}

      {/* エッジを右クリックした時 */}
      {menu.type === 'edge' && (
        <>
          <div className={styles.label}>Line Style</div>
          <div className={styles.colorGrid}>
             <button className={styles.button} onClick={() => onAction('changeEdgeStyle', 'solid')}>Solid</button>
             <button className={styles.button} onClick={() => onAction('changeEdgeStyle', 'dashed')}>Dashed</button>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.label}>Line Color</div>
          <div className={styles.colorGrid}>
            {penColors.map(c => (
              <div 
                key={c}
                onClick={() => onAction('changeEdgeColor', c)}
                className={clsx(styles.colorCircle, { [styles.colorCircleActive]: menu.currentColor === c })}
                style={{ backgroundColor: c }}
              />
            ))}
             <div 
              onClick={() => onAction('changeEdgeColor', undefined)}
              className={clsx(styles.colorCircle, styles.resetCircle, { [styles.colorCircleActive]: !menu.currentColor })}
              title="Reset Color"
            >✕</div>
          </div>
          <div className={styles.divider}></div>
          <button className={styles.button} onClick={() => onAction('addNode', 'pin')}><MapPin size={14}/> Add Pin</button>
          <div className={styles.divider}></div>
          <button className={clsx(styles.button, styles.deleteButton)} onClick={() => onAction('delete')}><Trash2 size={14}/> Delete Connection</button>
        </>
      )}


      {/* 描画モード中の右クリック */}
      {menu.type === 'drawing' && (
        <>
          <div className={styles.label}>Tools</div>
          <button 
            className={styles.button}
            onClick={() => onAction('setDrawingTool', 'pen')}
            style={{ fontWeight: menu.currentTool === 'pen' ? 'bold' : 'normal' }}
          ><PenTool size={14}/> Pen</button>
          <button 
            className={styles.button}
            onClick={() => onAction('setDrawingTool', 'eraser')}
            style={{ fontWeight: menu.currentTool === 'eraser' ? 'bold' : 'normal' }}
          ><Eraser size={14}/> Eraser</button>
          <div className={styles.divider}></div>
          <div className={styles.label}>Pen Color</div>
          <div className={styles.colorGrid}>
            {penColors.map(c => (
              <div key={c} onClick={() => onAction('changePenColor', c)} className={styles.colorCircle} style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className={styles.divider}></div>
          <button className={styles.button} onClick={() => onAction('exitDrawingMode')}>Exit Drawing Mode</button>
        </>
      )}
    </motion.div>
  );
};

export default ContextMenu;