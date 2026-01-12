# 探偵ボード (Detective Board)

事件の証拠、写真、資料を整理し、関係図を構築するためのデジタル捜査ボードアプリケーションです。
オフラインファーストで動作し、作成したケースは「共有コード」を発行することで、他のユーザーと簡単に共有できます。

## 主な機能

- **マルチメディア・ノード**: メモ、写真、PDF、Webリンク、YouTube/Spotify/Vimeoの埋め込みに対応。
- **コネクション・レイヤー**: ノード間をピンで繋ぎ、視覚的な関係図を構築。
- **手書き描画**: ボード上に自由に線を引けるペンツールと消しゴム機能。
- **ケース管理**: 複数の事件ファイルを切り替え・保存。
- **セキュアな共有**: 
    - 共有コード（6桁）によるケースの書き出しと読み込み。
    - アセット（画像・PDF）の重複排除（SHA-256ハッシュ）。
    - 共有データの有効期限設定（デフォルト7日間）。
- **オフライン対応**: IndexedDB (Dexie.js) を使用し、ブラウザを閉じてもデータは保持されます。

## 技術スタック

### フロントエンド
- **React 19**
- **Zustand**: 状態管理
- **Dexie.js**: IndexedDBによるローカル永続化
- **Framer Motion**: アニメーションとドラッグ操作
- **React-PDF**: PDFのレンダリング
- **Lucide React**: アイコン

### バックエンド
- **Rust (Axum)**: 高速で堅牢なAPIサーバー
- **SQLx**: 非同期PostgreSQLクエリ
- **Supabase**: 
    - **PostgreSQL**: ケースデータとアセットメタデータの保存
    - **Storage**: 画像・PDFの実体保存

## セットアップ

### 1. Supabaseの準備
Supabaseプロジェクトを作成し、以下のテーブルをセットアップしてください。

```sql
-- shared_cases, assets, case_assets テーブルを作成
-- (詳細は backend/src/handlers/share.rs のコメント等を参照)
```

### 2. バックエンド (Rust)
`backend/.env` ファイルを作成し、環境変数を設定します。

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-id:password@db-host:6543/postgres?pgbouncer=true
PORT=8000
```

起動方法:
```bash
cd backend
cargo run
```

### 3. フロントエンド (React)
`frontend/.env` ファイルを作成します。

```env
REACT_APP_API_URL=http://localhost:8000
```

起動方法:
```bash
cd frontend
npm install
npm start
```

## 共有機能の仕組み

1. **送信**: ローカルの画像やPDFをハッシュ化し、未登録のものだけをSupabase Storageにアップロードします。
2. **コード発行**: サーバーが6桁のランダムな共有コードを生成し、ケースのJSONデータをDBに保存します。
3. **受信**: コードを入力すると、サーバーからJSONとアセットのプロキシURLが返されます。
4. **復元**: フロントエンドが不足しているアセットのみをダウンロードし、IndexedDBに格納。ボード上にノードを再構築します。

## 開発者向け情報
- **CORS対策**: 画像やPDFのダウンロードは、Supabase Storageから直接ではなく、Rustバックエンドをプロキシとして経由します。これによりブラウザのCORS制限を回避し、セキュアにアセットを取得できます。
- **メモリ管理**: 拡大表示（Fullscreen）を閉じる際、`URL.revokeObjectURL` を呼び出してメモリリークを防止しています。

## ライセンス
MIT

## 謝辞
- フリーテクスチャ素材館様