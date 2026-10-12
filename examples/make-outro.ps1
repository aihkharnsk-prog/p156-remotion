# สร้างภาพปิดท้าย (สปอนเซอร์ Cardz Center) จากรูปการ์ดจริง แล้วเปิดให้ดู
# ทุกคลิปที่ render หลังจากนี้จะใช้ภาพนี้อัตโนมัติ (/brand/outro.png)
param([string]$Key)
if (-not $Key) { $Key = $env:RENDER_API_KEY }
$base = "https://renderer-production-8b7f.up.railway.app"
# การ์ดราคาสูง 5 ใบ (ใบกลาง = ใบที่ 3) — แต่ละใบมีลิงก์สำรอง
$cards = @(
  @("https://api.scryfall.com/cards/named?exact=Black%20Lotus&set=lea&format=image&version=large", "https://api.scryfall.com/cards/named?exact=Black%20Lotus&set=leb&format=image&version=large", "https://images.pokemontcg.io/base1/2_hires.png"), # Magic: Black Lotus (Alpha)
  @("https://images.ygoprodeck.com/images/cards/89631139.jpg", "https://images.ygoprodeck.com/images/cards_small/89631139.jpg"),       # Yu-Gi-Oh: Blue-Eyes White Dragon
  @("https://images.pokemontcg.io/base1/4_hires.png", "https://images.pokemontcg.io/base1/4.png"),                                     # Pokemon: Charizard (Base Set)
  @("https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p2.png", "https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119_p1.png", "https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119.png", "https://images.pokemontcg.io/neo1/9_hires.png"), # One Piece: Luffy Gear 5 (OP05-119)
  @("https://images.pokemontcg.io/swsh7/215_hires.png", "https://images.pokemontcg.io/swsh7/215.png")                                  # Pokemon: Umbreon VMAX alt art (Evolving Skies)
)
$body = @{ cards = $cards } | ConvertTo-Json -Depth 6
"Making the outro..."
$r = Invoke-RestMethod -TimeoutSec 900 -Uri "$base/outro" -Method Post -Headers @{ "x-api-key" = $Key } -ContentType "application/json; charset=utf-8" -Body ([Text.Encoding]::UTF8.GetBytes($body))
"Used:";   $r.used
if ($r.failed) { "Failed (tried a backup):"; $r.failed }
if ($r.notes) { "Notes:"; $r.notes }
Start-Process $r.outro_url
