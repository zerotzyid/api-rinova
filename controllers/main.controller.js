const cheerio = require("cheerio");
const { completeAnime, onGoingAnime, schedule, genreList } = require("../helpers/base-url");
const { BASE_URL } = require("../helpers/config");
const { fetchHtml } = require("../helpers/upstream");
const R = require("../helpers/response");
const n = require("../helpers/normalize");
const ImageList = require("../helpers/image_genre").ImageList;

function cardItem($, el) {
  let title = "", thumb = "", link = "";
  $(el).find(".thumb > a").each(function () {
    title = n.cleanText($(this).find(".thumbz > h2").text());
    thumb = $(this).find(".thumbz > img").attr("src") || null;
    link = $(this).attr("href") || "";
  });
  const id = n.idFromLink(link, "anime/");
  return {
    title,
    poster: thumb,
    thumb,
    episodes: null,
    releaseDay: null,
    animeId: id,
    id,
    href: id ? `/api/anime/${id}` : null,
    otakudesuUrl: link || null,
    link: link ? n.joinUrl(link.replace(BASE_URL, "").replace("https://otakudesu.blog/", "")) : null,
  };
}

const pageOf = (p) => (p ? parseInt(p, 10) || 1 : 1);

exports.home = async (req, res) => {
  try {
    const { html } = await fetchHtml("");
    const $ = cheerio.load(html);
    const element = $(".venz");
    const ongoing = [];
    const complete = [];
    element.children().eq(0).find("ul > li").each(function () {
      const base = cardItem($, this);
      ongoing.push({
        ...base,
        episode: n.cleanText($(this).find(".epz").text()),
        episodes: n.parseEpisodes($(this).find(".epz").text()),
        uploaded_on: n.cleanText($(this).find(".newnime").text()),
        day_updated: n.cleanText($(this).find(".epztipe").text()),
        releaseDay: n.cleanText($(this).find(".epztipe").text()),
      });
    });
    element.children().eq(1).find("ul > li").each(function () {
      const base = cardItem($, this);
      complete.push({
        ...base,
        episode: n.cleanText($(this).find(".epz").text()),
        episodes: n.parseEpisodes($(this).find(".epz").text()),
        uploaded_on: n.cleanText($(this).find(".newnime").text()),
        score: n.parseScore($(this).find(".epztipe").text()),
      });
    });
    R.ok(res, { ongoing: { animeList: ongoing }, complete: { animeList: complete } }, null);
  } catch (e) {
    R.fail(res, 502, e.message);
  }
};

exports.completeAnimeList = async (req, res) => {
  const params = req.params.page;
  const cur = pageOf(params);
  const path = `${completeAnime}${!params || params === "1" ? "" : `page/${params}/`}`;
  try {
    const { html } = await fetchHtml(path);
    const $ = cheerio.load(html);
    const element = $(".venz");
    const animeList = [];
    element.children().eq(0).find("ul > li").each(function () {
      const base = cardItem($, this);
      if (!base.id) return;
      animeList.push({
        ...base,
        episode: n.cleanText($(this).find(".epz").text()),
        episodes: n.parseEpisodes($(this).find(".epz").text()),
        uploaded_on: n.cleanText($(this).find(".newnime").text()),
        score: n.parseScore($(this).find(".epztipe").text()),
      });
    });
    if (!animeList.length) return R.notFound(res, "halaman complete anime tidak ditemukan");
    R.ok(res, { animeList }, { currentPage: cur });
  } catch (e) {
    if (e.response && e.response.status === 404) return R.notFound(res, "halaman complete anime tidak ditemukan");
    R.fail(res, 502, e.message);
  }
};

exports.onGoingAnimeList = async (req, res) => {
  const params = req.params.page;
  const cur = pageOf(params);
  const path = `${onGoingAnime}${!params || params === "1" ? "" : `page/${params}/`}`;
  try {
    const { html } = await fetchHtml(path);
    const $ = cheerio.load(html);
    const element = $(".venz");
    const animeList = [];
    element.children().eq(0).find("ul > li").each(function () {
      const base = cardItem($, this);
      if (!base.id) return;
      animeList.push({
        ...base,
        episode: n.cleanText($(this).find(".epz").text()),
        episodes: n.parseEpisodes($(this).find(".epz").text()),
        uploaded_on: n.cleanText($(this).find(".newnime").text()),
        day_updated: n.cleanText($(this).find(".epztipe").text()),
        releaseDay: n.cleanText($(this).find(".epztipe").text()),
      });
    });
    if (!animeList.length) return R.notFound(res, "halaman ongoing anime tidak ditemukan");
    R.ok(res, { animeList }, { currentPage: cur });
  } catch (e) {
    if (e.response && e.response.status === 404) return R.notFound(res, "halaman ongoing anime tidak ditemukan");
    R.fail(res, 502, e.message);
  }
};

exports.schedule = async (req, res) => {
  try {
    const { html } = await fetchHtml(schedule);
    const $ = cheerio.load(html);
    const element = $(".kgjdwl321");
    const data = [];
    element.find(".kglist321").each(function () {
      const day = n.cleanText($(this).find("h2").text());
      const anime_list = [];
      $(this).find("ul > li").each(function () {
        const title = n.cleanText($(this).find("a").text());
        const link = $(this).find("a").attr("href") || "";
        const id = n.idFromLink(link, "anime/");
        if (!id) return;
        anime_list.push({
          title,
          anime_name: title,
          slug: id,
          url: link,
          otakudesuUrl: link,
          poster: null,
          animeId: id,
          id,
          link: n.joinUrl(link.replace(BASE_URL, "").replace("https://otakudesu.blog/", "")),
          href: `/api/anime/${id}`,
        });
      });
      data.push({ day, anime_list });
    });
    R.ok(res, data, null);
  } catch (e) {
    R.fail(res, 502, e.message);
  }
};

exports.genre = async (req, res) => {
  try {
    const { html } = await fetchHtml(genreList);
    const $ = cheerio.load(html);
    const element = $(".genres");
    const genreListArr = [];
    element.find("li > a").each(function (i, el) {
      const href = $(el).attr("href") || "";
      const id = n.cleanId(href.replace("/genres/", "").replace("genres/", ""));
      const title = n.cleanText($(el).text());
      genreListArr.push({
        title,
        genre_name: title,
        genreId: id,
        id,
        href: `/api/genres/${id}/page/1`,
        link: n.joinUrl(href),
        otakudesuUrl: n.joinUrl(href),
        image_link: ImageList[i] || null,
      });
    });
    R.ok(res, { genreList: genreListArr }, null);
  } catch (e) {
    R.fail(res, 502, e.message);
  }
};

exports.animeByGenre = async (req, res) => {
  const pageNumber = req.params.pageNumber;
  const id = n.cleanId(req.params.id);
  const cur = pageOf(pageNumber);
  try {
    const { html } = await fetchHtml(`genres/${id}/page/${pageNumber}/`);
    const $ = cheerio.load(html);
    const element = $(".page");
    const animeList = [];
    element.find(".col-md-4").each(function () {
      const link = $(this).find(".col-anime-title > a").attr("href") || "";
      const aid = n.idFromLink(link, "anime/");
      if (!aid) return;
      const genre_list = [];
      $(this).find(".col-anime-genre > a").each(function () {
        const glink = $(this).attr("href") || "";
        const gid = n.idFromLink(glink, "genres/");
        const gt = n.cleanText($(this).text());
        genre_list.push({
          genre_name: gt,
          title: gt,
          genre_id: gid,
          genreId: gid,
          genre_link: n.joinUrl(glink.replace(BASE_URL, "").replace("https://otakudesu.blog/", "")),
          otakudesuUrl: glink,
        });
      });
      const title = n.cleanText($(this).find(".col-anime-title").text());
      const poster = $(this).find("div.col-anime-cover > img").attr("src") || null;
      animeList.push({
        title,
        anime_name: title,
        poster,
        thumb: poster,
        link,
        otakudesuUrl: link,
        href: `/api/anime/${aid}`,
        id: aid,
        animeId: aid,
        slug: aid,
        studio: n.cleanText($(this).find(".col-anime-studio").text()),
        episode: n.cleanText($(this).find(".col-anime-eps").text()),
        episodes: n.parseEpisodes($(this).find(".col-anime-eps").text()),
        score: n.parseScore($(this).find(".col-anime-rating").text()),
        release_date: n.cleanText($(this).find(".col-anime-date").text()),
        genre_list: genre_list,
        genreList: genre_list,
      });
    });
    if (!animeList.length) return R.notFound(res, "genre atau halaman tidak ditemukan");
    const synopsis = { paragraphs: [] };
    R.ok(res, { animeList, synopsis }, { currentPage: cur });
  } catch (e) {
    if (e.response && e.response.status === 404) return R.notFound(res, "genre atau halaman tidak ditemukan");
    R.fail(res, 502, e.message);
  }
};

exports.search = async (req, res) => {
  const query = req.params.query;
  try {
    const { html } = await fetchHtml(`${BASE_URL}?s=${encodeURIComponent(query)}&post_type=anime`);
    const $ = cheerio.load(html);
    const element = $(".page");
    const animeList = [];
    if (element.find("ul > li").length !== 0) {
      element.find("ul > li").each(function () {
        const genre_list = [];
        $(this).find(".set").find("a").each(function () {
          const glink = $(this).attr("href") || "";
          const gid = n.idFromLink(glink, "genres/");
          const gt = n.cleanText($(this).text());
          genre_list.push({
            genre_title: gt,
            title: gt,
            genre_link: n.joinUrl(glink.replace(BASE_URL, "").replace("https://otakudesu.blog/", "")),
            otakudesuUrl: glink,
            genre_id: gid,
            genreId: gid,
          });
        });
        const link = $(this).find("h2 > a").attr("href") || "";
        const aid = n.idFromLink(link, "anime/");
        if (!aid) return;
        const title = n.cleanText($(this).find("h2").text());
        const poster = $(this).find("img").attr("src") || null;
        animeList.push({
          title,
          poster,
          thumb: poster,
          link,
          otakudesuUrl: link,
          href: `/api/anime/${aid}`,
          id: aid,
          animeId: aid,
          slug: aid,
          status: n.cleanText($(this).find(".set").eq(1).text().replace("Status : ", "")),
          score: n.parseScore($(this).find(".set").eq(2).text().replace("Rating : ", "")),
          genre_list,
        });
      });
    }
    R.ok(res, { animeList }, null);
  } catch (e) {
    R.fail(res, 502, e.message);
  }
};
