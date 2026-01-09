// src/components/ContextMenu.js
import React from 'react';

const ContextMenu = ({ menu, onAction }) => {
  if (!menu) return null;

  return (
    <div 
      className="context-menu" 
      style={{ left: menu.left, top: menu.top, position: 'fixed' }} 
      onMouseDown={(e) => e.stopPropagation()} 
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 背景クリック or 線をドロップした時 */}
      {(menu.type === 'board' || menu.type === 'connection') && (
        <>
          <div style={{padding:'4px 12px', color:'#888', fontSize:'0.75rem'}}>New Evidence</div>
          <button onClick={() => onAction('addNode', 'note')}>📝 Note</button>
          <button onClick={() => onAction('addNode', 'photo')}>📷 Photo</button>
        </>
      )}

      {/* ノードを右クリックした時 */}
      {menu.type === 'node' && (
        <>
          <button onClick={() => onAction('edit')}>✏️ Edit Text</button>
          {menu.nodeType === 'photo' && (
             <button onClick={() => onAction('changePhoto')}>🖼 Change Image</button>
          )}
          <div className="menu-divider"></div>
          <button onClick={() => onAction('delete')} style={{color:'#ff6b6b'}}>🗑 Delete</button>
        </>
      )}
    </div>
  );
};

export default ContextMenu;