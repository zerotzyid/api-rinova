const bg = require('../helpers/blogger');

let youtubeClient = null;
let clientPromise = null;

async function getYoutubeClient() {
  if (youtubeClient) return youtubeClient;
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const { Innertube } = await import('youtubei.js');
    youtubeClient = await Innertube.create({
      client_type: 'ANDROID',
      lang: 'en', location: 'US',
      cache: new Map(), generate_session_locally: true,
    });
    return youtubeClient;
  })();
  return clientPromise;
}

function formatFormat(f) {
  return { itag: f.itag, quality: f.qualityLabel||f.quality||'unknown', mimeType: f.mimeType, bitrate: f.bitrate, width: f.width, height: f.height, fps: f.fps, initRange: f.initRange, indexRange: f.indexRange, url: f.url, hasUrl: !!f.url };
}

async function extractYouTube(videoId) {
  const youtube = await getYoutubeClient();
  const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': youtube.session.http.userAgent },
    body: JSON.stringify({ videoId, context: youtube.session.context })
  });
  const data = await res.json();
  if (data.playabilityStatus?.status !== 'OK' || !data.streamingData) return null;
  const fmts = data.streamingData.formats || [];
  const adapts = data.streamingData.adaptiveFormats || [];
  return {
    source: 'youtube',
    videoId,
    title: data.videoDetails?.title,
    author: data.videoDetails?.author,
    duration: data.videoDetails?.lengthSeconds,
    viewCount: data.videoDetails?.viewCount,
    formats: {
      combined: fmts.filter(f=>f.url).map(formatFormat).sort((a,b)=>(b.height||0)-(a.height||0)),
      video: adapts.filter(f=>f.mimeType?.includes('video/')&&!f.mimeType?.includes('audio/')).map(formatFormat).sort((a,b)=>(b.height||0)-(a.height||0)),
      audio: adapts.filter(f=>f.mimeType?.includes('audio/')).map(formatFormat).sort((a,b)=>(b.bitrate||0)-(a.bitrate||0)),
    }
  };
}

async function extractBlogger(token) {
  const html = await bg.fetchPlayer(token);
  if (!html) return null;
  const rewritten = bg.rewriteHtml(html, '/api/bv');
  return {
    source: 'blogger',
    token,
    frameUrl: `/api/bv/frame?token=${encodeURIComponent(token)}`,
    assetBase: '/api/bv/',
    html: rewritten,
    hasHook: rewritten.includes('__bv'),
    note: 'Player iframe ready. Hook posts googlevideo/MP4 to parent via postMessage.'
  };
}

function detectSource(input) {
  if (!input) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return 'youtube';
  if (input.includes('blogger.com/video.g') || input.includes('token=')) return 'blogger';
  if (/^[A-Za-z0-9+/=]{20,}$/.test(input)) return 'blogger'; // base64 token
  return 'unknown';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const input = req.query.v || req.query.videoId || req.query.token || req.query.url;
  if (!input) return res.status(400).json({ error: 'Parameter v|videoId|token|url wajib', usage: '/api/extract?v=YT_ID atau /api/extract?token=BLOGGER_TOKEN' });

  const source = detectSource(input);
  const results = [];

  if (source === 'youtube' || source === 'unknown') {
    try {
      const yt = await extractYouTube(input);
      if (yt) results.push(yt);
    } catch (e) { console.error('YT extract fail:', e.message); }
  }

  if (source === 'blogger' || source === 'unknown') {
    const token = input.includes('token=') ? new URL(input).searchParams.get('token') : input;
    try {
      const bgRes = await extractBlogger(token);
      if (bgRes) results.push(bgRes);
    } catch (e) { console.error('Blogger extract fail:', e.message); }
  }

  if (!results.length) return res.status(404).json({ error: 'Tidak bisa extract dari source manapun', input, detectedSource: source });

  return res.json({ input, detectedSource: source, results, gaps: [
    'Blogger: video sering expired/unavailable (UI "Video is unavailable")',
    'YouTube: butuh client ANDROID/TV_EMBEDDED; WEB_EMBEDDED sering gagal',
    'Adaptive formats (video/audio terpisah) perlu DASH muxing client-side',
    'Signed URLs expired ~6 jam, butuh re-fetch',
    'Tidak ada support host lain (streamtape, mp4upload, upcloud, dll)',
    'Tidak ada cache layer (KV/Redis) untuk signed URL & metadata',
    'Rate limit upstream belum diimplementasi',
    'Blogger proxy butuh iframe (CSP/COOP restrict), tidak bisa direct MP4'
  ]});
};