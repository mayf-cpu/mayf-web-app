import type { ContentListResponse } from '../../services/adminService';
export async function requestAdminCatalogue(url: string, headers: HeadersInit, request: typeof fetch = fetch): Promise<ContentListResponse> {
  const response = await request(url,{method:'GET',headers});
  if (!response.ok) throw Error(`Catalogue request failed (HTTP ${response.status}). Retry shortly.`);
  const data = await response.json();
  if (data?.success !== true || !Array.isArray(data.items) || !data.items.every((item: any)=>item && typeof item.id === 'string' && typeof item.title === 'string') ||
      !data.counts || !['total','active','archived','published','draft','hidden'].every(key=>Number.isSafeInteger(data.counts[key]) && data.counts[key]>=0)) throw Error('Catalogue response could not be verified. Retry shortly.');
  return data;
}
