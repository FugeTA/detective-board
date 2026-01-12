// src/components/Node.js
import React, { useRef } from 'react';
import styles from './Node.module.css';
import clsx from 'clsx';
import TextareaAutosize from 'react-textarea-autosize';
import { RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import PdfContent from './PdfContent';
import MediaContent from './MediaContent';
import EmbedContent from './EmbedContent';

// ハイライト処理用コンポーネント
const HighlightedContent = ({ text, keywords }) => {
  if (!text) return <span style={{opacity:0.5}}>(Empty)</span>;
  
  const activeKeywords = keywords.filter(k => k.active).map(k => k.text).filter(t => t.length > 0);
  if (activeKeywords.length === 0) return text;

  const regex = new RegExp(`(${activeKeywords.join('|')})`, 'gi');
  return text.split(regex).map((part, i) => {
    if (activeKeywords.some(k => k.toLowerCase() === part.toLowerCase())) {
      return <span key={i} className={styles.highlightMatch}>{part}</span>;
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
  onImageDoubleClick,
  onContentChange, 
  onBlur 
}) => {
  const nodeRef = useRef(null);

  // ドメイン取得（エラーハンドリング付き）
  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

  const isMediaNode = ['youtube', 'vimeo', 'spotify', 'pdf', 'audio', 'video'].includes(node.type);

  return (
    <motion.div 
      ref={nodeRef}
      className={clsx(
        styles.node,
        styles[node.type],
        { [styles.selected]: isSelected }
      )}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{ 
        left: node.x, top: node.y, width: node.width, 
        height: (node.type === 'note' || node.type === 'photo' || node.type === 'pdf' || node.type === 'audio' || node.type === 'video' || (isEditing && !isMediaNode)) ? 'auto' : node.height,
        minHeight: node.type === 'frame' ? 100 : ((node.type === 'note' || node.type === 'photo' || node.type === 'pdf' || node.type === 'audio' || node.type === 'video') ? node.height : (isEditing ? 50 : node.height)),
        rotate: node.rotation || 0,
        background: node.color || undefined, // CSS変数を優先し、個別設定があれば上書き
        color: node.textColor || '#000000',
        fontSize: node.fontSize || '16px',
        zIndex: (node.type === 'frame' ? 0 : 100) + (isSelected ? 50 : 0)
      }}
      onMouseDown={(e) => onMouseDown(e, node)}
      onContextMenu={(e) => onContextMenu(e, node)}
      onDoubleClick={(e) => onDoubleClick(e, node.id)}
    >
      <div 
        className={styles.pin} 
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
          className={styles.rotateHandle} 
          onMouseDown={(e) => onRotateMouseDown(e, node)} 
          onDoubleClick={(e) => onRotateReset(e, node.id)} 
          title="Drag to rotate, Double-click to reset"
          style={{ fontSize: '16px' }}
        ><RotateCw size={12} /></div>
      )}
      
      {node.type !== 'pin' && <div className={styles.resizeHandle} onMouseDown={(e) => onResizeMouseDown(e, node)} ></div>}

      {['photo', 'video', 'audio'].includes(node.type) && (
        <MediaContent node={node} onImageDoubleClick={onImageDoubleClick} />
      )}
      
      {node.type === 'pdf' && (
        <PdfContent node={node} isSpacePressed={isSpacePressed} onImageDoubleClick={onImageDoubleClick} />
      )}

      {['youtube', 'vimeo', 'spotify'].includes(node.type) && (
        <EmbedContent node={node} isSpacePressed={isSpacePressed} />
      )}

      {isEditing ? (
        <TextareaAutosize
          className={styles.noteInput} 
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
            fontSize: node.fontSize || '16px',
            color: node.textColor || '#000000',
          }} 
        />
      ) : !isMediaNode && node.type !== 'pin' && (
        <div 
          className={styles.textContent}
          style={{ flex: (node.type === 'note' || node.type === 'link') ? 1 : 'none' }}
        >
          {node.type === 'link' ? (
            <div className={styles.linkContainer}>
              <div className={styles.linkHeader}>
                 {/* Google Favicon APIを使用 */}
                 <img 
                   src={`https://www.google.com/s2/favicons?domain=${getHostname(node.content)}&sz=32`} 
                   width="16" height="16" alt="" className={styles.favicon}
                 />
                 <span className={styles.hostname}>{getHostname(node.content)}</span>
              </div>
              <a 
                href={node.content} 
                target="_blank" 
                rel="noopener noreferrer" 
                onMouseDown={(e) => e.stopPropagation()}
                className={styles.linkAnchor}
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
        <div className={styles.updatedAt}>{format(node.updatedAt, 'yyyy/MM/dd HH:mm')}</div>
      )}
    </motion.div>
  );
};

export default Node;