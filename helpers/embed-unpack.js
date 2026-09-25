const Axios = require("axios");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const MP4_RE = /https?:\/\/[^\s"'\\<>]+\.mp4[^\s"'\\<>]*/gi;
const M3U8_RE = /https?:\/\/[^\s"'\\<>]+\.m3u8[^\s"'\\<>]*/gi;
const SOURCE_RE = /(?:sources?|file|src)\s*[:=]\s*["']([^"']+\.(?:mp4|m3u8)[^"']*)["']/gi;

const ALLOW_HOSTS = [/odvidhide\./i, /filedon\./i, /vidhide\./i, /mega\./i];

function isAllowed(url) {
  return ALLOW_HOSTS.some((re) => re.test(url));
}

// Dean Edwards packer unpacker (from Decryptor repo)
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function toBase(n, b) {
  if (n === 0) return '0';
  let s = '';
  while (n) {
    s = CHARS[n % b] + s;
    n = Math.floor(n / b);
  }
  return s;
}
const PACKED_RE = /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)\)/;

function unpackPacker(html) {
  const m = html.match(PACKED_RE);
  if (!m) return null;
  const payload = m[1].replace(/\\'/g, "'");
  const radix = parseInt(m[2], 10);
  const count = parseInt(m[3], 10);
  const words = m[4].split('|');
  const map = new Map();
  for (let i = 0; i < count; i++) {
    const tok = toBase(i, radix);
    map.set(tok, words[i] && words[i].length ? words[i] : tok);
  }
  return payload.replace(/\b\w+\b/g, (t) => map.get(t) ?? t);
}

function findM3u8(text) {
  return [...new Set(text.match(/https?:\/\/[^\s"'\\]+\.m3u8[^\s"']*/g) || [])];
}

function extractMp4(html) {
  if (!html || typeof html !== "string") return [];
  const urls = new Set();

  let m;
  while ((m = MP4_RE.exec(html)) !== null) urls.add(m[0]);
  while ((m = SOURCE_RE.exec(html)) !== null) urls.add(m[1]);

  const unpacked = unpackPacker(html);
  if (unpacked) {
    while ((m = MP4_RE.exec(unpacked)) !== null) urls.add(m[0]);
    while ((m = SOURCE_RE.exec(unpacked)) !== null) urls.add(m[1]);
  }

  return Array.from(urls);
}

function extractM3u8(html) {
  if (!html || typeof html !== "string") return [];
  const urls = new Set();
  let m;
  while ((m = M3U8_RE.exec(html)) !== null) urls.add(m[0]);
  const unpacked = unpackPacker(html);
  if (unpacked) {
    while ((m = M3U8_RE.exec(unpacked)) !== null) urls.add(m[0]);
  }
  return Array.from(urls);
}

async function fetchEmbedMp4(url, referer) {
  if (!url || !isAllowed(url)) return [];

  const headers = {
    "User-Agent": USER_AGENT,
    Referer: referer || "https://otakudesu.blog/",
    Accept: "text/html,application/xhtml+xml",
  };

  try {
    const res = await Axios.get(url, {
      headers,
      timeout: 9000,
      validateStatus: () => true,
      responseType: "text",
      maxRedirects: 5,
    });
    const html = typeof res.data === "string" ? res.data : "";
    if (!html) return [];

    const mp4s = extractMp4(html);
    if (mp4s.length) return mp4s;

    // try m3u8 for hosts like vidhide
    const m3u8s = extractM3u8(html);
    if (m3u8s.length) return m3u8s; // return m3u8 as fallback

    const $ = require("cheerio").load(html);
    const nested = $("iframe").map((i, el) => $(el).attr("src")).get();
    for (const n of nested) {
      if (isAllowed(n)) {
        const sub = await fetchEmbedMp4(n, url);
        if (sub.length) return sub;
      }
    }
    return [];
  } catch (e) {
    return [];
  }
}

/**
 * Vidhide specific extractor (SR2) – uses generic packed‑JS unpacker.
 * Returns { m3u8, referer } or throws.
 */
async function fetchVidhideM3u8(embedUrl) {
  const EMBED_REFERER = 'https://www.rtally.shop/';
  const headers = {
    "User-Agent": USER_AGENT,
    Referer: EMBED_REFERER,
    Accept: "text/html,application/xhtml+xml",
  };
  const res = await Axios.get(embedUrl, {
    headers,
    timeout: 15000,
    validateStatus: () => true,
    responseType: "text",
    maxRedirects: 5,
  });
  const html = typeof res.data === "string" ? res.data : "";
  if (!html) throw new Error("empty html");
  const unpacked = unpackPacker(html);
  const m3u8s = findM3u8(unpacked || html);
  if (!m3u8s.length) throw new Error("no m3u8 found");
  const m3u8 = m3u8s[0];
  const referer = new URL(m3u8).origin;
  return { m3u8, referer };
}

/**
 * NOTE: odvidhide/filedon/vidhide/mega embeds use jwplayer with heavily obfuscated
 * Dean Edwards packed configuration. The video source is resolved client-side by
 * jwplayer after JS execution. Pure HTTP unpacking cannot extract these URLs.
 * 
 * Vercel free tier constraint: No headless browser (Puppeteer) allowed.
 * 
 * WORKAROUND: Use higher quality mirrors that resolve to odcloud/archive:
 * - 360p: often only filedon/vidhide/mega (no direct MP4 via HTTP)
 * - 480p/720p: often include odcdn/odstream which resolve to direct MP4
 * 
 * The auto-server endpoint already prioritizes odcloud > archive > fallback.
 * Custom player will play any direct MP4 from these sources.
 */

module.exports = { extractMp4, extractM3u8, fetchEmbedMp4, fetchVidhideM3u8, isAllowed, MP4_RE, M3U8_RE };