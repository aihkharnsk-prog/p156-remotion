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

// ---------- TikTok ผ่าน Zernio (เดิมชื่อ Late) ----------
const ZERNIO = "https://zernio.com/api/v1";
let tiktokAccountCache = null;
async function zernio(pathname, init = {}) {
  const r = await fetch(ZERNIO + pathname, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.ZERNIO_API_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!r.ok) throw new Error(`zernio ${pathname} ${r.status}: ${typeof body === "string" ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`);
  return body;
}
function findTiktokAccount(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) { for (const x of obj) { const f = findTiktokAccount(x); if (f) return f; } return null; }
  if (String(obj.platform || "").toLowerCase() === "tiktok") return obj.accountId || obj._id || obj.id || null;
  for (const v of Object.values(obj)) { const f = findTiktokAccount(v); if (f) return f; }
  return null;
}
async function tiktokAccountId() {
  if (process.env.ZERNIO_TIKTOK_ACCOUNT_ID) return process.env.ZERNIO_TIKTOK_ACCOUNT_ID;
  if (tiktokAccountCache) return tiktokAccountCache;
  for (const p of ["/accounts", "/accounts/health"]) {
    try {
      const id = findTiktokAccount(await zernio(p));
      if (id) return (tiktokAccountCache = id);
    } catch (e) {
      console.warn("[tiktok] account lookup", p, String(e?.message || e));
    }
  }
  throw new Error("no TikTok account connected in Zernio");
}
// แฮชแท็กจากบรรทัดสุดท้ายของคำอธิบาย (ถ้ามี) — ใช้ได้ทั้งโปเกมอนและวันพีซ
function socialTags(meta = {}) {
  const paras = String(meta.description || "").split("\n\n");
  const last = paras[paras.length - 1] || "";
  const tags = last.trim().startsWith("#") ? last.replace(/#shorts/gi, "").trim() : "#การ์ดโปเกมอน #โปเกมอน #pokemoncards #pokemontcg";
  return `${tags} #การ์ดสะสม #cardzcenter`.replace(/\s+/g, " ").trim();
}
// ประโยคชวนคอมเมนต์ (เปลี่ยนไปตามคลิป ไม่ซ้ำทุกโพสต์) — คอมเมนต์ช่วยให้แพลตฟอร์มดันคลิป
const ENGAGE = [
  "👇 คุณมีการ์ดใบนี้ในคอลเลกชันไหม? คอมเมนต์บอกหน่อย",
  "👇 ทายถูกไหม? คอมเมนต์คำตอบของคุณก่อนดูเฉลย",
  "👇 อยากให้เล่าการ์ดใบไหนต่อ? พิมพ์ชื่อไว้ในคอมเมนต์",
  "👇 แท็กเพื่อนที่สะสมการ์ดใบนี้",
  "👇 ใบนี้ควรค่าแก่การสะสมไหม? ให้คะแนน 1-10 ในคอมเมนต์",
];
function engageLine(title = "") {
  let h = 0;
  for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ENGAGE[h % ENGAGE.length];
}
function tiktokCaption(meta = {}) {
  if (meta.tiktok_caption) return String(meta.tiktok_caption).slice(0, 2200);
  const title = String(meta.title || "").replace(/#shorts/gi, "").trim();
  const first = String(meta.description || "").split("\n\n")[0] || "";
  return [title, engageLine(title), first, "🛒 ซื้อ • ขาย • สะสม • แข่งเกมส์การ์ด ครบจบในเว็บเดียว 👉 www.cardzcenter.com",
    socialTags(meta)]
    .filter(Boolean).join("\n\n").slice(0, 2200);
}
// โพสต์คลิปขึ้น TikTok (ตั้งเวลาได้) — คืนผลจาก Zernio
async function postTikTok(videoUrl, meta = {}, at, draft = false) {
  if (!process.env.ZERNIO_API_KEY) throw new Error("ZERNIO_API_KEY is not set");
  const accountId = await tiktokAccountId();
  const when = !draft && at && Date.parse(at) > Date.now() + 5 * 60 * 1000 ? new Date(at).toISOString() : null;
  const body = {
    content: tiktokCaption(meta),
    mediaItems: [{ type: "video", url: videoUrl }],
    platforms: [{ platform: "tiktok", accountId }],
    tiktokSettings: {
      ...(draft ? { draft: true } : {}),
      privacy_level: "PUBLIC_TO_EVERYONE",
      allow_comment: true,
      allow_duet: false,
      allow_stitch: false,
      video_made_with_ai: true,
      content_preview_confirmed: true,
      express_consent_given: true,
      // เปิดเผยว่าเป็นการโปรโมตแบรนด์ของเราเอง (Your brand) ตามกฎ TikTok — ไม่ใช่โฆษณาจ้าง
      commercialContentType: "brand_organic",
    },
    ...(when ? { scheduledFor: when, timezone: "UTC" } : { publishNow: true }),
  };
  const r = await zernio("/posts", { method: "POST", body: JSON.stringify(body) });
  console.log(`[tiktok] ${draft ? "draft" : when ? "scheduled " + when : "published"} ${videoUrl} -> ${JSON.stringify(r).slice(0, 200)}`);
  return r;
}

// ---------- คิว TikTok แบบร่าง (AK ใส่เสียงเพลงเองในแอปก่อนโพสต์) ----------
// เก็บคิวในไฟล์บน volume: [{file, video_url, at, title, sent_at, post_id}]
const TT_QUEUE = () => path.join(ASSET_DIR, "tiktok-queue.json");
async function readTtQueue() {
  try { return JSON.parse(await fs.readFile(TT_QUEUE(), "utf8")); } catch { return []; }
}
async function writeTtQueue(q) {
  await fs.writeFile(TT_QUEUE(), JSON.stringify(q, null, 1));
}
async function enqueueTiktok(item) {
  const q = await readTtQueue();
  const i = q.findIndex((x) => x.file === item.file && !x.sent_at);
  if (i >= 0) q[i] = { ...q[i], ...item }; else q.push(item);
  q.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  await writeTtQueue(q);
  console.log(`[tiktok-queue] + ${item.file} at ${item.at}`);
}
// ---------- Facebook Page (ผ่าน Zernio) ----------
let facebookAccountCache = null;
// คอมเมนต์แรกใต้โพสต์ Facebook: ชวนเข้าเว็บ (ลิงก์ในคอมเมนต์ไม่ลดการมองเห็นของโพสต์)
const FB_FIRST_COMMENT = "🃏 สะสม • ซื้อ • ขาย • แข่งเกมส์การ์ด โปเกมอน วันพีซ ยูกิโอ และอีกมากมาย\n👉 https://www.cardzcenter.com";
async function facebookAccountId() {
  if (process.env.ZERNIO_FACEBOOK_ACCOUNT_ID) return process.env.ZERNIO_FACEBOOK_ACCOUNT_ID;
  if (facebookAccountCache) return facebookAccountCache;
  const a = await zernio("/accounts");
  const list = Array.isArray(a) ? a : a.accounts || a.data || [];
  const fb = list.find((x) => String(x.platform || "").toLowerCase() === "facebook");
  if (!fb) throw new Error("no Facebook Page connected in Zernio");
  return (facebookAccountCache = fb._id || fb.id || fb.accountId);
}
// โพสต์คลิปขึ้นเพจ Facebook เป็น Reel (ยาวเกิน 60 วิ หรือ Reel ไม่ผ่าน → โพสต์เป็นวิดีโอปกติ)
async function postFacebook(videoUrl, meta = {}, at, durationSec) {
  if (!process.env.ZERNIO_API_KEY) throw new Error("ZERNIO_API_KEY is not set");
  const accountId = await facebookAccountId();
  const when = at && Date.parse(at) > Date.now() + 5 * 60 * 1000 ? new Date(at).toISOString() : null;
  const title = String(meta.title || "").replace(/#shorts/gi, "").trim().slice(0, 100);
  const make = (reel) => ({
    content: tiktokCaption(meta),
    mediaItems: [{ type: "video", url: videoUrl }],
    platforms: [{ platform: "facebook", accountId, platformSpecificData: { ...(reel ? { contentType: "reel", title } : {}), firstComment: FB_FIRST_COMMENT } }],
    ...(when ? { scheduledFor: when, timezone: "UTC" } : { publishNow: true }),
  });
  const reelOk = !(durationSec > 60);
  let r;
  try {
    r = await zernio("/posts", { method: "POST", body: JSON.stringify(make(reelOk)) });
  } catch (e) {
    if (!reelOk) throw e;
    console.warn(`[facebook] reel failed, posting as video: ${String(e?.message || e)}`);
    r = await zernio("/posts", { method: "POST", body: JSON.stringify(make(false)) });
  }
  console.log(`[facebook] ${reelOk ? "reel" : "video"} ${when ? "scheduled " + when : "published"} ${videoUrl} -> ${JSON.stringify(r).slice(0, 200)}`);
  return r;
}

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
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "CardzCenterRenderer/1.0 (+https://www.cardzcenter.com)", Accept: "image/*,*/*;q=0.8" },
  });
  if (!res.ok || !res.body) throw new Error(`download ${res.status}: ${url}`);
  const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  let ext = IMAGE_EXT[type];
  if (!ext && /^(text\/plain|application\/octet-stream|binary\/octet-stream|)$/.test(type)) {
    // บางเว็บ (เช่น supabase storage) ส่ง content-type ผิด → ดูจากหัวไฟล์แทน
    const buf = Buffer.from(await res.arrayBuffer());
    const sig = buf.subarray(0, 12);
    if (sig[0] === 0xff && sig[1] === 0xd8) ext = ".jpg";
    else if (sig.toString("hex", 0, 4) === "89504e47") ext = ".png";
    else if (sig.toString("ascii", 0, 4) === "RIFF" && sig.toString("ascii", 8, 12) === "WEBP") ext = ".webp";
    else if (sig.toString("ascii", 0, 3) === "GIF") ext = ".gif";
    if (!ext) throw new Error(`unsupported content-type "${type || "unknown"}"`);
    if (buf.length > MAX_IMAGE_BYTES) throw new Error(`image too large (${Math.round(buf.length / 1024 / 1024)} MB)`);
    const sniffed = `${baseName}${ext}`;
    await fs.writeFile(path.join(destDir, sniffed), buf);
    return sniffed;
  }
  if (!ext) throw new Error(`unsupported content-type "${type || "unknown"}"`);
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_IMAGE_BYTES) {
    throw new Error(`image too large (${Math.round(len / 1024 / 1024)} MB)`);
  }
  const name = `${baseName}${ext}`;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path.join(destDir, name)));
  return name;
}

async function ttsToFile(text, destPath, tts, raw = false) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set on the server");
  const r = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${tts.voice_id}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: (tts.prefix ? tts.prefix + " " : "") + (raw ? String(text) : fixSay(text)),
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
// แก้คำที่เสียงพากย์อ่านเพี้ยน (ใช้กับเสียงเท่านั้น ซับยังเขียนแบบเดิม)
const SAY_FIX = [[/การ์ด/g, "ก๊าด"], [/เกมส์/g, "เกม"]];
const fixSay = (t) => SAY_FIX.reduce((a, [re, to]) => a.replace(re, to), String(t));
async function ttsSingleWithTimes(says, rawPath, tts) {
  says = says.map(fixSay);
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
        // ภาพชุด (ฉาก evolve / versions / sprite) — ใบไหนโหลดไม่ได้ก็ตัดทิ้ง ไม่ให้งานพัง
        if (Array.isArray(s.images)) {
          const arr = [];
          const labs = [];
          for (const [k, u] of s.images.entries()) {
            try {
              arr.push(local(await downloadImage(u, assetDir, `sx${i}_${k}`)));
              labs.push(Array.isArray(s.labels) ? s.labels[k] ?? "" : "");
            } catch (e) {
              job.warnings.push(`slide ${i}: images[${k}] download failed (${e?.message || e}); skipped`);
            }
          }
          slide.images = arr;
          if (Array.isArray(s.labels)) slide.labels = labs;
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
        theme: job.request.theme,
        badge: job.request.badge,
        series: job.request.series,
      };
      // รูปปกเป็นเฟรมแรก 0.5 วิ (Shorts ใช้เฟรมในคลิปเป็นปก) — ปิดได้ด้วย meta.cover_frame:false
      const ct = job.request.meta?.thumb;
      if (ct && typeof ct === "object" && job.request.meta?.cover_frame !== false) {
        let coverImg = ct.image_url || (job.request.slides || [])[0]?.image_url;
        // ดาวน์โหลดภาพปกมาไว้ในเครื่องด้วย (บางเว็บ เช่น onepiece-cardgame.com บล็อกการโหลดจากเบราว์เซอร์ข้ามเว็บ)
        if (coverImg) {
          try {
            coverImg = local(await downloadImage(coverImg, assetDir, "cover"));
          } catch (e) {
            job.warnings.push(`cover image download failed (${e?.message || e})`);
          }
        }
        job.cover_local = coverImg;
        inputProps.cover = {
          image_url: coverImg,
          hook: ct.hook,
          badge: ct.badge,
          sub: ct.sub,
          accent_color: /^#[0-9a-fA-F]{6}$/.test(String(ct.accent_color || "")) ? ct.accent_color : undefined,
          width: job.request.width || 1080,
          height: job.request.height || 1920,
        };
      }

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
      id: compId === "DramaStory" ? "DramaStory" : compId === "CardShow" ? "CardShow" : "DynamicStory",
      inputProps,
    });

    job.duration_sec = composition.durationInFrames / composition.fps;
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
          image_url: job.cover_local || tm.image_url || (job.request.slides || [])[0]?.image_url,
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
    console.log(`[job ${job.id}] done ${job.video_url}`);
    if (job.request.facebook) {
      try {
        const r = await postFacebook(job.video_url, job.request.meta || {}, job.request.facebook.at, job.duration_sec);
        job.facebook = r?.post?._id || "ok";
      } catch (e) {
        job.warnings.push(`facebook failed: ${String(e?.message || e)}`);
        console.error(`[facebook] job ${job.id} failed`, String(e?.message || e));
      }
    }
    if (job.request.tiktok) {
      try {
        await enqueueTiktok({ file: job.request.meta?.file || job.id, video_url: job.video_url, at: job.request.tiktok.at || new Date().toISOString(), title: String(job.request.meta?.title || "").replace(/#shorts/gi, "").trim(), meta: job.request.meta || {} });
        job.tiktok = "queued";
      } catch (e) {
        job.warnings.push(`tiktok failed: ${String(e?.message || e)}`);
        console.error(`[tiktok] job ${job.id} failed`, String(e?.message || e));
      }
    }
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
// ภาพปิดท้าย: เปลี่ยนการ์ดราคาสูง 5 ใบทุกวัน (เวลาไทย) จาก server/outro_pool.json
// สร้างครั้งแรกที่มีคนขอในวันนั้น แล้วเก็บไว้ใช้ทั้งวัน · POST /outro ใช้เลือกการ์ดเองสำหรับวันนี้
const OUTRO_FILE = path.join(ASSET_DIR, "outro-cards.png");
const OUTRO_POOL = JSON.parse(await fs.readFile(path.join(__dirname, "outro_pool.json"), "utf8"));
const bkkDay = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const dailyFile = (day) => path.join(ASSET_DIR, `outro-${day}.png`);

async function buildOutro(groups, outFile) {
  const dir = path.join(ASSET_DIR, `outro-src-${Date.now()}`);
  await fs.mkdir(dir, { recursive: true });
  const used = [];
  const failed = [];
  try {
    for (let i = 0; i < groups.length && used.length < 5; i++) {
      const g = groups[i];
      const urls = (Array.isArray(g) ? g : Array.isArray(g?.urls) ? g.urls : [g]).map(String);
      for (const u of urls) {
        try {
          const name = await downloadImage(u, dir, `c${i}`);
          used.push({ url: u, file: path.join(dir, name), name: g?.name || u });
          break;
        } catch (e) {
          failed.push(`${u}: ${String(e?.message || e)}`);
        }
      }
    }
    if (!used.length) throw new Error("no card image could be downloaded: " + failed.join(" | "));
    // ใบกลาง (ที่ 3) คือใบที่เด่นที่สุด — สลับให้การ์ดใบแรกของรายการอยู่ตรงกลาง
    const order = used.length >= 3 ? [used[1], used[2], used[0], ...used.slice(3)] : used;
    await execFileP("python3", [
      path.join(__dirname, "outro_compose.py"),
      outFile,
      path.join(__dirname, "..", "public", "fonts"),
      ...order.map((u) => u.file),
    ], { timeout: 120000 });
    console.log(`[outro] ${path.basename(outFile)} used ${used.length}: ${order.map((u) => u.name).join(" | ")}`);
    if (failed.length) console.log(`[outro] failed: ${failed.join(" | ")}`);
    return { used: order.map((u) => u.url), failed };
  } finally {
    fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// เลือกการ์ดประจำวัน: ใบกลางเป็นโปเกมอน + ยูกิโอ + เมจิก + ยูกิโออีกใบ + โปเกมอนอีกใบ หมุนไปทุกวัน
function dailyGroups(day) {
  const n = Math.floor(Date.parse(day + "T00:00:00Z") / 86400000);
  const pick = (arr, k) => arr[((n + k) % arr.length + arr.length) % arr.length];
  const pk = OUTRO_POOL.pokemon, yg = OUTRO_POOL.yugioh, mg = OUTRO_POOL.magic, op = OUTRO_POOL.onepiece;
  // วันพีซไม่ใช้ เพราะรูปจากเว็บทางการมีลายน้ำ SAMPLE
  const main = [pick(pk, 0), pick(yg, 0), pick(mg, 0), pick(yg, 4), pick(pk, 5)];
  // สำรองถ้าบางใบโหลดไม่ได้
  const spare = [pick(pk, 2), pick(yg, 3), pick(pk, 8), pick(yg, 5), pick(mg, 2)];
  return [...main, ...spare];
}

let dailyBuilding = null;
async function ensureDailyOutro() {
  const day = bkkDay();
  const file = dailyFile(day);
  if (await fs.stat(file).then(() => true, () => false)) return file;
  if (!dailyBuilding) {
    dailyBuilding = buildOutro(dailyGroups(day), file)
      .then(async () => {
        // ลบไฟล์ของวันก่อนๆ
        for (const f of await fs.readdir(ASSET_DIR).catch(() => [])) {
          if (/^outro-\d{4}-\d{2}-\d{2}\.png$/.test(f) && f !== path.basename(file)) fs.rm(path.join(ASSET_DIR, f)).catch(() => {});
        }
      })
      .finally(() => (dailyBuilding = null));
  }
  await dailyBuilding;
  return file;
}

app.get("/brand/outro.png", async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-cache");
    res.sendFile(await ensureDailyOutro());
  } catch (e) {
    console.error("[outro] daily build failed", e);
    fs.stat(OUTRO_FILE).then(() => res.sendFile(OUTRO_FILE)).catch(() => next());
  }
});
// ภาพปกเพจ Facebook (1640x624): GET /brand/fb-cover.png (?refresh=1 = สร้างใหม่)
app.get("/brand/fb-cover.png", async (req, res) => {
  const file = path.join(ASSET_DIR, "fb-cover.png");
  try {
    const have = await fs.stat(file).then(() => true, () => false);
    if (!have || req.query.refresh) {
      const pk = OUTRO_POOL.pokemon, yg = OUTRO_POOL.yugioh, mg = OUTRO_POOL.magic;
      const groups = [yg[0], pk[0], pk[1], mg[0], pk[2], yg[1], mg[1]];
      const dir = path.join(ASSET_DIR, `cover-src-${Date.now()}`);
      await fs.mkdir(dir, { recursive: true });
      const files = [];
      for (const [i, g] of groups.entries()) {
        if (files.length >= 4) break;
        for (const u of g.urls || [g]) {
          try { files.push(path.join(dir, await downloadImage(String(u), dir, `c${i}`))); break; } catch (e) {}
        }
      }
      await execFileP("python3", [path.join(__dirname, "fb_cover_compose.py"), file, path.join(__dirname, "..", "public", "fonts"), ...files], { timeout: 120000 });
      fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      console.log(`[fb-cover] built with ${files.length} cards`);
    }
    res.set("Cache-Control", "no-cache");
    res.sendFile(file);
  } catch (e) {
    console.error("[fb-cover] failed", e);
    res.status(500).send(String(e?.message || e));
  }
});
// ปก Facebook แบบอื่น: GET /brand/fb-cover-fan.png | /brand/fb-cover-wall.png (?refresh=1)
app.get("/brand/fb-cover-:style.png", async (req, res) => {
  const style = ["fan", "wall"].includes(req.params.style) ? req.params.style : null;
  if (!style) return res.status(404).send("unknown style");
  const file = path.join(ASSET_DIR, `fb-cover-${style}.png`);
  try {
    const have = await fs.stat(file).then(() => true, () => false);
    if (!have || req.query.refresh) {
      const pk = OUTRO_POOL.pokemon, yg = OUTRO_POOL.yugioh, mg = OUTRO_POOL.magic;
      const groups = style === "fan"
        ? [pk[1], yg[0], pk[0], mg[0], yg[1], pk[2], mg[1]]
        : [pk[0], yg[0], mg[0], pk[1], yg[1], mg[1], pk[2], yg[2], pk[3], mg[2], pk[4], yg[3]];
      const want = style === "fan" ? 5 : 10;
      const dir = path.join(ASSET_DIR, `cover-src-${Date.now()}`);
      await fs.mkdir(dir, { recursive: true });
      const files = [];
      for (const [i, g] of groups.entries()) {
        if (files.length >= want) break;
        for (const u of (g && g.urls) || [g]) {
          try { files.push(path.join(dir, await downloadImage(String(u), dir, `c${i}`))); break; } catch (e) {}
        }
      }
      await execFileP("python3", [path.join(__dirname, "fb_cover_alt.py"), file, path.join(__dirname, "..", "public", "fonts"), style, ...files], { timeout: 120000 });
      fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      console.log(`[fb-cover-${style}] built with ${files.length} cards`);
    }
    res.set("Cache-Control", "no-cache");
    res.sendFile(file);
  } catch (e) {
    console.error(`[fb-cover-${style}] failed`, e);
    res.status(500).send(String(e?.message || e));
  }
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

  const composition = body.composition === "DramaStory" ? "DramaStory" : body.composition === "CardShow" ? "CardShow" : "DynamicStory";
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
      const SCENES = ["sprout", "coin", "evolve", "versions", "sprite"];
      const BEATS = ["hook", "reveal", "card", "name", "stats", "bignum", "quiz", "zoom", "timeline", "art", "still", "coin", "evolve", "versions", "sprite"];
      if ((!s.image_url && !s.video_url && !SCENES.includes(s.scene) && !BEATS.includes(s.beat)) || !(duration > 0)) {
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
        image_mode: ["card", "detail", "art", "still"].includes(s.image_mode) ? s.image_mode : "fill",
        scene: SCENES.includes(s.scene) ? s.scene : undefined,
        images: Array.isArray(s.images) ? s.images.slice(0, 4).map(String) : undefined,
        labels: Array.isArray(s.labels) ? s.labels.slice(0, 4).map(String) : undefined,
        coin: s.coin === "tails" ? "tails" : s.coin === "heads" ? "heads" : undefined,
        no_caption: s.no_caption === true || s.no_caption === "true",
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
        // ฟิลด์ของรูปแบบ CardShow
        beat: BEATS.includes(s.beat) ? s.beat : undefined,
        title: s.title !== undefined ? String(s.title) : undefined,
        subtitle: s.subtitle !== undefined ? String(s.subtitle) : undefined,
        chapter: s.chapter !== undefined ? String(s.chapter) : undefined,
        chips: Array.isArray(s.chips) ? s.chips.slice(0, 5).map((c) => ({ big: String(c?.big ?? ""), small: c?.small !== undefined ? String(c.small) : undefined })) : undefined,
        stats: Array.isArray(s.stats) ? s.stats.slice(0, 5).map((r) => ({ label: String(r?.label ?? ""), value: Number(r?.value) || 0, max: optNum(r?.max), suffix: r?.suffix !== undefined ? String(r.suffix) : undefined })) : undefined,
        value: optNum(s.value),
        from: optNum(s.from),
        choices: Array.isArray(s.choices) ? s.choices.slice(0, 4).map(String) : undefined,
        answer: optNum(s.answer),
        points: Array.isArray(s.points) ? s.points.slice(0, 6).map((q) => ({ year: String(q?.year ?? ""), label: String(q?.label ?? "") })) : undefined,
        transition: ["wipe", "zoom", "flash", "slide", "shutter", "none"].includes(s.transition) ? s.transition : undefined,
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
      slides: composition !== "DramaStory" ? clean : undefined,
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
      theme: ["fire", "grass", "water", "electric", "psychic", "fighting", "normal"].includes(body.theme) ? body.theme : undefined,
      badge: body.badge ? String(body.badge).slice(0, 12) : undefined,
      series: body.series ? String(body.series).slice(0, 40) : undefined,
      width: body.width ? Number(body.width) : undefined,
      height: body.height ? Number(body.height) : undefined,
      meta: body.meta,
      tiktok: body.tiktok ? { at: typeof body.tiktok === "object" && body.tiktok.at ? String(body.tiktok.at) : undefined } : undefined,
      facebook: body.facebook ? { at: typeof body.facebook === "object" && body.facebook.at ? String(body.facebook.at) : undefined } : undefined,
    },
  };
  jobs.set(id, job);
  queue.push(job);
  pump();
  res.status(202).json({ job_id: id, status: job.status });
});

// เลือกการ์ดเองสำหรับวันนี้: POST /outro {cards:[[url, สำรอง...], ...]} (ใบแรก = ใบกลาง)
app.post("/outro", auth, async (req, res) => {
  try {
    const groups = Array.isArray(req.body?.cards) ? req.body.cards.slice(0, 10) : [];
    if (!groups.length) return res.status(400).json({ error: "cards required" });
    const r = await buildOutro(groups, dailyFile(bkkDay()));
    res.json({ outro_url: `${PUBLIC_BASE_URL}/brand/outro.png?v=${Date.now()}`, ...r });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// สั่ง render สคริปต์ที่อยู่ใน examples/ ของ repo เลย (ไม่ต้องส่ง JSON ยาวๆ)
// POST /render-files {files:["pmcg1-004-reel.json", ...], upload:true}
const UPLOAD_HOOK = "https://hook.us2.make.com/kcld4bbtli9t1faceobohsk8wok5biay";
app.post("/render-files", auth, async (req, res) => {
  const out = [];
  for (const f of Array.isArray(req.body?.files) ? req.body.files : []) {
    const name = path.basename(String(typeof f === "object" ? f.file : f));
    try {
      const body = JSON.parse(await fs.readFile(path.join(__dirname, "..", "examples", name), "utf8"));
      if (req.body.upload) body.webhook_url = UPLOAD_HOOK;
      if (body.meta && typeof body.meta === "object") body.meta.file = name;
      if (req.body.tiktok) body.tiktok = { at: (typeof f === "object" && f.tiktok_at) || body.meta?.publish_at };
      if (req.body.facebook) body.facebook = { at: (typeof f === "object" && (f.facebook_at || f.tiktok_at)) || body.meta?.publish_at };
      const r = await fetch(`http://127.0.0.1:${PORT}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": req.get("x-api-key") },
        body: JSON.stringify(body),
      });
      out.push({ file: name, status: r.status, ...(await r.json().catch(() => ({}))) });
    } catch (e) {
      out.push({ file: name, error: String(e?.message || e) });
    }
  }
  console.log(`[render-files] ${JSON.stringify(out)}`);
  res.json(out);
});

// เพิ่มป้าย "Your brand" ให้โพสต์ TikTok ที่ตั้งเวลาไว้แล้ว: POST /tiktok-brand {ids:[...]}
app.post("/tiktok-brand", auth, async (req, res) => {
  const out = [];
  const settings = {
    privacy_level: "PUBLIC_TO_EVERYONE", allow_comment: true, allow_duet: false, allow_stitch: false,
    video_made_with_ai: true, content_preview_confirmed: true, express_consent_given: true,
    commercialContentType: "brand_organic",
  };
  for (const id of Array.isArray(req.body?.ids) ? req.body.ids.map(String) : []) {
    const tries = [];
    let ok = false;
    for (const method of ["PUT", "PATCH"]) {
      try {
        const accountId = await tiktokAccountId();
        const r = await zernio(`/posts/${id}`, { method, body: JSON.stringify({ platforms: [{ platform: "tiktok", accountId }], tiktokSettings: settings }) });
        tries.push(`${method} ok`);
        const after = await zernio(`/posts/${id}`).catch(() => null);
        out.push({ id, ok: true, method, status: after?.post?.status, saved: JSON.stringify(after?.post?.tiktokSettings || after?.post?.platforms?.[0]?.platformSpecificData || r).slice(0, 200) });
        ok = true;
        break;
      } catch (e) {
        tries.push(`${method}: ${String(e?.message || e).slice(0, 160)}`);
      }
    }
    if (!ok) out.push({ id, ok: false, tries });
  }
  console.log(`[tiktok-brand] ${JSON.stringify(out)}`);
  res.json(out);
});

// บันทึกข้อมูลที่ Make ส่งมาลง log (ใช้ตรวจสถานะคลิปบน YouTube): POST /echo
// ตรวจรูปจากเครื่อง Claude ไม่ได้ (เน็ตถูกจำกัด) — ให้ renderer ดึงรูปแล้วย่อเป็น JPEG เล็กๆ พิมพ์ base64 ลง log
// POST /peek {urls:[...], width?:360}  → log "[peek] <i> <part>/<n> <b64>"
// POST /peek-page {url} → log รายการรูปทั้งหมดในหน้าเว็บ (og:image, img src/data-src, alt)
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", accept: "*/*" };
app.post("/peek", auth, async (req, res) => {
  const urls = (req.body.urls || []).slice(0, 8);
  const width = Math.min(Number(req.body.width) || 360, 600);
  res.json({ ok: true, n: urls.length });
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i];
    try {
      const r = await fetch(u, { headers: { ...UA, referer: new URL(u).origin + "/" } });
      const buf = Buffer.from(await r.arrayBuffer());
      const src = path.join(ASSET_DIR, `peek-${i}.bin`);
      const out = path.join(ASSET_DIR, `peek-${i}.jpg`);
      await fs.writeFile(src, buf);
      const crop = Array.isArray(req.body.crop) ? req.body.crop.join(",") : "0,0,1,1";
      const q = String(Number(req.body.quality) || 50);
      await execFileP("python3", ["-c", `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert('RGB')\nW,H=im.size\nc=[float(v) for v in sys.argv[4].split(',')]\nim=im.crop((int(c[0]*W),int(c[1]*H),int(c[2]*W),int(c[3]*H)))\nw=int(sys.argv[3]);h=int(im.height*w/im.width)\nim.resize((w,h)).save(sys.argv[2],quality=int(sys.argv[5]))\nprint(W,H)`, src, out, String(width), crop, q], { timeout: 30000 })
        .then(async ({ stdout }) => {
          const b64 = (await fs.readFile(out)).toString("base64");
          const parts = Math.ceil(b64.length / 6000);
          console.log(`[peek] ${i} meta ${r.status} ${r.headers.get("content-type")} orig ${stdout.trim()} ${u}`);
          for (let p = 0; p < parts; p++) console.log(`[peek] ${i} ${p + 1}/${parts} ${b64.slice(p * 6000, (p + 1) * 6000)}`);
        });
    } catch (e) {
      console.log(`[peek] ${i} error ${String(e.message || e).slice(0, 200)} ${u}`);
    }
  }
});
app.post("/peek-page", auth, async (req, res) => {
  const u = req.body.url;
  res.json({ ok: true });
  try {
    const r = await fetch(u, { headers: UA });
    const html = await r.text();
    const found = [];
    for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)/gi)) found.push(`og ${m[1]}`);
    for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0];
      const s = (tag.match(/\s(?:data-src|data-lazy-src|src)=["']([^"']+)/i) || [])[1];
      const alt = (tag.match(/\salt=["']([^"']*)/i) || [])[1] || "";
      if (s && !s.startsWith("data:")) found.push(`img ${s} | ${alt.slice(0, 80)}`);
    }
    console.log(`[peek-page] ${r.status} ${u} title=${(html.match(/<title>([^<]*)/i) || [])[1] || ""} n=${found.length}`);
    for (const f of found.slice(0, 80)) console.log(`[peek-page] ${f}`);
  } catch (e) {
    console.log(`[peek-page] error ${String(e.message || e).slice(0, 200)} ${u}`);
  }
});

app.post("/echo", auth, (req, res) => {
  console.log(`[echo] ${JSON.stringify(req.body).slice(0, 20000)}`);
  res.json({ ok: true });
});

// ตรวจการเชื่อม TikTok: GET /tiktok-account
app.get("/tiktok-account", auth, async (req, res) => {
  const out = { key: !!process.env.ZERNIO_API_KEY };
  try {
    tiktokAccountCache = null;
    out.accountId = await tiktokAccountId();
    try { out.creator = await zernio(`/accounts/${out.accountId}/tiktok/creator-info`); } catch (e) { out.creator_error = String(e?.message || e); }
  } catch (e) {
    out.error = String(e?.message || e);
  }
  console.log(`[tiktok-account] ${JSON.stringify(out).slice(0, 800)}`);
  res.json(out);
});

// ผูกเพจ Facebook กับ Zernio: GET /fb-connect → ลิงก์ให้เจ้าของเพจกดล็อกอิน Facebook แล้วเลือกเพจ
app.get("/fb-connect", auth, async (req, res) => {
  const out = {};
  try {
    const pr = await zernio("/profiles");
    const list = Array.isArray(pr) ? pr : pr.profiles || pr.data || [];
    out.profiles = list.map((p) => ({ id: p._id || p.id, name: p.name }));
    const profileId = out.profiles[0]?.id;
    const q = new URLSearchParams({ profileId, redirect_url: `${PUBLIC_BASE_URL}/fb-done` });
    const r = await zernio(`/connect/facebook?${q}`);
    out.authUrl = r.authUrl;
  } catch (e) {
    out.error = String(e?.message || e);
  }
  console.log(`[fb-connect] ${JSON.stringify(out).slice(0, 3000)}`);
  res.json(out);
});
app.get("/fb-done", (req, res) => {
  console.log(`[fb-done] ${JSON.stringify(req.query).slice(0, 2000)}`);
  res.set("Content-Type", "text/html; charset=utf-8").send("<h2 style='font-family:sans-serif'>เชื่อมเพจ Facebook เรียบร้อย ปิดหน้านี้ได้เลยครับ</h2>");
});
// ดูบัญชีที่เชื่อมใน Zernio ทั้งหมด: GET /zernio-accounts
app.get("/zernio-accounts", auth, async (req, res) => {
  let out;
  try {
    const a = await zernio("/accounts");
    const list = Array.isArray(a) ? a : a.accounts || a.data || [];
    out = list.map((x) => ({ id: x._id || x.id, platform: x.platform, username: x.username, name: x.displayName || x.name || x.selectedPageName }));
  } catch (e) {
    out = { error: String(e?.message || e) };
  }
  console.log(`[zernio-accounts] ${JSON.stringify(out).slice(0, 3000)}`);
  res.json(out);
});

// ดูสถานะโพสต์ใน Zernio: GET /zernio-post/:id
app.get("/zernio-post/:id", auth, async (req, res) => {
  let out;
  try {
    out = await zernio(`/posts/${encodeURIComponent(req.params.id)}`);
  } catch (e) {
    out = { error: String(e?.message || e) };
  }
  console.log(`[zernio-post] ${req.params.id} ${JSON.stringify(out).slice(0, 4000)}`);
  res.json(out);
});

// ทดสอบการออกเสียง: POST /tts-test {texts:[...]} → /videos/tts-test-<n>.mp3 (เสียงเดียวกับคลิป ไม่แปลงคำ)
app.post("/tts-test", auth, async (req, res) => {
  const tts = { voice_id: "bTEswxYhpv7UDkQg5VRu", model_id: "eleven_v4", stability: 0.8, speed: 1.2, prefix: "[calm, soft, natural storyteller]", ...(req.body?.tts || {}) };
  const out = [];
  for (const [i, t] of (Array.isArray(req.body?.texts) ? req.body.texts.slice(0, 8) : []).entries()) {
    try {
      const name = `tts-test-${i + 1}.mp3`;
      await ttsToFile(String(t), path.join(OUT_DIR, name), tts, true);
      out.push({ text: t, url: `${PUBLIC_BASE_URL}/videos/${name}` });
    } catch (e) {
      out.push({ text: t, error: String(e?.message || e) });
    }
  }
  console.log(`[tts-test] ${JSON.stringify(out)}`);
  res.json(out);
});

// เพิ่มคลิปเข้าคิว TikTok แบบร่าง: POST /tiktok-queue {items:[{file, video_url, at}]}
app.post("/tiktok-queue", auth, async (req, res) => {
  const out = [];
  for (const it of Array.isArray(req.body?.items) ? req.body.items : []) {
    try {
      const file = path.basename(String(it.file));
      const meta = JSON.parse(await fs.readFile(path.join(__dirname, "..", "examples", file), "utf8")).meta || {};
      await enqueueTiktok({ file, video_url: String(it.video_url), at: String(it.at), title: String(meta.title || "").replace(/#shorts/gi, "").trim(), meta });
      out.push({ file, queued: it.at });
    } catch (e) {
      out.push({ file: it.file, error: String(e?.message || e) });
    }
  }
  console.log(`[tiktok-queue] ${JSON.stringify(out)}`);
  res.json(out);
});
// ส่งคลิปที่ถึงเวลาเข้า TikTok แบบร่าง: POST /tiktok-draft-due (ส่งคลิปที่เวลาลงอยู่ภายใน 30 นาทีข้างหน้า)
app.post("/tiktok-draft-due", auth, async (req, res) => {
  const q = await readTtQueue();
  const horizon = Date.now() + (Number(req.body?.minutes) || 30) * 60 * 1000;
  const sent = [];
  for (const it of q) {
    if (it.sent_at || Date.parse(it.at) > horizon) continue;
    try {
      const r = await postTikTok(it.video_url, it.meta || {}, null, true);
      it.sent_at = new Date().toISOString();
      it.post_id = r?.post?._id;
      // TikTok ทิ้งแคปชันของคลิปร่าง (ขึ้นเป็น #SocialMediaConnector) → ส่งแคปชันไปในข้อความแจ้งเตือนให้ AK วางเอง
      sent.push({ file: it.file, title: it.title, at: it.at, post_id: it.post_id, caption: tiktokCaption(it.meta || {}) });
    } catch (e) {
      sent.push({ file: it.file, title: it.title, error: String(e?.message || e) });
    }
  }
  await writeTtQueue(q);
  const next = q.find((x) => !x.sent_at);
  console.log(`[tiktok-draft] ${JSON.stringify({ sent, next: next ? { file: next.file, at: next.at } : null })}`);
  res.json({ sent, next });
});
// ดูคิว: GET /tiktok-queue
app.get("/tiktok-queue", auth, async (req, res) => {
  const q = await readTtQueue();
  console.log(`[tiktok-queue-list] ${JSON.stringify(q.map((x) => ({ file: x.file, at: x.at, sent_at: x.sent_at })))}`);
  res.json(q.map(({ meta, ...x }) => x));
});
// โพสต์ที่ตั้งเวลาไว้ใน Zernio: GET /zernio-scheduled
app.get("/zernio-scheduled", auth, async (req, res) => {
  let out;
  try {
    const r = await zernio("/posts?status=scheduled&limit=100");
    const list = Array.isArray(r) ? r : r.posts || r.data || [];
    out = list.map((p) => ({ id: p._id, at: p.scheduledFor, platforms: (p.platforms || []).map((x) => x.platform).join(","), status: p.status, text: String(p.content || "").slice(0, 40), video: p.mediaItems?.[0]?.url }));
  } catch (e) {
    out = { error: String(e?.message || e) };
  }
  console.log(`[zernio-scheduled] ${JSON.stringify(out).slice(0, 8000)}`);
  res.json(out);
});

// ยกเลิกโพสต์ที่ตั้งเวลาไว้ใน Zernio: POST /zernio-delete {ids:[...]}
app.post("/zernio-delete", auth, async (req, res) => {
  const out = [];
  for (const id of Array.isArray(req.body?.ids) ? req.body.ids.map(String) : []) {
    try {
      await zernio(`/posts/${id}`, { method: "DELETE" });
      out.push({ id, deleted: true });
    } catch (e) {
      out.push({ id, error: String(e?.message || e) });
    }
  }
  console.log(`[zernio-delete] ${JSON.stringify(out)}`);
  res.json(out);
});

// โพสต์คลิปที่ render แล้วขึ้นเพจ Facebook: POST /facebook-post {items:[{video_url, file, at, duration}]}
app.post("/facebook-post", auth, async (req, res) => {
  const out = [];
  for (const it of Array.isArray(req.body?.items) ? req.body.items : []) {
    try {
      let meta = it.meta || {};
      if (it.file) meta = JSON.parse(await fs.readFile(path.join(__dirname, "..", "examples", path.basename(String(it.file))), "utf8")).meta || meta;
      const r = await postFacebook(String(it.video_url), meta, it.at, Number(it.duration) || undefined);
      out.push({ file: it.file, ok: true, id: r?.post?._id });
    } catch (e) {
      out.push({ file: it.file, error: String(e?.message || e) });
    }
  }
  console.log(`[facebook-post] ${JSON.stringify(out)}`);
  res.json(out);
});

// โพสต์คลิปที่ render แล้วขึ้น TikTok: POST /tiktok-post {items:[{video_url, file, at}]}
app.post("/tiktok-post", auth, async (req, res) => {
  const out = [];
  for (const it of Array.isArray(req.body?.items) ? req.body.items : []) {
    try {
      let meta = {};
      if (it.file) meta = JSON.parse(await fs.readFile(path.join(__dirname, "..", "examples", path.basename(String(it.file))), "utf8")).meta || {};
      const r = await postTikTok(String(it.video_url), meta, it.at);
      out.push({ file: it.file, ok: true, id: r?.post?._id, status: r?.post?.status });
    } catch (e) {
      out.push({ file: it.file, error: String(e?.message || e) });
    }
  }
  console.log(`[tiktok-post] ${JSON.stringify(out)}`);
  res.json(out);
});

// ทำรูปปกจากสคริปต์ใน examples/: POST /thumb-files {files:[...]} -> /videos/thumb-<ชื่อไฟล์>.jpg
app.post("/thumb-files", auth, async (req, res) => {
  const out = [];
  for (const f of Array.isArray(req.body?.files) ? req.body.files : []) {
    const name = path.basename(String(f));
    try {
      const tm = JSON.parse(await fs.readFile(path.join(__dirname, "..", "examples", name), "utf8")).meta?.thumb;
      const thumbProps = { image_url: tm.image_url, hook: tm.hook, badge: tm.badge, sub: tm.sub, width: 1080, height: 1920 };
      const tcomp = await selectComposition({ serveUrl, id: "Thumb", inputProps: thumbProps });
      const outName = `thumb-${name.replace(/\.json$/, "")}.jpg`;
      await renderStill({ composition: tcomp, serveUrl, output: path.join(OUT_DIR, outName), imageFormat: "jpeg", jpegQuality: 90, inputProps: thumbProps });
      out.push({ file: name, url: `${PUBLIC_BASE_URL}/videos/${outName}` });
    } catch (e) {
      out.push({ file: name, error: String(e?.message || e) });
    }
  }
  console.log(`[thumb-files] ${JSON.stringify(out)}`);
  res.json(out);
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
