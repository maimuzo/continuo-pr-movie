import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../../components/Caption";
import { Exclamation, Sparkle, SpeedLines, Sweat } from "../../components/Effects";
import { NameTag } from "../../components/NameTag";
import { Sprite } from "../../components/Sprite";
import { TitleCard } from "../../components/TitleCard";
import { sec, theme } from "../_shared/theme";
import { Desk, deskXs, HEAD_TOP, Room, ROBOT_BASE, ROBOT_H, robotCxOf } from "../_shared/TeamRoom";
import { LocalNote, MarginBattery, MiniCalendar, ResetSign, Rewind, Scanlines, Shout, WorkflowSheet } from "./Props";
import { WaitEndCard } from "./WaitEndCard";
import { script } from "./script";

// 自分の分だけ上書きの回（30秒）。チームで入札の回と同じ部屋（机3つと Claude Code 3体）の1カットで通す。
// 共有のカンバンの代わりに、壁の真ん中にチームで共有する WORKFLOW.md の紙（マージン 10%）を貼る。
// 各 Claude Code の頭の上に「1週間」の電池。中に「自分の分」の縦の点線（右端から 10% の幅）を引く。
// 机の前には、左からアカネ・開発者・ゲンさんが上半身で立つ。机の天板の左端に日めくり（あと4日・1日・6日）。人の前には字幕のほかは置かない。
// 前半（3〜11秒）: 開発者が壁の紙の「10%」に線を引いて「0%」と書き換えてしまい、3つの電池の点線がそろって消え、
// アカネとゲンさんの電池までどんどん減って、2人が「えっ！？」と驚く。
// 11〜13.5秒: 画面全体を巻き戻して元の姿へ戻し、「仕切り直し」の札で前半と後半をはっきり区切る。
// 後半（13.5〜27秒）: 開発者は自分の机の天板の右端に WORKFLOW.local.md の付箋（マージン 0%）を貼る。
// 開発者の電池の点線だけが右の端まで寄って消え、開発者の Claude Code が作り始める。壁の紙とほかの机は変わらない。
// 前半の動きは「場面の時刻」v で書き、巻き戻しは v を 11秒から 3秒へ逆に進めて作る（全部の部品がそのまま逆に動く）。
// 時刻はすべて動画の頭からの秒で書く。座標は 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const linear = (x: number) => x;
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const ramp = (t: number, a: number, b: number, e: (x: number) => number = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
const bumpAt = (t: number, a: number, len = 0.3) => interpolate(t, [a, a + 0.06, a + len], [0, 1, 0], clamp);
const holdAt = (t: number, a: number, b: number, fade = 0.12) => interpolate(t, [a, a + fade, b - fade, b], [0, 1, 1, 0], clamp);
const between = (t: number, a: number, b: number) => t >= a && t < b;

// ---- 配置 ----
const DESK_X = deskXs(3); // 20・375・730
// 開発者の机の Claude Code だけ 25px 左へ寄せ、天板の右端の付箋で目を隠さない
const robotCx = (i: number) => robotCxOf(DESK_X[i]) - (i === 1 ? 25 : 0);
const AKANE = 0;
const DEV = 1;
const GEN = 2;
const BAT_Y = 420; // 電池の上辺。寝て待つ回と同じ高さ
const MARGIN = 10; // 壁の紙のマージン
const DAYS = [4, 1, 6]; // 机ごとの、リセットまでの残り日数
const SHEET = { left: 300, top: 40, width: 480, height: 270 };
const CAL_STAND = 62; // 日めくりの脚。字を人の頭より上に出す
const CAL = (i: number) => ({ left: DESK_X[i] + (i === 2 ? 12 : 2), top: 800 - 98 - CAL_STAND }); // 天板の左端に立てる（脚の下端 800px）
const NOTE = { left: DESK_X[DEV] + 250, top: 678 }; // 天板の右端に立てる（下端 802px）
const PERSON_H = 380; // 人の絵の高さ（全身）。足もとは画面の下で切れ、上半身が見える
const PERSON_BASE = 1105; // 頭の上が 725px あたり。顔を字幕より上に出し、Claude Code の目は隠さない高さ
const PERSON_CX = [DESK_X[AKANE] + 185, DESK_X[DEV] + 162, DESK_X[GEN] + 190];
// 壁の紙の前に立って書き込むときの開発者の足もとと絵の高さ。ペン先が紙の「10%」の右端に届き、頭で「10%」を隠さない位置
const AT_WALL = { cx: 800, base: 515, h: 340 };

// ---- 時刻 ----
const T = {
  // 前半（場面の時刻 v で書く）
  tags: 3.05,
  tagLen: 1.3,
  calGlow: 3.2,
  idea: 3.6, // 開発者が思いつく
  go: [4.0, 4.4], // 壁の紙の前へ行く
  strike: [4.6, 5.1], // 「10%」に線を引く
  write: [5.3, 5.9], // 「0%」と書き込む
  back: [6.4, 6.8], // 机へ戻る
  gone: [7.2, 7.5], // 3つの電池の点線がそろって消える
  drain: [7.6, 10.6], // みんなの電池がどんどん減る
  notice: 9.4, // アカネとゲンさんが気づいて驚く
  // 巻き戻し
  rewind: [11.15, 12.6], // v を 11秒から 3秒へ戻す
  sign: 12.8, // 「仕切り直し」の札
  // 後半（動画の時刻 t で書く）
  part2: 13.5,
  pin: 14.2,
  write2: [15.0, 15.6],
  gone2: [16.0, 16.35],
  swell: [16.0, 16.8],
  work2: 16.1,
  keep: [17.0, 24.0], // 壁の紙が小さく光って「そのまま」を示す
  relief: 21.6,
  cheer: 22.0,
};
const START = 3.0; // 巻き戻しで戻る先の、場面の時刻
// 場面の時刻。巻き戻しのあいだは逆に進み、巻き戻したあとは START で止まる
const sceneTime = (t: number) => {
  if (t < T.rewind[0]) return t;
  if (t < T.rewind[1]) return lerp(ramp(t, T.rewind[0], T.rewind[1], Easing.inOut(Easing.quad)), T.rewind[0], START);
  return START;
};
const rewinding = (t: number) => between(t, 11.0, T.sign);

// ---- 電池の残り（0〜100）と「自分の分」の点線 ----
const START_LEVEL = [66, 90, 78]; // 開発者の机は、点線のところで止まっている
const level = (i: number, t: number, v: number) => {
  if (t < T.part2) {
    if (i === DEV) {
      if (v < T.gone[0]) return START_LEVEL[DEV];
      if (v < T.drain[0]) return lerp(ramp(v, T.gone[0], T.gone[1]), START_LEVEL[DEV], 100);
      return lerp(ramp(v, T.drain[0], T.drain[1], linear), 100, 55);
    }
    return lerp(ramp(v, T.drain[0], T.drain[1], linear), START_LEVEL[i], i === AKANE ? 12 : 16);
  }
  if (i === DEV) {
    if (t < T.gone2[0]) return START_LEVEL[DEV];
    if (t < T.swell[1]) return lerp(ramp(t, T.gone2[0], T.gone2[1]), START_LEVEL[DEV], 100);
    return lerp(ramp(t, T.swell[1], 27, linear), 100, 70);
  }
  return lerp(ramp(t, T.part2, 27, linear), START_LEVEL[i], START_LEVEL[i] - 8);
};
const margin = (i: number, t: number, v: number) => {
  if (t < T.part2) return lerp(ramp(v, T.gone[0], T.gone[1]), MARGIN, 0);
  return i === DEV ? lerp(ramp(t, T.gone2[0], T.gone2[1]), MARGIN, 0) : MARGIN;
};
const lineOpacity = (i: number, t: number, v: number) => {
  if (t < T.part2) return interpolate(v, [T.gone[1] - 0.1, T.gone[1]], [1, 0], clamp);
  return i === DEV ? interpolate(t, [T.gone2[1] - 0.1, T.gone2[1]], [1, 0], clamp) : 1;
};

// ---- Claude Code の表情。hard は点線が消えて猛烈に作っているとき ----
const ROBOT_SRC = { work: "characters/claude_code/work.png", wait: "ep/team-bid/cc_wait.png" } as const;
const robotState = (i: number, t: number, v: number): { pose: keyof typeof ROBOT_SRC; hard: boolean; from: number } => {
  if (t < T.part2) {
    const free = v >= T.gone[1];
    if (i === DEV) return free ? { pose: "work", hard: true, from: rewinding(t) ? 0 : T.gone[1] } : { pose: "wait", hard: false, from: 0 };
    return { pose: "work", hard: free, from: 0 };
  }
  if (i === DEV && t < T.work2) return { pose: "wait", hard: false, from: 0 };
  return { pose: "work", hard: false, from: i === DEV ? T.work2 : 0 };
};

// ---- 人の絵 ----
const PERSON_SRC: Record<string, string> = {
  akane_idle: "ep/workflow-local/akane_idle.png",
  akane_surprised: "ep/workflow-local/akane_surprised.png",
  akane_relief: "ep/workflow-local/akane_relief.png",
  gen_idle: "ep/workflow-local/gen_idle.png",
  gen_surprised: "ep/workflow-local/gen_surprised.png",
  gen_relief: "ep/workflow-local/gen_relief.png",
  dev_notice: "ep/blocked/dev_notice.png",
  dev_reach_pen: "ep/workflow-local/dev_reach_pen.png",
  dev_pin: "ep/one-kanban/dev_pin.png",
  dev_cheer: "ep/resume/dev_cheer.png",
};
// 頭の大きさをほかの絵にそろえるための倍率（驚くゲンさんは脚が長く描かれたため）
const PERSON_K: Record<string, number> = { gen_surprised: 1.12 };
// 返り値は [絵の名前, その絵に替わった秒]。巻き戻しのあいだは弾ませない（from を 0 にする）
const personPose = (i: number, t: number, v: number): [string, number] => {
  const rw = (from: number) => (t >= T.rewind[0] && t < T.part2 ? 0 : from);
  const who = i === AKANE ? "akane" : "gen";
  if (t < T.part2) {
    if (i === DEV) {
      if (v < T.go[0]) return ["dev_notice", 0];
      if (v < T.back[1]) return ["dev_reach_pen", rw(T.go[0])];
      return ["dev_notice", rw(T.back[1])];
    }
    if (v < T.notice) return [`${who}_idle`, 0];
    return [`${who}_surprised`, rw(T.notice)];
  }
  if (i === DEV) {
    if (t < T.pin) return ["dev_notice", 0];
    if (t < T.cheer) return ["dev_pin", T.pin];
    return ["dev_cheer", T.cheer];
  }
  if (t < T.relief) return [`${who}_idle`, 0];
  return [`${who}_relief`, T.relief];
};
// 開発者の足もと。0 で机の前、1 で壁の紙の前
const devAtWall = (t: number, v: number) => (t < T.part2 ? ramp(v, T.go[0], T.go[1]) - ramp(v, T.back[0], T.back[1]) : 0);

const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  const v = sceneTime(t);
  const p1 = t < T.part2;
  const rw = rewinding(t);

  // 壁の紙
  const hot = p1 ? holdAt(v, T.go[1] - 0.1, T.back[0] + 0.1) : 0;
  const strike = p1 ? ramp(v, T.strike[0], T.strike[1], linear) : 0;
  const rewrite = p1 ? ramp(v, T.write[0], T.write[1], linear) : 0;
  const sheetGlow = p1 ? 0 : (bumpAt(t, T.keep[0], 0.5) + bumpAt(t, T.keep[1], 0.5)) * 0.6;
  // 付箋と、開発者の電池が膨らんで光る度合い
  const noteAppear = t < T.pin ? 0 : interpolate(t, [T.pin, T.pin + 0.1, T.pin + 0.2], [0, 1.15, 1], clamp);
  const written = ramp(t, T.write2[0], T.write2[1], linear);
  const swell = p1 ? 0 : interpolate(t, [T.swell[0], T.swell[0] + 0.2, T.swell[1] - 0.2, T.swell[1]], [0, 1, 1, 0], clamp);
  // 開発者の位置
  const w = devAtWall(t, v);
  const writing = p1 && between(v, T.strike[0], T.write[1]);
  const devCx = lerp(w, PERSON_CX[DEV], AT_WALL.cx) + (writing ? Math.sin(f * 1.6) * 4 : 0);
  const devBase = lerp(w, PERSON_BASE, AT_WALL.base) - Math.sin(w * Math.PI) * 60;
  // 驚き（前半だけ。巻き戻しが始まったら消す）
  const shocked = p1 && t < T.rewind[0] && v >= T.notice;
  const shout = shocked ? spring({ frame: f - sec(T.notice + 0.1), fps: theme.fps, config: { damping: 9, stiffness: 220 } }) : 0;
  // 巻き戻しの揺れ
  const jitter = rw ? Math.sin(f * 2.3) * 6 : 0;

  return (
    <AbsoluteFill style={{ transform: `translateX(${jitter}px)` }}>
      <Room />
      <WorkflowSheet {...SHEET} glow={sheetGlow} hot={hot} strike={strike} rewrite={rewrite} />

      {/* Claude Code 3体（机の奥） */}
      {[0, 1, 2].map((i) => {
        const { pose, hard, from } = robotState(i, t, v);
        const working = pose === "work";
        const shake = working ? Math.sin(f * (hard ? 1.7 : 0.9)) * (hard ? 5 : 2) : 0;
        const h = pose === "wait" ? ROBOT_H - 20 : ROBOT_H;
        return (
          <Sequence key={`${i}-${pose}-${from}`} from={sec(from)} layout="none">
            <Sprite src={ROBOT_SRC[pose]} cx={robotCx(i) + shake} baseY={ROBOT_BASE + (pose === "wait" ? 10 : 0)} height={h} rotate={working ? shake / 3 : 0} squash={from > 0} />
          </Sequence>
        );
      })}
      {[0, 1, 2].map((i) => (
        <Desk key={i} x={DESK_X[i]} />
      ))}

      {/* 猛烈に作る机のスピード線と汗。後半は、点線が消えた開発者の机と、21秒からの3つの机 */}
      {[0, 1, 2].map((i) => {
        const { pose, hard } = robotState(i, t, v);
        const lines = pose === "work" && (hard || (!p1 && (i === DEV || t >= S("keep").from)));
        return (
          <React.Fragment key={i}>
            {lines ? <SpeedLines x={robotCx(i) + 110} y={HEAD_TOP + 90} width={80} height={90} direction={1} /> : null}
            {hard && i !== DEV && !rw ? <Sweat x={robotCx(i) - 120} y={HEAD_TOP + 40} scale={0.7} /> : null}
          </React.Fragment>
        );
      })}

      {/* 電池。どの机も「自分の分」の点線は右端から 10% のところ */}
      {[0, 1, 2].map((i) => (
        <MarginBattery
          key={i}
          id={`b${i}`}
          cx={robotCx(i)}
          top={BAT_Y}
          level={level(i, t, v)}
          margin={margin(i, t, v)}
          lineOpacity={lineOpacity(i, t, v)}
          swell={i === DEV ? swell : 0}
          glow={i === DEV ? swell : 0}
        />
      ))}
      <Sequence from={sec(T.gone2[1])} durationInFrames={sec(0.5)}>
        <Sparkle x={robotCx(DEV) + 60} y={BAT_Y - 90} />
        <Sparkle x={robotCx(DEV) - 160} y={BAT_Y - 30} />
      </Sequence>

      {/* 机の天板の左端の日めくり（人より奥） */}
      {[0, 1, 2].map((i) => (
        <MiniCalendar key={i} {...CAL(i)} stand={CAL_STAND} days={DAYS[i]} glow={i === DEV && p1 ? holdAt(v, T.calGlow, T.go[0], 0.15) : 0} />
      ))}

      {/* 開発者の机の天板の右端の付箋（人より奥） */}
      <LocalNote {...NOTE} appear={noteAppear} written={written} glow={bumpAt(t, T.gone2[0], 0.8)} />
      <Sequence from={sec(T.pin)} durationInFrames={sec(0.5)}>
        <Sparkle x={NOTE.left + 50} y={NOTE.top - 80} />
      </Sequence>

      {/* 机の前に立つ3人。開発者は前半、壁の紙の前まで行って書き込む */}
      {[0, 1, 2].map((i) => {
        const [pose, from] = personPose(i, t, v);
        const k = (PERSON_K[pose] ?? 1) * (i === DEV ? lerp(devAtWall(t, v), 1, AT_WALL.h / PERSON_H) : 1);
        const cx = i === DEV ? devCx : PERSON_CX[i];
        const base = i === DEV ? devBase : PERSON_BASE;
        return (
          <Sequence key={`${i}-${pose}-${from}`} from={sec(from)} layout="none">
            <Sprite src={PERSON_SRC[pose]} cx={cx} baseY={base + k * PERSON_H - PERSON_H} height={k * PERSON_H} squash={from > 0} />
          </Sequence>
        );
      })}
      <Sequence from={sec(T.idea)} durationInFrames={sec(0.5)}>
        <Sparkle x={PERSON_CX[DEV] + 60} y={650} />
      </Sequence>

      {/* アカネとゲンさんが気づいて「えっ！？」 */}
      {shocked ? (
        <>
          <Sequence from={sec(T.notice)} layout="none">
            <Exclamation x={PERSON_CX[AKANE] - 160} y={640} />
            <Exclamation x={PERSON_CX[GEN] + 80} y={640} />
          </Sequence>
          <Shout x={PERSON_CX[AKANE] + 20} y={600} text="えっ！？" scale={shout} tail={-1} />
          <Shout x={PERSON_CX[GEN] - 250} y={600} text="えっ！？" scale={shout} tail={1} />
        </>
      ) : null}

      {/* ほっとする・喜ぶ */}
      <Sequence from={sec(T.cheer)} durationInFrames={sec(0.6)}>
        <Sparkle x={PERSON_CX[DEV] - 170} y={640} />
        <Sparkle x={PERSON_CX[DEV] + 90} y={620} />
      </Sequence>

      {/* 名前の札は最前面に。3体の頭の上へ */}
      <Sequence from={sec(T.tags)} durationInFrames={sec(T.tagLen)}>
        {[0, 1, 2].map((i) => (
          <NameTag key={i} cx={robotCx(i)} tipY={HEAD_TOP} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(T.tagLen)} fontSize={34} />
        ))}
      </Sequence>

      {/* 巻き戻しの走査線と印 */}
      {rw ? (
        <>
          <Scanlines frame={f} opacity={interpolate(t, [11.0, 11.15, T.sign - 0.15, T.sign], [0, 1, 1, 0.4], clamp)} />
          <Rewind frame={f} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// 「仕切り直し」の札。12.8秒に弾んで出て、後半が始まる前に消える
const Reset: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  const pop = spring({ frame: f - sec(T.sign), fps: theme.fps, config: { damping: 10, stiffness: 240 } });
  const out = interpolate(t, [T.part2 - 0.15, T.part2], [1, 0], clamp);
  const dim = interpolate(t, [T.sign, T.sign + 0.1, T.part2 - 0.15, T.part2], [0, 0.35, 0.35, 0], clamp);
  return t < T.sign || t >= T.part2 ? null : (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(42,36,32,${dim})` }} />
      <ResetSign appear={pop * out} />
    </>
  );
};

// 効果音。音は short_movie/materials/sfx/ の既存の wav（make_sfx.py と sfx_<回のid>.py で合成したもの）。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number; len?: number }[] = [
  { name: "pop", at: T.tags, volume: 0.35 }, // 名前の札
  { name: "sparkle", at: T.calGlow, volume: 0.45 }, // 日めくりが光る
  { name: "whoosh", at: T.go[0], volume: 0.4 }, // 壁の紙の前へ行く
  { name: "swish", at: T.strike[0], volume: 0.5 }, // 「10%」に線を引く
  { name: "typing", at: T.write[0], volume: 0.4 }, // 「0%」と書き込む
  { name: "whoosh", at: T.back[0], volume: 0.35 }, // 机へ戻る
  { name: "wait-quota_fall", at: T.gone[0], volume: 0.55 }, // 3つの点線がそろって消える
  { name: "typing", at: T.drain[0], volume: 0.4 }, // みんな猛烈に作る
  { name: "blocked_huh", at: T.notice, volume: 0.6 }, // 気づいて驚く
  { name: "wait-quota_empty", at: 10.4, volume: 0.5 }, // 電池が残り少ない
  { name: "wait-quota_tick", at: T.rewind[0] - 0.1, volume: 0.5, len: 1.6 }, // 巻き戻し
  { name: "visible-workshop_clap", at: T.sign, volume: 0.7 }, // 「仕切り直し」の札
  { name: "splat", at: T.pin, volume: 0.45 }, // 付箋を貼る
  { name: "typing", at: T.write2[0], volume: 0.35 }, // 付箋に字を書く
  { name: "wait-quota_charge", at: T.gone2[0], volume: 0.55 }, // 開発者の点線だけが消える
  { name: "typing", at: T.work2 + 0.3, volume: 0.35 }, // 作り始める
  { name: "sparkle", at: T.keep[0], volume: 0.35 }, // 壁の紙はそのまま
  { name: "stranger-comment_relief", at: T.relief, volume: 0.5 }, // ほっとする
  { name: "sparkle", at: T.cheer, volume: 0.5 }, // 喜ぶ
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const WorkflowLocal: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(S("end").from)}>
      <Main />
      <Reset />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} size={s.captionSize} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(S("title").to)}>
      <TitleCard text={script.title} outFrom={sec(S("title").to - 0.3)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <WaitEndCard lines={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} fontSize={110} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(e.len ?? 1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// short-movie の render.sh は default の部品と meta を読む
export default WorkflowLocal;
export { meta } from "./script";
