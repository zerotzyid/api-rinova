const { Innertube } = require('youtubei.js');

async function test() {
  try {
    console.log('Creating Innertube client...');
    const youtube = await Innertube.create({
      client_type: 'WEB_EMBEDDED_PLAYER',
      lang: 'id',
      location: 'ID',
      cache: new Map(),
      generate_session_locally: true,
    });
    console.log('Client created successfully');
    
    const videoId = 'dQw4w9WgXcQ';
    console.log(`Getting info for ${videoId}...`);
    const info = await youtube.getInfo(videoId);
    console.log('Success!');
    console.log('Title:', info.basicInfo?.title);
    console.log('Formats:', info.formats?.length || 0);
    console.log('Adaptive formats:', info.adaptiveFormats?.length || 0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();