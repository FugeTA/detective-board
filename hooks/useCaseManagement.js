import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { useStore } from '../store/useStore';
import { generateId } from '../utils/id';

export const useCaseManagement = () => {
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [caseList, setCaseList] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  const clearStatusTimer = useRef(null);

  const { nodes, edges, keywords, drawings, view, loadData } = useStore();

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
          nodes: useStore.getState().nodes, // 初期値を取得
          view: useStore.getState().view 
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

  // 自動保存
  useEffect(() => {
    if (!currentCaseId) return;
    setSaveStatus(null);
    if (clearStatusTimer.current) {
      clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = null;
    }

    const handler = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await db.saves.update(currentCaseId, { nodes, edges, keywords, view, drawings, updatedAt: Date.now() });
        setSaveStatus('saved');
        setCaseList(prev => prev.map(c => c.id === currentCaseId ? { ...c, updatedAt: Date.now() } : c));
        
        clearStatusTimer.current = setTimeout(() => setSaveStatus(null), 2000);
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus('error');
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [nodes, edges, keywords, view, drawings, currentCaseId]);

  const openCase = async (id) => {
    if (id === currentCaseId) return;
    await db.saves.update(currentCaseId, { nodes, edges, keywords, view, drawings, updatedAt: Date.now() });
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
      view: { x: 0, y: 0, scale: 1 } 
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

  return { currentCaseId, caseList, saveStatus, openCase, createCase, deleteCase, renameCase };
};