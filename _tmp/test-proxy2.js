const https = require('https');
const url = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://otakudesu.blog/');
https.get(url, {timeout: 10000}, res => {
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    console.log('Status:', res.statusCode, 'Length:', data.length);
    if(data.length>200) console.log('Preview:', data.substring(0,200));
  });
}).on('error',e=>console.error('Error:',e.message));