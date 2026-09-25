// ==== otakuproxy – Cloudflare Worker (optional auth, no path prefix) ====
// -------------------------------------------------------------
// All paths are mirrored to https://otakudesu.blog preserving path & query.
// If the request contains header X-Rinova-Proxy-Key that matches the
// secret bound in Cloudflare (RINOVA_PROXY_KEY), the request is
// considered authenticated.  The worker strips that header before
// forwarding.  The presence of the correct header allows a Cloudflare
// Custom Rule to skip WAF / Bot Fight Mode for those requests.
// Requests without the header are still forwarded (public access) but
// will go through normal Cloudflare security.
// -------------------------------------------------------------

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const UPSTREAM = 'https://otakudesu.blog';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathWithQuery = url.pathname + url.search;

    // ---- DEBUG ENDPOINT -------------------------------------------------
    if (pathWithQuery === '/__debug_ip') {
      return new Response(JSON.stringify({
        cfConnectingIp: request.headers.get('cf-connecting-ip'),
        cfRay: request.headers.get('cf-ray'),
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host')
      }, null, 2), { headers: { 'content-type': 'application/json' } });
    }

    // ---- OPTIONAL AUTH --------------------------------------------------
    const provided = request.headers.get('x-rinova-proxy-key') || '';
    const expected = env.RINOVA_PROXY_KEY || 'f141061f471140e6ab5ff92ca76bd822ce2463cd4f384f3eb9f7b123c1b684d4';
    const isAuthed = expected && provided === expected;

    // ---- FORWARD TO OTAKUDESU.BLOG ------------------------------------
    const upstreamUrl = new URL(pathWithQuery, UPSTREAM).toString();

    const fwdHeaders = new Headers(request.headers);
    // Remove internal auth header before reaching upstream
    fwdHeaders.delete('x-rinova-proxy-key');
    // Force a realistic browser UA
    fwdHeaders.set('user-agent', BROWSER_UA);

    const init = {
      method: request.method,
      headers: fwdHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? null : await request.arrayBuffer(),
      redirect: 'follow',
      cf: { cacheTtl: 300 }
    };

    const upstreamResp = await fetch(upstreamUrl, init);
    // Expose upstream HTTP status for easy debugging
    const respHeaders = new Headers(upstreamResp.headers);
    respHeaders.set('x-upstream-status', upstreamResp.status.toString());
    respHeaders.set('x-rinova-authed', isAuthed ? '1' : '0');

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      statusText: upstreamResp.statusText,
      headers: respHeaders,
    });
  }
};