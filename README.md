# P-156 Card Story — Remotion Project

โปรเจกต์นี้เรนเดอร์วิดีโอแนวตั้ง (1080×1920) ความยาว ~50 วินาที จากภาพการ์ด P-156
พร้อม Ken Burns pan/zoom และซับไตเติลไทยที่ทยอยขึ้นตามจังหวะ

## รันดูตัวอย่างในเครื่องคุณ (ต้องมี Node.js 18+)

```bash
npm install
npm start
```
จะเปิด Remotion Studio ที่ http://localhost:3000 ให้ preview แบบ real-time
ลาก timeline ดูผลลัพธ์ก่อนเรนเดอร์จริงได้

## เรนเดอร์เป็นไฟล์ .mp4 จริง

```bash
npm run build
```
ไฟล์ผลลัพธ์จะอยู่ที่ `out/p156-story.mp4`

## แก้บทบรรยาย/จังหวะ

แก้ได้ที่ `src/CardStory.tsx` ในตัวแปร `lines` แต่ละบรรทัดมี:
- `meta` — เวลาที่แสดง (แค่ label ไม่ผูกกับ timing จริง)
- `text` — ข้อความซับไตเติล
- `durInFrames` — ความยาวของฉากนั้น หน่วยเป็นเฟรม (30 เฟรม = 1 วินาที)

## ใส่เสียงพากย์จริง (ElevenLabs)

1. Generate เสียงจาก ElevenLabs ตาม pipeline Make.com ที่มีอยู่ (หรือทำแยกก็ได้)
2. เอาไฟล์เสียงที่ได้ (mp3/wav ต่อ segment หรือไฟล์เดียวยาวก็ได้) มาใส่ในโฟลเดอร์ `public/`
3. เพิ่ม `<Audio src={staticFile("voice.mp3")} />` ใน `CardStory.tsx`
4. ปรับ `durInFrames` ของแต่ละ Sequence ให้ตรงกับความยาวเสียงจริงแต่ละท่อน

## Deploy ขึ้น Railway (ให้เรนเดอร์อัตโนมัติผ่าน pipeline)

Railway deploy จาก GitHub repo เป็นหลัก ขั้นตอนคร่าวๆ:
1. Push โฟลเดอร์นี้ขึ้น GitHub repo ของคุณ
2. เชื่อม repo นั้นกับ Railway service ใหม่
3. ตั้ง build command: `npm install`
4. ตั้ง start command หรือใช้ Railway cron/worker เพื่อรัน `npm run build` เมื่อมีคำสั่งเรนเดอร์เข้ามา (เช่น รับ webhook จาก Make.com แล้วรัน render แล้วอัปโหลดผลลัพธ์กลับ)

ถ้าต้องการ ให้บอกได้เลย — ช่วยตั้งค่า Railway service ต่อจากตรงนี้ได้ทันที (มีเครื่องมือเชื่อม Railway โดยตรงในแชทนี้)

---

## Render server (สำหรับต่อกับ Make.com)

`npm start` รันเซิร์ฟเวอร์ที่ `server/index.mjs` (Railway ใช้ Dockerfile อัตโนมัติ)

**Environment variables**
- `RENDER_API_KEY` — รหัสลับที่ Make.com ต้องส่งมาใน header `x-api-key`
- `PUBLIC_BASE_URL` — (ไม่บังคับ) ถ้าไม่ตั้ง จะใช้โดเมนของ Railway (`RAILWAY_PUBLIC_DOMAIN`) อัตโนมัติ
- `DATA_DIR` — โฟลเดอร์เก็บไฟล์ (ผูก Railway Volume ไว้ที่ `/data`)

**POST /render** (header `x-api-key`)
```json
{
  "webhook_url": "https://hook.us2.make.com/...",
  "audio_url": "https://drive.google.com/uc?id=...&export=download",
  "meta": { "title": "ชื่อคลิป", "description": "..." },
  "slides": [
    { "image_url": "https://...", "text": "ซับไตเติล", "duration": 6.5 }
  ]
}
```
ตอบกลับ `202 {job_id}` ทันที → เรนเดอร์เสร็จแล้วเซิร์ฟเวอร์ POST กลับไปที่ `webhook_url`:
`{ job_id, status: "done", video_url, meta }` (หรือ `status: "failed"` พร้อม `error`)

- ค่าเริ่มต้นเป็นวิดีโอแนวนอน 1920×1080 · ส่ง `width: 1080, height: 1920` ถ้าทำ Shorts
- `GET /status/:id` เช็คสถานะ · `GET /health` เช็คว่าเซิร์ฟเวอร์พร้อม
