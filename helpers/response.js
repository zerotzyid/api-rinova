const CREATOR = process.env.API_CREATOR || "Z-Scraper";

const ok = (res, data, pagination = null, message = "") => {
  if (res.headersSent) return;
  res.status(200).json({
    status: "success",
    creator: CREATOR,
    statusCode: 200,
    statusMessage: "OK",
    message,
    ok: true,
    data,
    pagination: pagination || null,
  });
};

const fail = (res, code, message, data = null) => {
  if (res.headersSent) return;
  const msg = message || "request failed";
  res.status(code).json({
    status: code === 404 ? "not found" : "error",
    creator: CREATOR,
    statusCode: code,
    statusMessage: code === 404 ? "Not Found" : code === 429 ? "Too Many Requests" : "Error",
    message: msg,
    ok: false,
    data,
    pagination: null,
  });
};

const notFound = (res, message = "data tidak ditemukan") => fail(res, 404, message);

module.exports = { ok, fail, notFound, CREATOR };
