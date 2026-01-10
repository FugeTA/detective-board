import { useState, useRef } from 'react';

export const useUIState = () => {
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [connectionDraft, setConnectionDraft] = useState(null);
  const [menu, setMenu] = useState(null); 
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  const fileInputRef = useRef(null);

  return {
    activeSidebar, setActiveSidebar,
    editingId, setEditingId,
    selectedIds, setSelectedIds,
    connectionDraft, setConnectionDraft,
    menu, setMenu,
    fullscreenImage, setFullscreenImage,
    fileInputRef
  };
};