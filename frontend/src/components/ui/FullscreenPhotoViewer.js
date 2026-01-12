import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import styles from './FullscreenPhotoViewer.module.css';

const FullscreenPhotoViewer = ({ src }) => {
  const [resolvedSrc, setResolvedSrc] = useState(null);

  useEffect(() => {
    if (!src) return;
    
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
      setResolvedSrc(src);
      return;
    }

    let isMounted = true;
    let objectUrl = null;

    const loadAsset = async () => {
      try {
        const cached = await db.pdfCache.get(src);
        if (cached && isMounted) {
          objectUrl = URL.createObjectURL(cached.blob);
          setResolvedSrc(objectUrl);
        }
      } catch (e) {
        console.error("Failed to load fullscreen image asset:", e);
      }
    };
    loadAsset();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolvedSrc ? (
    <img src={resolvedSrc} className={styles.image} alt="Fullscreen" />
  ) : (
    <div className={styles.loading}>Loading Image...</div>
  );
};

export default FullscreenPhotoViewer;