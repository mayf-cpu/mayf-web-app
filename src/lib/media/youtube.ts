/** Convert only recognized YouTube video links into an embeddable player URL. */
export function youtubeVideo(source: string, autoplay = false) {
  const input = source?.trim();
  if (!input) return null;
  let id = /^[\w-]{11}$/.test(input) ? input : '';
  let start = 0;
  let end = 0;
  if (!id) {
    try {
      const url = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
      const host = url.hostname.toLowerCase();
      const parts = url.pathname.split('/').filter(Boolean);
      if (['youtu.be', 'www.youtu.be'].includes(host)) id = parts.length === 1 ? parts[0] : '';
      else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else if (['embed', 'shorts', 'live', 'v'].includes(parts[0]) && parts.length === 2) id = parts[1];
      } else return null;
      const time = url.searchParams.get('start') || url.searchParams.get('t') || new URLSearchParams(url.hash.slice(1)).get('t') || '';
      start = seconds(time);
      end = seconds(url.searchParams.get('end') || '');
    } catch { return null; }
  }
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  const query = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (start) query.set('start', String(start));
  if (end > start) query.set('end', String(end));
  if (autoplay) query.set('autoplay', '1');
  return { id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${query}`, watchUrl: `https://www.youtube.com/watch?v=${id}${start ? '&t=' + start : ''}` };
}
function seconds(value: string): number {
  if (/^\d+$/.test(value)) return Math.min(Number(value), 604800);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return match ? Math.min(Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0), 604800) : 0;
}
