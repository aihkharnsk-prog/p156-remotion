# facts-powerbank — พาวเวอร์แบงก์ชาร์จเร็ว (ยังไงนะ)

Sources (S#): S1 Anker "Why a 10000mAh power bank isn't actually 10000mAh" (https://www.anker.com/blogs/power-banks/why-10000mah-power-bank-not-actually-10000mah) · S2 Acroname "Basics of USB Power Delivery negotiations" (https://acroname.com/blog/basics-usb-power-delivery-negotiations) · S3 Anker "What to do with a swollen power bank" (https://us.anker.com/blogs/power-banks/what-to-do-with-swollen-power-bank)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Li-ion cells have nominal ~3.7 V; USB needs 5 V so a boost converter steps up | S1 | High |
| 2 | 10,000 mAh cell = 37 Wh; at 5 V theoretical 7,400 mAh; good boost converters ~85-90% efficient; practical 6,000-6,500 mAh | S1 | High (Anker figures; script says ราว) |
| 3 | Boost topology (switch closed: current builds inductor field; switch open: inductor pushes through diode to output cap) is standard electronics, not from S1 | general electronics | High (standard) |
| 4 | PD: source sends Source Capabilities (PDOs: fixed 5/9/15/20 V etc.), sink replies with a Request, source accepts, adjusts voltage, sends PS Ready | S2 | High |
| 5 | Script wording 'ถ้าตกลงกันไม่ได้ ให้แค่ 5V' (default 5 V fallback) is standard USB behaviour; not stated verbatim in S2 | general USB/PD spec | Medium-High |
| 6 | Messages travel on the CC wire in USB-C; script does not name CC (S2 page does not say which wire) | general USB-C spec | not stated in script |
| 7 | Controller IC monitors temperature/current and reduces power or cuts off (protection) | general; common BMS function | Medium |
| 8 | Capacity fades over hundreds of cycles; swelling = gas from electrolyte breakdown; stop using if swollen | S3 | High |
| 9 | Droplet of nudge: compare how many phone charges now vs new (no source needed) | n/a | n/a |

Animation notes: converter switching is kHz-MHz in reality, shown at ~1 Hz for visibility; current-dot counts, 10-15% loss shading are schematic. Not used: specific protocol names (QC/PPS), wattage numbers, cycle counts to 80%.
