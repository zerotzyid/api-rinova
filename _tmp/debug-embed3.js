const Axios = require('axios');
(async () => {
  const mega = 'https://odvidhide.com/embed/1xd1l5ugublk';
  const res = await Axios.get(mega, {headers:{'User-Agent':'Mozilla/5.0','Cookie':'file_id=43137045; aff=4822'},timeout:15000,validateStatus:()=>true});
  const html = res.data;
  
  // Check download endpoint
  const dlUrl = 'https://odvidhide.com/dl?o=fo&s=1xd1l5ugublk&fn=https://pixibay.cc/fm.mp4';
  try {
    const dlRes = await Axios.get(dlUrl, {headers:{'User-Agent':'Mozilla/5.0','Referer':mega},timeout:15000,validateStatus:()=>true});
    console.log('DL Status:', dlRes.status);
    console.log('DL Headers:', dlRes.headers);
    console.log('DL Data:', typeof dlRes.data === 'string' ? dlRes.data.substring(0,500) : dlRes.data);
  } catch(e) {
    console.log('DL Error:', e.message);
  }
  
  // Check for any API endpoints
  const apiEndpoints = [
    'https://odvidhide.com/api/source/1xd1l5ugublk',
    'https://odvidhide.com/api/source?id=1xd1l5ugublk',
    'https://odvidhide.com/player/api/1xd1l5ugublk',
    'https://odvidhide.com/embed/1xd1l5ugublk?mode=json',
    'https://odvidhide.com/embed/1xd1l5ugublk?o=json',
  ];
  
  for (const ep of apiEndpoints) {
    try {
      const r = await Axios.get(ep, {headers:{'User-Agent':'Mozilla/5.0','Referer':mega,'X-Requested-With':'XMLHttpRequest'},timeout:10000,validateStatus:()=>true});
      console.log(`API ${ep}:`, r.status, typeof r.data === 'object' ? JSON.stringify(r.data).substring(0,200) : String(r.data).substring(0,200));
    } catch(e) {}
  }
  
  // Try the download link with different params
  const downloadAttempts = [
    'https://odvidhide.com/dl?o=fo&s=1xd1l5ugublk',
    'https://odvidhide.com/dl?op=download_orig&id=1xd1l5ugublk',
    'https://odvidhide.com/dl?op=download&id=1xd1l5ugublk',
  ];
  
  for (const d of downloadAttempts) {
    try {
      const r = await Axios.get(d, {headers:{'User-Agent':'Mozilla/5.0','Referer':mega},timeout:10000,validateStatus:()=>true, maxRedirects: 0});
      console.log(`DL ${d}:`, r.status, r.headers.location || 'no redirect');
    } catch(e) {}
  }
  
})().catch(console.error);