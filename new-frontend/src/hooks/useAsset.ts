'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db';

export function useAsset(src?: string, reloadToken?: number) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
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
    let objectUrl: string | null = null;
    const isAsset = src.startsWith('asset://');
    const cacheKey = isAsset ? src.replace('asset://', '') : src;

    const loadAsset = async () => {
      setIsLoading(true);
      try {
        if (isAsset) {
          const cached = await db.fileContent.get(cacheKey);
          if (cached && isMounted) {
            objectUrl = URL.createObjectURL(cached.blob);
            setResolvedSrc(objectUrl);
          }
        } else {
          const cached = await db.pdfCache.get(src);
          if (cached && isMounted) {
            objectUrl = URL.createObjectURL(cached.blob);
            setResolvedSrc(objectUrl);
          }
        }
      } catch (e) {
        console.error('Failed to load asset from IDB:', e);
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
}
