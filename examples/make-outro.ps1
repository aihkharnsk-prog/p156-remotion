# สร้างภาพปิดท้าย (สปอนเซอร์ Cardz Center) จากรูปการ์ดจริง แล้วเปิดให้ดู
# ทุกคลิปที่ render หลังจากนี้จะใช้ภาพนี้อัตโนมัติ (/brand/outro.png)
param([string]$Key)
if (-not $Key) { $Key = $env:RENDER_API_KEY }
$base = "https://renderer-production-8b7f.up.railway.app"
$cards = @(
  @("https://world.digimoncard.com/images/cardlist/card/ST1-03.png", "https://world.digimoncard.com/images/cardlist/card/BT1-010.png"),   # Digimon: Agumon
  @("https://images.ygoprodeck.com/images/cards/46986414.jpg", "https://images.ygoprodeck.com/images/cards_small/46986414.jpg"),     # Yu-Gi-Oh: Dark Magician
  @("https://images.pokemontcg.io/base1/58_hires.png", "https://images.pokemontcg.io/base1/58.png"),                                 # Pokemon: Pikachu (Base Set)
  @("https://en.onepiece-cardgame.com/images/cardlist/card/ST01-001.png", "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png"), # One Piece: Luffy
  @("https://images.pokemontcg.io/base1/4_hires.png", "https://images.pokemontcg.io/base1/4.png")                                    # Pokemon: Charizard (Base Set)
)
$body = @{ cards = $cards } | ConvertTo-Json -Depth 5
$r = Invoke-RestMethod -Uri "$base/outro" -Method Post -Headers @{ "x-api-key" = $Key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
"Used:";   $r.used
if ($r.failed) { "Failed (tried a backup):"; $r.failed }
Start-Process $r.outro_url
