const html = require('fs').readFileSync('_tmp/odvidhide-full.html', 'utf8');

// Find all eval( function patterns
const evalMatches = html.match(/eval\s*\(/g);
console.log('eval count:', evalMatches ? evalMatches.length : 0);

// Find the jwplayer setup area
const idx = html.indexOf('jwplayer(');
if (idx >= 0) {
  console.log('Found jwplayer at:', idx);
  console.log(html.substring(idx, idx + 5000));
}