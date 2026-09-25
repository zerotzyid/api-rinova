const html = require('fs').readFileSync('_tmp/odvidhide-full.html', 'utf8');
const line = html.split('\n')[79];

// Extract the full packed string between the first '(' and the last ')
const start = line.indexOf("('") + 2;
const end = line.lastIndexOf("')");
if (start > 1 && end > start) {
  const full = line.substring(start, end);
  console.log('Full packed length:', full.length);
  
  // Split by ',' to get parameters, but the packed string contains commas
  // Find the last 3 commas which separate a, c, k
  const parts = full.split("','");
  if (parts.length >= 4) {
    const p = parts[0];
    const a = parseInt(parts[parts.length - 3]);
    const c = parseInt(parts[parts.length - 2]);
    const k = parts[parts.length - 1].replace(/['"]$/, '');
    
    console.log('a:', a, 'c:', c, 'keys:', k.split('|').length);
    
    const keys = k.split('|');
    let out = p;
    for (let i = a - 1; i >= 0; i--) {
      if (keys[i]) {
        const re = new RegExp('\\b' + i.toString(c) + '\\b', 'g');
        out = out.replace(re, keys[i]);
      }
    }
    console.log('UNPACKED (first 10000):');
    console.log(out.substring(0, 10000));
  }
}