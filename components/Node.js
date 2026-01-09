// src/components/Node.js
import React from 'react';

// ハイライト処理用コンポーネント
const HighlightedContent = ({ text, keywords }) => {
  if (!text) return <span style={{opacity:0.5}}>(Empty)</span>;
  
  const activeKeywords = keywords.filter(k => k.active).map(k => k.text).filter(t => t.length > 0);
  if (activeKeywords.length === 0) return text;

  const regex = new RegExp(`(${activeKeywords.join('|')})`, 'gi');
  return text.split(regex).map((part, i) => {
    if (activeKeywords.some(k => k.toLowerCase() === part.toLowerCase())) {
      return <span key={i} className="highlight-match">{part}</span>;
    }
    return part;
  });
};

const Node = ({ 
  node, 
  isSelected, 
  isEditing, 
  keywords,
  // イベントハンドラ
  onMouseDown, 
  onContextMenu, 
  onDoubleClick, 
  onPinMouseDown, 
  onPinMouseUp, 
  onRotateMouseDown, 
  onRotateReset, 
  onResizeMouseDown, 
  onContentChange, 
  onBlur 
}) => {
  return (
    <div 
      className={`node ${node.type} ${isSelected ? 'selected' : ''}`} 
      style={{ 
        left: node.x, top: node.y, width: node.width, height: node.height,
        transform: `rotate(${node.rotation || 0}deg)`
      }}
      onMouseDown={(e) => onMouseDown(e, node)}
      onContextMenu={(e) => onContextMenu(e, node)}
      onDoubleClick={(e) => onDoubleClick(e, node.id)}
    >
      <div 
        className="pin" 
        onMouseDown={(e) => onPinMouseDown(e, node.id)} 
        onMouseUp={(e) => onPinMouseUp(e, node.id)}
      ></div>
      
      <div 
        className="rotate-handle" 
        onMouseDown={(e) => onRotateMouseDown(e, node)} 
        onDoubleClick={(e) => onRotateReset(e, node.id)} 
        title="Drag to rotate, Double-click to reset"
      >↻</div>
      
      <div className="resize-handle" onMouseDown={(e) => onResizeMouseDown(e, node)} ></div>

      {node.type === 'photo' && (
        <div 
          className={`photo-inner ${node.imageSrc ? 'has-image' : ''}`} 
          style={{ 
            aspectRatio: node.aspectRatio ? `${node.aspectRatio} / 1` : 'auto', 
            backgroundImage: node.imageSrc ? `url(${node.imageSrc})` : undefined 
          }}
        >
          {!node.imageSrc && "No Image"}
        </div>
      )}
      
      {isEditing ? (
        <textarea 
          className="note-input" 
          value={node.content} 
          onChange={(e) => onContentChange(node.id, e.target.value)} 
          autoFocus 
          onBlur={onBlur} 
          onMouseDown={e => e.stopPropagation()} 
          style={{ 
            flex: node.type === 'note' ? 1 : 'none', 
            height: node.type === 'note' ? '100%' : 'auto', 
            minHeight:'30px', 
            resize: 'none' 
          }} 
        />
      ) : (
        <div style={{
          flex: node.type === 'note' ? 1 : 'none', 
          whiteSpace: 'pre-wrap', 
          width:'100%', 
          height: 'auto', 
          minHeight: '20px', 
          pointerEvents:'none', 
          overflow:'hidden', 
          padding: '5px 0 0 0'
        }}>
          <HighlightedContent text={node.content} keywords={keywords} />
        </div>
      )}
    </div>
  );
};

export default Node;