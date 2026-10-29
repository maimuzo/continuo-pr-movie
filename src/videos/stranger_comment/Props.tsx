import React from "react";
import { theme } from "../../theme";
import { ROLE_COLOR } from "./Comments";

// 箱と指示書。どちらも Remotion で、設定画と同じ太い線・影1段の平らな塗りで描く

export const BOX = { w: 245, h: 200, lip: 46 };

// 箱の奥（口の内側）。紙はこの上に重ね、そのあと BoxFront で隠すと「中へしまう」に見える
export const BoxBack: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width={BOX.w + 20} height={BOX.lip + 20} style={{ position: "absolute", left: x - 10, top: y - 10 }}>
    <path d={`M14 ${BOX.lip + 8} L34 12 L${BOX.w - 14} 12 L${BOX.w + 6} ${BOX.lip + 8} Z`} fill="#6E4A2C" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

// 箱の手前の面。印（チェックか目）と、何の箱かの字
export const BoxFront: React.FC<{ x: number; y: number; mark: "check" | "eye"; label: string; glow?: number }> = ({ x, y, mark, label, glow = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y + BOX.lip, width: BOX.w, height: BOX.h - BOX.lip }}>
    <svg width={BOX.w} height={BOX.h - BOX.lip} style={{ position: "absolute", inset: 0 }}>
      <rect x={3} y={3} width={BOX.w - 6} height={BOX.h - BOX.lip - 6} rx={10} fill={mark === "check" ? "#C98A4E" : "#D7A86E"} stroke={theme.color.ink} strokeWidth={6} />
      <rect x={3} y={BOX.h - BOX.lip - 30} width={BOX.w - 6} height={27} rx={8} fill={mark === "check" ? "#A8703B" : "#B98A52"} />
      <rect x={3} y={3} width={BOX.w - 6} height={BOX.h - BOX.lip - 6} rx={10} fill="none" stroke={theme.color.ink} strokeWidth={6} />
      {mark === "check" ? (
        <path d="M30 58 L52 80 L92 32" fill="none" stroke="#3E7D4A" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g transform="translate(60 56)">
          <path d="M-42 0 Q0 -36 42 0 Q0 36 -42 0 Z" fill="#FFF8EA" stroke={theme.color.ink} strokeWidth={6} />
          <circle cx={0} cy={0} r={13} fill={theme.color.ink} />
        </g>
      )}
      {glow > 0 ? <rect x={3} y={3} width={BOX.w - 6} height={BOX.h - BOX.lip - 6} rx={10} fill="none" stroke={theme.color.highlight} strokeWidth={10 * glow} opacity={glow} /> : null}
    </svg>
    {/* 字は箱の下に札で下げる。箱の面に詰めると小さくて読めない */}
    <div
      style={{
        position: "absolute",
        left: BOX.w / 2,
        top: BOX.h - BOX.lip - 8,
        transform: "translateX(-50%)",
        padding: "2px 16px",
        background: theme.color.paper,
        border: `5px solid ${theme.color.ink}`,
        borderRadius: 12,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 36,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        color: theme.color.ink,
      }}
    >
      {label}
    </div>
  </div>
);

const Pill: React.FC<{ role: "OWNER" | "MEMBER" }> = ({ role }) => (
  <span
    style={{
      display: "inline-block",
      padding: "0 12px",
      margin: "0 4px",
      borderRadius: 999,
      border: `4px solid ${theme.color.ink}`,
      background: ROLE_COLOR[role],
      fontSize: 28,
      lineHeight: 1.25,
      verticalAlign: "middle",
    }}
  >
    {role}
  </span>
);

// 指示書。コンティが Claude Code に渡す紙。tail は吹き出しのしっぽを出す向き（左下の点の x）
export const RuleSheet: React.FC<{ x: number; y: number; scale?: number; tailTo?: { x: number; y: number } }> = ({ x, y, scale = 1, tailTo }) => {
  const W = 450;
  const H = 250;
  return (
    <>
      {tailTo ? (
        <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1080}>
          <path d={`M${x + W * 0.35 * scale} ${y + H * scale - 6} L${tailTo.x} ${tailTo.y} L${x + W * 0.55 * scale} ${y + H * scale - 6} Z`} fill={theme.color.paper} stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          background: theme.color.paper,
          border: `7px solid ${theme.color.ink}`,
          borderRadius: 16,
          boxSizing: "border-box",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          color: theme.color.ink,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 46, marginTop: 14, borderBottom: `5px solid ${theme.color.ink}`, marginLeft: 120, marginRight: 120, paddingBottom: 4 }}>指示書</div>
        <div style={{ fontSize: 34, marginTop: 20, lineHeight: 1.5 }}>
          札が<Pill role="OWNER" />・<Pill role="MEMBER" />
          <br />
          のものだけ聞く
        </div>
      </div>
    </>
  );
};

// コンティが持って来る、小さく畳んだ指示書
export const SmallSheet: React.FC<{ x: number; y: number; rotate?: number }> = ({ x, y, rotate = 0 }) => (
  <svg width={90} height={110} style={{ position: "absolute", left: x - 45, top: y - 55, transform: `rotate(${rotate}deg)` }}>
    <rect x={5} y={5} width={80} height={100} rx={8} fill={theme.color.paper} stroke={theme.color.ink} strokeWidth={5} />
    {[30, 48, 66, 84].map((yy) => (
      <line key={yy} x1={18} y1={yy} x2={72} y2={yy} stroke="#B7AE9F" strokeWidth={6} strokeLinecap="round" />
    ))}
  </svg>
);
