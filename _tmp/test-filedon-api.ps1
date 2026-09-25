# Test FileDon API - PowerShell
# Run: powershell -ExecutionPolicy Bypass -File _tmp\test-filedon-api.ps1

$baseUrl = "http://localhost:3000"
$episodeSlug = "tstjwgcm-episode-13-sub-indo"

# Mirror tokens (base64 encoded JSON {id,i,q})
$mirrorFileDon720 = "eyJpZCI6MjA1NjA0LCJpIjowLCJxIjoiNzIwcCJ9"

$headers = @{
    "User-Agent"       = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    "Accept"           = "application/json"
    "Content-Type"     = "application/json"
    "Referer"          = "https://otakudesu.blog/"
}

Write-Host "=== FileDon API Test Suite ===" -ForegroundColor Yellow
Write-Host "Episode: $episodeSlug" -ForegroundColor Yellow
Write-Host "MirrorId (FileDon 720p): $mirrorFileDon720" -ForegroundColor Cyan

# 1. Test POST /api/eps/:slug/mirror with FileDon token
Write-Host "`n--- 1. POST /api/eps/.../mirror (FileDon) ---" -ForegroundColor Green
$body = @{ mirrorId = $mirrorFileDon720 } | ConvertTo-Json -Compress
try {
    $resp = Invoke-RestMethod -Method Post -Uri "$baseUrl/api/eps/$episodeSlug/mirror" -Headers $headers -Body $body
    $resp | ConvertTo-Json -Depth 5
    if ($resp.data.streamLink -or $resp.data.url) {
        Write-Host "✓ Stream link obtained: $($resp.data.streamLink -or $resp.data.url)" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) { $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 3 }
}

# 2. Test GET /api/auto-server (should include FileDon in sources)
Write-Host "`n--- 2. GET /api/auto-server (check sources) ---" -ForegroundColor Green
try {
    $resp = Invoke-RestMethod -Method Get -Uri "$baseUrl/api/auto-server/$episodeSlug" -Headers $headers
    $resp | ConvertTo-Json -Depth 5
    
    # Check for archive/odcloud/FileDon
    if ($resp.odcloud) { Write-Host "odcloud count: $($resp.odcloud.Count)" -ForegroundColor Cyan }
    if ($resp.archive) { Write-Host "archive count: $($resp.archive.Count)" -ForegroundColor Cyan }
    if ($resp.fallback) { Write-Host "fallback count: $($resp.fallback.Count)" -ForegroundColor Cyan }
    if ($resp.sources) {
        $fileDonSources = $resp.sources | Where-Object { $_.type -eq 'fallback' -and $_.url -like '*archive.org*' }
        Write-Host "FileDon/archive.org sources: $($fileDonSources.Count)" -ForegroundColor Cyan
        $fileDonSources | ForEach-Object { Write-Host "  - $($_.quality) | $($_.server) | $($_.url)" }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Test GET /player (custom player page)
Write-Host "`n--- 3. GET /player (custom player HTML) ---" -ForegroundColor Green
try {
    $resp = Invoke-WebRequest -Method Get -Uri "$baseUrl/player/$episodeSlug" -Headers @{"User-Agent"=$headers["User-Agent"]}
    Write-Host "Status: $($resp.StatusCode)"
    Write-Host "Content-Type: $($resp.Headers['Content-Type'])"
    Write-Host "Length: $($resp.Content.Length) chars"
    
    # Check for video source
    if ($resp.Content -match 'src="([^"]+\.mp4)"') {
        $mp4Url = $matches[1]
        Write-Host "✓ Direct MP4 in player: $mp4Url" -ForegroundColor Green
    }
    if ($resp.Content -match 'archive\.org') {
        Write-Host "✓ archive.org reference found in player" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Test direct MP4 HEAD request (verify playable)
Write-Host "`n--- 4. HEAD direct MP4 (verify playable) ---" -ForegroundColor Green
$directMp4 = "https://archive.org/download/otakudesu.io_tsuihou-13/Otakudesu.io_Tsuihou--13_720p.mp4"
try {
    $head = Invoke-WebRequest -Method Head -Uri $directMp4 -Headers @{"User-Agent"=$headers["User-Agent"]} -TimeoutSec 10
    Write-Host "Status: $($head.StatusCode)"
    Write-Host "Content-Type: $($head.Headers['Content-Type'])"
    Write-Host "Content-Length: $($head.Headers['Content-Length'])"
    Write-Host "Accept-Ranges: $($head.Headers['Accept-Ranges'])"
    if ($head.StatusCode -eq 200 -and $head.Headers['Content-Type'] -like 'video/*') {
        Write-Host "✓ Direct MP4 is playable" -ForegroundColor Green
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== DONE ===" -ForegroundColor Yellow