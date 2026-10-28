# facts-fan — พัดลมไฟฟ้า (ยังไงนะ)

แหล่งที่ใช้ (อ่านจริงทั้งหมดในรอบนี้):
- [BRIT-CIM] https://www.britannica.com/technology/electric-motor/Capacitor-induction-motor
- [E4U] https://www.electrical4u.com/types-of-single-phase-induction-motor/
- [WIKI-IM] https://en.wikipedia.org/wiki/Induction_motor (อ่านผ่านมิเรอร์ ipfs.ssi.eecc.de/ipns/en.wikipedia-on-ipfs.org/wiki/Induction_motor)
- [WIKI-PSC] บทความ "Permanent split capacitor" (อ่านผ่านมิเรอร์ bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq.ipfs.4everland.io/wiki/Permanent_split_capacitor.html)
- [NIDEC] https://www.nidec.com/en/technology/motor/basic/00026/ (หลักการหมุน); คำพูดของ Nidec เรื่อง capacitor "advance the phase ... about 90°" อ่านผ่านกระทู้ https://physicsforums.com/threads/how-does-a-permanent-capacitor-motor-actually-work.1079701 [PF]
- [VED] https://www.vedantu.com/physics/fan-capacitor
- [PAT-4737701] https://patents.google.com/patent/US4737701 (มอเตอร์ PSC พัดลม หลายความเร็ว ผ่านจุดต่อบนขดลวด)
- [SENT] https://sentera.eu/en/faq/g/how-to-control-ceiling-fans-with-3-speed-motor/522
- [PAT-1517169] https://patents.google.com/patent/US1517169 (พัดลมส่าย: เฟืองตัวหนอน + ล้อเฟือง + แขนหมุน + ก้านต่อ)
- [PAT-2041921] https://patents.google.com/patent/US2041921A/en (พัดลมส่าย: เฟืองตัวหนอนสองชั้น + แขนหมุน + ก้านต่อ)
- [BRIT-KIDS] https://kids.britannica.com/students/article/electric-fan/274264
- [BRIT-AX] https://britannica.com/technology/axial-flow-fan
- [PF-BLADE] https://www.physicsforums.com/threads/how-fans-move-air-propeller-vs-blade-shape.770337/post-4849046 และ [PITCH] https://goodwindco.in/blog/fan-pitch/ (แหล่งรอง ใช้เสริม)
- [DOE] https://webarchive.library.unt.edu/web/20161227070401/https://energy.gov/energysaver/fans-cooling (สำเนาหน้า energy.gov ปี 2016)
- [12NEWS] https://12news.com/article/news/verify/weather-verify/ceiling-fan-running-while-away-from-home-will-not-save-electricity-power-bill-energy-will-not-cool-home/536-40d3f101-e932-45fe-986d-186ab3c4e94b (อ้าง UF/IFAS, DOE, Energy Vanguard)
- [SYD] https://sydney.edu.au/news-opinion/news/2015/11/20/study-heats-up-debate-about-electric-fans.html
- [CBE] https://cbe-berkeley.gitbook.io/thermal-comfort-tool/documentation/fans-heatwaves
- [SCIN] https://sciencenews.org/?p=3145392 และ [POPSCI] https://popsci.com/fans-heat-waves-humidity-science (ใช้เสริมเรื่องกลไกการระเหย)
- [MT] https://www.muangthai.co.th/en/article/health/fix-electric-fan-not-spin
- [MAN] https://mayer.sg/cdn/shop/files/MFD310_Instruction_Manual.pdf (คู่มือพัดลมรุ่นหนึ่ง: ถอดปลั๊กก่อนทำความสะอาด/ซ่อม)

| # | ข้อความในสคริปต์/ภาพ | แหล่งที่มา | ความมั่นใจ |
|---|---|---|---|
| 1 | พัดลมในบ้านทั่วไปหลายรุ่นใช้มอเตอร์เหนี่ยวนำเฟสเดียว (แบบมีตัวเก็บประจุ ฯลฯ) | E4U ("PSC commonly used in fans and blowers"), WIKI-IM ("single-phase induction motors ... household appliances like fans"), WIKI-PSC (PSC ใช้กับ blowers/fans/pumps), PAT-4737701 (ตัวอย่างพัดลม PSC) | สูง (คลิปพูด "หลายรุ่น" ไม่อ้างว่าทุกรุ่น; พัดลมแบบ DC/brushless ก็มี) |
| 2 | โครงสร้าง: ขดลวดสเตเตอร์อยู่กับที่ ล้อมโรเตอร์ซึ่งติดแกน | NIDEC, WIKI-IM, BRIT-CIM | สูง |
| 3 | ไฟบ้านเฟสเดียวมีขดลวดชุดเดียว → สนามไม่ใช่แบบหมุน/ต้องมีวงจรช่วยให้มีสนามหมุน | E4U ("the magnetic field produced is not a rotating type"), WIKI-IM ("single phase induction motor requires separate starting circuitry to provide a rotating field") | สูง |
| 4 | ขดลวดชุดที่สองต่อผ่านตัวเก็บประจุ ทำให้กระแสนำหน้าชุดหลัก "ราว/เกือบ 90°" เกิดสนามหมุน | BRIT-CIM ("lead ... by approximately 90°"), E4U ("almost 90°"), PF (อ้าง Nidec "about 90°"), VED (phase difference → rotating field) | สูง |
| 5 | สนามหมุนเหนี่ยวนำกระแสในโรเตอร์ เกิดแรงดึงให้โรเตอร์หมุนตามสนาม | NIDEC (4 ขั้นตอน), WIKI-IM, PF | สูง |
| 6 | โรเตอร์หมุนช้ากว่าสนามเล็กน้อยเสมอ (slip) | WIKI-IM ("always operates slightly slower than synchronous speed"), PF (โรเตอร์หมุนช้ากว่าสนามเล็กน้อย), PAT-4737701 (กล่าวถึง slip) | สูง |
| 7 | ใบพัดเอียงเป็นมุม ดันอากาศไปข้างหน้า (พัดลมแกนตรง: อากาศไหลตามแนวแกน) | BRIT-KIDS (ใบพัดสร้างความดันดันอากาศ, ชนิด axial = ตามแกน), BRIT-AX (อากาศผ่านโดยไม่เปลี่ยนระยะจากแกน), PF-BLADE (มุมเอียงทำให้ดันไปข้างหน้า), PITCH (มุมใบกำหนดปริมาณลม) | กลาง-สูง (อธิบายง่ายๆ ไม่พูดเรื่องแรงยก/ตัวเลข) |
| 8 | ปุ่มเลือกแรงลมของพัดลมหลายรุ่น = สวิตช์เลือกจุดต่อไฟบนขดลวด; ปรับฟลักซ์ → slip/ความเร็วเปลี่ยน | PAT-4737701 (selector switch เลือก tap; "speed control of a PSC motor ... adjusting the flux ... changing the slip"), SENT (สวิตช์ 3 ระดับต่อไฟเข้าจุดต่างกันบนขดลวด) | กลาง-สูง (สองแหล่งขัดกันว่า tap อยู่ที่ขดช่วยหรือขดหลัก → คลิปไม่ระบุ; ภาพเป็นแผนผังกลางๆ) |
| 9 | กลไกส่ายหน้า: เฟืองตัวหนอนทดรอบ → แขนหมุน (crank) → ก้านต่อ ผลักหัวพัดลมให้ส่าย | PAT-1517169 (worm → worm wheel → crank plate → connecting rod), PAT-2041921 (worm → worm wheel → crank → link, ปรับมุมส่ายได้) | กลาง (สิทธิบัตรเก่า 2 ฉบับตรงกัน คลิปพูด "หลายรุ่น"; ไม่ยืนยันกับรุ่นขายจริงปัจจุบัน; ในภาพมุมส่ายคำนวณจากกลไกก้านต่อในแผนผัง ไม่ใช่ค่าจริงของรุ่นใด) |
| 10 | พัดลมไม่ได้ทำให้อากาศ/ห้องเย็นลง; เย็นเพราะ wind chill / ช่วยเหงื่อระเหยพาความร้อนจากผิว | DOE ("fans cool people, not rooms, by creating a wind chill effect"), 12NEWS (อ้าง UF/IFAS "ceiling fans do not actually lower the temperature of a room"), SYD (ลมเพิ่มการระเหยของเหงื่อ), CBE (evaporative cooling), SCIN, POPSCI | สูง |
| 11 | ปิดพัดลมเมื่อไม่มีคนอยู่ (เปิดทิ้งไว้ห้องไม่เย็นขึ้น) | DOE ("Turn off ceiling fans when you leave a room"), 12NEWS (DOE: "turn off ceiling fans when you leave a room"; ห้องว่างไม่เย็นขึ้น) | สูง |
| 12 | ถอดปลั๊กก่อนทำความสะอาด/ซ่อมพัดลม | MT (unplug before checking/repair), MAN (คู่มือผู้ผลิต: unplug before cleaning/servicing) | สูง |
| 13 | ตัวเก็บประจุในภาพ: ตำแหน่งบนตัวเรือน ฯลฯ | VED (หน้าที่), BRIT-CIM | กลาง (เป็นแผนผัง ตำแหน่งจริงต่างกันตามรุ่น) |

## สิ่งที่ตั้งใจพูดคลุม/ไม่พูด และเหตุผล

- **ความเร็วรอบจริง/ค่า slip จริง/ค่า µF**: ไม่พูด (VED ให้ 1.5–4 µF เฉพาะพัดลมเพดาน, PAT-4737701 ให้ ~350 rpm เฉพาะพัดลมเพดานรุ่นตัวอย่าง; รุ่นอื่นต่างกัน) ภาพหมุน "ช้ากว่าจริงมาก" และสัดส่วนโรเตอร์/สนามวาดเกินจริง ใส่ป้ายกำกับในภาพ
- **จำนวนขั้ว/โครงขดลวดจริง**: ภาพใช้แผนผังสองขดลวดตั้งฉากกัน (หลัก + ช่วย) เพื่อสื่อหลักการ มอเตอร์จริงเป็นขดลวดกระจายในร่องและจำนวนขั้วต่างกัน
- **มอเตอร์แบบ shaded-pole**: ไม่พูด (WIKI-IM/E4U ว่าใช้ในพัดลมเล็ก/ตั้งโต๊ะ แต่หลักการเริ่มหมุนต่างจากแบบตัวเก็บประจุ) คลิปพูดว่า "หลายรุ่น" เพื่อไม่อ้างว่าทุกรุ่นเป็นแบบตัวเก็บประจุ
- **พัดลม DC/brushless/ปรับความเร็วด้วยอิเล็กทรอนิกส์**: ไม่พูด (ไม่ใช่หัวข้อคลิป); เรื่องปุ่มปรับแรงลมพูดเฉพาะ "หลายรุ่น" แบบเลือกจุดต่อ
- **tap อยู่บนขดหลักหรือขดช่วย**: แหล่งขัดกัน (PAT-4737701: ขดช่วย; SENT: ขดหลัก/ขดช่วยต่อเข้าจุดต่างกัน) → ไม่ระบุ; ภาพไม่แสดงความยาวขดลวดที่ใช้งานแต่ละระดับ
- **ตัวเลขอุณหภูมิที่พัดลมช่วย/ย้อนผล** (33 °C, 35 °C, 40 °C ฯลฯ): ไม่พูด แหล่งต่างกันและยังโต้แย้ง (SCIN/JAMA 2024 ผู้สูงอายุที่ 36 °C ไม่ได้ผล; SYD เห็นประโยชน์ที่ 42 °C ในชายหนุ่มสุขภาพดี; POPSCI ความร้อนแห้งแย่ลง; CBE: WHO 2024 ใช้เฉพาะต่ำกว่า 40 °C) คลิปพูดเฉพาะกลไกพื้นฐาน
- **มอเตอร์พัดลมปล่อยความร้อนทำให้ห้องอุ่นขึ้นเล็กน้อย**: มีแหล่งเดียวทางอ้อม (12NEWS อ้าง Energy Vanguard) → ไม่พูด (ใช้คำว่า "ไม่ได้ทำให้อากาศเย็นลง" ไม่ใช่ "เท่าเดิม" ในเสียง; ภาพเทอร์โมมิเตอร์ใช้คำว่า "ไม่ได้ลดลง")
- **ประหยัดค่าไฟเท่าไร / ทิศหมุนใบพัดเพดาน / ปรับเทอร์โมสตัท 4°F**: ไม่พูด
- **อาการ "ต้องใช้มือช่วยดันใบพัดถึงหมุน" = ตัวเก็บประจุเสื่อม**: MT ระบุเป็นหนึ่งในหลายสาเหตุ (ฝุ่น/บูชสึก/มอเตอร์เสีย) จึงไม่นำมาเป็นคำแนะนำในคลิป
- **ประวัติ/ผู้ประดิษฐ์พัดลมไฟฟ้า, ยี่ห้อ, รุ่น**: ไม่พูด (BRIT-KIDS ไม่ระบุ และไม่ได้ตรวจแหล่งอื่น)
- **ทิศการหมุนของสนาม/โรเตอร์ในภาพ**: เลือกหนึ่งทิศให้ภาพสอดคล้อง (PF: สลับขั้วขดที่ผ่านตัวเก็บประจุทำให้หมุนกลับทิศ) ไม่ใช่ข้อเท็จจริงของรุ่นใด
- **คำศัพท์ไทย**: สเตเตอร์ โรเตอร์ ตัวเก็บประจุ กระแสเหนี่ยวนำ เฟืองตัวหนอน (worm gear) ก้านต่อ — ใช้ตามที่ใช้กันทั่วไป ไม่ได้ตรวจกับพจนานุกรมศัพท์วิศวกรรมฉบับทางการ
