// src/components/Node.js
import React, { useRef, useState, useEffect } from 'react';
import { getYouTubeId, getVimeoId, getSpotifyId } from '../utils/media';
import TextareaAutosize from 'react-textarea-autosize';
import { RotateCw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { db } from '../db';

// 日本語フォント（CMaps）対応オプション
const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
};

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
  const nodeRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState(null);
  const [loadError, setLoadError] = useState(null);

 useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadPdf = async () => {
      if (!node.pdfSrc) return;
      setPdfData(null);
      setLoadError(null);

      // 1. Data URIの場合はそのまま使用
      if (node.pdfSrc.startsWith('data:')) {
        setPdfData(node.pdfSrc);
        return;
      }

      let blob = null;

      // 2. IndexedDBキャッシュの確認
      if (!node.reloadToken) {
        try {
          const cached = await db.pdfCache.get(node.pdfSrc);
          if (cached) blob = cached.blob;
        } catch (e) {
          console.error("Cache read error:", e);
        }
      }

      // 3. ネットワークからの取得
      if (!blob) {
        // ★ 環境変数を取得（Vercel用）。末尾のスラッシュを処理
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        
        const url = `${cleanBase}/api/proxy-pdf?url=${encodeURIComponent(node.pdfSrc)}${node.reloadToken ? '&refresh=true' : ''}`;
        
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          blob = await res.blob();
          
          // 取得成功時にIndexedDBへ保存
          if (isMounted) {
            try {
              await db.pdfCache.put({ url: node.pdfSrc, blob: blob, updatedAt: Date.now() });
            } catch (e) { console.warn("Cache write error:", e); }
          }
        } catch (e) {
          // ★ url変数が動的になったので、エラー時にどこに送ろうとしたか分かりやすくなります
          console.error(`Fetch failed to endpoint: ${url}`, e);
        }
      }

      if (isMounted) {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPdfData(objectUrl);
        } else {
          setLoadError("Failed to load PDF");
        }
      }
    };

    loadPdf();
    return () => { 
      isMounted = false; 
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [node.pdfSrc, node.reloadToken]);
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // ドメイン取得（エラーハンドリング付き）
  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

  const isMediaNode = ['youtube', 'vimeo', 'spotify', 'pdf'].includes(node.type);

  return (
    <motion.div 
      ref={nodeRef}
      className={`node ${node.type} ${isSelected ? 'selected' : ''}`} 
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{ 
        left: node.x, top: node.y, width: node.width, 
        height: (node.type === 'note' || node.type === 'photo' || node.type === 'pdf' || (isEditing && !isMediaNode)) ? 'auto' : node.height,
        minHeight: node.type === 'frame' ? 100 : ((node.type === 'note' || node.type === 'photo' || node.type === 'pdf') ? node.height : (isEditing ? 50 : node.height)),
        display: 'flex',
        flexDirection: 'column',
        rotate: node.rotation || 0,
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
            flex: '0 0 auto',
            height: 'auto',
            minHeight: node.height,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundImage: node.imageSrc ? `url(${node.imageSrc})` : undefined 
          }}
        >
          {!node.imageSrc && "No Image"}
        </div>
      )}
      
      {node.type === 'pdf' && (
        <div style={{width:'100%', display:'flex', flexDirection:'column', background:'#525659', borderRadius:'2px', overflow:'hidden'}}>
          <div style={{
            padding:'8px 12px', background:'#333', color:'#eee', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.9rem',
            cursor: isSpacePressed ? 'grab' : 'move'
          }}>
             <span style={{fontWeight:'bold'}}>PDF</span>
             <div style={{display:'flex', gap:'8px', alignItems:'center'}} onMouseDown={e => e.stopPropagation()}>
               <button disabled={pageNumber<=1} onClick={()=>setPageNumber(p=>p-1)} style={{cursor:'pointer', padding:'4px 8px', fontSize:'0.9rem'}}>&lt;</button>
               <span>{pageNumber} / {numPages||'--'}</span>
               <button disabled={pageNumber>=numPages} onClick={()=>setPageNumber(p=>p+1)} style={{cursor:'pointer', padding:'4px 8px', fontSize:'0.9rem'}}>&gt;</button>
               <a href={node.pdfSrc} target="_blank" rel="noopener noreferrer" style={{color:'#eee', marginLeft:'8px', display:'flex'}} title="Open in new tab" onMouseDown={e => e.stopPropagation()}>
                 <ExternalLink size={16} />
               </a>
             </div>
          </div>
          <div className="nodrag" style={{width:'100%', minHeight:'100px', background:'#e9ecef', display:'flex', justifyContent:'center', padding:'10px 0', userSelect:'text', cursor:'auto', lineHeight: '1.0'}}>
             <Document 
               file={pdfData} 
               options={pdfOptions}
               onLoadSuccess={onDocumentLoadSuccess} 
               loading={<div style={{padding:'10px', fontSize:'0.8rem'}}>Loading...</div>} 
               noData={
                 loadError ? (
                   <div style={{padding:'10px', color:'red', fontSize:'0.8rem', textAlign:'center'}}>
                     <div>{loadError}</div>
                     <a href={node.pdfSrc} target="_blank" rel="noopener noreferrer" style={{color:'#2196f3', marginTop:'4px', display:'inline-block', fontSize:'0.75rem'}} onMouseDown={e => e.stopPropagation()}>Open External</a>
                   </div>
                 ) : (
                   <div style={{padding:'10px', fontSize:'0.8rem'}}>Loading...</div>
                 )
               }
               error={
                 <div style={{padding:'10px', color:'red', fontSize:'0.8rem', textAlign:'center'}}>
                   <div>{loadError || 'Waiting for data...'}</div>
                   <a href={node.pdfSrc} target="_blank" rel="noopener noreferrer" style={{color:'#2196f3', marginTop:'4px', display:'inline-block', fontSize:'0.75rem'}} onMouseDown={e => e.stopPropagation()}>Open External</a>
                 </div>
               }
             >
                <div style={{boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}}>
                  <Page pageNumber={pageNumber} width={node.width - 40} renderTextLayer={true} renderAnnotationLayer={true} />
                </div>
             </Document>
          </div>
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
        <TextareaAutosize
          className="note-input" 
          value={node.content} 
          onChange={(e) => onContentChange(node.id, e.target.value)} 
          autoFocus 
          onBlur={() => {
            // 編集終了時に現在の高さを保存する
            if (nodeRef.current && node.type !== 'note' && node.type !== 'photo' && node.type !== 'pdf') {
              onBlur(node.id, nodeRef.current.offsetHeight);
            } else {
              onBlur(node.id);
            }
          }}
          onMouseDown={e => e.stopPropagation()} 
          style={{ 
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            overflow: 'hidden',
            fontSize: node.fontSize || '16px',
            color: node.textColor || '#000000',
            resize: 'none',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }} 
        />
      ) : !isMediaNode && node.type !== 'pin' && (
        <div style={{
          flex: (node.type === 'note' || node.type === 'link') ? 1 : 'none', 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
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

      {/* 最終入力時間の表示 */}
      {(node.type === 'note' || node.type === 'photo') && node.updatedAt && (
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '18px',
          fontSize: '0.65rem',
          opacity: 0.6,
          pointerEvents: 'none'
        }}>{format(node.updatedAt, 'yyyy/MM/dd HH:mm')}</div>
      )}
    </motion.div>
  );
};

export default Node;