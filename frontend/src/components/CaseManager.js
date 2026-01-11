// src/components/CaseManager.js
import React, { useState } from 'react';
import { Folder, Plus, X, Trash2, Share2, Download } from 'lucide-react';
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
  onCleanupCache,
  onShareCase,
  onImportCase
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [importCode, setImportCode] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleShare = async () => {
    try {
      const result = await onShareCase();
      if (result) {
        alert(`Share Code: ${result.share_code}\nExpires: ${new Date(result.expires_at).toLocaleString()}`);
      }
    } catch (e) {
      alert("Failed to share case.");
    }
  };

  const handleImport = async () => {
    if (!importCode.trim()) return;
    setIsImporting(true);
    try {
      await onImportCase(importCode.trim(), (current, total) => {
        console.log(`Importing: ${current}/${total}`);
      });
      setImportCode("");
      alert("Case imported successfully.");
    } catch (e) {
      alert(e.message);
    } finally {
      setIsImporting(false);
    }
  };

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

        <div style={{ borderTop: '1px solid #444', paddingTop: '15px', marginBottom: '15px' }}>
          <button className="create-case-btn" onClick={handleShare} style={{ background: '#2d3436' }}>
            <Share2 size={14} style={{ marginRight: '4px' }} /> Share Current Case
          </button>
          
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              className="case-name-input" 
              placeholder="Share Code" 
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="create-case-btn" onClick={handleImport} disabled={isImporting} style={{ margin: 0, padding: '5px 10px', width: 'auto' }}>
              <Download size={14} />
            </button>
          </div>
        </div>

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