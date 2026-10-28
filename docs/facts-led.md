# facts-led — หลอดไฟ LED (ยังไงนะ)

แหล่งที่ใช้ (อ่านจริงทั้งหมดผ่าน WebFetch เมื่อ 2026-10-28):
- [NOBEL] https://www.nobelprize.org/prizes/physics/2014/ (คำประกาศรางวัล)
- [SD] https://sciencedaily.com/releases/2014/10/141007071741.htm (ข่าวที่คัดจากราชบัณฑิตยสภาวิทยาศาสตร์สวีเดน/โนเบล)
- [LFW] https://www.laserfocusworld.com/articles/2014/10/shuji-nakamura-two-others-receive-nobel-prize-for-inventing-gan-based-blue-leds.html
- [NIPPON] https://www.nippon.com/en/genre/sci-tech/l00069/
- [LRC] https://www.lrc.rpi.edu/programs/NLPIP/lightingAnswers/pdf/print/LED.pdf (Lighting Research Center, RPI)
- [DOE-T] https://www1.eere.energy.gov/buildings/publications/pdfs/ssl/thermal_led_feb07_2.pdf (US DOE, Thermal Management of White LEDs)
- [DOE-T2] https://cool.culturalheritage.org/byorg/us-doe/thermal_mgt_white_leds.pdf (ฉบับสำเนาของเอกสาร DOE เดียวกัน คนละรุ่น ตัวเลขต่างเล็กน้อย)
- [DOE-S] https://www1.eere.energy.gov/buildings/publications/pdfs/ssl/ssl-overview_brochure_feb2013.pdf (US DOE, SSL overview)
- [LIBRE] https://eng.libretexts.org/Bookshelves/Materials_Science/Supplemental_Modules_(Materials_Science)/Semiconductors/Light_Emitting_Diodes
- [RS] https://uk.rs-online.com/web/content/discovery/ideas-and-advice/led-drivers-guide
- [DASENIC] https://www.dasenic.com/blog/knowledgeHub/what-is-an-electronic-led-driver-how-much-do-you-know
- [CONN] https://connectedmag.com.au/?p=13789
- [HTG] https://www.howtogeek.com/855424/do-led-bulbs-burn-out/
- [1KB] https://blog.1000bulbs.com/home/how-to-choose-bulbs-for-enclosed-fixtures
- [BLDG] https://www.buildings.com/home/article/55259298/led-lamp-life-expectancy-depends-on-fixture-type-and-usage-scenario

| # | ข้อความในสคริปต์ | แหล่งที่มา | ความมั่นใจ |
|---|---|---|---|
| 1 | LED ให้แสงเมื่อมีกระแสไหลผ่านสารกึ่งตัวนำ (ไม่ใช่การเผาไส้หลอดให้ร้อน) | DOE-S ("semi-conducting device that produces light when an electrical current flows through it"), LRC, LIBRE | สูง (คำว่า "ไม่มีไส้หลอดที่ร้อนจนเรืองแสง" อ้างถึงหลอด LED ทั่วไป ไม่ได้ครอบคลุมหลอดดีไซน์ filament-style ที่ใช้ LED เป็นเส้น แต่ก็ไม่ใช่ไส้หลอดร้อน) |
| 2 | หลอดทั่วไปประกอบด้วยไดรเวอร์ + ชิป LED + สารเรืองแสง + ส่วนระบายความร้อน | DOE-S (luminaire = LED packages, driver, heat sinks, optics), LRC (driver, phosphor, heat sink), DOE-T | สูง ("สี่ส่วนหลัก" คือการจัดกลุ่มของคลิป) |
| 3 | ไฟบ้านเป็นไฟสลับ (กระแสกลับทิศ) ส่วน LED ใช้ไฟตรง | RS ("mains typically high-voltage AC ... LEDs need low-voltage DC"; "DC flows in one direction only while AC changes direction"), DASENIC ("AC-DC drivers converts AC to DC") , LRC ("LED ต้องการไฟตรง 2–4 โวลต์" สำหรับ LED ตัวเดี่ยว) | สูง |
| 4 | ไดรเวอร์แปลง AC เป็น DC และควบคุมกระแสที่ไหลผ่านชิป | DASENIC (constant-current design), RS, LRC ("controls the current flowing through the LED") | สูง |
| 5 | ชิป = สารกึ่งตัวนำสองชนิด (n กับ p) ต่อกัน; n มีอิเล็กตรอน, p มีที่ว่างเรียก "โฮล" | LIBRE (p-n junction diode, electron-hole), LRC (electrons from N side, holes from P side) | สูง |
| 6 | เมื่อมีไฟ อิเล็กตรอนกับโฮลถูกดันเข้าหากันที่รอยต่อ รวมกัน (recombine) พลังงานที่เหลือถูกปล่อยเป็นโฟตอน (แสง) | LIBRE ("energy left over is used to emit a photon", forward bias), LRC ("near the junction the electrons and holes combine ... energy is released in the form of light") | สูง (ในภาพ อิเล็กตรอน/โฮลเป็นจุดแทนพาหะ ขนาด/จำนวน/ความเร็วเป็นภาพประกอบ) |
| 7 | ชิป LED สำหรับแสงขาวให้แสงสีน้ำเงิน เคลือบสารเรืองแสงเหลือง: ดูดน้ำเงินบางส่วน ปล่อยเหลือง ที่เหลือผสมกันเป็นขาว | LRC (quote ตรง "some of the blue light will be converted to yellow ... remaining blue ... mixed with yellow ... white"), LFW ("blue LED plus yellow phosphor"), DOE-S ("white LEDs made by coating blue LEDs with phosphor") | สูง (ยังมีหลอดขาวแบบอื่น เช่น RGB — คลิปพูดเฉพาะ "ชิปของหลอดสีขาว" แบบน้ำเงิน+สารเรืองแสง) |
| 8 | ราวสามในสี่ของไฟฟ้าที่ LED ใช้กลายเป็นความร้อน (ราวหนึ่งในสี่เป็นแสง) | DOE-T (เสนอ 15–25% เป็นแสง, ความร้อน 75–85%), DOE-T2 (20–30% เป็นแสง, ความร้อน 70–80%), CONN ("only 15–25% ... converted into visible light") | กลาง-สูง (ตัวเลขต่างตามรุ่น/ปี จึงพูดว่า "ราวสามในสี่" ซึ่งอยู่ในช่วงที่ตรงกันของทุกแหล่ง; ตัวเลขในแถบภาพแสดง 25/75 แบบประมาณ) |
| 9 | ความร้อนต้องถูกนำออกจากชิปผ่านแผงวงจรไปที่ฮีตซิงก์ (หรือโครง/ตัวโคม); LED แทบไม่ปล่อยอินฟราเรด | DOE-T ("must be conducted from the LED die to the underlying circuit board and heat sinks, housings..."; "little or no IR"), DOE-T2, CONN | สูง |
| 10 | ฮีตซิงก์มักมีครีบเพื่อเพิ่มพื้นที่ผิว | DOE-T ("Finned designs increase surface area for heat transfer") | กลาง-สูง (แหล่งเดียวที่อ่านได้ชัดเจน; ใช้คำว่า "มักมี") |
| 11 | LED สีแดงและเขียวมีมานานแล้ว แต่ไม่มีสีน้ำเงินก็ทำหลอดสีขาวไม่ได้ | SD ("Red and green diodes had been around for a long time but without blue light, white lamps could not be created"), NOBEL (คำประกาศ: blue LEDs "enabled bright and energy-saving white light sources"), NIPPON (LED ทำเป็นจำนวนมากได้ถึงสีเขียวเท่านั้น สีน้ำเงินเกินเอื้อม) | สูง (ใช้ประโยคตามความหมายของราชบัณฑิตยสภาฯ) |
| 12 | นักวิจัยพยายามทำ LED สีน้ำเงินอยู่ราวสามสิบปี | SD ("the blue LED had remained a challenge for three decades"), NIPPON (ไทม์ไลน์ 1986–1990s หลังพัฒนา LED มาราวสี่ทศวรรษ) | กลาง-สูง (พูดว่า "ราว") |
| 13 | รางวัลโนเบลสาขาฟิสิกส์ ค.ศ. 2014 มอบให้ Akasaki, Amano, Nakamura "for the invention of efficient blue light-emitting diodes which has enabled bright and energy-saving white light sources" | NOBEL, LFW (ประกาศ 7 ต.ค. 2014), SD | สูง |
| 14 | วัสดุชิปสีน้ำเงินคือแกลเลียมไนไตรด์ | LFW, LIBRE (GaN เป็นตัวอย่าง direct band gap) | สูง (ไม่ได้พูดในคลิปเสียง; ไม่ได้ใช้) |
| 15 | ความร้อนสะสมทำให้วงจรในหลอดเสียเร็ว โดยเฉพาะในโคมปิดมิด | HTG ("culprit is almost always internal circuitry ... overheating"; enclosed space heat "cook the electronics"), 1KB ("repeated LED failures in enclosed fixtures are almost always caused by heat ... wear out the driver"), BLDG (drivers can fail from thermal breakdown), DOE-T (ความร้อนทำให้อายุสั้นลง: Tj +11°C ลดอายุจากราว 37,000 เหลือราว 16,000 ชม. ในการทดสอบนั้น) | สูง (คลิปพูดเชิงคุณภาพ ไม่ใส่ตัวเลข) |
| 16 | ให้ดูข้างกล่องว่า "ใช้กับโคมปิดได้" | 1KB (ผู้ผลิตมักระบุบนกล่อง/สเปก; อย่าสมมติว่า LED ทุกหลอดใช้ได้), BLDG (คำเตือนไม่ให้ใช้หลอดส่วนใหญ่ในโคมปิด) | กลาง-สูง (สองแหล่ง เป็นบทความของผู้ค้า/นิตยสารอุตสาหกรรม ไม่ใช่มาตรฐานทางการ) |

## สิ่งที่ตั้งใจพูดคลุม/ไม่พูด และเหตุผล

- **ตัวเลขอายุหลอด (25,000 ชม. ฯลฯ)** และ "ประหยัดไฟกี่เปอร์เซ็นต์": ไม่พูด ตัวเลขต่างกันตามรุ่น/แหล่ง และเงื่อนไขทดสอบ
- **ค่าประสิทธิภาพ lm/W** (NIPPON บอก 300 lm/W เทียบหลอดไส้ 16): ไม่พูด เป็นค่าห้องแล็บ/อุดมคติ ไม่ใช่หลอดทั่วไป และไม่มีแหล่งที่สองยืนยัน
- **สัดส่วนแสง/ความร้อนที่แน่นอน**: พูดแค่ "ราวสามในสี่" (แหล่งให้ 70–85% ต่างกัน)
- **แรงดันที่ไดรเวอร์ส่งออก**: ไม่พูด (RS ยกตัวอย่าง 12/24 V สำหรับแถบไฟ ไม่ใช่หลอดทั่วไป; LRC 2–4 V ของ LED เดี่ยว)
- **ชนิดวงจรไดรเวอร์ (บริดจ์ไดโอด ตัวเก็บประจุ ฯลฯ)**: ภาพบอร์ดเป็นแผนผังทั่วไป (ตัวเก็บประจุ ไอซี ตัวเหนี่ยวนำ) ไม่ใช่วงจรรุ่นใด คลิปไม่ระบุว่าใช้วงจรแบบไหน (ไดรเวอร์จริงมีหลายแบบ) สโคป AC/DC เป็นภาพแสดงหลักการ ความถี่ในภาพช้ากว่าจริงมาก (จริง 50/60 Hz)
- **ตำแหน่ง/จำนวนชิปในหลอด**: ภาพแสดง 3 แพ็กเกจบนแผงใต้โดมเพื่ออธิบาย หลอดจริงมีหลายแบบ (บางรุ่นใช้ไส้ LED, บางรุ่นใช้ชิปจำนวนมาก)
- **ทิศการไหลของอิเล็กตรอนในลวด**: วาดอิเล็กตรอนไหลออกจากขั้วลบเข้าด้าน n ผ่านชิปแล้วกลับขั้วบวก (ตรงข้ามทิศกระแสตามแบบแผน) ซึ่งเป็นการเคลื่อนที่จริงของอิเล็กตรอน (LRC: อิเล็กตรอนจากด้าน N ไปหาด้าน P)
- **ขนาด/สีของอิเล็กตรอน โฮล โฟตอน อนุภาคสารเรืองแสง**: ภาพประกอบ ไม่ใช่สัดส่วนจริง; โฟตอนที่ถูกเปลี่ยนสีและกระเจิงในภาพเป็นแบบสุ่มเพื่อให้เห็นหลักการ
- **ชื่อสารเรืองแสง (YAG ฯลฯ) และ band gap/ความยาวคลื่น**: ไม่พูด (ไม่มีแหล่งที่ยืนยันสองแหล่งในรอบนี้)
- **สัญชาติของผู้ได้รางวัลโนเบล**: ไม่พูด (แหล่งบางแห่งเขียน "นักวิจัยญี่ปุ่น" แต่ Nakamura ทำงานที่ UCSB) — ในคลิปใช้ "นักวิจัยสามคน"; ชื่อบนภาพเป็นนามสกุลตัวอักษรละติน
- **ปี "ค.ศ. 2014"** ตรงกับ พ.ศ. 2557; คลิปพูดเป็นคริสต์ศักราช
- **คำว่า "ฮีตซิงก์/แอลอีดี/โฮล/เอ็น/พี"**: ทับศัพท์ตามที่ใช้กันทั่วไป ควรเช็กการออกเสียงก่อนอัดเสียงถ้าจริงจัง
