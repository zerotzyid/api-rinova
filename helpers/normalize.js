const { baseUrl } = require("./base-url");

const cleanId = (v) =>
  String(v || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

const joinUrl = (path) =>
  baseUrl + String(path || "").replace(/^\/+/, "");

const idFromLink = (link, prefix = "") => {
  let s = String(link || "").trim();
  if (s.startsWith(baseUrl)) s = s.slice(baseUrl.length);
  if (prefix && s.startsWith(prefix)) s = s.slice(prefix.length);
  s = s.replace(/^\/+/, "");
  return cleanId(s);
};

const parseEpisodes = (v) => {
  if (typeof v === "number") return v;
  const m = String(v || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
};

const parseScore = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const cleanText = (v) => String(v || "").trim().replace(/\s+/g, " ");

const parseEpsNumber = (title) => {
  const m = String(title || "").match(/episode\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
};

module.exports = {
  cleanId,
  joinUrl,
  idFromLink,
  parseEpisodes,
  parseScore,
  cleanText,
  parseEpsNumber,
};
