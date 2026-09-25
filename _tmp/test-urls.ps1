# Test URLs untuk mega/vidhide bypass - PowerShell
# Run: powershell -ExecutionPolicy Bypass -File _tmp\test-urls.ps1

$baseUrl = "http://localhost:3000"
$episodeSlug = "tstjwgcm-episode-13-sub-indo"

# Mirror tokens (base64 encoded JSON {id,i,q})
$mirrorMega720    = "eyJpZCI6MjA1NjA0LCJpIjoyLCJxIjoiNzIwcCJ9"
$mirrorVidhide720 = "eyJpZCI6MjA1NjA0LCJpIjoxLCJxIjoiNzIwcCJ9"
$mirrorFileDon720 = "eyJpZCI6MjA1NjA0LCJpIjowLCJxIjoiNzIwcCJ9"

# Embed URLs
$embedMega    = "https://odvidhide.com/embed/1xd1l5ugublk"
$embedVidhide = "https://filedon.co/embed/FmVOA8A8Fb"

$headers = @{
    "User-Agent"       = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    "Accept"           = "application/json"
    "Content-Type"     = "application/json"
    "Referer"          = "https://otakudesu.blog/"
}

function Test-EmbedUnpack {
    Write-Host "`n=== Test embed-unpack.js ===" -ForegroundColor Cyan
    
    # Test isAllowed
    $code = @"
const { fetchEmbedMp4, isAllowed } = require('./helpers/embed-unpack');
const mega = '$embedMega';
const vidhide = '$embedVidhide';
console.log('isAllowed mega:', isAllowed(mega));
console.log('isAllowed vidhide:', isAllowed(vidhide));
(async () => {
  console.log('Testing mega...');
  const m = await fetchEmbedMp4(mega, 'https://otakudesu.blog/');
  console.log('Mega MP4:', JSON.stringify(m));
  console.log('Testing vidhide...');
  const v = await fetchEmbedMp4(vidhide, 'https://otakudesu.blog/');
  console.log('Vidhide MP4:', JSON.stringify(v));
})().catch(e => console.error('Error:', e.message));
"@
    node -e $code
}

function Test-EpisodeHelper {
    Write-Host "`n=== Test episodeHelper.get() ===" -ForegroundColor Cyan
    
    $code = @"
const { get } = require('./helpers/episodeHelper');
(async () => {
  const mega = '$embedMega';
  const vidhide = '$embedVidhide';
  console.log('Testing get() mega...');
  const m = await get(mega);
  console.log('Result:', m);
  console.log('Testing get() vidhide...');
  const v = await get(vidhide);
  console.log('Result:', v);
})().catch(e => console.error('Error:', e.message));
"@
    node -e $code
}

function Test-API-ResolveMirror {
    param($mirrorId, $label)
    Write-Host "`n=== POST /api/eps/$episodeSlug/mirror (mirror: $label) ===" -ForegroundColor Green
    $body = @{ mirrorId = $mirrorId } | ConvertTo-Json -Compress
    try {
        $resp = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/eps/$episodeSlug/mirror" -Headers $headers -Body $body
        $resp | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) { $_.ErrorDetails.Message }
    }
}

function Test-API-AutoServer {
    Write-Host "`n=== GET /api/auto-server/$episodeSlug ===" -ForegroundColor Green
    try {
        $resp = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/auto-server/$episodeSlug" -Headers $headers
        $resp | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails) { $_.ErrorDetails.Message }
    }
}

function Test-API-PlayerPage {
    Write-Host "`n=== GET /player/$episodeSlug (HTML) ===" -ForegroundColor Green
    try {
        $resp = Invoke-WebRequest -Method Get -Uri "$baseUrl/player/$episodeSlug" -Headers @{"User-Agent"=$headers["User-Agent"]}
        Write-Host "Status: $($resp.StatusCode)"
        Write-Host "Content-Type: $($resp.Headers['Content-Type'])"
        Write-Host "Length: $($resp.Content.Length) chars"
        # Check for video/iframe
        if ($resp.Content -match '<video') { Write-Host "Has <video> tag: YES" -ForegroundColor Green }
        if ($resp.Content -match '<iframe') { Write-Host "Has <iframe> tag: YES" -ForegroundColor Green }
        if ($resp.Content -match 'googlevideo|\.mp4') { Write-Host "Has MP4/googlevideo reference: YES" -ForegroundColor Green }
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  MEGA/VIDHIDE BYPASS TEST SUITE" -ForegroundColor Yellow
Write-Host "  Episode: $episodeSlug" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Test-EmbedUnpack
Test-EpisodeHelper
Test-API-ResolveMirror -mirrorId $mirrorMega720 -label "Mega 720p"
Test-API-ResolveMirror -mirrorId $mirrorVidhide720 -label "Vidhide 720p"
Test-API-ResolveMirror -mirrorId $mirrorFileDon720 -label "FileDon 720p"
Test-API-AutoServer
Test-API-PlayerPage

Write-Host "`n=== DONE ===" -ForegroundColor Yellow