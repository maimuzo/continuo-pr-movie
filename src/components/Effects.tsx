import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 中心から外へ伸びる集中線。驚いた瞬間に使う
export const ConcentrationLines: React.FC<{ cx: number; cy: number; size?: number }> = ({ cx, cy, size = 1600 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 3, 18], [0, 1, 0], clamp);
  const lines = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2 + (i % 2) * 0.05;
    const r1 = 220 + ((i * 53) % 80);
    return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * size} y2={cy + Math.sin(a) * size} stroke={theme.color.ink} strokeWidth={i % 3 === 0 ? 6 : 3} />;
  });
  return <svg style={{ position: "absolute", inset: 0, opacity: o }} width="100%" height="100%">{lines}</svg>;
};

// びっくりマーク
export const Exclamation: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 4, 8], [0, 1.3, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 120, color: theme.color.highlight, WebkitTextStroke: `10px ${theme.color.ink}`, paintOrder: "stroke fill" }}>
      !
    </div>
  );
};

// 横向きのスピード線。direction は 1 で右へ動いているときの線
export const SpeedLines: React.FC<{ x: number; y: number; width: number; height: number; direction?: 1 | -1 }> = ({ x, y, width, height, direction = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <svg style={{ position: "absolute", left: x, top: y }} width={width} height={height}>
      {Array.from({ length: 7 }, (_, i) => {
        const yy = (height / 8) * (i + 1);
        const len = width * (0.4 + ((i * 37) % 50) / 100);
        const shift = ((frame * 40 + i * 70) % width) * direction;
        const x1 = direction === 1 ? width - len - (shift % 40) : shift % 40;
        return <line key={i} x1={x1} y1={yy} x2={x1 + len} y2={yy} stroke={theme.color.ink} strokeWidth={4} strokeLinecap="round" opacity={0.7} />;
      })}
    </svg>
  );
};

// 汗のしずく
export const Sweat: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const frame = useCurrentFrame();
  const dy = (frame * 3) % 30;
  return (
    <svg style={{ position: "absolute", left: x, top: y + dy, transform: `scale(${scale})` }} width={40} height={56} viewBox="0 0 40 56">
      <path d="M20 2 C28 18 36 28 36 38 A16 16 0 0 1 4 38 C4 28 12 18 20 2 Z" fill="#9FD8F5" stroke={theme.color.ink} strokeWidth={4} />
    </svg>
  );
};

// マグカップの湯気
export const Steam: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  return (
    <svg style={{ position: "absolute", left: x, top: y }} width={120} height={160}>
      {[0, 1, 2].map((i) => {
        const rise = ((frame * 2 + i * 30) % 90);
        const op = interpolate(rise, [0, 20, 90], [0, 0.9, 0]);
        return <path key={i} d={`M${30 + i * 30} ${150 - rise} q -14 -20 0 -40 q 14 -20 0 -40`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={op} />;
      })}
    </svg>
  );
};

// 鼻ちょうちん。ふくらんだり縮んだりする
export const SnotBubble: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const r = 18 + Math.sin(frame / 6) * 10;
  return (
    <svg style={{ position: "absolute", left: x - 40, top: y - 40 }} width={80} height={80}>
      <circle cx={40} cy={40} r={r} fill="rgba(170,220,255,0.6)" stroke={theme.color.ink} strokeWidth={3} />
      <circle cx={40 - r / 3} cy={40 - r / 3} r={r / 5} fill="#FFFFFF" />
    </svg>
  );
};

// きらり
export const Sparkle: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 5, 12], [0, 1.4, 0.9], clamp);
  return (
    <svg style={{ position: "absolute", left: x, top: y, transform: `scale(${s}) rotate(${frame * 3}deg)` }} width={90} height={90} viewBox="-45 -45 90 90">
      <path d="M0 -42 L9 -9 L42 0 L9 9 L0 42 L-9 9 L-42 0 L-9 -9 Z" fill={theme.color.highlight} stroke={theme.color.ink} strokeWidth={4} />
    </svg>
  );
};

// 「くしゃ」の線
export const CrumpleMarks: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg style={{ position: "absolute", left: x, top: y }} width={140} height={90}>
    {[[10, 20, 30, 8], [60, 4, 64, 0], [110, 20, 128, 8], [20, 70, 4, 82], [116, 70, 134, 82]].map(([a, b, c, d], i) => (
      <line key={i} x1={a} y1={b} x2={c} y2={d} stroke={theme.color.ink} strokeWidth={5} strokeLinecap="round" />
    ))}
  </svg>
);
