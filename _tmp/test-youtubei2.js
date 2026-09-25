const { Innertube } = require('youtubei.js');

async function test() {
  const clientTypes = ['WEB', 'TV_EMBEDDED', 'IOS', 'ANDROID'];
  
  for (const clientType of clientTypes) {
    try {
      console.log(`\n=== Testing ${clientType} ===`);
      const youtube = await Innertube.create({
        client_type: clientType,
        lang: 'id',
        location: 'ID',
        cache: new Map(),
        generate_session_locally: true,
      });
      console.log(`Client created: ${clientType}`);
      
      const videoId = 'dQw4w9WgXcQ';
      console.log(`Getting info for ${videoId}...`);
      const info = await youtube.getInfo(videoId);
      console.log('Success!');
      console.log('Title:', info.basicInfo?.title);
      console.log('Formats:', info.formats?.length || 0);
      console.log('Adaptive formats:', info.adaptiveFormats?.length || 0);
      break;
    } catch (error) {
      console.error(`${clientType} failed:`, error.message);
    }
  }
}

test();