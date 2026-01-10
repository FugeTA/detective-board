// src/components/CaseManager.js
import React, { useState } from 'react';
import { Folder, Plus, X } from 'lucide-react';

const CaseManager = ({ 
  isOpen, 
  onToggleOpen, 
  cases, // ケースのリスト [{id, name, lastModified}, ...]
  currentCaseId,
  onOpenCase, 
  onCreateCase, 
  onDeleteCase,
  onRenameCase
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

      <div className={`case-sidebar ${isOpen ? 'open' : ''}`} onMouseDown={e => e.stopPropagation()}>
        <h3>Case Files</h3>
        
        <button className="create-case-btn" onClick={onCreateCase}>
          <Plus size={14} style={{marginRight: '4px'}} /> New Case
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
      </div>
    </>
  );
};

export default CaseManager;