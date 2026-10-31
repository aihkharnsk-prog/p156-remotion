# facts-solar — ไฟโซลาร์เซลล์ปักสนาม (ยังไงนะ)

Sources (S#): S1 WikiEducator "How Solar Yard Lights Work" (https://wikieducator.org/How_Solar_Yard_Lights_Work) · S2 US patent US10847992B2 solar pathway light (https://patents.google.com/patent/US10847992) · S3 Gardening Beyond "How Do Solar Garden Lights Work" (https://gardeningbeyond.com/?p=11265) · S4 All About Circuits thread "Solar panel as darkness detector" (https://forum.allaboutcircuits.com/threads/solar-panel-as-darkness-detector.103120/page-2) · S5 eTechnophiles "How an LDR works" (https://www.etechnophiles.com/ldr-working-how-an-ldr-or-photoresistor-works) · S6 Lehigh ELI "Generating Electricity with Photovoltaic Cells" (https://eli.lehigh.edu/learners/solar/solar-page-4) · S7 Lumetro "Solar garden lights battery life" (https://www.lumetrolight.com/article/solar-powered-garden-lights-battery-life-how-long-does-it-last.html) · S8 Spheral Solar "Why your solar lights keep dying" (https://spheralsolar.com/why-your-solar-lights-keep-dying-and-how-to-fix-them-yourself-4/) · S9 Spheral Solar "Why solar lights glow yellow" (https://spheralsolar.com/?p=11979) · S10 Linkind "How to fix solar lights" (https://www.linkind.com/blog/post/how-to-fix-solar-lights-a-step-by-step-guide) · S11 Wikiwand/Wikipedia "NiMH" (https://wikiwand.com/en/NiMH)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Four parts: PV panel, rechargeable battery, darkness-sensing circuit, LED (plus switch and weatherproof housing in the drawing) | S1, S2, S3 | High |
| 2 | Daytime: sunlight on the cell makes current; two silicon layers (n and p) form an electric field; photon energy frees electrons which the field pushes through the external circuit (photovoltaic effect) | S6 (layers, field, photons, current in wire), S1 (cells produce power in sunlight) | High (script says "สนามไฟฟ้า", no junction/band-gap detail) |
| 3 | Charge current goes through a diode into the battery; the diode is a one-way path | S1, S2 (PN junction/bypass diode "prevents the solar panel discharging the battery"), S3 | High |
| 4 | At night the panel makes no power and the diode stops the battery's current flowing back into the panel | S1 ("prevents the battery's current from flowing back through the solar cell at night"), S3 ("stops the battery feeding back into the panel after dark") | High |
| 5 | Many designs use a photoresistor (LDR); resistance low in light, high in dark; circuit reads it to decide day/night | S1, S3 ("many designs use a photoresistor"), S5 (resistance inversely related to light) | High (script says "หลายรุ่น") |
| 6 | Some (cheaper) designs have no separate sensor; the panel's voltage dropping near zero is the dusk signal | S3 ("watching the panel's voltage drop; when panel output falls near zero, the driver enables the LEDs"), S2 (IC senses panel current vs low-light threshold), S4 (forum designs use panel voltage/leakage, no threshold value given) | Medium (S3 is a blog; S2/S4 support the principle; script says "บางรุ่น") |
| 7 | When dark the circuit connects the battery to the LED (through the switch) so the LED lights | S1 (3-transistor circuit turns on LED when photoresistor indicates darkness), S2 (illumination mode enables discharging switch) | High |
| 8 | Small battery has limited stored energy; LED draws current the whole time it is on; light stops when the battery is empty | S1 (700 mAh NiCd cell, LED ~45 mA, ~15 h from full), S7 (common cells ~600 mAh; 8-10 h ideal) | High for the principle; no hours are spoken because figures vary by model |
| 9 | Cloud, dust/dirt on the panel, or shade lowers panel output, battery charges less, so the light runs shorter | S1 (battery reaches max charge "except ... heavy overcast"), S7 (dirty panel charges at a fraction; partial shade can cut absorption up to 50%; cloudy day ~4-6 h), S8 (dust can block up to 25%), S10 (50-70%) | High (no percentages spoken: sources disagree) |
| 10 | Rechargeable battery ages: capacity falls with repeated charge/use; many lights need a new battery every few years | S7 (NiMH 2-3 y, Li-ion 3-5 y, overall 2-4 y), S8 (NiMH/NiCd typically 1-3 y), S10 (replace NiMH about every 2 y), S11 (finite cycle life, 180-2000 cycles by design) | Medium-High (script says "ทุกไม่กี่ปี"; mechanism "capacity gradually drops" is general battery knowledge, S11) |
| 11 | Rain/humidity: worn seals let water in, which corrodes battery terminals/connections | S8 (seals and gaskets wear; water damages circuitry; corrosion at battery terminals), S9, S10 (cracked seals let moisture corrode circuitry) | High |
| 12 | UV/sun yellows or clouds the panel's plastic cover, so less light reaches the cells | S9 (UV main culprit of yellowing, cloudy cover lowers charging efficiency), S8 (UV degrades the protective coating, less efficient) | Medium-High ("บ้านเราแดดแรง" is context only) |
| 13 | Nudge: comparing how long the light lasts on a sunny day's night now vs when new gives a hint about battery/panel condition | Inference from #9-#12 (not a sourced claim; panel soiling/yellowing could also be the cause, so the script says "แบตกับแผง" together) | Inference, flagged |

## Animation-only (not spoken as a claim)
- Layout (panel on top, diode beside circuit, LDR under a small window, battery, switch, LED in a diffuser dome) is schematic; real lights vary (S1, S2).
- Cell cross-section (n layer, p layer, photons, electrons, field) is schematic (S6).
- Voltmeter needle and LDR slider are qualitative; no real values.
- Battery capacity "dashed outline vs smaller fill", water level, corrosion dots, yellow cover, cloud, dust and branch shadow are illustrative.
- The two bars in the final comparison card (new vs now) are illustrative and carry no numbers.

## Deliberately omitted (not verified by 2 sources or sources disagree)
- Battery chemistry specifics (NiMH 1.2 V, mAh figures, cell counts), hours of light per night, percentages of loss from dust/shade, exact replacement interval.
- LED lifespan figure (S7 only).
- Which designs use which sensing method (market share unknown).
- Specific circuit ICs (e.g. QX5252) and voltage thresholds.
