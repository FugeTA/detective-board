import { useState, useEffect } from 'react';
import { db } from '../../db';

export const useAsset = (src, reloadToken) => {
  const [resolvedSrc, setResolvedSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    // data:, blob:, http: はそのまま表示可能
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
      setResolvedSrc(src);
      return;
    }

    let isMounted = true;
    let objectUrl = null;

    const loadAsset = async () => {
      setIsLoading(true);
      try {
        const cached = await db.pdfCache.get(src);
        if (cached && isMounted) {
          objectUrl = URL.createObjectURL(cached.blob);
          setResolvedSrc(objectUrl);
        }
      } catch (e) {
        console.error("Failed to load asset from IDB:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAsset();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, reloadToken]);

  return { resolvedSrc, isLoading };
};