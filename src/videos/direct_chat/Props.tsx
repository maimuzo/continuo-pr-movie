import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";

const INK = theme.color.ink;

// issue のコメント1つ。頭に書いた人の丸（色で誰かを示す）と名前の線、本文の2行。文字は書かない。
// (x, y) は真ん中。color は書いた人の色（開発者は紺、Claude Code はテラコッタ）
export const COMMENT_SIZE = { w: 150, h: 96 };
export const CommentCard: React.FC<{ x: number; y: number; color: string; scale?: number; rotate?: number; opacity?: number }> = ({
  x,
  y,
  color,
  scale = 1,
  rotate = 0,
  opacity = 1,
}) => (
  <svg
    width={COMMENT_SIZE.w}
    height={COMMENT_SIZE.h}
    viewBox="0 0 150 96"
    style={{ position: "absolute", left: x - 75, top: y - 48, transform: `scale(${scale}) rotate(${rotate}deg)`, opacity, overflow: "visible" }}
  >
    <rect x={3} y={3} width={144} height={90} rx={12} fill="#FFFFFF" stroke={INK} strokeWidth={5} />
    <path d="M3 34 H147" stroke={INK} strokeWidth={3} />
    <path d="M15 3 H135 A12 12 0 0 1 147 15 V34 H3 V15 A12 12 0 0 1 15 3 Z" fill="#F1EBE0" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={22} cy={19} r={9} fill={color} stroke={INK} strokeWidth={3} />
    <rect x={38} y={14} width={52} height={10} rx={5} fill="#8A8278" />
    <rect x={16} y={48} width={112} height={10} rx={5} fill="#B8B0A4" />
    <rect x={16} y={68} width={74} height={10} rx={5} fill="#B8B0A4" />
  </svg>
);

// 絡まったコメントの山。tangle が 1 のとき、コメントが傾いて重なり、上に黒い糸がぐしゃぐしゃに絡む。
// tangle が 0 に近づくと糸が消え、コメントが縦にきれいに並ぶ。shown は見えているコメントの数（降ってくる途中を描くため）。
// (x, y) は山の真ん中
const PILE = [
  { dx: -46, dy: 30, r: -18, who: 0 },
  { dx: 40, dy: 22, r: 14, who: 1 },
  { dx: -10, dy: -10, r: 8, who: 0 },
  { dx: 54, dy: -30, r: -22, who: 1 },
  { dx: -58, dy: -40, r: 26, who: 0 },
  { dx: 6, dy: -62, r: -10, who: 1 },
];
export const PILE_COLORS = ["#2D3E66", "#D97757"];
export const CommentPile: React.FC<{ x: number; y: number; tangle: number; shown?: number; scale?: number }> = ({
  x,
  y,
  tangle,
  shown = PILE.length,
  scale = 1,
}) => {
  const f = useCurrentFrame();
  const wobble = Math.sin(f / 3) * 3 * tangle;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      {PILE.slice(0, Math.ceil(shown)).map((c, i) => {
        // ほどけると、左右2列に3つずつきれいに並ぶ
        const neat = { dx: (i % 2 === 0 ? -1 : 1) * 82, dy: -70 + Math.floor(i / 2) * 70, r: 0 };
        const k = tangle;
        const drop = Math.min(1, shown - i);
        return (
          <CommentCard
            key={i}
            x={neat.dx + (c.dx - neat.dx) * k + wobble * (i % 2 ? 1 : -1)}
            y={neat.dy + (c.dy - neat.dy) * k - (1 - drop) * 160}
            rotate={c.r * k}
            color={PILE_COLORS[c.who]}
            scale={0.9}
            opacity={drop}
          />
        );
      })}
      {tangle > 0.02 ? (
        <svg width={360} height={300} viewBox="-180 -150 360 300" style={{ position: "absolute", left: -180, top: -150, opacity: Math.min(1, tangle * 1.4), overflow: "visible" }}>
          <path
            d="M-130 -20 C -60 -120, 40 60, 110 -40 S 20 110, -70 40 S -40 -110, 60 -90 S 140 60, 30 70 S -150 60, -110 -60 S 80 -20, 130 30"
            fill="none"
            stroke={INK}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={1400}
            strokeDashoffset={1400 * (1 - Math.min(1, tangle))}
          />
        </svg>
      ) : null}
    </div>
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
