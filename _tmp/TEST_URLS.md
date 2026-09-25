# Test URLs untuk mega/vidhide bypass

## Episode Tsuihou ep13 (slug: tstjwgcm-episode-13-sub-indo)

### Mirror tokens (base64 encoded JSON {id,i,q})
```bash
# Mega 720p -> odvidhide.com
MIRROR_MEGA_720P="eyJpZCI6MjA1NjA0LCJpIjoyLCJxIjoiNzIwcCJ9"

# Vidhide 720p -> filedon.co  
MIRROR_VIDHIDE_720P="eyJpZCI6MjA1NjA0LCJpIjoxLCJxIjoiNzIwcCJ9"

# FileDon 720p -> archive.org (direct MP4)
MIRROR_FILEDON_720P="eyJpZCI6MjA1NjA0LCJpIjowLCJxIjoiNzIwcCJ9"
```

### Embed URLs yang di-resolve dari token di atas
```bash
# Mega -> odvidhide embed
EMBED_MEGA="https://odvidhide.com/embed/1xd1l5ugublk"

# Vidhide -> filedon embed  
EMBED_VIDHIDE="https://filedon.co/embed/FmVOA8A8Fb"

# FileDon -> direct MP4 (archive.org)
DIRECT_FILEDON="https://archive.org/download/otakudesu.io_tsuihou-13/Otakudesu.io_Tsuihou--13_720p.mp4"
```

## Test Commands

```bash
# 1. Test embed-unpack directly
node -e "
const { fetchEmbedMp4, isAllowed } = require('./helpers/embed-unpack');
const mega = 'https://odvidhide.com/embed/1xd1l5ugublk';
const vidhide = 'https://filedon.co/embed/FmVOA8A8Fb';
console.log('isAllowed mega:', isAllowed(mega));
console.log('isAllowed vidhide:', isAllowed(vidhide));
(async () => {
  console.log('Testing mega...');
  const m = await fetchEmbedMp4(mega, 'https://otakudesu.blog/');
  console.log('Mega MP4:', m);
  console.log('Testing vidhide...');
  const v = await fetchEmbedMp4(vidhide, 'https://otakudesu.blog/');
  console.log('Vidhide MP4:', v);
})().catch(console.error);
"

# 2. Test episodeHelper.get (full chain)
node -e "
const { get } = require('./helpers/episodeHelper');
(async () => {
  const mega = 'https://odvidhide.com/embed/1xd1l5ugublk';
  const vidhide = 'https://filedon.co/embed/FmVOA8A8Fb';
  console.log('Testing get() mega...');
  const m = await get(mega);
  console.log('Result:', m);
  console.log('Testing get() vidhide...');
  const v = await get(vidhide);
  console.log('Result:', v);
})().catch(console.error);
"

# 3. Test via API (server running on :3000)
# Resolve mirror token to embed URL
curl -X POST "http://localhost:3000/api/eps/tstjwgcm-episode-13-sub-indo" \
  -H "Content-Type: application/json" \
  -d '{"mirrorId":"eyJpZCI6MjA1NjA0LCJpIjoyLCJxIjoiNzIwcCJ9"}'

# Get auto-server (includes all sources)
curl "http://localhost:3000/api/auto-server/tstjwgcm-episode-13-sub-indo"

# Custom player page
open "http://localhost:3000/player/tstjwgcm-episode-13-sub-indo"
```

## Expected Results

| Host | Pure-HTTP Result | Note |
|------|------------------|------|
| odvidhide.com | `[]` (empty) | jwplayer packed, needs browser |
| filedon.co | `[]` (empty) | jwplayer packed, needs browser |
| archive.org (direct) | MP4 URL | Works via existing odcloud/archive logic |

## Headers yang diperlukan
- User-Agent: Chrome 124
- Referer: https://otakudesu.blog/ (first hop)
- Referer: embed URL (second hop)