import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
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

async function downloadTo(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`download ${res.status}: ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
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
      inputProps = {
        slides: job.request.slides,
        width: job.request.width,
        height: job.request.height,
      };

      // ดาวน์โหลดเสียงมาเก็บในเครื่องก่อน (Google Drive redirect ตอน render ไม่เสถียร)
      if (job.request.audio_url) {
        await fs.mkdir(assetDir, { recursive: true });
        const local = path.join(assetDir, "voice.mp3");
        await downloadTo(job.request.audio_url, local);
        inputProps.audio_url = `http://127.0.0.1:${PORT}/assets/${job.id}/voice.mp3`;
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

    job.status = "done";
    job.progress = 100;
    job.video_url = publicVideoUrl(job.id);
    job.finished_at = new Date().toISOString();
    await postWebhook(job.request.webhook_url, {
      job_id: job.id,
      status: "done",
      video_url: job.video_url,
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

app.use("/videos", express.static(OUT_DIR));
app.use("/assets", express.static(ASSET_DIR));

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
    for (const [i, s] of slides.entries()) {
      const duration = Number(s.duration);
      if (!s.image_url || !(duration > 0)) {
        return res
          .status(400)
          .json({ error: `slide ${i}: need image_url and duration (seconds) > 0` });
      }
      clean.push({
        image_url: String(s.image_url),
        text: s.text ? String(s.text) : undefined,
        duration,
      });
    }
  }

  const id = randomUUID();
  const job = {
    id,
    status: "queued",
    progress: 0,
    created_at: new Date().toISOString(),
    request: {
      composition,
      slides: composition === "DynamicStory" ? clean : undefined,
      shots: composition === "DramaStory" ? clean : undefined,
      music_url: body.music_url || undefined,
      audio_url: body.audio_url || undefined,
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

app.get("/status/:id", auth, (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "not found" });
  const { request, ...pub } = job;
  res.json(pub);
});

app.listen(PORT, () => console.log(`[server] listening on ${PORT}`));
