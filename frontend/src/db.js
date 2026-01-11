// src/db.js
import Dexie from 'dexie';

export const db = new Dexie('DetectiveBoardDB');
// id というキーでデータを管理する 'saves' テーブルを作成
db.version(1).stores({ saves: 'id' });

// バージョン2: PDFキャッシュ用テーブルを追加
// urlをキーにして、blobデータを保存します
db.version(2).stores({ saves: 'id', pdfCache: 'url' });
