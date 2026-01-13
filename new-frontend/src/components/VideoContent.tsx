'use client';

import { NodeData } from '@/types';
import { useAsset } from '@/hooks/useAsset';
import styles from './MediaContent.module.css';

interface VideoContentProps {
  node: NodeData;
}

export function VideoContent({ node }: VideoContentProps) {
  const { resolvedSrc } = useAsset(node.videoSrc, node.reloadToken);

  if (!resolvedSrc) {
    return <div className={styles.placeholder}>No Video</div>;
  }

  return (
    <div className="nodrag" style={{ width: '100%' }}>
      <video
        src={resolvedSrc}
        controls
        className={styles.video}
        onMouseDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
