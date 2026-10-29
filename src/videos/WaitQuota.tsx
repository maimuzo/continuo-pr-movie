import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Exclamation, Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { IssueCard } from "../components/IssueCard";
import { cardSlot, Kanban } from "../components/Kanban";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { sec, theme } from "../theme";
import { BatteryRow, Desk, deskXs, HEAD_TOP, KB, Room, ROBOT_BASE, ROBOT_H, robotCxOf } from "./team_bid/TeamRoom";
import { DayCalendar, FaceIcon, FastForward, LabeledBattery, WallClock, Zzz } from "./wait_quota/Gauges";
import { WaitEndCard } from "./wait_quota/WaitEndCard";
import { script } from "./wait_quota.script";

// 寝て待つ回。チームで入札の回と同じ部屋（上に共有のカンバン、下にメンバーの机3つと Claude Code 3体、コンティ1頭）の1カットで通す。
// 真ん中の机の Claude Code の頭の上に「5時間」「1週間」の札を付けた電池を2本並べる。
// 5時間のレートリミットは時計の早回しで時刻が来ると戻り、同じ机で続きを始める。
// 1週間のレートリミットは日めくりがめくれても戻らないので、カードの担当者の顔が外れて Ready へ戻り、
// 入札で選ばれた左の机（68%）へコンティが運び、担当者の顔がその机の人の顔に替わる。
// 時刻はすべて動画の頭からの秒で書く。座標は 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const ramp = (t: number, a: number, b: number, e: (x: number) => number = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
const bumpAt = (t: number, a: number, len = 0.3) => interpolate(t, [a, a + 0.06, a + len], [0, 1, 0], clamp);
const between = (t: number, a: number, b: number) => t >= a && t < b;

// ---- 配置 ----
const DESK_X = deskXs(3); // 20・375・730
const robotCx = (i: number) => robotCxOf(DESK_X[i]);
const MID = 1; // レートリミットが尽きる机（開発者）
const TO = 0; // 引き継ぐ机（アカネ、68%）
const FACES = ["ep/wait_quota/icon_akane.png", "ep/wait_quota/icon_developer.png", "ep/wait_quota/icon_gen.png"];
const BADGE = (i: number) => ({ cx: DESK_X[i] + 165, cy: 858, size: 80 }); // 机の前板に付けた、その机の人の顔
const BAT_Y = 420; // 電池の上辺。名前の札（頭の上 486〜562）と重ならない高さ
const BAT5 = robotCx(MID) - 85;
const BAT7 = robotCx(MID) + 85;
const SIDE_LEVEL = [68, 0, 20];
const FACE = 66; // カードの右上の顔の大きさ。カードを縮めても顔は縮めない
const IP = { x: KB.x + cardSlot(1).x, y: KB.y + cardSlot(1).y }; // In Progress のカードの左上
const RD = { x: KB.x + cardSlot(0).x, y: KB.y + cardSlot(0).y }; // Ready のカードの左上
const ON_DESK = { cx: DESK_X[TO] + 275, cy: 768, k: 0.85 }; // 引き継いだ机に置いたカードの真ん中と縮み
const faceAt = (cx: number, cy: number, k: number) => ({ x: cx + 65 * k - 10, cy: cy - 39 * k + 2 });

// ---- 時刻 ----
const T = {
  tags: 2.05,
  tagLen: 1.3,
  drain5: [2.1, 3.5],
  sit1: 3.6,
  ff1: [4.2, 5.95], // 時計の早回し。7時から、リセットの印の12時まで
  bell: 5.95,
  stand: 6.2,
  work2: 6.55,
  ff2: [7.1, 8.45], // 日めくり
  drain7: [7.1, 8.4],
  sit2: 8.5,
  shake: 8.75,
  fall: [8.95, 9.6], // 顔が外れて落ちる
  back: [9.3, 9.75], // カードが Ready へ戻る
  wake: 9.8,
  bid: [10.15, 10.25],
  win: 10.55,
  go: 10.35,
  grab: 10.7,
  lift: 10.8,
  drop: 11.3,
  swap: [11.4, 11.75], // 机の顔がカードへ飛ぶ
  take: 11.8,
};
const FLIPS = Array.from({ length: 7 }, (_, k) => 7.2 + k * 0.17);

// ---- 電池の残り（0〜100）----
const five = (t: number) => {
  if (t < T.drain5[1]) return 100 * (1 - ramp(t, T.drain5[0], T.drain5[1], Easing.in(Easing.quad)));
  if (t < T.bell) return 0;
  if (t < T.work2) return 100 * ramp(t, T.bell, T.bell + 0.3);
  return lerp(ramp(t, T.work2, T.drain7[1], (x) => x), 100, 70);
};
const week = (t: number) => {
  if (t < T.work2) return lerp(ramp(t, 2.0, T.drain5[1], (x) => x), 45, 38);
  if (t < T.drain7[0]) return lerp(ramp(t, T.work2, T.drain7[0], (x) => x), 38, 34);
  return 34 * (1 - ramp(t, T.drain7[0], T.drain7[1], Easing.in(Easing.quad)));
};
const sideLevel = (i: number, t: number) => (i === TO ? lerp(ramp(t, T.take, 12.9, (x) => x), 68, 60) : SIDE_LEVEL[i]);

// ---- 時計と日めくり ----
const clockHour = (t: number) => {
  if (t < T.ff1[1]) return lerp(ramp(t, T.ff1[0], T.ff1[1], Easing.inOut(Easing.quad)), 7, 12);
  if (t < T.ff2[0]) return 12 + (t - T.bell) * 0.05;
  return 12 + (T.ff2[0] - T.bell) * 0.05 + lerp(ramp(t, T.ff2[0], T.ff2[1], (x) => x), 0, 30) + Math.max(0, t - T.ff2[1]) * 0.05;
};
const calendar = (t: number) => {
  const done = FLIPS.filter((a) => t >= a + 0.15).length;
  const cur = FLIPS.find((a) => t >= a && t < a + 0.15);
  return { day: 1 + done, flip: cur !== undefined ? (t - cur) / 0.15 : 0 };
};

// ---- Claude Code の表情 ----
const POSE_SRC: Record<string, string> = {
  receive: "characters/claude_code/receive.png",
  work: "characters/claude_code/work.png",
  fist: "characters/claude_code/fist.png",
  wait: "ep/team_bid/cc_wait.png",
};
const robotPose = (i: number, t: number) => {
  if (i === MID) {
    if (t < T.sit1) return "work";
    if (t < T.stand) return "wait";
    if (t < T.work2) return "fist";
    if (t < T.sit2) return "work";
    return "wait";
  }
  if (i === TO) {
    if (t >= T.take) return "work";
    if (t >= T.drop - 0.05) return "receive";
  }
  return "fist";
};

// ---- コンティ（ヒレの先＝持っているカードの真ん中）----
type Key = { t: number; x: number; y: number; arc?: number };
const IDLE = { x: 205, y: 330 };
const GRAB = { x: RD.x + 65, y: RD.y + 39 };
const WHALE_KEYS: Key[] = [
  { t: 0, ...IDLE },
  { t: T.go, ...IDLE },
  { t: T.grab, ...GRAB },
  { t: T.lift, ...GRAB },
  { t: T.drop, x: ON_DESK.cx, y: ON_DESK.cy - 10, arc: 60 },
  { t: T.drop + 0.25, x: ON_DESK.cx, y: ON_DESK.cy - 10 },
  { t: 12.1, ...IDLE, arc: 40 },
];
const whaleAt = (t: number) => {
  for (let i = 1; i < WHALE_KEYS.length; i++) {
    const a = WHALE_KEYS[i - 1];
    const b = WHALE_KEYS[i];
    if (t < b.t) {
      const u = ramp(t, a.t, b.t);
      return { x: lerp(u, a.x, b.x), y: lerp(u, a.y, b.y) - Math.sin(u * Math.PI) * (b.arc ?? 0) };
    }
  }
  const z = WHALE_KEYS[WHALE_KEYS.length - 1];
  return { x: z.x, y: z.y };
};
// 向き：最後に横へ動いた向きを保つ。右へ動いたら右向き（wave.png を裏返す）
const facingRight = (t: number) => {
  let right = true;
  for (let i = 1; i < WHALE_KEYS.length; i++) {
    if (WHALE_KEYS[i - 1].t > t) break;
    const dx = WHALE_KEYS[i].x - WHALE_KEYS[i - 1].x;
    if (Math.abs(dx) > 30) right = dx > 0;
  }
  return right;
};
const WHALE_H = 150;
const sleeping = (t: number) => between(t, 3.7, T.wake);

// ---- カードと担当者の顔 ----
// 返り値はカードの真ん中と縮み
const cardAt = (t: number, w: { x: number; y: number }) => {
  if (t < T.back[0]) return { cx: IP.x + 65, cy: IP.y + 39, k: 1 };
  if (t < T.grab) {
    const u = ramp(t, T.back[0], T.back[1]);
    return { cx: lerp(u, IP.x, RD.x) + 65, cy: IP.y + 39 - Math.sin(u * Math.PI) * 40, k: 1 };
  }
  if (t < T.drop) return { cx: w.x, cy: w.y, k: lerp(ramp(t, T.lift, T.drop), 1, ON_DESK.k) };
  return { cx: ON_DESK.cx, cy: ON_DESK.cy, k: ON_DESK.k };
};

const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  const w = whaleAt(t);
  const right = facingRight(t);
  const whaleW = (WHALE_H * 729) / 556;
  const whaleCx = w.x + (right ? -whaleW / 2 + 22 : whaleW / 2 - 22);
  const whaleBase = w.y + WHALE_H * 0.4 + Math.sin(f / 7) * 5;
  const card = cardAt(t, w);
  const corner = faceAt(card.cx, card.cy, card.k);
  const cal = calendar(t);
  const clockScale = interpolate(t, [4.0, 4.3, 6.5, 6.8], [1, 1.6, 1.6, 1], { ...clamp, easing: ease });
  const calScale = interpolate(t, [7.0, 7.25, 8.6, 8.9], [1, 1.35, 1.35, 1], { ...clamp, easing: ease });
  const blur = between(t, T.ff1[0], T.ff1[1]) || between(t, T.ff2[0], T.ff2[1]) ? 1 : 0;
  const ring = interpolate(t, [T.bell, T.bell + 0.05, T.bell + 0.7, T.bell + 0.9], [0, 1, 1, 0], clamp);

  // 外れて落ちる顔（8.95〜9.6秒）
  const fallU = interpolate(t, [T.fall[0], T.fall[1]], [0, 1], clamp);
  const fallFrom = faceAt(IP.x + 65, IP.y + 39, 1);
  const shakeRot = between(t, T.shake, T.fall[0]) ? Math.sin(f * 2.2) * 18 : 0;
  // 机の顔がカードへ飛ぶ（11.4〜11.75秒）
  const swapU = ramp(t, T.swap[0], T.swap[1]);
  const badge = BADGE(TO);
  const dest = faceAt(ON_DESK.cx, ON_DESK.cy, ON_DESK.k);

  return (
    <AbsoluteFill>
      <Room />
      <Kanban x={KB.x} y={KB.y} highlight={0} glow={bumpAt(t, T.back[1], 0.4)}>
        {[0, 1].map((j) => (
          <IssueCard key={j} x={cardSlot(3).x + (j ? 4 : -2)} y={cardSlot(3).y + j * 34} rotate={j ? 3 : -2} pin />
        ))}
      </Kanban>

      {/* 壁の時計（左）と日めくり（右） */}
      <WallClock cx={140} cy={150} r={58} hour={clockHour(t)} mark={12} blur={blur} ring={ring} frame={f} scale={clockScale} />
      <DayCalendar left={895} top={128} day={cal.day} flip={cal.flip} scale={calScale} />

      {/* Claude Code 3体（机の奥） */}
      {[0, 1, 2].map((i) => {
        const pose = robotPose(i, t);
        const working = pose === "work";
        const hard = working && i === MID;
        const shake = working ? Math.sin(f * 1.7) * (hard ? 6 : 3) : 0;
        const h = pose === "wait" ? ROBOT_H - 20 : ROBOT_H;
        const from = i !== MID ? 0 : t < T.sit1 ? 0 : t < T.stand ? T.sit1 : t < T.work2 ? T.stand : t < T.sit2 ? T.work2 : T.sit2;
        return (
          <Sequence key={`${i}-${pose}-${from}`} from={sec(i === TO && pose !== "fist" ? (pose === "work" ? T.take : T.drop - 0.05) : from)} layout="none">
            <Sprite src={POSE_SRC[pose]} cx={robotCx(i) + shake} baseY={ROBOT_BASE + (pose === "wait" ? 10 : 0)} height={h} rotate={working ? shake / 3 : 0} squash={pose !== "work"} />
          </Sequence>
        );
      })}
      {[0, 1, 2].map((i) => (
        <Desk key={i} x={DESK_X[i]} />
      ))}
      {/* 机の前板に、その机の人の顔 */}
      {[0, 1, 2].map((i) => (
        <FaceIcon key={i} {...BADGE(i)} src={FACES[i]} />
      ))}

      {/* 働く机のスピード線と汗、手を止めた机の汗 */}
      {[0, 1, 2].map((i) => {
        const pose = robotPose(i, t);
        if (pose === "work")
          return (
            <React.Fragment key={i}>
              <SpeedLines x={robotCx(i) + 110} y={HEAD_TOP + 90} width={80} height={90} direction={1} />
              {i === MID ? <Sweat x={robotCx(i) - 120} y={HEAD_TOP + 40} scale={0.7} /> : null}
            </React.Fragment>
          );
        if (pose === "wait") return <Sweat key={i} x={robotCx(i) + 85} y={HEAD_TOP + 50} scale={0.7} />;
        return null;
      })}
      <Sequence from={sec(T.stand)} durationInFrames={sec(0.8)}>
        <Exclamation x={robotCx(MID) + 90} y={HEAD_TOP - 10} />
      </Sequence>

      {/* 電池。真ん中の机は「5時間」「1週間」の2本、左右の机は1本ずつ */}
      <LabeledBattery cx={BAT5} top={BAT_Y} level={five(t)} label="5時間" alarm={between(t, T.drain5[1], T.bell)} frame={f} pulse={bumpAt(t, T.drain5[1], 0.3) + bumpAt(t, T.bell + 0.3, 0.3)} />
      <LabeledBattery cx={BAT7} top={BAT_Y} level={week(t)} label="1週間" alarm={t >= T.drain7[1]} frame={f} pulse={bumpAt(t, T.drain7[1], 0.3)} />
      <BatteryRow
        cxs={[robotCx(0), robotCx(2)]}
        top={BAT_Y}
        levels={[sideLevel(0, t), sideLevel(2, t)]}
        numbers={[t >= T.bid[0] ? sideLevel(0, t) : null, t >= T.bid[1] ? sideLevel(2, t) : null]}
        bumps={[bumpAt(t, T.bid[0]), bumpAt(t, T.bid[1])]}
        wins={[interpolate(t, [T.win, T.win + 0.08, T.drop - 0.05, T.drop + 0.1], [0, 1, 1, 0], clamp), 0]}
      />
      <Sequence from={sec(T.bell + 0.05)} durationInFrames={sec(0.5)}>
        <Sparkle x={BAT5 + 40} y={BAT_Y - 40} />
        <Sparkle x={BAT5 - 120} y={BAT_Y + 10} />
      </Sequence>
      <Sequence from={sec(T.win)} durationInFrames={sec(0.5)}>
        <Sparkle x={robotCx(TO) + 70} y={BAT_Y - 120} />
        <Sparkle x={robotCx(TO) - 150} y={BAT_Y - 60} />
      </Sequence>

      {/* コンティ。待つあいだは眠る */}
      {sleeping(t) ? (
        <>
          <Sprite src="characters/continuo/sleep.png" cx={128} baseY={392} height={118} squash={false} />
          <Zzz x={190} y={330} frame={f} />
        </>
      ) : (
        <Sprite src="characters/continuo/wave.png" cx={whaleCx} baseY={whaleBase} height={WHALE_H} flip={right} squash={false} rotate={t >= 12.1 ? Math.sin(f / 4) * 8 : 0} />
      )}
      <Sequence from={sec(T.wake)} durationInFrames={sec(0.6)}>
        <Exclamation x={200} y={150} />
      </Sequence>
      {between(t, T.lift, T.drop) ? <SpeedLines x={whaleCx + (right ? -230 : 110)} y={whaleBase - 120} width={120} height={90} direction={right ? 1 : -1} /> : null}

      {/* 問題のカード。右上に担当者の顔 */}
      <IssueCard x={card.cx - 65} y={card.cy - 39} scale={card.k} pin={t < T.grab} />
      {t < T.fall[0] ? <FaceIcon cx={corner.x} cy={corner.cy} size={FACE} src={FACES[MID]} rotate={shakeRot} /> : null}
      {between(t, T.fall[0], T.swap[1]) ? <FaceIcon cx={corner.x} cy={corner.cy} size={FACE} src={null} /> : null}
      {t >= T.swap[1] ? <FaceIcon cx={corner.x} cy={corner.cy} size={FACE} src={FACES[TO]} scale={1 + bumpAt(t, T.swap[1], 0.3) * 0.35} /> : null}

      {/* 外れて落ちる顔 */}
      {between(t, T.fall[0], T.fall[1]) ? (
        <FaceIcon cx={fallFrom.x + fallU * 70} cy={fallFrom.cy + fallU * fallU * 620} size={FACE} src={FACES[MID]} rotate={fallU * 240} opacity={interpolate(fallU, [0.75, 1], [1, 0], clamp)} />
      ) : null}
      {/* 机の顔がカードへ飛んで、担当者の顔が替わる */}
      {between(t, T.swap[0], T.swap[1]) ? (
        <FaceIcon cx={lerp(swapU, badge.cx, dest.x)} cy={lerp(swapU, badge.cy, dest.cy) - Math.sin(swapU * Math.PI) * 90} size={lerp(swapU, badge.size, FACE)} src={FACES[TO]} />
      ) : null}
      <Sequence from={sec(T.swap[1])} durationInFrames={sec(0.5)}>
        <Sparkle x={dest.x + 10} y={dest.cy - 70} />
        <Sparkle x={dest.x - 120} y={dest.cy - 40} />
      </Sequence>

      {/* 名前の札は最前面に。3体の頭の上へ */}
      <Sequence from={sec(T.tags)} durationInFrames={sec(T.tagLen)}>
        {[0, 1, 2].map((i) => (
          <NameTag key={i} cx={robotCx(i)} tipY={HEAD_TOP} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(T.tagLen)} fontSize={34} />
        ))}
      </Sequence>

      {/* 早回しの印 */}
      {between(t, T.ff1[0] - 0.05, T.ff1[1]) || between(t, T.ff2[0], T.ff2[1]) ? <FastForward frame={f} /> : null}
    </AbsoluteFill>
  );
};

// 効果音。音は scripts/make_sfx.py・scripts/sfx_wait_quota.py・scripts/sfx_team_bid.py で合成した public/sfx/*.wav。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number; len?: number }[] = [
  { name: "pop", at: T.tags, volume: 0.35 }, // 名前の札
  { name: "typing", at: 2.1, volume: 0.4 }, // 猛烈に作業する
  { name: "typing", at: 2.9, volume: 0.35 },
  { name: "wait_quota_empty", at: T.drain5[1], volume: 0.6 }, // 5時間の電池が空になる
  { name: "splat", at: T.sit1 + 0.02, volume: 0.3 }, // 座り込む
  { name: "wait_quota_tick", at: T.ff1[0] - 0.1, volume: 0.5, len: 2 }, // 時計の早回し
  { name: "wait_quota_bell", at: T.bell, volume: 0.5 }, // リセットの時刻のベル
  { name: "wait_quota_charge", at: T.bell + 0.02, volume: 0.55 }, // 満タンへ戻る
  { name: "pop", at: T.stand, volume: 0.45 }, // 立ち上がる
  { name: "typing", at: T.work2, volume: 0.35 }, // 続きを始める
  { name: "wait_quota_flip", at: FLIPS[0], volume: 0.6 }, // 日めくり
  { name: "wait_quota_empty", at: T.drain7[1], volume: 0.55 }, // 1週間の電池が空になる
  { name: "wait_quota_fall", at: T.fall[0], volume: 0.6 }, // 顔が外れて落ちる
  { name: "swish", at: T.back[0], volume: 0.45 }, // Ready へ戻る
  { name: "pop", at: T.wake, volume: 0.4 }, // コンティが起きる
  { name: "team_bid_bid", at: T.bid[0], volume: 0.45 }, // 余裕値が浮かぶ
  { name: "team_bid_bid", at: T.bid[1], volume: 0.4 },
  { name: "team_bid_win", at: T.win, volume: 0.55 }, // 68% の机が選ばれる
  { name: "whoosh", at: T.lift, volume: 0.45 }, // 運ぶ
  { name: "splat", at: T.drop, volume: 0.4 }, // 机に置く
  { name: "sparkle", at: T.swap[1], volume: 0.5 }, // 顔が替わる
  { name: "typing", at: T.take + 0.05, volume: 0.35 }, // 引き継いで作る
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const WaitQuota: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(S("end").from)}>
      <Main />
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
      <WaitEndCard lines={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} fontSize={120} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(e.len ?? 1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
