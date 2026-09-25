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
    
    console.log('=== FULL RESPONSE STRUCTURE ===');
    console.log('Top keys:', Object.keys(data));
    console.log('playabilityStatus:', JSON.stringify(data.playabilityStatus, null, 2));
    console.log('streamingData:', data.streamingData);
    console.log('videoDetails keys:', data.videoDetails ? Object.keys(data.videoDetails) : 'null');
    console.log('playerConfig keys:', data.playerConfig ? Object.keys(data.playerConfig) : 'null');
    
    // Check if streamingData is in a different place
    if (data.streamingData) {
      console.log('streamingData present!');
    } else {
      console.log('streamingData MISSING - check playabilityStatus');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();