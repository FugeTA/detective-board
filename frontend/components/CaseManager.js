// src/components/CaseManager.js
import React, { useState } from 'react';
import { Folder, Plus, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CaseManager = ({ 
  isOpen, 
  onToggleOpen, 
  cases, // ケースのリスト [{id, name, lastModified}, ...]
  currentCaseId,
  onOpenCase, 
  onCreateCase, 
  onDeleteCase,
  onRenameCase,
  onCleanupCache
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const finishEdit = () => {
    if (editName.trim()) onRenameCase(editingId, editName);
    setEditingId(null);
  };

  return (
    <>
      <button className="case-toggle" onClick={onToggleOpen}>
        <Folder size={16} style={{marginRight: '4px'}} /> {isOpen ? 'Close' : 'Cases'}
      </button>

      <motion.div 
        className="case-sidebar"
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.1 }}
        onMouseDown={e => e.stopPropagation()}
      >
        <h3>Case Files</h3>
        
        <button className="create-case-btn" onClick={onCreateCase}>
          <Plus size={14} style={{marginRight: '4px'}} /> New Case
        </button>

        <button className="create-case-btn" onClick={onCleanupCache} style={{background: '#444', border: '1px solid #666', marginBottom: '20px', fontSize: '0.8rem'}}>
          <Trash2 size={14} style={{marginRight: '4px'}} /> Clean Unused Cache
        </button>

        <div className="case-list">
          {cases.map(c => (
            <div 
              key={c.id} 
              className={`case-item ${c.id === currentCaseId ? 'active' : ''}`}
              onClick={() => onOpenCase(c.id)}
            >
              <div className="case-icon"><Folder size={18} /></div>
              
              <div className="case-info">
                {editingId === c.id ? (
                  <input 
                    className="case-name-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={finishEdit}
                    onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="case-name" onDoubleClick={(e) => { e.stopPropagation(); startEdit(c); }}>
                    {c.name}
                  </div>
                )}
                <div className="case-date">{new Date(c.updatedAt).toLocaleDateString()}</div>
              </div>

              {/* 現在開いているケース以外は削除可能 */}
              {cases.length > 1 && (
                <button 
                  className="case-delete"
                  onClick={(e) => { e.stopPropagation(); onDeleteCase(c.id); }}
                  title="Delete Case"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
};

export default CaseManager;