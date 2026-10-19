import React from "react";
import { AbsoluteFill, Img, staticFile, delayRender, continueRender } from "remotion";

export type ThumbProps = {
  image_url?: string;
  hook?: string; // บรรทัดเด็ด ใช้ \n แบ่งบรรทัด
  badge?: string; // เช่น "#1"
  sub?: string; // บรรทัดเล็กใต้การ์ด
  accent_color?: string;
  width?: number;
  height?: number;
};

const FONT = "Kanit, Noto Sans Thai, Noto Sans CJK JP, Noto Sans, sans-serif";

// โหลดฟอนต์ Kanit (public/fonts) ก่อนถ่ายภาพ
let kanitLoaded: Promise<unknown> | null = null;
const loadKanit = () => {
  if (!kanitLoaded) {
    const faces = [
      ["fonts/Kanit-SemiBold.ttf", "600"],
      ["fonts/Kanit-Bold.ttf", "700"],
      ["fonts/Kanit-ExtraBold.ttf", "800"],
      ["fonts/Kanit-Black.ttf", "900"],
    ].map(([f, wgt]) => {
      const ff = new FontFace("Kanit", `url(${staticFile(f)})`, { weight: wgt });
      return ff.load().then((x) => (document as any).fonts.add(x));
    });
    kanitLoaded = Promise.all(faces).catch(() => null);
  }
  return kanitLoaded;
};

export const defaultThumbProps: ThumbProps = {
  hook: "ใบแรกที่\nคนไม่รู้",
  badge: "#1",
  sub: "เบื้องหลังการ์ด",
  accent_color: "#ffd23f",
};

export const Thumb: React.FC<ThumbProps> = (p) => {
  const [handle] = React.useState(() => delayRender("kanit"));
  React.useEffect(() => {
    loadKanit().then(() => continueRender(handle));
  }, [handle]);
  const w = p.width ?? 1080;
  const h = p.height ?? 1920;
  const m = Math.min(w, h);
  const acc = p.accent_color ?? "#ffd23f";
  const lines = (p.hook ?? "").split("\n");
  const rays = Array.from({ length: 24 }, (_, i) => i);
  const stroke = (px: number) =>
    `${-px}px ${-px}px 0 #000, ${px}px ${-px}px 0 #000, ${-px}px ${px}px 0 #000, ${px}px ${px}px 0 #000, 0 ${px * 2}px 0 #000`;
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 58%, #5b2bd6 0%, #2a1470 38%, #0a0b2a 78%)",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* รังสีพุ่งออกจากการ์ด */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${w / 2} ${h * 0.58})`}>
          {rays.map((i) => (
            <polygon
              key={i}
              points={`0,0 ${h * Math.cos(((i * 15 - 3) * Math.PI) / 180)},${h * Math.sin(((i * 15 - 3) * Math.PI) / 180)} ${h * Math.cos(((i * 15 + 3) * Math.PI) / 180)},${h * Math.sin(((i * 15 + 3) * Math.PI) / 180)}`}
              fill={i % 2 ? "rgba(255,210,63,0.13)" : "rgba(255,255,255,0.05)"}
            />
          ))}
        </g>
      </svg>
      {/* ประกาย */}
      {Array.from({ length: 28 }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: m * (0.006 + ((i * 7) % 5) * 0.003),
            height: m * (0.006 + ((i * 7) % 5) * 0.003),
            borderRadius: "50%",
            background: i % 3 ? "#fff" : acc,
            opacity: 0.8,
          }}
        />
      ))}
      {/* ข้อความเด็ด ด้านบน */}
      <div
        style={{
          position: "absolute",
          top: h * 0.055,
          left: 0,
          right: 0,
          textAlign: "center",
          transform: "rotate(-2deg)",
          zIndex: 20,
        }}
      >
        {lines.map((t, i) => {
          // ขนาดตัวอักษรพอดีความกว้าง ไม่ตัดบรรทัดกลางคำ (นับเฉพาะตัวอักษรหลัก ไม่นับสระบน/ล่าง วรรณยุกต์)
          const base = Array.from(String(t)).filter((ch: string) => !/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(ch)).length || 1;
          const fs = Math.min(m * (i === 0 ? 0.15 : 0.17), (w * 0.9) / (base * 0.62));
          return (
            <div
              key={i}
              style={{
                fontSize: fs,
                lineHeight: 1.18,
                fontWeight: 900,
                whiteSpace: "nowrap",
                color: i === 0 ? "#fff" : acc,
                textShadow: `${stroke(m * 0.008)}, 0 ${m * 0.02}px ${m * 0.03}px rgba(0,0,0,0.6)`,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      {/* การ์ด */}
      {p.image_url ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: h * 0.60,
            width: w * 0.66,
            zIndex: 5,
            transform: "translate(-50%,-50%) rotate(4deg)",
            filter: `drop-shadow(0 0 ${m * 0.05}px ${acc}) drop-shadow(0 ${m * 0.03}px ${m * 0.04}px rgba(0,0,0,0.7))`,
          }}
        >
          <Img src={p.image_url} style={{ width: "100%", borderRadius: m * 0.03, border: `${m * 0.012}px solid #fff` }} />
        </div>
      ) : null}
      {/* ป้ายเลขใบ: ถ้ามีช่องว่าง เช่น "SPORTS #2" แยกเป็นป้ายเล็กบน + เลขใหญ่ล่าง ให้พอดีวง */}
      {p.badge ? (() => {
        const bs = String(p.badge).trim();
        const k = bs.lastIndexOf(" ");
        const label = k > 0 ? bs.slice(0, k) : "";
        const num = k > 0 ? bs.slice(k + 1) : bs;
        return (
          <div
            style={{
              position: "absolute",
              zIndex: 25,
              left: w * 0.05,
              top: h * 0.415,
              width: m * 0.25,
              height: m * 0.25,
              borderRadius: "50%",
              background: `radial-gradient(circle at 30% 25%, #fff6c9, ${acc} 55%)`,
              border: `${m * 0.01}px solid #000`,
              boxShadow: `0 ${m * 0.012}px ${m * 0.03}px rgba(0,0,0,0.6)`,
              color: "#111",
              fontWeight: 900,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              transform: "rotate(-10deg)",
            }}
          >
            {label ? <div style={{ fontSize: m * 0.04, letterSpacing: m * 0.003, whiteSpace: "nowrap" }}>{label}</div> : null}
            <div style={{ fontSize: m * (label ? 0.1 : 0.11), whiteSpace: "nowrap" }}>{num}</div>
          </div>
        );
      })() : null}
      {/* แถบล่าง */}
      <div
        style={{
          position: "absolute",
          bottom: h * 0.06,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(0,0,0,0.65)",
            border: `${m * 0.005}px solid ${acc}`,
            color: "#fff",
            fontWeight: 800,
            fontSize: m * 0.052,
            padding: `${m * 0.014}px ${m * 0.04}px`,
            borderRadius: m * 0.05,
          }}
        >
          {p.sub ?? ""} · <span style={{ color: acc }}>CARDZ CENTER</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
