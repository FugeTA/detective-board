// src/components/ContextMenu.js
import React from 'react';

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
          <button onClick={() => onAction('groupInFrame')}>🗂️ Group in Frame</button>
          <div className="menu-divider"></div>
        </>
      )}

      {/* 背景クリック or 線をドロップした時 */}
      {(menu.type === 'board' || menu.type === 'connection') && (
        <>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>New Evidence</div>
          <button onClick={() => onAction('addNode', 'note')}>📝 Note</button>
          <button onClick={() => onAction('addNode', 'photo')}>📷 Photo</button>
          <button onClick={() => onAction('addNode', 'frame')}>🖼️ Frame</button>
        </>
      )}

      {/* ノードを右クリックした時 */}
      {menu.type === 'node' && (
        <>
          {menu.nodeType !== 'drawing' && <button onClick={() => onAction('edit')}>✏️ Edit Text</button>}
          {menu.nodeType === 'photo' && (
             <button onClick={() => onAction('changePhoto')}>🖼 Change Image</button>
          )}
          <div className="menu-divider"></div>
          {menu.nodeType !== 'drawing' && <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Background</div>}
          <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(menu.nodeType === 'drawing' ? penColors : colors).map(c => (
              <div 
                key={c}
                onClick={() => onAction('changeColor', c)}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', 
                  backgroundColor: c, 
                  border: menu.currentColor === c ? '2px solid #2196f3' : '1px solid #ddd', 
                  cursor: 'pointer', transform: menu.currentColor === c ? 'scale(1.1)' : 'none'
                }}
              />
            ))}
            <div 
              onClick={() => onAction('changeColor', undefined)}
              style={{
                width: '20px', height: '20px', borderRadius: '50%', 
                backgroundColor: 'transparent', border: !menu.currentColor ? '2px solid #2196f3' : '1px dashed #888', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555',
                transform: !menu.currentColor ? 'scale(1.1)' : 'none'
              }}
              title="Reset Color"
            >✕</div>
          </div>

          {menu.nodeType !== 'drawing' && (
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
                      border: menu.currentTextColor === c ? '2px solid #2196f3' : '1px solid #ddd', 
                      cursor: 'pointer', transform: menu.currentTextColor === c ? 'scale(1.1)' : 'none'
                    }}
                  />
                ))}
                <div 
                  onClick={() => onAction('changeTextColor', undefined)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%', 
                    backgroundColor: 'transparent', border: !menu.currentTextColor ? '2px solid #2196f3' : '1px dashed #888', cursor: 'pointer',
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
          <button onClick={() => onAction('delete')} style={{color:'#ff6b6b'}}>🗑 Delete</button>
        </>
      )}

      {/* 描画モード中の右クリック */}
      {menu.type === 'drawing' && (
        <>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>Tools</div>
          <button 
            onClick={() => onAction('setDrawingTool', 'pen')}
            style={{ fontWeight: menu.currentTool === 'pen' ? 'bold' : 'normal' }}
          >✏️ Pen</button>
          <button 
            onClick={() => onAction('setDrawingTool', 'eraser')}
            style={{ fontWeight: menu.currentTool === 'eraser' ? 'bold' : 'normal' }}
          >🧹 Eraser</button>
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