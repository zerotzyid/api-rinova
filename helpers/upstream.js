const Axios = require("axios");
const { BASE_URL, MIRRORS, UA_LIST, TIMEOUT } = require("./config");
const { pageCache } = require("./cache");
const { getCookieString } = require("./cookie-jar");

const pickUA = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)];

async function buildHeaders() {
  const headers = {
    "User-Agent": pickUA(),
    Referer: "https://otakudesu.blog/",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    Accept: "text/html,application/xhtml+xml",
  };
  const cookie = await getCookieString();
  if (cookie) headers.Cookie = cookie;
  return headers;
}

async function tryGetDirect(url) {
  const headers = await buildHeaders();
  const res = await Axios.get(url, {
    headers,
    timeout: TIMEOUT,
    validateStatus: () => true,
    responseType: "text",
    maxRedirects: 5,
  });
  if (res.status !== 200) {
    const err = new Error(`upstream ${res.status}`);
    err.status = res.status;
    err.len = (res.data && res.data.length) || 0;
    throw err;
  }
  return typeof res.data === "string" ? res.data : "";
}

async function tryGet(url) {
  // Try direct (which is already the proxy) with a single retry
  try {
    return await tryGetDirect(url);
  } catch (e) {
    // one retry on network hiccup
    await new Promise(r => setTimeout(r, 500));
    return await tryGetDirect(url);
  }
}

async function fetchHtml(pathOrUrl) {
  const bases = [BASE_URL, ...MIRRORS];
  const isFull = /^https?:\/\//i.test(pathOrUrl);
  const paths = isFull ? [pathOrUrl] : bases.map((b) => b + String(pathOrUrl || "").replace(/^\/+/, ""));
  const key = "html:" + (isFull ? pathOrUrl : paths[0]);
  const hit = pageCache.get(key);
  if (hit) return { html: hit, url: paths[0], cached: true };
  let lastErr = null;
  for (const u of paths) {
    try {
      const html = await tryGet(u);
      pageCache.set(key, html);
      return { html, url: u, cached: false };
    } catch (e) {
      console.warn("[upstream] fetch failed", { path: u, status: e.status, len: e.len, msg: e.message });
      lastErr = e;
    }
  }
  throw lastErr || new Error("upstream tidak tersedia");
}

module.exports = { fetchHtml, tryGet };
