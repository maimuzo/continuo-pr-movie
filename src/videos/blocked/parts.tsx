import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

// 詰まったらひとことの回だけで使う部品。どれも設定画にそろえて、太い輪郭線と平らな塗り、影1段で描く

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 霧。白い横長の丸を重ねた雲の塊。先に太い線の丸を全部描き、その上に白い丸を重ねて、外側だけに輪郭線を残す。
// (x, y) は塊の真ん中、width は幅。clear（0〜1）で、dir の向きへ流れながら薄れて晴れる
export const Fog: React.FC<{ x: number; y: number; width: number; clear?: number; dir?: 1 | -1; seed?: number }> = ({ x, y, width, clear = 0, dir = 1, seed = 0 }) => {
  const f = useCurrentFrame();
  const h = width * 0.45;
  // 丸の並び（塊の幅を 1 とした位置と半径）。下の段を大きく、上の段を小さく
  const puffs = [
    [0.12, 0.62, 0.17],
    [0.32, 0.66, 0.2],
    [0.55, 0.64, 0.21],
    [0.78, 0.63, 0.19],
    [0.92, 0.6, 0.13],
    [0.22, 0.38, 0.16],
    [0.45, 0.32, 0.2],
    [0.68, 0.36, 0.17],
    [0.86, 0.4, 0.12],
    [0.34, 0.16, 0.12],
    [0.58, 0.14, 0.13],
  ];
  const wob = (i: number) => Math.sin(f / 9 + i * 1.7 + seed) * width * 0.008;
  const drift = clear * width * 0.7 * dir;
  return (
    <svg
      width={width * 1.2}
      height={h * 1.2}
      viewBox={`${-width * 0.1} ${-h * 0.1} ${width * 1.2} ${h * 1.2}`}
      style={{
        position: "absolute",
        left: x - width / 2 + drift,
        top: y - h / 2 - clear * 40,
        opacity: 1 - clear,
        transform: `scale(${1 - clear * 0.35})`,
        overflow: "visible",
      }}
    >
      {puffs.map(([px, py, r], i) => (
        <ellipse key={`o${i}`} cx={px * width + wob(i)} cy={py * h} rx={r * width} ry={r * width * 0.72} fill={theme.color.ink} stroke={theme.color.ink} strokeWidth={14} />
      ))}
      {puffs.map(([px, py, r], i) => (
        <ellipse key={`s${i}`} cx={px * width + wob(i)} cy={py * h} rx={r * width} ry={r * width * 0.72} fill="#DCD8E4" />
      ))}
      {/* 影1段：白い丸を少し左上へずらして重ね、右下に影色を残す */}
      {puffs.map(([px, py, r], i) => (
        <ellipse key={`w${i}`} cx={px * width + wob(i) - r * width * 0.12} cy={py * h - r * width * 0.1} rx={r * width * 0.9} ry={r * width * 0.72 * 0.9} fill="#FFFFFF" />
      ))}
    </svg>
  );
};

// 霧の上に浮かべる小さな「？」。どちらの道も先が見えないことを示す
export const FogQuestion: React.FC<{ x: number; y: number; size?: number }> = ({ x, y, size = 70 }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + Math.sin(f / 8) * 6,
        transform: "translate(-50%, -50%)",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: size,
        color: "#9C97A8",
        WebkitTextStroke: `10px #FFFFFF`,
        paintOrder: "stroke fill",
      }}
    >
      ?
    </div>
  );
};

// 頭の上の大きな「？」。ぽんと弾んで出て、ゆらゆら揺れる
export const BigQuestion: React.FC<{ x: number; y: number; size?: number }> = ({ x, y, size = 150 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 9, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${pop}) rotate(${Math.sin(f / 6) * 8}deg)`,
        transformOrigin: "50% 100%",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        color: "#D97757",
        WebkitTextStroke: `16px ${theme.color.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      ?
    </div>
  );
};

// 積み木1個。(x, y) は左上、上の面に丸い突起を studs 個のせる。
// drop（0〜1）で飛んできて、着いた瞬間に横へ少し潰れる。from は飛び始める位置のずれ（既定は真上から落ちる）
export const ToyBlock: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  shade: string;
  studs?: number;
  drop?: number;
  from?: { dx: number; dy: number };
}> = ({ x, y, w, h, color, shade, studs = 2, drop = 1, from = { dx: 0, dy: -260 } }) => {
  if (drop <= 0) return null;
  const u = drop < 0.75 ? 1 - drop / 0.75 : 0; // 1 で飛び始め、0 で着く
  const fall = u * from.dy - Math.sin(u * Math.PI) * (from.dx === 0 ? 0 : 90);
  const side = u * from.dx;
  const squash = drop >= 0.75 ? Math.sin(((drop - 0.75) / 0.25) * Math.PI) * 0.12 : 0;
  const studW = Math.min(w / (studs * 1.8), 34);
  return (
    <svg
      width={w + 20}
      height={h + 30}
      style={{ position: "absolute", left: x - 10 + side, top: y - 20 + fall, opacity: Math.min(1, drop * 4), transform: `scale(${1 + squash}, ${1 - squash})`, transformOrigin: "50% 100%" }}
    >
      {Array.from({ length: studs }, (_, i) => {
        const cx = 10 + (w / studs) * (i + 0.5);
        return <rect key={i} x={cx - studW / 2} y={8} width={studW} height={16} rx={5} fill={color} stroke={theme.color.ink} strokeWidth={5} />;
      })}
      <rect x={10} y={20} width={w} height={h} rx={8} fill={color} stroke={theme.color.ink} strokeWidth={6} />
      <rect x={10 + w * 0.72} y={23} width={w * 0.28 - 3} height={h - 6} rx={5} fill={shade} />
    </svg>
  );
};

// 三角の屋根。(x, y) は左下。drop と from は積み木と同じ
export const ToyRoof: React.FC<{ x: number; y: number; w: number; h: number; drop?: number; from?: { dx: number; dy: number } }> = ({ x, y, w, h, drop = 1, from = { dx: 0, dy: -260 } }) => {
  if (drop <= 0) return null;
  const u = drop < 0.75 ? 1 - drop / 0.75 : 0;
  const fall = u * from.dy - Math.sin(u * Math.PI) * (from.dx === 0 ? 0 : 90);
  return (
    <svg width={w + 20} height={h + 20} style={{ position: "absolute", left: x - 10 + u * from.dx, top: y - h - 10 + fall, opacity: Math.min(1, drop * 4) }}>
      <path d={`M10 ${h + 10} L${w / 2 + 10} 10 L${w + 10} ${h + 10} Z`} fill="#E0604A" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
      <path d={`M${w / 2 + 10} 18 L${w + 2} ${h + 6} L${w / 2 + 14} ${h + 6} Z`} fill="#B84A3A" />
    </svg>
  );
};

// コメントの吹き出し。しっぽは左下
export const CommentBubble: React.FC<{ x: number; y: number; text: string; scale?: number; fontSize?: number }> = ({ x, y, text, scale = 1, fontSize = 54 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${scale})` }}>
    <div
      style={{
        position: "relative",
        padding: "10px 30px",
        background: "#FFFFFF",
        border: `6px solid ${theme.color.ink}`,
        borderRadius: 30,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize,
        color: theme.color.ink,
        whiteSpace: "nowrap",
      }}
    >
      {text}
      <svg width={40} height={30} style={{ position: "absolute", left: 26, bottom: -27 }}>
        <path d="M2 0 L10 26 L30 0" fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={4} y={0} width={24} height={5} fill="#FFFFFF" />
      </svg>
    </div>
  </div>
);

// マウスの矢印。(x, y) は矢印の先。press で少し縮む
export const Cursor: React.FC<{ x: number; y: number; press?: boolean; scale?: number }> = ({ x, y, press = false, scale = 1 }) => (
  <svg width={60} height={70} viewBox="0 0 30 36" style={{ position: "absolute", left: x - 4, top: y - 3, transform: `scale(${(press ? 0.88 : 1) * scale})`, transformOrigin: "4px 3px" }}>
    <path d="M3 2 L3 28 L10 22 L15 33 L20 31 L15 20 L25 20 Z" fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

// 衝突の星。ぶつかった瞬間にまわりへ散る
export const BumpStars: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 2, 16], [0, 1, 0], clamp);
  const r = interpolate(f, [0, 10], [30, 110], clamp);
  return (
    <svg width={300} height={300} style={{ position: "absolute", left: x - 150, top: y - 150, opacity: o }}>
      {[-150, -110, -70, -30].map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        const cx = 150 + Math.cos(a) * r;
        const cy = 150 + Math.sin(a) * r;
        const s = 16;
        const pts = Array.from({ length: 10 }, (_, k) => {
          const rr = k % 2 === 0 ? s : s * 0.45;
          const aa = (k / 10) * Math.PI * 2 - Math.PI / 2;
          return `${cx + Math.cos(aa) * rr},${cy + Math.sin(aa) * rr}`;
        }).join(" ");
        return <polygon key={i} points={pts} fill={theme.color.highlight} stroke={theme.color.ink} strokeWidth={4} strokeLinejoin="round" />;
      })}
    </svg>
  );
};
