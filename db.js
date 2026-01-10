// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('DetectiveBoardDB');
// id というキーでデータを管理する 'saves' テーブルを作成
db.version(1).stores({ saves: 'id' });
