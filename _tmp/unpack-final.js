const html = require('fs').readFileSync('_tmp/odvidhide-full.html', 'utf8');
const line = html.split('\n')[79];

// Find the eval call and extract parameters
const start = line.indexOf("('");
if (start >= 0) {
  // Find the closing ')
  let pos = start + 2;
  let inString = true;
  let stringEnd = -1;
  while (pos < line.length) {
    if (line[pos] === "'" && line[pos-1] !== "\\") {
      stringEnd = pos;
      break;
    }
    pos++;
  }
  if (stringEnd > 0) {
    const p = line.substring(start + 2, stringEnd);
    const rest = line.substring(stringEnd + 1).trim();
    // Parse a, c, k
    const paramMatch = rest.match(/^,\s*(\d+),\s*(\d+),\s*'([^']+)'/);
    if (paramMatch) {
      const a = parseInt(paramMatch[1]);
      const c = parseInt(paramMatch[2]);
      const k = paramMatch[3];
      console.log('Found params: a=', a, 'c=', c, 'keys=', k.split('|').length);
      
      const keys = k.split('|');
      let out = p;
      for (let i = a - 1; i >= 0; i--) {
        if (keys[i]) {
          const re = new RegExp('\\b' + i.toString(c) + '\\b', 'g');
          out = out.replace(re, keys[i]);
        }
      }
      console.log('UNPACKED:');
      console.log(out.substring(0, 8000));
    }
  }
}