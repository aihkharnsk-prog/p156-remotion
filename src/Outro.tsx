import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

// ภาพปิดท้ายสปอนเซอร์: พื้นหลัง public/outro_bg.png + การ์ดจริงแบบ 3D
// ถ้ามี pop (ภาพตัวละครที่ตัดพื้นหลังแล้ว) ตัวละครจะโผล่ทะลุกรอบรูปออกมานอกการ์ด
export type OutroCard = { src: string; pop?: string; art?: number[] };
export type OutroProps = { cards: (OutroCard | string)[] };
export const defaultOutroProps: OutroProps = { cards: [] };

const CardPop: React.FC<{ c: OutroCard; w: number; front: boolean }> = ({ c, w, front }) => {
  const [x0, y0, x1, y1] = c.art ?? [0, 0, 1, 1];
  const h = w * 1.396;
  const popScale = front ? 1.42 : 1.32;
  return (
    <div style={{ position: "relative", width: w, height: h, transformStyle: "preserve-3d" }}>
      {/* ขอบหนาของการ์ด (ชั้นหลัง) */}
      {[10, 7, 4].map((d) => (
        <div
          key={d}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            background: d === 10 ? "#5a5f7a" : "#c9cde0",
            transform: `translateZ(${-d}px) translate(${d * 0.6}px, ${d * 0.8}px)`,
          }}
        />
      ))}
      <Img
        src={c.src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 16,
          border: "6px solid #fff",
          boxSizing: "border-box",
          background: "#fff",
        }}
      />
      {/* แสงสะท้อนเคลือบเงา */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          background:
            "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.38) 45%, rgba(255,255,255,0) 58%), linear-gradient(200deg, rgba(120,200,255,0.18), rgba(255,120,220,0.12))",
          mixBlendMode: "screen",
        }}
      />
      {c.pop ? (
        <>
          {/* ทำให้ภาพเดิมในกรอบจางลง ตัวที่โผล่ออกมาจะเด่นแทน */}
          <div
            style={{
              position: "absolute",
              left: `${x0 * 100}%`,
              top: `${y0 * 100}%`,
              width: `${(x1 - x0) * 100}%`,
              height: `${(y1 - y0) * 100}%`,
              background: "radial-gradient(circle at 50% 70%, rgba(10,12,40,0.25), rgba(10,12,40,0.7))",
            }}
          />
          <Img
            src={c.pop}
            style={{
              position: "absolute",
              left: `${x0 * 100}%`,
              top: `${y0 * 100}%`,
              width: `${(x1 - x0) * 100}%`,
              height: `${(y1 - y0) * 100}%`,
              transformOrigin: "50% 100%",
              transform: `translateZ(70px) scale(${popScale})`,
              filter:
                "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 18px 18px rgba(0,0,0,0.65)) drop-shadow(0 0 22px rgba(255,201,72,0.55))",
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export const Outro: React.FC<OutroProps> = ({ cards }) => {
  const list: OutroCard[] = cards.map((c) => (typeof c === "string" ? { src: c } : c));
  const n = list.length;
  const cw = n >= 5 ? 236 : 270;
  const spread = n >= 5 ? 12 : 15;
  return (
    <AbsoluteFill>
      <Img src={staticFile("outro_bg.png")} style={{ width: 1080, height: 1920 }} />
      <div style={{ position: "absolute", inset: 0, perspective: 1600, perspectiveOrigin: "50% 45%" }}>
        {list.map((c, i) => {
          const k = i - (n - 1) / 2;
          const front = Math.abs(k) < 0.01;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 540 - cw / 2 + k * 158,
                top: 760 + Math.abs(k) * 34,
                width: cw,
                transformStyle: "preserve-3d",
                transformOrigin: "50% 120%",
                transform: `rotateZ(${k * spread}deg) rotateY(${-k * 14}deg) rotateX(8deg) scale(${front ? 1.14 : 1})`,
                zIndex: front ? 10 : 5 - Math.abs(Math.round(k)),
                filter: "drop-shadow(0 26px 30px rgba(0,0,0,0.7)) drop-shadow(0 0 22px rgba(255,201,72,0.45))",
              }}
            >
              <CardPop c={c} w={cw} front={front} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
