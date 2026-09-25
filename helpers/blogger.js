const Axios = require("axios");

const BLOGGER_ORIGIN = "https://www.blogger.com";
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function tokenFromUrl(u) {
  try {
    return new URL(u).searchParams.get("token");
  } catch (e) {
    return null;
  }
}

function hookScript() {
  return `<script>(function(){var seen={};function send(u){if(!u||typeof u!=='string')return;if(!/^https?:\\/\\//i.test(u))return;if(seen[u])return;seen[u]=1;try{parent.postMessage({__bv:u},'*')}catch(e){}}try{var d=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');if(d&&d.set){Object.defineProperty(HTMLMediaElement.prototype,'src',{configurable:true,enumerable:true,get:function(){return d.get.call(this)},set:function(v){send(v);return d.set.call(this,v)}})}}catch(e){}try{var os=Element.prototype.setAttribute;Element.prototype.setAttribute=function(k,v){try{var t=this.tagName;if((t==='VIDEO'||t==='SOURCE')&&String(k).toLowerCase()==='src')send(v)}catch(e){}return os.call(this,k,v)}}catch(e){}function scan(){try{var els=document.querySelectorAll('video,source');for(var i=0;i<els.length;i++){var el=els[i];var u=el.currentSrc||el.src||el.getAttribute('src');if(u)send(u)}}catch(e){}}try{new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']})}catch(e){}try{var of=window.fetch;window.fetch=function(){var p=of.apply(this,arguments);try{p.then(function(r){try{r.clone().text().then(function(t){var m=String(t).match(/https?:\\/\\/[^\\\\"'\\s<>]+googlevideo[^\\\\"'\\s<>]*|https?:\\/\\/[^\\\\"'\\s<>]+\\.mp4[^\\\\"'\\s<>]*/gi);(m||[]).forEach(send)}).catch(function(){})}catch(e){}}).catch(function(){})}catch(e){}return p}}catch(e){}scan();setInterval(scan,2000)})();</script>`;
}

function rewriteHtml(html, proxyBase) {
  let out = String(html || "");
  out = out.replace(/<base\s+href="https:\/\/www\.blogger\.com\/"\s*\/?>/i, `<base href="${proxyBase}/">`);
  out = out.replace(/<base\s+href=['"]https:\/\/www\.blogger\.com\/['"]\s*\/?>/i, `<base href="${proxyBase}/">`);
  out = out.replace(/(src|href|data-src|data-href)="([^"]*)"/gi, (match, attr, url) => {
    if (url.startsWith('/') && !url.startsWith(proxyBase + '/') && !url.startsWith('//' + proxyBase + '/')) {
      return `${attr}="${proxyBase}/${url.slice(1)}"`;
    }
    if (url.startsWith('//www.blogger.com/')) {
      return `${attr}="${proxyBase}/${url.slice('//www.blogger.com/'.length)}"`;
    }
    return match;
  });
  out = out.replace(/<head(\s[^>]*)?>/i, `<head$1>${hookScript()}`);
  return out;
}

async function fetchPlayer(token) {
  const r = await Axios.get(`${BLOGGER_ORIGIN}/video.g`, {
    params: { token },
    headers: {
      "User-Agent": DESKTOP_UA,
      Referer: "https://desustream.net/",
      "Accept-Language": "en-US,en;q=0.9",
    },
    timeout: 20000,
    responseType: "text",
  });
  return typeof r.data === "string" ? r.data : "";
}

async function forwardGet(path, query, range) {
  const r = await Axios.get(BLOGGER_ORIGIN + path, {
    params: query,
    headers: {
      "User-Agent": DESKTOP_UA,
      Referer: `${BLOGGER_ORIGIN}/video.g`,
      "Accept-Language": "en-US,en;q=0.9",
      ...(range ? { Range: range } : {}),
    },
    timeout: 25000,
    responseType: "arraybuffer",
    validateStatus: () => true,
  });
  return r;
}

async function forwardPost(path, query, body, contentType) {
  const r = await Axios.post(BLOGGER_ORIGIN + path, body, {
    params: query,
    headers: {
      "User-Agent": DESKTOP_UA,
      Referer: `${BLOGGER_ORIGIN}/video.g`,
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": contentType || "application/x-www-form-urlencoded;charset=UTF-8",
    },
    timeout: 25000,
    responseType: "arraybuffer",
    validateStatus: () => true,
  });
  return r;
}

function parseVideoConfig(html) {
  if (!html || typeof html !== 'string') return null;
  const re = /var\s+VIDEO_CONFIG\s*=\s*(\{[\s\S]*?\})\s*;/;
  const m = html.match(re);
  if (!m) return null;
  try {
    const cfg = JSON.parse(m[1]);
    const streams = (cfg.streams || []).map(s => ({
      quality: s.quality || s.quality_label || '',
      type: s.type || s.mime || '',
      play_url: s.play_url || s.url || '',
      size: s.size || null
    })).filter(s => s.play_url);
    return { streams, raw: cfg };
  } catch (e) {
    return null;
  }
}

module.exports = { BLOGGER_ORIGIN, DESKTOP_UA, tokenFromUrl, rewriteHtml, fetchPlayer, forwardGet, forwardPost, parseVideoConfig };