const html = require('fs').readFileSync('_tmp/odvidhide-full.html', 'utf8');

// Search for the packed string pattern
const patterns = [
  /\}\s*\('([A-Za-z0-9+/=]+)',(\d+),(\d+),'([^']+)'\)/,
  /\}\s*\("([^"]+)",(\d+),(\d+),"([^"]+)"\)/,
  /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\s*\(\s*['"]([^'"]+)['"],\s*(\d+),\s*(\d+),\s*['"]([^'"]+)['"]\s*\)/,
];

for (const pat of patterns) {
  const m = html.match(pat);
  if (m) {
    console.log('Pattern matched:', pat);
    console.log('Groups:', m.slice(1, 5));
  }
}

// Just search for the base64-like packed string
const b64Pattern = /\}\s*\('([A-Za-z0-9+/=]{100,})',(\d+),(\d+),'([^']+)'\)/g;
let match;
while ((match = b64Pattern.exec(html)) !== null) {
  console.log('Found packed:', match[0].substring(0, 100));
  const [, p, a, c, k] = match;
  const keys = k.split('|');
  let out = p;
  for (let i = a - 1; i >= 0; i--) {
    if (keys[i]) {
      const re = new RegExp('\\b' + i.toString(c) + '\\b', 'g');
      out = out.replace(re, keys[i]);
    }
  }
  console.log('UNPACKED:');
  console.log(out.substring(0, 5000));
  break;
}