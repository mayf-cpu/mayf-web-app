const cache = new Map<string, {url:string; until:number}>();
/** Resolve only known image-hosting pages. Never fetch arbitrary admin URLs. */
export async function resolveBrandImageUrl(value: string, request = fetch): Promise<string> {
  let url: URL;
  try { url = new URL(value); } catch { return value; }
  if (url.hostname === 'diy-assets.classplus.co' && url.pathname === '/_next/image') {
    const original = url.searchParams.get('url');
    if (original?.startsWith('https://cdn-diy-public.classplus.co/')) return original;
  }
  if (url.protocol !== 'https:' || url.hostname !== 'ibb.co' || !/^\/[A-Za-z0-9]+$/.test(url.pathname) || url.username || url.password || url.port) return value;
  const cached = cache.get(value);
  if (cached && cached.until > Date.now()) return cached.url;
  try {
    const response = await request(url.href, {redirect:'manual', signal:AbortSignal.timeout(8000)});
    if (!response.ok) return value;
    const reader=response.body?.getReader(); if(!reader)return value;
    let html='';let size=0;const decoder=new TextDecoder();
    try { while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>262144)return value;html+=decoder.decode(part.value,{stream:true});if(/<meta\b[^>]*property=["\']og:image["\'][^>]*>/i.test(html))break;} } finally {await reader.cancel();}
    for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
      const attributes=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
      if(attributes.property!=='og:image')continue;
      const image=new URL((attributes.content || '').replace(/&amp;/g,'&'));
      if(image.protocol!=='https:' || image.hostname!=='i.ibb.co' || image.username || image.password || image.port)continue;
      if(cache.size>=32)cache.delete(cache.keys().next().value!);
      cache.set(value,{url:image.href,until:Date.now()+300000});return image.href;
    }
  } catch { /* Keep the saved value and let the image fallback handle provider failures. */ }
  return value;
}
