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
import { randomUUID, createHash } from "node:crypto";
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
// ลิงก์เว็บแยกแพลตฟอร์ม: คลิปที่ตั้ง meta.campaign จะได้ utm_source/medium/campaign (เว็บนับที่ /admin/traffic)
// meta.site_path = หน้าปลายทาง (เช่น /card/123); ไม่ตั้ง → หน้าแรก. คลิปเก่าที่ไม่มี campaign ไม่เปลี่ยน
function tagLinks(text, meta = {}, platform = "tiktok") {
  if (!meta.campaign) return text;
  const camp = String(meta.campaign).toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 60);
  const med = { youtube: "shorts", tiktok: "video", facebook: "reel" }[platform] || "video";
  return String(text).replace(/(?:https?:\/\/)?www\.cardzcenter\.com((?:\/[^\s?]*)?)(?!\?utm_)/g, (_m, pth) =>
    `https://www.cardzcenter.com${pth || meta.site_path || ""}?utm_source=${platform}&utm_medium=${med}&utm_campaign=${camp}`);
}
function tiktokCaption(meta = {}, platform = "tiktok") {
  if (meta.tiktok_caption) return String(meta.tiktok_caption).slice(0, 2200);
  const title = String(meta.title || "").replace(/#shorts/gi, "").trim();
  const first = String(meta.description || "").split("\n\n")[0] || "";
  return tagLinks([title, meta.engage ? String(meta.engage) : engageLine(title), first, "🛒 ซื้อ • ขาย • สะสม • แข่งเกมส์การ์ด ครบจบในเว็บเดียว 👉 www.cardzcenter.com",
    socialTags(meta)]
    .filter(Boolean).join("\n\n"), meta, platform).slice(0, 2200);
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
// AK 18 ต.ค.: ให้ลง TikTok อัตโนมัติ (ตั้งเวลาโพสต์ตรงผ่าน Zernio) ไม่ต้องผ่านแบบร่างแล้ว
// TIKTOK_AUTO=0 เพื่อกลับไปใช้แบบร่าง
async function enqueueTiktok(item) {
  const q = await readTtQueue();
  const i = q.findIndex((x) => x.file === item.file && x.direct);
  if (process.env.TIKTOK_AUTO !== "0") {
    // ไฟล์เดิมที่ตั้งเวลาไว้แล้ว → ยกเลิกโพสต์เดิมก่อน แล้วตั้งใหม่ (ใช้ตอนเปลี่ยนเวอร์ชันคลิป)
    if (i >= 0 && q[i].post_id) { try { await zernio(`/posts/${q[i].post_id}`, { method: "DELETE" }); } catch (e) { console.warn(`[tiktok-queue] delete old failed: ${String(e?.message || e)}`); } }
    const r = await postTikTok(item.video_url, item.meta || {}, item.at);
    const rec = { ...item, direct: true, sent_at: new Date().toISOString(), post_id: r?.post?._id };
    if (i >= 0) q[i] = rec; else q.push(rec);
    q.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    await writeTtQueue(q);
    console.log(`[tiktok-queue] direct ${item.file} at ${item.at} -> ${rec.post_id}`);
    return;
  }
  const j = q.findIndex((x) => x.file === item.file && !x.sent_at);
  if (j >= 0) q[j] = { ...q[j], ...item }; else q.push(item);
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
    content: tiktokCaption(meta, "facebook"),
    mediaItems: [{ type: "video", url: videoUrl }],
    platforms: [{ platform: "facebook", accountId, platformSpecificData: { ...(reel ? { contentType: "reel", title } : {}), firstComment: tagLinks(FB_FIRST_COMMENT, meta, "facebook") } }],
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
const SAY_FIX = [[/การ์ด/g, "ก๊าด"], [/เกมส์/g, "เกม"], [/PSA|พีเอสเอ|พี เอส เอ/g, "พี เอส เอ"]];
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

// เพลงคลอเบาๆ ใต้เสียงพากย์: วนเพลงให้ยาวเท่าคลิป, เพลงเบาลงเองตอนมีเสียงพูด (sidechain), เฟดเข้า/ออก
async function mixMusic(inFile, outFile, musicFile, vol = 0.18, dur = 60) {
  const v = Math.max(0.02, Math.min(0.6, Number(vol) || 0.18));
  const fo = Math.max(1, Number(dur) - 2.5).toFixed(2);
  const graph = (norm) =>
    `[1:a]aresample=48000,volume=${v},afade=t=in:d=1.2,afade=t=out:st=${fo}:d=2.5[m];` +
    `[0:a]aresample=48000,asplit=2[vo][sc];` +
    `[m][sc]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=450[md];` +
    `[vo][md]amix=inputs=2:duration=first:dropout_transition=0${norm ? ":normalize=0" : ""}${norm ? "" : ",volume=2"}[a]`;
  // เรียงจากดีที่สุด → ง่ายที่สุด (ffmpeg บางรุ่นไม่มี sidechaincompress / amix normalize)
  const simple = `[1:a]aresample=48000,volume=${v},afade=t=in:d=1.2,afade=t=out:st=${fo}:d=2.5[m];[0:a]aresample=48000[vo];[vo][m]amix=inputs=2:duration=first:dropout_transition=0,volume=2[a]`;
  const tries = [graph(true), graph(false), simple];
  let last;
  for (const g of tries) {
    try {
      await runFfmpeg(["-y", "-i", inFile, "-stream_loop", "-1", "-i", musicFile, "-filter_complex", g, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", outFile]);
      return g === simple ? "simple" : "ducked";
    } catch (e) {
      last = e;
      console.warn(`[bgm] ${String(e?.message || e).slice(0, 600)}`);
    }
  }
  throw last;
}

// ช่องภาพของ MangaShow ต่อท่อน: {img, x, y, zoom, sfx, bw}
function cleanPanel(v) {
  if (!v || typeof v !== "object") return undefined;
  const n = (x) => (x === undefined || x === null || x === "" || !Number.isFinite(Number(x)) ? undefined : Number(x));
  return { img: n(v.img), x: n(v.x), y: n(v.y), zoom: n(v.zoom), sfx: v.sfx ? String(v.sfx).slice(0, 16) : undefined, bw: v.bw === true };
}

async function runJob(job) {
  job.status = "rendering";
  job.started_at = new Date().toISOString();
  const assetDir = path.join(ASSET_DIR, job.id);
  try {
    await bundleReady;

    const compId = job.request.composition;
    let inputProps;

    if (compId === "FightShort") {
      inputProps = { ...(job.request.fight || {}) };
    } else if (compId === "DramaStory") {
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
            const part = { text: String(p.text || ""), duration: 4, say: p.say ? String(p.say) : undefined, panel: p.panel, cue: p.cue };
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
      id: ["DramaStory", "CardShow", "MangaShow", "FightShort"].includes(compId) ? compId : "DynamicStory",
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

    // เพลงคลอ (bgm) — ถ้าพังใช้คลิปเดิมที่ไม่มีเพลง
    if (job.request.bgm_url) {
      try {
        await fs.mkdir(assetDir, { recursive: true });
        const mf = await getMusic(job.request.bgm_url);
        const tmp = path.join(OUT_DIR, `${job.id}.bgm.mp4`);
        await mixMusic(outputLocation, tmp, mf, job.request.bgm_volume, job.duration_sec);
        await fs.rename(tmp, outputLocation);
      } catch (e) {
        job.warnings.push(`bgm failed: ${String(e?.message || e).slice(0, 200)}`);
      }
    }

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
  await autoPrune().catch((e) => console.log(`[disk-auto] failed: ${String(e?.message || e).slice(0, 200)}`));
}

// ดิสก์ใช้เกิน DISK_PRUNE_PCT% (ค่าเริ่ม 70) → ลบคลิปเก่ากว่า 24 ชม. ที่ไม่มีโพสต์ตั้งเวลา (Zernio) หรือคิว TikTok ที่ยังไม่ส่งอ้างถึง
// และไฟล์ชั่วคราวใน assets ที่เก่ากว่า 24 ชม. (เก็บคิว TikTok / outro / .json / music ไว้) — ถ้าเช็ก Zernio ไม่ได้ จะไม่ลบคลิปเลย
async function diskPct() {
  try {
    const { stdout } = await execFileP("df", ["-m", DATA_DIR]);
    const m = stdout.trim().split("\n").pop().match(/(\d+)%/);
    return m ? Number(m[1]) : 0;
  } catch { return 0; }
}
async function autoPrune() {
  const limit = Number(process.env.DISK_PRUNE_PCT || 70);
  const before = await diskPct();
  if (before < limit) return;
  const cutoff = Date.now() - 24 * 3600 * 1000;
  const deleted = [];
  for (const f of await fs.readdir(ASSET_DIR).catch(() => [])) {
    if (/^tiktok-queue|^outro-|\.json$/.test(f)) continue;
    const st = await fs.stat(path.join(ASSET_DIR, f)).catch(() => null);
    if (st && st.mtimeMs < cutoff) { await fs.rm(path.join(ASSET_DIR, f), { recursive: true, force: true }).catch(() => {}); deleted.push("assets/" + f); }
  }
  const refs = new Set();
  const add = (u) => { const m = String(u || "").match(/videos\/([0-9a-f-]{36})/i); if (m) refs.add(m[1]); };
  let zernioOk = true;
  try {
    const r = await zernio("/posts?status=scheduled&limit=200");
    for (const p of Array.isArray(r) ? r : r.posts || r.data || []) for (const mi of p.mediaItems || []) add(mi.url);
  } catch { zernioOk = false; }
  if (zernioOk) {
    for (const it of await readTtQueue().catch(() => [])) if (!it.sent_at) add(it.video_url);
    for (const f of await fs.readdir(OUT_DIR).catch(() => [])) {
      const id = (f.match(/^([0-9a-f-]{36})/i) || [])[1];
      if (!id || refs.has(id)) continue;
      const st = await fs.stat(path.join(OUT_DIR, f)).catch(() => null);
      if (st && st.mtimeMs < cutoff) { await fs.rm(path.join(OUT_DIR, f), { force: true }); deleted.push(f); }
    }
  }
  console.log(`[disk-auto] ${before}% -> ${await diskPct()}% deleted ${deleted.length} (zernio ${zernioOk ? "ok" : "unreachable: clips kept"}, kept refs ${refs.size})`);
}
cleanup();
setInterval(cleanup, 1 * 3600 * 1000);

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
        reject(new Error(`ffmpeg failed: ${String(stderr || err.message).split("\n").filter((l) => /error|invalid|not found|no such/i.test(l)).slice(-3).join(" | ").slice(0, 400) || String(stderr || err.message).slice(-300)}`));
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
// แบนเนอร์ช่อง YouTube (2048x1152): GET /brand/yt-banner.png (?refresh=1 = สร้างใหม่)
app.get("/brand/yt-banner.png", async (req, res) => {
  const file = path.join(ASSET_DIR, "yt-banner.png");
  try {
    const have = await fs.stat(file).then(() => true, () => false);
    if (!have || req.query.refresh) {
      const pk = OUTRO_POOL.pokemon, yg = OUTRO_POOL.yugioh, mg = OUTRO_POOL.magic;
      const groups = [pk[0], yg[0], mg[0], pk[1], yg[1], pk[2], mg[1]];
      const dir = path.join(ASSET_DIR, `cover-src-${Date.now()}`);
      await fs.mkdir(dir, { recursive: true });
      const files = [];
      for (const [i, g] of groups.entries()) {
        if (files.length >= 4) break;
        for (const u of g.urls || [g]) {
          try { files.push(path.join(dir, await downloadImage(String(u), dir, `c${i}`))); break; } catch (e) {}
        }
      }
      await execFileP("python3", [path.join(__dirname, "yt_banner.py"), file, path.join(__dirname, "..", "public", "fonts"), ...files], { timeout: 120000 });
      fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      console.log(`[yt-banner] built with ${files.length} cards`);
    }
    res.set("Cache-Control", "no-cache");
    res.sendFile(req.query.fmt === "jpg" ? file.replace(/\.png$/, ".jpg") : file);
  } catch (e) {
    console.error("[yt-banner] failed", e);
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

  if (body.composition === "FightShort") {
    const id = randomUUID();
    const job = {
      id,
      status: "queued",
      progress: 0,
      warnings: [],
      created_at: new Date().toISOString(),
      request: {
        composition: "FightShort",
        fight: body.fight && typeof body.fight === "object" ? body.fight : {},
        bgm_url: /^https?:\/\//i.test(String(body.bgm_url || "")) ? String(body.bgm_url) : undefined,
        bgm_volume: Number(body.bgm_volume) > 0 && Number(body.bgm_volume) <= 0.6 ? Number(body.bgm_volume) : undefined,
        webhook_url: body.webhook_url || undefined,
        meta: body.meta,
      },
    };
    jobs.set(id, job);
    queue.push(job);
    pump();
    return res.status(202).json({ job_id: id, status: job.status });
  }

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

  const composition = ["DramaStory", "CardShow", "MangaShow"].includes(body.composition) ? body.composition : "DynamicStory";
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
      const BEATS = ["hook", "reveal", "card", "name", "stats", "bignum", "quiz", "zoom", "timeline", "art", "still", "coin", "evolve", "versions", "sprite", "full", "rank", "pixel", "vec", "v_toilet", "v_ac", "v_wash", "v_micro", "v_rice", "v_kettle", "v_shower", "v_smoke", "v_hairdryer", "v_induction", "v_toaster", "v_airfryer", "v_fan", "v_vacuum", "v_led", "v_breaker", "v_pump", "v_iron"];
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
          ? s.parts.map((p) => ({ text: String(p?.text ?? ""), say: p?.say ? String(p.say) : undefined, panel: cleanPanel(p?.panel), cue: p?.cue ? String(p.cue).slice(0, 12) : undefined }))
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
        price: s.price !== undefined ? String(s.price).slice(0, 30) : undefined,
        price_label: s.price_label !== undefined ? String(s.price_label).slice(0, 30) : undefined,
        rank: s.rank !== undefined ? String(s.rank).slice(0, 6) : undefined,
        video_url: typeof s.video_url === "string" && /^https:\/\/(videos\.pexels\.com\/|renderer-production-8b7f\.up\.railway\.app\/videos\/(?:wan|clip)-)/.test(s.video_url) ? s.video_url : undefined,
        pos: typeof s.pos === "string" && /^[0-9.% ]{3,20}$/.test(s.pos) ? s.pos : undefined,
        fit: s.fit === "contain" ? "contain" : s.fit === "cover" ? "cover" : undefined,
        from: optNum(s.from),
        choices: Array.isArray(s.choices) ? s.choices.slice(0, 4).map(String) : undefined,
        answer: optNum(s.answer),
        points: Array.isArray(s.points) ? s.points.slice(0, 6).map((q) => ({ year: String(q?.year ?? ""), label: String(q?.label ?? "") })) : undefined,
        transition: ["wipe", "zoom", "flash", "slide", "shutter", "none"].includes(s.transition) ? s.transition : undefined,
        // ฟิลด์ของรูปแบบ MangaShow
        layout: ["wanted", "panels", "splash", "versus", "effect", "still", "poll", "cinema"].includes(s.layout) ? s.layout : undefined,
        name: s.name !== undefined ? String(s.name).slice(0, 60) : undefined,
        bounty: s.bounty !== undefined ? String(s.bounty).slice(0, 30) : undefined,
        sticker: s.sticker !== undefined ? String(s.sticker).slice(0, 40) : undefined,
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
      bgm_url: /^https?:\/\//i.test(String(body.bgm_url || "")) ? String(body.bgm_url) : undefined,
      bgm_volume: Number(body.bgm_volume) > 0 && Number(body.bgm_volume) <= 0.6 ? Number(body.bgm_volume) : undefined,
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
const YNN_HOOK = "https://hook.us2.make.com/e73f2bdhgkjcspriy4o3uxr45muvrp7v"; // ช่อง "ยังไงนะ"
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

// บีบอัดคลิปยาวให้เล็กพอส่งเข้า Make: POST /compress {job, mb?:85} -> /videos/<job>-yt.mp4 (ทำเบื้องหลัง ดูผลใน log)
app.post("/compress", auth, async (req, res) => {
  const job = String(req.body?.job || "");
  const mb = Math.max(20, Math.min(400, Number(req.body?.mb) || 85));
  const hd = Number(req.body?.h) === 1080;
  if (!/^[0-9a-f-]{36}$/.test(job)) return res.status(400).json({ error: "bad job id" });
  const src = path.join(OUT_DIR, `${job}.mp4`);
  const dest = path.join(OUT_DIR, `${job}-yt.mp4`);
  try { await fs.stat(src); } catch { return res.status(404).json({ error: "source not found" }); }
  res.status(202).json({ ok: true, dest: `${job}-yt.mp4`, target_mb: mb });
  try {
    const { stdout } = await execFileP("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { timeout: 30000 });
    const dur = Number(String(stdout).trim());
    const vk = Math.max(150, Math.floor((mb * 8192) / dur - 64));
    await execFileP("ffmpeg", ["-y", "-v", "error", "-i", src, "-vf", hd ? "scale=1920:1080" : "scale=1280:720", "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-b:v", `${vk}k`, "-maxrate", `${Math.floor(vk * 1.6)}k`, "-bufsize", `${vk * 2}k`, "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", dest], { timeout: 3000000, maxBuffer: 1 << 24 });
    const st = await fs.stat(dest);
    console.log(`[compress] done ${job}-yt.mp4 ${(st.size / 1048576).toFixed(1)} MB (video ${vk}k, ${dur.toFixed(0)}s)`);
  } catch (e) {
    console.log(`[compress] failed ${job}: ${String(e?.message || e).slice(0, 300)}`);
  }
});

// ส่งคลิปที่ render แล้วเข้า Make อัปโหลด YouTube (ใช้ข้อความจาก meta ในสคริปต์ตรงๆ ไม่ต้องพิมพ์ซ้ำ)
// POST /yt-upload {items:[{file:"op17-008-reel.json", job:"<job id>", publish_at?:"2026-10-23T10:00:00Z"}]}
app.post("/yt-upload", auth, async (req, res) => {
  const out = [];
  for (const it of Array.isArray(req.body?.items) ? req.body.items : []) {
    const name = path.basename(String(it.file || ""));
    const job = String(it.job || "");
    try {
      if (!/^[0-9a-f-]{36}(-[a-z0-9]+)?$/.test(job)) throw new Error("bad job id");
      await fs.stat(path.join(OUT_DIR, `${job}.mp4`));
      const meta = JSON.parse(await fs.readFile(path.join(__dirname, "..", "examples", name), "utf8")).meta || {};
      const publish_at = it.publish_at || meta.publish_at;
      if (!publish_at) throw new Error("publish_at missing");
      const thumbName = `thumb-${name.replace(/\.json$/, "")}.jpg`;
      const hasThumb = await fs.stat(path.join(OUT_DIR, thumbName)).then(() => true, () => false);
      const payload = {
        job_id: job,
        status: "done",
        video_url: publicVideoUrl(job),
        thumbnail_url: hasThumb ? `${PUBLIC_BASE_URL}/videos/${thumbName}` : (/^https?:\/\//.test(String(meta.thumb_url || "")) ? String(meta.thumb_url) : null),
        warnings: [],
        meta: { title: meta.title, description: tagLinks(meta.description || "", meta, "youtube"), publish_at },
      };
      await postWebhook(String(it.channel || req.body?.channel) === "yng" ? YNN_HOOK : UPLOAD_HOOK, payload);
      out.push({ file: name, job, publish_at, title: meta.title, thumbnail: hasThumb });
    } catch (e) {
      out.push({ file: name, job, error: String(e?.message || e) });
    }
  }
  console.log(`[yt-upload] ${JSON.stringify(out)}`);
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
// ---------- ข่าวการ์ดลงเพจ Facebook ----------
// POST /fb-news {spec:{game,accent,tag,headline,bullets,date,source,image_url?}, text, at?, publish?:bool}
//   publish ไม่ใส่/false = สร้างภาพอย่างเดียว (ดูตัวอย่าง) → คืน image_url
//   publish:true = โพสต์ภาพ + ข้อความลงเพจผ่าน Zernio (ตั้งเวลาได้ด้วย at) + คอมเมนต์แรกลิงก์เว็บ
app.post("/fb-news", auth, async (req, res) => {
  try {
    const spec = { ...(req.body?.spec || {}) };
    const id = `news-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
    const dir = path.join(ASSET_DIR, id);
    await fs.mkdir(dir, { recursive: true });
    if (spec.image_url) {
      try { spec.image = path.join(dir, await downloadImage(String(spec.image_url), dir, "img")); } catch (e) { console.warn(`[fb-news] image skipped: ${e?.message || e}`); }
    }
    const specFile = path.join(dir, "spec.json");
    await fs.writeFile(specFile, JSON.stringify(spec));
    const out = path.join(OUT_DIR, `${id}.jpg`);
    await execFileP("python3", [path.join(__dirname, "news_card.py"), out, path.join(__dirname, "..", "public", "fonts"), specFile], { timeout: 60000 });
    const image_url = `${PUBLIC_BASE_URL}/videos/${id}.jpg`;
    let post = null;
    if (req.body?.publish) {
      const accountId = await facebookAccountId();
      const at = req.body.at;
      const when = at && Date.parse(at) > Date.now() + 5 * 60 * 1000 ? new Date(at).toISOString() : null;
      const r = await zernio("/posts", { method: "POST", body: JSON.stringify({
        content: String(req.body.text || spec.headline || "").replace(/\*/g, "").slice(0, 5000),
        mediaItems: [{ type: "image", url: image_url }],
        platforms: [{ platform: "facebook", accountId, platformSpecificData: { firstComment: FB_FIRST_COMMENT } }],
        ...(when ? { scheduledFor: when, timezone: "UTC" } : { publishNow: true }),
      }) });
      post = { id: r?.post?._id, status: r?.post?.status, when };
    }
    console.log(`[fb-news] ${JSON.stringify({ image_url, post, headline: String(spec.headline || "").replace(/[*\n]/g, " ").slice(0, 120), image_src: spec.image_url || null })}`);
    res.json({ image_url, post });
  } catch (e) {
    console.log(`[fb-news] error ${String(e?.message || e).slice(0, 300)}`);
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ตรวจรูปจากเครื่อง Claude ไม่ได้ (เน็ตถูกจำกัด) — ให้ renderer ดึงรูปแล้วย่อเป็น JPEG เล็กๆ พิมพ์ base64 ลง log
// POST /peek {urls:[...], width?:360}  → log "[peek] <i> <part>/<n> <b64>"
// POST /peek-page {url} → log รายการรูปทั้งหมดในหน้าเว็บ (og:image, img src/data-src, alt)
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", accept: "*/*" };
// ใส่เพลงคลอให้คลิปที่ render แล้ว (ไม่ต้องสร้างเสียงพากย์ใหม่): POST /add-music {jobs:[...], bgm_url, volume, suffix?}
//   → /videos/<job>-<suffix>.mp4 (ค่าเริ่มต้น suffix = "m")
// เพลงคลอ: เก็บไฟล์ไว้ใน /data/music (ไม่โดนล้างพร้อม assets) โหลดครั้งเดียว ลองซ้ำ 3 ครั้งถ้าเว็บเพลงล่ม
async function getMusic(url) {
  const dir = path.join(path.dirname(ASSET_DIR), "music");
  await fs.mkdir(dir, { recursive: true });
  const f = path.join(dir, createHash("sha1").update(url).digest("hex").slice(0, 16) + ".mp3");
  try { if ((await fs.stat(f)).size > 100000) return f; } catch {}
  let err;
  for (let k = 0; k < 3; k++) {
    try { await downloadTo(url, f + ".tmp"); await fs.rename(f + ".tmp", f); return f; }
    catch (e) { err = e; await new Promise((r) => setTimeout(r, 3000 * (k + 1))); }
  }
  throw err;
}
app.post("/add-music", auth, async (req, res) => {
  const jobs = (Array.isArray(req.body?.jobs) ? req.body.jobs : []).map((j) => path.basename(String(j)));
  const url = String(req.body?.bgm_url || "");
  const suffix = String(req.body?.suffix || "m").replace(/[^a-z0-9]/gi, "").slice(0, 12) || "m";
  res.json({ ok: true, n: jobs.length });
  const out = [];
  try {
    const mf = await getMusic(url);
    for (const j of jobs) {
      try {
        const inF = path.join(OUT_DIR, `${j}.mp4`);
        const { stdout } = await execFileP("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", inF]).catch(() => ({ stdout: "60" }));
        await mixMusic(inF, path.join(OUT_DIR, `${j}-${suffix}.mp4`), mf, req.body?.volume, Number(stdout) || 60);
        try { await fs.copyFile(path.join(OUT_DIR, `${j}.jpg`), path.join(OUT_DIR, `${j}-${suffix}.jpg`)); } catch {}
        out.push({ job: j, video_url: `${PUBLIC_BASE_URL}/videos/${j}-${suffix}.mp4` });
      } catch (e) {
        out.push({ job: j, error: String(e?.message || e).slice(0, 200) });
      }
    }
  } catch (e) {
    out.push({ error: `music download failed: ${String(e?.message || e).slice(0, 200)}` });
  }
  console.log(`[add-music] ${url} ${JSON.stringify(out)}`);
});

// ดูพื้นที่ดิสก์ + ลบไฟล์ที่ไม่ใช้: POST /disk {delete_out:[ชื่อไฟล์ใน out], purge_assets:true}
app.post("/disk", auth, async (req, res) => {
  const out = { deleted: [] };
  for (const n of (Array.isArray(req.body?.delete_out) ? req.body.delete_out : []).map((x) => path.basename(String(x)))) {
    await fs.rm(path.join(OUT_DIR, n), { force: true }).then(() => out.deleted.push(n)).catch(() => {});
  }
  if (req.body?.prune_unreferenced) {
    // ลบคลิปเก่าที่ไม่มีโพสต์ตั้งเวลา (Zernio) หรือคิว TikTok ที่ยังไม่ส่งอ้างถึง และไม่อยู่ในรายการ keep
    const refs = new Set((Array.isArray(req.body.keep) ? req.body.keep : []).map(String));
    const add = (u) => { const m = String(u || "").match(/videos\/([0-9a-f-]{36})/i); if (m) refs.add(m[1]); };
    try {
      const r = await zernio("/posts?status=scheduled&limit=200");
      for (const p of Array.isArray(r) ? r : r.posts || r.data || []) for (const mi of p.mediaItems || []) add(mi.url);
    } catch (e) {
      return res.status(500).json({ error: `zernio list failed, nothing deleted: ${String(e?.message || e)}` });
    }
    for (const it of await readTtQueue().catch(() => [])) if (!it.sent_at) add(it.video_url);
    const cutoff = Date.now() - (Number(req.body.older_than_hours) || 3) * 3600 * 1000;
    out.kept_refs = refs.size;
    for (const f of await fs.readdir(OUT_DIR).catch(() => [])) {
      const id = (f.match(/^([0-9a-f-]{36})/i) || [])[1];
      if (!id || refs.has(id)) continue;
      const st = await fs.stat(path.join(OUT_DIR, f)).catch(() => null);
      if (st && st.mtimeMs < cutoff) { await fs.rm(path.join(OUT_DIR, f), { force: true }); out.deleted.push(f); }
    }
  }
  if (req.body?.purge_assets) {
    // assets = ไฟล์ชั่วคราวของงาน (รูป/เสียงที่โหลดมา, peek, news, bgm) — ไม่ใช่คลิปที่ลงแล้ว; เก็บไว้แค่คิว TikTok และ outro ของวันนี้
    for (const f of await fs.readdir(ASSET_DIR).catch(() => [])) {
      if (/^tiktok-queue|^outro-|\.json$/.test(f)) continue;
      await fs.rm(path.join(ASSET_DIR, f), { recursive: true, force: true }).catch(() => {});
    }
    out.purged_assets = true;
  }
  const du = async (d) => {
    let total = 0;
    const files = [];
    const walk = async (p) => {
      for (const e of await fs.readdir(p, { withFileTypes: true }).catch(() => [])) {
        const q = path.join(p, e.name);
        if (e.isDirectory()) await walk(q);
        else {
          const st = await fs.stat(q).catch(() => null);
          if (st) { total += st.size; files.push([q.replace(DATA_DIR, ""), st.size, st.mtime.toISOString().slice(0, 16)]); }
        }
      }
    };
    await walk(d);
    files.sort((a, b) => b[1] - a[1]);
    return { mb: Math.round(total / 1e6), top: files.slice(0, 40).map(([n, sz, t]) => `${n} ${Math.round(sz / 1e6)}MB ${t}`) };
  };
  out.out = await du(OUT_DIR);
  out.assets = await du(ASSET_DIR);
  try {
    const { stdout } = await execFileP("df", ["-m", DATA_DIR]);
    out.df = stdout.trim().split("\n").pop();
  } catch {}
  console.log(`[disk] ${JSON.stringify(out).slice(0, 15000)}`);
  res.json(out);
});

// ดูเฟรมจากคลิปที่ render แล้ว: POST /peek-video {job, times:[sec...], width} → แผ่นรวมเฟรม base64 ใน log "[peek] v …"
app.post("/peek-video", auth, async (req, res) => {
  const job = path.basename(String(req.body.job || ""));
  const times = (Array.isArray(req.body.times) ? req.body.times : [1, 5, 10, 20, 30, 40]).slice(0, 12).map(Number);
  const width = Math.min(Number(req.body.width) || 270, 400);
  res.json({ ok: true, n: times.length });
  try {
    const file = path.join(OUT_DIR, `${job}.mp4`);
    const frames = [];
    for (const [k, t] of times.entries()) {
      const fo = path.join(ASSET_DIR, `pv-${k}.jpg`);
      await runFfmpeg(["-y", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", `scale=${width}:-1`, fo]);
      frames.push(fo);
    }
    const out = path.join(ASSET_DIR, "pv-sheet.jpg");
    const cols = Math.min(4, frames.length);
    await execFileP("python3", ["-c", `import sys\nfrom PIL import Image, ImageDraw\nfs=sys.argv[3:]\nims=[Image.open(f) for f in fs]\nc=int(sys.argv[2])\nw,h=ims[0].size\nr=(len(ims)+c-1)//c\nS=Image.new('RGB',(w*c,h*r),'white')\nfor i,im in enumerate(ims): S.paste(im,((i%c)*w,(i//c)*h))\nS.save(sys.argv[1],quality=70)`, out, String(cols), ...frames], { timeout: 30000 });
    await fs.copyFile(out, path.join(OUT_DIR, `sheet-${name}.jpg`));
    console.log(`[clip] sheet saved -> ${PUBLIC_BASE_URL}/videos/sheet-${name}.jpg`);
    return;
    const b64 = (await fs.readFile(out)).toString("base64");
    const parts = Math.ceil(b64.length / 6000);
    console.log(`[peek] v meta ${job} ${JSON.stringify(times)}`);
    for (let p = 0; p < parts; p++) console.log(`[peek] v ${p + 1}/${parts} ${b64.slice(p * 6000, (p + 1) * 6000)}`);
  } catch (e) {
    console.log(`[peek] v error ${String(e?.message || e).slice(0, 300)}`);
  }
});


// ดูภาพนิ่งจากหนังสั้น FightShort ที่เวลาต่างๆ (วินาที) — ล็อกเป็น contact sheet แบบเดียวกับ /peek-video
app.post("/fight-still", auth, async (req, res) => {
  const times = (Array.isArray(req.body.times) ? req.body.times : [10]).slice(0, 12).map(Number);
  const width = Math.min(Number(req.body.width) || 480, 640);
  res.json({ ok: true, n: times.length });
  try {
    await bundleReady;
    const comp = await selectComposition({ serveUrl, id: "FightShort", inputProps: {} });
    const files = [];
    for (const [k, t] of times.entries()) {
      const fo = path.join(ASSET_DIR, `fs-${k}.jpg`);
      await renderStill({ composition: comp, serveUrl, output: fo, frame: Math.max(0, Math.min(comp.durationInFrames - 1, Math.round(t * 30))), imageFormat: "jpeg", jpegQuality: 75 });
      files.push(fo);
    }
    const out = path.join(ASSET_DIR, "fs-sheet.jpg");
    const cols = Math.min(3, files.length);
    await execFileP("python3", ["-c", `import sys\nfrom PIL import Image\nfs=sys.argv[4:]\nW=int(sys.argv[3])\nims=[]\nfor f in fs:\n    im=Image.open(f).convert('RGB'); ims.append(im.resize((W,int(im.height*W/im.width))))\nc=int(sys.argv[2])\nw,h=ims[0].size\nr=(len(ims)+c-1)//c\nS=Image.new('RGB',(w*c,h*r),'white')\nfor i,im in enumerate(ims): S.paste(im,((i%c)*w,(i//c)*h))\nS.save(sys.argv[1],quality=70)`, out, String(cols), String(width), ...files], { timeout: 60000 });
    await fs.copyFile(out, path.join(OUT_DIR, `sheet-${name}.jpg`));
    console.log(`[clip] sheet saved -> ${PUBLIC_BASE_URL}/videos/sheet-${name}.jpg`);
    return;
    const b64 = (await fs.readFile(out)).toString("base64");
    const parts = Math.ceil(b64.length / 6000);
    console.log(`[peek] v meta fight-still ${JSON.stringify(times)}`);
    for (let p = 0; p < parts; p++) console.log(`[peek] v ${p + 1}/${parts} ${b64.slice(p * 6000, (p + 1) * 6000)}`);
  } catch (e) {
    console.log(`[peek] v error ${String(e?.message || e).slice(0, 400)}`);
  }
});

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
// POST /frame-grab {job, times:[sec...], width=400} -> log JPEG frames (base64) of /videos/<job>.mp4 so a slide can be inspected
app.post("/frame-grab", auth, async (req, res) => {
  const job = path.basename(String(req.body.job || ""));
  const times = (req.body.times || []).slice(0, 6).map(Number);
  const width = Math.min(Number(req.body.width) || 400, 600);
  res.json({ ok: true, n: times.length });
  for (const [i, t] of times.entries()) {
    try {
      const out = path.join(ASSET_DIR, `frame-${i}.jpg`);
      await execFileP("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", path.join(OUT_DIR, `${job}.mp4`), "-frames:v", "1", "-vf", `scale=${width}:-1`, "-q:v", "5", out], { timeout: 30000 });
      const b64 = (await fs.readFile(out)).toString("base64");
      const parts = Math.ceil(b64.length / 6000);
      console.log(`[frame] ${i} meta t=${t} parts=${parts}`);
      for (let p = 0; p < parts; p++) console.log(`[frame] ${i} ${p + 1}/${parts} ${b64.slice(p * 6000, (p + 1) * 6000)}`);
    } catch (e) { console.log(`[frame] ${i} error ${String(e?.message || e).slice(0, 200)}`); }
  }
});
// POST /fetch-text {url, max=3000} -> log the first max chars of the response (for JSON APIs such as the Wikimedia imageinfo API)
app.post("/fetch-text", auth, async (req, res) => {
  const u = req.body.url;
  const max = Math.min(Number(req.body.max) || 3000, 12000);
  res.json({ ok: true });
  try {
    const r = await fetch(u, { headers: UA });
    const t = (await r.text()).replace(/\s+/g, " ");
    console.log(`[fetch-text] ${r.status} ${u.slice(0, 120)} len=${t.length}`);
    for (let p = 0; p < t.length && p < max; p += 1500) console.log(`[fetch-text] ${p / 1500} ${t.slice(p, Math.min(p + 1500, max))}`);
  } catch (e) {
    console.log(`[fetch-text] error ${String(e.message || e).slice(0, 200)} ${u}`);
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


// POST /img-stats {pages[]} -> for each page, probe every unique card image: log landscape/odd shapes (width>height) with their alt text
app.post("/img-stats", auth, async (req, res) => {
  const pages = (req.body.pages || []).slice(0, 12);
  res.json({ ok: true });
  for (const u of pages) {
    try {
      const html = await (await fetch(u, { headers: UA })).text();
      const seen = new Map();
      for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
        const s = (m[0].match(/\s(?:data-src|data-lazy-src|src)=["']([^"']+)/i) || [])[1];
        const alt = (m[0].match(/\salt=["']([^"']*)/i) || [])[1] || "";
        if (s && /pricecharting|\/240\.jpg/.test(s) && !seen.has(s)) seen.set(s, alt);
      }
      const urls = [...seen.keys()];
      let land = 0, port = 0, bad = 0;
      const odd = [];
      const sizes = await Promise.all(urls.map(async (s) => {
        try {
          const b = Buffer.from(await (await fetch(s, { headers: UA })).arrayBuffer());
          return await new Promise((ok) => execFile("python3", ["-c", "import sys,io\nfrom PIL import Image\nim=Image.open(io.BytesIO(sys.stdin.buffer.read()))\nprint(im.size[0],im.size[1])"], (e, o) => ok(e ? null : String(o).trim().split(" ").map(Number))).stdin.end(b));
        } catch { return null; }
      }));
      sizes.forEach((z, i) => {
        if (!z) { bad++; return; }
        if (z[0] > z[1]) { land++; odd.push(`${z[0]}x${z[1]} ${seen.get(urls[i])} ${urls[i].split("/").slice(-2)[0]}`); } else port++;
      });
      console.log(`[img-stats] ${u} unique=${urls.length} portrait=${port} landscape=${land} bad=${bad}`);
      for (const o of odd.slice(0, 15)) console.log(`[img-stats] LAND ${o}`);
    } catch (e) {
      console.log(`[img-stats] error ${String(e.message || e).slice(0, 150)} ${u}`);
    }
  }
});

// POST /img-crawl {sitemap, match, from, max} -> crawl site set pages (from sitemap), keep pages whose html matches `match`, measure card pictures, log totals + worst sets
app.post("/img-crawl", auth, async (req, res) => {
  const { sitemap, match = "tennis", from = 0, max = 120 } = req.body || {};
  res.json({ ok: true });
  try {
    const xml = await (await fetch(sitemap, { headers: UA })).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(from, from + max);
    const re = new RegExp(match, "i");
    let sets = 0, imgs = 0, land = 0, bad = 0, scanned = 0;
    const worst = [];
    const probe = (b) => new Promise((ok) => { const c = execFile("python3", ["-c", "import sys,io\nfrom PIL import Image\nim=Image.open(io.BytesIO(sys.stdin.buffer.read()))\nprint(im.size[0],im.size[1])"], (e, o) => ok(e ? null : String(o).trim().split(" ").map(Number))); c.stdin.end(b); });
    for (let i = 0; i < urls.length; i += 6) {
      await Promise.all(urls.slice(i, i + 6).map(async (u) => {
        try {
          const html = await (await fetch(u, { headers: UA })).text();
          scanned++;
          if (!re.test(html)) return;
          const title = (html.match(/<title>([^<]*)/i) || [])[1] || "";
          const list = [...new Set([...html.matchAll(/<img\b[^>]*>/gi)].map((m) => (m[0].match(/\s(?:data-src|src)=["']([^"']+)/i) || [])[1]).filter((x) => x && /pricecharting|\/uploads\/|card/i.test(x) && !/logo|brand|icon/i.test(x)))].slice(0, 60);
          let l = 0, n = 0;
          for (const x of list) {
            try {
              const z = await probe(Buffer.from(await (await fetch(new URL(x, u).href, { headers: UA })).arrayBuffer()));
              if (!z) { bad++; continue; }
              n++; if (z[0] > z[1]) l++;
            } catch { bad++; }
          }
          sets++; imgs += n; land += l;
          if (l) worst.push(`${l}/${n} ${u} ${title.slice(0, 50)}`);
        } catch {}
      }));
    }
    console.log(`[img-crawl] scanned=${scanned} matched_sets=${sets} images=${imgs} landscape=${land} bad=${bad}`);
    for (const w of worst.sort().slice(0, 20)) console.log(`[img-crawl] WORST ${w}`);
  } catch (e) {
    console.log(`[img-crawl] error ${String(e.message || e).slice(0, 150)}`);
  }
});

// POST /img-ascii {urls[], cols=48} -> log image size + coarse luminance map (for checking orientation when we cannot view the image)
app.post("/img-ascii", auth, async (req, res) => {
  const urls = (req.body.urls || []).slice(0, 8);
  const cols = Math.min(80, Math.max(20, Number(req.body.cols) || 48));
  res.json({ ok: true });
  for (let i = 0; i < urls.length; i++) {
    try {
      const r = await fetch(urls[i], { headers: UA });
      const buf = Buffer.from(await r.arrayBuffer());
      const f = `${ASSET_DIR}/ascii-${Date.now()}-${i}.img`;
      await fs.writeFile(f, buf);
      const py = `import sys\nfrom PIL import Image\nfrom PIL import ImageOps\nim0=Image.open(sys.argv[1])\nex=im0.getexif().get(274)\nim=ImageOps.exif_transpose(im0).convert('L')\nw,h=im.size\nprint('EXIF',ex,'raw',im0.size,'after',im.size)\nc=int(sys.argv[2])\nr=max(1,int(c*h/w*0.5))\nsm=im.resize((c,r))\nch=' .:-=+*#%@'\nprint('SIZE',w,h)\nfor y in range(r):\n  print(''.join(ch[min(9,sm.getpixel((x,y))*10//256)] for x in range(c)))\n`;
      execFile("python3", ["-c", py, f, String(cols)], { maxBuffer: 1e7 }, (err, stdout) => {
        fs.unlink(f).catch(() => {});
        console.log(`[ascii] ${i} ${r.status} ${urls[i].slice(-24)} ${err ? "err " + err.message.slice(0, 120) : ""}`);
        for (const line of String(stdout).split("\n")) console.log(`[ascii] ${i}| ${line}`);
      });
    } catch (e) {
      console.log(`[ascii] ${i} error ${String(e.message || e).slice(0, 200)}`);
    }
  }
});


// POST /music-probe {titles[]} -> download incompetech mp3s, log duration, rough BPM and loudness
app.post("/music-probe", auth, async (req, res) => {
  const titles = (req.body.titles || []).slice(0, 30);
  res.json({ ok: true });
  const py = `import sys,subprocess,numpy as np\nf=sys.argv[1]\nraw=subprocess.run(['ffmpeg','-v','error','-i',f,'-t','60','-ac','1','-ar','11025','-f','s16le','-'],capture_output=True).stdout\nx=np.frombuffer(raw,dtype=np.int16).astype(float)\nif len(x)<11025*5: print('short');sys.exit()\nrms=np.sqrt((x**2).mean())\nh=512\nn=len(x)//h\ne=np.array([np.sqrt((x[i*h:(i+1)*h]**2).mean()) for i in range(n)])\nd=np.maximum(np.diff(e),0)\nd=d-d.mean()\nfr=11025/h\nac=np.correlate(d,d,'full')[len(d)-1:]\nlo=int(fr*60/200);hi=int(fr*60/70)\nk=lo+int(np.argmax(ac[lo:hi]))\nb=60*fr/k\nwhile b<110: b*=2\nwhile b>190: b/=2\nprint('bpm~%d rms=%d'%(b,rms))\n`;
  for (const t of titles) {
    try {
      const u = `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(t)}.mp3`;
      const r = await fetch(u, { headers: UA });
      if (!r.ok) { console.log(`[music] ${t} HTTP ${r.status}`); continue; }
      const f = `${ASSET_DIR}/probe-${Date.now()}.mp3`;
      await fs.writeFile(f, Buffer.from(await r.arrayBuffer()));
      const dur = (await execFileP("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f])).stdout.trim();
      const out = (await execFileP("python3", ["-c", py, f], { maxBuffer: 1e7 })).stdout.trim();
      fs.unlink(f).catch(() => {});
      console.log(`[music] ${t} dur=${Math.round(dur)}s ${out}`);
    } catch (e) { console.log(`[music] ${t} error ${String(e.message || e).slice(0, 150)}`); }
  }
  console.log("[music] done");
});


// POST /img-fix {url, name, exif=false, rot=0, flip=false} -> /assets/fix-<name>.jpg : upright, whole card on a portrait canvas (no crop)
app.post("/img-fix", auth, async (req, res) => {
  const { url, name } = req.body || {};
  const exif = req.body.exif ? "1" : "0";
  const rot = String(Number(req.body.rot) || 0);
  res.json({ ok: true });
  try {
    const r = await fetch(url, { headers: UA });
    const buf = Buffer.from(await r.arrayBuffer());
    const src = `${ASSET_DIR}/fixsrc-${name}.img`;
    const out = `${ASSET_DIR}/fix-${name}.jpg`;
    await fs.writeFile(src, buf);
    const py = `import sys\nfrom PIL import Image, ImageOps, ImageFilter, ImageDraw\nim=Image.open(sys.argv[1])\nif sys.argv[3]=='1': im=ImageOps.exif_transpose(im)\nim=im.convert('RGB')\nrot=int(sys.argv[4])\nif rot: im=im.rotate(-rot,expand=True)\nW,H=900,1256\nbg=ImageOps.fit(im,(W,H)).filter(ImageFilter.GaussianBlur(40))\nbg=Image.eval(bg,lambda v:int(v*0.45))\nsc=min((W-50)/im.width,(H-50)/im.height)\nfg=im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)\nbg.paste(fg,((W-fg.width)//2,(H-fg.height)//2))\nbg.save(sys.argv[2],quality=90)\nprint('ok',im.size,fg.size)\n`;
    const { stdout } = await execFileP("python3", ["-c", py, src, out, exif, rot], { maxBuffer: 1e7 });
    fs.unlink(src).catch(() => {});
    console.log(`[img-fix] ${name} ${stdout.trim()} -> /assets/fix-${name}.jpg`);
  } catch (e) { console.log(`[img-fix] ${name} error ${String(e.message || e).slice(0, 200)}`); }
});

// ---- Real footage from Wikimedia Commons (CC BY / PD only; credit in label + description) ----
// POST /clip-fetch {url, name} -> download an upload.wikimedia.org video to /assets/clipsrc-<name>.bin (log: size + duration)
app.post("/clip-fetch", auth, async (req, res) => {
  const { url } = req.body || {};
  const name = String(req.body?.name || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  if (!name || !/^https:\/\/(upload|commons)\.wikimedia\.org\//.test(String(url))) return res.status(400).json({ error: "need name + wikimedia url" });
  res.json({ ok: true });
  try {
    await fs.mkdir(ASSET_DIR, { recursive: true });
    const dest = path.join(ASSET_DIR, `clipsrc-${name}.bin`);
    let r;
    for (let i = 0; i < 6; i++) {
      r = await fetch(url, { headers: UA, redirect: "follow" });
      if (r.status !== 429 && r.status !== 503) break;
      await new Promise((ok) => setTimeout(ok, 8000 * (i + 1)));
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const { Readable } = await import("node:stream");
    const { pipeline } = await import("node:stream/promises");
    const fsn = await import("node:fs");
    await pipeline(Readable.fromWeb(r.body), fsn.createWriteStream(dest));
    const { stdout } = await execFileP("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "csv=p=0", dest]).catch((e) => ({ stdout: "probe-failed " + String(e.message).slice(0, 100) }));
    const st = await fs.stat(dest);
    console.log(`[clip] fetch ${name} ok bytes=${st.size} probe=${stdout.replace(/\s+/g, " ").trim()}`);
  } catch (e) { console.log(`[clip] fetch ${name} error ${String(e?.message || e).slice(0, 200)}`); }
});
// POST /clip-sheet {name, times:[sec...], width=240} -> contact sheet (base64 JPEG parts) in the log "[clip] sheet"
app.post("/clip-sheet", auth, async (req, res) => {
  const name = String(req.body?.name || "").replace(/[^a-z0-9-]/gi, "");
  const times = (Array.isArray(req.body?.times) ? req.body.times : []).slice(0, 24).map(Number);
  const width = Math.min(Number(req.body?.width) || 240, 400);
  res.json({ ok: true, n: times.length });
  try {
    const src = path.join(ASSET_DIR, `clipsrc-${name}.bin`);
    const frames = [];
    for (const [k, t] of times.entries()) {
      const fo = path.join(ASSET_DIR, `cs-${k}.jpg`);
      await execFileP("ffmpeg", ["-y", "-v", "error", "-ss", String(t), "-i", src, "-frames:v", "1", "-vf", `scale=${width}:-1`, "-q:v", "6", fo], { timeout: 60000 });
      frames.push(fo);
    }
    const out = path.join(ASSET_DIR, "cs-sheet.jpg");
    const cols = Math.min(6, frames.length);
    await execFileP("python3", ["-c", `import sys\nfrom PIL import Image, ImageDraw\nout,c=sys.argv[1],int(sys.argv[2])\nts=sys.argv[3].split(',')\nfs=sys.argv[4:]\nims=[Image.open(f) for f in fs]\nw,h=ims[0].size\nr=(len(ims)+c-1)//c\nS=Image.new('RGB',(w*c,h*r),'white')\nfor i,im in enumerate(ims):\n    S.paste(im,((i%c)*w,(i//c)*h)); ImageDraw.Draw(S).text(((i%c)*w+4,(i//c)*h+4),ts[i],fill=(255,255,0))\nS.save(out,quality=70)`, out, String(cols), times.join(","), ...frames], { timeout: 30000 });
    await fs.copyFile(out, path.join(OUT_DIR, `sheet-${name}.jpg`));
    console.log(`[clip] sheet saved -> ${PUBLIC_BASE_URL}/videos/sheet-${name}.jpg`);
    return;
    const b64 = (await fs.readFile(out)).toString("base64");
    const parts = Math.ceil(b64.length / 6000);
    console.log(`[clip] sheet meta ${name} ${JSON.stringify(times)} parts=${parts}`);
    for (let p = 0; p < parts; p++) console.log(`[clip] sheet ${p + 1}/${parts} ${b64.slice(p * 6000, (p + 1) * 6000)}`);
  } catch (e) { console.log(`[clip] sheet error ${String(e?.message || e).slice(0, 300)}`); }
});
// POST /clip-cut {name, start, dur=6, out, cx=0.5} -> /videos/clip-<out>.mp4 : vertical 720x1280 crop (cx = horizontal centre 0..1), no audio
app.post("/clip-cut", auth, async (req, res) => {
  const name = String(req.body?.name || "").replace(/[^a-z0-9-]/gi, "");
  const out = String(req.body?.out || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  const start = Math.max(0, Number(req.body?.start) || 0);
  const dur = Math.min(12, Math.max(1, Number(req.body?.dur) || 6));
  const cx = Math.min(1, Math.max(0, req.body?.cx === undefined ? 0.5 : Number(req.body.cx)));
  if (!name || !out) return res.status(400).json({ error: "need name + out" });
  res.json({ ok: true, url: `${PUBLIC_BASE_URL}/videos/clip-${out}.mp4` });
  try {
    const src = path.join(ASSET_DIR, `clipsrc-${name}.bin`);
    const dest = path.join(OUT_DIR, `clip-${out}.mp4`);
    const vf = `crop=floor(ih*9/16/2)*2:ih:max(0\\,min(iw-floor(ih*9/16/2)*2\\,iw*${cx}-ih*9/32)):0,scale=720:1280,fps=30,format=yuv420p`;
    await execFileP("ffmpeg", ["-y", "-v", "error", "-ss", String(start), "-i", src, "-t", String(dur), "-an", "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-movflags", "+faststart", dest], { timeout: 120000 });
    const st = await fs.stat(dest);
    console.log(`[clip] cut ${out} ok bytes=${st.size} -> /videos/clip-${out}.mp4`);
  } catch (e) { console.log(`[clip] cut ${out} error ${String(e?.message || e).slice(0, 300)}`); }
});

app.post("/echo", auth, (req, res) => {
  console.log(`[echo] ${JSON.stringify(req.body).slice(0, 20000)}`);
  res.json({ ok: true });
});

// ---- Wan 3.0 image-to-video via fal.ai (ต้องตั้ง FAL_KEY บนเซิร์ฟเวอร์) ----
// POST /wan-shot {image_url, prompt, duration=5, resolution="720p", aspect_ratio="adaptive", audio=false, tag?}
// ตอบทันทีด้วย {job}; ทำงานเบื้องหลัง แล้ว log "[wan] done <url>" / "[wan] fail ..."; ดูผลที่ GET /wan-status/:job
const wanJobs = new Map();
const FAL_I2V = "https://queue.fal.run/alibaba/wan-3.0/image-to-video";
const FAL_T2V = "https://queue.fal.run/alibaba/wan-3.0/text-to-video"; // ไม่มีภาพตั้งต้น: ใช้กับฉากทั่วไป (ทะเล/ไฟ/ท้องฟ้า) ที่ไม่มีตัวละครมีลิขสิทธิ์

async function falFetch(url, init = {}) {
  const r = await fetch(url, {
    ...init,
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const text = await r.text();
  let body; try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 500) }; }
  if (!r.ok) throw new Error(`fal ${r.status}: ${JSON.stringify(body).slice(0, 500)}`);
  return body;
}

async function runWanShot(id, input) {
  const job = wanJobs.get(id);
  const FAL_BASE = input.start_image_url ? FAL_I2V : FAL_T2V;
  try {
    const sub = await falFetch(FAL_BASE, { method: "POST", body: JSON.stringify(input) });
    job.request_id = sub.request_id;
    const statusUrl = sub.status_url || `${FAL_BASE}/requests/${sub.request_id}/status`;
    const resultUrl = sub.response_url || `${FAL_BASE}/requests/${sub.request_id}`;
    job.status = "queued";
    const t0 = Date.now();
    for (;;) {
      if (Date.now() - t0 > 20 * 60 * 1000) throw new Error("timeout waiting for fal");
      await new Promise((r) => setTimeout(r, 6000));
      const st = await falFetch(statusUrl);
      job.fal_status = st.status;
      if (st.status === "COMPLETED") break;
      if (st.status && !["IN_QUEUE", "IN_PROGRESS"].includes(st.status)) throw new Error(`fal status ${st.status}`);
    }
    const out = await falFetch(resultUrl);
    const vurl = out?.video?.url;
    if (!vurl) throw new Error(`no video url: ${JSON.stringify(out).slice(0, 300)}`);
    const file = `wan-${id}.mp4`;
    await downloadTo(vurl, path.join(OUT_DIR, file), MAX_CLIP_BYTES);
    job.status = "done";
    job.video_url = `${PUBLIC_BASE_URL}/videos/${file}`;
    job.fal_video = vurl;
    job.seconds = out.duration ?? input.duration;
    job.cost_usd = Math.round((job.seconds || 0) * ({ "480p": 0.05, "720p": 0.1, "1080p": 0.2 }[input.resolution] || 0.2) * 1000) / 1000;
    console.log(`[wan] done ${id} ${job.video_url} ${job.seconds}s ~$${job.cost_usd}`);
  } catch (e) {
    job.status = "failed";
    job.error = String(e?.message || e);
    console.error(`[wan] fail ${id} ${job.error}`);
  }
}

const WAN_MAX_SECONDS = 5;
app.post("/wan-shot", auth, (req, res) => {
  if (!process.env.FAL_KEY) return res.status(400).json({ error: "FAL_KEY is not set on the server" });
  const b = req.body || {};
  if (!b.image_url && !b.prompt) return res.status(400).json({ error: "image_url or prompt required" });
  const input = {
    ...(b.image_url ? { start_image_url: b.image_url } : {}),
    prompt: b.prompt || "",
    // กฎของ AK (18 ต.ค. 2026): ช็อตละไม่เกิน 5 วินาที และ 480p เท่านั้น เพื่อคุมค่าใช้จ่าย
    duration: Math.max(2, Math.min(WAN_MAX_SECONDS, Number(b.duration) || WAN_MAX_SECONDS)),
    resolution: "480p",
    aspect_ratio: b.aspect_ratio || "adaptive",
    audio: b.audio === true,
    enable_prompt_expansion: b.enable_prompt_expansion !== false,
  };
  if (b.end_image_url) input.end_image_url = b.end_image_url;
  if (Number.isInteger(b.seed)) input.seed = b.seed;
  const id = `${(b.tag || "shot").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "shot"}-${Date.now().toString(36)}`;
  wanJobs.set(id, { id, status: "submitting", created: new Date().toISOString(), input });
  runWanShot(id, input);
  console.log(`[wan] start ${id} ${input.resolution} ${input.duration}s`);
  res.json({ ok: true, job: id });
});

app.get("/wan-status/:id", auth, (req, res) => {
  const j = wanJobs.get(req.params.id);
  if (!j) return res.status(404).json({ error: "not found" });
  res.json(j);
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

// อ่านสถิติจาก Zernio แบบอ่านอย่างเดียว (รายงานประจำสัปดาห์): GET /zernio-get?path=/analytics...  (อนุญาตเฉพาะ /analytics และ /accounts)
app.get("/zernio-get", auth, async (req, res) => {
  const p = String(req.query.path || "");
  let out;
  if (!/^\/(analytics|accounts)(\/|\?|$)/.test(p) || p.includes("..")) {
    out = { error: "path must start with /analytics or /accounts" };
  } else {
    try {
      out = await zernio(p);
    } catch (e) {
      out = { error: String(e?.message || e) };
    }
  }
  const tag = String(req.query.tag || "");
  // compact=1: ย่อโพสต์ให้เหลือแค่ตัวเลข (log ไม่ถูกตัด)
  if (req.query.compact && out && Array.isArray(out.posts)) {
    out = { overview: out.overview, pagination: out.pagination, posts: out.posts.map((x) => ({ id: x._id, platformPostId: x.platformPostId || (x.platforms || [])[0]?.platformPostId, platform: x.platform || (x.platforms || [])[0]?.platform, at: x.publishedAt || x.scheduledFor, text: String(x.content || "").slice(0, 70), url: x.platformPostUrl || (x.platforms || [])[0]?.platformPostUrl, a: x.analytics })) };
  }
  console.log(`[zernio-get] ${tag} ${p} ${JSON.stringify(out).slice(0, 15000)}`);
  res.json(out);
});

// ทดสอบการออกเสียง: POST /tts-test {texts:[...]} → /videos/tts-test-<n>.mp3 (เสียงเดียวกับคลิป ไม่แปลงคำ)
app.post("/tts-test", auth, async (req, res) => {
  const tts = { voice_id: "bTEswxYhpv7UDkQg5VRu", model_id: "eleven_v4", stability: 0.8, speed: 1.2, prefix: "[calm, soft, natural storyteller]", ...(req.body?.tts || {}) };
  const out = [];
  for (const [i, t0] of (Array.isArray(req.body?.texts) ? req.body.texts.slice(0, 8) : []).entries()) {
    // t0 = "ข้อความ" หรือ {text, tts:{...override}, name} เพื่อเทียบสไตล์เสียงหลายแบบ
    const t = typeof t0 === "object" ? t0.text : t0;
    const one = typeof t0 === "object" && t0.tts ? { ...tts, ...t0.tts } : tts;
    try {
      const name = typeof t0 === "object" && t0.name ? `tts-test-${String(t0.name).replace(/[^a-z0-9-]/gi, "")}.mp3` : `tts-test-${i + 1}.mp3`;
      await ttsToFile(String(t), path.join(OUT_DIR, name), one, true);
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
// ย้ายคลิปที่ยังค้างในคิวแบบร่าง ไปตั้งเวลาโพสต์ตรง: POST /tiktok-queue-migrate
app.post("/tiktok-queue-migrate", auth, async (req, res) => {
  const q = await readTtQueue();
  const out = [];
  for (const it of q) {
    if (it.sent_at) continue;
    if (!(Date.parse(it.at) > Date.now() + 10 * 60 * 1000)) { out.push({ file: it.file, at: it.at, skipped: "time too close or past" }); continue; }
    try {
      const r = await postTikTok(it.video_url, it.meta || {}, it.at);
      it.direct = true; it.sent_at = new Date().toISOString(); it.post_id = r?.post?._id;
      out.push({ file: it.file, at: it.at, post_id: it.post_id, status: r?.post?.status });
    } catch (e) {
      out.push({ file: it.file, at: it.at, error: String(e?.message || e) });
    }
  }
  await writeTtQueue(q);
  console.log(`[tiktok-migrate] ${JSON.stringify(out)}`);
  res.json(out);
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
      // โหลดภาพการ์ดมาเก็บในเซิร์ฟเวอร์ก่อน (เว็บทางการบล็อก Chrome ที่โหลดตรง) แล้วให้ Chrome ใช้ลิงก์ของเราแทน
      let thumbImg = tm.image_url;
      try {
        const sdir = path.join(ASSET_DIR, `thumb-src-${Date.now().toString(36)}`);
        await fs.mkdir(sdir, { recursive: true });
        thumbImg = `${PUBLIC_BASE_URL}/assets/${path.basename(sdir)}/${await downloadImage(String(tm.image_url), sdir, "img")}`;
      } catch (e) { console.warn(`[thumb-files] image download failed, using remote: ${e?.message || e}`); }
      const thumbProps = { image_url: thumbImg, hook: tm.hook, badge: tm.badge, sub: tm.sub, width: 1080, height: 1920 };
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

// ภาพสไลด์โพสต์ (คนดัง+การ์ดจริง): POST /carousel {id, slides:[{photo_url,card_url,year,code,name,price,caption,card_pos}]} -> /videos/carousel-<id>-N.jpg
app.post("/carousel", auth, async (req, res) => {
  const id = String(req.body?.id || Date.now().toString(36)).replace(/[^a-z0-9-]/gi, "").slice(0, 40);
  const slides = (Array.isArray(req.body?.slides) ? req.body.slides : []).slice(0, 10);
  res.json({ ok: true, id, n: slides.length });
  const out = [];
  for (let i = 0; i < slides.length; i++) {
    try {
      const s = slides[i] || {};
      const sdir = path.join(ASSET_DIR, `car-${id}-${i}`);
      await fs.mkdir(sdir, { recursive: true });
      const local = async (u, b) => (u ? `${PUBLIC_BASE_URL}/assets/${path.basename(sdir)}/${await downloadImage(String(u), sdir, b)}` : undefined);
      const props = {
        photo_url: await local(s.photo_url, "photo"),
        card_url: await local(s.card_url, "card"),
        card_pos: ["bottom-left", "center", "bottom-right"].includes(s.card_pos) ? s.card_pos : "bottom-right",
        year: s.year, code: s.code, name: s.name, price: s.price, caption: s.caption,
        index: i + 1, total: slides.length, width: 1080, height: 1920,
      };
      const comp = await selectComposition({ serveUrl, id: "CarouselSlide", inputProps: props });
      const outName = `carousel-${id}-${i + 1}.jpg`;
      await renderStill({ composition: comp, serveUrl, output: path.join(OUT_DIR, outName), imageFormat: "jpeg", jpegQuality: 92, inputProps: props });
      out.push(`${PUBLIC_BASE_URL}/videos/${outName}`);
    } catch (e) { out.push({ slide: i + 1, error: String(e?.message || e).slice(0, 200) }); }
  }
  console.log(`[carousel] ${id} ${JSON.stringify(out)}`);
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
// charizard reel script added
