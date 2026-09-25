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
    console.log('youtube keys:', Object.keys(youtube));
    console.log('session keys:', youtube.session ? Object.keys(youtube.session) : 'no session');
    
    const videoId = '9bZkp7q19f0';
    
    // Try different methods
    if (youtube.axios) {
      console.log('\nTrying axios directly...');
      const response = await youtube.axios.post('/youtubei/v1/player', {
        videoId,
        context: youtube.session?.context || {}
      });
      console.log('Response keys:', Object.keys(response.data));
      console.log('streamingData:', !!response.data.streamingData);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();