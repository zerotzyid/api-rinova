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
    console.log('Client created');
    
    const videoId = '9bZkp7q19f0';
    const http = youtube.session.http;
    
    // Use the internal _send method or similar
    const response = await http.fetch('/youtubei/v1/player', {
      method: 'POST',
      body: {
        videoId,
        context: youtube.session.context
      }
    });
    
    const data = await response.json();
    console.log('Response keys:', Object.keys(data));
    console.log('streamingData present:', !!data.streamingData);
    if (data.streamingData) {
      console.log('formats:', data.streamingData.formats?.length || 0);
      console.log('adaptiveFormats:', data.streamingData.adaptiveFormats?.length || 0);
      if (data.streamingData.formats?.[0]) {
        console.log('First format:', JSON.stringify(data.streamingData.formats[0], null, 2).substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();