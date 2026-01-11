/**
 * BlobやFileからSHA-256ハッシュを計算する
 */
export const calculateHash = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * ケースデータをスキャンし、アセットを asset://<hash> に置換して
 * ファイルのリストを抽出する
 */
export const prepareShareData = async (caseData) => {
  const nodes = JSON.parse(JSON.stringify(caseData.nodes)); // ディープコピー
  const filesMap = new Map(); // 重複排除のためのMap

  for (const node of nodes) {
    // pdfSrc または imageSrc を処理
    const srcFields = ['pdfSrc', 'imageSrc'];
    
    for (const field of srcFields) {
      const src = node[field];
      
      // Data URI や Blob URL の場合のみ処理
      if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
        try {
          const response = await fetch(src);
          const blob = await response.blob();
          const hash = await calculateHash(blob);
          
          const assetUrl = `asset://${hash}`;
          node[field] = assetUrl; // パスを置換
          
          if (!filesMap.has(hash)) {
            filesMap.set(hash, blob);
          }
        } catch (e) {
          console.error("Asset processing failed:", e);
        }
      }
    }
  }

  return {
    cleanJson: { ...caseData, nodes },
    files: Array.from(filesMap.values()),
    hashes: Array.from(filesMap.keys())
  };
};