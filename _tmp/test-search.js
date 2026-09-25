const https = require('https');
const req = https.get('https://otakudesu.xyz/?s=boruto&post_type=anime', {timeout: 10000}, res => {
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    const hasPage = data.includes('class="page"');
    const hasVenz = data.includes('class="venz"');
    const hasUlLi = data.includes('<ul');
    console.log('Has .page:', hasPage);
    console.log('Has .venz:', hasVenz);
    console.log('Has <ul:', hasUlLi);
    console.log('Length:', data.length);
    const matches = data.match(/<li[^>]*>[\s\S]*?<\/li>/g);
    if(matches) console.log('Found', matches.length, 'li elements');
  });
});
req.on('error',e=>console.error('Error:',e.message));
req.setTimeout(10000,()=>{req.destroy();console.error('Timeout');});