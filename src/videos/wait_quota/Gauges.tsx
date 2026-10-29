import React from "react";
import { Img, staticFile } from "remotion";
import { Battery, BATTERY } from "../team_bid/Battery";
import { theme } from "../../theme";

// 寝て待つ回だけで使う部品。札の付いたレートリミットの電池、壁の時計、日めくり、早回しの印、担当者の顔のアイコン、眠りの「Z」。
// 電池そのものはチームで入札の回の Battery をそのまま使い、見た目をそろえる

const RED = "#D9483B";

// 札の付いた電池。(cx, top) は電池の上辺の真ん中。level は 0〜100。
// alarm が true のあいだ、縁を赤く点滅させ、中に赤い「！」を出す。札の字は画面で読める大きさ（40px）にする
export const LabeledBattery: React.FC<{ cx: number; top: number; level: number; label: string; alarm?: boolean; frame: number; pulse?: number }> = ({
  cx,
  top,
  level,
  label,
  alarm = false,
  frame,
  pulse = 0,
}) => {
  const blinkOn = alarm && Math.floor(frame / 5) % 2 === 0;
  // Battery の本体は (cx - 75, top) から幅 132・高さ 62。端子はその右
  const bodyCx = cx - 9;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${1 + pulse * 0.12})`, transformOrigin: `${cx}px ${top + 31}px` }}>
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
      <Battery cx={cx} top={top} level={level} number={null} />
      {alarm ? (
        <svg width={BATTERY.w} height={BATTERY.h} style={{ position: "absolute", left: cx - 75, top, overflow: "visible" }}>
          <rect x={0} y={0} width={BATTERY.w - 18} height={BATTERY.h} rx={14} fill="none" stroke={blinkOn ? RED : theme.color.ink} strokeWidth={8} />
          <text x={(BATTERY.w - 18) / 2} y={BATTERY.h / 2 + 19} textAnchor="middle" fontFamily={theme.fontFamily} fontWeight={800} fontSize={54} fill={blinkOn ? RED : "#E7B3AC"}>
            !
          </text>
        </svg>
      ) : null}
    </div>
  );
};

// 壁の時計。hour は 0〜12 の小数（12 が真上）で、分針は hour の端数から決める。
// 赤い三角の印はレートリミットがリセットされる時刻。ring（0〜1）のあいだ揺れて、まわりに鳴っている線を出す
export const WallClock: React.FC<{ cx: number; cy: number; r: number; hour: number; mark: number; blur?: number; ring?: number; frame: number; scale?: number }> = ({
  cx,
  cy,
  r,
  hour,
  mark,
  blur = 0,
  ring = 0,
  frame,
  scale = 1,
}) => {
  const size = r * 3.2;
  const minute = (hour % 1) * 60;
  const ha = ((hour % 12) / 12) * 360;
  const ma = (minute / 60) * 360;
  const shake = ring > 0 ? Math.sin(frame * 2.4) * 8 * ring : 0;
  const arm = (deg: number, len: number) => ({ x: Math.sin((deg * Math.PI) / 180) * len, y: -Math.cos((deg * Math.PI) / 180) * len });
  const m0 = arm(ma - 70, r * 0.75);
  const m1 = arm(ma, r * 0.75);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, transform: `scale(${scale}) rotate(${shake}deg)`, overflow: "visible" }}
    >
      <circle cx={0} cy={0} r={r + 14} fill="#A8693A" stroke={theme.color.ink} strokeWidth={8} />
      <circle cx={0} cy={0} r={r} fill={theme.color.paper} stroke={theme.color.ink} strokeWidth={r * 0.08} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r1 = r * (i % 3 === 0 ? 0.7 : 0.8);
        return <line key={i} x1={Math.sin(a) * r1} y1={-Math.cos(a) * r1} x2={Math.sin(a) * r * 0.88} y2={-Math.cos(a) * r * 0.88} stroke={theme.color.ink} strokeWidth={r * 0.06} strokeLinecap="round" />;
      })}
      <path d={`M0 ${-r * 0.98} L${r * 0.17} ${-r * 0.66} L${-r * 0.17} ${-r * 0.66} Z`} transform={`rotate(${(mark / 12) * 360})`} fill={RED} stroke={theme.color.ink} strokeWidth={r * 0.04} strokeLinejoin="round" />
      {/* 早回しの残像：分針の後ろに扇を描く */}
      {blur > 0 ? <path d={`M0 0 L${m0.x} ${m0.y} A${r * 0.75} ${r * 0.75} 0 0 1 ${m1.x} ${m1.y} Z`} fill={RED} opacity={0.3 * blur} /> : null}
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={theme.color.ink} strokeWidth={r * 0.12} strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.75} stroke={RED} strokeWidth={r * 0.06} strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle cx={0} cy={0} r={r * 0.09} fill={theme.color.ink} />
      {ring > 0
        ? [-1, 1].map((s) =>
            [0, 1, 2].map((i) => {
              const a = (-40 + i * 30) * (Math.PI / 180);
              const r1 = r * 1.3 + (frame % 4) * 3;
              const r2 = r * 1.6 + (frame % 4) * 3;
              return (
                <line key={`${s}${i}`} x1={s * Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={s * Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={theme.color.ink} strokeWidth={r * 0.1} strokeLinecap="round" opacity={ring} />
              );
            }),
          )
        : null}
    </svg>
  );
};

// 日めくり。(left, top) は左上。day は見えているページの日付、flip（0〜1）は一番上のページが上へめくれていく度合い。
// めくれていくページには day、その下には day + 1 を書く
export const DayCalendar: React.FC<{ left: number; top: number; day: number; flip: number; scale?: number }> = ({ left, top, day, flip, scale = 1 }) => {
  const W = 116;
  const H = 136;
  const HEAD = 34;
  const page = (n: number, style: React.CSSProperties) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: HEAD,
        width: W,
        height: H - HEAD,
        background: "#FFFDF7",
        border: `5px solid ${theme.color.ink}`,
        borderTop: "none",
        borderRadius: "0 0 12px 12px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 70,
        color: theme.color.ink,
        ...style,
      }}
    >
      {n}
    </div>
  );
  return (
    <div style={{ position: "absolute", left, top, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "100% 0", perspective: 400 }}>
      {page(day + 1, {})}
      {flip < 1 ? page(day, { transformOrigin: "50% 0", transform: `rotateX(${flip * 100}deg)`, opacity: flip > 0.85 ? (1 - flip) / 0.15 : 1 }) : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HEAD, background: "#E0603F", border: `5px solid ${theme.color.ink}`, borderRadius: "12px 12px 0 0", boxSizing: "border-box" }} />
      {[30, W - 30].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 8, top: -10, width: 16, height: 26, borderRadius: 8, background: "#C9C2B6", border: `4px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
      ))}
    </div>
  );
};

// 早回しの印。チームで入札の回の印と同じ形
export const FastForward: React.FC<{ frame: number; left?: number; top?: number }> = ({ frame, left = 893, top = 44 }) => {
  const blink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.55;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 172,
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
        <path d="M2 2 L22 15 L2 28 Z M22 2 L42 15 L22 28 Z" fill={theme.color.highlight} />
      </svg>
      早回し
    </div>
  );
};

// 担当者の顔のアイコン。(cx, cy) が丸の真ん中。src が null のときは、外れたあとの点線の丸だけを描く
export const FaceIcon: React.FC<{ cx: number; cy: number; size: number; src: string | null; rotate?: number; opacity?: number; scale?: number }> = ({
  cx,
  cy,
  size,
  src,
  rotate = 0,
  opacity = 1,
  scale = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: cx - size / 2,
      top: cy - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      boxSizing: "border-box",
      border: src ? `5px solid ${theme.color.ink}` : `4px dashed ${theme.color.ink}`,
      background: src ? "#FFFDF7" : "rgba(255,253,247,0.6)",
      overflow: "hidden",
      opacity,
      transform: `rotate(${rotate}deg) scale(${scale})`,
    }}
  >
    {src ? <Img src={staticFile(src)} style={{ width: "100%", height: "100%", display: "block" }} /> : null}
  </div>
);

// 眠っているしるしの「Z」。上へ漂いながら消える
export const Zzz: React.FC<{ x: number; y: number; frame: number; size?: number }> = ({ x, y, frame, size = 40 }) => (
  <>
    {[0, 1, 2].map((i) => {
      const p = ((frame + i * 20) % 60) / 60;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + p * 50 + i * 6,
            top: y - p * 80,
            opacity: Math.sin(p * Math.PI),
            fontFamily: theme.fontFamily,
            fontWeight: 800,
            fontSize: size * (0.7 + p * 0.5),
            color: "#FFFFFF",
            WebkitTextStroke: `7px ${theme.color.ink}`,
            paintOrder: "stroke fill",
          }}
        >
          Z
        </div>
      );
    })}
  </>
);
