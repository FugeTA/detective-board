# ノードコンテンツの拡張実装

## 実装内容

### 1. データベーススキーマの拡張
- **ファイル**: [src/lib/db.ts](src/lib/db.ts)
- `pdfCache` テーブル: PDFファイルのキャッシュ用
- `fileContent` テーブル: メディアファイルのコンテンツキャッシュ用

### 2. 型定義の拡張
- **ファイル**: [src/types/index.ts](src/types/index.ts)
- `NodeData` インターフェースに以下を追加:
  - `imageSrc`: 画像ソースURL
  - `audioSrc`: オーディオソースURL
  - `videoSrc`: ビデオソースURL
  - `pdfSrc`: PDFソースURL
  - `reloadToken`: キャッシュ更新用トークン

### 3. メディアコンテンツコンポーネント

#### useAssetフック
- **ファイル**: [src/hooks/useAsset.ts](src/hooks/useAsset.ts)
- IndexedDBからメディアファイルを読み込むカスタムフック
- data:、blob:、http: スキームの自動検出
- オブジェクトURLの自動クリーンアップ

#### ImageContent
- **ファイル**: [src/components/ImageContent.tsx](src/components/ImageContent.tsx)
- 画像ノードのコンテンツ表示
- 背景画像として表示（cover、center）
- ダブルクリックイベント対応

#### AudioContent
- **ファイル**: [src/components/AudioContent.tsx](src/components/AudioContent.tsx)
- オーディオプレーヤーコンポーネント
- HTML5 audio要素使用
- ドラッグイベントの停止処理

#### VideoContent
- **ファイル**: [src/components/VideoContent.tsx](src/components/VideoContent.tsx)
- ビデオプレーヤーコンポーネント
- HTML5 video要素使用
- コントロール付き

#### PdfContent
- **ファイル**: [src/components/PdfContent.tsx](src/components/PdfContent.tsx)
- PDFビューアコンポーネント
- react-pdf使用
- ページナビゲーション機能
- キャッシュ対応（IndexedDB）
- プロキシAPI経由でのPDF取得

### 4. Node.tsxの更新
- **ファイル**: [src/components/Node.tsx](src/components/Node.tsx)
- ノードタイプに応じたコンテンツコンポーネントの切り替え
- text、image、audio、video、pdf に対応

### 5. コンテクストメニューの拡張
- **ファイル**: [src/components/ContextMenu.tsx](src/components/ContextMenu.tsx)
- 空白部分での右クリックでノード作成メニュー表示
- 5種類のノードタイプから選択可能:
  - 📝 テキストノード
  - 🖼️ 画像ノード
  - 📄 PDFノード
  - 🎵 オーディオノード
  - 🎬 ビデオノード

### 6. ページコンポーネントの更新
- **ファイル**: [src/app/page.tsx](src/app/page.tsx)
- `handleCreateNode` 関数の追加
- 画面座標からワールド座標への変換
- ノードタイプごとのデフォルトサイズ設定

## 使い方

1. **ノードの作成**:
   - ボード上の空白部分で右クリック
   - 作成したいノードタイプを選択

2. **メディアの追加**:
   - 将来的には各ノードの編集UIでメディアファイルをアップロードまたはURL指定

3. **PDF表示**:
   - PDFノードは自動的にページネーション付きで表示
   - 外部リンクボタンで元ファイルを開く

## 依存関係

以下のパッケージがインストールされている必要があります:

```bash
npm install
```

- `react-pdf`: PDFレンダリング
- `pdfjs-dist`: PDF.jsライブラリ
- `dexie`: IndexedDBラッパー

## 今後の改善点

1. メディアファイルのアップロード機能
2. ドラッグ&ドロップでのファイル追加
3. メディアのリサイズ・トリミング
4. PDFの注釈機能
5. オーディオ/ビデオの再生コントロール拡張
