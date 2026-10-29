import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INK = theme.color.ink;

// 指示の紙に描く記号。文字を使わず、矢印・チェック・足す・行の4つで「次はこれ」を表す
export type SlipKind = "arrow" | "check" | "plus" | "lines";

const SlipIcon: React.FC<{ kind: SlipKind }> = ({ kind }) => {
  switch (kind) {
    case "arrow":
      return <path d="M22 40 H62 M50 26 L64 40 L50 54" fill="none" stroke={theme.color.cardTag} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />;
    case "check":
      return <path d="M24 40 L38 54 L62 26" fill="none" stroke="#3E9B4F" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />;
    case "plus":
      return <path d="M43 20 V60 M23 40 H63" fill="none" stroke="#E0554A" strokeWidth={10} strokeLinecap="round" />;
    default:
      return (
        <g stroke="#8A8278" strokeWidth={8} strokeLinecap="round">
          <line x1={22} y1={28} x2={64} y2={28} />
          <line x1={22} y1={42} x2={56} y2={42} />
          <line x1={22} y1={56} x2={46} y2={56} />
        </g>
      );
  }
};

// コンティがメガホンで飛ばす指示の紙。(x, y) は真ん中
export const InstructionSlip: React.FC<{ x: number; y: number; kind: SlipKind; scale?: number; rotate?: number; opacity?: number }> = ({
  x,
  y,
  kind,
  scale = 1,
  rotate = 0,
  opacity = 1,
}) => (
  <svg
    width={86}
    height={80}
    viewBox="0 0 86 80"
    style={{ position: "absolute", left: x - 43, top: y - 40, transform: `scale(${scale}) rotate(${rotate}deg)`, opacity }}
  >
    <rect x={4} y={4} width={78} height={72} rx={12} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
    <SlipIcon kind={kind} />
  </svg>
);

// メガホンの口から出る音の弧。出た瞬間に広がって消える
export const SoundArcs: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [0, 8], [0.7, 1.15], clamp);
  const o = interpolate(f, [0, 2, 10], [0, 1, 0], clamp);
  return (
    <svg width={140} height={180} style={{ position: "absolute", left: x, top: y - 90, opacity: o, transform: `scale(${grow})`, transformOrigin: "0 50%" }}>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${20 + i * 34} ${50 - i * 18} Q ${50 + i * 40} 90 ${20 + i * 34} ${130 + i * 18}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      ))}
    </svg>
  );
};

// チャックを閉めた印。ジグザグの線が左から右へ走る
export const ZipMark: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const w = interpolate(f, [0, 8], [0, 1], clamp);
  const o = interpolate(f, [8, 16], [1, 0], clamp);
  const pts = Array.from({ length: 9 }, (_, i) => `${i * 15},${i % 2 === 0 ? 0 : 14}`).join(" ");
  return (
    <svg width={140} height={30} style={{ position: "absolute", left: x, top: y, opacity: o }}>
      <defs>
        <clipPath id="zipclip">
          <rect x={0} y={-5} width={140 * w} height={40} />
        </clipPath>
      </defs>
      <polyline points={pts} transform="translate(6 8)" fill="none" stroke={theme.color.highlight} strokeWidth={6} strokeLinejoin="round" clipPath="url(#zipclip)" />
    </svg>
  );
};

// 吹き出しの中に描く記号。文字の代わりに、問い・ひらめき・コード・できた・きらりで会話の流れを見せる
export type BubbleKind = "question" | "idea" | "code" | "check" | "star";

const BubbleIcon: React.FC<{ kind: BubbleKind }> = ({ kind }) => {
  switch (kind) {
    case "question":
      return (
        <g fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
          <path d="M-22 -22 Q -22 -44 0 -44 Q 24 -44 24 -22 Q 24 -6 0 2 V 14" />
          <circle cx={0} cy={38} r={4} fill={INK} />
        </g>
      );
    case "idea":
      return (
        <g stroke={INK} strokeWidth={6} strokeLinejoin="round">
          <path d="M0 -46 A 30 30 0 0 1 18 8 V 20 H -18 V 8 A 30 30 0 0 1 0 -46 Z" fill={theme.color.highlight} />
          <rect x={-16} y={22} width={32} height={14} rx={4} fill="#B8B0A4" />
          {[-1, 0, 1].map((i) => (
            <line key={i} x1={i * 40} y1={-58 + Math.abs(i) * 20} x2={i * 52} y2={-70 + Math.abs(i) * 22} strokeLinecap="round" />
          ))}
        </g>
      );
    case "code":
      return (
        <g fill="none" stroke={theme.color.cardTag} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
          <path d="M-22 -26 L-46 0 L-22 26" />
          <path d="M22 -26 L46 0 L22 26" />
          <path d="M8 -32 L-8 32" stroke="#8A8278" />
        </g>
      );
    case "check":
      return <path d="M-36 0 L-10 26 L38 -28" fill="none" stroke="#3E9B4F" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return <path d="M0 -44 L10 -10 L44 0 L10 10 L0 44 L-10 10 L-44 0 L-10 -10 Z" fill={theme.color.highlight} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
  }
};

// 吹き出し。(x, y) は左上、tail は尻尾の先（画面の座標）。kind が変わるたびに中の記号が弾んで入れ替わる。
// stepFrame は今の記号が出たフレーム（この部品の頭から）
export const SpeechBubble: React.FC<{ x: number; y: number; w: number; h: number; tail: { x: number; y: number }; kind: BubbleKind; stepFrame: number }> = ({
  x,
  y,
  w,
  h,
  tail,
  kind,
  stepFrame,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - stepFrame, fps, config: { damping: 9, stiffness: 240 } });
  const cx = w / 2;
  const cy = h / 2;
  // 尻尾の根もとは、吹き出しの下の縁の、尻尾の先に近い側
  const baseX = Math.max(w * 0.25, Math.min(w * 0.75, tail.x - x));
  const tx = tail.x - x;
  const ty = tail.y - y;
  return (
    <svg width={w + 200} height={h + 200} style={{ position: "absolute", left: x - 100, top: y - 100, overflow: "visible" }}>
      <g transform="translate(100 100)">
        <path d={`M${baseX - 28} ${h - 20} L${tx} ${ty} L${baseX + 28} ${h - 24} Z`} fill="#FFFFFF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill="#FFFFFF" stroke={INK} strokeWidth={6} />
        {/* 尻尾の根もとの線を消す */}
        <path d={`M${baseX - 22} ${h - 24} L${baseX + 22} ${h - 27}`} stroke="#FFFFFF" strokeWidth={10} />
        <g transform={`translate(${cx} ${cy + 4}) scale(${pop})`}>
          <BubbleIcon kind={kind} />
        </g>
      </g>
    </svg>
  );
};

// 壁に掛けた大きな画面。Claude Code が動いている pane のつもりで、行が増えていく。ロゴは描かない。
// lines は見えている行の数（小数なら最後の行が伸びる途中）、done で最後にチェックの行を出す
const LINE_W = [0.55, 0.8, 0.4, 0.7, 0.62, 0.35, 0.75];
const LINE_C = ["#7FB3E8", "#E8C27F", "#C9A8EE", "#7FB3E8", "#A8D89A", "#E8C27F", "#7FB3E8"];
export const PaneScreen: React.FC<{ x: number; y: number; w: number; h: number; lines: number; done: boolean }> = ({ x, y, w, h, lines, done }) => {
  const f = useCurrentFrame();
  const innerW = w - 60;
  const shown = Math.min(LINE_W.length, lines);
  const cursorOn = Math.floor(f / 8) % 2 === 0;
  const lastY = 74 + Math.floor(shown) * 34;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ position: "absolute", inset: 0, background: "#3A3430", border: `6px solid ${INK}`, borderRadius: 18, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 18, top: 18, right: 18, bottom: 18, background: "#201C1A", border: `4px solid ${INK}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: 30, background: "#4A423C", borderBottom: `3px solid ${INK}`, display: "flex", alignItems: "center", gap: 8, paddingLeft: 12 }}>
          {["#E0554A", "#F2C14E", "#6BBF59"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, border: `2px solid ${INK}` }} />
          ))}
        </div>
        {Array.from({ length: Math.ceil(shown) }, (_, i) => {
          const part = Math.min(1, shown - i);
          return (
            <div
              key={i}
              style={{ position: "absolute", left: 24, top: 46 + i * 34, width: innerW * LINE_W[i] * part, height: 14, borderRadius: 7, background: LINE_C[i] }}
            />
          );
        })}
        {done ? (
          <svg width={60} height={50} style={{ position: "absolute", left: 22, top: lastY - 30 }}>
            <path d="M8 26 L22 40 L50 10" fill="none" stroke="#6BBF59" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <div style={{ position: "absolute", left: 24, top: lastY - 22, width: 16, height: 22, background: cursorOn ? "#F3E3C8" : "transparent" }} />
        )}
      </div>
    </div>
  );
};
