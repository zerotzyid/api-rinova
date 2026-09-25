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
    
    const response = await http.post('/youtubei/v1/player', {
      videoId,
      context: youtube.session.context
    });
    
    console.log('Response status:', response.status);
    console.log('streamingData present:', !!response.data.streamingData);
    if (response.data.streamingData) {
      console.log('formats:', response.data.streamingData.formats?.length || 0);
      console.log('adaptiveFormats:', response.data.streamingData.adaptiveFormats?.length || 0);
      if (response.data.streamingData.formats?.[0]) {
        console.log('First format sample:', JSON.stringify(response.data.streamingData.formats[0], null, 2).substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();