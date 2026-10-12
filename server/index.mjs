import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs/promises";
import { promisify } from "node:util";
const execFileP = promisify(execFile);
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.RENDER_API_KEY || "";
const DATA_DIR = process.env.DATA_DIR || "/data";
const PUBLIC_BASE_URL = (
  process.env.PUBLIC_BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "")
).replace(/\/$/, "");
const CONCURRENCY = Number(process.env.RENDER_CONCURRENCY || 2);
const KEEP_DAYS = Number(process.env.KEEP_DAYS || 7);

const OUT_DIR = path.join(DATA_DIR, "out");
const ASSET_DIR = path.join(DATA_DIR, "assets");
await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(ASSET_DIR, { recursive: true });

// ---------- bundle Remotion project once (background) ----------
let serveUrl = null;
const bundleReady = bundle({
  entryPoint: path.join(__dirname, "..", "src", "index.ts"),
  publicDir: path.join(__dirname, "..", "public"),
}).then((url) => {
  serveUrl = url;
  console.log("[remotion] bundle ready");
});
bundleReady.catch((e) => console.error("[remotion] bundle failed", e));

// ---------- job queue (one render at a time) ----------
const jobs = new Map();
const queue = [];
let busy = false;

function publicVideoUrl(id) {
  return `${PUBLIC_BASE_URL}/videos/${id}.mp4`;
}

async function postWebhook(url, payload) {
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log(`[webhook] ${payload.status} -> ${res.status}`);
  } catch (e) {
    console.error("[webhook] failed", e);
  }
}

const MAX_CLIP_BYTES = Number(process.env.MAX_CLIP_MB || 300) * 1024 * 1024;

async function downloadTo(url, dest, maxBytes = 0) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download ${res.status}: ${url}`);
  // กัน volume เต็มจากไฟล์ใหญ่เกินไป (ตรวจจาก content-length ถ้าเซิร์ฟเวอร์ต้นทางส่งมา)
  const len = Number(res.headers.get("content-length") || 0);
  if (maxBytes > 0 && len > maxBytes) {
    throw new Error(`file too large (${Math.round(len / 1024 / 1024)} MB > ${Math.round(maxBytes / 1024 / 1024)} MB)`);
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

const MAX_IMAGE_BYTES = Number(process.env.MAX_IMAGE_MB || 30) * 1024 * 1024;
const IMAGE_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

// โหลดภาพมาเก็บครั้งเดียว แล้วคืนชื่อไฟล์ — กันลิงก์ที่ตอบภาพต่างกันทุกครั้ง (เช่น รูปสุ่ม)
// ไม่ให้ภาพสลับ/กระพริบระหว่างเรนเดอร์ เพราะ Chrome ขอภาพซ้ำหลายรอบ
async function downloadImage(url, destDir, baseName) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download ${res.status}: ${url}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = IMAGE_EXT[type];
  if (!ext) throw new Error(`unsupported content-type "${type || "unknown"}"`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_IMAGE_BYTES) {
    throw new Error(`image too large (${Math.round(len / 1024 / 1024)} MB)`);
  }
  const name = `${baseName}${ext}`;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path.join(destDir, name)));
  return name;
}

async function ttsToFile(text, destPath, tts) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set on the server");
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${tts.voice_id}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: (tts.prefix ? tts.prefix + " " : "") + text,
        model_id: tts.model_id || "eleven_v4",
        voice_settings: { stability: tts.stability ?? 0.8, speed: tts.speed ?? 0.95 },
        seed: 42,
      }),
    }
  );
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  await fs.writeFile(destPath, Buffer.from(await r.arrayBuffer()));
}

// เสียงก้อนเดียวทั้งบท + เวลาต่อตัวอักษร (with-timestamps) → หาเวลาเริ่มของแต่ละท่อน
async function ttsSingleWithTimes(says, rawPath, tts) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set on the server");
  const full = (tts.prefix ? tts.prefix + " " : "") + says.join(" ");
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${tts.voice_id}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: full,
        model_id: tts.model_id || "eleven_v4",
        voice_settings: { stability: tts.stability ?? 0.8, speed: tts.speed ?? 0.95 },
        seed: 42,
      }),
    }
  );
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  if (!j.audio_base64) throw new Error("ElevenLabs: no audio in response");
  await fs.writeFile(rawPath, Buffer.from(j.audio_base64, "base64"));
  const al = j.alignment || j.normalized_alignment;
  if (!al || !Array.isArray(al.characters)) throw new Error("ElevenLabs: no alignment in response");
  const chars = al.characters;
  const st = al.character_start_times_seconds;
  const en = al.character_end_times_seconds;
  const idx = [];
  let compact = "";
  chars.forEach((c, i) => {
    if (!/\s/.test(c)) {
      idx.push(i);
      compact += c;
    }
  });
  let cursor = 0;
  const starts = [];
  for (const sy of says) {
    const cs = sy.replace(/\s+/g, "");
    let f = compact.indexOf(cs, cursor);
    if (f < 0) f = compact.indexOf(cs.slice(0, 8), cursor);
    if (f < 0) throw new Error(`alignment: cannot locate "${sy.slice(0, 20)}"`);
    starts.push(st[idx[f]]);
    cursor = f + cs.length;
  }
  starts[0] = 0; // ท่อนแรกเริ่มที่ต้นเสียง
  return { starts, endAll: en[en.length - 1] };
}

async function runJob(job) {
  job.status = "rendering";
  job.started_at = new Date().toISOString();
  const assetDir = path.join(ASSET_DIR, job.id);
  try {
    await bundleReady;

    const compId = job.request.composition;
    let inputProps;

    if (compId === "DramaStory") {
      // ดาวน์โหลดคลิป/เสียงทุกช็อตมาไว้ในเครื่องก่อน (Drive/CDN ตอน render ไม่เสถียร)
      await fs.mkdir(assetDir, { recursive: true });
      const local = (name) => `http://127.0.0.1:${PORT}/assets/${job.id}/${name}`;
      const shots = [];
      for (const [i, s] of job.request.shots.entries()) {
        const shot = { ...s };
        if (s.video_url) {
          try {
            await downloadTo(s.video_url, path.join(assetDir, `v${i}.mp4`));
            shot.video_url = local(`v${i}.mp4`);
          } catch (e) {
            console.warn(`[job ${job.id}] video ${i} download failed, fallback to image`, e?.message);
            delete shot.video_url;
          }
        }
        if (s.audio_url) {
          await downloadTo(s.audio_url, path.join(assetDir, `a${i}.mp3`));
          shot.audio_url = local(`a${i}.mp3`);
        }
        shots.push(shot);
      }
      inputProps = {
        shots,
        width: job.request.width ?? 1080,
        height: job.request.height ?? 1920,
      };
      if (job.request.music_url) {
        await downloadTo(job.request.music_url, path.join(assetDir, "music.mp3"));
        inputProps.music_url = local("music.mp3");
      }
    } else {
      await fs.mkdir(assetDir, { recursive: true });
      const local = (name) => `http://127.0.0.1:${PORT}/assets/${job.id}/${name}`;

      // ดาวน์โหลดคลิปและภาพของแต่ละสไลด์มาไว้ในเครื่องก่อน (ลิงก์ภายนอกตอน render ไม่เสถียร)
      // คลิปโหลดไม่ได้ → ตัดคลิปทิ้งแล้วใช้ image_url แทน · ภาพโหลดไม่ได้ → ใช้ลิงก์เดิม · แจ้งทั้งสองกรณีใน warnings
      const slides = [];
      for (const [i, s] of job.request.slides.entries()) {
        const slide = { ...s };
        if (s.video_url) {
          try {
            await downloadTo(s.video_url, path.join(assetDir, `sv${i}.mp4`), MAX_CLIP_BYTES);
            slide.video_url = local(`sv${i}.mp4`);
          } catch (e) {
            const msg = `slide ${i}: video download failed (${e?.message || e})`;
            console.warn(`[job ${job.id}] ${msg}`);
            job.warnings.push(msg + (s.image_url ? "; used image_url instead" : "; no image_url, slide will be blank"));
            delete slide.video_url;
          }
        }
        if (s.image_url) {
          try {
            const name = await downloadImage(s.image_url, assetDir, `si${i}`);
            slide.image_url = local(name);
          } catch (e) {
            // โหลดไม่ได้ → ใช้ลิงก์เดิมเหมือนก่อนหน้า (แต่ถ้าลิงก์นั้นตอบภาพไม่คงที่ ภาพอาจกระพริบ)
            const msg = `slide ${i}: image download failed (${e?.message || e}); using the original url`;
            console.warn(`[job ${job.id}] ${msg}`);
            job.warnings.push(msg);
          }
        }
        // เสียงพากย์รายสไลด์: สร้างเสียงจากข้อความ say ของแต่ละสไลด์ → ความยาวสไลด์ตามเสียงจริง
        if (s.say && job.request.tts) {
          await ttsToFile(String(s.say), path.join(assetDir, `sa${i}.mp3`), job.request.tts);
          slide.audio_url = local(`sa${i}.mp3`);
        }
        if (Array.isArray(s.parts) && job.request.tts) {
          const outParts = [];
          for (const [k, p] of s.parts.entries()) {
            const part = { text: String(p.text || ""), duration: 4, say: p.say ? String(p.say) : undefined };
            if (p.say && job.request.tts.mode !== "single") {
              await ttsToFile(String(p.say), path.join(assetDir, `sa${i}_${k}.mp3`), job.request.tts);
              part.audio_url = local(`sa${i}_${k}.mp3`);
            }
            outParts.push(part);
          }
          slide.parts = outParts;
        }
        slides.push(slide);
      }

      inputProps = {
        slides,
        width: job.request.width,
        height: job.request.height,
        fit_audio: job.request.fit_audio,
        caption_style: job.request.caption_style,
        caption_position: job.request.caption_position,
        caption_scale: job.request.caption_scale,
        motion: job.request.motion,
        caption_bottom: job.request.caption_bottom,
        audio_rate: job.request.audio_rate,
        accent_color: job.request.accent_color,
      };

      // โหมดเสียงก้อนเดียว: สร้างเสียงทั้งบทครั้งเดียว (เหมือนไฟล์ที่ฟังอนุมัติ) แล้วตัดซับตามเวลาจริงของแต่ละท่อน
      if (job.request.tts && job.request.tts.mode === "single") {
        const flat = [];
        slides.forEach((sl) => (sl.parts || []).forEach((pt) => flat.push(pt)));
        const says = flat.map((pt) => pt.say).filter(Boolean);
        if (says.length === flat.length && flat.length > 0) {
          const rawPath = path.join(assetDir, "voice-raw.mp3");
          const outPath = path.join(assetDir, "voice.mp3");
          const { starts, endAll } = await ttsSingleWithTimes(says, rawPath, job.request.tts);
          const rate = job.request.audio_rate && job.request.audio_rate > 0 ? job.request.audio_rate : 1;
          if (rate !== 1) {
            await runFfmpeg(["-y", "-i", rawPath, "-filter:a", `atempo=${rate}`, "-codec:a", "libmp3lame", "-q:a", "2", outPath]);
          } else {
            await fs.copyFile(rawPath, outPath);
          }
          const FPS = 30;
          const bounds = starts.map((t) => Math.round((t / rate) * FPS));
          const endFrame = Math.round((endAll / rate + 0.8) * FPS);
          let n = 0;
          for (const sl of slides) {
            if (!sl.parts) continue;
            let total = 0;
            for (const pt of sl.parts) {
              const nextB = n + 1 < bounds.length ? bounds[n + 1] : endFrame;
              const fr = Math.max(1, nextB - bounds[n]);
              pt.duration = fr / FPS;
              delete pt.say;
              total += fr;
              n++;
            }
            sl.duration = total / FPS;
          }
          inputProps.audio_url = local("voice.mp3");
          inputProps.fit_audio = false;
          inputProps.audio_rate = undefined; // เร่งเสียงด้วย ffmpeg ไปแล้ว
          job.warnings.push(`single-pass voice: ${flat.length} parts, ${(endAll / rate).toFixed(1)}s`);
        }
      }

      // ดาวน์โหลดเสียงมาเก็บในเครื่องก่อน (Google Drive redirect ตอน render ไม่เสถียร)
      if (job.request.audio_url) {
        await downloadTo(job.request.audio_url, path.join(assetDir, "voice.mp3"));
        inputProps.audio_url = local("voice.mp3");
      }
    }

    const composition = await selectComposition({
      serveUrl,
      id: compId === "DramaStory" ? "DramaStory" : "DynamicStory",
      inputProps,
    });

    const outputLocation = path.join(OUT_DIR, `${job.id}.mp4`);
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps,
      concurrency: CONCURRENCY,
      onProgress: ({ progress }) => {
        job.progress = Math.round(progress * 100);
      },
    });

    // รูปปก (thumbnail) อัตโนมัติ จาก meta.thumb_* — ถ้าพังไม่ให้งานวิดีโอล้ม
    const tm = job.request.meta?.thumb;
    if (tm && typeof tm === "object") {
      try {
        const thumbProps = {
          image_url: tm.image_url || (job.request.slides || [])[0]?.image_url,
          hook: tm.hook,
          badge: tm.badge,
          sub: tm.sub,
          accent_color: /^#[0-9a-fA-F]{6}$/.test(String(tm.accent_color || "")) ? tm.accent_color : undefined,
          width: Number(tm.width) || 1080,
          height: Number(tm.height) || 1920,
        };
        const tcomp = await selectComposition({ serveUrl, id: "Thumb", inputProps: thumbProps });
        await renderStill({
          composition: tcomp,
          serveUrl,
          output: path.join(OUT_DIR, `${job.id}.jpg`),
          imageFormat: "jpeg",
          jpegQuality: 92,
          inputProps: thumbProps,
        });
        job.thumbnail_url = `${PUBLIC_BASE_URL}/videos/${job.id}.jpg`;
      } catch (e) {
        job.warnings.push(`thumbnail failed: ${String(e?.message || e)}`);
      }
    }

    job.status = "done";
    job.progress = 100;
    job.video_url = publicVideoUrl(job.id);
    job.finished_at = new Date().toISOString();
    await postWebhook(job.request.webhook_url, {
      job_id: job.id,
      status: "done",
      video_url: job.video_url,
      thumbnail_url: job.thumbnail_url ?? null,
      warnings: job.warnings,
      meta: job.request.meta ?? null,
    });
  } catch (e) {
    console.error(`[job ${job.id}] failed`, e);
    job.status = "failed";
    job.error = String(e?.message || e);
    await postWebhook(job.request.webhook_url, {
      job_id: job.id,
      status: "failed",
      error: job.error,
      meta: job.request.meta ?? null,
    });
  } finally {
    fs.rm(assetDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function pump() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  try {
    await runJob(job);
  } finally {
    busy = false;
    pump();
  }
}

// ---------- cleanup old videos ----------
async function cleanup() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000;
  for (const f of await fs.readdir(OUT_DIR).catch(() => [])) {
    const p = path.join(OUT_DIR, f);
    const st = await fs.stat(p).catch(() => null);
    if (st && st.mtimeMs < cutoff) await fs.rm(p, { force: true });
  }
}
cleanup();
setInterval(cleanup, 6 * 3600 * 1000);

// ---------- HTTP ----------
const app = express();
app.use(express.json({ limit: "5mb" }));

// รับได้หลาย key: RENDER_API_KEY (งานเดิม) และ DRAMA_API_KEY (pipeline short drama)
const API_KEYS = [API_KEY, process.env.DRAMA_API_KEY || ""].filter(Boolean);

function auth(req, res, next) {
  if (API_KEYS.length === 0) return res.status(500).json({ error: "RENDER_API_KEY not set on server" });
  if (!API_KEYS.includes(req.get("x-api-key"))) return res.status(401).json({ error: "unauthorized" });
  next();
}

app.get("/health", (_req, res) =>
  res.json({ ok: true, bundle_ready: Boolean(serveUrl), queued: queue.length, busy })
);

// รับไฟล์เสียงแบบ multipart/form-data จาก Make (ไม่ต้องใช้ลิงก์ Drive) -> เก็บเป็น /assets/voice-latest.mp3
app.post("/upload-audio", auth, express.raw({ type: () => true, limit: "40mb" }), async (req, res) => {
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 100) return res.status(400).json({ error: "empty body" });
    const ct = req.get("content-type") || "";
    const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
    let audio = buf;
    if (m) {
      const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
      const start = buf.indexOf(boundary);
      const headEnd = buf.indexOf(Buffer.from("\r\n\r\n"), start);
      if (start < 0 || headEnd < 0) return res.status(400).json({ error: "bad multipart" });
      const dataStart = headEnd + 4;
      const next = buf.indexOf(Buffer.concat([Buffer.from("\r\n"), boundary]), dataStart);
      audio = buf.subarray(dataStart, next < 0 ? buf.length : next);
    }
    await fs.mkdir(ASSET_DIR, { recursive: true });
    await fs.writeFile(path.join(ASSET_DIR, "voice-latest.mp3"), audio);
    res.json({ ok: true, bytes: audio.length, url: PUBLIC_BASE_URL + "/assets/voice-latest.mp3" });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// เร่ง/ผ่อนความเร็วเสียงโดยคงระดับเสียง (ffmpeg atempo) — ใช้ให้ฟังตัวอย่างก่อนเรนเดอร์
// POST /speed-audio?rate=1.25  (body = ไฟล์เสียงดิบ หรือ multipart) -> ตอบกลับเป็น audio/mpeg
const runFfmpeg = (args) =>
  new Promise((resolve, reject) => {
    const tryRun = (cmd, cmdArgs, next) =>
      execFile(cmd, cmdArgs, { cwd: path.join(__dirname, ".."), timeout: 60000 }, (err, _o, stderr) => {
        if (!err) return resolve();
        if (next) return next();
        reject(new Error(`ffmpeg failed: ${String(stderr || err.message).slice(-300)}`));
      });
    tryRun("ffmpeg", args, () =>
      tryRun(path.join(__dirname, "..", "node_modules", ".bin", "remotion"), ["ffmpeg", ...args], null)
    );
  });

app.post("/speed-audio", auth, express.raw({ type: () => true, limit: "40mb" }), async (req, res) => {
  try {
    const rate = Number(req.query.rate);
    if (!(rate >= 0.5 && rate <= 2)) return res.status(400).json({ error: "rate must be 0.5-2" });
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 100) return res.status(400).json({ error: "empty body" });
    const ct = req.get("content-type") || "";
    const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
    let audio = buf;
    if (m) {
      const boundary = Buffer.from("--" + (m[1] || m[2]).trim());
      const start = buf.indexOf(boundary);
      const headEnd = buf.indexOf(Buffer.from("\r\n\r\n"), start);
      if (start < 0 || headEnd < 0) return res.status(400).json({ error: "bad multipart" });
      const dataStart = headEnd + 4;
      const next = buf.indexOf(Buffer.concat([Buffer.from("\r\n"), boundary]), dataStart);
      audio = buf.subarray(dataStart, next < 0 ? buf.length : next);
    }
    const id = randomUUID();
    const inP = path.join(DATA_DIR, `speed-${id}-in.mp3`);
    const outP = path.join(DATA_DIR, `speed-${id}-out.mp3`);
    await fs.writeFile(inP, audio);
    try {
      await runFfmpeg(["-y", "-i", inP, "-filter:a", `atempo=${rate}`, "-codec:a", "libmp3lame", "-q:a", "2", outP]);
      const out = await fs.readFile(outP);
      res.set("Content-Type", "audio/mpeg").send(out);
    } finally {
      fs.rm(inP, { force: true }).catch(() => {});
      fs.rm(outP, { force: true }).catch(() => {});
    }
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.use("/videos", express.static(OUT_DIR));
app.use("/assets", express.static(ASSET_DIR));
// ภาพปิดท้ายที่มีการ์ดจริง (สร้างด้วย POST /outro) ใช้แทนภาพพื้นฐานเมื่อมีแล้ว
const OUTRO_FILE = path.join(ASSET_DIR, "outro-cards.png");
app.get("/brand/outro.png", (req, res, next) => {
  fs.stat(OUTRO_FILE).then(() => res.sendFile(OUTRO_FILE)).catch(() => next());
});
app.use("/brand", express.static(path.join(__dirname, "..", "public")));

app.post("/render", auth, (req, res) => {
  const body = req.body || {};

  const parseArr = (v) => {
    if (typeof v === "string") {
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    }
    return v;
  };

  const composition = body.composition === "DramaStory" ? "DramaStory" : "DynamicStory";
  const clean = [];

  if (composition === "DramaStory") {
    const shots = parseArr(body.shots);
    if (!Array.isArray(shots) || shots.length === 0) {
      return res.status(400).json({ error: "shots must be a non-empty array" });
    }
    for (const [i, s] of shots.entries()) {
      if (!s.video_url && !s.image_url) {
        return res.status(400).json({ error: `shot ${i}: need video_url or image_url` });
      }
      clean.push({
        video_url: s.video_url ? String(s.video_url) : undefined,
        image_url: s.image_url ? String(s.image_url) : undefined,
        audio_url: s.audio_url ? String(s.audio_url) : undefined,
        text: s.text && String(s.text).trim() !== "-" ? String(s.text) : undefined,
        duration: Number(s.duration) > 0 ? Number(s.duration) : 4,
      });
    }
  } else {
    // Make.com บางครั้งส่ง array มาเป็น JSON string — รองรับทั้งสองแบบ
    const slides = parseArr(body.slides);
    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: "slides must be a non-empty array" });
    }
    // ค่าว่าง ("" หรือ null) จาก Make.com ถือว่าไม่ได้ส่งมา
    const optNum = (v) => (v === undefined || v === null || v === "" ? undefined : Number(v));
    for (const [i, s] of slides.entries()) {
      const duration = Number(s.duration);
      if ((!s.image_url && !s.video_url && s.scene !== "sprout") || !(duration > 0)) {
        return res.status(400).json({
          error: `slide ${i}: need image_url or video_url, and duration (seconds) > 0`,
        });
      }
      if (s.video_url && !/^https?:\/\//i.test(String(s.video_url))) {
        return res.status(400).json({ error: `slide ${i}: video_url must start with http:// or https://` });
      }
      const video_start = optNum(s.video_start);
      const video_end = optNum(s.video_end);
      const video_volume = optNum(s.video_volume);
      if (
        (video_start !== undefined && !(video_start >= 0)) ||
        (video_end !== undefined && !(video_end > 0)) ||
        (video_start !== undefined && video_end !== undefined && !(video_end > video_start)) ||
        (video_volume !== undefined && !(video_volume >= 0 && video_volume <= 1))
      ) {
        return res.status(400).json({
          error: `slide ${i}: video_start >= 0, video_end > video_start, video_volume between 0 and 1`,
        });
      }
      clean.push({
        image_url: s.image_url ? String(s.image_url) : undefined,
        video_url: s.video_url ? String(s.video_url) : undefined,
        video_start,
        video_end,
        video_volume,
        video_loop: s.video_loop === true || s.video_loop === "true" || s.video_loop === 1 || s.video_loop === "1",
        image_mode: s.image_mode === "card" || s.image_mode === "detail" || s.image_mode === "art" ? s.image_mode : "fill",
        scene: s.scene === "sprout" ? "sprout" : undefined,
        focus_x: optNum(s.focus_x), focus_y: optNum(s.focus_y), focus_zoom: optNum(s.focus_zoom),
        focus_to_x: optNum(s.focus_to_x), focus_to_y: optNum(s.focus_to_y), focus_to_zoom: optNum(s.focus_to_zoom),
        image_aspect: optNum(s.image_aspect),
        credit: s.credit ? String(s.credit) : undefined,
        text: s.text ? String(s.text) : undefined,
        say: s.say ? String(s.say) : undefined,
        parts: Array.isArray(s.parts)
          ? s.parts.map((p) => ({ text: String(p?.text ?? ""), say: p?.say ? String(p.say) : undefined }))
          : undefined,
        duration,
      });
    }
  }

  // tts: สร้างเสียงพากย์ต่อสไลด์ด้วย ElevenLabs บนเซิร์ฟเวอร์ (ต้องตั้ง ELEVENLABS_API_KEY)
  let tts;
  const ttsIn = parseArr(body.tts);
  if (ttsIn && typeof ttsIn === "object") {
    if (!/^[A-Za-z0-9]{10,40}$/.test(String(ttsIn.voice_id || ""))) {
      return res.status(400).json({ error: "tts.voice_id is missing or invalid" });
    }
    if (!process.env.ELEVENLABS_API_KEY) {
      return res.status(400).json({ error: "server has no ELEVENLABS_API_KEY" });
    }
    tts = {
      voice_id: String(ttsIn.voice_id),
      model_id: ttsIn.model_id ? String(ttsIn.model_id) : undefined,
      stability: Number.isFinite(Number(ttsIn.stability)) && ttsIn.stability !== undefined ? Number(ttsIn.stability) : undefined,
      speed: Number.isFinite(Number(ttsIn.speed)) && ttsIn.speed !== undefined ? Number(ttsIn.speed) : undefined,
      prefix: ttsIn.prefix ? String(ttsIn.prefix).slice(0, 80) : undefined,
      mode: ttsIn.mode === "per_part" ? "per_part" : "single",
    };
  }

  const id = randomUUID();
  const job = {
    id,
    status: "queued",
    progress: 0,
    warnings: [],
    created_at: new Date().toISOString(),
    request: {
      composition,
      slides: composition === "DynamicStory" ? clean : undefined,
      shots: composition === "DramaStory" ? clean : undefined,
      music_url: body.music_url || undefined,
      audio_url: body.audio_url || undefined,
      tts,
      caption_style: body.caption_style === "reel" ? "reel" : "classic",
      caption_position: body.caption_position === "bottom" ? "bottom" : "center",
      motion: body.motion !== undefined && body.motion !== null && body.motion !== "" && Number(body.motion) >= 0 && Number(body.motion) <= 1 ? Number(body.motion) : undefined,
      caption_scale: Number(body.caption_scale) >= 0.3 && Number(body.caption_scale) <= 1.5 ? Number(body.caption_scale) : undefined,
      caption_bottom: body.caption_bottom !== undefined && body.caption_bottom !== null && body.caption_bottom !== "" && Number(body.caption_bottom) >= 0 && Number(body.caption_bottom) <= 0.5 ? Number(body.caption_bottom) : undefined,
      audio_rate: Number(body.audio_rate) >= 0.5 && Number(body.audio_rate) <= 2 ? Number(body.audio_rate) : undefined,
      accent_color: /^#[0-9a-fA-F]{6}$/.test(String(body.accent_color || "")) ? String(body.accent_color) : undefined,
      fit_audio: body.fit_audio === undefined ? true : !(body.fit_audio === false || body.fit_audio === "false" || body.fit_audio === 0),
      webhook_url: body.webhook_url || undefined,
      width: body.width ? Number(body.width) : undefined,
      height: body.height ? Number(body.height) : undefined,
      meta: body.meta,
    },
  };
  jobs.set(id, job);
  queue.push(job);
  pump();
  res.status(202).json({ job_id: id, status: job.status });
});

// สร้างภาพปิดท้ายจากการ์ดจริง -> บันทึกเป็น /brand/outro.png
// POST /outro {cards:[{urls:[url, สำรอง...], art:[x0,y0,x1,y1]}, ...]}
//   art = กรอบรูปบนการ์ด (สัดส่วน 0..1) ถ้ามี จะตัดพื้นหลังให้ตัวละครโผล่ออกมานอกการ์ดแบบ 3D
app.post("/outro", auth, async (req, res) => {
  try {
    const groups = Array.isArray(req.body?.cards) ? req.body.cards.slice(0, 7) : [];
    if (!groups.length) return res.status(400).json({ error: "cards required" });
    const dir = path.join(ASSET_DIR, "outro-src");
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const used = [];
    const failed = [];
    const notes = [];
    const local = (n) => `http://127.0.0.1:${PORT}/assets/outro-src/${n}`;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const urls = (Array.isArray(g) ? g : Array.isArray(g?.urls) ? g.urls : [g]).map(String);
      const art = Array.isArray(g?.art) && g.art.length === 4 ? g.art.map(Number) : null;
      let ok = null;
      for (const u of urls) {
        try {
          ok = { url: u, name: await downloadImage(u, dir, `c${i}`) };
          break;
        } catch (e) {
          failed.push(`${u}: ${String(e?.message || e)}`);
        }
      }
      if (!ok) continue;
      const card = { file: path.join(dir, ok.name) };
      used.push({ url: ok.url, card });
    }
    if (!used.length) return res.status(502).json({ error: "no card image could be downloaded", failed });
    // จัดภาพด้วย Python (การ์ดในเคสอะคริลิก บนพื้นเงาแบบโชว์รูม)
    await execFileP("python3", [
      path.join(__dirname, "outro_compose.py"),
      OUTRO_FILE,
      path.join(__dirname, "..", "public", "fonts"),
      ...used.map((u) => u.card.file),
    ], { timeout: 120000 });
    res.json({
      outro_url: `${PUBLIC_BASE_URL}/brand/outro.png?v=${Date.now()}`,
      used: used.map((u) => u.url),
      failed,
      notes,
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ทำรูปปกอย่างเดียว (ไม่ต้อง render วิดีโอ): POST /thumb {thumb:{...}} หรือ {meta:{thumb:{...}}} -> image/jpeg
app.post("/thumb", auth, async (req, res) => {
  try {
    const tm = req.body?.thumb || req.body?.meta?.thumb;
    if (!tm || typeof tm !== "object") return res.status(400).json({ error: "thumb required" });
    const thumbProps = {
      image_url: tm.image_url,
      hook: tm.hook,
      badge: tm.badge,
      sub: tm.sub,
      accent_color: /^#[0-9a-fA-F]{6}$/.test(String(tm.accent_color || "")) ? tm.accent_color : undefined,
      width: Number(tm.width) || 1080,
      height: Number(tm.height) || 1920,
    };
    const id = `thumb-${Date.now()}`;
    const out = path.join(OUT_DIR, `${id}.jpg`);
    const tcomp = await selectComposition({ serveUrl, id: "Thumb", inputProps: thumbProps });
    await renderStill({ composition: tcomp, serveUrl, output: out, imageFormat: "jpeg", jpegQuality: 92, inputProps: thumbProps });
    res.json({ thumbnail_url: `${PUBLIC_BASE_URL}/videos/${id}.jpg` });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/status/:id", auth, (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "not found" });
  const { request, ...pub } = job;
  res.json(pub);
});

app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
