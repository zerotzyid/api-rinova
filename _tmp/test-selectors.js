const https = require('https');
const cheerio = require('cheerio');
const url = 'https://otakuproxy.zerowebsite.eu.org/episode/tstjwgcm-episode-13-sub-indo';
https.get(url, {timeout: 15000}, res => {
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    const $ = cheerio.load(data);
    const title1 = $(".venutama > h1").first().text();
    const title2 = $(".posttl").first().text();
    console.log('title1:', title1);
    console.log('title2:', title2);
    console.log('has venutama:', $(".venutama").length);
    console.log('has posttl:', $(".posttl").length);
    // also check for mirrorstream
    console.log('mirrorstream ul count:', $(".mirrorstream ul").length);
  });
}).on('error',e=>console.error('Error:',e.message));