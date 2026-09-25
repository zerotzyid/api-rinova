const Axios = require("axios");
const { BASE_URL, MIRRORS, UA_LIST, TIMEOUT } = require("./config");
const { pageCache } = require("./cache");
const { getCookieString } = require("./cookie-jar");

const pickUA = () => UA_LIST[Math.floor(Math.random() * UA_LIST.length)];
const PROXY_URL = "https://api.allorigins.win/raw?url=";

async function tryGetDirect(url) {
  const headers = {
    "User-Agent": pickUA(),
    Referer: BASE_URL,
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    Accept: "text/html,application/xhtml+xml",
  };
  const cookie = await getCookieString();
  if (cookie) headers.Cookie = cookie;

  const res = await Axios.get(url, {
    headers,
    timeout: TIMEOUT,
    validateStatus: (s) => s === 200,
  });
  return typeof res.data === "string" ? res.data : "";
}

async function tryGetViaProxy(url) {
  const proxyUrl = PROXY_URL + encodeURIComponent(url);
  const res = await Axios.get(proxyUrl, {
    timeout: TIMEOUT,
    validateStatus: (s) => s === 200,
  });
  return typeof res.data === "string" ? res.data : "";
}

async function tryGet(url) {
  // Try direct first
  try {
    return await tryGetDirect(url);
  } catch (e) {
    // fallback to proxy
    try {
      return await tryGetViaProxy(url);
    } catch (e2) {
      throw e2;
    }
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
