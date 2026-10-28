# facts-toaster — เครื่องปิ้งขนมปัง (ยังไงนะ)

Sources (S#): S1 NZASE Background Article Toaster (https://nzase.org.nz/wp-content/uploads/2025/10/NZASE-Background-Article-Toaster.pdf) · S2 Restarters wiki "Toasters" (https://wiki.restarters.net/Toasters) · S3 Answer Me This podcast (https://answermethispodcast.com/2014/07/01/toaster-latching-mystery/) · S4 US patent 5,094,154 background (https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/5094154) · S5 snact.co.uk (https://snact.co.uk/how-does-a-toaster-work/) · S6 Straight Dope (https://www.straightdope.com/21343258/is-poking-a-knife-into-the-toaster-really-dangerous) · S7 HSE Blog (https://www.hseblog.com/toaster-safety/) · S8 Philips toaster manual (https://www.documents.philips.com/assets/20210504/6dd7f9a3d2b041c3af14ad1e00d096d4.pdf) · S9 Wikipedia Charles Strite (https://en.wikipedia.org/wiki/Charles_Strite) · S10 North Loop history (https://northloop.org/about/history/the-greatest-invention-for-sliced-bread/)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Strite saw burnt toast served in his workplace cafeteria, so invented an auto-stopping toaster (~100+ yrs ago; invented 1919, patented 1921) | S9, S10 | High (S10 gives 1919; both give 1921 patent) |
| 2 | Pressing the lever lowers the carriage/tray, stretches a spring, closes the circuit | S1 (lever stretches spring, locks tray, closes circuit), S5 (wedge pushes two contact points together), S2 (lever closes main switch contacts) | High |
| 3 | Heating wire is nichrome (nickel-chromium) wound on mica; high resistance turns current to heat; glows red | S1, S5, S6 (mica insulates coils) | High |
| 4 | Wire radiates infrared at bread; bread held by grills off the wire | S1, S5 (radiates infrared heat) | High |
| 5 | Browning = Maillard reaction (sugars + proteins) | S1; Wikipedia Toaster meta text via sciencesite https://sites.google.com/view/sciencesite-joseph7366/toaster | High |
| 6 | Modern toasters: electromagnet holds lever down, powered with the element; grips a small metal plate on the carriage | S1, S2, S3 | High |
| 7 | Timer is (in typical models) a small electronic circuit board that powers the magnet for the time set by the browning control | S3, S2 (types: clockwork, 4000-series IC, microcontroller), S1 | Medium-High: varies by model, script says "รุ่นทั่วไป" |
| 8 | Timer ends -> magnet current cut -> magnetism stops -> spring raises the carriage | S3, S1, S2 | High |
| 9 | Unplugged: lever will not stay down because the electromagnet has no power | S3, S2 ("ไม่ latch"), S1 | High |
| 10 | Older toasters: bimetallic strip near toast bends when hot, closes a contact, a small electromagnet/solenoid releases the catch/latch | S2, S4 (prior art: bimetallic sensor -> solenoid releases carriage) | High (older/some models) |
| 11 | Stuck bread: unplug, let cool; never use knife/fork/metal (damages elements; shock/short risk) | S8 (unplug, cool, no metal, may damage elements), S6, S7 (shock/short circuit) | High |
| 12 | Empty crumb tray often: accumulated crumbs can ignite / fire risk | S8, S7 (also S2: crumbs interfere with pop-up) | High |

## Animation-only (not spoken as a claim)
- Heating wire circuit is drawn serpentine around a mica sheet; end-view inset shows wires either side of the slice (S1, S5, S2: elements on either side of slots).
- Contacts closing via a wedge on the carriage (S5); elements go dark when the carriage rises after the timer ends — medium confidence as to exact order in every model (S1: timer cuts current; S5: contacts open when the bread rises).
- Browning dial drawn as a knob feeding the timer chip (S2, S3).

## Deliberately left vague / omitted
- Element temperature: S1 says nichrome "can reach about 1,400 C"; no second source and not the actual operating temperature -> omitted.
- Toasting time / wattage / current: vary widely by model; only S2 gives a 750 W example -> omitted.
- Maillard threshold (~140 C, S1 only) -> omitted.
- "Colder start = darker toast" and "higher dial = ..." (S1 only, bimetal models) -> omitted.
- Alan MacMasters hoax (S1 only) -> omitted.
- Exact year of Strite's invention vs patent: stated as "กว่าหนึ่งร้อยปีก่อน" only.
- Not every toaster uses an electromagnet; the script says "รุ่นสมัยใหม่/รุ่นทั่วไป" and mentions older bimetal/latch designs.
- howstuffworks.com pages (toaster.htm, toaster3.htm) surfaced in search but returned empty content to the fetch tool, so were NOT used as sources.
