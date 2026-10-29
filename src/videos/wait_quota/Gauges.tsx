import React from "react";
import { theme } from "../../theme";

// 寝て待つ回だけで使う計器。利用枠の燃料計（電池の形）と、壁の時計と、目覚まし時計。
// 燃料計の中身は黄色にする。緑は抜き色なので使わない。課金のレジの表示と形を分けるため、電池の形にする

const FUEL = theme.color.highlight; // 黄色
const RED = "#D9483B";

// 電池の形の燃料計。(cx, cy) が本体の真ん中。level は 0〜1。alarm が true のとき枠を赤く点滅させる
export const FuelGauge: React.FC<{ cx: number; cy: number; level: number; alarm?: boolean; frame: number; scale?: number }> = ({
  cx,
  cy,
  level,
  alarm = false,
  frame,
  scale = 1,
}) => {
  const W = 190;
  const H = 92;
  const blinkOn = alarm && Math.floor(frame / 5) % 2 === 0;
  const stroke = blinkOn ? RED : theme.color.ink;
  const inner = { x: 14, y: 14, w: W - 28, h: H - 28 };
  const fillW = Math.max(0, Math.min(1, level)) * inner.w;
  return (
    <svg
      width={W + 40}
      height={H + 20}
      viewBox={`-10 -10 ${W + 40} ${H + 20}`}
      style={{ position: "absolute", left: cx - (W + 40) / 2, top: cy - (H + 20) / 2, transform: `scale(${scale})` }}
    >
      {/* 本体と端子 */}
      <rect x={0} y={0} width={W} height={H} rx={18} fill="#FFFFFF" stroke={stroke} strokeWidth={9} />
      <rect x={W + 2} y={H / 2 - 18} width={16} height={36} rx={5} fill={stroke} />
      {/* 中身。影1段の平らな塗り */}
      {fillW > 0 ? (
        <>
          <rect x={inner.x} y={inner.y} width={fillW} height={inner.h} rx={8} fill={FUEL} />
          <rect x={inner.x} y={inner.y + inner.h * 0.62} width={fillW} height={inner.h * 0.38} rx={6} fill="#D9A43A" />
        </>
      ) : null}
      {/* 空のときは中に赤い「！」 */}
      {alarm ? (
        <text x={W / 2} y={H / 2 + 22} textAnchor="middle" fontFamily={theme.fontFamily} fontWeight={800} fontSize={62} fill={blinkOn ? RED : "#E7B3AC"}>
          !
        </text>
      ) : null}
    </svg>
  );
};

// 時計の文字盤の目盛りと針。hour は 0〜12（12 が真上）、minute は 0〜60
const Dial: React.FC<{ r: number; hour: number; minute: number; mark?: number }> = ({ r, hour, minute, mark }) => {
  const ha = ((hour % 12) / 12) * 360;
  const ma = ((minute % 60) / 60) * 360;
  return (
    <>
      <circle cx={0} cy={0} r={r} fill={theme.color.paper} stroke={theme.color.ink} strokeWidth={r * 0.08} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r1 = r * (i % 3 === 0 ? 0.72 : 0.8);
        return (
          <line key={i} x1={Math.sin(a) * r1} y1={-Math.cos(a) * r1} x2={Math.sin(a) * r * 0.88} y2={-Math.cos(a) * r * 0.88} stroke={theme.color.ink} strokeWidth={r * 0.05} strokeLinecap="round" />
        );
      })}
      {/* 区切りの時刻（利用枠が戻る時刻）の印 */}
      {mark !== undefined ? (
        <path
          d={`M0 ${-r * 0.96} L${r * 0.13} ${-r * 0.7} L${-r * 0.13} ${-r * 0.7} Z`}
          transform={`rotate(${(mark / 12) * 360})`}
          fill={RED}
          stroke={theme.color.ink}
          strokeWidth={r * 0.03}
        />
      ) : null}
      <line x1={0} y1={0} x2={0} y2={-r * 0.5} stroke={theme.color.ink} strokeWidth={r * 0.1} strokeLinecap="round" transform={`rotate(${ha})`} />
      <line x1={0} y1={0} x2={0} y2={-r * 0.75} stroke={RED} strokeWidth={r * 0.05} strokeLinecap="round" transform={`rotate(${ma})`} />
      <circle cx={0} cy={0} r={r * 0.08} fill={theme.color.ink} />
    </>
  );
};

// 壁の時計。blur は早回しの残像（0〜1）
export const WallClock: React.FC<{ cx: number; cy: number; r: number; hour: number; minute: number; mark?: number; blur?: number; flash?: number }> = ({
  cx,
  cy,
  r,
  hour,
  minute,
  mark,
  blur = 0,
  flash = 0,
}) => {
  const size = r * 2 + 40;
  return (
    <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2 }}>
      <circle cx={0} cy={0} r={r + 14} fill="#A8693A" stroke={theme.color.ink} strokeWidth={8} />
      <Dial r={r} hour={hour} minute={minute} mark={mark} />
      {/* 早回しの残像：分針の後ろに扇を描く */}
      {blur > 0 ? (
        <path
          d={`M0 0 L${Math.sin(((minute - 12) / 60) * Math.PI * 2) * r * 0.75} ${-Math.cos(((minute - 12) / 60) * Math.PI * 2) * r * 0.75} A${r * 0.75} ${r * 0.75} 0 0 1 ${Math.sin((minute / 60) * Math.PI * 2) * r * 0.75} ${-Math.cos((minute / 60) * Math.PI * 2) * r * 0.75} Z`}
          fill={RED}
          opacity={0.3 * blur}
        />
      ) : null}
      {flash > 0 ? <circle cx={0} cy={0} r={r} fill={FUEL} opacity={flash * 0.6} /> : null}
    </svg>
  );
};

// 目覚まし時計。ring が true のとき揺れて、まわりに鳴っている線を出す
export const AlarmClock: React.FC<{ cx: number; cy: number; r: number; hour: number; minute: number; ring: boolean; frame: number }> = ({
  cx,
  cy,
  r,
  hour,
  minute,
  ring,
  frame,
}) => {
  const size = r * 3.4;
  const shake = ring ? Math.sin(frame * 2.4) * 9 : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, transform: `rotate(${shake}deg)` }}
    >
      {/* 足 */}
      <line x1={-r * 0.55} y1={r * 0.8} x2={-r * 0.8} y2={r * 1.15} stroke={theme.color.ink} strokeWidth={r * 0.14} strokeLinecap="round" />
      <line x1={r * 0.55} y1={r * 0.8} x2={r * 0.8} y2={r * 1.15} stroke={theme.color.ink} strokeWidth={r * 0.14} strokeLinecap="round" />
      {/* ベル */}
      {[-1, 1].map((s) => (
        <path
          key={s}
          d={`M${s * r * 0.35} ${-r * 0.95} A${r * 0.42} ${r * 0.42} 0 0 1 ${s * r * 1.0} ${-r * 0.45} Z`}
          fill="#E0603F"
          stroke={theme.color.ink}
          strokeWidth={r * 0.08}
          strokeLinejoin="round"
          transform={ring ? `rotate(${s * Math.sin(frame * 3) * 12})` : undefined}
        />
      ))}
      <circle cx={0} cy={0} r={r} fill="#E0603F" stroke={theme.color.ink} strokeWidth={r * 0.09} />
      <g transform={`scale(0.78)`}>
        <Dial r={r} hour={hour} minute={minute} />
      </g>
      {/* 鳴っている線 */}
      {ring
        ? [-1, 1].map((s) =>
            [0, 1, 2].map((i) => {
              const a = (-50 + i * 30) * (Math.PI / 180);
              const r1 = r * 1.25 + (frame % 4) * 3;
              const r2 = r * 1.6 + (frame % 4) * 3;
              return (
                <line key={`${s}${i}`} x1={s * Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={s * Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={theme.color.ink} strokeWidth={r * 0.09} strokeLinecap="round" />
              );
            }),
          )
        : null}
    </svg>
  );
};

// 眠っているしるしの「Z」。上へ漂いながら消える
export const Zzz: React.FC<{ x: number; y: number; frame: number; size?: number }> = ({ x, y, frame, size = 46 }) => (
  <>
    {[0, 1, 2].map((i) => {
      const p = ((frame + i * 20) % 60) / 60;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + p * 50 + i * 6,
            top: y - p * 90,
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
