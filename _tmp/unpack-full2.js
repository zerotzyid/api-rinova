const html = require('fs').readFileSync('_tmp/odvidhide-full.html', 'utf8');
const line = html.split('\n')[79];

const start = line.indexOf("('") + 2;
const end = line.lastIndexOf("')");
const full = line.substring(start, end);

// Find the last 3 occurrences of ',' that are followed by numbers and then the keys
// The pattern is: 'packed_string',a,c,'keys'
let lastComma = -1;
let commas = [];
for (let i = 0; i < full.length; i++) {
  if (full[i] === ',' && full[i+1] !== "'") {
    commas.push(i);
  }
}
console.log('Comma positions:', commas.slice(-10));

// The last 3 commas should separate a, c, k
if (commas.length >= 3) {
  const c1 = commas[commas.length - 3];
  const c2 = commas[commas.length - 2];
  const c3 = commas[commas.length - 1];
  
  const p = full.substring(0, c1);
  const a = full.substring(c1 + 1, c2);
  const c = full.substring(c2 + 1, c3);
  const k = full.substring(c3 + 1).replace(/^'|'$/g, '');
  
  console.log('p len:', p.length);
  console.log('a:', a, 'c:', c);
  console.log('k len:', k.length, 'keys:', k.split('|').length);
  
  const keys = k.split('|');
  let out = p;
  for (let i = parseInt(a) - 1; i >= 0; i--) {
    if (keys[i]) {
      const re = new RegExp('\\b' + i.toString(parseInt(c)) + '\\b', 'g');
      out = out.replace(re, keys[i]);
    }
  }
  console.log('UNPACKED:');
  console.log(out.substring(0, 10000));
}