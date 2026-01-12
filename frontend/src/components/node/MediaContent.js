import React from 'react';
import { useAsset } from '../../hooks/utils/useAsset';
import styles from './MediaContent.module.css';
import clsx from 'clsx';

const MediaContent = ({ node, onImageDoubleClick }) => {
  const { resolvedSrc: imageSrc } = useAsset(node.imageSrc, node.reloadToken);
  const { resolvedSrc: audioSrc } = useAsset(node.audioSrc, node.reloadToken);
  const { resolvedSrc: videoSrc } = useAsset(node.videoSrc, node.reloadToken);

  if (node.type === 'photo') {
    return (
      <div 
        className={clsx(styles.photoInner, { [styles.hasImage]: node.imageSrc })} 
        style={{ 
          minHeight: node.height,
          backgroundImage: imageSrc ? `url(${imageSrc})` : undefined 
        }}
        onDoubleClick={(e) => onImageDoubleClick && onImageDoubleClick(e, node)}
      >
        {!node.imageSrc && "No Image"}
      </div>
    );
  }
  if (node.type === 'video' && videoSrc) {
    return <div className="nodrag" style={{ width: '100%' }}><video src={videoSrc} controls className={styles.video} onMouseDown={e => e.stopPropagation()} /></div>;
  }
  if (node.type === 'audio' && audioSrc) {
    return <div className={clsx("nodrag", styles.audioContainer)}><audio src={audioSrc} controls className={styles.audio} onMouseDown={e => e.stopPropagation()} /></div>;
  }
  return null;
};

export default MediaContent;