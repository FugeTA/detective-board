// src/components/ConnectionLayer.js
import React from 'react';
import { getPinLocationById } from '../utils/math';

const ConnectionLayer = ({ edges, nodes, connectionDraft, menu }) => {
  return (
    <svg className="connections-layer">
      {edges.map((edge, i) => { 
        const s = getPinLocationById(nodes, edge.from); 
        const e = getPinLocationById(nodes, edge.to); 
        if(!s.x || !e.x) return null; 
        return <line key={i} x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#d63031" strokeWidth="3" strokeDasharray="5,5" opacity="0.8"/>; 
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