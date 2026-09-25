const Axios = require('axios');
(async () => {
  const mega = 'https://odvidhide.com/embed/1xd1l5ugublk';
  const res = await Axios.get(mega, {headers:{'User-Agent':'Mozilla/5.0'},timeout:15000,validateStatus:()=>true});
  console.log('Status:', res.status);
  console.log('Length:', res.data?.length);
  const patterns = [
    /file\s*[:=]\s*["']([^"']+)/gi,
    /src\s*[:=]\s*["']([^"']+)/gi,
    /source\s*[:=]\s*["']([^"']+)/gi,
    /sources\s*[:=]\s*(\[[\s\S]*?\])/gi,
    /\.mp4/gi,
    /master\.m3u8/gi,
    /jwplayer/gi,
    /fluidplayer/gi,
    /clappr/gi,
    /videojs/gi,
  ];
  for (const p of patterns) {
    const matches = [...res.data.matchAll(p)];
    if (matches.length) console.log(p.source, '->', matches.slice(0,3).map(m=>m[1]||m[0]));
  }
})().catch(console.error);