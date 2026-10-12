param([string]$Key, [string]$File = "examples\pmcg1-001-reel.json")
if (-not $Key) { $Key = $env:RENDER_API_KEY }
$base = "https://renderer-production-8b7f.up.railway.app"
$j = Get-Content $File -Raw -Encoding UTF8 | ConvertFrom-Json
$body = @{ thumb = $j.meta.thumb } | ConvertTo-Json -Depth 6
$r = Invoke-RestMethod -Uri "$base/thumb" -Method Post -Headers @{ "x-api-key" = $Key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
Write-Host "Thumbnail: $($r.thumbnail_url)"
Start-Process $r.thumbnail_url
