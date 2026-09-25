const bg = require("../helpers/blogger");

const PROXY_BASE = "/api/bv";

exports.checkToken = async (req, res) => {
  const token = req.query.token || bg.tokenFromUrl(req.query.u || "");
  if (!token) return res.status(400).json({ valid: false, error: "token wajib diisi" });
  try {
    const r = await bg.fetchPlayer(token);
    if (!r) return res.json({ valid: false, reason: "empty_response", token });
    const unavailable = /Video is unavailable|video tidak tersedia|This video is unavailable/i.test(r);
    return res.json({ valid: !unavailable, reason: unavailable ? "unavailable" : "ok", token, size: r.length });
  } catch (e) {
    return res.status(502).json({ valid: false, reason: "upstream_error", error: e.message, token });
  }
};

exports.frame = async (req, res) => {
  const token = req.query.token || bg.tokenFromUrl(req.query.u || "");
  if (!token) return res.status(400).json({ error: "token wajib diisi", code: "MISSING_TOKEN" });
  const start = Date.now();
  try {
    const html = await bg.fetchPlayer(token);
    if (!html) {
      console.log(`[blogger] frame: empty response token=${token.slice(0,20)}... ms=${Date.now()-start}`);
      return res.status(502).json({ error: "gagal memuat blogger (empty)", code: "EMPTY_RESPONSE" });
    }
    const unavailable = /Video is unavailable|video tidak tersedia|This video is unavailable/i.test(html);
    if (unavailable) {
      console.log(`[blogger] frame: video unavailable token=${token.slice(0,20)}... ms=${Date.now()-start}`);
      return res.status(410).json({ error: "Video tidak tersedia / expired", code: "VIDEO_UNAVAILABLE", token: token.slice(0,20) + "..." });
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Blogger-Token", token.slice(0,20) + "...");
    res.setHeader("X-Response-Time", `${Date.now()-start}ms`);
    console.log(`[blogger] frame: ok token=${token.slice(0,20)}... size=${html.length} ms=${Date.now()-start}`);
    return res.send(bg.rewriteHtml(html, PROXY_BASE));
  } catch (e) {
    console.error(`[blogger] frame: error token=${token.slice(0,20)}... ${e.message}`);
    return res.status(502).json({ error: "gagal memuat blogger: " + e.message, code: "UPSTREAM_ERROR" });
  }
};

function pickHeaders(r) {
  const h = {};
  const ct = r.headers["content-type"];
  if (ct) h["Content-Type"] = ct;
  const cl = r.headers["content-length"];
  if (cl) h["Content-Length"] = cl;
  const ar = r.headers["accept-ranges"];
  if (ar) h["Accept-Ranges"] = ar;
  const cr = r.headers["content-range"];
  if (cr) h["Content-Range"] = cr;
  const cd = r.headers["content-disposition"];
  if (cd) h["Content-Disposition"] = cd;
  const cc = r.headers["cache-control"];
  if (cc) h["Cache-Control"] = cc;
  return h;
}

exports.direct = async (req, res) => {
  const token = req.query.token || bg.tokenFromUrl(req.query.u || "");
  if (!token) return res.status(400).json({ error: "token wajib diisi", code: "MISSING_TOKEN" });
  const start = Date.now();
  try {
    const html = await bg.fetchPlayer(token);
    if (!html) {
      console.log(`[blogger] direct: empty response token=${token.slice(0,20)}... ms=${Date.now()-start}`);
      return res.status(502).json({ error: "empty response", code: "EMPTY_RESPONSE" });
    }
    const cfg = bg.parseVideoConfig(html);
    if (!cfg || !cfg.streams.length) {
      const unavailable = /Video is unavailable|video tidak tersedia|This video is unavailable/i.test(html);
      const modernPlayer = /BloggerVideoPlayerUi|WIZ_global_data|boq-blogger/i.test(html);
      console.log(`[blogger] direct: no VIDEO_CONFIG token=${token.slice(0,20)}... unavailable=${unavailable} modern=${modernPlayer} ms=${Date.now()-start}`);
      return res.status(410).json({ 
        error: "VIDEO_CONFIG tidak ditemukan - player modern (WIZ/BloggerVideoPlayerUi)", 
        code: "NO_VIDEO_CONFIG", 
        unavailable,
        modernPlayer,
        note: "Gunakan /api/bv/frame?token=... + hook __bv untuk dapat direct URL via postMessage"
      });
    }
    const best = cfg.streams[0];
    console.log(`[blogger] direct: ok token=${token.slice(0,20)}... quality=${best.quality} type=${best.type} url=${best.play_url?.slice(0,80)}... ms=${Date.now()-start}`);
    if (req.query.redirect === '1' && best.play_url) {
      return res.redirect(302, best.play_url);
    }
    return res.json({ token: token.slice(0,20)+"...", streams: cfg.streams, best, raw: cfg.raw });
  } catch (e) {
    console.error(`[blogger] direct: error token=${token.slice(0,20)}... ${e.message}`);
    return res.status(502).json({ error: e.message, code: "UPSTREAM_ERROR" });
  }
};

exports.testPlayer = async (req, res) => {
  const token = req.query.token || bg.tokenFromUrl(req.query.u || "");
  if (!token) return res.status(400).send("token wajib diisi");
  const frameUrl = `/api/bv/frame?token=${encodeURIComponent(token)}`;
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Test Blogger Player</title>
<style>body{margin:0;background:#000;color:#eee;font-family:system-ui,sans-serif}.stage{position:relative;width:100%;height:100vh;background:#000}video,iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}#info{position:fixed;top:10px;left:10px;z-index:10;background:rgba(0,0,0,.7);padding:8px;border-radius:4px;font-size:12px;max-width:90%;word-break:break-all}</style></head><body>
<div class="stage"><video id="v" controls playsinline style="display:none"></video><iframe id="f" src="${frameUrl}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
<div id="info">Menunggu stream...</div>
<script>
const v=document.getElementById('v'), f=document.getElementById('f'), info=document.getElementById('info');
window.addEventListener('message', e=>{
  const u = e?.data?.__bv;
  if(!u) return;
  info.textContent = 'stream: ' + u.slice(0,200);
  if(/.mp4|googlevideo/i.test(u)){
    v.style.display='block';
    f.style.display='none';
    v.src = u;
    v.play().catch(()=>{});
  }
});
setTimeout(()=>{info.textContent+=' (timeout: tidak ada postMessage)';},30000);
</script></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
};

exports.asset = async (req, res) => {
  const sub = "/" + ((req.params && req.params[0]) || "");
  const query = { ...req.query };
  const start = Date.now();
  try {
    let r;
    if (req.method === "POST") {
      const body = req.body && Object.keys(req.body).length ? new URLSearchParams(req.body).toString() : req._rawBody || "";
      r = await bg.forwardPost(sub, query, body, req.headers["content-type"]);
    } else {
      r = await bg.forwardGet(sub, query, req.headers.range);
    }
    const status = r.status || 200;
    res.status(status);
    const h = pickHeaders(r);
    for (const k of Object.keys(h)) res.setHeader(k, h[k]);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Proxy-Time", `${Date.now()-start}ms`);
    res.setHeader("X-Upstream-Status", status);
    const buf = Buffer.from(r.data || []);
    if (String(h["Content-Type"] || "").includes("javascript") || /\.js$/i.test(sub)) {
      let s = buf.toString("utf8");
      s = s.split("https://www.blogger.com/_/").join(PROXY_BASE + "/_/");
      s = s.split('"//www.blogger.com/_/').join('"' + PROXY_BASE + "/_/");
      console.log(`[blogger] asset: js rewrite sub=${sub} status=${status} size=${s.length} ms=${Date.now()-start}`);
      return res.send(s);
    }
    console.log(`[blogger] asset: ${req.method} sub=${sub} status=${status} size=${buf.length} ms=${Date.now()-start}`);
    return res.send(buf);
  } catch (e) {
    console.error(`[blogger] asset: error ${req.method} sub=${sub} ${e.message}`);
    return res.status(502).json({ error: "proxy gagal: " + e.message, code: "PROXY_ERROR" });
  }
};