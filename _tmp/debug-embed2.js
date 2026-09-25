const Axios = require('axios');
(async () => {
  const mega = 'https://odvidhide.com/embed/1xd1l5ugublk';
  const res = await Axios.get(mega, {headers:{'User-Agent':'Mozilla/5.0'},timeout:15000,validateStatus:()=>true});
  const html = res.data;
  
  // Search for API/ajax calls
  const apiPatterns = [
    /\.ajax\s*\(/gi,
    /\.post\s*\(/gi,
    /\.get\s*\(/gi,
    /fetch\s*\(/gi,
    /api\//gi,
    /player/gi,
    /source/gi,
    /getFile/gi,
    /getVideo/gi,
    /getSource/gi,
  ];
  
  for (const p of apiPatterns) {
    const matches = [...html.matchAll(p)];
    if (matches.length) console.log(p.source, 'count:', matches.length);
  }
  
  // Look for data attributes
  const dataPatterns = [
    /data-[^=]+=["']([^"']*)/gi,
  ];
  
  // Look for any URLs in scripts
  const urlPattern = /https?:\/\/[^\s"'>]+\.(?:mp4|m3u8|ts)/gi;
  const urls = [...html.matchAll(urlPattern)];
  if (urls.length) console.log('Direct media URLs:', urls.map(m=>m[0]));
  
  // Check for base64 encoded data
  const b64Pattern = /atob\(["']([^"']+)["']\)/gi;
  const b64Matches = [...html.matchAll(b64Pattern)];
  if (b64Matches.length) {
    console.log('Base64 patterns:', b64Matches.slice(0,5).map(m=>m[1]));
    for (const m of b64Matches.slice(0,5)) {
      try {
        const decoded = Buffer.from(m[1], 'base64').toString('utf8');
        console.log('Decoded:', decoded.substring(0,200));
      } catch(e) {}
    }
  }
  
  // Save full HTML for manual inspection
  require('fs').writeFileSync('_tmp/odvidhide-full.html', html);
  console.log('Full HTML saved to _tmp/odvidhide-full.html');
})().catch(console.error);