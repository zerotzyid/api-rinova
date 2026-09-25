const { Innertube } = require('youtubei.js');

async function test() {
  const youtube = await Innertube.create({
    client_type: 'ANDROID',
    lang: 'en',
    location: 'US',
    cache: new Map(),
    generate_session_locally: true,
  });
  
  const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': youtube.session.http.userAgent
    },
    body: JSON.stringify({
      videoId: '9bZkp7q19f0',
      context: youtube.session.context
    })
  });
  
  const data = await response.json();
  
  console.log('=== FORMATS ===');
  data.streamingData.formats.forEach((f, i) => {
    console.log(`${i}: itag=${f.itag} quality=${f.qualityLabel||'N/A'} mime=${f.mimeType} width=${f.width} height=${f.height} fps=${f.fps} url=${f.url?f.url.substring(0,80)+'...':'NONE'}`);
  });
  
  console.log('\n=== ADAPTIVE FORMATS ===');
  data.streamingData.adaptiveFormats.forEach((f, i) => {
    console.log(`${i}: itag=${f.itag} quality=${f.qualityLabel||'N/A'} mime=${f.mimeType} bitrate=${f.bitrate||'N/A'} width=${f.width} height=${f.height} fps=${f.fps} init=${f.initRange?f.initRange.start+'-'+f.initRange.end:'N/A'} index=${f.indexRange?f.indexRange.start+'-'+f.indexRange.end:'N/A'} url=${f.url?f.url.substring(0,80)+'...':'NONE'}`);
  });
  
  console.log('\n=== VIDEO DETAILS ===');
  console.log('Title:', data.videoDetails?.title);
  console.log('Author:', data.videoDetails?.author);
  console.log('Length:', data.videoDetails?.lengthSeconds);
  console.log('View count:', data.videoDetails?.viewCount);
  console.log('Thumbnails:', data.videoDetails?.thumbnails?.length || 0);
}

test();