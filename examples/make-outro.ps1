# สร้างภาพปิดท้าย (สปอนเซอร์ Cardz Center) จากรูปการ์ดจริง แล้วเปิดให้ดู
# ทุกคลิปที่ render หลังจากนี้จะใช้ภาพนี้อัตโนมัติ (/brand/outro.png)
param([string]$Key)
if (-not $Key) { $Key = $env:RENDER_API_KEY }
$base = "https://renderer-production-8b7f.up.railway.app"
# art = กรอบรูปบนการ์ด (ซ้าย, บน, ขวา, ล่าง เป็นสัดส่วน 0-1) ใช้ตัดตัวละครให้โผล่ออกมาแบบ 3D
$pkArt = @(0.085, 0.105, 0.915, 0.47)
$cards = @(
  @{ urls = @("https://world.digimoncard.com/images/cardlist/card/ST1-03.png", "https://world.digimoncard.com/images/cardlist/card/BT1-010.png"); art = @(0.04, 0.04, 0.96, 0.62) },        # Digimon: Agumon
  @{ urls = @("https://images.ygoprodeck.com/images/cards/46986414.jpg", "https://images.ygoprodeck.com/images/cards_small/46986414.jpg"); art = @(0.12, 0.183, 0.88, 0.69) },          # Yu-Gi-Oh: Dark Magician
  @{ urls = @("https://images.pokemontcg.io/base1/58_hires.png", "https://images.pokemontcg.io/base1/58.png"); art = $pkArt },                                                        # Pokemon: Pikachu
  @{ urls = @("https://en.onepiece-cardgame.com/images/cardlist/card/ST01-001.png", "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png"); art = @(0.04, 0.04, 0.96, 0.70) }, # One Piece: Luffy
  @{ urls = @("https://images.pokemontcg.io/base1/4_hires.png", "https://images.pokemontcg.io/base1/4.png"); art = $pkArt }                                                           # Pokemon: Charizard
)
$body = @{ cards = $cards } | ConvertTo-Json -Depth 6
"Making the outro (cutting characters out takes 1-3 minutes)..."
$r = Invoke-RestMethod -TimeoutSec 900 -Uri "$base/outro" -Method Post -Headers @{ "x-api-key" = $Key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
"Used:";   $r.used
if ($r.failed) { "Failed (tried a backup):"; $r.failed }
if ($r.notes) { "Notes:"; $r.notes }
Start-Process $r.outro_url
