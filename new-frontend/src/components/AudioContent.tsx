'use client';

import { NodeData } from '@/types';
import { useAsset } from '@/hooks/useAsset';
import styles from './MediaContent.module.css';

interface AudioContentProps {
  node: NodeData;
}

export function AudioContent({ node }: AudioContentProps) {
  const { resolvedSrc } = useAsset(node.audioSrc, node.reloadToken);

  if (!resolvedSrc) {
    return <div className={styles.placeholder}>No Audio</div>;
  }

  return (
    <div className={`nodrag ${styles.audioContainer}`}>
      <audio
        src={resolvedSrc}
        controls
        className={styles.audio}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
