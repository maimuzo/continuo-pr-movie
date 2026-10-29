import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Exclamation, Sparkle, SpeedLines, Steam, Sweat } from "../components/Effects";
import { EndCard } from "./resume/EndCard";
import { IssueCard } from "../components/IssueCard";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { sec, theme } from "../theme";
import { script } from "./resume.script";

// 止めても続きからの回。2〜13秒は「開発者の PC の画面に窓が2つ並ぶ」1つのカットで通す。
// コンティは左の窓（continuo）、Claude Code は右の窓（pane）の中だけで動き、窓の外は切り取る。
// 止めて暗くなるのは左の窓だけで、モニターの電源の灯りと右の窓は最後まで点いたまま。
// 時刻はすべて動画の頭からの秒で書く。座標は 1080×1080 の画面の座標（窓の中身は窓の中身の左上からの座標）

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const ink = theme.color.ink;

// ---- 時刻（秒）----
const T = {
  keyIn: 3.0, // Ctrl+C のキーが出る
  press: 3.2, // 押す
  dark: 3.6, // 左の窓が暗くなりきる
  sign: 3.5, // 「休業」の札が落ちる
  sip: 3.7, // 開発者はコーヒー
  keyOut: 4.1,
  done: 4.6, // Claude Code が手元の作業を仕上げる
  sit: 5.0, // 座って待つ
  nightFrom: 4.8,
  nightTo: 5.6,
  morning: 6.0, // 翌朝
  type: 6.4, // continuo と打つ
  enter: 7.2,
  light: 7.3, // 左の窓が明るくなる
  leap: 7.5, // 潮を吹いて跳ねる
  toEdge: 8.1, // 窓の右の端へ寄る
  stand: 8.4, // Claude Code が立って手を出す
  pass: 8.5, // 紙が境目を越える
  got: 9.2,
  fist: 10.0, // 続きを始める気合
  work2: 10.4,
  letdown: 10.3, // 開発者が拍子抜け
};

// ---- 配置 ----
const MON = { x: 40, y: 34, w: 1000, h: 626 };
const BAR = 52; // 窓の題名の帯
const WIN_L = { x: 78, y: 72, w: 458, h: 546 };
const WIN_R = { x: 546, y: 72, w: 458, h: 546 };
const CONTENT_H = WIN_L.h - BAR;
const DESK_Y = 700;
const DEV = { cx: 180, baseY: 1085 };
const KEY = { x: 360, y: 770, w: 250, h: 120 };
// 左の窓の中のコンティ（中身の座標）
const WHALE = { cx: 229, baseY: 335, h: 200 };
const WAVE_W = (WHALE.h * 729) / 556;
// 右の窓の中の作業台と Claude Code（中身の座標）
const BENCH = { x: 10, y: 290, w: 440 };
const CC = { cx: 250, baseBehind: 395, h: 320 };

// ---- 部品 ----

// 窓1つ。題名の帯と中身。dim（0〜1）で中身に暗い幕をかけ、帯を灰色にする
const Window: React.FC<{ box: typeof WIN_L; title: string; dim?: number; children: React.ReactNode; over?: React.ReactNode }> = ({
  box,
  title,
  dim = 0,
  children,
  over,
}) => (
  <div
    style={{
      position: "absolute",
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      border: `6px solid ${ink}`,
      borderRadius: 16,
      overflow: "hidden",
      background: "#FFFFFF",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        height: BAR,
        background: mix("#F1EBDF", "#55565E", dim),
        borderBottom: `5px solid ${ink}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        paddingLeft: 16,
        boxSizing: "border-box",
      }}
    >
      {["#E8645A", "#F2C14E", "#5DBB63"].map((c) => (
        <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: mix(c, "#7A7A80", dim), border: `3px solid ${ink}` }} />
      ))}
      <div style={{ marginLeft: 10, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 32, color: mix(ink, "#C9C9CF", dim) }}>{title}</div>
    </div>
    <div style={{ position: "absolute", left: 0, top: BAR, right: 0, bottom: 0, overflow: "hidden" }}>
      {children}
      <div style={{ position: "absolute", inset: 0, background: "#141826", opacity: dim * 0.78 }} />
      {over}
    </div>
  </div>
);

// 2色を t（0〜1）で混ぜる
function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(lerp(t, v, y[i]))).join(",")})`;
}

// 「休業」の札。上から紐で下がる木の板
const ClosedSign: React.FC<{ cx: number; y: number }> = ({ cx, y }) => (
  <svg style={{ position: "absolute", left: cx - 120, top: y - 120 }} width={240} height={240}>
    <path d="M60 120 L120 20 L180 120" fill="none" stroke={ink} strokeWidth={5} />
    <circle cx={120} cy={20} r={8} fill="#B0B0B0" stroke={ink} strokeWidth={4} />
    <rect x={14} y={112} width={212} height={110} rx={14} fill="#C9935A" stroke={ink} strokeWidth={6} />
    <rect x={26} y={124} width={188} height={86} rx={8} fill="#DDB07A" />
    <text x={120} y={188} textAnchor="middle" fontFamily={theme.fontFamily} fontWeight={800} fontSize={60} fill={ink}>
      休業
    </text>
  </svg>
);

// 大きなキー。press（0〜1）で沈む
const BigKey: React.FC<{ label: string; x: number; y: number; w: number; h: number; press: number; fontSize?: number }> = ({ label, x, y, w, h, press, fontSize = 62 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
    <div style={{ position: "absolute", left: 0, top: 14, width: w, height: h - 14, borderRadius: 22, background: "#1E1F24", border: `6px solid ${ink}`, boxSizing: "border-box" }} />
    <div
      style={{
        position: "absolute",
        left: 6,
        top: lerp(press, 0, 12),
        width: w - 12,
        height: h - 24,
        borderRadius: 18,
        background: "#3A3C44",
        border: `6px solid ${ink}`,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize,
        color: "#FFFFFF",
      }}
    >
      {label}
    </div>
  </div>
);

// 押した勢いの短い線
const PressMarks: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 2, 14], [0, 1, 0], clamp);
  return (
    <svg style={{ position: "absolute", left: x, top: y, opacity: o }} width={260} height={60}>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={30 + i * 60} y1={50} x2={42 + i * 60} y2={10} stroke={theme.color.highlight} strokeWidth={9} strokeLinecap="round" />
      ))}
    </svg>
  );
};

// 「翌朝」の札と太陽
const MorningTag: React.FC = () => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 5, 9], [0, 1.15, 1], clamp);
  const out = interpolate(f, [sec(0.85), sec(1.05)], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 540, top: 330, transform: `translate(-50%, -50%) scale(${pop})`, opacity: out }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 40px 14px 26px",
          background: "#FFF4D6",
          border: `7px solid ${ink}`,
          borderRadius: 999,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 84,
          color: ink,
        }}
      >
        <svg width={96} height={96} viewBox="-48 -48 96 96" style={{ transform: `rotate(${f * 2}deg)` }}>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 44} y2={Math.sin(a) * 44} stroke={ink} strokeWidth={7} strokeLinecap="round" />;
          })}
          <circle r={22} fill="#F2C14E" stroke={ink} strokeWidth={6} />
        </svg>
        翌朝
      </div>
    </div>
  );
};

// 仕上がった印のチェック
const DoneBadge: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 4, 8], [0, 1.25, 1], clamp);
  return (
    <svg style={{ position: "absolute", left: x, top: y, transform: `scale(${s})` }} width={80} height={80} viewBox="0 0 80 80">
      <circle cx={40} cy={40} r={34} fill="#5DBB63" stroke={ink} strokeWidth={6} />
      <path d="M22 41 L35 54 L58 28" fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ---- 1つのカット。t は動画の頭からの秒（タイトルの後ろでは止めた時刻を渡す）----
const Room: React.FC<{ t: number }> = ({ t }) => {
  const f = sec(t);
  const morning = t >= T.morning;
  // 夜：部屋（モニターの外）だけを青く暗くする。翌朝で明るく戻す
  const night = morning ? 0 : interpolate(t, [T.nightFrom, T.nightTo], [0, 1], clamp);
  const sun = morning ? interpolate(t, [T.morning, T.morning + 0.4], [0, 1], clamp) : 0;
  // 左の窓の暗さ：押すと暗くなり、翌朝 continuo を起動すると明るくなる
  const dim = t < T.light ? interpolate(t, [T.press, T.dark], [0, 1], clamp) : interpolate(t, [T.light, T.light + 0.3], [1, 0], clamp);
  const stopped = t >= T.press && t < T.light;

  return (
    <AbsoluteFill>
      {/* 部屋と机 */}
      <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <div style={{ position: "absolute", left: -10, top: DESK_Y, width: 1100, height: 460, background: "#C98A4E", borderTop: `7px solid ${ink}` }} />
      <div style={{ position: "absolute", left: -10, top: DESK_Y + 7, width: 1100, height: 26, background: "#DDA468" }} />
      {/* 朝の光 */}
      <svg style={{ position: "absolute", inset: 0, opacity: sun * 0.4 }} width={1080} height={1080}>
        <polygon points="0,0 260,0 760,1080 300,1080" fill="#FFF1B8" />
        <polygon points="330,0 430,0 1000,1080 860,1080" fill="#FFF1B8" />
      </svg>
      <div style={{ position: "absolute", inset: 0, background: "#1B2244", opacity: night * 0.55 }} />

      {/* モニター */}
      <div style={{ position: "absolute", left: 500, top: MON.y + MON.h - 4, width: 80, height: DESK_Y - MON.y - MON.h + 14, background: "#2E3038", border: `6px solid ${ink}`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: 410, top: DESK_Y - 4, width: 260, height: 26, borderRadius: 10, background: "#2E3038", border: `6px solid ${ink}`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: MON.x, top: MON.y, width: MON.w, height: MON.h, borderRadius: 26, background: "#2E3038", border: `7px solid ${ink}`, boxSizing: "border-box" }} />
      <div style={{ position: "absolute", left: MON.x + 22, top: MON.y + 22, width: MON.w - 44, height: MON.h - 50, borderRadius: 10, background: "#8FB7D9", border: `5px solid ${ink}`, boxSizing: "border-box" }} />
      {/* 電源の灯り。PC は最後まで点いたまま */}
      <div style={{ position: "absolute", left: MON.x + MON.w - 46, top: MON.y + MON.h - 23, width: 16, height: 16, borderRadius: 8, background: "#6BE07A", border: `3px solid ${ink}` }} />

      {/* 左の窓：continuo */}
      <Window box={WIN_L} title="continuo" dim={dim} over={<LeftOver t={t} stopped={stopped} />}>
        <LeftContent t={t} stopped={stopped} />
      </Window>
      {/* 右の窓：pane の中の Claude Code。一度も暗くしない */}
      <Window box={WIN_R} title="pane：Claude Code">
        <RightContent t={t} />
      </Window>

      {/* 窓の境目を越えて渡す紙 */}
      <PassedCard t={t} />

      {/* 机の上のキーボード */}
      <div style={{ position: "absolute", left: 290, top: 728, width: 400, height: 40, borderRadius: 10, background: "#3A3C44", border: `5px solid ${ink}`, boxSizing: "border-box", filter: `brightness(${1 - night * 0.4})` }} />

      {/* 開発者。左向きの絵を裏返してモニターを向かせる */}
      <div style={{ position: "absolute", inset: 0, filter: `brightness(${1 - night * 0.35})` }}>
        <Developer t={t} />
      </div>

      {/* Ctrl+C のキー */}
      {t >= T.keyIn && t < T.keyOut + 0.2 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${interpolate(t, [T.keyIn, T.keyIn + 0.12], [0.3, 1], clamp)})`,
            transformOrigin: `${KEY.x + KEY.w / 2}px ${KEY.y + KEY.h / 2}px`,
            opacity: interpolate(t, [T.keyOut, T.keyOut + 0.2], [1, 0], clamp),
          }}
        >
          <BigKey label="Ctrl+C" {...KEY} press={interpolate(t, [T.press - 0.05, T.press, T.press + 0.25, T.press + 0.35], [0, 1, 1, 0], clamp)} />
        </div>
      ) : null}
      {/* 翌朝の Enter */}
      {t >= T.enter - 0.15 && t < T.enter + 0.45 ? (
        <BigKey
          label="Enter"
          x={KEY.x + 20}
          y={KEY.y + 10}
          w={210}
          h={110}
          fontSize={52}
          press={interpolate(t, [T.enter - 0.05, T.enter, T.enter + 0.2, T.enter + 0.3], [0, 1, 1, 0], clamp)}
        />
      ) : null}
      <Sequence from={sec(T.press)} durationInFrames={sec(0.5)} layout="none">
        <PressMarks x={KEY.x} y={KEY.y - 60} />
      </Sequence>
      <Sequence from={sec(T.enter)} durationInFrames={sec(0.5)} layout="none">
        <PressMarks x={KEY.x - 10} y={KEY.y - 50} />
      </Sequence>

      {/* 名前の札は最前面。Claude Code が初めて出たときから 1.5秒 */}
      <Sequence from={sec(2.1)} durationInFrames={sec(1.5)} layout="none">
        <NameTag cx={WIN_R.x + 6 + CC.cx} tipY={WIN_R.y + BAR + CC.baseBehind - CC.h - 2} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(1.5)} fontSize={36} />
      </Sequence>
      <Sequence from={sec(T.morning)} durationInFrames={sec(1.1)} layout="none">
        <MorningTag />
      </Sequence>
    </AbsoluteFill>
  );
};

// 左の窓の中身：コンティ。止めると動きを止める（目は開けたまま）
const LeftContent: React.FC<{ t: number; stopped: boolean }> = ({ t, stopped }) => {
  const f = sec(t);
  const bob = stopped ? 0 : Math.sin(f / 7) * 6;
  let whale: React.ReactNode;
  if (t >= T.leap && t < T.toEdge) {
    const up = interpolate(t, [T.leap, T.leap + 0.25, T.toEdge], [0, 1, 0.8], { ...clamp, easing: Easing.out(Easing.quad) });
    whale = <Sprite src="characters/continuo/leap.png" cx={WHALE.cx} baseY={lerp(up, 480, 450)} height={330} />;
  } else {
    const edge = interpolate(t, [T.toEdge, T.toEdge + 0.3], [0, 1], { ...clamp, easing: ease });
    const wave = t >= T.fist ? Math.sin(f / 3) * 7 : 0;
    whale = <Sprite src="characters/continuo/wave.png" cx={lerp(edge, WHALE.cx, 322)} baseY={WHALE.baseY + bob} height={WHALE.h} flip squash={false} rotate={wave} />;
  }
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "#D7E9F2" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 370, bottom: 0, background: "#BCD6E4", borderTop: `5px solid ${ink}` }} />
      {whale}
    </>
  );
};

// 左の窓の幕の上に出すもの：「休業」の札と、翌朝に打つ `$ continuo`
const LeftOver: React.FC<{ t: number; stopped: boolean }> = ({ t }) => {
  const drop = interpolate(t, [T.sign, T.sign + 0.2], [-260, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const fall = interpolate(t, [T.light, T.light + 0.35], [0, 500], { ...clamp, easing: Easing.in(Easing.quad) });
  const typed = "continuo".slice(0, Math.floor(interpolate(t, [T.type, T.enter - 0.1], [0, 8], clamp)));
  const cursor = Math.floor(sec(t) / 8) % 2 === 0;
  return (
    <>
      {t >= T.sign && t < T.light + 0.4 ? (
        <div style={{ filter: "brightness(0.82)", transform: `translateY(${drop + fall}px) rotate(${fall / 30}deg)` }}>
          <ClosedSign cx={WHALE.cx} y={245} />
        </div>
      ) : null}
      {t >= T.morning && t < T.light ? (
        <div style={{ position: "absolute", left: 24, top: 410, fontFamily: "Menlo, monospace", fontWeight: 700, fontSize: 40, color: "#8CF29A" }}>
          $ {typed}
          {cursor ? "▌" : ""}
        </div>
      ) : null}
    </>
  );
};

// 右の窓の中身：作業台と Claude Code
const RightContent: React.FC<{ t: number }> = ({ t }) => {
  const f = sec(t);
  const working = (t < T.done) || t >= T.work2;
  const shake = working ? Math.sin(f * 1.7) * 4 : 0;
  // 作業台の奥にいる絵と、作業台の前にいる絵を分ける
  const behind = t < T.sit || t >= T.work2;
  const behindSrc = t < T.done ? "work" : t < T.sit ? "fist" : "work";
  const frontSrc = t < T.stand ? "ep/resume/cc_sit_wait.png" : t < T.fist ? "characters/claude_code/receive.png" : "characters/claude_code/fist.png";
  const frontH = t < T.stand ? 260 : 320;
  return (
    <>
      <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", left: -90, top: -200, width: 640 }} />
      {behind ? (
        <Sprite
          key={behindSrc + (t >= T.work2 ? "2" : "")}
          src={`characters/claude_code/${behindSrc}.png`}
          cx={CC.cx + shake}
          baseY={CC.baseBehind + (working ? Math.abs(Math.sin(f * 0.9)) * -5 : 0)}
          height={CC.h}
          rotate={shake / 3}
          squash={false}
        />
      ) : null}
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BENCH.x, top: BENCH.y, width: BENCH.w }} />
      {!behind ? <Sprite key={frontSrc} src={frontSrc} cx={CC.cx - 20} baseY={CONTENT_H + 4} height={frontH} squash={false} /> : null}
      {working ? (
        <>
          <Sweat x={CC.cx + 95} y={CC.baseBehind - CC.h + 60} scale={0.7} />
          <SpeedLines x={CC.cx - 220} y={CC.baseBehind - 200} width={80} height={80} direction={-1} />
          <SpeedLines x={CC.cx + 145} y={CC.baseBehind - 200} width={80} height={80} direction={1} />
        </>
      ) : null}
      <Sequence from={sec(T.done)} durationInFrames={sec(0.8)} layout="none">
        <Sparkle x={CC.cx + 110} y={CC.baseBehind - CC.h - 10} />
        <DoneBadge x={CC.cx - 190} y={BENCH.y - 70} />
      </Sequence>
      <Sequence from={sec(T.fist)} durationInFrames={sec(0.6)} layout="none">
        <Sparkle x={CC.cx + 90} y={150} />
        <Sparkle x={CC.cx - 200} y={190} />
      </Sequence>
    </>
  );
};

// コンティのヒレの先から、窓の境目を越えて Claude Code の手へ渡す紙
const PassedCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.toEdge + 0.25 || t >= T.fist) return null;
  const from = { x: WIN_L.x + 6 + 322 + WAVE_W / 2 - 70, y: WIN_L.y + BAR + WHALE.baseY - WHALE.h * 0.55 };
  const to = { x: WIN_R.x + 6 + CC.cx - 120, y: WIN_R.y + BAR + CONTENT_H - 175 };
  const u = interpolate(t, [T.pass, T.got], [0, 1], { ...clamp, easing: ease });
  const x = lerp(u, from.x, to.x);
  const y = lerp(u, from.y, to.y) - Math.sin(u * Math.PI) * 110;
  return (
    <>
      <IssueCard x={x} y={y} scale={0.85} rotate={Math.sin(u * Math.PI) * -12} />
      {u > 0 && u < 1 ? <SpeedLines x={x - 110} y={y - 10} width={100} height={80} direction={1} /> : null}
    </>
  );
};

const Developer: React.FC<{ t: number }> = ({ t }) => {
  const typing = (t < T.sip) || (t >= T.type - 0.1 && t < T.enter + 0.25);
  if (t >= T.letdown) {
    return (
      <Sprite src="ep/resume/dev_anticlimax.png" cx={DEV.cx + 10} baseY={DEV.baseY + 5} height={500} flip squash={false} />
    );
  }
  if (typing) return <Sprite src="characters/developer/typing.png" cx={DEV.cx} baseY={DEV.baseY} height={460} flip squash={false} />;
  return (
    <>
      <Sprite src="characters/developer/sip_coffee.png" cx={DEV.cx + 10} baseY={DEV.baseY + 5} height={470} flip squash={false} />
      <Steam x={DEV.cx + 40} y={DEV.baseY - 500} />
    </>
  );
};

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  return <Room t={f / theme.fps} />;
};

// 効果音。音は scripts/make_sfx.py と scripts/sfx_resume.py で合成した public/sfx/*.wav。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "enter", at: T.press, volume: 0.7 }, // Ctrl+C を押す
  { name: "resume_off", at: T.press + 0.05, volume: 0.55 }, // 左の窓が暗くなる
  { name: "pop", at: T.sign, volume: 0.4 }, // 休業の札が下がる
  { name: "sparkle", at: T.done, volume: 0.5 }, // 手元の作業を仕上げる
  { name: "typing", at: T.type, volume: 0.35 }, // continuo と打つ
  { name: "enter", at: T.enter, volume: 0.7 }, // Enter
  { name: "resume_on", at: T.light, volume: 0.55 }, // 左の窓が明るくなる
  { name: "spout", at: T.leap, volume: 0.6 }, // 潮を吹く
  { name: "whoosh", at: T.pass, volume: 0.5 }, // 紙が境目を越える
  { name: "sparkle", at: T.fist, volume: 0.4 }, // 続きを始める
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const Resume: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <AbsoluteFill style={{ filter: "blur(10px)" }}>
        <Room t={2.6} />
      </AbsoluteFill>
    </Sequence>
    <Sequence from={sec(S("stop").from)} durationInFrames={sec(S("go").to - S("stop").from)}>
      <Sequence from={-sec(S("stop").from)} layout="none">
        <Scene />
      </Sequence>
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(2)}>
      <TitleCard text={script.title} outFrom={sec(1.7)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <EndCard text={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={680} fontSize={104} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
