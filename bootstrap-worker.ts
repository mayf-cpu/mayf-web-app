interface RuntimeEnvironment {
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// Provides a runtime so Cloudflare can accept server-side secrets while the
// full API is validated on its preview branch. Static assets serve the website.
export default {
  async fetch(request: Request, env: RuntimeEnvironment): Promise<Response> {
    if (request.method === 'GET' && new URL(request.url).pathname === '/api/health') {
      return json({
        status: 'backend_setup_required',
        app: 'Maths at Your Fingertips',
        runtime: 'bootstrap',
        backendEnabled: false,
        firebaseSecretPresent: Boolean(env.FIREBASE_SERVICE_ACCOUNT_JSON || env.GOOGLE_SERVICE_ACCOUNT_KEY),
      });
    }
    return json({
      success: false,
      error: 'The backend is being configured. Please try again later.',
      code: 'BACKEND_SETUP_REQUIRED',
    }, 503);
  },
};
