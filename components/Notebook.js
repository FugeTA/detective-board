// src/components/Notebook.js
import React, { useState } from 'react';
import { Book, Plus, X } from 'lucide-react';

const Notebook = ({ 
  isOpen, 
  onToggleOpen, 
  keywords, 
  onAddKeyword, 
  onDeleteKeyword, 
  onToggleKeyword 
}) => {
  // 入力中の文字は Notebook コンポーネント内で管理する（App.jsから分離）
  const [inputKeyword, setInputKeyword] = useState("");

  const handleAdd = () => {
    if (!inputKeyword.trim()) return;
    onAddKeyword(inputKeyword.trim());
    setInputKeyword(""); // 追加したらクリア
  };

  return (
    <>
      {/* 開閉ボタン */}
      <button className="notebook-toggle" onClick={onToggleOpen}>
        <Book size={16} style={{marginRight: '4px'}} /> {isOpen ? 'Close' : 'Notebook'}
      </button>

      {/* サイドバー本体 */}
      <div 
        className={`notebook-sidebar ${isOpen ? 'open' : ''}`} 
        onMouseDown={e => e.stopPropagation()} // ドラッグ等が裏に透けないように
      >
        <h3>Keywords List</h3>
        
        {/* 入力フォーム */}
        <div className="keyword-input-row">
          <input 
            className="keyword-input" 
            placeholder="Add keyword..." 
            value={inputKeyword} 
            onChange={(e) => setInputKeyword(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
          />
          <button className="keyword-add-btn" onClick={handleAdd}><Plus size={16} /></button>
        </div>

        {/* リスト表示 */}
        <div className="keyword-list">
          {keywords.length === 0 && <div style={{color:'#666', fontStyle:'italic'}}>No keywords yet.</div>}
          
          {keywords.map(k => (
            <div 
              key={k.id} 
              className={`keyword-item ${k.active ? 'active' : ''}`} 
              onClick={() => onToggleKeyword(k.id)}
            >
              <span>{k.text}</span>
              <button 
                className="keyword-delete" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onDeleteKeyword(k.id); 
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Notebook;