param([string]$Key, [string]$File = "examples\p156-draft.json", [string]$Audio = "", [switch]$Upload)
if (-not $Key) { $Key = $env:RENDER_API_KEY }
if (-not $Key -or $Key -notmatch '^[\x21-\x7E]+$') {
  Write-Host "ERROR: -Key must be the real RENDER_API_KEY (English letters/numbers only, no Thai, no ?). Copy it from Railway > renderer > Variables." -ForegroundColor Red
  return
}
$base = "https://renderer-production-8b7f.up.railway.app"
if ($Audio -eq "latest") { $Audio = "$base/assets/voice-latest.mp3" }
if ($Audio) {
  if ($Audio -match '/d/([A-Za-z0-9_-]{10,})') { $Audio = "https://drive.google.com/uc?id=$($Matches[1])&export=download" }
  elseif ($Audio -match '[?&]id=([A-Za-z0-9_-]{10,})') { $Audio = "https://drive.google.com/uc?id=$($Matches[1])&export=download" }
  elseif ($Audio -like "$base/*") { }
  elseif ($Audio -notmatch '^https?://[\x21-\x7E]+$') {
    Write-Host "ERROR: -Audio must be the Google Drive share link (copy it from Drive > Share > Copy link). Do not type Thai or ? characters." -ForegroundColor Red
    return
  }
  Write-Host "Audio: $Audio"
}
$j = Get-Content $File -Raw -Encoding UTF8 | ConvertFrom-Json
if ($Audio) { $j | Add-Member -NotePropertyName audio_url -NotePropertyValue $Audio -Force }
if ($Upload) {
  $j | Add-Member -NotePropertyName webhook_url -NotePropertyValue "https://hook.us2.make.com/kcld4bbtli9t1faceobohsk8wok5biay" -Force
  Write-Host "Upload: when the render finishes, Make will upload it to YouTube as PRIVATE."
}
$body = $j | ConvertTo-Json -Depth 10
$r = Invoke-RestMethod -Uri "$base/render" -Method Post -Headers @{ "x-api-key" = $Key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
do {
  Start-Sleep 5
  $s = Invoke-RestMethod -Uri "$base/status/$($r.job_id)" -Headers @{ "x-api-key" = $Key }
  "$($s.status)  $($s.progress)"
} while ($s.status -in "queued","rendering")
$s.warnings
if ($s.thumbnail_url) { Write-Host "Thumbnail: $($s.thumbnail_url)"; Start-Process $s.thumbnail_url }
if ($s.video_url) { Start-Process $s.video_url } else { $s | ConvertTo-Json }
