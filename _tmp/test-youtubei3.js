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
    
    const videoId = '9bZkp7q19f0'; // Gangnam Style - should be widely available
    console.log(`Getting info for ${videoId}...`);
    const info = await youtube.getInfo(videoId);
    console.log('Success!');
    console.log('Title:', info.basicInfo?.title);
    console.log('Duration:', info.basicInfo?.duration);
    console.log('Formats:', info.formats?.length || 0);
    console.log('Adaptive formats:', info.adaptiveFormats?.length || 0);
    
    if (info.formats?.length) {
      console.log('\nFirst few formats:');
      info.formats.slice(0, 3).forEach(f => {
        console.log(`  itag:${f.itag} quality:${f.qualityLabel||f.quality} mime:${f.mimeType} hasUrl:${!!f.url}`);
      });
    }
    if (info.adaptiveFormats?.length) {
      console.log('\nFirst few adaptive formats:');
      info.adaptiveFormats.slice(0, 3).forEach(f => {
        console.log(`  itag:${f.itag} quality:${f.qualityLabel||f.quality} mime:${f.mimeType} hasUrl:${!!f.url}`);
      });
    }
    
    console.log('\n--- Full basicInfo keys ---');
    console.log(Object.keys(info.basicInfo || {}));
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();