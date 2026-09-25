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
    
    // Check the http client config
    const http = youtube.session.http;
    console.log('baseURL:', http.baseURL);
    console.log('apiURL:', http.apiURL);
    console.log('baseURL2:', http.baseURL2);
    
    // Try with full URL
    const response = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false&alt=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': http.userAgent || 'Mozilla/5.0'
      },
      body: JSON.stringify({
        videoId: '9bZkp7q19f0',
        context: youtube.session.context
      })
    });
    
    const data = await response.json();
    console.log('Response keys:', Object.keys(data));
    console.log('streamingData present:', !!data.streamingData);
    if (data.streamingData) {
      console.log('formats:', data.streamingData.formats?.length || 0);
      console.log('adaptiveFormats:', data.streamingData.adaptiveFormats?.length || 0);
      if (data.streamingData.formats?.[0]) {
        console.log('First format keys:', Object.keys(data.streamingData.formats[0]));
        console.log('First format itag:', data.streamingData.formats[0].itag);
        console.log('First format quality:', data.streamingData.formats[0].qualityLabel);
        console.log('First format mimeType:', data.streamingData.formats[0].mimeType);
        console.log('First format url exists:', !!data.streamingData.formats[0].url);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();