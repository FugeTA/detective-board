// src/components/ConnectionLayer.js
import React from 'react';
import clsx from 'clsx';
import { getPinLocationById } from '../../utils/math';
import styles from './ConnectionLayer.module.css';

const ConnectionLayer = ({ edges, nodes, connectionDraft, menu, selectedIds, theme, onEdgeMouseDown, onEdgeContextMenu }) => {
  // たわんだパスを生成するヘルパー
  const getPathData = (s, e) => {
    if (theme !== 'retro') return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
    
    const midX = (s.x + e.x) / 2;
    const midY = (s.y + e.y) / 2;
    const sag = Math.min(Math.abs(e.x - s.x) * 0.2 + 30, 20); // 距離に応じた動的なたわみ
    return `M ${s.x} ${s.y} Q ${midX} ${midY + sag} ${e.x} ${e.y}`;
  };

  return (
    <svg className={styles.container}>
      {edges.map((edge) => { 
        const s = getPinLocationById(nodes, edge.from); 
        const e = getPinLocationById(nodes, edge.to); 
        if(!s.x || !e.x) return null; 
        
        const isSelected = selectedIds && selectedIds.has(edge.id);
        const pathData = getPathData(s, e);

        return (
          <g key={edge.id} 
             onMouseDown={(evt) => onEdgeMouseDown && onEdgeMouseDown(evt, edge.id)}
             onContextMenu={(evt) => onEdgeContextMenu && onEdgeContextMenu(evt, edge.id)}
             className={styles.edgeGroup}
          >
            {/* ヒットエリア（透明な太い線） */}
            <path d={pathData} fill="none" stroke="transparent" strokeWidth="20" />
            
            {/* 選択時のハイライト（背面に表示） */}
            {isSelected && (
              <path d={pathData} fill="none" stroke="#2196f3" strokeWidth="8" opacity="0.5" strokeLinecap="round" />
            )}

            {/* 背面：より糸の影/立体感（レトロテーマ時のみ） */}
            {theme === 'retro' && (
              <path d={pathData} fill="none" className={styles.yarnShadow} />
            )}

            {/* 前面：メインの糸 */}
            <path d={pathData} fill="none"
              className={clsx(styles.mainLine, { [styles.retroYarn]: theme === 'retro' })}
              style={{ 
                stroke: edge.color || undefined,
                strokeDasharray: edge.style === 'dashed' ? "10,10" : undefined 
              }}
            />
          </g>
        );
      })}
      
      {connectionDraft && (
        <path 
          d={getPathData({x: connectionDraft.startX, y: connectionDraft.startY}, {x: connectionDraft.currX, y: connectionDraft.currY})} 
          fill="none" stroke="#ff0000" strokeWidth="2" strokeDasharray="5,5" 
        />
      )}
      
      {/* メニューへの仮の線 */}
      {menu && menu.type === 'connection' && (() => { 
        const s = getPinLocationById(nodes, menu.sourceId); 
        return <path 
          d={getPathData(s, {x: menu.worldX, y: menu.worldY})} 
          fill="none" stroke="#d63031" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" 
        /> 
      })()}
    </svg>
  );
};

export default ConnectionLayer;