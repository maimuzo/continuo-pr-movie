import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Sparkle, SpeedLines } from "../components/Effects";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { sec, theme } from "../theme";
import { EndCard } from "./setup/EndCard";
import { BrowserWindow, Bubble, ContiIcon, MappingPanel, NetworkLine, NotNeededTag, WorkflowPaper } from "./setup/Props";
import { Check, Line, mono, OsTag, Rect, SplitLine, TERM, TerminalWindow, TypedLine } from "./setup/Terminal";
import { script } from "./setup.script";

// セットアップの回（この回だけ30秒）。主役は大きな端末の窓1つで、場面が変わるたびに窓の中を、その場面のコマンドに入れ替える。
// 入れ替えは次の行を打ち始めるコマで行い、端末が `$` だけになる間を作らない。
// 1行を打ち終えてから次の行を打ち始めるまで、1秒以上あける（storyboard.md の「この回だけ尺を30秒にする」の段）。
// 時刻はすべて動画の頭からの秒で書く（1つの窓が形を変えながら続くため、場面ごとの Sequence に分けない）。
// 座標は 1080×1080 の画面の座標。窓の中の部品は、窓の枠の内側の左上を原点にして置く

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const C = script.cmd;
// install.sh の URL を、最後の「/」のあとで次の段に送る位置（字は変えず、見せる段だけを分ける）
const wrapBeforeFile = (text: string) => text.lastIndexOf("/") + 1;

// ---- 窓の形 ----
// 通常の幅・画面の幅いっぱい（長い行と左右に割る場面）・起動の場面で左へ縮めた形
const NORMAL: Rect = { x: 30, y: 70, w: 1020, h: 730 };
const WIDE: Rect = { x: 8, y: 70, w: 1064, h: 730 };
const SMALL: Rect = { x: 20, y: 150, w: 570, h: 650 };
const BORDER = 8;
const BODY_TOP = TERM.barH + 4; // 窓の枠の内側で、上の帯より下が始まる高さ
const WIN_KEYS: [number, Rect][] = [
  [2.0, NORMAL],
  [2.25, WIDE],
  [11.0, WIDE],
  [11.2, NORMAL],
  [18.0, NORMAL],
  [18.25, WIDE],
  [19.8, WIDE],
  [20.1, NORMAL],
  [23.6, NORMAL],
  [23.9, SMALL],
];
const winAt = (t: number): Rect => {
  if (t <= WIN_KEYS[0][0]) return WIN_KEYS[0][1];
  for (let i = 0; i < WIN_KEYS.length - 1; i++) {
    const [a, ra] = WIN_KEYS[i];
    const [b, rb] = WIN_KEYS[i + 1];
    if (t <= b) {
      const u = ease(Math.min(1, Math.max(0, (t - a) / (b - a))));
      return { x: lerp(u, ra.x, rb.x), y: lerp(u, ra.y, rb.y), w: lerp(u, ra.w, rb.w), h: lerp(u, ra.h, rb.h) };
    }
  }
  return WIN_KEYS[WIN_KEYS.length - 1][1];
};
// 窓を左右に割る度合い（0〜1）と、割る位置（窓の幅に対する左の割合）。
// macOS だけの行の場面は、右には「不要」の札しか無いので、左を広くして字を大きくする
const splitAt = (t: number) =>
  Math.max(interpolate(t, [2.0, 2.25, 8.0, 8.25], [0, 1, 1, 0], clamp), interpolate(t, [18.0, 18.25, 19.8, 20.1], [0, 1, 1, 0], clamp));
const splitRatioAt = (t: number) => (t < 15 ? 0.5 : 0.62);

// ---- 打たれる行 ----
// 依存物（2〜8秒）：左右の窓で同じ時刻に打つ。curl の行は install.sh の手前で次の段に送り、字を大きくする
const DEPS_FONT = 26;
const DEPS_ROW = 40;
const DEPS_GAP = 22;
const DEPS_TIMES = [
  [2.0, 2.5, 2.55], // 窓が割れ始めるコマから打つ。場面の頭に端末を空にしない
  [3.8, 4.3, 4.35],
  [5.35, 5.85, 5.9],
  [6.9, 7.2, 7.25],
] as const;
const depsLines = (first: string): Line[] =>
  [first, C.herdr, C.claude, C.ghAuth].map((text, i) => ({
    text,
    t0: DEPS_TIMES[i][0],
    t1: DEPS_TIMES[i][1],
    check: DEPS_TIMES[i][2],
    wrapAt: text.startsWith("curl") ? wrapBeforeFile(text) : undefined,
  }));
const DEPS_MAC = depsLines(C.brew);
const DEPS_UBUNTU = depsLines(C.apt);
// continuo を入れる（8〜11秒）：84字の行を、ドメインのあとで2段に分ける
const INSTALL_FONT = 36;
const INSTALL_ROW = 54;
const INSTALL: Line = {
  text: C.continuo,
  t0: 8.25,
  t1: 9.0,
  check: 9.75,
  wrapAt: C.continuo.indexOf("githubusercontent.com/") + "githubusercontent.com/".length,
};
const T_LINE = 9.05; // ネットワークの線が伸びる
const T_ICON_FROM = 9.1;
const T_ICON_LAND = 9.6;
// 設定する（11〜18秒）
const CONFIG_FONT = 44;
const CONFIG: Line[] = [
  { text: C.init, t0: 11.0, t1: 11.4, check: 11.45 },
  { text: C.setup, t0: 14.4, t1: 14.8, check: 14.85 },
  { text: C.trust, t0: 16.5, t1: 16.85, check: 16.9 },
];
const T_PAPER = 11.6; // 紙が飛び出す
const T_BUBBLE = 12.8; // 下の段から吹き出しがコンティへ
const T_BUBBLE_HIT = 13.4;
const T_PAPER_AWAY = 14.0; // 紙が縮んで窓の右下へ
const T_MAP = 15.0; // 列と役の対応の絵
const T_MAP_OUT = 16.2;
// 確かめる（18〜23秒）
const KEYCHAIN_FONT = 30;
const KEYCHAIN: Line = { text: C.keychain, t0: 18.0, t1: 18.5, check: 18.55 };
const T_NOT_NEEDED = 18.7;
const DOCTOR_FONT = 38;
const DOCTOR: Line = { text: C.doctor, t0: 20.1, t1: 20.45 };
// README の「eighteen checks」から9つ
const DOCTOR_CHECKS = ["config", "Claude Code", "herdr", "gh auth", "kanban board", "Status names", "clones", "trust", "credentials"];
const T_DOCTOR_CHECKS = 20.6;
const DOCTOR_STEP = 0.2;
// 起動（23〜27秒）
const RUN_FONT = 34;
const RUN: Line = { text: C.run, t0: 23.0, t1: 23.4, check: 23.45 };
const T_SPOUT = 23.9;
const T_BROWSER = 24.1;
const BROWSER = { x: 610, y: 150, w: 450, h: 650 };

// 窓の右上の角に乗って見守るコンティの位置
const contiSpot = (r: Rect) => ({ cx: r.x + r.w - 95, baseY: r.y + 42 });

const pop = (t: number, at: number, dur = 0.25) => interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

// ---- 窓の中身（窓の枠の内側の左上が原点）----
const SplitTags: React.FC<{ iw: number; ratio: number; split: number }> = ({ iw, ratio, split }) => (
  <>
    <OsTag cx={(iw * ratio) / 2} y={BODY_TOP + 20} text="macOS" pop={split} />
    <OsTag cx={iw * ratio + (iw * (1 - ratio)) / 2} y={BODY_TOP + 20} text="Ubuntu" pop={split} />
  </>
);

const DepsBody: React.FC<{ t: number; iw: number; split: number }> = ({ t, iw, split }) => {
  const half = iw / 2;
  // 段の数（1段か2段）を足して、コマンドごとの高さを決める
  const tops: number[] = [];
  let y = BODY_TOP + 135;
  DEPS_MAC.forEach((l) => {
    tops.push(y);
    y += (l.wrapAt ? 2 : 1) * DEPS_ROW + DEPS_GAP;
  });
  return (
    <>
      <SplitTags iw={iw} ratio={0.5} split={split} />
      {DEPS_MAC.map((l, i) => (
        <TypedLine key={`m${i}`} line={l} t={t} x={16} y={tops[i]} fontSize={DEPS_FONT} rowH={DEPS_ROW} />
      ))}
      {DEPS_UBUNTU.map((l, i) => (
        <TypedLine key={`u${i}`} line={l} t={t} x={half + 16} y={tops[i]} fontSize={DEPS_FONT} rowH={DEPS_ROW} />
      ))}
    </>
  );
};

const InstallBody: React.FC<{ t: number }> = ({ t }) => <TypedLine line={INSTALL} t={t} x={14} y={BODY_TOP + 40} fontSize={INSTALL_FONT} rowH={INSTALL_ROW} />;

const ConfigBody: React.FC<{ t: number }> = ({ t }) => (
  <>
    {CONFIG.map((l, i) => (
      <TypedLine key={i} line={l} t={t} x={24} y={BODY_TOP + 30 + i * 76} fontSize={CONFIG_FONT} />
    ))}
  </>
);

const KeychainBody: React.FC<{ t: number; iw: number; split: number }> = ({ t, iw, split }) => {
  const ratio = splitRatioAt(t);
  return (
    <>
      <SplitTags iw={iw} ratio={ratio} split={split} />
      <TypedLine line={KEYCHAIN} t={t} x={16} y={BODY_TOP + 170} fontSize={KEYCHAIN_FONT} />
      <NotNeededTag cx={iw * ratio + (iw * (1 - ratio)) / 2} cy={BODY_TOP + 320} pop={pop(t, T_NOT_NEEDED)} />
    </>
  );
};

const DoctorBody: React.FC<{ t: number }> = ({ t }) => (
  <>
    <TypedLine line={DOCTOR} t={t} x={24} y={BODY_TOP + 24} fontSize={DOCTOR_FONT} />
    {DOCTOR_CHECKS.map((name, i) => {
      const at = T_DOCTOR_CHECKS + i * DOCTOR_STEP;
      if (t < at) return null;
      const y = BODY_TOP + 92 + i * 52;
      const p = pop(t, at, 0.12);
      return (
        <React.Fragment key={name}>
          <Check x={30} y={y + 4} size={DOCTOR_FONT * 1.05} pop={p} />
          <div style={{ position: "absolute", left: 30 + DOCTOR_FONT * 1.6, top: y, fontFamily: mono, fontWeight: 500, fontSize: DOCTOR_FONT, lineHeight: `${DOCTOR_FONT * 1.3}px`, color: TERM.text, opacity: p }}>
            {name}
          </div>
        </React.Fragment>
      );
    })}
  </>
);

const RunBody: React.FC<{ t: number }> = ({ t }) => <TypedLine line={RUN} t={t} x={24} y={BODY_TOP + 30} fontSize={RUN_FONT} />;

// ---- 本編（2〜27秒）と、タイトルの後ろ（0〜2秒、ぼかす）----
const Stage: React.FC<{ t: number; f: number }> = ({ t, f }) => {
  const win = winAt(t);
  const iw = win.w - BORDER * 2;
  const split = splitAt(t);
  const ratio = splitRatioAt(t);
  const spot = contiSpot(win);
  const bob = Math.sin(f / 7) * 4;

  // continuo のアイコンが線を伝って降りる。着地点は窓の真ん中で、2段のコマンドの下
  const landing = { cx: win.x + BORDER + iw / 2, cy: win.y + BORDER + BODY_TOP + 360 };
  // 線は伸びて、アイコンが収まったら引っ込む。行の字に線が重なったまま残らないように
  const lineGrow = interpolate(t, [T_LINE, T_LINE + 0.25, T_ICON_LAND, T_ICON_LAND + 0.12], [0, 1, 1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fall = interpolate(t, [T_ICON_FROM, T_ICON_LAND], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const iconCy = lerp(fall, -40, landing.cy);
  const iconSquash = interpolate(t, [T_ICON_LAND, T_ICON_LAND + 0.05, T_ICON_LAND + 0.15], [1, 0.75, 1], clamp);

  // WORKFLOW.md の紙：端末の1行目から飛び出して真ん中へ、あとで窓の右下へ縮む
  const paperOut = interpolate(t, [T_PAPER, T_PAPER + 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) });
  const paperAway = interpolate(t, [T_PAPER_AWAY, T_PAPER_AWAY + 0.25], [0, 1], { ...clamp, easing: ease });
  const paperFrom = { cx: 330, cy: 190 };
  const paperMid = { cx: 540, cy: 520 };
  const paperEnd = { cx: 935, cy: 700 };
  const paper = {
    cx: lerp(paperAway, lerp(Math.min(1, paperOut), paperFrom.cx, paperMid.cx), paperEnd.cx),
    cy: lerp(paperAway, lerp(Math.min(1, paperOut), paperFrom.cy, paperMid.cy), paperEnd.cy),
    scale: lerp(paperAway, lerp(paperOut, 0.12, 1), 0.3),
  };
  // 下の段から吹き出しが1つ、コンティへ。横へ先に出てから上がり、紙の字に重ならない
  const bub = interpolate(t, [T_BUBBLE, T_BUBBLE_HIT], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const bubFrom = { x: 800, y: 655 }; // 紙の下の段の右の端
  const bubTo = { x: spot.cx - 40, y: spot.baseY - 40 };
  const bubPos = { x: lerp(Easing.out(Easing.cubic)(bub), bubFrom.x, bubTo.x), y: lerp(Easing.in(Easing.cubic)(bub), bubFrom.y, bubTo.y) };
  const lowerGlow = interpolate(t, [T_BUBBLE - 0.4, T_BUBBLE, T_BUBBLE + 0.5], [0, 1, 0], clamp);

  // 列と役の対応の絵
  const mapPop = interpolate(t, [T_MAP, T_MAP + 0.15], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const mapDraw = interpolate(t, [T_MAP + 0.1, T_MAP + 0.7], [0, 1], clamp);
  const mapOut = interpolate(t, [T_MAP_OUT, T_MAP_OUT + 0.15], [1, 0], clamp);

  const browserPop = interpolate(t, [T_BROWSER, T_BROWSER + 0.25], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const spouting = t >= T_SPOUT;
  const leapHop = interpolate(t, [T_SPOUT, T_SPOUT + 0.15, T_SPOUT + 0.35], [0, -40, 0], { ...clamp, easing: Easing.out(Easing.quad) });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#F3E3C8" }} />
      {/* 床の帯。開発者の椅子が浮かないように */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 860, bottom: 0, background: "#E2CDAA" }} />

      <TerminalWindow rect={win}>
        {/* 中身は、次の場面の1文字目が出るコマで入れ替える */}
        {t >= 2 && t < INSTALL.t0 ? <DepsBody t={t} iw={iw} split={split} /> : null}
        {t >= INSTALL.t0 && t < CONFIG[0].t0 ? <InstallBody t={t} /> : null}
        {t >= CONFIG[0].t0 && t < KEYCHAIN.t0 ? <ConfigBody t={t} /> : null}
        {t >= KEYCHAIN.t0 && t < DOCTOR.t0 ? <KeychainBody t={t} iw={iw} split={split} /> : null}
        {t >= DOCTOR.t0 && t < RUN.t0 ? <DoctorBody t={t} /> : null}
        {t >= RUN.t0 ? <RunBody t={t} /> : null}
      </TerminalWindow>
      <SplitLine x={win.x + BORDER + iw * ratio} top={win.y + BORDER + BODY_TOP} height={win.h - BORDER * 2 - BODY_TOP} amount={split} />

      {/* continuo を入れる：ネットワークの線と、降りてくるアイコン */}
      {t >= T_LINE && t < CONFIG[0].t0 ? (
        <>
          <NetworkLine x={landing.cx} y1={45} y2={landing.cy - 90} amount={lineGrow} frame={f} />
          {t >= T_ICON_FROM ? <ContiIcon cx={landing.cx} cy={iconCy} size={170} squash={iconSquash} /> : null}
        </>
      ) : null}
      <Sequence from={sec(T_ICON_LAND)} durationInFrames={sec(0.4)}>
        <Sparkle x={landing.cx + 70} y={landing.cy - 130} />
      </Sequence>

      {/* 設定する：WORKFLOW.md の紙と吹き出し、列と役の対応 */}
      {t >= T_PAPER && t < KEYCHAIN.t0 ? <WorkflowPaper cx={paper.cx} cy={paper.cy} scale={paper.scale} rotate={lerp(paperAway, -3, 4)} lowerGlow={lowerGlow} /> : null}
      {t >= T_BUBBLE && t < T_BUBBLE_HIT ? (
        <div style={{ position: "absolute", left: bubPos.x - 55, top: bubPos.y - 45, transform: `scale(${lerp(bub, 1.1, 0.7)})` }}>
          <Bubble size={110} />
        </div>
      ) : null}
      <Sequence from={sec(T_BUBBLE_HIT)} durationInFrames={sec(0.5)}>
        <Sparkle x={spot.cx - 120} y={spot.baseY - 110} />
      </Sequence>
      {t >= T_MAP && t < T_MAP_OUT + 0.15 ? (
        <div style={{ opacity: mapOut }}>
          <MappingPanel cx={540} cy={560} pop={mapPop} draw={mapDraw} />
        </div>
      ) : null}

      {/* 起動：ブラウザの小窓 */}
      {t >= T_BROWSER ? <BrowserWindow x={BROWSER.x} y={BROWSER.y} w={BROWSER.w} h={BROWSER.h} pop={browserPop} t={t - T_BROWSER} /> : null}

      {/* コンティ：窓の右上の角で見守り、起動で潮を吹いて跳ねる */}
      {!spouting ? (
        <Sprite src="characters/continuo/wave.png" cx={spot.cx} baseY={spot.baseY + bob} height={100} squash={false} />
      ) : (
        <Sprite src="characters/continuo/leap.png" cx={spot.cx - 20} baseY={win.y + 60 + leapHop + bob} height={200} />
      )}
      <Sequence from={sec(T_SPOUT)} durationInFrames={sec(0.6)}>
        <SpeedLines x={spot.cx + 60} y={win.y - 120} width={90} height={120} direction={1} />
      </Sequence>

      {/* 開発者：左下で端末の前に座って打つ */}
      <Sprite src="characters/developer/typing.png" cx={122} baseY={1080} height={300} flip squash={false} />
    </AbsoluteFill>
  );
};

// 効果音。at は動画の頭からの秒で、動きの瞬間に合わせる。len は鳴らす長さ（打つ音は打っているあいだだけ）
const TYPED: Line[] = [...DEPS_MAC, INSTALL, ...CONFIG, KEYCHAIN, DOCTOR, RUN];
const SFX: { name: string; at: number; volume: number; len?: number }[] = [
  ...TYPED.map((l) => ({ name: "typing", at: l.t0, volume: 0.3, len: l.t1 - l.t0 })),
  ...TYPED.filter((l) => l.check !== undefined).map((l) => ({ name: "enter", at: l.check!, volume: 0.45 })),
  { name: "swish", at: 2.0, volume: 0.5 }, // 窓が左右に割れる
  { name: "swish", at: 8.0, volume: 0.4 }, // 1つに戻る
  { name: "whoosh", at: T_ICON_FROM, volume: 0.5 }, // アイコンが線を伝って降りる
  { name: "splat", at: T_ICON_LAND, volume: 0.6 }, // 端末に収まる
  { name: "pop", at: T_PAPER, volume: 0.6 }, // WORKFLOW.md が飛び出す
  { name: "whoosh", at: T_BUBBLE, volume: 0.35 }, // 吹き出しがコンティへ
  { name: "sparkle", at: T_BUBBLE_HIT, volume: 0.4 }, // コンティに届く
  { name: "swish", at: T_MAP, volume: 0.45 }, // 列と役の対応
  { name: "swish", at: 18.0, volume: 0.5 }, // 窓が左右に割れる
  { name: "pop", at: T_NOT_NEEDED, volume: 0.55 }, // 「不要」の札
  ...DOCTOR_CHECKS.map((_, i) => ({ name: "pop", at: T_DOCTOR_CHECKS + i * DOCTOR_STEP, volume: 0.3, len: 0.2 })), // ✓ が1つずつ並ぶ
  { name: "sparkle", at: T_DOCTOR_CHECKS + DOCTOR_CHECKS.length * DOCTOR_STEP, volume: 0.5 }, // 全部そろう
  { name: "spout", at: T_SPOUT, volume: 0.6 }, // コンティが潮を吹く
  { name: "pop", at: T_BROWSER, volume: 0.45 }, // ブラウザの小窓が開く
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const Setup: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  return (
    <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
      {t < S("end").from ? (
        <AbsoluteFill style={{ filter: t < 2 ? "blur(10px)" : undefined }}>
          <Stage t={t} f={f} />
        </AbsoluteFill>
      ) : null}

      {script.scenes.map((s) =>
        s.caption ? (
          <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
            <Caption text={s.caption} size={s.captionSize} />
          </Sequence>
        ) : null,
      )}

      <Sequence durationInFrames={sec(2)}>
        <TitleCard text={script.title} outFrom={sec(1.7)} />
      </Sequence>
      <Sequence from={sec(S("end").from)}>
        <EndCard lines={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={680} />
      </Sequence>

      {SFX.map((e, i) => (
        <Sequence key={i} from={sec(e.at)} durationInFrames={Math.max(1, sec(e.len ?? 1.2))}>
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
