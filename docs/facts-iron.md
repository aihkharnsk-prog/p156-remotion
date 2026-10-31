# facts-iron — เตารีดไอน้ำ (ยังไงนะ)

Sources (S#): S1 ScienceABC (https://www.scienceabc.com/innovation/iron-automatic-temperature-regulation-control-thermostat-heating-element-bimetallic-strip) · S2 eTechnophiles (https://www.etechnophiles.com/?p=1958) · S3 DroneBot Workshop wiki (https://wiki.dronebotworkshop.com/wiki/how-does-an-electric-iron-work.html) · S4 US patent 3,983,644 flash steam iron (https://patents.justia.com/patent/3983644) · S5 US patent 6,115,949 drip valve (https://patents.google.com/patent/US6115949) · S6 Storeboard "Steam Irons How They Work" (https://www.storeboard.com/blogs/electronics/steam-irons-how-they-work/927494) · S7 Russell Hobbs 12659 manual (https://russellhobbs-dev.syncrony.com/media/usermanuals/12659-RH-Steam-iron.pdf) · S8 Philips iron manual (https://www.documents.philips.com/assets/20210424/98d6acc1e29a49a3a08cad14001fb204.pdf) · S9 Wikipedia Clothes iron (https://en.wikipedia.org/wiki/Clothes_iron) · S10 National MagLab smoothing iron 1882 (https://nationalmaglab.org/magnet-academy/history-of-electricity-magnetism/museum/smoothing-iron-1882/) · S11 Sunbeam manual (https://www.manualslib.com/manual/682839/Sunbeam-Sr8700.html?page=5)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Nichrome heating element; resistance turns current into heat; heat conducts into the soleplate | S1, S2, S3, S4 (element cast into soleplate) | High (script says "มักเป็น") |
| 2 | Bimetallic strip (two metals, different expansion) bends when hot, opens the contact and cuts power | S1, S2, S3 | High |
| 3 | When cool the strip returns, contact closes again; cycle repeats to hold temperature | S1, S2, S3, S7, S11 (light cycles on/off) | High |
| 4 | Dial does not change element heat; it sets how far the strip must bend (screw/contact), higher setting = hotter before cut-off | S1, S2 (knob turns a screw), S4 (thermostat set by knob) | High |
| 5 | Water tank -> metering/drip valve -> hot chamber in soleplate | S4, S5, S3, S6 | High |
| 6 | Water flashes to steam almost immediately on hot soleplate; steam leaves via holes | S4 ("almost immediately", ports in soleplate), S3, S6 | High |
| 7 | Heat + steam relax fabric fibres so pressing flattens wrinkles | S3, S6 | Medium-High |
| 8 | First electric iron patent 1882 (Seely); thermostat-controlled irons from the 1920s | S9 (patent 6 Jun 1882; first thermostat iron 1920s), S10 (1882; thermostats common by 1920s) | High (script avoids claiming 1882 iron lacked a thermostat explicitly) |
| 9 | After turning the dial wait for the light to go out before ironing | S7, S8, S11 | High |
| 10 | Set by fabric label; too low a setting on a steam iron gives water drops instead of steam | S7, S8 (label); S7, S8 (water droplets if setting too low) | High (script says "หลายรุ่น") |

## Animation-only (not spoken as a claim)
- Layout (valve above a groove in the soleplate, channel and holes underneath) is schematic; real irons vary (S4, S5).
- Bimetal bends away from a contact whose position is set by the dial screw (S2); the strip's drawn direction and the anchor block on the soleplate are illustrative.
- Fibre close-up and wrinkle smoothing are schematic (S3, S6).

## Deliberately omitted (not verified by 2 sources)
- Temperature values (dots/numbers on care labels: S1 only), steam temperature (S6 only), warm-up times (S8 only).
- Capacitor across the contacts (S1 only); tilt/auto-shut-off features (S6 only, model dependent).
