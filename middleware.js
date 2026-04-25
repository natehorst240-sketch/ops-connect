// Vercel Edge Middleware — HTTP Basic Auth on every request.
// Set SITE_PASSWORD in Vercel project settings → Environment Variables.
//
// Auth runs at the edge BEFORE any static files are served, so unauthenticated
// visitors never receive the JS bundles (which contain demo data). Real
// security, not a curtain over a fully-served app.

export const config = {
  // Match every path. Browsers cache Basic Auth credentials per origin, so
  // users are prompted once per session, not on every asset.
  matcher: '/:path*',
};

export default function middleware(request) {
  const expectedPassword = process.env.SITE_PASSWORD;

  // Fail closed if env var is missing — safer than accidentally serving
  // an unauthenticated demo because a config step was forgotten.
  if (!expectedPassword) {
    return new Response(
      'SITE_PASSWORD env var not configured. See Vercel project settings.',
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  const auth = request.headers.get('authorization');

  if (auth) {
    const [scheme, encoded] = auth.split(' ');
    if (scheme === 'Basic' && encoded) {
      try {
        const decoded = atob(encoded);
        const idx = decoded.indexOf(':');
        const password = idx >= 0 ? decoded.slice(idx + 1) : '';
        if (password === expectedPassword) {
          return; // Auth OK — pass through to the app
        }
      } catch {
        // Malformed header — fall through to 401
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="MX Connect Demo"',
      'Content-Type': 'text/plain',
    },
  });
}
