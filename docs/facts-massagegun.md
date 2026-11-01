# facts-massagegun — ปืนนวด (ยังไงนะ)

Sources (S#): S1 US patent grant text "Percussive therapy device with variable amplitude" via trea.com (https://trea.com/information/percussive-therapy-device-with-variable-amplitude/patentgrant/9a30c694-9908-4930-b88f-eb791eae4643) · S2 Ingenia "Lithium-ion batteries" (https://ingenia.org.uk/articles/lithium-ion-batteries/) · S3 Renpho listing "12mm amplitude" (search result only)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Motor rotates an eccentric member; push rod/offset shaft converts rotation to reciprocating motion of a shaft carrying the attachment | S1 | High (patent uses 'eccentric weight, push rod, reciprocating shaft'; script says แขนเยื้องศูนย์/ก้านเชื่อม/แกน, an equivalent slider-crank description) |
| 2 | Stroke = 2x eccentric offset; exemplary 4 mm offset -> 8 mm, 8 mm offset -> 16 mm (S1 says 'only exemplary') | S1 | High for the example; script says 'ตัวอย่างสิทธิบัตรชุดหนึ่ง' |
| 3 | Faster motor = more strikes per minute (one strike per revolution of the crank) | follows from mechanism (S1 gives no RPM) | High (no numbers claimed) |
| 4 | More resistance -> motor draws more current to hold speed (generic DC motor behaviour; not in S1) | general | Medium; real guns vary (some limit/stall) |
| 5 | Head shapes (ball spreads force, pointed concentrates) and 'avoid direct pressure on bones/joints' are common manufacturer guidance | general; not verified from one source | Medium |
| 6 | Li-ion capacity fades with charge cycles; heat accelerates ageing | S2; general | High / Medium-High (heat part) |
| 7 | Nudge: ask whether one full charge lasts as long as when new | n/a | n/a |

Animation notes: crank radius/stroke exaggerated; rotation shown at ~1 rev/s (real guns run tens of strikes per second). Not used: percussions-per-minute figures (no source), stall force, brushless vs brushed.
