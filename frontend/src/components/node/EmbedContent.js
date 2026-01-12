import React from 'react';
import clsx from 'clsx';
import { getYouTubeId, getVimeoId, getSpotifyId } from '../../utils/media';
import styles from './EmbedContent.module.css';

const EmbedContent = ({ node, isSpacePressed }) => {
  const dragClassName = clsx(
    styles.dragHandle,
    isSpacePressed ? styles.grab : styles.move
  );

  if (node.type === 'youtube') {
    return (
      <div className={styles.container}>
        <div className={dragClassName}>YouTube</div>
        <iframe
          className={clsx(styles.iframe, styles.videoIframe)}
          src={`https://www.youtube.com/embed/${getYouTubeId(node.content)}`}
          allowFullScreen
          onMouseDown={(e) => e.stopPropagation()}
        ></iframe>
      </div>
    );
  }
  if (node.type === 'vimeo') {
    return (
      <div className={styles.container}>
        <div className={dragClassName}>Vimeo</div>
        <iframe
          className={clsx(styles.iframe, styles.videoIframe)}
          src={`https://player.vimeo.com/video/${getVimeoId(node.content)}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onMouseDown={(e) => e.stopPropagation()}
        ></iframe>
      </div>
    );
  }
  if (node.type === 'spotify') {
    const info = getSpotifyId(node.content);
    return (
      <div className={styles.container}>
        <div className={dragClassName}>Spotify</div>
        {info ? (
          <iframe
            className={clsx(styles.iframe, styles.spotifyIframe)}
            src={`https://open.spotify.com/embed/${info.type}/${info.id}`}
            allow="encrypted-media"
            onMouseDown={(e) => e.stopPropagation()}
          ></iframe>
        ) : (
          <div className={styles.spotifyError}>Invalid Spotify URL</div>
        )}
      </div>
    );
  }

  return null;
};

export default EmbedContent;