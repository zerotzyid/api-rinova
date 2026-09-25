const { Innertube } = require('youtubei.js');

async function test() {
  // Try different client types
  const clientTypes = ['TV_EMBEDDED', 'IOS', 'ANDROID', 'MWEB'];
  
  for (const clientType of clientTypes) {
    try {
      console.log(`\n=== Testing ${clientType} ===`);
      const youtube = await Innertube.create({
        client_type: clientType,
        lang: 'en',
        location: 'US',
        cache: new Map(),
        generate_session_locally: true,
      });
      
      const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': youtube.session.http.userAgent || 'Mozilla/5.0'
        },
        body: JSON.stringify({
          videoId: '9bZkp7q19f0',
          context: youtube.session.context
        })
      });
      
      const data = await response.json();
      console.log('playabilityStatus:', data.playabilityStatus?.status);
      console.log('streamingData present:', !!data.streamingData);
      if (data.streamingData) {
        console.log('formats:', data.streamingData.formats?.length || 0);
        console.log('adaptiveFormats:', data.streamingData.adaptiveFormats?.length || 0);
      }
      
      if (data.playabilityStatus?.status === 'OK') {
        console.log(`SUCCESS with ${clientType}!`);
        break;
      }
    } catch (error) {
      console.error(`${clientType} error:`, error.message);
    }
  }
}

test();