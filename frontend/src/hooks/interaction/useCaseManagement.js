import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../../db';
import { useStore } from '../../store/useStore';
import { generateId } from '../../utils/id';
import { prepareShareData } from '../../utils/sharing';
import { importCase as importCaseUtil } from '../../utils/importing';

export const useCaseManagement = () => {
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [caseList, setCaseList] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  const clearStatusTimer = useRef(null);

  const { nodes, edges, keywords, drawings, view, theme, loadData } = useStore();

  // 初期化
  useEffect(() => {
    const init = async () => {
      const allSaves = await db.saves.toArray();
      if (allSaves.length === 0) {
        const newId = generateId('case');
        const newCase = { 
          id: newId, 
          name: 'Case #1', 
          updatedAt: Date.now(), 
          nodes: useStore.getState().nodes,
          view: useStore.getState().view,
          theme: useStore.getState().theme
        };
        await db.saves.add(newCase);
        setCaseList([{ id: newId, name: 'Case #1', updatedAt: Date.now() }]);
        setCurrentCaseId(newId);
        loadData(newCase);
      } else {
        const sorted = allSaves.sort((a, b) => b.updatedAt - a.updatedAt);
        setCaseList(sorted.map(s => ({ id: s.id, name: s.name || 'Untitled', updatedAt: s.updatedAt })));
        setCurrentCaseId(sorted[0].id);
        loadData(sorted[0]);
      }
    };
    init();
  }, [loadData]);

  // 手動保存関数
  const saveCase = useCallback(async () => {
    if (!currentCaseId) return;
    setSaveStatus('saving');
    try {
      await db.saves.update(currentCaseId, { nodes, edges, keywords, view, drawings, theme, updatedAt: Date.now() });
      setSaveStatus('saved');
      setCaseList(prev => prev.map(c => c.id === currentCaseId ? { ...c, updatedAt: Date.now() } : c));
      
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus('error');
    }
  }, [currentCaseId, nodes, edges, keywords, view, drawings, theme]);

  // 自動保存
  useEffect(() => {
    if (!currentCaseId) return;
    setSaveStatus(null);
    if (clearStatusTimer.current) {
      clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = null;
    }

    const handler = setTimeout(async () => {
      saveCase();
    }, 1000);
    return () => clearTimeout(handler);
  }, [saveCase, currentCaseId]);

  const openCase = async (id) => {
    if (id === currentCaseId) return;
    await db.saves.update(currentCaseId, { nodes, edges, keywords, view, drawings, theme, updatedAt: Date.now() });
    const targetCase = await db.saves.get(id);
    if (targetCase) {
      setCurrentCaseId(id);
      loadData(targetCase);
    }
  };

  const createCase = async () => {
    const newId = generateId('case');
    const newName = `Case #${caseList.length + 1}`;
    const newCase = { 
      id: newId, 
      name: newName, 
      updatedAt: Date.now(), 
      nodes: [], edges: [], keywords: [], drawings: [],
      view: { x: 0, y: 0, scale: 1 },
      theme: 'modern'
    };
    await db.saves.add(newCase);
    setCaseList(prev => [{ id: newId, name: newName, updatedAt: Date.now() }, ...prev]);
    setCurrentCaseId(newId);
    loadData(newCase);
  };

  const deleteCase = async (id) => {
    if (!window.confirm("このケースファイルを完全に削除しますか？")) return;
    await db.saves.delete(id);
    const newList = caseList.filter(c => c.id !== id);
    setCaseList(newList);
    if (id === currentCaseId) {
      const nextCase = newList[0];
      if (nextCase) {
        const data = await db.saves.get(nextCase.id);
        setCurrentCaseId(nextCase.id);
        loadData(data);
      } else {
        createCase();
      }
    }
  };

  const renameCase = async (id, newName) => {
    await db.saves.update(id, { name: newName });
    setCaseList(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const cleanupUnusedCache = useCallback(async () => {
    if (!window.confirm("現在使用されていないPDFキャッシュを削除しますか？\n(全てのケースファイルを確認し、参照されていないキャッシュのみ削除します)")) return;
    
    try {
      const allSaves = await db.saves.toArray();
      const usedUrls = new Set();
      
      // 全てのセーブデータからPDFのURLを収集
      allSaves.forEach(save => {
        if (save.nodes) {
          save.nodes.forEach(node => {
            if (node.type === 'pdf' && node.pdfSrc) {
              usedUrls.add(node.pdfSrc);
            }
          });
        }
      });

      // 現在のボードの状態も考慮
      nodes.forEach(node => {
        if (node.type === 'pdf' && node.pdfSrc) {
          usedUrls.add(node.pdfSrc);
        }
      });

      // キャッシュから未使用のものを削除
      const allCacheKeys = await db.pdfCache.toCollection().primaryKeys();
      const keysToDelete = allCacheKeys.filter(key => !usedUrls.has(key));
      
      if (keysToDelete.length > 0) {
        await db.pdfCache.bulkDelete(keysToDelete);
        alert(`${keysToDelete.length} 件の未使用キャッシュを削除しました。`);
      } else {
        alert("削除対象のキャッシュはありませんでした。");
      }
    } catch (error) {
      console.error("Cache cleanup failed:", error);
      alert("キャッシュの削除中にエラーが発生しました。");
    }
  }, [nodes]);

  // 共有機能 (Rustバックエンドへ送信)
  const shareCase = useCallback(async () => {
    if (!currentCaseId) return null;
    setSaveStatus('saving');
    try {
      // 1. データの準備
      const caseData = {
        nodes,
        edges,
        keywords,
        view,
        drawings,
        theme,
        name: caseList.find(c => c.id === currentCaseId)?.name || 'Untitled'
      };

      const { cleanJson, files } = await prepareShareData(caseData);

      // 2. FormDataの作成
      const formData = new FormData();
      formData.append('case_data', JSON.stringify(cleanJson));
      
      files.forEach((blob) => {
        formData.append('files[]', blob);
      });

      // 3. 送信
      const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      
      const response = await fetch(`${cleanBase}/api/share`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setSaveStatus('saved');
      
      if (clearStatusTimer.current) clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = setTimeout(() => setSaveStatus(null), 2000);
      
      return result; // { share_code: "...", expires_at: "..." }
    } catch (error) {
      console.error("Share error:", error);
      setSaveStatus('error');
      throw error;
    }
  }, [currentCaseId, nodes, edges, keywords, view, drawings, theme, caseList]);

  // インポート機能
  const importCase = useCallback(async (shareCode, onProgress) => {
    try {
      const newCase = await importCaseUtil(shareCode, onProgress);
      // リストを更新
      setCaseList(prev => [{ 
        id: newCase.id, 
        name: newCase.name, 
        updatedAt: newCase.updatedAt 
      }, ...prev]);
      // インポートしたケースを開く
      setCurrentCaseId(newCase.id);
      loadData(newCase);
      return newCase.id;
    } catch (error) {
      console.error("Import action failed:", error);
      throw error;
    }
  }, [loadData]);

  return { currentCaseId, caseList, saveStatus, openCase, createCase, deleteCase, renameCase, saveCase, cleanupUnusedCache, shareCase, importCase };
};