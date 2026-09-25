const html = require('fs').readFileSync('_tmp/odvidhide-full.html', 'utf8');

// Extract the packed code
const packedMatch = html.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([^']+)',(\d+),(\d+),'([^']+)'\)/);
if (packedMatch) {
  const [, p, a, c, k] = packedMatch;
  console.log('Found packed code');
  console.log('a:', a, 'c:', c, 'keys:', k.split('|').length);
  
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
} else {
  console.log('No packed code found with that pattern');
  
  // Try broader search
  const allEvals = html.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('[^']+',\d+,\d+,'[^']+'\)/g);
  if (allEvals) {
    console.log('Found', allEvals.length, 'eval blocks');
    for (let i = 0; i < allEvals.length; i++) {
      const m = allEvals[i].match(/\('([^']+)',(\d+),(\d+),'([^']+)'\)/);
      if (m) {
        console.log(`Block ${i}:`, m.slice(1));
      }
    }
  }
}