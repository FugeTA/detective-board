'use client';

import { NodeData } from '@/types';
import { useAsset } from '@/hooks/useAsset';
import styles from './MediaContent.module.css';

interface ImageContentProps {
  node: NodeData;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export function ImageContent({ node, onDoubleClick }: ImageContentProps) {
  const { resolvedSrc } = useAsset(node.imageSrc, node.reloadToken);

  return (
    <div
      className={`${styles.imageContainer} ${resolvedSrc ? styles.hasImage : ''}`}
      style={{
        minHeight: node.height || 120,
        backgroundImage: resolvedSrc ? `url(${resolvedSrc})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onDoubleClick={onDoubleClick}
    >
      {!resolvedSrc && <div className={styles.placeholder}>No Image</div>}
    </div>
  );
}
