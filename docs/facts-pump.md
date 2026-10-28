# facts-pump — ปั๊มน้ำถังแรงดัน (ยังไงนะ)

แหล่งที่ใช้ (อ่านเนื้อหาจริงทั้งหมด):
- [CLEM] https://hgic.clemson.edu/factsheet/residential-drinking-water-well-well-components-1st-in-series/
- [FWS1] https://www.freshwatersystems.com/blogs/blog/how-to-check-your-well-tanks-pressure
- [FWS2] https://www.freshwatersystems.com/blogs/blog/well-pressure-tank-problems-and-how-to-fix-them
- [PENT] https://www.pentair.com/content/dam/extranet/web/nam/sta-rite/manuals/psp973-prosource-plus-steel-pressure-tanks-iom.pdf (คู่มือถังเหล็ก Sta-Rite)
- [INSP1] https://inspectapedia.com/water/Water_Tanks.php
- [INSP2] https://inspectapedia.com/water/Water-Tank-Bladder-Pressure-Adjustment-FAQs.php
- [BOSH] https://support.boshart.com/adjusting-the-pre-charge-pressure-of-a-captive-air-bladder-or-diaphragm-type-tank
- [WM] https://www.watson-marlow.com/en/support/pump-principles/centrifugal-pumps/
- [EMG] https://theengineeringmindset.com/?p=6933
- [DEPP] https://www.deppmann.com/?p=23237
- [VOL] https://en.wikipedia.org/wiki/Volute_(pump) (+ NPTEL https://archive.nptel.ac.in/content/storage2/courses/112104117/chapter_8/8_3.html)
- [PWC] https://intercom.help/privatewellclassorg/en/articles/8926795-how-does-my-private-well-system-work

| # | ข้อความในสคริปต์ | แหล่งที่มา | ความมั่นใจ |
|---|---|---|---|
| 1 | ปั๊มในระบบถังแรงดันไม่ได้เดินตลอด: เดินเมื่อแรงดันตกต่ำกว่าค่าตัดเข้า และหยุดเมื่อแรงดันถึงค่าตัดออก | CLEM ("runs only when pressure falls below the switch's low setting... until the tank reaches the high setting"), PWC, FWS1 | สูง |
| 2 | ใบพัดรับน้ำที่ตรงกลาง (ตา/eye) แล้วเหวี่ยงออกด้านนอกด้วยแรงเหวี่ยงหนีศูนย์กลาง | WM ("thrown to the outside of the impeller by centrifugal force"), EMG, DEPP | สูง |
| 3 | น้ำที่ออกจากใบพัดมีพลังงานจลน์/ความเร็วสูง ถูกเก็บเข้าห้องก้นหอย (volute) ที่ช่องกว้างขึ้นไปทางท่อออก แล้วส่งเข้าท่อ | VOL ("curved funnel that increases in area as it approaches the discharge port"; "collects fluid leaving the impeller, which has high kinetic energy"), NPTEL, WM, EMG | สูง |
| 4 | น้ำถูกส่งเข้าถังแรงดัน ลมในถังแยกจากน้ำด้วยแผ่นยาง (diaphragm) หรือถุงยาง (bladder); น้ำเข้าแล้วลมถูกอัด แรงดันสูงขึ้น | FWS1 ("air chamber separated from the water by a rubber diaphragm... composite tanks use an air bladder... trapped air compresses and pressure rises"), PENT (น้ำเข้าอัดอากาศจนถึงค่าตัดออก), INSP2 | สูง |
| 5 | สวิตช์แรงดันตัดไฟปั๊มเมื่อแรงดันถึงค่าตัดออกที่ตั้งไว้ และต่อไฟเมื่อแรงดันตกถึงค่าตัดเข้า | PWC ("cycle your pump on and off when the pressure goes below or above pre-set levels"), CLEM, INSP1, FWS1 | สูง |
| 6 | ค่าตัวอย่าง 30/50 psi (ตัดเข้า/ตัดออก) เป็นค่าที่พบบ่อย; ยังมี 20/40, 40/60 ตามรุ่น | CLEM (ตัวอย่าง 30/50; ช่วงทั่วไป 20-40, 30-50, 40-60), FWS1 ("30/50 most common"), PWC (ตัวอย่าง 30/60), INSP1 | สูง (ใช้เป็น "ตัวอย่าง" เท่านั้น) |
| 7 | วาล์วกันกลับป้องกันน้ำไหลย้อนกลับลงบ่อ | CLEM ("A check valve prevents water from flowing back into the well"), FWS2 (ถ้าเสีย น้ำไหลย้อนลงบ่อ ถังว่าง ปั๊มเดินแทบตลอด) | สูง |
| 8 | เปิดก๊อกตอนปั๊มหยุด: ลมที่ถูกอัดดันน้ำออกจากถัง แรงดันค่อยๆ ลดลงจนถึงค่าตัดเข้า | PENT ("compressed air forces water out of the cell"), FWS1 ("as you draw water, pressure falls until it reaches the cut-on point, and the pump restarts"), INSP2 | สูง |
| 9 | ถังแรงดันช่วยลดจำนวนครั้งที่ปั๊มเปิด-ปิด (ลด short cycling) ทำให้ถนอมปั๊ม | FWS2 ("preserves the life of the well pump by decreasing the number of times the pump must turn on and off"), INSP1 ("cushion effect prevents short-cycling"), CLEM (ถังเก็บน้ำชั่วคราว ปั๊มไม่ต้องเดินทุกครั้งที่เปิดก๊อก) | สูง |
| 10 | (ข้อเท็จจริงน่าสนใจ) ถังมีวาล์วเติมลมแบบเดียวกับยางรถยนต์ ลมต้องเติมไว้ล่วงหน้า | PENT (วาล์วลมใช้แกนวาล์วชนิดเดียวกับยางรถยนต์ไร้ยางใน, "set pre-charge with NO WATER in tank"), FWS1 (ใช้เกจแบบยางรถวัดที่วาล์ว Schrader) | สูง (ตำแหน่งวาล์ว "ด้านบน" ตามถังเหล็ก; FWS1 ระบุถังคอมโพสิตอยู่ใกล้ฐาน — ภาพวาดเป็นถังเหล็กแบบแผ่นยาง) |
| 11 | ตอนเช็กลมต้องปิดไฟปั๊มและระบายน้ำจากถังจนหมดก่อนวัดที่วาล์ว | PENT (ปิดไฟ, เปิดก๊อกระบายถังให้หมด, วัดด้วยเกจยางรถ), FWS1, INSP2 ("pump turned off and all water pressure relieved"), BOSH | สูง |
| 12 | ลมล่วงหน้ามักตั้งต่ำกว่าค่าตัดเข้าราว 2 psi (ตัวอย่าง 30/50 → 28 psi) | PENT ("2 PSI below pump cut-in"), FWS1 (ตาราง 20/40=18, 30/50=28, 40/60=38), INSP2 ("2 psi below the cut-in") | สูง แต่ BOSH แย้งว่า 40/60 ควรต่ำกว่า 5-6 psi (และ 10-20%) จึงพูดว่า "ราว" และ "ยึดคู่มือถังของคุณเป็นหลัก" |

## ภาพในฉาก (สิ่งที่คำนวณ/ตั้งใจให้ตรง)

- ปริมาตรน้ำในถังคำนวณจากกฎของบอยล์ด้วยแรงดันสัมบูรณ์ (ลมล่วงหน้า 28 psi เกจ, ความดันบรรยากาศ 14.7 psi): ที่ 30 psi น้ำราว 4.5% ของปริมาตรถัง, ที่ 50 psi ราว 34% — ภาพวาดตามสัดส่วนนี้ (เป็นการคำนวณของเรา ไม่ใช่ตัวเลขจากแหล่ง แต่เป็นฟิสิกส์พื้นฐาน)
- ใบพัดหมุนตามเข็มนาฬิกา ท่อออกอยู่ที่ปลายก้นหอยในทิศสัมผัส ใบพัดโค้งไปทางหลัง — เป็นการวาดสอดคล้องกับทิศการไหล
- ตัวเลขบนจอ "ตัวอย่างตั้งไว้ 30 / 50 psi" ระบุชัดว่าเป็นตัวอย่าง

## สิ่งที่ตั้งใจพูดคลุม/ไม่พูด และเหตุผล

- **ตัวเลขความดันของรุ่นใดรุ่นหนึ่ง / ขนาดถัง / ปริมาตรที่ใช้ได้ต่อรอบ (drawdown)**: ไม่พูด ตารางของ Pentair ไม่ปรากฏในข้อความที่อ่านได้ และต่างกันตามรุ่น
- **"ก้นหอยทำให้น้ำช้าลงและความดันสูงขึ้น"**: ไม่พูด แหล่งขัดกัน — EMG/NPTEL ว่าช่องกว้างขึ้นทำให้ความเร็วลดแรงดันเพิ่ม แต่ Wikipedia (Volute) ว่า volute ไม่ได้แปลงพลังงานจลน์เป็นความดัน (เป็นหน้าที่ของ diffuser) จึงพูดแค่ "ช่องกว้างขึ้นไปทางท่อออก รวบน้ำส่งเข้าท่อ"
- **ชนิดปั๊ม**: ภาพเป็นแผนผังปั๊มหอยโข่งขั้นเดียวแบบพื้นฐาน; ปั๊มบ่อบาดาลแบบจุ่ม ปั๊มเจ็ต ปั๊มหลายใบพัด ต่างกัน ไม่ได้อ้างว่าเป็นรุ่นใด ทางน้ำเข้าตรงกลางวาดเป็นท่อจากด้านล่างเพื่อให้เห็นง่าย (จริงเข้าตรงแนวแกนใบพัด)
- **ตำแหน่งวาล์วกันกลับ**: ในภาพอยู่หลังปั๊ม ในระบบจริงอาจอยู่ในบ่อ/ที่ปั๊ม/ก่อนถัง (FWS2 ว่าอยู่ก้นบ่อ) — พูดแค่หน้าที่ ไม่พูดตำแหน่ง
- **กลไกภายในสวิตช์แรงดัน (สปริง ปรับค่า)**: ภาพวาดเป็นเพียงลูกสูบดันก้านให้หน้าสัมผัสเปิด/ต่อ ไม่ได้อธิบายสปริงหรือการปรับค่า (แหล่งที่อ่านไม่ได้อธิบายกลไก)
- **ช่วงเวลาปั๊มเดิน vs ก๊อกเปิด (กราฟ)**: กราฟเลื่อนขึ้นเร็วกว่าลง เพื่อสื่อว่าปั๊มเติมเร็วกว่าที่ใช้ ไม่ได้อ้างจังหวะเวลาจริง (ไม่มีตัวเลขในแหล่ง); ฟันเลื่อยเป็นภาพประกอบหลักการ
- **ระยะเวลาที่ปั๊มดับติดดับติดจนพัง / อายุปั๊ม**: ไม่ระบุตัวเลข พูดแค่ "ลดจำนวนครั้งที่เปิดปิด และถนอมอายุปั๊ม"
- **ปั๊มดูดอากาศไม่ได้/ต้องล่อน้ำ (priming)**: ไม่พูดในคลิป (แหล่งหลักเป็นเว็บผู้ผลิต/ขายปั๊ม ไม่ครบสองแหล่งอิสระที่ตรงกัน) แม้ WM กับ allpumps จะกล่าวคล้ายกัน
- **ระบบความถี่แปรผัน (VFD / constant-pressure)**: ไม่พูด PENT ระบุว่าตั้งลมล่วงหน้าต่างออกไปสำหรับระบบนี้ (70% ของแรงดันใช้งาน) — คลิปจำกัดเฉพาะระบบสวิตช์แรงดันแบบ cut-in/cut-out
- **ขั้นตอนความปลอดภัยเกินเรื่องปิดไฟ**: ไม่ลงรายละเอียดขั้นตอนเติมลม/คอมเพรสเซอร์ แนะให้ยึดคู่มือถัง
- **ภาพ "ลมอัดสีแดงขึ้น" / อนุภาคลม / ขนาดสัดส่วนชิ้นส่วน**: เป็นภาพประกอบ ไม่ใช่สัดส่วนจริง
- **หน่วย**: พูดว่า "ปอนด์ต่อตารางนิ้ว" (psi) ตามหน่วยที่แหล่งข้อมูลใช้; ไม่แปลงเป็นบาร์/กก./ตร.ซม.
- แหล่งข้อมูลส่วนใหญ่เป็นของสหรัฐฯ (ระบบบ่อน้ำส่วนตัว) — คลิปไม่อ้างว่าเป็นมาตรฐานไทย
