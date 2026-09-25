const Axios = require("axios");
const cheerio = require("cheerio");
const { baseUrl, originBase } = require("./base-url");
const { fetchEmbedMp4, isAllowed } = require("./embed-unpack");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const NONCE_ACTION = "aa1208d27f29ca340c92c66d1926f13f";
const MIRROR_ACTION = "2a3505c93b0035d3f455df82bf976b84";

const ajaxHeaders = {
  "X-Requested-With": "XMLHttpRequest",
  Referer: originBase,
  Origin: originBase.replace(/\/$/, ""),
  Accept: "*/*",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  "User-Agent": USER_AGENT,
};

const jsonUrl = (url) => `${url}${url.includes("?") ? "&" : "?"}mode=json`;

const extractFile = (html) => {
  if (!html) return null;
  const match = html.match(/["']?file["']?\s*[:=]\s*["']([^"']+)["']/);
  if (match && match[1]) return match[1];

  const source1 = html.search('"file":');
  if (source1 !== -1) {
    const end = html.indexOf('","', source1);
    if (end !== -1) return html.substring(source1 + 8, end);
  }
  const source2 = html.search("'file':");
  if (source2 !== -1) {
    const end = html.indexOf("','", source2);
    if (end !== -1) return html.substring(source2 + 8, end);
  }
  return null;
};

const get = async (url) => {
  if (!url) return "-";

  let html = "";

  try {
    // url is already a full proxy URL (e.g. https://otakuproxy…/episode/…)
    const jsonResponse = await Axios.get(jsonUrl(url), {
      headers: ajaxHeaders,
      timeout: 20000,
    });
    const payload = jsonResponse.data;

    if (payload && typeof payload === "object" && payload.video) {
      return payload.video;
    }
    if (typeof payload === "string") {
      const trimmed = payload.trim();
      if (trimmed.startsWith("{")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && parsed.video) return parsed.video;
        } catch (e) {
          // bukan json, abaikan
        }
      } else if (trimmed.startsWith("<")) {
        html = payload;
      }
    }
  } catch (error) {
    // mode=json tidak tersedia, ambil halaman biasa
  }

  if (!html) {
    try {
      const response = await Axios.get(url, {          // url already proxied
        headers: { "User-Agent": USER_AGENT, Referer: originBase },
        timeout: 20000,
      });
      html = typeof response.data === "string" ? response.data : "";
    } catch (error) {
      return "-";
    }
  }

  const file = extractFile(html);
  if (file) return file;

  const $ = cheerio.load(html);
  const nested =
    $("#wrap iframe").attr("src") ||
    $("#pembed iframe").attr("src") ||
    $("iframe").attr("src");
  if (nested) return nested;

  if (isAllowed(url)) {
    const mp4s = await fetchEmbedMp4(url, originBase);
    if (mp4s.length) return mp4s[0];
  }

  return "-";
};

const resolveMirror = async (dataContent) => {
  const decoded = Buffer.from(dataContent, "base64").toString("utf8");
  const mirrorData = JSON.parse(decoded);
  // ajax endpoint **must go through the proxy**
  const ajaxUrl = `${baseUrl}wp-admin/admin-ajax.php`;

  const nonceResponse = await Axios.post(
    ajaxUrl,
    new URLSearchParams({ action: NONCE_ACTION }),
    { headers: ajaxHeaders, timeout: 20000 }
  );
  const nonce =
    nonceResponse.data && typeof nonceResponse.data === "object"
      ? nonceResponse.data.data
      : nonceResponse.data;
  if (!nonce) throw new Error("gagal mendapatkan nonce mirror");

  const mirrorResponse = await Axios.post(
    ajaxUrl,
    new URLSearchParams({ ...mirrorData, nonce, action: MIRROR_ACTION }),
    { headers: ajaxHeaders, timeout: 20000 }
  );
  const payload =
    mirrorResponse.data && typeof mirrorResponse.data === "object"
      ? mirrorResponse.data.data
      : mirrorResponse.data;
  if (!payload) throw new Error("mirror tidak tersedia");

  const html = Buffer.from(payload, "base64").toString("utf8");
  const $ = cheerio.load(html);
  return (
    $("#pembed iframe").attr("src") ||
    $("#embed_holder iframe").attr("src") ||
    $("iframe").attr("src") ||
    null
  );
};

module.exports = { get, resolveMirror };
