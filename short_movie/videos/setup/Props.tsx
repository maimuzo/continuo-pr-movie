import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { theme } from "../../theme";
import { mono } from "./Terminal";

// セットアップの回の小道具。どれも太い線・平らな塗りで、ぼかした影を付けない
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ink = theme.color.ink;

// 歯車。設定の印
const Gear: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100">
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={-9} y={-46} width={18} height={22} rx={4} fill="#9AA6BF" stroke={ink} strokeWidth={5} transform={`rotate(${i * 45})`} />
    ))}
    <circle r={30} fill="#9AA6BF" stroke={ink} strokeWidth={6} />
    <circle r={11} fill="#FFFDF7" stroke={ink} strokeWidth={5} />
  </svg>
);

// 吹き出し。プロンプトの印
export const Bubble: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 100 85">
    <path d="M12 6 H88 A8 8 0 0 1 96 14 V52 A8 8 0 0 1 88 60 H44 L24 80 L28 60 H12 A8 8 0 0 1 4 52 V14 A8 8 0 0 1 12 6 Z" fill="#FFFFFF" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
    {[30, 50, 70].map((cx) => (
      <circle key={cx} cx={cx} cy={33} r={6} fill={theme.color.accent} />
    ))}
  </svg>
);

// WORKFLOW.md の紙。上の段に歯車と「設定」、下の段に吹き出しと「プロンプト」。(cx, cy) が紙の真ん中
export const PAPER = { w: 440, h: 520 };
export const WorkflowPaper: React.FC<{ cx: number; cy: number; scale: number; rotate?: number; lowerGlow?: number }> = ({ cx, cy, scale, rotate = 0, lowerGlow = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: cx - PAPER.w / 2,
      top: cy - PAPER.h / 2,
      width: PAPER.w,
      height: PAPER.h,
      transform: `scale(${scale}) rotate(${rotate}deg)`,
      background: theme.color.paper,
      border: `7px solid ${ink}`,
      borderRadius: 14,
      boxSizing: "border-box",
      boxShadow: "8px 10px 0 rgba(0,0,0,0.25)",
    }}
  >
    <div style={{ height: 84, borderBottom: `5px solid ${ink}`, background: "#F4EFE6", textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 44, lineHeight: "80px", color: ink }}>WORKFLOW.md</div>
    <div style={{ height: 205, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
      <Gear size={110} />
      <span style={{ fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 72, color: ink }}>設定</span>
    </div>
    <div style={{ height: 0, borderTop: `5px dashed ${ink}`, margin: "0 18px" }} />
    <div
      style={{
        height: 205,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: `rgba(242,193,78,${lowerGlow * 0.6})`,
        borderRadius: "0 0 8px 8px",
      }}
    >
      <Bubble size={78} />
      <span style={{ fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 60, color: ink, whiteSpace: "nowrap" }}>プロンプト</span>
    </div>
  </div>
);

// コンティの顔のアイコン。wave.png を丸く切り抜く。(cx, cy) が丸の真ん中
export const ContiIcon: React.FC<{ cx: number; cy: number; size: number; squash?: number }> = ({ cx, cy, size, squash = 1 }) => (
  <div
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
      background: "#CFE6F5",
      border: `${Math.max(4, size * 0.05)}px solid ${ink}`,
      boxSizing: "border-box",
      transform: `scale(${1 / squash}, ${squash})`,
      transformOrigin: "50% 100%",
    }}
  >
    {/* wave.png は 729×556。顔（目と口）が丸の真ん中に来るよう、絵を大きくして左にずらす */}
    <Img src={staticFile("characters/continuo/wave.png")} style={{ position: "absolute", width: size * 1.75, left: -size * 0.12, top: -size * 0.33 }} />
  </div>
);

// 画面の上の端から降りるネットワークの線。点線が下へ流れる。amount 0〜1 で伸びる
export const NetworkLine: React.FC<{ x: number; y1: number; y2: number; amount: number; frame: number }> = ({ x, y1, y2, amount, frame }) => {
  if (amount <= 0) return null;
  const y = y1 + (y2 - y1) * amount;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1080}>
      <line x1={x} y1={y1} x2={x} y2={y} stroke={ink} strokeWidth={16} strokeLinecap="round" />
      <line x1={x} y1={y1} x2={x} y2={y} stroke="#7FD1FF" strokeWidth={8} strokeDasharray="18 14" strokeDashoffset={-frame * 4} strokeLinecap="round" />
      {/* 線の根もとの雲。ネットワークの向こう側の印 */}
      <g transform={`translate(${x}, ${y1 - 6})`}>
        <path d="M-95 20 A34 34 0 0 1 -60 -18 A46 46 0 0 1 20 -30 A36 36 0 0 1 90 0 A26 26 0 0 1 95 20 Z" fill="#FFFFFF" stroke={ink} strokeWidth={7} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

// continuo setup の絵。左に自分の列の名前、右に6つの役を並べて線でつなぐ。draw 0〜1 で線が伸びる
const COLS = ["Todo", "In Progress", "Needs review", "Blocked", "Done", "Direct Chat"];
const ROLES = ["Ready", "In Progress", "In Review", "Blocked", "Done", "Direct Chat"];
const COL_COLORS = ["#7FC8A9", "#F2C14E", "#8FB8E8", "#F2756A", "#B9A3E3", "#F0A35E"];
export const MappingPanel: React.FC<{ cx: number; cy: number; pop: number; draw: number }> = ({ cx, cy, pop, draw }) => {
  const W = 820;
  const H = 520;
  const rowH = 68;
  const top = 92;
  const chip = (x: number, y: number, text: string, color: string, i: number) => (
    <div
      key={`${x}-${i}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 270,
        height: 50,
        background: "#FFFFFF",
        border: `5px solid ${ink}`,
        borderLeft: `22px solid ${color}`,
        borderRadius: 10,
        boxSizing: "border-box",
        fontFamily: mono,
        fontWeight: 700,
        fontSize: 26,
        lineHeight: "40px",
        paddingLeft: 12,
        color: ink,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: cx - W / 2,
        top: cy - H / 2,
        width: W,
        height: H,
        transform: `scale(${interpolate(pop, [0, 0.7, 1], [0.5, 1.06, 1], clamp)})`,
        opacity: interpolate(pop, [0, 0.3], [0, 1], clamp),
        background: theme.color.kanbanBoard,
        border: `7px solid ${ink}`,
        borderRadius: 20,
        boxShadow: "8px 10px 0 rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ position: "absolute", left: 40, top: 18, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 40, color: ink }}>カンバンの列</div>
      <div style={{ position: "absolute", right: 40, top: 18, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 40, color: ink }}>continuo の役</div>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={W} height={H}>
        {COLS.map((_, i) => {
          const y = top + i * rowH + 22;
          const x1 = 40 + 270;
          const x2 = W - 40 - 270 - 14;
          const p = interpolate(draw, [i * 0.08, i * 0.08 + 0.5], [0, 1], clamp);
          return <line key={i} x1={x1} y1={y} x2={x1 + (x2 - x1) * p} y2={y} stroke={ink} strokeWidth={6} strokeLinecap="round" />;
        })}
      </svg>
      {COLS.map((c, i) => chip(40, top + i * rowH, c, COL_COLORS[i], i))}
      {ROLES.map((r, i) => chip(W - 40 - 270 - 14, top + i * rowH, r, COL_COLORS[i], i))}
    </div>
  );
};

// 「不要」の札
export const NotNeededTag: React.FC<{ cx: number; cy: number; pop: number }> = ({ cx, cy, pop }) => (
  <div
    style={{
      position: "absolute",
      left: cx,
      top: cy,
      transform: `translate(-50%, -50%) rotate(-6deg) scale(${interpolate(pop, [0, 0.7, 1], [0.3, 1.15, 1], clamp)})`,
      opacity: pop > 0 ? 1 : 0,
      padding: "6px 44px 14px",
      background: "#9AA6BF",
      border: `7px solid ${ink}`,
      borderRadius: 20,
      fontFamily: theme.fontFamily,
      fontWeight: 800,
      fontSize: 96,
      color: "#FFFFFF",
      WebkitTextStroke: `10px ${ink}`,
      paintOrder: "stroke fill",
      whiteSpace: "nowrap",
    }}
  >
    不要
  </div>
);

// localhost:8080 を開いたブラウザの小窓。動いている issue の一覧が rows 本出る。t は小窓が開いてからの秒
const ROWS = [
  { name: "hello-world #12", status: "In Progress", color: "#F2C14E" },
  { name: "api-server #31", status: "In Progress", color: "#F2C14E" },
  { name: "web-app #8", status: "Blocked", color: "#F2756A" },
  { name: "docs #5", status: "In Review", color: "#8FB8E8" },
];
export const BrowserWindow: React.FC<{ x: number; y: number; w: number; h: number; pop: number; t: number }> = ({ x, y, w, h, pop, t }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      transform: `scale(${interpolate(pop, [0, 0.7, 1], [0.3, 1.06, 1], clamp)})`,
      transformOrigin: "0% 50%",
      opacity: pop > 0 ? 1 : 0,
      background: "#FFFFFF",
      border: `8px solid ${ink}`,
      borderRadius: 22,
      boxShadow: "0 10px 0 rgba(0,0,0,0.2)",
      overflow: "hidden",
      boxSizing: "border-box",
    }}
  >
    <div style={{ height: 76, background: "#E6DED0", borderBottom: `4px solid ${ink}`, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          top: 12,
          height: 50,
          background: "#FFFFFF",
          border: `4px solid ${ink}`,
          borderRadius: 25,
          boxSizing: "border-box",
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 30,
          lineHeight: "42px",
          paddingLeft: 22,
          color: ink,
        }}
      >
        localhost:8080
      </div>
    </div>
    <div style={{ padding: "18px 22px 0", fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 40, color: theme.color.accent }}>continuo</div>
    {ROWS.map((r, i) => {
      const o = interpolate(t, [0.3 + i * 0.25, 0.5 + i * 0.25], [0, 1], clamp);
      return (
        <div key={r.name} style={{ margin: "12px 22px 0", padding: "8px 14px", border: `4px solid ${ink}`, borderRadius: 12, opacity: o, transform: `translateX(${(1 - o) * 40}px)` }}>
          <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 28, color: ink, whiteSpace: "nowrap" }}>{r.name}</div>
          <div style={{ display: "inline-block", marginTop: 4, padding: "0 12px", borderRadius: 8, background: r.color, border: `3px solid ${ink}`, fontFamily: mono, fontWeight: 700, fontSize: 22, color: ink }}>
            {r.status}
          </div>
        </div>
      );
    })}
  </div>
);

