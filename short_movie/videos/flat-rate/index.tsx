import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Exclamation, Sparkle, SpeedLines, Steam, Sweat } from "../components/Effects";
import { EndCard } from "./flat_rate/EndCard";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "./flat_rate/TitleCard";
import { sec, theme } from "../theme";
import { script } from "./flat_rate.script";

// 定額のままの回。2〜10秒は画面を左右に割り、左（従量課金）と右（continuo＝定額のまま）を同じ作りで並べる。
// 左右の違いは「レジの表示が回るか止まるか」と開発者の顔だけにし、どちらが何かは上の大きな看板の帯で見せる。
// 座標は、割った場面では幅540の半分の中の座標、引っ越しの場面では 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const ink = theme.color.ink;

// 定額の表示。実際のプランの値段と取り違えないように、金額は出さない
const FLAT_PRICE = "定額";

// ---- 品を積む拍子（左右で共通。動画の頭からの秒）----
const STACK_FROM = 2.3;
const STACK_EVERY = 0.5;
const STACK_UNTIL = 13;
const stackCount = (t: number) => (t < STACK_FROM ? 0 : Math.min(16, Math.floor((t - STACK_FROM) / STACK_EVERY) + 1));
// その拍の中のどこにいるか（0〜1）。前半は持ち上げ、後半は作業台で手を動かす
const beatPhase = (t: number) => (t < STACK_FROM ? 1 : ((t - STACK_FROM) / STACK_EVERY) % 1);

// 従量課金のレジの金額（円）。だんだん速く増える
const meteredYen = (t: number) => (t < 2 ? 0 : 1000 * Math.pow(t - 2, 2.2));

// ---- 部品：品・硬貨・レジ ----
const Parcel: React.FC<{ x: number; y: number; w?: number }> = ({ x, y, w = 62 }) => {
  const h = w * 0.72;
  return (
    <svg style={{ position: "absolute", left: x, top: y }} width={w + 8} height={h + 8} viewBox={`-4 -4 ${w + 8} ${h + 8}`}>
      <rect x={0} y={0} width={w} height={h} rx={5} fill="#D9A45F" stroke={ink} strokeWidth={4.5} />
      <rect x={0} y={h * 0.62} width={w} height={h * 0.38} rx={4} fill="#B98547" />
      <rect x={0} y={0} width={w} height={h} rx={5} fill="none" stroke={ink} strokeWidth={4.5} />
      <rect x={w * 0.42} y={0} width={w * 0.16} height={h} fill="#F2E3C4" stroke={ink} strokeWidth={3} />
      <circle cx={w * 0.22} cy={h * 0.36} r={w * 0.12} fill="#FFFFFF" stroke={ink} strokeWidth={3} />
      <path d={`M${w * 0.16} ${h * 0.37} l${w * 0.05} ${w * 0.05} l${w * 0.09} -${w * 0.1}`} fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// 積み上げた品の山。左下 (x, groundY) から、下の段ほど多く積む
const PILE_ROWS = [5, 4, 4, 3];
const pileSlot = (i: number, x: number, groundY: number, w: number) => {
  let row = 0;
  let k = i;
  while (row < PILE_ROWS.length - 1 && k >= PILE_ROWS[row]) {
    k -= PILE_ROWS[row];
    row++;
  }
  const h = w * 0.72;
  const offset = ((PILE_ROWS[0] - PILE_ROWS[row]) * w) / 2;
  return { x: x + offset + k * (w - 2), y: groundY - (row + 1) * (h - 1) };
};
const Pile: React.FC<{ count: number; x: number; groundY: number; w?: number; dropT?: number }> = ({ count, x, groundY, w = 44, dropT = 1 }) => (
  <>
    {Array.from({ length: Math.min(count, 16) }, (_, i) => {
      const p = pileSlot(i, x, groundY, w);
      const last = i === count - 1;
      const dy = last ? interpolate(dropT, [0, 0.5], [-60, 0], { ...clamp, easing: Easing.in(Easing.quad) }) : 0;
      return <Parcel key={i} x={p.x} y={p.y + dy} w={w} />;
    })}
  </>
);

const Coin: React.FC<{ x: number; y: number; r?: number; spin?: number }> = ({ x, y, r = 20, spin = 0 }) => (
  <svg style={{ position: "absolute", left: x - r - 4, top: y - r - 4 }} width={2 * r + 8} height={2 * r + 8}>
    <g transform={`translate(${r + 4} ${r + 4}) scale(${Math.max(0.25, Math.abs(Math.cos(spin)))} 1)`}>
      <circle r={r} fill="#F2C14E" stroke={ink} strokeWidth={4} />
      <circle r={r * 0.68} fill="none" stroke="#C9962A" strokeWidth={3} />
      <text y={r * 0.38} textAnchor="middle" fontFamily={theme.fontFamily} fontWeight={800} fontSize={r * 1.05} fill="#8A5E12">
        ¥
      </text>
    </g>
  </svg>
);

// 回転ドラムの数字1桁。value は小数を含む「この桁の値」（例 4.3 なら 4 から 5 へ 3割回った所）
const DIGIT_H = 46;
const Drum: React.FC<{ value: number; color: string }> = ({ value, color }) => {
  const v = ((value % 10) + 10) % 10;
  const base = Math.floor(v);
  const frac = v - base;
  return (
    <div style={{ position: "relative", width: 24, height: DIGIT_H, overflow: "hidden" }}>
      {[0, 1].map((k) => (
        <div
          key={k}
          style={{
            position: "absolute",
            left: 0,
            top: (k - frac) * DIGIT_H,
            width: 24,
            height: DIGIT_H,
            textAlign: "center",
            lineHeight: `${DIGIT_H}px`,
            fontFamily: theme.fontFamily,
            fontWeight: 800,
            fontSize: 38,
            color,
          }}
        >
          {(base + k) % 10}
        </div>
      ))}
    </div>
  );
};

// レジ。幅 260 の箱で、(x, y) が左上。
// yen を渡すと桁ごとに回る表示、fixed を渡すと止まった表示。
// off（0〜1）で、ブラウン管が消えるときのように表示が真ん中の横線に縮み、点になって消える。
const REG_W = 260;
const REG_H = 300;
const DISPLAY_COLOR = "#FFD86B";
const Register: React.FC<{ x: number; y: number; scale?: number; yen?: number; fixed?: string; off?: number; locked?: number; drawerOpen?: boolean; shake?: number }> = ({
  x,
  y,
  scale = 1,
  yen,
  fixed,
  off = 0,
  locked = -1,
  drawerOpen = false,
  shake = 0,
}) => {
  const digits = 6;
  // 下の桁ほど速く回る。上の桁は下の桁が繰り上がる間際にだけ回す（本物の回転ドラムと同じ）
  const drumValues = Array.from({ length: digits }, (_, d) => {
    if (yen === undefined) return 0;
    const unit = Math.pow(10, d);
    const whole = Math.floor(yen / unit);
    const below = (yen % unit) / unit; // 下の桁がどこまで回ったか
    return d === 0 ? (yen / unit) % 10 : whole + Math.max(0, (below - 0.9) / 0.1);
  });
  const lockDrop = interpolate(locked, [0, 0.6], [-160, 0], { ...clamp, easing: Easing.out(Easing.back(2.2)) });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: REG_W, height: REG_H, transform: `scale(${scale}) translateX(${shake}px)`, transformOrigin: "0 0" }}>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={REG_W} height={REG_H} viewBox={`0 0 ${REG_W} ${REG_H}`}>
        {/* 表示の台 */}
        <rect x={30} y={8} width={200} height={84} rx={14} fill="#5C6477" stroke={ink} strokeWidth={6} />
        <rect x={42} y={20} width={176} height={60} rx={8} fill="#2A2420" stroke={ink} strokeWidth={4} />
        <rect x={110} y={90} width={40} height={30} fill="#5C6477" stroke={ink} strokeWidth={5} />
        {/* 本体 */}
        <path d="M18 118 H242 L254 228 H6 Z" fill="#7C86A0" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
        <path d="M18 118 H242 L246 150 H14 Z" fill="#949DB4" />
        <path d="M18 118 H242 L254 228 H6 Z" fill="none" stroke={ink} strokeWidth={6} strokeLinejoin="round" />
        {/* キー */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x={40 + (i % 5) * 38} y={150 + Math.floor(i / 5) * 32} width={28} height={22} rx={5} fill={i === 9 ? "#E8772E" : "#FFFDF7"} stroke={ink} strokeWidth={3.5} />
        ))}
        {/* 引き出し */}
        <rect x={0} y={226} width={REG_W} height={58} rx={8} fill="#5C6477" stroke={ink} strokeWidth={6} />
        {drawerOpen ? (
          <>
            <rect x={-6} y={244} width={REG_W + 12} height={52} rx={6} fill="#3B3F4C" stroke={ink} strokeWidth={6} />
            {[30, 70, 110, 150, 190, 228].map((cx, i) => (
              <ellipse key={i} cx={cx} cy={256} rx={18} ry={8} fill="#F2C14E" stroke={ink} strokeWidth={3} />
            ))}
          </>
        ) : (
          <rect x={100} y={246} width={60} height={14} rx={7} fill="#3B3F4C" stroke={ink} strokeWidth={3.5} />
        )}
      </svg>
      {/* 金額の表示。off の前半で縦に潰れて白く光り、後半で横線が真ん中へ縮む */}
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 20,
          width: 176,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scaleY(${interpolate(off, [0, 0.35], [1, 0.03], clamp)})`,
          filter: `brightness(${interpolate(off, [0, 0.35], [1, 3], clamp)})`,
          opacity: off < 0.35 ? 1 : 0,
        }}
      >
        {fixed !== undefined ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap", fontFamily: theme.fontFamily, fontWeight: 800, color: DISPLAY_COLOR }}>
            <span style={{ fontSize: 40 }}>{FLAT_PRICE}</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 32, color: DISPLAY_COLOR, marginRight: 2 }}>¥</span>
            {drumValues
              .map((v, d) => ({ v, d }))
              .reverse()
              .map(({ v, d }) => (
                <Drum key={d} value={v} color={DISPLAY_COLOR} />
              ))}
          </div>
        )}
      </div>
      {off > 0 && off < 1 ? <CrtLine off={off} /> : null}
      {/* 錠 */}
      {locked >= 0 ? (
        <svg style={{ position: "absolute", left: REG_W / 2 - 42, top: 196 + lockDrop }} width={84} height={110} viewBox="0 0 84 110">
          <path d="M20 50 V32 A22 22 0 0 1 64 32 V50" fill="none" stroke={ink} strokeWidth={18} strokeLinecap="round" />
          <path d="M20 50 V32 A22 22 0 0 1 64 32 V50" fill="none" stroke="#B9BFCB" strokeWidth={9} strokeLinecap="round" />
          <rect x={6} y={46} width={72} height={58} rx={10} fill="#F2C14E" stroke={ink} strokeWidth={6} />
          <circle cx={42} cy={70} r={8} fill={ink} />
          <rect x={38} y={72} width={8} height={18} rx={3} fill={ink} />
        </svg>
      ) : null}
    </div>
  );
};

// 表示が消えるときの白い横線。真ん中に縮んで、最後は点になって消える
const CrtLine: React.FC<{ off: number }> = ({ off }) => {
  if (off < 0.3) return null;
  const w = interpolate(off, [0.35, 0.85], [176, 6], { ...clamp, easing: Easing.in(Easing.quad) });
  const a = interpolate(off, [0.85, 1], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 42 + (176 - w) / 2,
        top: 20 + 30 - 3,
        width: w,
        height: 6,
        borderRadius: 3,
        background: "#FFFFFF",
        boxShadow: "0 0 12px 4px rgba(200,230,255,0.9)",
        opacity: a,
      }}
    />
  );
};

// 硬貨が飛び出す。from は飛び出す所、t は飛び出してからの秒
const CoinBurst: React.FC<{ fromX: number; fromY: number; t: number; seed: number }> = ({ fromX, fromY, t, seed }) => {
  if (t < 0 || t > 0.9) return null;
  return (
    <>
      {[0, 1, 2].map((k) => {
        const dir = ((seed * 7 + k * 5) % 3) - 1; // -1, 0, 1
        const vx = (dir * 120 + (k - 1) * 70) * 1.4;
        const vy = -520 - k * 60;
        const g = 1500;
        return <Coin key={k} x={fromX + vx * t} y={fromY + vy * t + (g * t * t) / 2} r={19} spin={t * 14 + k} />;
      })}
    </>
  );
};

// ---- 背景 ----
const HalfBackground: React.FC<{ gloomy?: boolean }> = ({ gloomy }) => (
  <Img
    src={staticFile("backgrounds/workshop.png")}
    style={{ position: "absolute", left: -270, top: 0, width: 1080, height: 1080, filter: gloomy ? "saturate(0.55) brightness(0.9)" : undefined }}
  />
);

// 看板の帯。半分の幅いっぱいに目立つ色の帯を渡し、太い字を大きく出す（字幕より目立たせる）
const BANNER_TOP = 18;
const BANNER_H = 150;
const Label: React.FC<{ text: string; color: string; x?: number; width?: number; fontSize?: number }> = ({ text, color, x = 0, width = 540, fontSize = 104 }) => (
  <div
    style={{
      position: "absolute",
      left: x + 14,
      top: BANNER_TOP,
      width: width - 28,
      height: BANNER_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: color,
      border: `8px solid ${ink}`,
      borderRadius: 22,
      boxShadow: `0 8px 0 ${ink}`,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize,
        lineHeight: 1,
        whiteSpace: "nowrap",
        color: "#FFFFFF",
        WebkitTextStroke: `14px ${ink}`,
        paintOrder: "stroke fill",
      }}
    >
      {text}
    </div>
  </div>
);
const METERED_RED = "#D8402F";

// ---- 半分の中の配置（幅540）----
// 右上にレジ、左に品を積む台、その手前に Claude Code、右手前に開発者
const H_REG = { x: 258, y: 200 };
const H_TABLE = { x: 6, y: 600, w: 268 };
const H_PILE = { x: 12, groundY: H_TABLE.y + 4, w: 52 };
const H_CC = { cx: 165, baseY: 910, height: 255 };
const H_DEV = { cx: 425, baseY: 915 };

// 品を積む台。上の板の高さが y
const PileTable: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => (
  <svg style={{ position: "absolute", left: x, top: y }} width={w} height={330}>
    <rect x={18} y={20} width={22} height={300} rx={4} fill="#94632F" stroke={ink} strokeWidth={5} />
    <rect x={w - 40} y={20} width={22} height={300} rx={4} fill="#94632F" stroke={ink} strokeWidth={5} />
    <rect x={4} y={4} width={w - 8} height={30} rx={6} fill="#B98547" stroke={ink} strokeWidth={6} />
  </svg>
);

// Claude Code が品を持ち上げて積む。t は動画の頭からの秒
const StackingRobot: React.FC<{ t: number; cx: number; baseY: number; height: number }> = ({ t, cx, baseY, height }) => {
  const f = useCurrentFrame();
  const ph = beatPhase(t);
  const lifting = t >= STACK_FROM && ph < 0.5;
  const hop = lifting ? -Math.sin((ph / 0.5) * Math.PI) * 22 : 0;
  const wiggle = lifting ? 0 : Math.sin(f * 1.6) * 3;
  return lifting ? (
    <Sprite src="ep/flat_rate/cc_lift.png" cx={cx} baseY={baseY + hop} height={height * 1.12} squash={false} />
  ) : (
    <Sprite src="characters/claude_code/work.png" cx={cx + wiggle} baseY={baseY} height={height} squash={false} rotate={wiggle / 2} />
  );
};

// 左半分：従量課金
const MeteredHalf: React.FC<{ t: number }> = ({ t }) => {
  const f = useCurrentFrame();
  const count = stackCount(t);
  const lastAt = STACK_FROM + (count - 1) * STACK_EVERY;
  const sinceBox = t - lastAt;
  const shake = count > 0 && sinceBox < 0.15 ? Math.sin(f * 3) * 4 : 0;
  const T_SHOCK = 2.9;
  return (
    <AbsoluteFill style={{ width: 540, overflow: "hidden" }}>
      <HalfBackground gloomy />
      <Label text="従量課金" color={METERED_RED} />
      <Register x={H_REG.x} y={H_REG.y} yen={meteredYen(t)} drawerOpen={count > 0} shake={shake} />
      <PileTable x={H_TABLE.x} y={H_TABLE.y} w={H_TABLE.w} />
      <Pile count={count} x={H_PILE.x} groundY={H_PILE.groundY} w={H_PILE.w} dropT={sinceBox / STACK_EVERY} />
      <StackingRobot t={t} cx={H_CC.cx} baseY={H_CC.baseY} height={H_CC.height} />
      <Sprite src="ep/flat_rate/dev_pale.png" cx={H_DEV.cx} baseY={H_DEV.baseY + (t > T_SHOCK ? Math.sin(f * 2.2) * 2 : 0)} height={350} flip squash={false} />
      {t > T_SHOCK + 0.3 ? <PaleLines x={H_DEV.cx - 60} y={H_DEV.baseY - 300} /> : null}
      {t > T_SHOCK + 0.3 ? <Sweat x={H_DEV.cx + 70} y={H_DEV.baseY - 300} scale={0.8} /> : null}
      <Sequence from={sec(T_SHOCK - 2)} durationInFrames={sec(0.7)}>
        <Exclamation x={H_DEV.cx + 30} y={H_DEV.baseY - 420} />
      </Sequence>
      {/* 積むたびに硬貨が飛ぶ。直前の2回ぶんを重ねて描く */}
      {[0, 1].map((k) => (
        <CoinBurst key={k} fromX={H_REG.x + REG_W / 2} fromY={H_REG.y + 260} t={sinceBox + k * STACK_EVERY} seed={count - k} />
      ))}
    </AbsoluteFill>
  );
};

// 青ざめた顔にかかる縦線
const PaleLines: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg style={{ position: "absolute", left: x, top: y }} width={90} height={70}>
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={10 + i * 22} y1={4} x2={10 + i * 22} y2={40 + (i % 2) * 18} stroke="#5B79C8" strokeWidth={6} strokeLinecap="round" />
    ))}
  </svg>
);

// 右半分：continuo（定額のまま）
const FlatHalf: React.FC<{ t: number; lockT: number }> = ({ t, lockT }) => {
  const f = useCurrentFrame();
  const count = stackCount(t);
  const lastAt = STACK_FROM + (count - 1) * STACK_EVERY;
  const sinceBox = t - lastAt;
  return (
    <AbsoluteFill style={{ width: 540, overflow: "hidden" }}>
      <HalfBackground />
      <Label text="continuo" color={theme.color.accent} />
      <Register x={H_REG.x} y={H_REG.y} fixed={FLAT_PRICE} locked={lockT} />
      <PileTable x={H_TABLE.x} y={H_TABLE.y} w={H_TABLE.w} />
      <Pile count={count} x={H_PILE.x} groundY={H_PILE.groundY} w={H_PILE.w} dropT={sinceBox / STACK_EVERY} />
      <StackingRobot t={t} cx={H_CC.cx} baseY={H_CC.baseY} height={H_CC.height} />
      {/* コンティは Claude Code の頭の上で、ヒレを振って見守る */}
      <Sprite src="characters/continuo/wave.png" cx={315} baseY={600 + Math.sin(f / 7) * 6} height={95} flip squash={false} rotate={Math.sin(f / 4) * 6} />
      <Sprite src="characters/developer/sip_coffee.png" cx={H_DEV.cx + 5} baseY={H_DEV.baseY + 10} height={330} squash={false} />
      <Steam x={H_DEV.cx - 135} y={H_DEV.baseY - 390} />
    </AbsoluteFill>
  );
};

// 2〜6秒に右半分を閉じておくシャッター。open は 0〜1 で、1 で上まで上がる
const Shutter: React.FC<{ open: number }> = ({ open }) => {
  const top = -1080 * open;
  return (
    <div style={{ position: "absolute", left: 0, top, width: 540, height: 1080, background: "#B8B2A6" }}>
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={540} height={1080}>
        {Array.from({ length: 27 }, (_, i) => (
          <line key={i} x1={0} y1={i * 40 + 20} x2={540} y2={i * 40 + 20} stroke="#8F8878" strokeWidth={5} />
        ))}
        <rect x={0} y={1040} width={540} height={40} fill="#7B7466" stroke={ink} strokeWidth={6} />
        <rect x={230} y={1046} width={80} height={14} rx={7} fill={ink} />
      </svg>
      <div style={{ position: "absolute", top: 340, width: 540, textAlign: "center", fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 220, color: "#FFFDF7", WebkitTextStroke: `14px ${ink}`, paintOrder: "stroke fill" }}>
        ？
      </div>
    </div>
  );
};

// 2〜10秒：左右に割った場面
const T_REVEAL = 6.0;
const T_LOCK = 6.5;
const SplitScene: React.FC<{ fromSec: number; showTag?: boolean }> = ({ fromSec, showTag = true }) => {
  const f = useCurrentFrame();
  const t = fromSec + f / theme.fps;
  const open = interpolate(t, [T_REVEAL, T_REVEAL + 0.35], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1080 }}>
        <MeteredHalf t={t} />
      </div>
      <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1080, overflow: "hidden" }}>
        <FlatHalf t={t} lockT={t - T_LOCK} />
        {open < 1 ? <Shutter open={open} /> : null}
        {t >= T_LOCK + 0.35 && t < T_LOCK + 1.0 ? (
          <Sequence from={0}>
            <Sparkle x={H_REG.x + REG_W / 2 + 30} y={H_REG.y + 160} />
          </Sequence>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: 534, top: 0, width: 12, height: 1080, background: ink }} />
      {/* 名前の札。Claude Code が初めて出たとき */}
      {showTag ? (
        <Sequence from={sec(2.1 - fromSec)} durationInFrames={sec(1.5)}>
          <NameTag cx={H_CC.cx} tipY={H_CC.baseY - H_CC.height - 10} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(1.5)} fontSize={36} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- 10〜13秒：電源を抜いて、右の工房へ引っ越す ----
const M_REG = { x: 40, y: 300, scale: 0.95 };
const M_STAND = { x: 30, y: 300 + REG_H * 0.95 - 6, w: 270, h: 330 };
const OUTLET = { x: 340, y: 610 };
const M_FLAT_REG = { x: 830, y: 330, scale: 0.8 };
const M_CC = { cx: 945, baseY: 905, height: 240 };
const M_PILE = { x: 780, groundY: 905, w: 36 };
const UNPLUG_DEV = { cx: 466, baseY: 875, height: 390 };
const T_UNPLUG = 0.5; // 場面の頭からの秒
const T_WALK = 1.1;
const T_ARRIVE = 2.7;

const MoveScene: React.FC = () => {
  const f = useCurrentFrame();
  const local = f / theme.fps;
  const t = S("move").from + local;
  // 抜いた瞬間から 0.55秒で、ブラウン管が消えるように表示が横線に縮んで消える（音の「ブォン」と同じ長さ）
  const off = interpolate(local, [T_UNPLUG, T_UNPLUG + 0.55], [0, 1], clamp);
  // 抜いた瞬間に金額が止まり、表示が消える
  const yen = meteredYen(Math.min(t, S("move").from + T_UNPLUG));
  const walk = interpolate(local, [T_WALK, T_ARRIVE], [0, 1], { ...clamp, easing: ease });
  const devCx = lerp(walk, UNPLUG_DEV.cx + 70, 640);
  const step = local >= T_WALK && local < T_ARRIVE ? Math.abs(Math.sin(local * 14)) * -10 : 0;
  // 抜く前は、プラグを握った手がコンセントの所にある。抜くと体ごと右へ下がる
  const back = interpolate(local, [T_UNPLUG - 0.05, T_UNPLUG + 0.15], [0, 70], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const devPullCx = UNPLUG_DEV.cx + back;
  // コードの先（dev_unplug を裏返した絵で、握りこぶしの下からコードが垂れる所）
  const plugEnd = { x: devPullCx - 128, y: UNPLUG_DEV.baseY - 178 };
  const cordFrom = { x: M_REG.x + REG_W * M_REG.scale - 30, y: M_REG.y + 200 };
  const count = stackCount(t);
  const sinceBox = t - (STACK_FROM + (count - 1) * STACK_EVERY);
  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080 }} />
      {/* 左の隅は彩度を落とし、従量課金の場所だと分かるようにする */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 400, height: 1080, background: "rgba(60,64,80,0.28)" }} />
      <Label text="従量課金" color={METERED_RED} x={0} width={420} fontSize={88} />
      <Label text="continuo" color={theme.color.accent} x={600} width={480} fontSize={96} />

      {/* 左：従量課金のレジと台、壁のコンセント */}
      <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1080}>
        <rect x={M_STAND.x} y={M_STAND.y} width={M_STAND.w} height={M_STAND.h} rx={8} fill="#A8743F" stroke={ink} strokeWidth={6} />
        <rect x={M_STAND.x + 20} y={M_STAND.y + 40} width={M_STAND.w - 40} height={110} rx={6} fill="#94632F" stroke={ink} strokeWidth={4} />
        <rect x={OUTLET.x} y={OUTLET.y} width={52} height={70} rx={8} fill="#FFFDF7" stroke={ink} strokeWidth={5} />
        <rect x={OUTLET.x + 16} y={OUTLET.y + 22} width={5} height={14} fill={ink} />
        <rect x={OUTLET.x + 31} y={OUTLET.y + 22} width={5} height={14} fill={ink} />
        <path
          d={`M${cordFrom.x} ${cordFrom.y} C ${cordFrom.x + 40} ${cordFrom.y + 160}, ${plugEnd.x - 60} ${plugEnd.y + 120}, ${plugEnd.x} ${plugEnd.y}`}
          fill="none"
          stroke={ink}
          strokeWidth={9}
          strokeLinecap="round"
        />
      </svg>
      <Register x={M_REG.x} y={M_REG.y} scale={M_REG.scale} yen={yen} off={off} drawerOpen />
      <Sequence from={sec(T_UNPLUG)} durationInFrames={sec(0.5)}>
        <Exclamation x={OUTLET.x + 30} y={OUTLET.y - 150} />
      </Sequence>

      {/* 右：錠の掛かった定額のレジと、品を積む Claude Code とコンティ */}
      <Register x={M_FLAT_REG.x} y={M_FLAT_REG.y} scale={M_FLAT_REG.scale} fixed={FLAT_PRICE} locked={5} />
      <Pile count={count} x={M_PILE.x} groundY={M_PILE.groundY} w={M_PILE.w} dropT={sinceBox / STACK_EVERY} />
      <StackingRobot t={t} cx={M_CC.cx} baseY={M_CC.baseY} height={M_CC.height} />
      <Sprite src="characters/continuo/wave.png" cx={930} baseY={322 + Math.sin(f / 7) * 6} height={110} flip squash={false} rotate={Math.sin(f / 4) * 6} />

      {/* 開発者：抜く → 箱を抱えて右へ */}
      {local < T_WALK ? (
        <Sprite src="ep/flat_rate/dev_unplug.png" cx={devPullCx} baseY={UNPLUG_DEV.baseY} height={UNPLUG_DEV.height} flip squash={false} />
      ) : (
        <Sprite src="ep/flat_rate/dev_carry.png" cx={devCx} baseY={910 + step} height={380} squash={false} />
      )}
      <Sequence from={sec(T_WALK)} durationInFrames={sec(T_ARRIVE - T_WALK)}>
        <SpeedLines x={340} y={620} width={160} height={140} direction={1} />
      </Sequence>
      <Sequence from={sec(T_ARRIVE)} durationInFrames={sec(0.8)}>
        <Sparkle x={devCx + 70} y={430} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 効果音。at は動画の頭からの秒。左のレジは品を積むたびに「チャリン」と鳴り、右は鳴らない
const coinTimes = Array.from({ length: 16 }, (_, i) => STACK_FROM + i * STACK_EVERY).filter((s) => s < S("move").from + T_UNPLUG);
const SFX: { name: string; at: number; volume: number }[] = [
  ...coinTimes.map((s, i) => ({ name: "flat_rate_coin", at: s, volume: s < T_REVEAL ? 0.45 : 0.22 + (i % 2) * 0.03 })),
  { name: "whoosh", at: T_REVEAL, volume: 0.45 }, // シャッターが上がる
  { name: "flat_rate_lock", at: T_LOCK + 0.25, volume: 0.8 }, // 錠が掛かる
  { name: "flat_rate_crt_off", at: S("move").from + T_UNPLUG, volume: 0.9 }, // 電源を抜く。ブラウン管が消える「ブォン」
  { name: "swish", at: S("move").from + T_WALK, volume: 0.5 }, // 箱を抱えて歩き出す
  { name: "sparkle", at: S("move").from + T_ARRIVE, volume: 0.45 }, // 右の工房に着く
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

// 字幕の字の大きさ。英字は和字の 0.55 字ぶんと数え、1行が 960px に収まる大きさにする（最大 64）
const captionSize = (text: string) => {
  const units = Array.from(text).reduce((n, c) => n + (c.charCodeAt(0) < 128 ? 0.55 : 1), 0);
  return Math.min(64, Math.floor(960 / units));
};

const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 540, height: 1080, overflow: "hidden" }}>
      <HalfBackground gloomy />
    </div>
    <div style={{ position: "absolute", left: 540, top: 0, width: 540, height: 1080, overflow: "hidden" }}>
      <HalfBackground />
    </div>
    <div style={{ position: "absolute", left: 534, top: 0, width: 12, height: 1080, background: ink }} />
  </AbsoluteFill>
);

export const FlatRate: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence from={sec(S("metered").from)} durationInFrames={sec(S("flat").to - S("metered").from)}>
      <SplitScene fromSec={S("metered").from} />
    </Sequence>
    <Sequence from={sec(S("move").from)} durationInFrames={sec(3)}>
      <MoveScene />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} size={captionSize(s.caption)} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(2)}>
      <TitleCard text={script.title} outFrom={sec(1.7)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <EndCard text={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={680} fontSize={92} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
