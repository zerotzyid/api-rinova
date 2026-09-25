const { BASE_URL } = require("./config");

// proxy base for *all* outbound HTTP (GET/POST/JSON/stream)
const PROXY_BASE = BASE_URL;                 // https://otakuproxy.zerowebsite.eu.org/
// original domain – only used for display (otakudesuUrl fields)
const ORIGIN_BASE = "https://otakudesu.blog/";

module.exports = {
    baseUrl: PROXY_BASE,                     // ← used by axios, ajax, referer, origin
    originBase: ORIGIN_BASE,                 // ← only for building public URLs
    completeAnime: 'complete-anime/',
    onGoingAnime:  'ongoing-anime/',
    schedule:      'jadwal-rilis/',
    genreList:     'genre-list/'
};
