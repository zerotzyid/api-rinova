const https = require('https');
const url = 'https://otakuproxy.zerowebsite.eu.org/episode/tstjwgcm-episode-13-sub-indo';
https.get(url, {timeout: 15000}, res => {
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    console.log('Status:', res.statusCode, 'Length:', data.length);
    if(data.includes('Tsuihou') || data.includes('Episode')) console.log('Found episode title');
    else console.log('Preview:', data.substring(0,500));
  });
}).on('error',e=>console.error('Error:',e.message));