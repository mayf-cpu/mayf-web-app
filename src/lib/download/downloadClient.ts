/**
 * Client-side download coordinator for Maths at Your Fingertips.
 * Communicates with server-side download authorization and handles
 * secure file delivery.
 */

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
  // Use invisible iframe or anchor with download attribute
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fallbackFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 1000);
}
