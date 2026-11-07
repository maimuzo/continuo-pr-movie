import React from "react";
import { Battery, BATTERY } from "../_shared/Battery";
import { theme } from "../_shared/theme";

// 自分の分だけ上書きの回だけで使う部品。壁の WORKFLOW.md の紙（WorkflowSheet）、机の付箋（LocalNote）、
// 机の小さな日めくり（MiniCalendar）、「自分の分」の点線の付いた電池（MarginBattery）、
// 巻き戻しの印（Rewind）と走査線（Scanlines）、「仕切り直し」の札（ResetSign）、「えっ！？」の吹き出し（Shout）。
// 電池は寝て待つ回の LabeledBattery を写して、どの日も自分の分が残る回と同じ「自分の分」の記号（縦の点線と、その右の薄い斜線）を足したもの。
// ほかの回のフォルダは import できないので、ここに写す。座標は 1080×1080 の画面の座標

const POINTER = "#D9483B";
const NOTE = "#FFE57A";

// 壁に貼った、チームで共有する WORKFLOW.md の紙。glow（0〜1）で紙全体を光らせ、hot（0〜1）で「10%」の行を光らせる。
// strike（0〜1）は「10%」に引く線の伸び具合、rewrite（0〜1）は「10%」の下に手で書き込む赤い「0%」の書けた割合
export const WorkflowSheet: React.FC<{ left: number; top: number; width: number; height: number; glow?: number; hot?: number; strike?: number; rewrite?: number }> = ({
  left,
  top,
  width,
  height,
  glow = 0,
  hot = 0,
  strike = 0,
  rewrite = 0,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      height,
      background: theme.color.paper,
      border: `6px solid ${theme.color.ink}`,
      borderRadius: 10,
      boxSizing: "border-box",
      boxShadow: glow > 0 ? `0 0 ${40 * glow}px ${14 * glow}px rgba(242,193,78,${0.9 * glow})` : "4px 6px 0 rgba(42,36,32,0.18)",
      transform: `scale(${1 + glow * 0.04})`,
      fontFamily: theme.fontFamily,
      fontWeight: 800,
      color: theme.color.ink,
    }}
  >
    {/* 上の2か所を留めるテープ */}
    {[44, width - 104].map((x) => (
      <div key={x} style={{ position: "absolute", left: x, top: -18, width: 60, height: 30, background: "rgba(242,193,78,0.85)", border: `3px solid ${theme.color.ink}`, transform: `rotate(${x < 100 ? -8 : 8}deg)` }} />
    ))}
    <div style={{ position: "absolute", left: 0, right: 0, top: 32, textAlign: "center", fontSize: 28, whiteSpace: "nowrap" }}>WORKFLOW.md（チームで共有）</div>
    <div style={{ position: "absolute", left: 30, right: 30, top: 88, height: 5, borderRadius: 3, background: theme.color.ink }} />
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 140,
        transform: `translateX(-50%) scale(${1 + hot * 0.25})`,
        padding: "8px 26px",
        borderRadius: 14,
        background: hot > 0 ? `rgba(242,193,78,${0.75 * hot})` : "transparent",
        fontSize: 40,
        whiteSpace: "nowrap",
      }}
    >
      マージン{" "}
      <span style={{ position: "relative", display: "inline-block" }}>
        10%
        {strike > 0 ? (
          <svg width={110} height={60} style={{ position: "absolute", left: -12, top: 0, overflow: "visible" }}>
            <line x1={0} y1={34} x2={8 + 104 * strike} y2={26} stroke={POINTER} strokeWidth={9} strokeLinecap="round" />
          </svg>
        ) : null}
        {rewrite > 0 ? (
          <span
            style={{
              position: "absolute",
              left: 4,
              top: "92%",
              fontSize: 54,
              color: POINTER,
              transform: "rotate(-8deg)",
              clipPath: `inset(0 ${100 - rewrite * 100}% 0 0)`,
              whiteSpace: "nowrap",
            }}
          >
            0%
          </span>
        ) : null}
      </span>
    </div>
  </div>
);

// 巻き戻しの印。寝て待つ回の「早回し」の印（FastForward）と同じ形で、三角を左向きにしたもの
export const Rewind: React.FC<{ frame: number; left?: number; top?: number }> = ({ frame, left = 820, top = 44 }) => {
  const blink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.55;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 230,
        height: 64,
        borderRadius: 16,
        background: theme.color.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 30,
        color: "#FFFFFF",
      }}
    >
      <svg width={44} height={30} viewBox="0 0 44 30" style={{ opacity: blink }}>
        <path d="M42 2 L22 15 L42 28 Z M22 2 L2 15 L22 28 Z" fill={theme.color.highlight} />
      </svg>
      巻き戻し
    </div>
  );
};

// 巻き戻しのあいだ画面に重ねる走査線。横の細い線と、下へ流れる太い帯
export const Scanlines: React.FC<{ frame: number; opacity: number }> = ({ frame, opacity }) => (
  <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(42,36,32,0.16) 0px, rgba(42,36,32,0.16) 3px, transparent 3px, transparent 9px)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: ((frame * 37) % 1200) - 120, height: 90, background: "rgba(255,255,255,0.28)" }} />
    <div style={{ position: "absolute", inset: 0, background: "rgba(60,90,140,0.10)" }} />
  </div>
);

// 画面の真ん中に大きく出す「仕切り直し」の札。appear（0〜1）で弾んで出て、0 で消える
export const ResetSign: React.FC<{ appear: number }> = ({ appear }) =>
  appear <= 0 ? null : (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <div
        style={{
          padding: "28px 64px",
          background: theme.color.paper,
          border: `10px solid ${theme.color.ink}`,
          borderRadius: 28,
          boxShadow: "10px 14px 0 rgba(42,36,32,0.35)",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 136,
          lineHeight: 1.1,
          color: theme.color.ink,
          whiteSpace: "nowrap",
          transform: `scale(${appear}) rotate(-4deg)`,
          opacity: Math.min(1, appear * 1.5),
        }}
      >
        仕切り直し
      </div>
    </div>
  );

// 驚いた人の頭の横に出す吹き出し。(x, y) は吹き出しの左上。tail が 1 なら右下、-1 なら左下にしっぽを出す
export const Shout: React.FC<{ x: number; y: number; text: string; scale: number; tail?: 1 | -1 }> = ({ x, y, text, scale, tail = 1 }) =>
  scale <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: tail === 1 ? "90% 100%" : "10% 100%" }}>
      <div
        style={{
          padding: "6px 22px",
          background: "#FFFFFF",
          border: `6px solid ${theme.color.ink}`,
          borderRadius: 30,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 46,
          color: theme.color.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
      <svg width={40} height={30} style={{ position: "absolute", top: "100%", marginTop: -6, [tail === 1 ? "right" : "left"]: 26 }}>
        <path d={tail === 1 ? "M2 0 L38 0 L34 28 Z" : "M2 0 L38 0 L6 28 Z"} fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
        <line x1={4} y1={1} x2={36} y2={1} stroke="#FFFFFF" strokeWidth={8} />
      </svg>
    </div>
  );

// 机の天板の右端に立てて貼る付箋（幅 108px）。appear（0〜1）で弾んで出て、written（0〜1）の割合だけ「マージン 0%」の字が書かれる
export const LocalNote: React.FC<{ left: number; top: number; appear: number; written: number; glow?: number }> = ({ left, top, appear, written, glow = 0 }) => {
  const body = "マージン 0%";
  const shown = body.slice(0, Math.round(written * body.length));
  if (appear <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 108,
        height: 124,
        background: NOTE,
        border: `5px solid ${theme.color.ink}`,
        borderRadius: 6,
        boxSizing: "border-box",
        transform: `rotate(-4deg) scale(${appear})`,
        transformOrigin: "50% 100%",
        boxShadow: glow > 0 ? `0 0 ${30 * glow}px ${10 * glow}px rgba(242,193,78,${0.9 * glow})` : "3px 5px 0 rgba(42,36,32,0.2)",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        color: theme.color.ink,
        textAlign: "center",
      }}
    >
      <div style={{ position: "absolute", left: 29, top: -12, width: 50, height: 20, background: "rgba(255,255,255,0.7)", border: `3px solid ${theme.color.ink}` }} />
      <div style={{ marginTop: 9, fontSize: 16, lineHeight: 1.05 }}>
        WORKFLOW
        <br />
        .local.md
      </div>
      <div style={{ margin: "4px 8px 0", height: 3, background: theme.color.ink, opacity: 0.5 }} />
      <div style={{ marginTop: 3, fontSize: 23, lineHeight: 1.1, whiteSpace: "nowrap" }}>{shown.slice(0, 4) || " "}</div>
      <div style={{ fontSize: 30, lineHeight: 1.05, color: POINTER, whiteSpace: "nowrap" }}>{shown.slice(5) || " "}</div>
    </div>
  );
};

// 机の天板の左端に立てる小さな日めくり（幅 90px）。「あと」と「N日」の2段。glow（0〜1）で光って大きくなる。
// stand は日めくりの下の脚の長さ。机の前に立つ人の頭より上に字を出すため、脚で持ち上げる
export const MiniCalendar: React.FC<{ left: number; top: number; days: number; glow?: number; stand?: number }> = ({ left, top, days, glow = 0, stand = 0 }) => {
  const W = 90;
  const H = 98;
  const HEAD = 24;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: W,
        height: H,
        transform: `scale(${1 + glow * 0.35})`,
        transformOrigin: "50% 100%",
        filter: glow > 0 ? `drop-shadow(0 0 ${14 * glow}px rgba(242,193,78,${glow}))` : undefined,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        color: theme.color.ink,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: HEAD,
          width: W,
          height: H - HEAD,
          background: "#FFFDF7",
          border: `4px solid ${theme.color.ink}`,
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 20, lineHeight: 1, marginTop: 6 }}>あと</div>
        <div style={{ fontSize: 34, lineHeight: 1.1, color: days === 1 ? POINTER : theme.color.ink }}>{days}日</div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HEAD, background: "#E0603F", border: `4px solid ${theme.color.ink}`, borderRadius: "10px 10px 0 0", boxSizing: "border-box" }} />
      {stand > 0 ? (
        <>
          <div style={{ position: "absolute", left: W / 2 - 5, top: H - 2, width: 10, height: stand, background: "#8A5A34", border: `3px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: W / 2 - 24, top: H + stand - 10, width: 48, height: 12, borderRadius: 6, background: "#8A5A34", border: `3px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
        </>
      ) : null}
      {[22, W - 22].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 6, top: -8, width: 12, height: 20, borderRadius: 6, background: "#C9C2B6", border: `3px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
      ))}
    </div>
  );
};

// 「1週間」の札と「自分の分」の点線の付いた電池。(cx, top) は電池の上辺の真ん中。level は 0〜100。
// margin は自分の分の％。満タン側（右端）から margin の幅のところに縦の点線を引き、その右を薄い斜線にする。
// lineOpacity が 0 のとき点線と斜線を消す。swell は電池を膨らませる度合い（1 で 1.3 倍）、glow は縁を光らせる度合い
export const MarginBattery: React.FC<{
  cx: number;
  top: number;
  level: number;
  margin: number;
  lineOpacity?: number;
  label?: string;
  swell?: number;
  glow?: number;
  id: string;
}> = ({ cx, top, level, margin, lineOpacity = 1, label = "1週間", swell = 0, glow = 0, id }) => {
  // Battery の本体は (cx - 75, top) から幅 132・高さ 62。中身は (cx - 66, top + 9) から幅 116・高さ 44
  const bodyCx = cx - 9;
  const inX = cx - 66;
  const inW = BATTERY.w - 34;
  const lineX = inX + inW * (1 - margin / 100);
  const hatchW = Math.max(0, inX + inW - lineX);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, transform: `scale(${1 + swell * 0.3})`, transformOrigin: `${cx}px ${top + 31}px` }}>
      <div
        style={{
          position: "absolute",
          left: bodyCx,
          top: top - 10,
          transform: "translate(-50%, -100%)",
          padding: "0px 16px",
          background: "#FFFDF7",
          border: `5px solid ${theme.color.ink}`,
          borderRadius: 14,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 40,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          color: theme.color.ink,
        }}
      >
        {label}
      </div>
      <Battery cx={cx} top={top} level={level} number={null} win={glow} />
      {lineOpacity > 0 ? (
        <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: lineOpacity }}>
          <defs>
            <pattern id={`hatch-${id}`} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={10} stroke={theme.color.ink} strokeWidth={3} opacity={0.22} />
            </pattern>
          </defs>
          {hatchW > 0.5 ? <rect x={lineX} y={top + 9} width={hatchW} height={44} fill={`url(#hatch-${id})`} /> : null}
          <line x1={lineX} y1={top + 3} x2={lineX} y2={top + 59} stroke="#FFFFFF" strokeWidth={6} />
          <line x1={lineX} y1={top + 3} x2={lineX} y2={top + 59} stroke={theme.color.ink} strokeWidth={6} strokeDasharray="9 7" />
        </svg>
      ) : null}
    </div>
  );
};
