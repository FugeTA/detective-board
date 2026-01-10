export const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const getVimeoId = (url) => {
  if (!url) return null;
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

export const getSpotifyId = (url) => {
  if (!url) return null;
  const regExp = /open\.spotify\.com\/(track|album|playlist|artist|episode)\/([a-zA-Z0-9]+)/;
  const match = url.match(regExp);
  return match ? { type: match[1], id: match[2] } : null;
};