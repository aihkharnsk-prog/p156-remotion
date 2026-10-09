param([string]$Key, [string]$File = "examples\p156-draft.json", [string]$Audio = "")
if (-not $Key) { $Key = $env:RENDER_API_KEY }
if (-not $Key -or $Key -notmatch '^[\x21-\x7E]+$') {
  Write-Host "ERROR: -Key must be the real RENDER_API_KEY (English letters/numbers only, no Thai, no ?). Copy it from Railway > renderer > Variables." -ForegroundColor Red
  return
}
$base = "https://renderer-production-8b7f.up.railway.app"
$j = Get-Content $File -Raw -Encoding UTF8 | ConvertFrom-Json
if ($Audio) { $j | Add-Member -NotePropertyName audio_url -NotePropertyValue $Audio -Force }
$body = $j | ConvertTo-Json -Depth 10
$r = Invoke-RestMethod -Uri "$base/render" -Method Post -Headers @{ "x-api-key" = $Key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
do {
  Start-Sleep 5
  $s = Invoke-RestMethod -Uri "$base/status/$($r.job_id)" -Headers @{ "x-api-key" = $Key }
  "$($s.status)  $($s.progress)"
} while ($s.status -in "queued","rendering")
$s.warnings
if ($s.video_url) { Start-Process $s.video_url } else { $s | ConvertTo-Json }
