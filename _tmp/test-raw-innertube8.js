const { Innertube } = require('youtubei.js');

async function test() {
  try {
    const youtube = await Innertube.create({
      client_type: 'WEB',
      lang: 'en',
      location: 'US',
      cache: new Map(),
      generate_session_locally: true,
    });
    
    const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        videoId: '9bZkp7q19f0',
        context: youtube.session.context
      })
    });
    
    const data = await response.json();
    
    console.log('streamingData keys:', data.streamingData ? Object.keys(data.streamingData) : 'null');
    console.log('formats:', data.streamingData?.formats?.length || 0);
    console.log('adaptiveFormats:', data.streamingData?.adaptiveFormats?.length || 0);
    
    if (data.streamingData?.formats) {
      console.log('\n=== COMBINED FORMATS ===');
      data.streamingData.formats.forEach((f, i) => {
        console.log(`${i}: itag=${f.itag} quality=${f.qualityLabel||'N/A'} mime=${f.mimeType} url=${f.url?f.url.substring(0,80)+'...':'NONE'}`);
      });
    }
    
    if (data.streamingData?.adaptiveFormats) {
      console.log('\n=== ADAPTIVE FORMATS ===');
      data.streamingData.adaptiveFormats.forEach((f, i) => {
        console.log(`${i}: itag=${f.itag} quality=${f.qualityLabel||'N/A'} mime=${f.mimeType} bitrate=${f.bitrate||'N/A'} url=${f.url?f.url.substring(0,80)+'...':'NONE'}`);
      });
    }
    
    console.log('\n=== VIDEO DETAILS ===');
    console.log('Title:', data.videoDetails?.title);
    console.log('Author:', data.videoDetails?.author);
    console.log('Length:', data.videoDetails?.lengthSeconds);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();