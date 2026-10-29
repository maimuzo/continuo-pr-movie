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
import { BAT_TOP, BatteryRow, Desk, deskXs, DESK, HEAD_TOP, KB, Room, ROBOT_BASE, ROBOT_H, robotCxOf } from "./team_bid/TeamRoom";
import { EndCardLines } from "./team_bid/EndCardLines";
import { script } from "./team_bid.script";

// チームで入札の回。1つの部屋のカットだけで通す（カメラは動かさない）。
// 上に共有のカンバン、下にメンバーの机3つと Claude Code 3体、コンティは1頭。
// レートリミットの余裕を持つのは Claude Code なので、余裕値の％は各 Claude Code の頭の上の電池に出す。
// 部屋・机・電池の構図は ./team_bid/TeamRoom.tsx にあり、寝て待つ回でも使い回す。
// 時刻はすべて動画の頭からの秒で書く。座標は 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease });
// a で立ち上がり、len 秒で消える山
const bumpAt = (t: number, a: number, len = 0.3) => interpolate(t, [a, a + 0.06, a + len], [0, 1, 0], clamp);

// ---- 配置 ----
const slotOf = (col: number, i: number) => ({ x: KB.x + cardSlot(col).x, y: KB.y + cardSlot(col).y + i * 34 });
const DESK_X = deskXs(3); // 20・375・730
const robotCx = (i: number) => robotCxOf(DESK_X[i]);
const stackSpot = (i: number, k: number) => ({ x: DESK_X[i] + DESK.w - 62, y: 792 - k * 12 }); // 机の右に積む、受け取ったカード
const WHALE_H = 150;
const IDLE = { x: 205, y: 330 }; // コンティが待つ位置（カンバンの左）。カードを持つヒレの先の位置で表す

// ---- 入札の回ごとの時刻と、レートリミットの余裕値の動き ----
// 新しいカードが Ready に出る（t0）→ 3体の電池に余裕値の％が浮かぶ（bid）→ いちばん大きい机が光る（win）
// → コンティがカードを取り（grab）、運び（lift→drop）、受け取った机の余裕値が減る（drop→drainEnd）
type Round = { t0: number; bid: number; win: number; grab: number; lift: number; drop: number; drainEnd: number; to: number; after: number; stagger: number };
const ff = (t0: number, to: number, after: number): Round => ({
  t0,
  bid: t0 + 0.1,
  win: t0 + 0.25,
  grab: t0 + 0.32,
  lift: t0 + 0.42,
  drop: t0 + 0.72,
  drainEnd: t0 + 0.92,
  to,
  after,
  stagger: 0.04,
});
const START_FUEL = [72, 35, 10];
// 72/35/10 → A。30/35/10 → B。30/12/10 → A。8/12/10 → B。8/4/10 → C
const ROUNDS: Round[] = [
  { t0: 3.5, bid: 3.75, win: 4.25, grab: 4.55, lift: 4.65, drop: 5.3, drainEnd: 5.9, to: 0, after: 30, stagger: 0.12 },
  ff(6.1, 1, 12),
  ff(7.05, 0, 8),
  ff(8.0, 1, 4),
  ff(8.95, 2, 2),
];
const fuel = (i: number, t: number) => {
  let v = START_FUEL[i];
  for (const r of ROUNDS) {
    if (r.to !== i) continue;
    if (t >= r.drop) v = lerp(ramp(t, r.drop, r.drainEnd), v, r.after);
  }
  return v;
};
const deposits = (i: number) => ROUNDS.filter((r) => r.to === i).map((r) => r.drop);

// 10〜13秒：机に積んだカードが、作業分担して In Review へ飛ぶ
const FLIGHTS = (() => {
  const order: { desk: number; k: number }[] = [
    { desk: 0, k: 1 },
    { desk: 1, k: 1 },
    { desk: 2, k: 0 },
    { desk: 0, k: 0 },
    { desk: 1, k: 0 },
  ];
  const jitter = [
    [0, -3],
    [10, 4],
    [-6, -5],
    [8, 6],
    [-2, -2],
  ];
  return order.map((o, j) => ({ ...o, start: 10.15 + j * 0.25, end: 10.15 + j * 0.25 + 0.5, dx: jitter[j][0], rot: jitter[j][1], j }));
})();

// ---- コンティの位置（ヒレの先＝持っているカードの真ん中）----
type Key = { t: number; x: number; y: number; arc?: number };
const WHALE_KEYS: Key[] = (() => {
  const keys: Key[] = [{ t: 0, ...IDLE }];
  let last = { t: 0, ...IDLE };
  ROUNDS.forEach((r, n) => {
    const ready = slotOf(0, 3);
    const p = { x: ready.x + 65, y: ready.y + 39 };
    const k = deposits(r.to).indexOf(r.drop);
    const s = stackSpot(r.to, k);
    const approachFrom = n === 0 ? r.win : Math.max(last.t + 0.05, r.grab - 0.3);
    keys.push({ t: approachFrom, x: last.x, y: last.y });
    keys.push({ t: r.grab, ...p });
    keys.push({ t: r.lift, ...p });
    keys.push({ t: r.drop, x: s.x, y: s.y - 10, arc: 90 });
    last = { t: r.drop, x: s.x, y: s.y - 10 };
  });
  keys.push({ t: last.t + 0.15, x: last.x, y: last.y });
  keys.push({ t: 10.2, x: 760, y: 420 });
  return keys;
})();
const whaleAt = (t: number) => {
  for (let i = 1; i < WHALE_KEYS.length; i++) {
    const a = WHALE_KEYS[i - 1];
    const b = WHALE_KEYS[i];
    if (t < b.t) {
      const u = ramp(t, a.t, b.t);
      return { x: lerp(u, a.x, b.x), y: lerp(u, a.y, b.y) - Math.sin(u * Math.PI) * (b.arc ?? 0), vx: b.x - a.x };
    }
  }
  const z = WHALE_KEYS[WHALE_KEYS.length - 1];
  return { x: z.x, y: z.y, vx: 0 };
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

// ---- Claude Code の表情 ----
const robotPose = (i: number, t: number) => {
  if (t >= 10.1) return "cheer";
  const ds = deposits(i).filter((d) => d - 0.35 <= t);
  const d = ds[ds.length - 1];
  if (d !== undefined && t < d + 0.15) return "receive";
  if (d !== undefined && t < d + 1.3) return "work";
  return fuel(i, t) >= 20 ? "fist" : "wait";
};
const POSE_SRC: Record<string, string> = {
  receive: "characters/claude_code/receive.png",
  work: "characters/claude_code/work.png",
  fist: "characters/claude_code/fist.png",
  wait: "ep/team_bid/cc_wait.png",
  cheer: "characters/claude_code/peace_jump.png",
};

// 共有のカンバン。Ready の積み残し3枚・その回の新しいカード・In Review に届いたカードを描く
const BoardWithCards: React.FC<{ t: number }> = ({ t }) => {
  const backlog = [0.35, 0.85, 1.35];
  const reviewGlow = Math.max(0, ...FLIGHTS.map((fl) => bumpAt(t, fl.end, 0.4)));
  const readyGlow = Math.max(0, ...ROUNDS.map((r) => bumpAt(t, r.t0 + 0.15, 0.35)), ...backlog.map((b) => bumpAt(t, b + 0.15, 0.3)));
  const dropCard = (at: number, i: number, key: string) => {
    const s = slotOf(0, i);
    const fall = interpolate(t, [at, at + 0.18], [-140, 0], { ...clamp, easing: Easing.in(Easing.quad) });
    const squash = interpolate(t, [at + 0.18, at + 0.24, at + 0.38], [0, 0.6, 0], clamp);
    return <IssueCard key={key} x={s.x - KB.x} y={s.y - KB.y + fall} squash={squash} pin={t > at + 0.3} />;
  };
  return (
    <Kanban x={KB.x} y={KB.y} highlight={t >= 10 ? 2 : 0} glow={t >= 10 ? reviewGlow : readyGlow}>
      {backlog.map((b, i) => (t >= b ? dropCard(b, i, `b${i}`) : null))}
      {ROUNDS.map((r, n) => (t >= r.t0 && t < r.grab ? dropCard(r.t0, 3, `r${n}`) : null))}
      {FLIGHTS.map((fl) =>
        t >= fl.end ? (
          <IssueCard key={`v${fl.j}`} x={cardSlot(2).x + fl.dx} y={cardSlot(2).y + fl.j * 30} rotate={fl.rot} squash={interpolate(t, [fl.end, fl.end + 0.06, fl.end + 0.2], [0, 0.5, 0], clamp)} pin />
        ) : null,
      )}
    </Kanban>
  );
};

// 名前の札。3体が初めて出たときに、それぞれの頭の上へ
const TAG_FROM = 2.05;
const TAG_LEN = 1.3;

const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / theme.fps;
  const w = whaleAt(t);
  const right = facingRight(t);
  const whaleW = (WHALE_H * 729) / 556;
  const holding = ROUNDS.find((r) => t >= r.grab && t < r.drop);
  const celebrate = t >= 10.2;
  const whaleCx = w.x + (right ? -whaleW / 2 + 22 : whaleW / 2 - 22);
  const whaleBase = w.y + WHALE_H * 0.4 + Math.sin(f / 7) * 5 - (celebrate ? Math.abs(Math.sin((t - 10.2) * 5)) * 40 : 0);

  return (
    <AbsoluteFill>
      <Room />
      <BoardWithCards t={t} />

      {/* Claude Code 3体（机の奥）。2秒で机の後ろから跳ねて出る */}
      {[0, 1, 2].map((i) => {
        const rise = interpolate(t, [2 + i * 0.08, 2.25 + i * 0.08], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
        if (t < 2) return null;
        const pose = robotPose(i, t);
        const working = pose === "work";
        const shake = working ? Math.sin(f * 1.7) * 4 : 0;
        const hop = pose === "cheer" ? -Math.abs(Math.sin((t - 10.1 - i * 0.25) * 4)) * 36 : 0;
        const h = pose === "wait" ? ROBOT_H - 20 : pose === "cheer" ? ROBOT_H + 30 : ROBOT_H;
        return (
          <Sprite
            key={`${i}-${pose}`}
            src={POSE_SRC[pose]}
            cx={robotCx(i) + shake}
            baseY={lerp(rise, ROBOT_BASE + ROBOT_H, ROBOT_BASE) + hop + (pose === "wait" ? 10 : 0)}
            height={h}
            rotate={working ? shake / 3 : 0}
            squash={pose !== "work"}
          />
        );
      })}
      {[0, 1, 2].map((i) => (
        <Desk key={i} x={DESK_X[i]} />
      ))}

      {/* 机に積んだカード。In Review へ飛ぶまで置いておく */}
      {[0, 1, 2].map((i) =>
        deposits(i).map((d, k) => {
          const fl = FLIGHTS.find((x) => x.desk === i && x.k === k)!;
          if (t < d || t >= fl.start) return null;
          const s = stackSpot(i, k);
          return <IssueCard key={`${i}${k}`} x={s.x - 65} y={s.y - 39} scale={0.45} rotate={k ? -6 : 4} />;
        }),
      )}

      {/* 余裕の無い机：座ったまま待つ汗 */}
      {[0, 1, 2].map((i) => (robotPose(i, t) === "wait" && t >= 2.3 ? <Sweat key={i} x={robotCx(i) + 85} y={HEAD_TOP + 50} scale={0.7} /> : null))}

      {/* 働く机のスピード線 */}
      {[0, 1, 2].map((i) =>
        robotPose(i, t) === "work" ? <SpeedLines key={i} x={robotCx(i) + 110} y={HEAD_TOP + 90} width={80} height={90} direction={1} /> : null,
      )}

      {/* コンティ（1頭）と、運んでいるカード */}
      <Sprite src="characters/continuo/wave.png" cx={whaleCx} baseY={whaleBase} height={WHALE_H} flip={right} squash={false} rotate={celebrate ? Math.sin(f / 4) * 8 : 0} />
      {holding ? <IssueCard x={w.x - 65} y={w.y - 39} scale={lerp(ramp(t, holding.lift, holding.drop), 0.8, 0.5)} /> : null}
      {holding && t >= holding.lift ? <SpeedLines x={whaleCx + (right ? -230 : 110)} y={whaleBase - 120} width={120} height={90} direction={right ? 1 : -1} /> : null}

      {/* 電池と、入札の％。コンティが前を通っても数字が読めるように、コンティより手前に描く */}
      {t >= TAG_FROM + TAG_LEN - 0.05 ? (
        <BatteryRow
          cxs={[0, 1, 2].map(robotCx)}
          levels={[0, 1, 2].map((i) => fuel(i, t))}
          numbers={[0, 1, 2].map((i) => (t >= ROUNDS[0].bid + i * ROUNDS[0].stagger ? fuel(i, t) : null))}
          bumps={[0, 1, 2].map((i) => Math.max(0, ...ROUNDS.map((r) => bumpAt(t, r.bid + i * r.stagger, 0.3))))}
          wins={[0, 1, 2].map((i) => Math.max(0, ...ROUNDS.filter((r) => r.to === i).map((r) => interpolate(t, [r.win, r.win + 0.08, r.drop - 0.05, r.drop + 0.1], [0, 1, 1, 0], clamp))))}
          scale={interpolate(t, [3.3, 3.5], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) })}
        />
      ) : null}
      {ROUNDS.map((r, n) => (
        <Sequence key={n} from={sec(r.win)} durationInFrames={sec(0.5)}>
          <Sparkle x={robotCx(r.to) + 70} y={BAT_TOP - 120} />
          <Sparkle x={robotCx(r.to) - 150} y={BAT_TOP - 60} />
        </Sequence>
      ))}

      {/* 10〜13秒：机から In Review へ飛ぶカード */}
      {FLIGHTS.map((fl) => {
        if (t < fl.start || t >= fl.end) return null;
        const u = ramp(t, fl.start, fl.end);
        const from = stackSpot(fl.desk, fl.k);
        const to = { x: KB.x + cardSlot(2).x + fl.dx + 65, y: KB.y + cardSlot(2).y + fl.j * 30 + 39 };
        const x = lerp(u, from.x, to.x);
        const y = lerp(u, from.y, to.y) - Math.sin(u * Math.PI) * 120;
        return <IssueCard key={fl.j} x={x - 65} y={y - 39} scale={lerp(u, 0.45, 1)} rotate={lerp(u, 0, fl.rot)} />;
      })}
      <Sequence from={sec(10.2)} durationInFrames={sec(2.8)}>
        <Exclamation x={60} y={330} />
        <Exclamation x={960} y={330} />
      </Sequence>
      <Sequence from={sec(11.5)} durationInFrames={sec(1)}>
        <Sparkle x={770} y={120} />
        <Sparkle x={490} y={250} />
      </Sequence>

      {/* 名前の札は最前面に。3体が初めて出たときに、それぞれの頭の上へ */}
      <Sequence from={sec(TAG_FROM)} durationInFrames={sec(TAG_LEN)}>
        {[0, 1, 2].map((i) => (
          <NameTag key={i} cx={robotCx(i)} tipY={HEAD_TOP} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(TAG_LEN)} fontSize={34} />
        ))}
      </Sequence>

      {/* 早回しの印（6〜10秒） */}
      {t >= 6 && t < 10 ? <FastForward /> : null}
    </AbsoluteFill>
  );
};

const FastForward: React.FC = () => {
  const f = useCurrentFrame();
  const blink = Math.floor(f / 8) % 2 === 0 ? 1 : 0.55;
  return (
    <div
      style={{
        position: "absolute",
        left: 893,
        top: 44,
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

// 効果音。音は scripts/make_sfx.py と scripts/sfx_team_bid.py で合成した public/sfx/*.wav。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number }[] = [
  ...[0.35, 0.85, 1.35].map((a) => ({ name: "splat", at: a + 0.18, volume: 0.35 })), // カードが Ready に積まれる
  { name: "pop", at: 2.0, volume: 0.4 }, // Claude Code 3体が出る
  ...ROUNDS.map((r, n) => ({ name: "splat", at: r.t0 + 0.18, volume: n === 0 ? 0.6 : 0.3 })), // 新しいカード
  ...[0, 1, 2].map((i) => ({ name: "team_bid_bid", at: ROUNDS[0].bid + i * ROUNDS[0].stagger, volume: 0.45 })), // ％が浮かぶ
  ...ROUNDS.slice(1).map((r) => ({ name: "team_bid_bid", at: r.bid, volume: 0.3 })),
  ...ROUNDS.map((r, n) => ({ name: "team_bid_win", at: r.win, volume: n === 0 ? 0.6 : 0.35 })), // いちばん大きい机が選ばれる
  { name: "whoosh", at: ROUNDS[0].lift, volume: 0.45 }, // 運ぶ
  ...ROUNDS.slice(1).map((r) => ({ name: "swish", at: r.lift, volume: 0.35 })),
  ...FLIGHTS.map((fl) => ({ name: "pop", at: fl.end, volume: 0.35 })), // In Review に届く
  { name: "spout", at: 10.25, volume: 0.5 }, // コンティが喜ぶ
  { name: "sparkle", at: 11.5, volume: 0.45 },
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const TeamBid: React.FC = () => (
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
      <EndCardLines lines={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
