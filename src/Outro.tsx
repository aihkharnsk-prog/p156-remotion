import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

// ภาพปิดท้ายสปอนเซอร์: พื้นหลัง public/outro_bg.png + การ์ดจริงเรียงเป็นพัดเหนือโต๊ะ
export type OutroProps = { cards: string[] };
export const defaultOutroProps: OutroProps = { cards: [] };

export const Outro: React.FC<OutroProps> = ({ cards }) => {
  const n = cards.length;
  const cw = n >= 5 ? 250 : 280;
  const spread = n >= 5 ? 13 : 16;
  return (
    <AbsoluteFill>
      <Img src={staticFile("outro_bg.png")} style={{ width: 1080, height: 1920 }} />
      {cards.map((src, i) => {
        const k = i - (n - 1) / 2;
        const isCenter = Math.abs(k) < 0.01;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 540 - cw / 2 + k * 150,
              top: 735 + Math.abs(k) * 28,
              width: cw,
              transformOrigin: "50% 130%",
              transform: `rotate(${k * spread}deg) scale(${isCenter ? 1.12 : 1})`,
              zIndex: isCenter ? 10 : 5 - Math.abs(Math.round(k)),
              filter:
                "drop-shadow(0 0 26px rgba(255,201,72,0.75)) drop-shadow(0 22px 26px rgba(0,0,0,0.75))",
            }}
          >
            <Img
              src={src}
              style={{ width: "100%", display: "block", borderRadius: 14, border: "6px solid #fff", background: "#fff" }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
