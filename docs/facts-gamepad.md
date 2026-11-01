# facts-gamepad — จอยเกมไร้สาย (ยังไงนะ)

Facts only. No brand names. Typical designs are described; individual pads differ (some use Hall-effect or other sensors, some lack a gyro or ERM motor).

Sources (S#): S1 Android Central "Here's why the PS5 DualSense joysticks drift" (https://www.androidcentral.com/heres-why-playstation-5-dualsense-controller-joysticks-drift) · S2 Hackaday "Hall sensors offer drop-in replacement for drifting game console joysticks" (https://hackaday.com/2023/05/24/hall-sensors-offer-drop-in-replacement-for-drifting-game-console-joysticks) · S3 MakeTechEasier "How a phone accelerometer works" (https://maketecheasier.com/how-phone-accelerometer-works/) · S4 DigiKey Maker "Wireless gamepad with ESP32 and BLE" (https://www.digikey.com/en/maker/projects/wireless-gamepad-with-esp32-and-ble/501c3cb814f844689d6fdabeaff75171, page text barely usable, only confirms a BLE gamepad prototype)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Buttons: rubber pad with conductive contact bridging PCB pads when pressed | general (typical rubber-dome construction) | Medium-High |
| 2 | Each analog stick uses two potentiometers, one per axis; a wiper slides over a resistive element and the output voltage depends on wiper position | S1 | High |
| 3 | The chip converts the voltage to a number (ADC); the 0-255 range on screen is an example, real pads often use 8-12+ bits | general | Medium-High (example only) |
| 4 | Some triggers use the same kind of analog sensing (potentiometer or Hall); script says "บางรุ่น" | general | Medium |
| 5 | Pairing: devices exchange keys and afterwards accept data only from the paired device | general Bluetooth behaviour | Medium-High |
| 6 | Pad sends short input reports repeatedly over Bluetooth in the 2.4 GHz band, hopping across channels (animation uses 6 lanes for illustration; real Bluetooth has 40 BLE channels / 79 classic) | general Bluetooth knowledge (see also facts-watch S12) | Medium-High |
| 7 | Accelerometer: proof mass on silicon springs, capacitive sensing, gravity gives direction of "down" so tilt can be read | S3 | High |
| 8 | Gyroscope measures rotation rate; integrating it over time gives angle (drifts without correction, not mentioned in the script); sensor-fusion with the accelerometer is not explained | S3 (gyro measures rotation), general | Medium-High |
| 9 | Rumble: a small motor with an off-center (eccentric) weight spins and shakes the pad; script says "มอเตอร์เล็กๆ ที่มีตุ้มน้ำหนักติดเยื้องศูนย์" (some pads use linear resonant actuators instead) | general | Medium-High |
| 10 | Drift causes: wiper wears the resistive strip, debris on the strip, centering spring weakens, plastic variance; once the offset exceeds what the software compensates, the stick drifts | S1, S2 | High |
| 11 | The software tolerates small offsets (dead zone); script says "ซอฟต์แวร์ยอมให้คลาดเคลื่อนเล็กน้อย" (S1 does not use the word dead zone or give a value) | S1 | Medium-High |
| 12 | Hall-effect sticks use a magnet and a sensor with no sliding contact, so the sensing part does not wear; springs/bearings still can (comment note in S2) and extra power draw / calibration needs exist | S2 | High (script: "ส่วนที่ใช้ตรวจจับไม่แตะกัน") |
| 13 | Nudge: if the character moves with the stick released even after recalibrating, the stick is worn and due for replacement (replacement of the stick module/pad) | S1 (calibration setting exists), reasoning | Medium |

Animation notes: stick/potentiometer, packet contents, ADC bits, gyro curve and wear grooves are schematic. Dead-zone band and drift curve are illustrative, not measured.

Not used because unverified: stick lifetime numbers (S1 quotes iFixit < 400 hours of heavy shooter play and a 500,000-cycle rating for one maker's sticks, left out as brand/usage specific); polling/report rate; Bluetooth latency.
