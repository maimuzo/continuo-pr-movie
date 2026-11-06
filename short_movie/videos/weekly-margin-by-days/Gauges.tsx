import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../_shared/theme";

// どの日も自分の分が残る回だけで使う部品。
// 寝て待つ回の Gauges.tsx（LabeledBattery・DayCalendar・FastForward）を写して直したもの（回をまたいで import できないため。寝て待つ回のファイルは変えない）。
// 電池は共有の Battery と同じ形・色を2倍の大きさで描き、「自分の分」の点線と斜線と札を足す（MarginBattery）。
// 残りは左から a〜b の区間で渡す。たまるときは左から右へ伸び、使うときは左の端が右へ寄って、点線（右端から自分の分の幅）で止まる。
// 日めくりは数字の代わりに「リセットまで」「あと N日」の2段（DaysLeftCalendar）。看板（MarginTable）・ベル・赤い「×」も置く

const RED = "#D9483B";
const FILL = "#F2C14E"; // 共有の Battery の中身と同じ黄色
const BROWN = "#5A3A22"; // 点線の濃い茶

// ---- 電池 ----
// 共有の Battery（幅 150・高さ 62）を K 倍した寸法。(cx, top) は電池の上辺の真ん中
const K = 2;
export const MB = {
  bodyL: (cx: number) => cx - 75 * K, // 本体の左端
  bodyW: 132 * K,
  bodyH: 62 * K,
  inL: (cx: number) => cx - 75 * K + 9 * K, // 中身の左端
  inW: 116 * K,
  inTop: 9 * K,
  inH: 44 * K,
};
// 自分の分 m（%）の点線の x。満タン側（右端）から m の幅のところ
export const marginX = (cx: number, m: number) => MB.inL(cx) + (1 - m / 100) * MB.inW;

export const MarginBattery: React.FC<{
  cx: number;
  top: number;
  fill: { a: number; b: number }; // 電池の残りは、左から a〜b（0〜100）の区間。たまるときは b が右へ伸び、使うときは a が右へ寄る
  margin: number | null; // 自分の分（%）。null のあいだは点線を出さない
  marginOpacity?: number;
  tagText?: string;
  tagOpacity?: number;
  tagPop?: number; // 札の出だしの弾み（0〜1）
  alarm?: boolean;
  frame: number;
  pulse?: number;
  label: string;
  labelCx: number;
}> = ({ cx, top, fill, margin, marginOpacity = 1, tagText = "自分の分", tagOpacity = 1, tagPop = 1, alarm = false, frame, pulse = 0, label, labelCx }) => {
  const blinkOn = alarm && Math.floor(frame / 5) % 2 === 0;
  const left = MB.bodyL(cx);
  const inL = MB.inL(cx);
  const c01 = (v: number) => Math.max(0, Math.min(1, v / 100));
  const fillX = inL + c01(fill.a) * MB.inW;
  const fillW = Math.max(0, c01(fill.b) - c01(fill.a)) * MB.inW;
  const lx = margin === null ? 0 : marginX(cx, margin);
  const inR = inL + MB.inW;
  // 札は斜線の真ん中を指す。札の本体は「1週間」の札と重ならないよう、右へ寄せる
  const hatchMid = (lx + inR) / 2;
  const tagCx = Math.max(hatchMid, cx + 70);
  const bx = Math.max(tagCx - 55, Math.min(tagCx + 55, hatchMid)); // 三角の付け根
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080, transform: `scale(${1 + pulse * 0.08})`, transformOrigin: `${cx}px ${top + MB.bodyH / 2}px` }}>
      {/* 札「1週間」 */}
      <div
        style={{
          position: "absolute",
          left: labelCx,
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
      <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <pattern id="wmbd-hatch" patternUnits="userSpaceOnUse" width={18} height={18} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={18} stroke="#FFFFFF" strokeWidth={8} opacity={0.6} />
          </pattern>
        </defs>
        <rect x={left} y={top} width={MB.bodyW} height={MB.bodyH} rx={14 * K} fill="#FFFDF7" stroke={alarm && blinkOn ? RED : theme.color.ink} strokeWidth={alarm ? 14 : 10} />
        <rect x={left + MB.bodyW} y={top + (31 - 13) * K} width={12 * K} height={26 * K} rx={4 * K} fill={theme.color.ink} />
        {fillW > 0.5 ? (
          <rect x={fillX} y={top + MB.inTop} width={fillW} height={MB.inH} rx={7 * K} fill={FILL} stroke={theme.color.ink} strokeWidth={fillW > 10 ? 5 : 0} />
        ) : null}
        {/* 自分の分（点線より右）は薄い斜線（残りの黄色の上に、白い斜線を重ねる） */}
        {margin !== null && margin > 0.2 ? (
          <rect x={lx} y={top + MB.inTop} width={inR - lx} height={MB.inH} fill="url(#wmbd-hatch)" opacity={marginOpacity} />
        ) : null}
        {margin !== null ? (
          <g opacity={marginOpacity}>
            <line x1={lx} y1={top + 6} x2={lx} y2={top + MB.bodyH - 6} stroke="#FFFFFF" strokeWidth={10} />
            <line x1={lx} y1={top + 6} x2={lx} y2={top + MB.bodyH - 6} stroke={BROWN} strokeWidth={6} strokeDasharray="14 9" />
          </g>
        ) : null}
        {alarm ? (
          <text x={left + MB.bodyW / 2} y={top + MB.bodyH / 2 + 38} textAnchor="middle" fontFamily={theme.fontFamily} fontWeight={800} fontSize={108} fill={blinkOn ? RED : "#E7B3AC"}>
            !
          </text>
        ) : null}
      </svg>
      {/* 札「自分の分」。下の三角で斜線の部分を指す */}
      {margin !== null && tagOpacity > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, opacity: tagOpacity * marginOpacity }}>
          <div
            style={{
              position: "absolute",
              left: tagCx,
              top: top - 20,
              transform: `translate(-50%, -100%) scale(${tagPop})`,
              transformOrigin: "50% 100%",
              zIndex: 1,
              padding: "2px 16px",
              background: FILL,
              border: `5px solid ${theme.color.ink}`,
              borderRadius: 14,
              fontFamily: theme.fontFamily,
              fontWeight: 800,
              fontSize: 34,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              color: theme.color.ink,
            }}
          >
            {tagText}
          </div>
          <svg width={1080} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: Math.min(1, tagPop), zIndex: 0 }}>
            <path
              d={`M${bx - 13} ${top - 25} L${bx + 13} ${top - 25} L${hatchMid} ${top - 2} Z`}
              fill={FILL}
              stroke={theme.color.ink}
              strokeWidth={5}
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
};

// ---- 日めくり ----
// (left, top) は左上。cur は見えているページの残り日数、next はその下のページ。flip（0〜1）は一番上のページが上へめくれていく度合い
export const DaysLeftCalendar: React.FC<{ left: number; top: number; cur: number; next: number; flip: number; scale?: number }> = ({ left, top, cur, next, flip, scale = 1 }) => {
  const W = 190;
  const H = 150;
  const HEAD = 30;
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        color: theme.color.ink,
        lineHeight: 1.1,
        ...style,
      }}
    >
      <div style={{ fontSize: 26 }}>リセットまで</div>
      <div style={{ fontSize: 44, marginTop: 4 }}>
        あと<span style={{ color: "#C8402E" }}>{n}</span>日
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left, top, width: W, height: H, transform: `scale(${scale})`, transformOrigin: "100% 0", perspective: 500 }}>
      {page(next, {})}
      {flip < 1 ? page(cur, { transformOrigin: "50% 0", transform: `rotateX(${flip * 100}deg)`, opacity: flip > 0.85 ? (1 - flip) / 0.15 : 1 }) : null}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: HEAD, background: "#E0603F", border: `5px solid ${theme.color.ink}`, borderRadius: "12px 12px 0 0", boxSizing: "border-box" }} />
      {[34, W - 34].map((x) => (
        <div key={x} style={{ position: "absolute", left: x - 8, top: -10, width: 16, height: 26, borderRadius: 8, background: "#C9C2B6", border: `4px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
      ))}
    </div>
  );
};

// ---- 早回しの印。寝て待つ回の印を写し、置き場所と高さを変えられるようにした ----
export const FastForward: React.FC<{ frame: number; left: number; top: number; height?: number }> = ({ frame, left, top, height = 64 }) => {
  const blink = Math.floor(frame / 8) % 2 === 0 ? 1 : 0.55;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 172,
        height,
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

// ---- 看板：残り日数ごとの「自分の分」の表 ----
// (left, top) は左上。active は今の残り日数（その行を黄色で光らせる）。出だしは弾んで出る
export const MarginTable: React.FC<{ left: number; top: number; width: number; rows: readonly (readonly [number, number])[]; active: number | null }> = ({ left, top, width, rows, active }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 220 } });
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        boxSizing: "border-box",
        padding: "10px 14px",
        background: "#FFFDF7",
        border: `6px solid ${theme.color.ink}`,
        borderRadius: 18,
        transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`,
        opacity: pop,
        transformOrigin: "50% 0",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 30,
        color: theme.color.ink,
      }}
    >
      {rows.map(([d, p]) => (
        <div
          key={d}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 42,
            padding: "0 16px",
            borderRadius: 10,
            background: active === d ? FILL : "transparent",
          }}
        >
          <span>あと{d}日</span>
          <span>{p}%</span>
        </div>
      ))}
    </div>
  );
};

// ---- リセットの時刻に鳴るベル。(cx, cy) は真ん中。ring（0〜1）のあいだ揺れて、まわりに鳴っている線を出す ----
export const Bell: React.FC<{ cx: number; cy: number; size: number; ring: number; frame: number; opacity?: number }> = ({ cx, cy, size, ring, frame, opacity = 1 }) => {
  const rot = Math.sin(frame * 1.6) * 22 * ring;
  const r = size / 2;
  return (
    <svg width={size * 2} height={size * 2} viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`} style={{ position: "absolute", left: cx - size, top: cy - size, overflow: "visible", opacity }}>
      <g transform={`rotate(${rot} 0 ${-r * 0.9})`}>
        <path
          d={`M${-r * 0.75} ${r * 0.55} Q${-r * 0.7} ${-r * 0.75} 0 ${-r * 0.8} Q${r * 0.7} ${-r * 0.75} ${r * 0.75} ${r * 0.55} Q${r * 0.95} ${r * 0.62} ${r * 0.95} ${r * 0.7} L${-r * 0.95} ${r * 0.7} Q${-r * 0.95} ${r * 0.62} ${-r * 0.75} ${r * 0.55} Z`}
          fill={FILL}
          stroke={theme.color.ink}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        <circle cx={0} cy={-r * 0.88} r={r * 0.12} fill={FILL} stroke={theme.color.ink} strokeWidth={5} />
        <circle cx={0} cy={r * 0.86} r={r * 0.16} fill={theme.color.ink} />
      </g>
      {ring > 0
        ? [-1, 1].map((s) =>
            [0, 1, 2].map((i) => {
              const a = (-35 + i * 30) * (Math.PI / 180);
              const r1 = r * 1.15 + (frame % 4) * 3;
              const r2 = r * 1.45 + (frame % 4) * 3;
              return <line key={`${s}${i}`} x1={s * Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={s * Math.cos(a) * r2} y2={Math.sin(a) * r2} stroke={theme.color.ink} strokeWidth={6} strokeLinecap="round" opacity={ring} />;
            }),
          )
        : null}
    </svg>
  );
};

// ---- ノートPC の画面に出す赤い「×」。(cx, cy) は真ん中。出だしは弾んで出る ----
export const RedCross: React.FC<{ cx: number; cy: number; size: number }> = ({ cx, cy, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const h = size / 2;
  return (
    <svg width={size} height={size} viewBox={`${-h} ${-h} ${size} ${size}`} style={{ position: "absolute", left: cx - h, top: cy - h, overflow: "visible", transform: `scale(${pop})` }}>
      <circle cx={0} cy={0} r={h} fill="#FFFDF7" stroke={theme.color.ink} strokeWidth={6} />
      <path d={`M${-h * 0.5} ${-h * 0.5} L${h * 0.5} ${h * 0.5} M${h * 0.5} ${-h * 0.5} L${-h * 0.5} ${h * 0.5}`} stroke={theme.color.ink} strokeWidth={size * 0.2} strokeLinecap="round" />
      <path d={`M${-h * 0.5} ${-h * 0.5} L${h * 0.5} ${h * 0.5} M${h * 0.5} ${-h * 0.5} L${-h * 0.5} ${h * 0.5}`} stroke={RED} strokeWidth={size * 0.12} strokeLinecap="round" />
    </svg>
  );
};
