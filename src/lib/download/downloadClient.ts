/**
 * Client-side download coordinator for Maths at Your Fingertips.
 * Communicates with server-side download authorization and handles
 * secure file delivery.
 */

import { hasPdfMarkers } from './pdfIntegrity';

export interface DownloadAuthResponse {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  expiresInSeconds: number;
}

/**
 * Requests short-lived download authorization from the server.
 * Requires a valid Cloudflare Turnstile token for all downloads (free & paid).
 * Paid items also require a valid Firebase ID token in the Authorization header.
 */
export async function requestDownloadAuthorization(
  contentId: string,
  turnstileToken: string,
  idToken?: string | null
): Promise<DownloadAuthResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch('/api/downloads/authorize', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contentId,
      turnstileToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    const errorMsg = data.error || 'Failed to authorize download';
    const err = new Error(errorMsg);
    (err as any).statusCode = response.status;
    (err as any).requiresLogin = response.status === 401;
    (err as any).requiresEntitlement = response.status === 403;
    throw err;
  }

  return data as DownloadAuthResponse;
}

/**
 * Triggers the browser download using the single-use short-lived download URL.
 */
export async function triggerAuthorizedDownload(downloadUrl: string, fallbackFileName: string): Promise<void> {
  const blob = await fetchAuthorizedPdf(downloadUrl);
  savePdfBlob(blob, fallbackFileName);
}

/** Saving bytes already delivered after verification does not redeem a token again. */
export function savePdfBlob(blob: Blob, fallbackFileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fallbackFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 1000);
}

/** Redeem exactly once and verify delivery before reporting success or rendering a preview. */
export async function fetchAuthorizedPdf(downloadUrl: string, fetcher: typeof fetch = fetch): Promise<Blob> {
  if (!/^\/api\/downloads\/file\/[a-f0-9]{64}$/.test(downloadUrl)) throw new Error('Invalid secure download address.');
  const response = await fetcher(downloadUrl, { credentials: 'same-origin', redirect: 'manual' });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'The PDF could not be delivered. Please retry verification.');
  }
  if (response.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/pdf') {
    throw new Error('The server did not return a PDF. Please retry verification.');
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!hasPdfMarkers(bytes)) throw new Error('The delivered PDF is incomplete or invalid.');
  return new Blob([bytes], { type: 'application/pdf' });
}
