import { useEffect } from 'react';
import { getYouTubeId, getVimeoId, getSpotifyId } from '../utils/media';
import { generateId } from '../utils/id';
import { getRandomRotation } from '../utils/math';

export const useClipboardEvents = ({
  view,
  setNodes,
  pushHistory,
  setSelectedIds,
  editingId
}) => {
  useEffect(() => {
    const handlePaste = (event) => {
      if (editingId !== null) return;
      const items = event.clipboardData.items;
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
        const isUrl = /^https?:\/\//.test(text.trim());
        const youtubeId = isUrl ? getYouTubeId(text.trim()) : null;
        const vimeoId = isUrl ? getVimeoId(text.trim()) : null;
        const spotifyInfo = isUrl ? getSpotifyId(text.trim()) : null;

        const centerX = (window.innerWidth / 2 - view.x) / view.scale;
        const centerY = (window.innerHeight / 2 - view.y) / view.scale;
        const newId = generateId('node');
        
        let type = isUrl ? 'link' : 'note';
        let w = 180, h = 150;
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
          content: text,
          imageSrc: null,
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

    // 2. URLの場合 (Webからのドラッグ)
    const imageUrl = e.dataTransfer.getData('text/uri-list');
    if (imageUrl) {
        pushHistory();
        const img = new Image();
        img.src = imageUrl;
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
                imageSrc: imageUrl,
                rotation: getRandomRotation(),
                aspectRatio: ratio,
                parentId: null,
             };
             setNodes(prev => [...prev, newNode]);
             setSelectedIds(new Set([newId]));
        };
        return;
    }

    // 3. テキストの場合
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
        pushHistory();
        const isUrl = /^https?:\/\//.test(text.trim());
        const youtubeId = isUrl ? getYouTubeId(text.trim()) : null;
        const vimeoId = isUrl ? getVimeoId(text.trim()) : null;
        const spotifyInfo = isUrl ? getSpotifyId(text.trim()) : null;

        let type = isUrl ? 'link' : 'note';
        let w = 180, h = 150;
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
          rotation: getRandomRotation(),
          parentId: null,
        };
        setNodes(prev => [...prev, newNode]);
        setSelectedIds(new Set([newId]));
    }
  };

  return { handleDragOver, handleDrop };
};