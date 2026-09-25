const Axios = require("axios");
const { BASE_URL } = require("./config");

let cachedCookies = "";
let cachedAt = 0;
const COOKIE_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function fetchFreshCookies() {
  try {
    const res = await Axios.get(BASE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 10000,
      validateStatus: (s) => s >= 200 && s < 400,
      maxRedirects: 5,
    });

    const setCookie = res.headers["set-cookie"];
    if (setCookie && setCookie.length) {
      // join all cookies, take name=value part only
      const cookies = setCookie
        .map((c) => c.split(";")[0])
        .filter((c) => c.includes("="))
        .join("; ");
      cachedCookies = cookies;
      cachedAt = Date.now();
      console.log("[cookie-jar] refreshed cookies");
    }
  } catch (e) {
    console.warn("[cookie-jar] failed to fetch fresh cookies:", e.message);
  }
}

function isExpired() {
  return !cachedCookies || Date.now() - cachedAt > COOKIE_TTL_MS;
}

async function getCookieString() {
  if (isExpired()) {
    await fetchFreshCookies();
  }
  return cachedCookies;
}

module.exports = { getCookieString };