# facts-anceartbuds — หูฟังบลูทูธตัดเสียงรบกวน ANC (ยังไงนะ)

Facts only. No brand names. Real products mix feedforward/feedback/hybrid designs; the script describes the common principle.

Sources (S#): S1 Avantree "How does active noise cancelling work in earbuds" (https://avantree.com/blogs/knowledge/how-does-active-noise-cancelling-work-in-earbuds, vendor article; its dB and percentage figures are NOT used) · S2 BGR "Why wireless earbuds may not last as long as you think" (https://bgr.com/2133558/how-long-wireless-earbuds-last/) · S3 Battery University BU-808 (https://batteryuniversity.com/article/how-to-prolong-lithium-based-batteries) · standard acoustics / signal processing for superposition

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Sound is a pressure wave of air alternating compression and rarefaction | general physics | High |
| 2 | Outward-facing microphones pick up ambient noise (feedforward) | S1 | High |
| 3 | A processor/DSP analyses the signal and generates an inverted-phase "anti-noise" wave with matching amplitude | S1 | High |
| 4 | The speaker plays the anti-noise; at the ear the two waves cancel (destructive interference, superposition) and little remains | S1, general physics | High |
| 5 | Timing is critical: if the anti-noise is late or phase is wrong, cancellation fails and it can even add (script: "ดังขึ้นได้") | S1 (phase and timing; example 300 Hz needs a 1.67 ms half-period), general physics | High (qualitative); "ระดับมิลลิวินาที" in the cue name is qualitative |
| 6 | Music is played through the same speaker, added to the anti-noise; the music is not part of the noise signal so it is not cancelled | general ANC design | Medium-High |
| 7 | An inner (feedback) microphone listens to what remains in the ear canal and the chip adjusts; hybrid ANC combines both | S1 | High (script: "หูฟังหลายรุ่น") |
| 8 | Works best on steady low-frequency sound (engine, air conditioning, traffic rumble); effective mainly below about 1 kHz | S1 | Medium-High (vendor article; "เสียงต่ำที่สม่ำเสมอ" only, no numbers said) |
| 9 | Sudden sounds (claps) are harder because adaptation takes time; high-frequency sound is also harder | S1 | Medium-High |
| 10 | The ear tip's physical seal blocks higher-frequency sound passively | general acoustics (S1 mentions only mics/DSP) | Medium |
| 11 | ANC uses power; earbuds have small Li-ion cells that wear out with cycles; ANC and similar modes shorten runtime and lead to more cycles; typical lifespan about 1-3 years in S2 (not stated in script) | S2, S3 | High (cycles/aging), Medium (ANC drain magnitude) |
| 12 | Nudge: one earbud running out sooner than the other, or much sooner than before, suggests an aging cell (reasoning; usage asymmetry such as one-sided use or a failing cell both possible) | S2, S3 (aging), reasoning | Medium |

Animation notes: waveforms are sine-wave illustrations; the earbud cross-section, chip, and timeline are schematic. The frequency chart shows a qualitative shape, not measured attenuation.

Not used because unverified: dB reductions (S1 says up to 20-25 dB), "speech reduced 30-50%", "dust reduces accuracy 40%", DSP latency numbers per chip class, any vendor-specific algorithm names, battery lifespan numbers.
