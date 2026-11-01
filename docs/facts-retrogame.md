# facts-retrogame — เครื่องเกมพกพา 400 เกม (ยังไงนะ)

Facts only. No brand names. These cheap handhelds vary a lot internally, so the script says "บางรุ่น ... บางรุ่น ...".

Sources (S#): S1 Hackaday.io "Dissecting a hand held NOAC console (Sup 400-in-1)" (https://hackaday.io/project/175322-dissecting-a-hand-held-noac-console-sup-400-in-1) · S2 Wikipedia "Famiclone" (https://en.wikipedia.org/wiki/Famiclone) · S3 Hackaday "Teardown: 168-in-1 retro handheld game" (https://hackaday.com/2019/12/09/teardown-168-in-1-retro-handheld-game) · S4 AndroidPCTV "SF3000" (https://androidpctv.com/sf3000-console/) · S5 Orient Display "How does TFT display work" (https://www.orientdisplay.com/knowledge-base/tft-basics/how-does-tft-displays-work) · S6 Kidstoylover listing, 400-game 3-inch handheld (https://www.kidstoylover.com/en-fr/products/retro-mini-handheld-game-console-400-games) · S7 Battery University BU-808 (https://batteryuniversity.com/article/how-to-prolong-lithium-based-batteries) · S8 Pinson & Bazant, SEI formation (https://arxiv.org/pdf/1210.3672)

| # | Claim in script | Source(s) | Confidence |
|---|---|---|---|
| 1 | Games are stored in external flash (a Sup 400-in-1 dump: games in flash chips, custom build fits 8 MB, 16 MB possible) | S1, S3 (128 Mbit NOR flash) | High |
| 2 | Old cartridge games are small; script says "หลักหมื่นถึงหลักแสนไบต์" per game (typical 8-bit-era sizes; S2: NOAC devices store games in internal memory, often 128 KB to several MB for the whole set) | S1, S2 + general knowledge of 8-bit ROM sizes | Medium-High (range is a generalisation) |
| 3 | The main chip imitates an older console: many such handhelds use a "NES-on-a-chip" ASIC that reproduces the console circuitry; S1 says it is not a software emulator | S1, S2 | High |
| 4 | Other handhelds use a general SoC running emulator software (e.g. a MIPS SoC with EmuELEC) | S4 | High |
| 5 | Game = a list of instructions; the chip fetches and executes them one by one, including reading button state | general computing | High |
| 6 | 8-bit-era frame is about 60,000 pixels (256x240 = 61,440 for the NES) and redrawn tens of times a second (60 Hz NTSC / 50 Hz PAL); script says "เกมแปดบิต ... ราวหกหมื่นจุด ... หลายสิบเฟรมต่อวินาที" | general knowledge of NES output | Medium-High (varies by system and region) |
| 7 | Screen is a color TFT LCD; backlight LEDs behind; liquid crystals twist with the electric field to pass more or less light; each pixel has R, G, B sub-pixels | S5 + standard LCD physics (S1 notes the panel controller ids) | High |
| 8 | Sub-pixel mixing example: red + green bright gives yellow | colour theory | High |
| 9 | Buttons: rubber/conductive pads that bridge contacts on the PCB; chip polls them | general (typical keypad construction), not source-specific | Medium |
| 10 | Cheap NOAC chips have graphical glitches / compatibility problems; multicart lists often repeat the same few games under different names | S2 (limitations, repeated/altered games), S6 (listing says some games may repeat) | High |
| 11 | Li-ion cell: ions move between electrodes, electrons do the work outside; capacity fades with cycling as lithium gets locked up (SEI growth) | S7, S8 | High |
| 12 | Nudge: hypothetical numbers (7 h now under 3 h) are labelled as an example on screen; "7 hours" matches the claimed runtime on S6 | S6 | n/a (illustrative) |

Animation notes: the pixel game, memory map (400 cells), instruction list, register names and liquid-crystal rods are schematic; the LCD stack is simplified (one polarizer pair, no TFT layer drawn).

Uncertainty: the script cannot say which of the two chip types (S1/S2 NOAC vs S4 emulator SoC) a given 400-game unit uses, so it says "บางรุ่น". Games on cheap units may also be ROM hacks of the same few titles (S2/S3).
