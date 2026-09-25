const cheerio = require("cheerio");
const Axios = require("axios");
const { baseUrl } = require("../helpers/base-url");
const { BASE_URL } = require("../helpers/config");
const { fetchHtml } = require("../helpers/upstream");
const { pageCache } = require("../helpers/cache");
const R = require("../helpers/response");
const n = require("../helpers/normalize");
const anilist = require("../helpers/anilist");
const episodeHelper = require("../helpers/episodeHelper");

const stripPrefix = (id, prefix) => String(id || "").replace(new RegExp("^" + prefix + "/?"), "");
const noPrefix = (id) => String(id || "").replace(/^(anime|episode|batch)\//, "");
const apiHref = (kind, id) => (id ? `/api/${kind}/${id}` : null);

function genreItem(link, title) {
  const gid = n.idFromLink(link, "genres/");
  return {
    title: n.cleanText(title),
    genreId: gid,
    genre_id: gid,
    genre_name: n.cleanText(title),
    href: gid ? `/api/genres/${gid}/page/1` : null,
    otakudesuUrl: link || null,
  };
}

function infoMap($, root) {
  const map = {};
  root.find("p").each((i, el) => {
    const t = n.cleanText($(el).text());
    const m = t.match(/^([^:]+):\s*(.*)$/);
    if (m) map[n.cleanText(m[1]).toLowerCase()] = n.cleanText(m[2]);
  });
  return map;
}

function paragraphs($, sel) {
  const out = [];
  $(sel).each((i, el) => {
    const t = n.cleanText($(el).text());
    if (t) out.push(t);
  });
  return out;
}

exports.detailAnime = async (req, res) => {
  const id = n.cleanId(req.params.id);
  if (!id) return R.notFound(res, "id anime wajib diisi");
  try {
    const { html } = await fetchHtml(`anime/${id}`);
    const $ = cheerio.load(html);
    const foto = $(".venser .fotoanime");
    const poster = foto.find("img").attr("src") || null;
    if (!poster && !foto.length) return R.notFound(res, "anime tidak ditemukan");

    const info = infoMap($, foto.find(".infozin"));
    const title =
      info["judul"] ||
      n.cleanText($(".jdlrx h1").first().text()) ||
      n.cleanText($(".venser .jdlrx").first().text()) ||
      null;
    if (!title) return R.notFound(res, "anime tidak ditemukan");

    const genreList = [];
    foto.find("a[href*='/genres/'], a[href*='/genre/']").each((i, el) => {
      const link = $(el).attr("href") || "";
      if (!/\/genres?\//.test(link)) return;
      genreList.push(genreItem(link, $(el).text()));
    });

    const synParas = paragraphs($, ".fotoanime .sinopc p");
    const episodeList = [];
    $(".episodelist ul li").each((i, el) => {
      const a = $(el).find("span > a, a").first();
      const link = a.attr("href") || "";
      if (!/\/episode\//.test(link)) return;
      const full = n.idFromLink(link, "");
      const eid = noPrefix(full);
      const t = n.cleanText(a.text());
      episodeList.push({
        title: t,
        eps: n.parseEpsNumber(t),
        date: n.cleanText($(el).find(".zeebr").text()),
        episodeId: eid,
        id: full,
        href: apiHref("eps", full),
        otakudesuUrl: link,
      });
    });

    let batch = null;
    const bLink = $(".episodelist a[href*='/batch/']").first().attr("href") || $("a[href*='/batch/']").first().attr("href") || null;
    if (bLink) {
      const bid = noPrefix(n.idFromLink(bLink, ""));
      batch = { batchId: bid, id: bid, href: apiHref("batch", bid), otakudesuUrl: bLink };
    }

    const recommendedAnimeList = [];
    $(".venser a[href*='/anime/']").each((i, el) => {
      const img = $(el).find("img").first();
      if (!img.length) return;
      const link = $(el).attr("href") || "";
      const aid = noPrefix(n.idFromLink(link, ""));
      if (!aid) return;
      const t = n.cleanText(img.attr("alt") || $(el).text());
      recommendedAnimeList.push({
        title: t,
        poster: img.attr("src") || null,
        animeId: aid,
        id: aid,
        href: apiHref("anime", aid),
        otakudesuUrl: link,
      });
    });

    const totalRaw = info["total episode"] || null;
    const data = {
      title,
      poster,
      japanese: info["japanese"] || null,
      score: info["skor"] || null,
      producers: info["produser"] || info["producer"] || null,
      type: info["tipe"] || null,
      status: info["status"] || null,
      episodes: n.parseEpisodes(totalRaw),
      duration: info["durasi"] || null,
      aired: info["tanggal rilis"] || null,
      studios: info["studio"] || null,
      batch,
      synopsis: { paragraphs: synParas, connections: [] },
      sinopsis: synParas.join("\n\n") || null,
      genreList,
      genre_list: genreList,
      episodeList,
      episode_list: episodeList,
      recommendedAnimeList,
      batch_link: batch ? { ...batch } : { id: null, batchId: null, link: null, otakudesuUrl: null, href: null },
    };
    data.batchLink = data.batch_link;
    data.animeId = id;
    data.id = id;
    data.href = apiHref("anime", id);
    data.otakudesuUrl = `${baseUrl}anime/${id}`;

    data.anilist = await anilist.enrich(title, { episodes: data.episodes });
    return R.ok(res, data, null);
  } catch (e) {
    if (e && e.response && e.response.status === 404) return R.notFound(res, "anime tidak ditemukan");
    return R.fail(res, 502, (e && e.message) || "upstream tidak tersedia");
  }
};

function navEp($, re) {
  let out = null;
  $(".flir a").each((i, el) => {
    const link = $(el).attr("href") || "";
    if (!/\/episode\//.test(link)) return;
    const label = n.cleanText($(el).attr("title") + " " + $(el).text());
    if (!re.test(label)) return;
    const full = n.idFromLink(link, "");
    out = {
      title: n.cleanText($(el).text()) || "Prev",
      episodeId: noPrefix(full),
      id: full,
      href: apiHref("eps", full),
      otakudesuUrl: link,
    };
  });
  return out;
}

exports.epsAnime = async (req, res) => {
  const raw = n.cleanId(req.params[0] || "");
  if (!raw) return R.notFound(res, "id episode wajib diisi");
  const full = /^episode\//.test(raw) ? raw : `episode/${raw}`;
  try {
    const { html } = await fetchHtml(full);
    const $ = cheerio.load(html);
    const title = n.cleanText($(".venutama > h1").first().text() || $(".posttl").first().text());
    if (!title) return R.notFound(res, "episode tidak ditemukan");

    const aLink = $(".flir a[href*='/anime/']").first().attr("href") || null;
    const animeId = aLink ? noPrefix(n.idFromLink(aLink, "")) : null;
    const kat = n.cleanText($(".kategoz").text());
    const rel = (kat.match(/Release on [^|]*/i) || [null])[0];
    const defaultStreamingUrl = $("#embed_holder iframe").attr("src") || $("#pembed iframe").attr("src") || null;

    const prevEpisode = navEp($, /prev|sebelum/i);
    const nextEpisode = navEp($, /next|selanjut/i);

    const qualities = [];
    for (const q of ["360p", "480p", "720p"]) {
      const serverList = [];
      $(`.mirrorstream ul.m${q} > li`).each((i, el) => {
        const a = $(el).find("a").first();
        const token = a.attr("data-content") || null;
        if (!token) return;
        serverList.push({
          title: n.cleanText(a.text()),
          serverId: token,
          href: `/api/server/${token}`,
          data_content: token,
          dataContent: token,
        });
      });
      if (serverList.length) qualities.push({ title: q, quality: q, serverList });
    }

    const dlQualities = [];
    $(".download ul li").each((i, el) => {
      const strong = n.cleanText($(el).find("strong").text());
      if (!strong) return;
      const urls = [];
      $(el).find("a").each((j, a) => {
        if ($(a).attr("href")) urls.push({ title: n.cleanText($(a).text()), url: $(a).attr("href") });
      });
      if (!urls.length) return;
      dlQualities.push({ title: strong.replace(/\s+/g, "_"), size: n.cleanText($(el).find("i").text()), urls });
    });

    const infoPs = {};
    $(".infozingle p").each((i, el) => {
      const b = n.cleanText($(el).find("b").first().text()).toLowerCase();
      const t = n.cleanText($(el).text());
      const v = n.cleanText(t.split(":").slice(1).join(":"));
      if (b.includes("credit")) infoPs.credit = v;
      else if (b.includes("encoder")) infoPs.encoder = v;
      else if (b.includes("dur")) infoPs.duration = v;
      else if (b.includes("tipe") || b.includes("type")) infoPs.type = v;
    });
    const infoGenres = [];
    $(".infozingle a[href*='/genres/']").each((i, el) => {
      infoGenres.push(genreItem($(el).attr("href"), $(el).text()));
    });
    const infoEps = [];
    $("#selectcog option").each((i, el) => {
      const v = $(el).attr("value") || "";
      if (!/\/episode\//.test(v)) return;
      const full2 = n.idFromLink(v, "");
      const t = n.cleanText($(el).text());
      infoEps.push({
        title: t,
        eps: n.parseEpsNumber(t),
        date: "",
        episodeId: noPrefix(full2),
        id: full2,
        href: apiHref("eps", full2),
        otakudesuUrl: v,
      });
    });

    const data = {
      title,
      animeId,
      releaseTime: rel,
      defaultStreamingUrl,
      streamLink: defaultStreamingUrl,
      hasPrevEpisode: !!prevEpisode,
      prevEpisode,
      hasNextEpisode: !!nextEpisode,
      nextEpisode,
      server: { qualities },
      downloadUrl: { qualities: dlQualities },
      info: {
        credit: infoPs.credit || null,
        encoder: infoPs.encoder || null,
        duration: infoPs.duration || null,
        type: infoPs.type || null,
        genreList: infoGenres,
        episodeList: infoEps,
      },
      id: full,
      episodeId: full,
      href: apiHref("eps", full),
      otakudesuUrl: `${baseUrl}${full}`,
    };
    return R.ok(res, data, null);
  } catch (e) {
    if (e && e.response && e.response.status === 404) return R.notFound(res, "episode tidak ditemukan");
    return R.fail(res, 502, (e && e.message) || "upstream tidak tersedia");
  }
};

exports.serverStream = async (req, res) => {
  const sid = String(req.params.serverId || "").trim();
  if (!sid) return R.notFound(res, "serverId wajib diisi");
  let token = sid;
  try {
    const dec = Buffer.from(token, "base64").toString("utf8");
    JSON.parse(dec);
  } catch (e) {
    return R.notFound(res, "server tidak ditemukan");
  }
  try {
    const url = await episodeHelper.resolveMirror(token);
    if (!url) return R.notFound(res, "server tidak ditemukan");
    return R.ok(res, { url }, null);
  } catch (e) {
    return R.fail(res, 502, (e && e.message) || "mirror tidak tersedia");
  }
};

exports.batchAnime = async (req, res) => {
  const id = n.cleanId(req.params.id);
  if (!id) return R.notFound(res, "id batch wajib diisi");
  try {
    const { html } = await fetchHtml(`batch/${id}`);
    const $ = cheerio.load(html);
    const titles = $(".batchlink > h4");
    const lists = $(".batchlink > ul");
    if (!titles.length) return R.notFound(res, "batch tidak ditemukan");
    const formats = [];
    titles.each((i, el) => {
      const ul = lists.eq(i);
      const qs = [];
      ul.find("li").each((j, li) => {
        const urls = [];
        $(li).find("a").each((k, a) => {
          if ($(a).attr("href")) urls.push({ title: n.cleanText($(a).text()), url: $(a).attr("href") });
        });
        if (!urls.length) return;
        qs.push({
          title: n.cleanText($(li).find("strong").text()),
          size: n.cleanText($(li).find("i").text()),
          urls,
        });
      });
      formats.push({ title: n.cleanText($(el).text()), qualities: qs });
    });
    const foto = $(".fotoanime");
    const info = infoMap($, foto.find(".infozin"));
    const aLink = $("a[href*='/anime/']").first().attr("href") || null;
    const genreList = [];
    $("a[href*='/genres/']").each((i, el) => {
      const link = $(el).attr("href") || "";
      genreList.push(genreItem(link, $(el).text()));
    });
    const data = {
      title: anilist.cleanTitle(formats[0] ? formats[0].title : "") || n.cleanText($("title").text()),
      animeId: aLink ? noPrefix(n.idFromLink(aLink, "")) : null,
      poster: foto.find("img").attr("src") || null,
      japanese: info["japanese"] || null,
      type: info["tipe"] || null,
      score: info["skor"] || null,
      episodes: n.parseEpisodes(info["total episode"]),
      duration: info["durasi"] || null,
      studios: info["studio"] || null,
      producers: info["produser"] || info["producer"] || null,
      aired: info["tanggal rilis"] || null,
      credit: info["credit"] || null,
      genreList,
      downloadUrl: { formats },
      id,
      batchId: id,
      href: apiHref("batch", id),
      otakudesuUrl: `${baseUrl}batch/${id}`,
    };
    return R.ok(res, data, null);
  } catch (e) {
    if (e && e.response && e.response.status === 404) return R.notFound(res, "batch tidak ditemukan");
    return R.fail(res, 502, (e && e.message) || "upstream tidak tersedia");
  }
};

exports.epsMirror = async (req, res) => {
  const rawPath = req.params[0] || "";
  const animeId = n.cleanId(String(rawPath).replace(/\/?mirror\/?$/i, ""));
  const mirrorId = (req.body && (req.body.mirrorId || req.body.dataContent || req.body.data_content || req.body.id)) || req.query.mirrorId;
  if (!animeId) return R.notFound(res, "id episode wajib diisi");
  if (!mirrorId) return R.fail(res, 400, "mirrorId wajib diisi di body");
  try {
    const full = /^episode\//.test(animeId) ? animeId : `episode/${animeId}`;
    const isToken = /^[A-Za-z0-9+/=]+$/.test(String(mirrorId)) && String(mirrorId).length > 16;
    let streamLink = null;
    if (isToken) {
      streamLink = await episodeHelper.resolveMirror(String(mirrorId));
    } else {
      const { html } = await fetchHtml(`${full}/${n.cleanId(mirrorId)}`);
      const $ = cheerio.load(html);
      streamLink = $("#pembed iframe").attr("src") || $("#embed_holder iframe").attr("src") || null;
    }
    if (!streamLink) return R.fail(res, 502, "mirror tidak menghasilkan link streaming");
    const link_stream = await episodeHelper.get(streamLink).catch(() => streamLink);
    return R.ok(res, { id: animeId, episodeId: animeId, streamLink, link_stream, url: streamLink }, null);
  } catch (e) {
    return R.fail(res, 502, (e && e.message) || "mirror tidak tersedia");
  }
};

const ODCLOUD_RE = /https?:\/\/cdn\.odcloud\.net\/[^\s"'\\<>]+/g;
const ARCHIVE_RE = /https?:\/\/archive\.org\/download\/[^\s"'\\<>]+/g;
const BLOGGER_RE = /https?:\/\/(?:www\.)?blogger\.com\/video\.g\?token=[^\s"'\\<>]+/g;
const IFRAME_SRC_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;
const FILE_RE = /["']?file["']?\s*[:=]\s*["']([^"']+\.mp4[^"']*)["']/gi;
const VIDEOURL_RE = /(?:videoURL|source\s*=\s*|src\s*=\s*|file\s*=\s*)["']?(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)["']?/gi;

const playerHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: baseUrl,
};

async function fetchPlayerDirect(iframeUrl) {
  const r = await Axios.get(iframeUrl, { headers: playerHeaders, timeout: 15000 });
  const s = typeof r.data === "string" ? r.data : "";
  const flat = s.replace(/\\\//g, "/");
  const odcloud = [...new Set(flat.match(ODCLOUD_RE) || [])];
  const archive = [...new Set(flat.match(ARCHIVE_RE) || [])];
  const blogger = [...new Set(flat.match(BLOGGER_RE) || [])];
  const iframes = [];
  let m;
  IFRAME_SRC_RE.lastIndex = 0;
  while ((m = IFRAME_SRC_RE.exec(flat)) !== null) iframes.push(m[1]);
  const files = [];
  FILE_RE.lastIndex = 0;
  while ((m = FILE_RE.exec(flat)) !== null) files.push(m[1]);
  VIDEOURL_RE.lastIndex = 0;
  while ((m = VIDEOURL_RE.exec(flat)) !== null) files.push(m[1]);
  if (/updesu/i.test(iframeUrl)) {
    try {
      const sep = iframeUrl.includes("?") ? "&" : "?";
      const j = await Axios.get(`${iframeUrl}${sep}mode=json&_=${Date.now()}`, {
        headers: { ...playerHeaders, Referer: iframeUrl },
        timeout: 15000,
      });
      const v = j && j.data && (j.data.video || j.data.url || j.data.file);
      if (v && typeof v === "string") {
        if (/blogger\.com\/video\.g/i.test(v)) blogger.push(v);
        else if (/\.mp4/i.test(v)) files.push(v);
        else iframes.push(v);
      }
    } catch (e) { /* abaikan, pakai html saja */ }
  }
  return { odcloud, archive, blogger: [...new Set(blogger)], iframes: [...new Set(iframes)], files: [...new Set(files)], len: s.length };
}

async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, arr.length) }, async () => {
    while (idx < arr.length) {
      const i = idx++;
      try { out[i] = await fn(arr[i], i); } catch (e) { out[i] = { error: (e && e.message) || "gagal" }; }
    }
  });
  await Promise.all(workers);
  return out;
}

exports.getAutoServerData = async function getAutoServerData(full) {
  let html;
  let cached = false;
  try {
    const res = await fetchHtml(full);
    html = res.html;
  } catch (e) {
    const cachedHtml = pageCache.get("html:" + full);
    if (cachedHtml) {
      html = cachedHtml;
      cached = true;
    } else {
      throw e;
    }
  }
  const $ = cheerio.load(html);
  const title = n.cleanText($(".venutama > h1").first().text() || $(".posttl").first().text());
  if (!title) { const e = new Error("episode tidak ditemukan"); e.statusCode = 404; throw e; }
  const defaultIframe = $("#embed_holder iframe").attr("src") || $("#pembed iframe").attr("src") || null;
  const tokens = [];
  for (const q of ["720p", "480p", "360p"]) {
    $(`.mirrorstream ul.m${q} > li`).each((i, el) => {
      const a = $(el).find("a").first();
      const token = a.attr("data-content") || null;
      if (!token) return;
      tokens.push({ quality: q, server: n.cleanText(a.text()), token });
    });
  }
  if (!defaultIframe && !tokens.length) { const e = new Error("server tidak ditemukan"); e.statusCode = 404; throw e; }
  const resolved = await mapLimit(tokens, 5, async (t) => {
    try {
      const iframe = await episodeHelper.resolveMirror(t.token);
      return { ...t, iframe: iframe || null };
    } catch (e) {
      return { ...t, iframe: null, error: e.message };
    }
  });
  const candidates = [];
  if (defaultIframe) candidates.push({ quality: "default", server: "default", token: null, iframe: defaultIframe });
  for (const r of resolved) if (r.iframe) candidates.push(r);
  candidates.sort((a, b) => {
    const score = (c) => (/odcdn/i.test(c.iframe || "") ? 0 : /arcg/i.test(c.iframe || "") ? 1 : /updesu|desustream/i.test(c.iframe || "") ? 2 : 3);
    return score(a) - score(b);
  });
  const checked = await mapLimit(candidates.slice(0, 12), 4, async (c) => {
    if (!c.iframe || !/desustream\.net/i.test(c.iframe)) return { ...c, odcloud: [], archive: [], blogger: [], fallback: [], skipped: true };
    try {
      const p = await fetchPlayerDirect(c.iframe);
      const blogger = p.blogger || [];
      const others = [...new Set([...(p.files || []), ...(p.iframes || []).filter((u) => /blogger\.com|googlevideo|lh3\.googleusercontent|\.mp4/i.test(u))])];
      return { ...c, odcloud: p.odcloud, archive: p.archive, blogger, fallback: [...new Set([...blogger, ...others])], files: p.files };
    } catch (e) {
      return { ...c, odcloud: [], archive: [], blogger: [], fallback: [], error: e.message };
    }
  });
  const odcloud = [];
  const archive = [];
  const fallback = [];
  const sources = [];
  for (const c of checked) {
    for (const u of c.odcloud || []) {
      if (!odcloud.includes(u)) odcloud.push(u);
      sources.push({ type: "odcloud", quality: c.quality, server: c.server, iframe: c.iframe, url: u });
    }
    for (const u of c.archive || []) {
      if (!archive.includes(u)) archive.push(u);
      sources.push({ type: "archive", quality: c.quality, server: c.server, iframe: c.iframe, url: u });
    }
    for (const u of c.fallback || []) {
      if (!fallback.includes(u)) fallback.push(u);
      sources.push({ type: /blogger\.com/i.test(u) ? "blogger" : "fallback", quality: c.quality, server: c.server, iframe: c.iframe, url: u });
    }
  }
  return {
    title,
    episodeId: full,
    id: full,
    href: `/api/auto-server/${full.replace(/^episode\//, "")}`,
    playerUrl: `/player/${full.replace(/^episode\//, "")}`,
    otakudesuUrl: `${baseUrl}${full}`,
    cached,
    defaultStreamingUrl: defaultIframe,
    odcloud,
    archive,
    fallback,
    sources,
    checked: checked.length,
    totalMirror: tokens.length,
    cached: false,
  };
}

exports.autoServer = async (req, res) => {
  const raw = n.cleanId((req.params && req.params[0]) || req.params.slug || "");
  if (!raw) return R.notFound(res, "slug episode wajib diisi");
  const full = /^episode\//.test(raw) ? raw : `episode/${raw}`;
  const cacheKey = "auto-server:" + full;
  const hit = pageCache.get(cacheKey);
  if (hit) return R.ok(res, { ...hit, cached: true }, null);
  try {
    const data = await module.exports.getAutoServerData(full);
    if (!data.odcloud.length && !data.archive.length && !data.fallback.length) return R.notFound(res, "odcloud/archive tidak ditemukan di episode ini");
    pageCache.set(cacheKey, data);
    return R.ok(res, data, null);
  } catch (e) {
    if ((e && e.response && e.response.status === 404) || (e && e.statusCode === 404)) return R.notFound(res, (e && e.message) || "episode tidak ditemukan");
    return R.fail(res, 502, (e && e.message) || "upstream tidak tersedia");
  }
};

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

exports.playerPage = async (req, res) => {
  const raw = (req.params && req.params[0]) || "";
  const full = /^episode\//.test(raw) ? raw : `episode/${raw}`;
  try {
    const data = await module.exports.getAutoServerData(full);
    const html = module.exports.buildPlayerHtml(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (e) {
    return res.status(502).send("Gagal memuat player: " + (e.message || e));
  }
};

exports.buildPlayerHtml = function buildPlayerHtml(d) {
  const direct = [...(d.odcloud || []), ...(d.archive || []), ...(d.fallback || []).filter((u) => /\.(mp4|m3u8)/i.test(u))];
  const blogger = (d.sources || []).filter((s) => s.type === "blogger").map((s) => s.url);
  const tokOf = (u) => { try { return new URL(u).searchParams.get("token") || ""; } catch (e) { return ""; } };
  const bloggerProxy = blogger.map((u) => ({ raw: u, proxy: "/api/bv/frame?token=" + encodeURIComponent(tokOf(u)) }));
  const firstDirect = direct[0] || null;
  const firstBloggerProxy = bloggerProxy[0] ? bloggerProxy[0].proxy : null;
  const srcList = (d.sources || []).map((s) => s.type === "blogger" ? { ...s, proxy: "/api/bv/frame?token=" + encodeURIComponent(tokOf(s.url)) } : s);
  const opts = srcList.map((s, i) => "<option value=\"" + i + "\">" + esc(s.type) + " " + esc(s.quality) + " - " + esc(s.server) + "</option>").join("");
  const srcJson = JSON.stringify(srcList);
  const initSrc = firstDirect ? "src=\"" + esc(firstDirect) + "\"" : "";
  const initFrame = firstBloggerProxy && !firstDirect ? " src=\"" + esc(firstBloggerProxy) + "\"" : "";
  return "<!doctype html><html lang=\"id\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + esc(d.title) + " - Player</title><script src=\"https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js\"></script><style>body{margin:0;background:#000;color:#eee;font-family:system-ui,sans-serif}.wrap{max-width:960px;margin:0 auto;padding:12px}.bar{display:flex;gap:8px;align-items:center;margin:10px 0;flex-wrap:wrap}select,button{background:#1c1c1c;color:#fff;border:1px solid #444;border-radius:8px;padding:8px 12px}button{cursor:pointer}.stage{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden}video,iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}.note{font-size:13px;color:#bbb}.stolen{font-size:13px;color:#8f8}</style></head><body><div class=\"wrap\"><h3 style=\"margin:8px 0\">" + esc(d.title) + "</h3><div class=\"bar\"><select id=\"src\">" + opts + "</select><button id=\"btnDirect\">Direct MP4</button><button id=\"btnBlog\">Blogger via proxy</button></div><div class=\"stage\"><video id=\"v\" controls playsinline preload=\"metadata\" " + initSrc + "></video><iframe id=\"f\" allow=\"autoplay; fullscreen; picture-in-picture\" allowfullscreen style=\"display:none\"" + initFrame + "></iframe></div><p class=\"note\">Prioritas: odcloud > archive > mp4/m3u8 lain > blogger via proxy same-origin. Hook di iframe proxy mencuri stream URL lalu dipindah ke video custom bila dapat googlevideo/mp4/m3u8.</p><p class=\"stolen\" id=\"stolen\"></p></div><scr" + "ipt>const S=" + srcJson + ";const v=document.getElementById('v'),f=document.getElementById('f'),sel=document.getElementById('src'),st=document.getElementById('stolen');let hls=null;function destroyHls(){if(hls){hls.destroy();hls=null;}}function loadSource(u,type,proxy){if(!u) return; destroyHls();if(type==='blogger'){f.src=proxy||u;f.style.display='block';v.style.display='none';v.pause();}else{f.style.display='none';f.src='about:blank';v.style.display='block';if(Hls.isSupported() && /\\.m3u8/i.test(u)){try{hls=new Hls({enableWorker:true,lowLatencyMode:true});hls.loadSource(u);hls.attachMedia(v);hls.on(Hls.Events.MANIFEST_PARSED,()=>v.play().catch(()=>{}));}catch(e){console.error('HLS init error',e);v.src=u;v.play().catch(()=>{});}}else{v.src=u;v.play().catch(()=>{});}}}function cur(){return S[+sel.value];}sel.onchange=()=>{const s=cur();if(s)loadSource(s.url,s.type,s.proxy);};document.getElementById('btnDirect').onclick=()=>{const s=S.find(x=>x.type!=='blogger');if(s){sel.value=S.indexOf(s);loadSource(s.url,s.type);}};document.getElementById('btnBlog').onclick=()=>{const s=S.find(x=>x.type==='blogger');if(s){sel.value=S.indexOf(s);loadSource(s.url,s.type,s.proxy);}};window.addEventListener('message',e=>{const u=e&&e.data&&e.data.__bv;if(!u) return; st.textContent='stream tercuri: '+u.slice(0,120);if(/\\.mp4|googlevideo|\\.m3u8/i.test(u)){loadSource(u,'fallback');}});const c0=cur();if(c0)loadSource(c0.url,c0.type,c0.proxy);</scr" + "ipt></body></html>";
}
