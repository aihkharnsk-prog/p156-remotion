# facts-arclighter — ไฟแช็กอาร์คไฟฟ้า USB (ยังไงนะ)

Sources (S#): S1 The Tools Trunk, How do arc lighters work (https://thetoolstrunk.com/how-do-arc-lighters-work/) · S2 USPTO patent 12535211 electric arc lighter (https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12535211; PDF unreadable via fetch, only the abstract-level description seen) · S3 ElectroNoobs arc/flyback tutorial (https://www.electronoobs.com/eng_circuitos_tut8.php; listed in results, not fetched) · S4 textbook: dielectric strength of dry air about 3 kV/mm (3 MV/m)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Internal Li-ion battery gives about 3-5 V (script: "ราวสามถึงสี่โวลต์"), far too low to jump an air gap | S1 | High |
| 2 | An oscillator/switching circuit chops the DC into a fast on/off waveform feeding a transformer primary ("นับพันครั้งต่อวินาที" is illustrative; typical switching is tens of kHz) | S1, S2 (boost converter + transformer/coil) | Medium-High (exact frequency not stated in sources; "นับพัน" is a safe lower bound) |
| 3 | Secondary coil has many more turns, steps voltage up (and current down; no added power) | S1, standard transformer physics | High |
| 4 | Dry air breaks down at roughly 3 kV/mm; script says "ประมาณสามพันโวลต์ต่อมิลลิเมตร" | S4 | Medium-High (varies with humidity, electrode shape, pressure) |
| 5 | Breakdown: electrons accelerate, collide, ionise air in a cascade; the channel becomes conductive plasma, visible as a purple-white spark | S1 ("ionizes, becomes a conductive plasma channel"), S4 | High |
| 6 | Arc heats a small spot; it can ignite a candle wick or tinder placed in it; no gas, butane or flame inside the lighter | S1 | High |
| 7 | Wind does not extinguish an arc the way it blows out a flame; heat is concentrated, so it suits small targets, poorly suits broad/damp/thick ones | S1 (windproof advantage; narrow spot, poor on broad/damp/thick material) | Medium-High ("ลมไม่ได้เป่าดับเหมือนเปลวไฟ": strong wind can still bend the arc, script does not claim it is immune) |
| 8 | Safety: contact with live tips gives a painful shock; keep away from flammables | S1 | High |
| 9 | Safety extras in script: keep away from children, do not use near gas leaks/flammables, engage the lock switch on models that have one | General manufacturer-style cautions (S1 partially) | Medium (model-dependent; script says "รุ่นที่มีสวิตช์ล็อก") |
| 10 | Nudge: Li-ion cells lose capacity with charge cycles, so fewer lights per charge over time | General Li-ion behaviour (see facts-watch S9/S10) | High |

Animation notes: transformer turn counts (4 vs 16), the 3.7 V label and electrode gap are illustrative. The "หลายพันโวลต์" label is deliberately not a number. S1 states about 20,000 V at the tips; that figure comes from one non-technical page and varies by model, so it is NOT used.

Safety wording: no instructions on how to touch, probe or modify the arc; the hand/leak icons are prohibition signs only.

Not used because unverified: specific voltage or arc temperature, plasma temperature numbers, pacemaker interference, battery cycle counts for these lighters, auto-shutoff timing.
