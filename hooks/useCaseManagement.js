import { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { DEFAULT_STATE } from './useBoardState';

export const useCaseManagement = ({ nodes, edges, keywords, drawings, view, loadData }) => {
  const [currentCaseId, setCurrentCaseId] = useState(null);
  const [caseList, setCaseList] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  const clearStatusTimer = useRef(null);

  // 初期化
  useEffect(() => {
    const init = async () => {
      const allSaves = await db.saves.toArray();
      if (allSaves.length === 0) {
        const newId = `case-${Date.now()}`;
        const newCase = { id: newId, name: 'Case #1', updatedAt: Date.now(), ...DEFAULT_STATE };
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
        
        // 1秒後にフェードアウト開始、さらに1秒後に完全に消去
        clearStatusTimer.current = setTimeout(() => {
          setSaveStatus('saved-fading');
          clearStatusTimer.current = setTimeout(() => setSaveStatus(null), 1000);
        }, 1000);
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
    const newId = `case-${Date.now()}`;
    const newName = `Case #${caseList.length + 1}`;
    const newCase = { id: newId, name: newName, updatedAt: Date.now(), ...DEFAULT_STATE };
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