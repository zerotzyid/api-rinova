const Axios = require("axios");
const { BASE_URL, MIRRORS, UA_LIST, TIMEOUT } = require("./config");
const { pageCache } = require("./cache");
const { getCookieString } = require("./cookie-jar");

const pickUA = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)];

const PROXY_ENDPOINTS = [
  // allorigins
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  // thingproxy (returns raw HTML)
  (url) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
  // r.jina.ai returns extracted text (fallback for text)
  (url) => `https://r.jina.ai/http/${encodeURIComponent(url)}`,
];

async function buildHeaders() {
  const headers = {
    "User-Agent": pickUA(),
    Referer: BASE_URL,
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
    validateStatus: (s) => s === 200,
  });
  return typeof res.data === "string" ? res.data : "";
}

async function tryGetViaProxies(url) {
  for (const buildProxyUrl of PROXY_ENDPOINTS) {
    try {
      const proxyUrl = buildProxyUrl(url);
      const res = await Axios.get(proxyUrl, {
        timeout: TIMEOUT,
        validateStatus: (s) => s === 200,
      });
      const data = typeof res.data === "string" ? res.data : "";
      if (data && data.length > 100) return data; // basic sanity
    } catch (e) {
      // try next proxy
    }
  }
  throw new Error("all proxies failed");
}

async function tryGet(url) {
  // Try direct first
  try {
    return await tryGetDirect(url);
  } catch (e) {
    // fallback to proxies
    return await tryGetViaProxies(url);
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
      lastErr = e;
    }
  }
  throw lastErr || new Error("upstream tidak tersedia");
}

module.exports = { fetchHtml, tryGet };
