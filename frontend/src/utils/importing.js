import { db } from '../db';
import { generateId } from './id';

/**
 * 共有コードからケースを復元する
 */
export const importCase = async (shareCode, onProgress) => {
  try {
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    
    // 1. バックエンドからケースデータと署名付きURLリストを取得
    const response = await fetch(`${cleanBase}/api/import/${shareCode}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error("共有コードが見つかりません。");
      if (response.status === 410) throw new Error("有効期限が切れています。");
      throw new Error("データの取得に失敗しました。");
    }
    
    const { case_data, assets } = await response.json();
    
    // 2. アセットのダウンロードとIDB保存
    let completedCount = 0;
    const totalAssets = assets.length;

    // 並列でダウンロード処理を実行
    await Promise.all(assets.map(async (asset) => {
      const idbKey = `asset://${asset.hash}`;
      
      // すでにIDBにあるかチェック（重複ダウンロード回避）
      const exists = await db.pdfCache.get(idbKey);
      
      if (!exists) {
        try {
          // 相対パスの場合はベースURLを付与
          const downloadUrl = asset.url.startsWith('/') 
            ? `${cleanBase}${asset.url}` 
            : asset.url;
          const res = await fetch(downloadUrl);
          const blob = await res.blob();
          
          // IDBへ保存（キーを asset://hash にする）
          await db.pdfCache.put({
            url: idbKey,
            blob: blob,
            updatedAt: Date.now()
          });
        } catch (e) {
          console.error(`Asset download failed: ${asset.hash}`, e);
        }
      }
      
      completedCount++;
      if (onProgress) onProgress(completedCount, totalAssets);
    }));

    // 3. 復元したケースデータをIDB（savesテーブル）に保存
    const now = Date.now();
    const newCase = {
      ...case_data,
      name: `${case_data.name || 'Untitled'} (共有受領)`,
      nodes: case_data.nodes.map(n => ({ ...n, reloadToken: now })), // 再読み込みを強制
      id: generateId('case'), // 新規保存として扱うためIDを再生成
      updatedAt: now
    };
    
    await db.saves.add(newCase);
    return newCase; // 保存された新しいケースデータを返す

  } catch (error) {
    console.error("Import error:", error);
    throw error;
  }
};