// src/components/Node.js
import React from 'react';
import { getYouTubeId, getVimeoId, getSpotifyId } from '../utils/media';
import { RotateCw } from 'lucide-react';

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
  isSpacePressed,
  isDragging,
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
  // ドメイン取得（エラーハンドリング付き）
  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

  const isMediaNode = ['youtube', 'vimeo', 'spotify'].includes(node.type);

  return (
    <div 
      className={`node ${node.type} ${isSelected ? 'selected' : ''}`} 
      style={{ 
        left: node.x, top: node.y, width: node.width, height: node.height,
        transform: `rotate(${node.rotation || 0}deg)`,
        background: node.color,
        color: node.textColor || '#000000',
        fontSize: node.fontSize || '16px',
        opacity: node.type === 'frame' ? 0.5 : 1,
        border: isSelected ? '1px solid #2196f3' : (node.type === 'frame' ? '2px dashed #ccc' : (node.type === 'pin' ? '2px solid rgba(0,0,0,0.2)' : '1px solid #ccc')),
        borderRadius: node.type === 'pin' ? '50%' : (node.type === 'frame' ? '4px' : '2px'),
        boxShadow: isSelected ? '0 0 8px rgba(33, 150, 243, 0.5)' : 'none',
        zIndex: (node.type === 'frame' ? 0 : 100) + (isSelected ? 50 : 0),
        cursor: isSpacePressed ? 'grab' : (isDragging ? 'move' : (node.type === 'pin' ? 'move' : 'default'))
      }}
      onMouseDown={(e) => onMouseDown(e, node)}
      onContextMenu={(e) => onContextMenu(e, node)}
      onDoubleClick={(e) => onDoubleClick(e, node.id)}
    >
      <div 
        className="pin" 
        onMouseDown={(e) => onPinMouseDown(e, node.id)} 
        onMouseUp={(e) => onPinMouseUp(e, node.id)}
        style={{ 
          fontSize: '16px',
          // ピンノードの場合は接続ハンドルを中心に配置
          ...(node.type === 'pin' ? { 
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            cursor: 'crosshair',
          } : {})
        }}
      ></div>
      
      {node.type !== 'pin' && node.type !== 'frame' && (
        <div 
          className="rotate-handle" 
          onMouseDown={(e) => onRotateMouseDown(e, node)} 
          onDoubleClick={(e) => onRotateReset(e, node.id)} 
          title="Drag to rotate, Double-click to reset"
          style={{ fontSize: '16px' }}
        ><RotateCw size={12} /></div>
      )}
      
      {node.type !== 'pin' && <div className="resize-handle" onMouseDown={(e) => onResizeMouseDown(e, node)} ></div>}

      {node.type === 'photo' && (
        <div 
          className={`photo-inner ${node.imageSrc ? 'has-image' : ''}`} 
          style={{ 
            width: '100%',
            height: '90%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: node.imageSrc ? `url(${node.imageSrc})` : undefined 
          }}
        >
          {!node.imageSrc && "No Image"}
        </div>
      )}
      
      {node.type === 'youtube' && (
        <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
          {/* ドラッグ用ハンドル */}
          <div style={{
            height:'24px', background:'#f0f0f0', cursor: isSpacePressed ? 'grab' : 'move', 
            fontSize:'11px', display:'flex', alignItems:'center', padding:'0 8px', color:'#666', flexShrink: 0
          }}>
             YouTube
          </div>
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${getYouTubeId(node.content)}`} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            onMouseDown={(e) => e.stopPropagation()} // iframe内操作時はドラッグしない
            style={{flex:1, background:'#000'}}
          ></iframe>
        </div>
      )}

      {node.type === 'vimeo' && (
        <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <div style={{
            height:'24px', background:'#f0f0f0', cursor: isSpacePressed ? 'grab' : 'move', 
            fontSize:'11px', display:'flex', alignItems:'center', padding:'0 8px', color:'#666', flexShrink: 0
          }}>
             Vimeo
          </div>
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://player.vimeo.com/video/${getVimeoId(node.content)}`} 
            frameBorder="0" 
            allow="autoplay; fullscreen; picture-in-picture" 
            allowFullScreen
            onMouseDown={(e) => e.stopPropagation()}
            style={{flex:1, background:'#000'}}
          ></iframe>
        </div>
      )}

      {node.type === 'spotify' && (
        <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <div style={{
            height:'24px', background:'#f0f0f0', cursor: isSpacePressed ? 'grab' : 'move', 
            fontSize:'11px', display:'flex', alignItems:'center', padding:'0 8px', color:'#666', flexShrink: 0
          }}>
             Spotify
          </div>
          {(() => {
             const info = getSpotifyId(node.content);
             return info ? (
               <iframe 
                 src={`https://open.spotify.com/embed/${info.type}/${info.id}`} 
                 width="100%" 
                 height="100%" 
                 frameBorder="0" 
                 allow="encrypted-media"
                 onMouseDown={(e) => e.stopPropagation()}
                 style={{flex:1, background:'#282828'}}
               ></iframe>
             ) : null;
          })()}
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
            flex: (node.type === 'note' || node.type === 'link' || isMediaNode) ? 1 : 'none', 
            height: (node.type === 'note' || node.type === 'link' || isMediaNode) ? '100%' : 'auto', 
            minHeight:'30px',
            fontSize: node.fontSize || '16px',
            resize: 'none' 
          }} 
        />
      ) : !isMediaNode && node.type !== 'pin' && (
        <div style={{
          flex: (node.type === 'note' || node.type === 'link') ? 1 : 'none', 
          whiteSpace: 'pre-wrap', 
          width:'100%', 
          height: 'auto', 
          minHeight: '20px', 
          pointerEvents:'none', 
          overflow:'hidden', 
          padding: '5px 0 0 0'
        }}>
          {node.type === 'link' ? (
            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
              <div style={{display:'flex', alignItems:'center', gap:'6px', opacity:0.8, fontSize:'0.75rem', color:'#555'}}>
                 {/* Google Favicon APIを使用 */}
                 <img 
                   src={`https://www.google.com/s2/favicons?domain=${getHostname(node.content)}&sz=32`} 
                   width="16" height="16" alt="" style={{borderRadius:'2px'}}
                 />
                 <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{getHostname(node.content)}</span>
              </div>
              <a 
                href={node.content} 
                target="_blank" 
                rel="noopener noreferrer" 
                onMouseDown={(e) => e.stopPropagation()}
                style={{ pointerEvents: 'auto', color: '#0066cc', textDecoration: 'underline', cursor: 'pointer', wordBreak: 'break-all' }}
              >
                {node.content}
              </a>
            </div>
          ) : (
            <HighlightedContent text={node.content} keywords={keywords} />
          )}
        </div>
      )}
    </div>
  );
};

export default Node;