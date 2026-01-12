// src/components/CaseManager.js
import React, { useState } from 'react';
import { Folder, Plus, X, Trash2, Share2, Download, Copy, Check } from 'lucide-react';
import styles from './CaseManager.module.css';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [modal, setModal] = useState(null); // { type: 'share' | 'info', code?, expires?, message? }
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      const result = await onShareCase();
      if (result) {
        setModal({
          type: 'share',
          code: result.share_code,
          expires: result.expires_at
        });
      }
    } catch (e) {
      setModal({
        type: 'info',
        message: "Failed to share case."
      });
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
      setModal({
        type: 'info',
        message: "Case imported successfully."
      });
    } catch (e) {
      setModal({
        type: 'info',
        message: e.message
      });
    } finally {
      setIsImporting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <button className={styles.toggle} onClick={onToggleOpen}>
        <Folder size={16} style={{marginRight: '4px'}} /> {isOpen ? 'Close' : 'Cases'}
      </button>

      <motion.div 
        className={styles.sidebar}
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.1 }}
        onMouseDown={e => e.stopPropagation()}
      >
        <h3>Case Files</h3>
        
        <button className={styles.createBtn} onClick={onCreateCase}>
          <Plus size={14} style={{marginRight: '4px'}} /> New Case
        </button>

        <button className={clsx(styles.createBtn, styles.cleanupBtn)} onClick={onCleanupCache}>
          <Trash2 size={14} style={{marginRight: '4px'}} /> Clean Unused Cache
        </button>

        <div className={styles.shareSection}>
          <button className={clsx(styles.createBtn, styles.shareBtn)} onClick={handleShare}>
            <Share2 size={14} style={{ marginRight: '4px' }} /> Share Current Case
          </button>
          
          <div className={styles.importRow}>
            <input 
              className={styles.importInput} 
              placeholder="Share Code" 
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
            />
            <button className={clsx(styles.createBtn, styles.importBtn)} onClick={handleImport} disabled={isImporting}>
              <Download size={14} />
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {cases.map(c => (
            <div 
              key={c.id} 
              className={clsx(styles.item, { [styles.itemActive]: c.id === currentCaseId })}
              onClick={() => onOpenCase(c.id)}
            >
              <div className={styles.icon}><Folder size={18} /></div>
              
              <div className={styles.info}>
                {editingId === c.id ? (
                  <input 
                    className={styles.importInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={finishEdit}
                    onKeyDown={(e) => e.key === 'Enter' && finishEdit()}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className={styles.name} onDoubleClick={(e) => { e.stopPropagation(); startEdit(c); }}>
                    {c.name}
                  </div>
                )}
                <div className={styles.date}>{new Date(c.updatedAt).toLocaleDateString()}</div>
              </div>

              {/* 現在開いているケース以外は削除可能 */}
              {cases.length > 1 && (
                <button 
                  className={styles.deleteBtn}
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

      <AnimatePresence>
        {modal && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="modal-close-x" onClick={() => setModal(null)}><X size={18}/></button>
              
              {modal.type === 'share' ? (
                <div className="share-modal">
                  <h4>Case Shared</h4>
                  <p>Give this code to others to import your case.</p>
                  <div className="share-code-container">
                    <span className="share-code-text">{modal.code}</span>
                    <button 
                      className="copy-btn" 
                      onClick={() => copyToClipboard(modal.code)}
                      title="Copy to clipboard"
                    >
                      {copied ? <Check size={18} color="#2ecc71" /> : <Copy size={18} />}
                    </button>
                  </div>
                  <div className="expires-info">
                    Expires: {new Date(modal.expires).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="info-modal">
                  <p>{modal.message}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CaseManager;