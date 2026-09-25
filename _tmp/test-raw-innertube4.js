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
    console.log('http type:', typeof youtube.session.http);
    console.log('http keys:', youtube.session.http ? Object.keys(youtube.session.http) : 'none');
    
    const videoId = '9bZkp7q19f0';
    
    // Try different http methods
    const http = youtube.session.http;
    if (http.fetch) {
      console.log('Using http.fetch...');
      const response = await http.fetch('/youtubei/v1/player', {
        method: 'POST',
        body: JSON.stringify({
          videoId,
          context: youtube.session.context
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      console.log('streamingData:', !!data.streamingData);
    } else if (http.request) {
      console.log('Using http.request...');
      const response = await http.request({
        method: 'POST',
        path: '/youtubei/v1/player',
        data: {
          videoId,
          context: youtube.session.context
        }
      });
      console.log('streamingData:', !!response.data?.streamingData);
    } else {
      console.log('Available methods:', Object.getOwnPropertyNames(http));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();