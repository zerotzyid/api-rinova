const BASE_URL = "https://proxy.goibsmp.eu.org/".replace(/\/?$/, "/");
const MIRRORS = (process.env.OTAKUDESU_MIRRORS || "")
  .split(",")
  .map((s) => s.trim().replace(/\/?$/, "/"))
  .filter(Boolean);

const CREATOR = process.env.API_CREATOR || "Z-Scraper";
const UA_LIST = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
];
const TIMEOUT = parseInt(process.env.UPSTREAM_TIMEOUT_MS || "20000", 10);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || "300000", 10);
const ANILIST_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN || "30", 10);

module.exports = { BASE_URL, MIRRORS, CREATOR, UA_LIST, TIMEOUT, CACHE_TTL_MS, ANILIST_TTL_MS, RATE_LIMIT_PER_MIN };
