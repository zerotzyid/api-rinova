const https = require('https');
const req = https.get('https://otakudesu.xyz/', {timeout: 10000}, res => {
  let data='';
  res.on('data',c=>data+=c);
  res.on('end',()=>{
    require('fs').writeFileSync('_tmp/otakudesu-xyz-home.html', data);
    console.log('Saved full HTML to _tmp/otakudesu-xyz-home.html');
    console.log('Length:', data.length);
  });
});
req.on('error',e=>console.error('Error:',e.message));
req.setTimeout(10000,()=>{req.destroy();console.error('Timeout');});