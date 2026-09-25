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
    console.log('Client created: WEB (US)');
    
    const videoId = '9bZkp7q19f0';
    console.log(`Getting raw response for ${videoId}...`);
    
    // Get raw response before parsing
    const response = await youtube.session.execute({
      endpoint: '/youtubei/v1/player',
      body: {
        videoId,
        context: youtube.session.context
      }
    });
    
    console.log('Raw response keys:', Object.keys(response));
    console.log('streamingData present:', !!response.streamingData);
    if (response.streamingData) {
      console.log('formats:', response.streamingData.formats?.length || 0);
      console.log('adaptiveFormats:', response.streamingData.adaptiveFormats?.length || 0);
      if (response.streamingData.formats?.[0]) {
        console.log('First format:', JSON.stringify(response.streamingData.formats[0], null, 2).substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();