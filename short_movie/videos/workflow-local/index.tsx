import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../../components/Caption";
import { Exclamation, Sparkle, SpeedLines } from "../../components/Effects";
import { NameTag } from "../../components/NameTag";
import { Sprite } from "../../components/Sprite";
import { TitleCard } from "../../components/TitleCard";
import { sec, theme } from "../_shared/theme";
import { Desk, deskXs, HEAD_TOP, Room, ROBOT_BASE, ROBOT_H, robotCxOf } from "../_shared/TeamRoom";
import { LocalNote, MarginBattery, MiniCalendar, WorkflowSheet } from "./Props";
import { WaitEndCard } from "./WaitEndCard";
import { script } from "./script";

// 自分の分だけ上書きの回。チームで入札の回と同じ部屋（机3つと Claude Code 3体）の1カットで通す。
// 共有のカンバンの代わりに、壁の真ん中にチームで共有する WORKFLOW.md の紙（マージン 10%）を貼る。
// 各 Claude Code の頭の上に「1週間」の電池。中に「自分の分」の縦の点線（右端から 10% の幅）を引く。
// 机の前には、左からアカネ・開発者・ゲンさんが上半身で立つ。机の天板の左端に日めくり（あと4日・1日・6日）。人の前には字幕のほかは置かない。
// 開発者は壁の紙を書き換えようとして止められ、自分の机の天板の右端に WORKFLOW.local.md の付箋（マージン 0%）を貼る。
// すると開発者の電池の点線だけが右の端まで寄って消え、開発者の Claude Code が作り始める。壁の紙とほかの机は変わらない。
// 時刻はすべて動画の頭からの秒で書く。座標は 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const ramp = (t: number, a: number, b: number, e: (x: number) => number = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
const bumpAt = (t: number, a: number, len = 0.3) => interpolate(t, [a, a + 0.06, a + len], [0, 1, 0], clamp);
const holdAt = (t: number, a: number, b: number, fade = 0.12) => interpolate(t, [a, a + fade, b - fade, b], [0, 1, 1, 0], clamp);

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

// ---- 時刻 ----
const T = {
  tags: 2.05,
  tagLen: 1.3,
  calGlow: 2.2,
  reach: 2.6,
  turn: 3.3,
  back: 4.2,
  calm: 4.7, // アカネとゲンさんが前へ向き直る
  pin: 5.4,
  write: [6.2, 6.7],
  gone: [6.8, 7.15], // 点線が右の端まで寄って消える
  swell: [6.8, 7.6],
  work: 6.9,
  keep: 7.5, // 壁の紙が一度だけ小さく光る
  relief: 10.3,
  cheer: 10.6,
};

// ---- 電池の残り（0〜100）。残りは点線の左で止まる ----
const level = (i: number, t: number) => {
  if (i === DEV) {
    if (t < T.gone[0]) return 100 - MARGIN;
    if (t < T.gone[1]) return lerp(ramp(t, T.gone[0], T.gone[1]), 100 - MARGIN, 100);
    return lerp(ramp(t, 7.6, 13, (x) => x), 100, 74);
  }
  const start = i === AKANE ? 66 : 78;
  return lerp(ramp(t, 2, 13, (x) => x), start, start - 8);
};
// 自分の分（％）と点線の濃さ
const margin = (i: number, t: number) => (i === DEV ? lerp(ramp(t, T.gone[0], T.gone[1]), MARGIN, 0) : MARGIN);
const lineOpacity = (i: number, t: number) => (i === DEV ? interpolate(t, [T.gone[1] - 0.1, T.gone[1]], [1, 0], clamp) : 1);

// ---- Claude Code の表情 ----
const ROBOT_SRC = { work: "characters/claude_code/work.png", wait: "ep/team-bid/cc_wait.png" } as const;
const robotPose = (i: number, t: number): keyof typeof ROBOT_SRC => (i === DEV && t < T.work ? "wait" : "work");

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
// 返り値は [絵の名前, その絵に替わった秒]
const personPose = (i: number, t: number): [string, number] => {
  if (i === DEV) {
    if (t < T.reach) return ["dev_notice", 0];
    if (t < T.back) return ["dev_reach_pen", T.reach];
    if (t < T.pin) return ["dev_notice", T.back];
    if (t < T.cheer) return ["dev_pin", T.pin];
    return ["dev_cheer", T.cheer];
  }
  const who = i === AKANE ? "akane" : "gen";
  if (t < T.turn) return [`${who}_idle`, 0];
  if (t < T.calm) return [`${who}_surprised`, T.turn];
  if (t < T.relief) return [`${who}_idle`, T.calm];
  return [`${who}_relief`, T.relief];
};

const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  const hot = holdAt(t, T.reach, T.back + 0.1);
  const sheetGlow = bumpAt(t, T.keep, 0.5) * 0.6;
  const noteAppear = t < T.pin ? 0 : interpolate(t, [T.pin, T.pin + 0.1, T.pin + 0.2], [0, 1.15, 1], clamp);
  const written = ramp(t, T.write[0], T.write[1], (x) => x);
  const swell = interpolate(t, [T.swell[0], T.swell[0] + 0.2, T.swell[1] - 0.2, T.swell[1]], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Room />
      <WorkflowSheet {...SHEET} glow={sheetGlow} hot={hot} />

      {/* Claude Code 3体（机の奥） */}
      {[0, 1, 2].map((i) => {
        const pose = robotPose(i, t);
        const working = pose === "work";
        const hard = i === DEV && t >= T.work && t < 10;
        const shake = working ? Math.sin(f * (hard ? 1.7 : 0.9)) * (hard ? 5 : 2) : 0;
        const h = pose === "wait" ? ROBOT_H - 20 : ROBOT_H;
        return (
          <Sequence key={`${i}-${pose}`} from={i === DEV && working ? sec(T.work) : 0} layout="none">
            <Sprite src={ROBOT_SRC[pose]} cx={robotCx(i) + shake} baseY={ROBOT_BASE + (pose === "wait" ? 10 : 0)} height={h} rotate={working ? shake / 3 : 0} squash={i === DEV} />
          </Sequence>
        );
      })}
      {[0, 1, 2].map((i) => (
        <Desk key={i} x={DESK_X[i]} />
      ))}

      {/* 働く机のスピード線。開発者の机は点線が消えてから */}
      {[0, 1, 2].map((i) =>
        robotPose(i, t) === "work" && (i !== AKANE || t >= 10) && (i !== GEN || t >= 10) ? (
          <SpeedLines key={i} x={robotCx(i) + 110} y={HEAD_TOP + 90} width={80} height={90} direction={1} />
        ) : null,
      )}

      {/* 電池。どの机も「自分の分」の点線は右端から 10% のところ。開発者の机だけ、付箋のあとに点線が消える */}
      {[0, 1, 2].map((i) => (
        <MarginBattery
          key={i}
          id={`b${i}`}
          cx={robotCx(i)}
          top={BAT_Y}
          level={level(i, t)}
          margin={margin(i, t)}
          lineOpacity={lineOpacity(i, t)}
          swell={i === DEV ? swell : 0}
          glow={i === DEV ? swell : 0}
        />
      ))}
      <Sequence from={sec(T.gone[1])} durationInFrames={sec(0.5)}>
        <Sparkle x={robotCx(DEV) + 60} y={BAT_Y - 90} />
        <Sparkle x={robotCx(DEV) - 160} y={BAT_Y - 30} />
      </Sequence>

      {/* 机の天板の左端の日めくり（人より奥） */}
      {[0, 1, 2].map((i) => (
        <MiniCalendar key={i} {...CAL(i)} stand={CAL_STAND} days={DAYS[i]} glow={i === DEV ? holdAt(t, T.calGlow, T.reach + 0.2, 0.15) : 0} />
      ))}

      {/* 開発者の机の天板の右端の付箋（人より奥） */}
      <LocalNote {...NOTE} appear={noteAppear} written={written} glow={bumpAt(t, T.gone[0], 0.8)} />
      <Sequence from={sec(T.pin)} durationInFrames={sec(0.5)}>
        <Sparkle x={NOTE.left + 50} y={NOTE.top - 80} />
      </Sequence>

      {/* 机の前に立つ3人 */}
      {[0, 1, 2].map((i) => {
        const [pose, from] = personPose(i, t);
        return (
          <Sequence key={`${i}-${pose}-${from}`} from={sec(from)} layout="none">
            <Sprite src={PERSON_SRC[pose]} cx={PERSON_CX[i]} baseY={PERSON_BASE + (PERSON_K[pose] ?? 1) * PERSON_H - PERSON_H} height={(PERSON_K[pose] ?? 1) * PERSON_H} squash={from > 0} />
          </Sequence>
        );
      })}
      <Sequence from={sec(T.turn)} durationInFrames={sec(T.calm - T.turn)}>
        <Exclamation x={PERSON_CX[AKANE] - 150} y={640} />
        <Exclamation x={PERSON_CX[GEN] + 70} y={640} />
      </Sequence>

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
    </AbsoluteFill>
  );
};

// 効果音。音は short_movie/materials/sfx/ の既存の wav（make_sfx.py・sfx_blocked.py・sfx_wait-quota.py・sfx_stranger-comment.py で合成したもの）。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number; len?: number }[] = [
  { name: "pop", at: T.tags, volume: 0.35 }, // 名前の札
  { name: "sparkle", at: T.calGlow, volume: 0.45 }, // 日めくりが光る
  { name: "swish", at: T.reach, volume: 0.45 }, // 手を伸ばす
  { name: "blocked_huh", at: T.turn, volume: 0.55 }, // 振り向いて驚く
  { name: "swish", at: T.back, volume: 0.4 }, // 手を引っ込める
  { name: "splat", at: T.pin, volume: 0.45 }, // 付箋を貼る
  { name: "typing", at: T.write[0], volume: 0.35 }, // 字を書く
  { name: "wait-quota_charge", at: T.gone[0], volume: 0.55 }, // 点線が消える
  { name: "typing", at: T.work, volume: 0.35 }, // 作り始める
  { name: "stranger-comment_relief", at: T.relief, volume: 0.5 }, // ほっとする
  { name: "sparkle", at: T.cheer, volume: 0.5 }, // 喜ぶ
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const WorkflowLocal: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(S("end").from)}>
      <Main />
    </Sequence>

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
