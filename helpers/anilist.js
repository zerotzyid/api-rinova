const Axios = require("axios");

const ENDPOINT = "https://graphql.anilist.co";
const TTL = 24 * 60 * 60 * 1000;
const cache = new Map();

const GENRE_ID = {
  Action: "Aksi", Adventure: "Petualangan", Comedy: "Komedi",
  Drama: "Drama", Fantasy: "Fantasi", Horror: "Horor",
  Mystery: "Misteri", Psychological: "Psikologis", Romance: "Romansa",
  "Sci-Fi": "Fiksi Ilmiah", "Slice of Life": "Potongan Kehidupan",
  Sports: "Olahraga", Supernatural: "Supranatural", Thriller: "Cerita Menegangkan",
  Mecha: "Mecha", Music: "Musik", School: "Sekolah", Shounen: "Shounen",
  Shoujo: "Shoujo", Seinen: "Seinen", Josei: "Josei",
  "Martial Arts": "Bela Diri", Military: "Militer", Historical: "Sejarah",
  Dementia: "Surealis", Demons: "Iblis", Game: "Permainan",
  Harem: "Harem", Ecchi: "Ecchi", Parody: "Parodi",
  Police: "Polisi", Space: "Luar Angkasa", Vampire: "Vampir",
  "Urban Fantasy": "Fantasi Urban",
};

const STATUS_ID = {
  FINISHED: "Tamat", RELEASING: "Sedang Tayang",
  NOT_YET_RELEASED: "Belum Tayang", CANCELLED: "Dibatalkan", HIATUS: "Hiatus",
};

const SEASON_ID = {
  WINTER: "Dingin", SPRING: "Semi", SUMMER: "Panas", FALL: "Gugur",
};

const FORMAT_ID = {
  TV: "TV", MOVIE: "Film", OVA: "OVA", ONA: "ONA",
  SPECIAL: "Spesial", MANGA: "Manga", MUSIC: "Musik",
};

const cleanTitle = (title) =>
  String(title || "")
    .replace(/subtitle\s+indonesia/gi, "")
    .replace(/\bsub\s+indo\b/gi, "")
    .replace(/\s*-\s*subtitle.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const stripHtml = (html) =>
  String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const QUERY = `
query ($search: String) {
  Page (perPage: 5) {
    media (search: $search, type: ANIME) {
      id idMal
      title { romaji english native }
      synonyms
      description(asHtml: false)
      coverImage { large medium color }
      bannerImage
      genres averageScore meanScore popularity favourites
      season seasonYear format status episodes duration source
      studios { nodes { name } }
      trailer { id site thumbnail }
      siteUrl isAdult
    }
  }
}`;

const norm = (s) =>
  String(s || "").toLowerCase().replace(/[^a-z0-9\u0080-\uffff ]/gi, " ").replace(/\s+/g, " ").trim();

function pickBest(candidates, search, hint = {}) {
  const sNorm = norm(search);
  const sTok = new Set(sNorm.split(" ").filter((t) => t.length > 1));
  let best = null;
  let bestScore = -Infinity;
  for (const m of candidates) {
    const titles = [m.title.romaji, m.title.english, m.title.native, ...(m.synonyms || [])]
      .filter(Boolean).map(norm).filter(Boolean);
    let score = 0;
    if (titles.includes(sNorm)) {
      score += 100;
    } else {
      let inc = false;
      for (const t of titles) {
        if (t.length > 4 && (t.includes(sNorm) || (sNorm.length > 4 && sNorm.includes(t)))) { inc = true; break; }
      }
      if (inc) {
        score += 50;
      } else {
        let ov = 0;
        for (const t of titles) {
          const tt = new Set(t.split(" ").filter((x) => x.length > 1));
          let common = 0;
          for (const w of sTok) if (tt.has(w)) common++;
          ov = Math.max(ov, sTok.size ? common / sTok.size : 0);
        }
        score += ov * 30;
      }
    }
    if (hint.episodes && m.episodes) {
      const d = Math.abs(hint.episodes - m.episodes);
      if (d === 0) score += 20;
      else if (d <= 2) score += 10;
      else if (d >= 100) score -= 30;
      if (hint.episodes > 50 && m.format === "MOVIE") score -= 20;
      if (hint.episodes > 50 && m.format === "TV") score += 10;
    }
    if (m.popularity) score += Math.min(m.popularity / 100000, 3);
    if (m.isAdult) score -= 5;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return bestScore > 5 ? best : null;
}

async function enrich(title, hint = {}) {
  const search = cleanTitle(title);
  if (!search) return null;
  const key = search.toLowerCase() + "|" + (hint.episodes || "");
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  try {
    const res = await Axios.post(
      ENDPOINT,
      { query: QUERY, variables: { search } },
      {
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        timeout: 15000,
      }
    );
    const list = res.data && res.data.data && res.data.data.Page && res.data.data.Page.media;
    if (!list || !list.length) return null;
    const m = pickBest(list, search, hint) || list[0];
    if (!m) return null;
    const data = {
      id: m.id,
      idMal: m.idMal || null,
      judul: { romaji: m.title.romaji, inggris: m.title.english, asli: m.title.native },
      sinonim: m.sinonim || m.synonyms || [],
      sinopsis_anilist: stripHtml(m.description) || null,
      sampul: m.coverImage.large || m.coverImage.medium || null,
      sampul_warna: m.coverImage.color || null,
      banner: m.bannerImage || null,
      genre: m.genres || [],
      genre_id: (m.genres || []).map((g) => GENRE_ID[g] || g),
      skor_rata: m.averageScore ? m.averageScore / 10 : null,
      skor_mean: m.meanScore ? m.meanScore / 10 : null,
      popularitas: m.popularitas || m.popularity || null,
      favorit: m.favourites ?? null,
      musim: m.season ? SEASON_ID[m.season] || m.season : null,
      tahun_musim: m.seasonYear || null,
      format: m.format ? FORMAT_ID[m.format] || m.format : null,
      status: m.status ? STATUS_ID[m.status] || m.status : null,
      total_episode: m.episodes || null,
      durasi_menit: m.duration || null,
      sumber: m.source || null,
      studio: (m.studios && m.studios.nodes || []).map((s) => s.name),
      trailer: m.trailer && m.trailer.id
        ? { id: m.trailer.id, situs: m.trailer.site, pratinjau: m.trailer.thumbnail }
        : null,
      url_anilist: m.siteUrl || null,
      dewasa: !!m.isAdult,
    };
    cache.set(key, { at: Date.now(), data });
    return data;
  } catch (e) {
    return null;
  }
}

module.exports = { enrich, cleanTitle };
