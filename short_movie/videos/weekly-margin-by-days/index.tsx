import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../../components/Caption";
import { SpeedLines, Sparkle, Sweat } from "../../components/Effects";
import { NameTag } from "../../components/NameTag";
import { Sprite } from "../../components/Sprite";
import { IssueCard } from "../_shared/IssueCard";
import { sec, theme } from "../_shared/theme";
import { Desk, HEAD_TOP, Room, ROBOT_BASE, ROBOT_H } from "../_shared/TeamRoom";
import { Bell, DaysLeftCalendar, FastForward, MarginBattery, MarginTable, RedCross } from "./Gauges";
import { TitleCard2 } from "./TitleCard2";
import { WaitEndCard } from "./WaitEndCard";
import { script } from "./script";

// どの日も自分の分が残る回。チームで入札の回の部屋の1カットで通す。右寄りの机に Claude Code が1体、頭の上に「1週間」の電池、
// 左に開発者（ノートPC）、電池の左にコンティ、右上に日めくり（リセットまで あと N日）。
// 3〜10秒は「自分の分」の点線の無い電池が週の途中で空になり、開発者の作業が止まる。
// 10〜21秒は別の週。点線が付き、日めくりがめくれるたびに点線が右へ寄り、Claude Code は点線まで作って止まり、コンティはカードを抱えたまま待つ。
// 21〜27秒は最後の日。点線が右の端まで寄って消え、電池の最後まで作り、リセットのベルで満タンへ戻る。
// 電池は横向き（左から右へたまる）なので、「自分の分」は満タン側（右端）からの幅で描く。
// 時刻はすべて動画の頭からの秒で書く。座標は 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const ramp = (t: number, a: number, b: number, e: (x: number) => number = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
const bumpAt = (t: number, a: number, len = 0.3) => interpolate(t, [a, a + 0.06, a + len], [0, 1, 0], clamp);
const between = (t: number, a: number, b: number) => t >= a && t < b;

// ---- 配置（詳しいコンテの1節）----
const DESK = { x: 560, w: 400 };
const CC_X = 760; // Claude Code の中心
const BAT = { cx: 760, top: 330, labelCx: 640 }; // 電池（寝て待つ回の2倍）。札「1週間」は電池の上の左寄り
const CAL = { left: 860, top: 70 };
const TABLE = { left: 330, top: 60, width: 360 };
const DEV = { cx: 250, baseY: 960, h: 430 };
const WHALE = { cx: 520, top: 420, h: 150 };
const WHALE_W = (WHALE.h * 729) / 556;
const FIN = { x: WHALE.cx + WHALE_W / 2 - 22, y: WHALE.top + WHALE.h * 0.6 }; // 右向きのコンティのヒレの先（持っているカードの真ん中）
const CARD_TO = { x: 700, y: 775 }; // カードが届く Claude Code の手もと
const LAPTOP = { x: 366, y: 742 }; // 裏返した dev_laptop のノートPC

// ---- 自分の分（看板の値。％は例）----
// 看板に出す行。あと1日の行は出さない（0% は最後の日の場面で初めて見せる）
const ROWS = [
  [7, 30],
  [5, 15],
  [3, 10],
  [2, 5],
] as const;
// 看板に出さない日（あと6日・あと4日）も点線は右へ寄せるので、前後の行のあいだの値にする
const MARGIN: Record<number, number> = { 7: 30, 6: 20, 5: 15, 4: 12, 3: 10, 2: 5, 1: 0 };

// ---- 時刻（30秒。0〜3 タイトル / 3〜10 / 10〜21 / 21〜27 / 27〜30 締め）----
const T = {
  tags: 3.1,
  tagLen: 1.8,
  drain1: [3.4, 7.5],
  empty: 7.5,
  cross: 8.2,
  pale: 9.0,
  week2: 10.0, // 別の週。満タンへ戻る
  line: 10.35, // 点線と札が出る
  table: 10.6, // 看板が出る
  work7: [11.1, 11.8],
  cheer: 16.4,
  cheerEnd: 18.4,
  last: 21.0, // あと1日
  lineOff: 21.8, // 点線が右の端まで寄って消える
  workLast: [23.4, 25.2],
  bell: 25.7,
  charge: 25.75,
  fist: 26.3,
};
const FLIP_LEN = 0.3;
const LINE_DELAY = 0.35; // めくり終わりから点線が動き出すまで
const LINE_LEN = 0.35; // 点線が動く長さ
const OFF_LEN = 0.6; // 最後の日に点線が右の端まで寄る長さ
const FLIPS = [12.2, 13.8, 15.4, 17.0, 18.6]; // あと7日 → 6 → 5 → 4 → 3 → 2。1日あたり 1.6 秒
const DAYS = [6, 5, 4, 3, 2];
// コンティがカードを渡す（カードが飛ぶ）時刻
const CARDS = [3.4, 4.6, 5.8, 7.0, 10.8, ...FLIPS.map((F) => F + 0.5), 23.0];
const FLY = 0.35;
// Claude Code が作っているあいだ
const WORKS: [number, number][] = [T.drain1 as [number, number], T.work7 as [number, number], ...FLIPS.map((F) => [F + 0.85, F + 1.3] as [number, number]), T.workLast as [number, number]];

// ---- 電池の残り。左から a〜b（0〜100）の区間で表す ----
// たまるときは左から右へ伸びる（寝て待つ回と同じ）。Claude Code が使うときは左の端 a が右へ寄り、
// 「自分の分」の点線（右端から m の幅、つまり 100 − m）に届いたら止まる。点線より右の黄色が、開発者に残る自分の分
// [始め, 終わり, 前の値, 後の値] を時刻の順に並べる
type Seg = [number, number, number, number];
const USED_SEGS: Seg[] = [
  [T.work7[0], T.work7[1], 0, 100 - MARGIN[7]],
  ...FLIPS.map((F, i): Seg => [F + 0.85, F + 1.3, 100 - MARGIN[i === 0 ? 7 : DAYS[i - 1]], 100 - MARGIN[DAYS[i]]]),
  [T.workLast[0], T.workLast[1], 100 - MARGIN[2], 100],
];
const MARGIN_SEGS: Seg[] = [
  ...FLIPS.map((F, i): Seg => [F + LINE_DELAY, F + LINE_DELAY + LINE_LEN, MARGIN[i === 0 ? 7 : DAYS[i - 1]], MARGIN[DAYS[i]]]),
  [T.lineOff, T.lineOff + OFF_LEN, MARGIN[2], 0],
];
const segValue = (segs: Seg[], t: number, initial: number, e: (x: number) => number = ease) => {
  let v = initial;
  for (const [a, b, from, to] of segs) {
    if (t < a) break;
    v = t < b ? lerp(ramp(t, a, b, e), from, to) : to;
  }
  return v;
};
const fillAt = (t: number) => {
  // 3〜10秒：残り 70% から、週の途中で空になる
  if (t < T.week2) return { a: 30 + 70 * ramp(t, T.drain1[0], T.drain1[1], Easing.in(Easing.quad)), b: 100 };
  // 10秒：別の週。満タンへ戻る
  if (t < T.week2 + 0.3) return { a: 0, b: 100 * ramp(t, T.week2, T.week2 + 0.3) };
  // 25.75秒：リセットで満タンへ戻る
  if (t >= T.charge) return { a: 0, b: 100 * ramp(t, T.charge, T.charge + 0.4) };
  return { a: segValue(USED_SEGS, t, 0, (x) => x), b: 100 };
};
const margin = (t: number) => (t < T.line || t >= T.lineOff + OFF_LEN + 0.4 ? null : segValue(MARGIN_SEGS, t, MARGIN[7]));
// 点線は右の端まで寄ってから消える。札「0%」はそのあいだ見せる
const marginOpacity = (t: number) => interpolate(t, [T.lineOff + OFF_LEN, T.lineOff + OFF_LEN + 0.4], [1, 0], clamp);

// ---- 日めくり ----
const CAL_FLIPS = [...FLIPS.map((F, i) => ({ at: F, from: i === 0 ? 7 : DAYS[i - 1], to: DAYS[i] })), { at: T.last, from: 2, to: 1 }, { at: T.charge, from: 1, to: 7 }];
const calendar = (t: number) => {
  if (t < T.week2) return { cur: 4, next: 4, flip: 0 };
  let day = 7;
  for (const e of CAL_FLIPS) {
    if (t < e.at) break;
    if (t < e.at + FLIP_LEN) return { cur: e.from, next: e.to, flip: (t - e.at) / FLIP_LEN };
    day = e.to;
  }
  return { cur: day, next: day, flip: 0 };
};

// ---- Claude Code の表情 ----
const POSE_SRC: Record<string, string> = {
  receive: "characters/claude_code/receive.png",
  work: "characters/claude_code/work.png",
  fist: "characters/claude_code/fist.png",
  wait: "ep/team-bid/cc_wait.png",
};
const POSE_CUTS = [0, ...WORKS.flat(), T.empty, T.week2, T.fist].sort((a, b) => a - b);
const robotPose = (t: number) => {
  if (between(t, T.empty, T.week2)) return "wait"; // 電池が空になって座り込む
  if (WORKS.some(([a, b]) => between(t, a, b))) return "work";
  if (t >= T.fist) return "fist";
  return "receive";
};
const poseFrom = (t: number) => POSE_CUTS.filter((c) => c <= t).pop() ?? 0;

// ---- 開発者 ----
const devSrc = (t: number) => {
  if (between(t, T.pale, T.week2)) return "ep/flat-rate/dev_pale.png";
  if (between(t, T.cheer, T.cheerEnd)) return "ep/resume/dev_cheer.png";
  return "ep/direct-chat/dev_laptop.png";
};
const DEV_CUTS = [0, T.pale, T.week2, T.cheer, T.cheerEnd];

// ---- カード ----
const flying = (t: number) => CARDS.find((a) => between(t, a, a + FLY + 0.12));
// コンティがカードを持っているか。渡した直後の 0.3 秒と、慌てているあいだと、最後のカードを渡したあとは持たない
const holding = (t: number) => !between(t, T.empty, T.week2) && t < CARDS[CARDS.length - 1] && !CARDS.some((a) => between(t, a, a + 0.5));
const heldScale = (t: number) => {
  const last = CARDS.filter((a) => a + 0.5 <= t).pop();
  return last === undefined ? 1 : interpolate(t, [last + 0.5, last + 0.6], [0.3, 1], clamp);
};

const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  const cal = calendar(t);
  const calScale = interpolate(t, [FLIPS[0] - 0.3, FLIPS[0], FLIPS[4] + 1.0, FLIPS[4] + 1.3], [1, 1.2, 1.2, 1], { ...clamp, easing: ease }) + (bumpAt(t, T.week2, 0.35) + bumpAt(t, T.last, 0.35) + bumpAt(t, T.charge, 0.35)) * 0.15;
  const pose = robotPose(t);
  const working = pose === "work";
  const hard = working && t < T.week2;
  const shake = working ? Math.sin(f * 1.7) * (hard ? 6 : 3) : 0;
  const fluster = between(t, T.empty, T.week2);
  const whaleBase = WHALE.top + WHALE.h + Math.sin(f / 7) * 5;
  const bob = whaleBase - (WHALE.top + WHALE.h);
  const m = margin(t);
  const fl = flying(t);
  const ring = interpolate(t, [T.bell, T.bell + 0.05, T.bell + 0.9, T.bell + 1.05], [0, 1, 1, 0], clamp);
  const dev = devSrc(t);
  const devFrom = DEV_CUTS.filter((c) => c <= t).pop() ?? 0;
  const devHop = dev.includes("cheer") ? -Math.abs(Math.sin((t - T.cheer) * 9)) * 18 : 0;

  return (
    <AbsoluteFill>
      <Room />

      {/* 看板（10〜21秒）。今の残り日数の行を黄色にする */}
      <Sequence from={sec(T.table)} durationInFrames={sec(T.last - T.table)} layout="none">
        <MarginTable {...TABLE} rows={ROWS} active={cal.flip === 0 ? cal.cur : null} />
      </Sequence>

      {/* 日めくり（右上） */}
      <DaysLeftCalendar left={CAL.left} top={CAL.top} cur={cal.cur} next={cal.next} flip={cal.flip} scale={calScale} />

      {/* 開発者（左）。ノートPC は Claude Code の側へ向ける */}
      <Sequence key={devFrom} from={sec(devFrom)} layout="none">
        <Sprite src={dev} cx={DEV.cx} baseY={DEV.baseY + devHop} height={DEV.h} flip squash={dev.includes("laptop") ? false : true} />
      </Sequence>
      {between(t, T.pale, T.week2) ? <Sweat x={DEV.cx + 70} y={DEV.baseY - DEV.h + 40} scale={0.8} /> : null}
      <Sequence from={sec(T.cross)} durationInFrames={sec(T.week2 - T.cross)} layout="none">
        <RedCross cx={LAPTOP.x} cy={LAPTOP.y} size={96} />
      </Sequence>
      <Sequence from={sec(T.cheer)} durationInFrames={sec(0.6)}>
        <Sparkle x={DEV.cx + 60} y={DEV.baseY - DEV.h - 30} />
        <Sparkle x={DEV.cx - 150} y={DEV.baseY - DEV.h + 20} />
      </Sequence>

      {/* Claude Code（机の奥） */}
      <Sequence key={`${pose}-${poseFrom(t)}`} from={sec(poseFrom(t))} layout="none">
        <Sprite
          src={POSE_SRC[pose]}
          cx={CC_X + shake}
          baseY={ROBOT_BASE + (pose === "wait" ? 10 : 0)}
          height={pose === "wait" ? ROBOT_H - 20 : ROBOT_H}
          rotate={working ? shake / 3 : 0}
          squash={!working}
        />
      </Sequence>
      <Desk x={DESK.x} w={DESK.w} />
      {working ? <SpeedLines x={CC_X + 110} y={HEAD_TOP + 90} width={80} height={90} direction={1} /> : null}
      {hard ? <Sweat x={CC_X - 120} y={HEAD_TOP + 40} scale={0.7} /> : null}
      {pose === "wait" ? <Sweat x={CC_X + 85} y={HEAD_TOP + 50} scale={0.7} /> : null}

      {/* 電池「1週間」と「自分の分」 */}
      <MarginBattery
        cx={BAT.cx}
        top={BAT.top}
        labelCx={BAT.labelCx}
        label="1週間"
        fill={fillAt(t)}
        margin={m}
        marginOpacity={marginOpacity(t)}
        tagText={t >= T.lineOff ? "0%" : "自分の分"}
        tagPop={interpolate(t, [T.line, T.line + 0.1, T.line + 0.2], [0, 1.15, 1], clamp)}
        alarm={between(t, T.empty, T.week2)}
        frame={f}
        pulse={bumpAt(t, T.empty) + bumpAt(t, T.week2) + bumpAt(t, T.workLast[1]) + bumpAt(t, T.charge + 0.2)}
      />
      <Sequence from={sec(T.week2 + 0.1)} durationInFrames={sec(0.5)}>
        <Sparkle x={BAT.cx + 120} y={BAT.top - 40} />
        <Sparkle x={BAT.cx - 190} y={BAT.top + 10} />
      </Sequence>
      <Sequence from={sec(T.charge + 0.15)} durationInFrames={sec(0.5)}>
        <Sparkle x={BAT.cx + 120} y={BAT.top - 40} />
        <Sparkle x={BAT.cx - 190} y={BAT.top + 10} />
      </Sequence>

      {/* リセットの時刻のベル */}
      {t >= T.bell - 0.05 ? <Bell cx={BAT.cx - 90} cy={200} size={96} ring={ring} frame={f} opacity={interpolate(t, [T.bell - 0.05, T.bell + 0.05, S("end").from - 0.15, S("end").from], [0, 1, 1, 0], clamp)} /> : null}

      {/* コンティ。カードを Claude Code へ渡す。電池が空になったら慌てる */}
      {fluster ? (
        <Sprite src="characters/continuo/fluster.png" cx={WHALE.cx + Math.sin(f * 1.9) * 5} baseY={whaleBase} height={WHALE.h * 0.9} flip squash={false} />
      ) : (
        <Sprite src="characters/continuo/wave.png" cx={WHALE.cx} baseY={whaleBase} height={WHALE.h} flip squash={false} rotate={t >= T.fist ? Math.sin(f / 4) * 8 : 0} />
      )}
      {holding(t) ? <IssueCard x={FIN.x - 65} y={FIN.y - 39 + bob} rotate={-6} scale={heldScale(t) * 0.85} /> : null}
      {fl !== undefined
        ? (() => {
            const u = ramp(t, fl, fl + FLY);
            const k = interpolate(t, [fl + FLY, fl + FLY + 0.12], [0.85, 0], clamp);
            return <IssueCard x={lerp(u, FIN.x, CARD_TO.x) - 65} y={lerp(u, FIN.y, CARD_TO.y) - 39 - Math.sin(u * Math.PI) * 90} rotate={u * 20 - 6} scale={k} />;
          })()
        : null}
      {fl !== undefined && t < fl + FLY ? <SpeedLines x={lerp(ramp(t, fl, fl + FLY), FIN.x, CARD_TO.x) - 140} y={lerp(ramp(t, fl, fl + FLY), FIN.y, CARD_TO.y) - 80} width={90} height={70} direction={1} /> : null}

      {/* 名前の札は最前面に */}
      <Sequence from={sec(T.tags)} durationInFrames={sec(T.tagLen)}>
        <NameTag cx={CC_X} tipY={HEAD_TOP} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(T.tagLen)} fontSize={34} />
      </Sequence>

      {/* 早回しの印（日めくりの上） */}
      {between(t, FLIPS[0] - 0.05, FLIPS[4] + 1.3) ? <FastForward frame={f} left={878} top={2} height={56} /> : null}
    </AbsoluteFill>
  );
};

// 字幕は長いので、画面の幅に収まる大きさにする（定額のままの回と同じ決め方）
const captionSize = (text: string) => {
  const units = Array.from(text).reduce((n, c) => n + (c.charCodeAt(0) < 128 ? 0.55 : 1), 0);
  return Math.min(64, Math.floor(960 / units));
};

// 効果音。音はどれも既存の short_movie/materials/sfx/*.wav（wait-quota_* は short_movie/materials/sfx/sfx_wait-quota.py、
// blocked_bonk は short_movie/materials/sfx/sfx_blocked.py で合成したもの）。新しく合成した音は無い。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number; len?: number }[] = [
  { name: "pop", at: T.tags, volume: 0.35 }, // 名前の札
  ...CARDS.slice(0, 4).map((a) => ({ name: "whoosh", at: a, volume: 0.4 })), // カードが飛ぶ
  { name: "typing", at: 3.5, volume: 0.4 }, // 作る
  { name: "typing", at: 5.0, volume: 0.35 },
  { name: "typing", at: 6.4, volume: 0.35 },
  { name: "wait-quota_empty", at: T.empty, volume: 0.6 }, // 電池が空
  { name: "blocked_bonk", at: T.cross, volume: 0.55 }, // 赤い「×」
  { name: "splat", at: T.pale, volume: 0.35 }, // 青ざめる
  { name: "wait-quota_charge", at: T.week2, volume: 0.55 }, // 満タン（別の週）
  { name: "pop", at: T.line, volume: 0.45 }, // 点線と札が出る
  { name: "pop", at: T.table, volume: 0.35 }, // 看板が出る
  ...CARDS.slice(4, 4 + 1 + FLIPS.length).map((a) => ({ name: "whoosh", at: a, volume: 0.25 })), // カードが飛ぶ（日ごと）
  ...FLIPS.map((F) => ({ name: "wait-quota_flip", at: F, volume: 0.55 })), // 日めくり
  { name: "sparkle", at: T.cheer, volume: 0.5 }, // 開発者が喜ぶ
  { name: "wait-quota_flip", at: T.last, volume: 0.6 }, // あと1日
  { name: "swish", at: T.lineOff, volume: 0.45 }, // 点線が右の端へ寄って消える
  { name: "whoosh", at: CARDS[CARDS.length - 1], volume: 0.45 }, // カードが飛ぶ
  { name: "typing", at: T.workLast[0], volume: 0.35 }, // 最後まで作る
  { name: "wait-quota_bell", at: T.bell, volume: 0.5 }, // リセットのベル
  { name: "wait-quota_charge", at: T.charge, volume: 0.55 }, // 満タンへ戻る
  { name: "pop", at: T.fist, volume: 0.45 }, // こぶし
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const WeeklyMarginByDays: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(S("end").from)}>
      <Main />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} size={captionSize(s.caption)} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(S("title").to)}>
      <TitleCard2 lines={script.titleLines} outFrom={sec(S("title").to - 0.3)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <WaitEndCard lines={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} fontSize={120} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(e.len ?? 1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// short-movie の render.sh は default の部品と meta を読む
export default WeeklyMarginByDays;
export { meta } from "./script";
