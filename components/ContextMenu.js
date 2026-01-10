// src/components/ContextMenu.js
import React from 'react';
import { FolderPlus, StickyNote, Image, MapPin, Layout, Edit2, Trash2, PenTool, Eraser } from 'lucide-react';

const ContextMenu = ({ menu, onAction, selectedIds }) => {
  if (!menu) return null;

  const colors = ['#fff9c4', '#ffcdd2', '#c8e6c9', '#bbdefb', '#e1bee7', '#ffffff'];
  const penColors = ['#000000', '#e74c3c', '#2196f3', '#2ecc71', '#f1c40f', '#9b59b6'];
  const textColors = ['#000000', '#ffffff', '#d32f2f', '#1976d2', '#388e3c', '#fbc02d'];
  const fontSizes = ['12px', '16px', '20px', '24px', '32px', '48px', '64px'];

  return (
    <div 
      className="context-menu" 
      style={{ left: menu.left, top: menu.top, position: 'fixed' }} 
      onMouseDown={(e) => e.stopPropagation()} 
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 複数選択時の特別メニュー */}
      {selectedIds && selectedIds.size > 1 && (
        <>
          <button onClick={() => onAction('groupInFrame')} style={{display:'flex', alignItems:'center', gap:'6px'}}><FolderPlus size={14}/> Group in Frame</button>
          <div className="menu-divider"></div>
        </>
      )}

      {/* 背景クリック or 線をドロップした時 */}
      {(menu.type === 'board' || menu.type === 'connection') && (
        <>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>New Evidence</div>
          <button onClick={() => onAction('addNode', 'note')} style={{display:'flex', alignItems:'center', gap:'6px'}}><StickyNote size={14}/> Note</button>
          <button onClick={() => onAction('addNode', 'photo')} style={{display:'flex', alignItems:'center', gap:'6px'}}><Image size={14}/> Photo</button>
          <button onClick={() => onAction('addNode', 'pin')} style={{display:'flex', alignItems:'center', gap:'6px'}}><MapPin size={14}/> Pin</button>
          <button onClick={() => onAction('addNode', 'frame')} style={{display:'flex', alignItems:'center', gap:'6px'}}><Layout size={14}/> Frame</button>
        </>
      )}

      {/* ノードを右クリックした時 */}
      {menu.type === 'node' && (
        <>
          {menu.nodeType !== 'drawing' && menu.nodeType !== 'pin' && <button onClick={() => onAction('edit')} style={{display:'flex', alignItems:'center', gap:'6px'}}><Edit2 size={14}/> Edit Text</button>}
          {menu.nodeType === 'photo' && (
             <button onClick={() => onAction('changePhoto')} style={{display:'flex', alignItems:'center', gap:'6px'}}><Image size={14}/> Change Image</button>
          )}
          <div className="menu-divider"></div>
          {menu.nodeType !== 'drawing' && menu.nodeType !== 'pin' && <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Background</div>}
          {menu.nodeType === 'pin' && <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Pin Color</div>}
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {((menu.nodeType === 'drawing' || menu.nodeType === 'pin') ? penColors : colors).map(c => (
              <div 
                key={c}
                onClick={() => onAction('changeColor', c)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', 
                  backgroundColor: c, 
                  border: menu.currentColor === c ? '1px solid #2196f3' : '1px solid #ddd', 
                  cursor: 'pointer', transform: menu.currentColor === c ? 'scale(1.1)' : 'none'
                }}
              />
            ))}
            <div 
              onClick={() => onAction('changeColor', undefined)}
              style={{
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: 'transparent', border: !menu.currentColor ? '1px solid #2196f3' : '1px dashed #888', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555',
                transform: !menu.currentColor ? 'scale(1.1)' : 'none'
              }}
              title="Reset Color"
            >✕</div>
          </div>

          {menu.nodeType !== 'drawing' && menu.nodeType !== 'pin' && (
            <>
              <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Text</div>
              <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {textColors.map(c => (
                  <div 
                    key={c}
                    onClick={() => onAction('changeTextColor', c)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%', 
                      backgroundColor: c, 
                      border: menu.currentTextColor === c ? '1px solid #2196f3' : '1px solid #ddd', 
                      cursor: 'pointer', transform: menu.currentTextColor === c ? 'scale(1.1)' : 'none'
                    }}
                  />
                ))}
                <div 
                  onClick={() => onAction('changeTextColor', undefined)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%', 
                    backgroundColor: 'transparent', border: !menu.currentTextColor ? '1px solid #2196f3' : '1px dashed #888', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555',
                    transform: !menu.currentTextColor ? 'scale(1.1)' : 'none'
                  }}
                  title="Reset Text Color"
                >✕</div>
              </div>

              <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Font Size</div>
              <div style={{ padding: '8px 12px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%', 
                    backgroundColor: 'transparent', border: '1px dashed #888', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555'
                  }}
                  title="Reset Font Size"
                >✕</div>
              </div>
            </>
          )}
          <div className="menu-divider"></div>
          <button onClick={() => onAction('delete')} style={{color:'#ff6b6b', display:'flex', alignItems:'center', gap:'6px'}}><Trash2 size={14}/> Delete</button>
        </>
      )}

      {/* エッジを右クリックした時 */}
      {menu.type === 'edge' && (
        <>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Line Style</div>
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px' }}>
             <button onClick={() => onAction('changeEdgeStyle', 'solid')}>Solid</button>
             <button onClick={() => onAction('changeEdgeStyle', 'dashed')}>Dashed</button>
          </div>
          <div className="menu-divider"></div>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Line Color</div>
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {penColors.map(c => (
              <div 
                key={c}
                onClick={() => onAction('changeEdgeColor', c)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', 
                  backgroundColor: c, 
                  border: menu.currentColor === c ? '1px solid #2196f3' : '1px solid #ddd', 
                  cursor: 'pointer', transform: menu.currentColor === c ? 'scale(1.1)' : 'none'
                }}
              />
            ))}
             <div 
              onClick={() => onAction('changeEdgeColor', undefined)}
              style={{
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: 'transparent', border: !menu.currentColor ? '1px solid #2196f3' : '1px dashed #888', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555',
                transform: !menu.currentColor ? 'scale(1.1)' : 'none'
              }}
              title="Reset Color"
            >✕</div>
          </div>
          <div className="menu-divider"></div>
          <button onClick={() => onAction('addNode', 'pin')} style={{display:'flex', alignItems:'center', gap:'6px'}}><MapPin size={14}/> Add Pin</button>
          <div className="menu-divider"></div>
          <button onClick={() => onAction('delete')} style={{color:'#ff6b6b', display:'flex', alignItems:'center', gap:'6px'}}><Trash2 size={14}/> Delete Connection</button>
        </>
      )}


      {/* 描画モード中の右クリック */}
      {menu.type === 'drawing' && (
        <>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Tools</div>
          <button 
            onClick={() => onAction('setDrawingTool', 'pen')}
            style={{ fontWeight: menu.currentTool === 'pen' ? 'bold' : 'normal', display:'flex', alignItems:'center', gap:'6px' }}
          ><PenTool size={14}/> Pen</button>
          <button 
            onClick={() => onAction('setDrawingTool', 'eraser')}
            style={{ fontWeight: menu.currentTool === 'eraser' ? 'bold' : 'normal', display:'flex', alignItems:'center', gap:'6px' }}
          ><Eraser size={14}/> Eraser</button>
          <div className="menu-divider"></div>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Pen Color</div>
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {penColors.map(c => (
              <div 
                key={c}
                onClick={() => onAction('changePenColor', c)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', 
                  backgroundColor: c, border: '1px solid #ddd', cursor: 'pointer'
                }}
              />
            ))}
          </div>
          <div className="menu-divider"></div>
          <button onClick={() => onAction('exitDrawingMode')}>Exit Drawing Mode</button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;