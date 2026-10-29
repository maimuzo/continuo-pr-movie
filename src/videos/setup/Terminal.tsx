import React from "react";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { interpolate, Easing } from "remotion";
import { theme } from "../../theme";

// セットアップの回の端末の窓。React と SVG で描く。
// 等幅の書体はこの回だけで使うので、src/theme.ts は書き換えずにここで読む
export const mono = loadFont("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

// JetBrains Mono の1文字の幅は字の大きさの 0.6 倍
export const CHAR_W = 0.6;
// ✓ の色。緑は避ける、と決めたので明るい黄色にする
export const CHECK_COLOR = "#FFC94D";
export const TERM = {
  bg: "#1E2433",
  bar: "#323A4F",
  text: "#F5F1E8",
  prompt: "#7FD1FF",
  dim: "#8E97AD",
  barH: 56,
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Rect = { x: number; y: number; w: number; h: number };

// ✓ を字ではなく線で描く。書体に ✓ が無くても欠けないため。pop は 0〜1 の出方
export const Check: React.FC<{ x: number; y: number; size: number; pop: number }> = ({ x, y, size, pop }) => {
  const s = interpolate(pop, [0, 0.6, 1], [0.2, 1.35, 1], clamp);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, opacity: pop > 0 ? 1 : 0, overflow: "visible" }}
    >
      <path d="M3 10.5 L8 15.5 L17 4.5" fill="none" stroke={CHECK_COLOR} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// 端末の窓の枠。中身は children（窓の左上を原点に置く）
export const TerminalWindow: React.FC<{ rect: Rect; title?: string; children?: React.ReactNode }> = ({ rect, title = "continuo-setup", children }) => (
  <div
    style={{
      position: "absolute",
      left: rect.x,
      top: rect.y,
      width: rect.w,
      height: rect.h,
      background: TERM.bg,
      border: `8px solid ${theme.color.ink}`,
      borderRadius: 22,
      boxShadow: "0 10px 0 rgba(0,0,0,0.2)",
      overflow: "hidden",
      boxSizing: "border-box",
    }}
  >
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, height: TERM.barH, background: TERM.bar, borderBottom: `4px solid ${theme.color.ink}` }}>
      {["#F2756A", "#F2C14E", "#8FB8E8"].map((c, i) => (
        <div key={c} style={{ position: "absolute", left: 22 + i * 36, top: 15, width: 22, height: 22, borderRadius: 11, background: c, border: `3px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 10, textAlign: "center", fontFamily: mono, fontWeight: 700, fontSize: 26, color: TERM.dim }}>{title}</div>
    </div>
    {children}
  </div>
);

// 打たれる1行。t0〜t1 で1文字ずつ出し、check の秒に ✓ が付く。t は動画の頭からの秒。
// wrapAt を渡すと、その字の位置から先を次の段に2字下げて出す（字は1文字も変えず、見せる段だけを分ける）。
// t0 の1コマ目から1文字目を出す。打ち始めの端末が `$` だけになる間を作らないため
export type Line = { text: string; t0: number; t1: number; check?: number; prompt?: boolean; wrapAt?: number };

export const TypedLine: React.FC<{ line: Line; t: number; x: number; y: number; fontSize: number; rowH?: number }> = ({ line, t, x, y, fontSize, rowH }) => {
  if (t < line.t0) return null;
  const prompt = line.prompt === false ? "" : "$ ";
  const len = line.text.length;
  const n = Math.max(1, Math.floor(interpolate(t, [line.t0, line.t1], [0, len], clamp)));
  const typing = t < line.t1;
  const cw = fontSize * CHAR_W;
  const rh = rowH ?? fontSize * 1.45;
  const k = line.wrapAt ?? len;
  const rows = [line.text.slice(0, Math.min(n, k))];
  if (n > k) rows.push(line.text.slice(k, n));
  const lastRow = rows.length - 1;
  const lead = (r: number) => (r === 0 ? prompt.length : 2);
  const endX = x + (lead(lastRow) + rows[lastRow].length) * cw;
  const endY = y + lastRow * rh;
  const checkPop = line.check !== undefined ? interpolate(t, [line.check, line.check + 0.15], [0, 1], clamp) : 0;
  return (
    <>
      {rows.map((r, i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y + i * rh, fontFamily: mono, fontWeight: 500, fontSize, lineHeight: `${fontSize * 1.3}px`, whiteSpace: "pre", color: TERM.text }}>
          <span style={{ color: TERM.prompt, fontWeight: 700 }}>{i === 0 ? prompt : "  "}</span>
          {r}
        </div>
      ))}
      {typing ? <div style={{ position: "absolute", left: endX, top: endY + fontSize * 0.1, width: cw, height: fontSize * 1.15, background: TERM.text, opacity: 0.85 }} /> : null}
      {line.check !== undefined ? <Check x={endX + cw * 0.6} y={endY + fontSize * 0.1} size={fontSize * 1.1} pop={checkPop} /> : null}
    </>
  );
};

// 左右に割った窓の上に出す OS の札
export const OsTag: React.FC<{ cx: number; y: number; text: string; pop: number }> = ({ cx, y, text, pop }) => (
  <div
    style={{
      position: "absolute",
      left: cx,
      top: y,
      transform: `translateX(-50%) scale(${interpolate(pop, [0, 0.7, 1], [0.3, 1.15, 1], clamp)})`,
      opacity: pop > 0 ? 1 : 0,
      padding: "2px 30px 8px",
      background: "#FFF4E0",
      border: `6px solid ${theme.color.ink}`,
      borderRadius: 18,
      fontFamily: theme.fontFamily,
      fontWeight: 800,
      fontSize: 52,
      color: theme.color.ink,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

// 窓を割る縦の線。amount が 0〜1 で、上から引かれて伸びる
export const SplitLine: React.FC<{ x: number; top: number; height: number; amount: number }> = ({ x, top, height, amount }) =>
  amount > 0 ? (
    <div style={{ position: "absolute", left: x - 4, top, width: 8, height: height * Easing.out(Easing.cubic)(amount), background: "#FFF4E0", borderRadius: 4 }} />
  ) : null;
