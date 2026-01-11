// src/components/ConnectionLayer.js
import React from 'react';
import { getPinLocationById } from '../utils/math';

const ConnectionLayer = ({ edges, nodes, connectionDraft, menu, selectedIds, onEdgeMouseDown, onEdgeContextMenu }) => {
  return (
    <svg className="connections-layer" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'none'
    }}>
      {edges.map((edge) => { 
        const s = getPinLocationById(nodes, edge.from); 
        const e = getPinLocationById(nodes, edge.to); 
        if(!s.x || !e.x) return null; 
        
        const isSelected = selectedIds && selectedIds.has(edge.id);

        return (
          <g key={edge.id} 
             onMouseDown={(evt) => onEdgeMouseDown && onEdgeMouseDown(evt, edge.id)}
             onContextMenu={(evt) => onEdgeContextMenu && onEdgeContextMenu(evt, edge.id)}
             style={{cursor: 'pointer', pointerEvents: 'all'}}
          >
            {/* ヒットエリア（透明な太い線） */}
            <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="transparent" strokeWidth="15" />
            
            {/* 選択時のハイライト（背面に表示） */}
            {isSelected && (
              <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#2196f3" strokeWidth="5" opacity="0.5" strokeLinecap="round" />
            )}

            {/* 表示用の線 */}
            <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} 
              stroke={edge.color || "#d63031"} 
              strokeWidth="3" 
              strokeDasharray={edge.style === 'solid' ? "none" : "5,5"} 
              opacity="0.8"
            />
          </g>
        );
      })}
      
      {connectionDraft && (
        <line x1={connectionDraft.startX} y1={connectionDraft.startY} x2={connectionDraft.currX} y2={connectionDraft.currY} stroke="#ff0000" strokeWidth="2" strokeDasharray="3,3" />
      )}
      
      {/* メニューへの仮の線 */}
      {menu && menu.type === 'connection' && (() => { 
        const s = getPinLocationById(nodes, menu.sourceId); 
        return <line x1={s.x} y1={s.y} x2={menu.worldX} y2={menu.worldY} stroke="#d63031" strokeWidth="2" strokeDasharray="3,3" opacity="0.5"/> 
      })()}
    </svg>
  );
};

export default ConnectionLayer;