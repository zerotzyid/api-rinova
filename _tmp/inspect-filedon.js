const axios = require('axios');

async function inspectFiledon(embedUrl, referer) {
  console.log(`\n=== Inspecting: ${embedUrl} ===`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': referer || 'https://otakudesu.blog/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  try {
    const res = await axios.get(embedUrl, { headers, timeout: 15000, validateStatus: () => true });
    const html = typeof res.data === 'string' ? res.data : '';
    
    console.log(`Status: ${res.status}, Length: ${html.length}`);
    
    // Save for manual inspection
    const fs = require('fs');
    const filename = `_tmp/filedon-${embedUrl.split('/').pop()}.html`;
    fs.writeFileSync(filename, html);
    console.log(`Saved to: ${filename}`);
    
    // Look for patterns
    const patterns = {
      'iframe src': /<iframe[^>]+src=["']([^"']+)["']/gi,
      'file:': /file\s*[:=]\s*["']([^"']+)["']/gi,
      'src:': /src\s*[:=]\s*["']([^"']+)["']/gi,
      'source:': /source\s*[:=]\s*["']([^"']+)["']/gi,
      'sources:': /sources\s*[:=]\s*(\[[\s\S]*?\])/gi,
      'mp4': /https?:\/\/[^\s"']+\.mp4[^\s"']*/gi,
      'm3u8': /https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi,
      'jwplayer': /jwplayer/gi,
      'clappr': /clappr/gi,
      'videojs': /videojs/gi,
      'download': /\/dl\?[^"'\s>]+/gi,
      'api': /\/api\/[^"'\s>]+/gi,
      'mode=json': /\?mode=json/gi,
    };
    
    for (const [name, regex] of Object.entries(patterns)) {
      const matches = [...html.matchAll(regex)];
      if (matches.length) {
        console.log(`\n--- ${name} (${matches.length}) ---`);
        matches.slice(0, 5).forEach(m => console.log(`  ${m[1] || m[0]}`));
      }
    }
    
    // Check for base64 in scripts
    const b64Matches = [...html.matchAll(/["']([A-Za-z0-9+/=]{100,})["']/g)];
    if (b64Matches.length) {
      console.log('\n--- Possible base64 strings ---');
      for (const m of b64Matches.slice(0, 3)) {
        try {
          const decoded = Buffer.from(m[1], 'base64').toString('utf8');
          if (decoded.includes('.mp4') || decoded.includes('.m3u8') || decoded.includes('video') || decoded.includes('source')) {
            console.log(`  Found: ${decoded.substring(0, 200)}`);
          }
        } catch(e) {}
      }
    }
    
  } catch (e) {
    console.error('Error:', e.message);
  }
}

// Test the filedon embeds
(async () => {
  await inspectFiledon('https://filedon.co/embed/rEmuYkBmGC', 'https://otakudesu.blog/');
  await inspectFiledon('https://filedon.co/embed/FmVOA8A8Fb', 'https://otakudesu.blog/');
  
  // Also test odvidhide
  await inspectFiledon('https://odvidhide.com/embed/1xd1l5ugublk', 'https://otakudesu.blog/');
})();