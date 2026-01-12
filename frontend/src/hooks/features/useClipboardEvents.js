import { useEffect } from 'react';
import { getYouTubeId, getVimeoId, getSpotifyId } from '../../utils/media';
import { generateId } from '../../utils/id';
import { getRandomRotation } from '../../utils/math';

export const useClipboardEvents = ({
  view,
  setNodes,
  pushHistory,
  setSelectedIds,
  editingId
}) => {
  useEffect(() => {
    const handlePaste = (event) => {
      // 入力フィールド（サイドバーの共有コード入力欄など）にフォーカスがある場合は、
      // ボードへのノード作成処理をスキップする
      const isInputFocused = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA';
      if (editingId !== null || isInputFocused) return;

      const items = event.clipboardData.items;
      
      // PDFファイルのペースト
      const pdfItem = Array.from(items).find(item => item.type === 'application/pdf');
      if (pdfItem) {
        event.preventDefault();
        const file = pdfItem.getAsFile();
        if (!file) return;
        pushHistory();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          const centerX = (window.innerWidth / 2 - view.x) / view.scale;
          const centerY = (window.innerHeight / 2 - view.y) / view.scale;
          const newId = generateId('node');
          const newNode = {
            id: newId,
            x: centerX - 150, y: centerY - 200,
            width: 300, height: 400,
            type: 'pdf',
            content: '',
            pdfSrc: base64,
            color: '#ffffff',
            rotation: getRandomRotation(),
            parentId: null,
          };
          setNodes(prev => [...prev, newNode]);
          setSelectedIds(new Set([newId]));
        };
        reader.readAsDataURL(file);
        return;
      }

      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
      
      if (imageItem) {
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return;

        pushHistory();
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          const img = new Image();
          img.src = base64;
          img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            const newWidth = 220;
            const newHeight = (newWidth / ratio) + 50;
            
            const centerX = (window.innerWidth / 2 - view.x) / view.scale;
            const centerY = (window.innerHeight / 2 - view.y) / view.scale;

            const newId = generateId('node');
            const newNode = {
              id: newId,
              x: centerX - newWidth / 2,
              y: centerY - newHeight / 2,
              width: newWidth,
              height: newHeight,
              type: 'photo',
              content: '',
              imageSrc: base64,
              color: '#ffffff',
              rotation: getRandomRotation(),
              aspectRatio: ratio,
              parentId: null,
            };
            setNodes(prev => [...prev, newNode]);
            setSelectedIds(new Set([newId]));
          };
        };
        reader.readAsDataURL(file);
        return;
      }

      const text = event.clipboardData.getData('text');
      if (text) {
        event.preventDefault();
        pushHistory();
        
        // 改行で分割し、最初の空でない行を取得する
        const lines = text.split(/\r?\n/);
        let cleanText = lines.find(line => line.trim().length > 0)?.trim() || text.trim();
        // 不可視文字（ゼロ幅スペース等）を削除
        cleanText = cleanText.replace(/[\u200B-\u200D\uFEFF]/g, '');
        const isUrl = /^(https?|file):\/\//.test(cleanText);

        // 画像URLの判定 (Paste時も有効にする)
        if (isUrl && /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff|ico)($|\?|#)/i.test(cleanText)) {
            const img = new Image();
            img.src = cleanText;
            img.onload = () => {
                 const ratio = img.naturalWidth / img.naturalHeight;
                 const newWidth = 220;
                 const newHeight = (newWidth / ratio) + 50;
                 
                 const centerX = (window.innerWidth / 2 - view.x) / view.scale;
                 const centerY = (window.innerHeight / 2 - view.y) / view.scale;

                 const newId = generateId('node');
                 const newNode = {
                    id: newId,
                    x: centerX - newWidth / 2,
                    y: centerY - newHeight / 2,
                    width: newWidth,
                    height: newHeight,
                    type: 'photo',
                    content: '',
                    imageSrc: cleanText,
                    color: '#ffffff',
                    rotation: getRandomRotation(),
                    aspectRatio: ratio,
                    parentId: null,
                 };
                 setNodes(prev => [...prev, newNode]);
                 setSelectedIds(new Set([newId]));
            };
            return;
        }

        let isPdfUrl = false;
        if (isUrl) {
          // 正規表現でチェック (.pdfの後にスラッシュ、クエリ、ハッシュ、または行末が来る場合)
          if (/\.pdf([?#\/]|$)/i.test(cleanText)) {
            isPdfUrl = true;
          } else {
            try {
              const urlObj = new URL(cleanText);
              if (urlObj.pathname.toLowerCase().endsWith('.pdf')) isPdfUrl = true;
            } catch (e) {}
          }
        }
        
        const youtubeId = isUrl ? getYouTubeId(cleanText) : null;
        const vimeoId = isUrl ? getVimeoId(cleanText) : null;
        const spotifyInfo = isUrl ? getSpotifyId(cleanText) : null;

        const centerX = (window.innerWidth / 2 - view.x) / view.scale;
        const centerY = (window.innerHeight / 2 - view.y) / view.scale;
        const newId = generateId('node');
        
        let type = isUrl ? 'link' : 'note';
        let w = 180, h = 150;
        
        if (isPdfUrl) { type = 'pdf'; w = 300; h = 400; }
        else 
        if (youtubeId) { type = 'youtube'; w = 320; h = 220; }
        else if (vimeoId) { type = 'vimeo'; w = 320; h = 220; }
        else if (spotifyInfo) { type = 'spotify'; w = 300; h = spotifyInfo.type === 'track' ? 100 : 380; }

        const newNode = {
          id: newId,
          x: centerX - w / 2,
          y: centerY - h / 2,
          width: w,
          height: h,
          type: type,
          content: cleanText,
          imageSrc: null,
          color: type === 'note' ? '#fff9c4' : '#ffffff',
          pdfSrc: isPdfUrl ? cleanText : null,
          rotation: getRandomRotation(),
          parentId: null,
        };
        setNodes(prev => [...prev, newNode]);
        setSelectedIds(new Set([newId]));
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [view, editingId, pushHistory, setNodes, setSelectedIds]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (editingId !== null) return;

    const worldX = (e.clientX - view.x) / view.scale;
    const worldY = (e.clientY - view.y) / view.scale;

    // 1. ファイルの場合 (デスクトップからのドラッグなど)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (file.type === 'application/pdf') {
        pushHistory();
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          const newId = generateId('node');
          const newNode = {
            id: newId,
            x: worldX - 150, y: worldY - 200,
            width: 300, height: 400,
            type: 'pdf',
            content: '',
            pdfSrc: base64,
            color: '#ffffff',
            rotation: getRandomRotation(),
            parentId: null,
          };
          setNodes(prev => [...prev, newNode]);
          setSelectedIds(new Set([newId]));
        };
        reader.readAsDataURL(file);
        return;
      }

      if (file.type.startsWith('image/')) {
        pushHistory();
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          const img = new Image();
          img.src = base64;
          img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            const newWidth = 220;
            const newHeight = (newWidth / ratio) + 50;
            
            const newId = generateId('node');
            const newNode = {
              id: newId,
              x: worldX - newWidth / 2,
              y: worldY - newHeight / 2,
              width: newWidth,
              height: newHeight,
              type: 'photo',
              content: '',
              imageSrc: base64,
              color: '#ffffff',
              rotation: getRandomRotation(),
              aspectRatio: ratio,
              parentId: null,
            };
            setNodes(prev => [...prev, newNode]);
            setSelectedIds(new Set([newId]));
          };
        };
        reader.readAsDataURL(file);
        return;
      }
    }

    // 2. テキスト/URLの場合 (Webからのドラッグ含む)
    const uriList = e.dataTransfer.getData('text/uri-list');
    const plainText = e.dataTransfer.getData('text/plain');
    const textContent = uriList || plainText;

    if (textContent) {
        // 改行で分割し、最初の空でない行を取得する
        const lines = textContent.split(/\r?\n/);
        let text = lines.find(line => line.trim().length > 0)?.trim() || textContent.trim();
        // 不可視文字を削除
        text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
        const isUrl = /^(https?|file):\/\//.test(text);

        // 画像URLの可能性がある場合 (拡張子で簡易判定)
        if (isUrl && /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff|ico)($|\?|#)/i.test(text)) {
            pushHistory();
            const img = new Image();
            img.src = text;
            img.onload = () => {
                 const ratio = img.naturalWidth / img.naturalHeight;
                 const newWidth = 220;
                 const newHeight = (newWidth / ratio) + 50;
                 
                 const newId = generateId('node');
                 const newNode = {
                    id: newId,
                    x: worldX - newWidth / 2,
                    y: worldY - newHeight / 2,
                    width: newWidth,
                    height: newHeight,
                    type: 'photo',
                    content: '',
                    imageSrc: text,
                    color: '#ffffff',
                    rotation: getRandomRotation(),
                    aspectRatio: ratio,
                    parentId: null,
                 };
                 setNodes(prev => [...prev, newNode]);
                 setSelectedIds(new Set([newId]));
            };
            return;
        }

        pushHistory();
        let isPdfUrl = false;
        if (isUrl) {
          // 正規表現でチェック
          if (/\.pdf([?#\/]|$)/i.test(text)) {
            isPdfUrl = true;
          } else {
            try {
              const urlObj = new URL(text);
              if (urlObj.pathname.toLowerCase().endsWith('.pdf')) isPdfUrl = true;
            } catch (e) {}
          }
        }

        const youtubeId = isUrl ? getYouTubeId(text) : null;
        const vimeoId = isUrl ? getVimeoId(text) : null;
        const spotifyInfo = isUrl ? getSpotifyId(text) : null;

        let type = isUrl ? 'link' : 'note';
        let w = 180, h = 150;
        
        if (isPdfUrl) { type = 'pdf'; w = 300; h = 400; }
        else
        if (youtubeId) { type = 'youtube'; w = 320; h = 220; }
        else if (vimeoId) { type = 'vimeo'; w = 320; h = 220; }
        else if (spotifyInfo) { type = 'spotify'; w = 300; h = spotifyInfo.type === 'track' ? 100 : 380; }

        const newId = generateId('node');
        const newNode = {
          id: newId,
          x: worldX - w / 2,
          y: worldY - h / 2,
          width: w,
          height: h,
          type: type,
          content: text,
          imageSrc: null,
          color: type === 'note' ? '#fff9c4' : '#ffffff',
          pdfSrc: isPdfUrl ? text : null,
          rotation: getRandomRotation(),
          parentId: null,
        };
        setNodes(prev => [...prev, newNode]);
        setSelectedIds(new Set([newId]));
    }
  };

  return { handleDragOver, handleDrop };
};