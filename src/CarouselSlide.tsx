import React from "react";
import { AbsoluteFill, Img, staticFile, delayRender, continueRender } from "remotion";

// สไลด์ภาพนิ่งสำหรับโพสต์แบบภาพสไลด์ (TikTok/Facebook/IG): รูปคนดัง/นักกีฬาเต็มจอ + การ์ดจริงซ้อน + ป้ายปี/รหัส/ชื่อ
export type CarouselSlideProps = {
  photo_url?: string; // ภาพพื้นหลังเต็มจอ (คนถือการ์ด / ฉากที่เกี่ยวข้อง)
  card_url?: string; // ภาพการ์ดจริงที่ซ้อน
  card_pos?: "bottom-right" | "bottom-left" | "center";
  year?: string; // เช่น "1999"
  code?: string; // เช่น "Base Set #4/102"
  name?: string; // ชื่อการ์ด/คน
  price?: string; // เช่น "$550,000"
  caption?: string; // ข้อความบน เช่น hook
  index?: number; // ลำดับสไลด์ (1-based)
  total?: number;
  width?: number;
  height?: number;
};

const FONT = "Kanit, Noto Sans Thai, Noto Sans, sans-serif";
let loaded: Promise<unknown> | null = null;
const loadFonts = () => {
  if (!loaded) {
    const faces = [["fonts/Kanit-Medium.ttf", "500"], ["fonts/Kanit-SemiBold.ttf", "600"]].map(([f, w]) => {
      const ff = new FontFace("Kanit", `url(${staticFile(f)})`, { weight: w });
      return ff.load().then((x) => (document as any).fonts.add(x));
    });
    loaded = Promise.all(faces).catch(() => null);
  }
  return loaded;
};

export const defaultCarouselProps: CarouselSlideProps = { year: "1999", code: "Base Set #4/102", name: "Charizard", index: 1, total: 6 };

export const CarouselSlide: React.FC<CarouselSlideProps> = (p) => {
  const [h0] = React.useState(() => delayRender("mitr"));
  React.useEffect(() => { loadFonts().then(() => continueRender(h0)); }, [h0]);
  const w = p.width ?? 1080, h = p.height ?? 1920;
  const cw = Math.round(w * (p.card_pos === "center" ? 0.62 : 0.46));
  const pos = p.card_pos ?? "bottom-right";
  const cardStyle: React.CSSProperties =
    pos === "center"
      ? { left: (w - cw) / 2, top: h * 0.2 }
      : pos === "bottom-left"
        ? { left: 48, bottom: h * 0.2 }
        : { right: 48, bottom: h * 0.2 };
  return (
    <AbsoluteFill style={{ background: "#0b0b1e", fontFamily: FONT, overflow: "hidden" }}>
      {p.photo_url ? <Img src={p.photo_url} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.78) 100%)" }} />
      {p.caption ? (
        <div style={{ position: "absolute", left: 48, right: 48, top: 110, color: "#fff", fontSize: 64, fontWeight: 600, lineHeight: 1.2, textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>{p.caption}</div>
      ) : null}
      {p.card_url ? (
        <Img src={p.card_url} style={{ position: "absolute", width: cw, borderRadius: 18, boxShadow: "0 18px 50px rgba(0,0,0,0.65)", border: "4px solid #fff", ...cardStyle }} />
      ) : null}
      <div style={{ position: "absolute", left: 48, right: 48, bottom: 150, display: "flex", flexDirection: "column", gap: 14 }}>
        {(p.year || p.code) && (
          <div style={{ alignSelf: "flex-start", background: "#ffd23f", color: "#1a1a1a", fontSize: 44, fontWeight: 600, padding: "6px 26px", borderRadius: 14 }}>
            {[p.year, p.code].filter(Boolean).join("  ·  ")}
          </div>
        )}
        {p.name ? <div style={{ color: "#fff", fontSize: 84, fontWeight: 600, lineHeight: 1.1, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>{p.name}</div> : null}
        {p.price ? <div style={{ color: "#4dff88", fontSize: 72, fontWeight: 600, textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>{p.price}</div> : null}
      </div>
      {p.total ? (
        <div style={{ position: "absolute", right: 48, bottom: 60, color: "rgba(255,255,255,0.85)", fontSize: 36, fontWeight: 500 }}>
          {p.index ?? 1}/{p.total} · cardzcenter.com
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
