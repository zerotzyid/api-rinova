const axios = require('axios');
(async () => {
  const url = 'https://filedon.co/embed/rEmuYkBmGC';
  const res = await axios.get(url, {headers:{'User-Agent':'Mozilla/5.0'}, timeout:15000, validateStatus:()=>true});
  const html = res.data;
  const mp4Matches = [...html.matchAll(/https?:\/\/[^\s"']+\.mp4[^\s"']*/gi)];
  console.log('MP4 matches:', mp4Matches.map(m=>m[0]));
  const m3u8Matches = [...html.matchAll(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/gi)];
  console.log('M3U8 matches:', m3u8Matches.map(m=>m[0]));
  const srcMatches = [...html.matchAll(/sources?\s*[:=]\s*(\[[^\]]+\])/gi)];
  console.log('Sources matches:', srcMatches.map(m=>m[1]));
})().catch(console.error);