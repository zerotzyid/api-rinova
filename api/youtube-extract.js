let youtubeClient = null;
let clientPromise = null;

async function getYoutubeClient() {
  if (youtubeClient) return youtubeClient;
  if (clientPromise) return clientPromise;
  
  clientPromise = (async () => {
    const { Innertube } = await import('youtubei.js');
    youtubeClient = await Innertube.create({
      client_type: 'ANDROID',
      lang: 'en',
      location: 'US',
      cache: new Map(),
      generate_session_locally: true,
    });
    return youtubeClient;
  })();
  
  return clientPromise;
}

function formatFormat(f) {
  return {
    itag: f.itag,
    quality: f.qualityLabel || f.quality || 'unknown',
    mimeType: f.mimeType,
    bitrate: f.bitrate,
    width: f.width,
    height: f.height,
    fps: f.fps,
    contentLength: f.contentLength,
    initRange: f.initRange,
    indexRange: f.indexRange,
    url: f.url,
    hasUrl: !!f.url,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const videoId = req.query.v || req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ 
      error: 'videoId wajib diisi',
      usage: '/api/youtube-extract?v=VIDEO_ID'
    });
  }
  
  try {
    const youtube = await getYoutubeClient();
    
    const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': youtube.session.http.userAgent
      },
      body: JSON.stringify({
        videoId,
        context: youtube.session.context
      })
    });
    
    const data = await response.json();
    
    if (data.playabilityStatus?.status !== 'OK') {
      return res.status(404).json({ 
        error: 'Video tidak dapat diputar',
        reason: data.playabilityStatus?.reason,
        videoId
      });
    }
    
    if (!data.streamingData) {
      return res.status(404).json({ error: 'Tidak ada streaming data', videoId });
    }
    
    const formats = data.streamingData.formats || [];
    const adaptiveFormats = data.streamingData.adaptiveFormats || [];
    
    const grouped = {
      video: adaptiveFormats
        .filter(f => f.mimeType?.includes('video/') && !f.mimeType?.includes('audio/'))
        .map(formatFormat)
        .sort((a, b) => (b.height || 0) - (a.height || 0)),
      audio: adaptiveFormats
        .filter(f => f.mimeType?.includes('audio/'))
        .map(formatFormat)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0)),
      combined: formats
        .filter(f => f.url)
        .map(formatFormat)
        .sort((a, b) => (b.height || 0) - (a.height || 0)),
    };
    
    return res.json({
      videoId,
      title: data.videoDetails?.title,
      author: data.videoDetails?.author,
      duration: data.videoDetails?.lengthSeconds,
      viewCount: data.videoDetails?.viewCount,
      thumbnails: data.videoDetails?.thumbnails,
      formats: grouped,
      playabilityStatus: data.playabilityStatus,
    });
    
  } catch (error) {
    console.error('YouTube extract error:', error);
    return res.status(500).json({ 
      error: 'Gagal extract video',
      message: error.message,
      videoId
    });
  }
};