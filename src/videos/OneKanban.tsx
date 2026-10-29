import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { CrumpleMarks, Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { EndCard } from "./one_kanban/EndCard";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { WorktreeSign } from "../components/WorktreeSign";
import { sec, theme } from "../theme";
import { Board, REPO_CARD, RepoCard, slot } from "./one_kanban/Board";
import { BOOTH_X, REPOS, SIGNBOARD_Y } from "./one_kanban/repos";
import { script } from "./one_kanban.script";

// カンバン1枚の回。カンバンの壁のカット（2〜5秒）と、3軒の工房のカット（5〜13秒）に割る。
// 工房のカットは同じ絵の上で、カードを飛ばす場面と同時に作る場面を続けて見せる。カメラは動かさない。
// 座標はすべて 1080×1080 の画面の座標。各場面の中の時刻は、その場面の頭からの秒で書く

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const WATER = "#8FD3F4";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s);
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

// カードを真ん中の位置で置く（RepoCard は真ん中を軸に拡大する）
const CardAt: React.FC<{ cx: number; cy: number; repo: number; scale: number; squash?: number; pin?: boolean; rotate?: number }> = ({ cx, cy, repo, ...rest }) => (
  <RepoCard x={cx - REPO_CARD.w / 2} y={cy - REPO_CARD.h / 2} color={REPOS[repo].color} label={REPOS[repo].short} {...rest} />
);

// ---- 3軒の工房のカット ----
// 上の壁にカンバンを小さく掛け、その下に屋根の色が違う3軒の工房が並ぶ（背景の絵に描いてある）
const WALL = { x: 22, y: 8, scale: 0.65 };
const wallSlot = (col: number, row: number) => ({
  cx: WALL.x + (slot(col, row).x + REPO_CARD.w / 2) * WALL.scale,
  cy: WALL.y + (slot(col, row).y + REPO_CARD.h / 2) * WALL.scale,
});
const ROBOT = { baseY: 805, height: 250, dx: 10 };
const BENCH_W = 270;
const BENCH_TOP = 690;
const SIGN_SCALE = 0.75;
const SIGN_Y = 760;
const signLeft = (i: number) => BOOTH_X[i] - 67;
// 看板の札の真ん中。カードはここへ吸い込まれる
const tagSpot = (i: number) => ({ x: signLeft(i) + 84 * SIGN_SCALE, y: SIGN_Y + 86 * SIGN_SCALE });

const WorkshopsBackground: React.FC = () => (
  <>
    <Img src={staticFile("ep/one_kanban/workshops.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080 }} />
    {/* 入口の看板にリポジトリの名前。絵には字を描かせず、ここで書く（字が崩れないように）。
        板の幅は約250pxで、maimuzo/project-a を1行では収まらないので、owner と名前の2行にする */}
    {REPOS.map((r, i) => (
      <div
        key={r.name}
        style={{
          position: "absolute",
          left: BOOTH_X[i] - 125,
          top: SIGNBOARD_Y - 32,
          width: 250,
          height: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          color: theme.color.ink,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontSize: 22, lineHeight: "26px" }}>{r.owner}/</div>
        <div style={{ fontSize: 32, lineHeight: "36px" }}>{r.short}</div>
      </div>
    ))}
  </>
);

// 工房の中の作業台。Claude Code はこの奥に立ち、下半身が台に隠れる
const Bench: React.FC<{ i: number }> = ({ i }) => (
  <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BOOTH_X[i] - BENCH_W / 2, top: BENCH_TOP, width: BENCH_W }} />
);

// 作業台の前の板に掛かる worktree の看板。札はそのリポジトリの色。drop は上から落ちる量
const BenchSign: React.FC<{ i: number; drop?: number }> = ({ i, drop = 0 }) => (
  <div style={{ position: "absolute", left: signLeft(i), top: SIGN_Y + drop, transform: `scale(${SIGN_SCALE})`, transformOrigin: "0 0" }}>
    <WorktreeSign x={0} y={0} tagColor={REPOS[i].color} />
  </div>
);

// 作る Claude Code。3体の揺れの拍をずらす
const WorkingRobot: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 1.7 + i * 2.1) * 5;
  const cx = BOOTH_X[i] + ROBOT.dx;
  return (
    <>
      <Sprite
        src="characters/claude_code/work.png"
        cx={cx + shake}
        baseY={ROBOT.baseY + Math.abs(Math.sin(f * 0.9 + i)) * -6}
        height={ROBOT.height}
        rotate={shake / 3}
        squash={false}
      />
    </>
  );
};

const RobotEffects: React.FC<{ i: number }> = ({ i }) => {
  const cx = BOOTH_X[i] + ROBOT.dx;
  const top = ROBOT.baseY - ROBOT.height;
  return (
    <>
      <Sweat x={cx + 85} y={top + 40} scale={0.6} />
      <SpeedLines x={cx - 165} y={top + 95} width={60} height={60} direction={-1} />
      <SpeedLines x={cx + 105} y={top + 95} width={60} height={60} direction={1} />
    </>
  );
};

// 場面1（タイトルの後ろ）：工房のカットを、キャラクター無しでぼかして映す
const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <WorkshopsBackground />
    <Board x={WALL.x} y={WALL.y} scale={WALL.scale}>
      {REPOS.map((r, i) => (
        <RepoCard key={r.name} x={slot(0, i).x} y={slot(0, i).y} color={r.color} label={r.short} pin />
      ))}
    </Board>
    {REPOS.map((_, i) => (
      <Bench key={i} i={i} />
    ))}
  </AbsoluteFill>
);

// ---- 場面2（2〜5秒）：開発者が、色の違うカードを1枚のカンバンに並べる ----
// カンバンを大きく映し、左に立った開発者が、上げた右手から Ready の列へ1枚ずつ貼る
const LINE = { x: 360, y: 110, scale: 0.9 };
const DEV = { cx: 262, baseY: 930, height: 620 };
// dev_pin.png の、開いた右の手のひらの位置（絵の幅と高さに対する割合から求めた）
const HAND = { x: DEV.cx + 183, y: DEV.baseY - 376 };
const PLACE_AT = [0.3, 1.0, 1.7] as const; // 手から出る
const PLACE_DUR = 0.32; // 貼り付くまで

const LineUpScene: React.FC = () => {
  const f = useCurrentFrame();
  const slotScreen = (row: number) => ({
    cx: LINE.x + (slot(0, row).x + REPO_CARD.w / 2) * LINE.scale,
    cy: LINE.y + (slot(0, row).y + REPO_CARD.h / 2) * LINE.scale,
  });
  const lastHit = PLACE_AT[2] + PLACE_DUR;
  const glow = interpolate(f, [at(lastHit), at(lastHit + 0.12), at(lastHit + 0.6)], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <Board x={LINE.x} y={LINE.y} scale={LINE.scale} highlight={0} glow={glow}>
        {REPOS.map((r, i) => {
          const hit = PLACE_AT[i] + PLACE_DUR;
          if (f < at(hit)) return null;
          const squash = interpolate(f, [at(hit), at(hit + 0.08), at(hit + 0.25)], [1, 0.6, 0], clamp);
          return <RepoCard key={r.name} x={slot(0, i).x} y={slot(0, i).y} color={r.color} label={r.short} squash={squash} pin={squash < 0.3} />;
        })}
      </Board>
      {/* 開発者は顔を歪めないよう、伸び縮みさせず、貼るたびに少し背伸びするだけにする */}
      <Sprite
        src="ep/one_kanban/dev_pin.png"
        cx={DEV.cx}
        baseY={DEV.baseY - PLACE_AT.reduce((a, t) => a + interpolate(f, [at(t), at(t + 0.15), at(t + 0.35)], [0, 14, 0], clamp), 0)}
        height={DEV.height}
        squash={false}
      />
      {/* 手から Ready の列へ向かうカード */}
      {REPOS.map((r, i) => {
        const t0 = PLACE_AT[i];
        if (f < at(t0) || f >= at(t0 + PLACE_DUR)) return null;
        const u = interpolate(f, [at(t0), at(t0 + PLACE_DUR)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const target = slotScreen(i);
        return <CardAt key={r.name} cx={lerp(u, HAND.x + 20, target.cx)} cy={lerp(u, HAND.y - 40, target.cy)} repo={i} scale={lerp(u, 1.15, LINE.scale)} rotate={lerp(u, -12, 0)} />;
      })}
      {REPOS.map((_, i) => {
        const hit = PLACE_AT[i] + PLACE_DUR;
        const s = slotScreen(i);
        return (
          <Sequence key={i} from={at(hit)} durationInFrames={at(0.4)}>
            <CrumpleMarks x={s.cx + 70} y={s.cy - 70} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- 場面3（5〜10秒）：コンティが、カードを1枚ずつ潮で同じ色の工房へ飛ばす ----
// コンティはカンバンの右に浮かぶ。カードはカンバンから頭の上へ跳び、潮に乗って弧を描き、工房の作業台の看板の札へ吸い込まれる。
// カンバンのカードは Ready に残し（手渡すのは同じ見た目のカード）、場面4でそろって In Progress へ移す
const CONTI = { cx: 730, baseY: 250, height: 170 };
const LAUNCH = { x: CONTI.cx - 10, y: 52 }; // 潮の吹き出し口の上
const CARD_AT = [0.35, 1.7, 3.05] as const; // カンバンから跳ぶ
const HOP = 0.3; // 頭の上まで
const FLY = 0.55; // 潮に乗って工房まで
const landAt = (i: number) => CARD_AT[i] + HOP + FLY;
const ROBOT_WORK_AFTER = 0.7; // 受け取ってから作り始めるまで

const flightPoint = (i: number, u: number) => {
  const to = tagSpot(i);
  return { x: lerp(u, LAUNCH.x, to.x), y: lerp(u, LAUNCH.y, to.y) - Math.sin(u * Math.PI) * 170 };
};

const DispatchScene: React.FC = () => {
  const f = useCurrentFrame();
  const spouting = CARD_AT.some((t) => f >= at(t + HOP - 0.05) && f < at(t + HOP + 0.5));
  const bob = Math.sin(f / 7) * 5;
  return (
    <AbsoluteFill>
      <WorkshopsBackground />
      <Board x={WALL.x} y={WALL.y} scale={WALL.scale}>
        {REPOS.map((r, i) => (
          <RepoCard key={r.name} x={slot(0, i).x} y={slot(0, i).y} color={r.color} label={r.short} pin />
        ))}
      </Board>

      {/* 3軒の工房：受け取ったら、作業台の奥から Claude Code が跳ねて出る */}
      {REPOS.map((_, i) => {
        const land = landAt(i);
        const cx = BOOTH_X[i] + ROBOT.dx;
        const rise = interpolate(f, [at(land), at(land + 0.22)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
        const working = f >= at(land + ROBOT_WORK_AFTER);
        return (
          <React.Fragment key={i}>
            {f >= at(land) && !working ? (
              <Sprite src="characters/claude_code/receive.png" cx={cx} baseY={lerp(rise, ROBOT.baseY + 200, ROBOT.baseY)} height={ROBOT.height} />
            ) : null}
            {working ? (
              <Sequence from={at(land + ROBOT_WORK_AFTER)}>
                <WorkingRobot i={i} />
              </Sequence>
            ) : null}
            <Bench i={i} />
            {f >= at(land - 0.2) ? <BenchSign i={i} drop={interpolate(f, [at(land - 0.2), at(land)], [-260, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) })} /> : null}
            {working ? (
              <Sequence from={at(land + ROBOT_WORK_AFTER)}>
                <RobotEffects i={i} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* コンティ（左向き＝カンバンの方を向く）。カードを飛ばすときは潮を吹いて跳ねる */}
      {spouting ? (
        <Sprite src="characters/continuo/leap.png" cx={CONTI.cx} baseY={CONTI.baseY + 25} height={235} />
      ) : (
        <Sprite src="characters/continuo/wave.png" cx={CONTI.cx} baseY={CONTI.baseY + bob} height={CONTI.height} squash={false} />
      )}

      {/* カードと潮の軌跡 */}
      {REPOS.map((_, i) => {
        const t0 = CARD_AT[i];
        const land = landAt(i);
        if (f < at(t0) || f >= at(land + 0.45)) return null;
        const from = wallSlot(0, i);
        const hop = interpolate(f, [at(t0), at(t0 + HOP)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const u = interpolate(f, [at(t0 + HOP), at(land)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
        const flying = f >= at(t0 + HOP);
        const p = flying ? flightPoint(i, u) : { x: lerp(hop, from.cx, LAUNCH.x), y: lerp(hop, from.cy, LAUNCH.y) - Math.sin(hop * Math.PI) * 60 };
        const scale = flying ? lerp(u, 0.85, 0.3) : lerp(hop, WALL.scale, 0.85);
        const trailFade = interpolate(f, [at(land), at(land + 0.45)], [1, 0], clamp);
        const pts = Array.from({ length: 24 }, (_, k) => flightPoint(i, (u * k) / 23));
        const d = pts.map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
        return (
          <React.Fragment key={i}>
            {flying ? (
              <svg style={{ position: "absolute", inset: 0, opacity: trailFade }} width={1080} height={1080}>
                <path d={d} fill="none" stroke={theme.color.ink} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={WATER} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="10 22" strokeLinecap="round" opacity={0.9} />
              </svg>
            ) : null}
            {f < at(land) ? <CardAt cx={p.x} cy={p.y} repo={i} scale={scale} rotate={flying ? u * 360 * 0.15 : 0} /> : null}
          </React.Fragment>
        );
      })}

      {/* 届いた瞬間のしぶきときらり */}
      {REPOS.map((_, i) => {
        const s = tagSpot(i);
        return (
          <Sequence key={i} from={at(landAt(i))} durationInFrames={at(0.6)}>
            <Splash x={s.x} y={s.y} />
            <Sparkle x={s.x + 60} y={s.y - 120} />
          </Sequence>
        );
      })}

      {/* 名前の札は最前面に。3体とも、初めて出たときから 1.5秒 */}
      {REPOS.map((_, i) => (
        <Sequence key={i} from={at(landAt(i) + 0.05)} durationInFrames={at(1.5)}>
          <NameTag cx={BOOTH_X[i] + ROBOT.dx} tipY={ROBOT.baseY - ROBOT.height - 6} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.5)} fontSize={32} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// 潮のしぶき。届いた所のまわりに水の粒が飛び散る
const Splash: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [0, 10], [0.3, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const o = interpolate(f, [0, 2, 16], [0, 1, 0], clamp);
  return (
    <svg style={{ position: "absolute", left: x - 120, top: y - 120, opacity: o }} width={240} height={240}>
      {Array.from({ length: 8 }, (_, k) => {
        const a = -Math.PI / 2 + ((k - 3.5) / 3.5) * 1.4;
        const r = 95 * grow;
        return <circle key={k} cx={120 + Math.cos(a) * r} cy={120 + Math.sin(a) * r} r={11} fill={WATER} stroke={theme.color.ink} strokeWidth={4} />;
      })}
    </svg>
  );
};

// ---- 場面4（10〜13秒）：3軒で3体が同時に作り、カードがそろって In Progress へ ----
const T_SLIDE = 0.2;
const T_SLID = 0.7;

const ParallelScene: React.FC = () => {
  const f = useCurrentFrame();
  const slide = interpolate(f, [at(T_SLIDE), at(T_SLID)], [0, 1], { ...clamp, easing: ease });
  const glow = interpolate(f, [at(T_SLID), at(T_SLID + 0.12), at(T_SLID + 0.6)], [0, 1, 0], clamp);
  // コンティは3軒の屋根の上を、左から右へゆっくり泳いで見回る
  const swim = interpolate(f, [0, at(3)], [0, 1], clamp);
  const whale = { cx: lerp(swim, 150, 930), baseY: 392 + Math.sin(f / 8) * 6 };
  return (
    <AbsoluteFill>
      <WorkshopsBackground />
      <Board x={WALL.x} y={WALL.y} scale={WALL.scale} highlight={1} glow={glow}>
        {REPOS.map((r, i) => {
          const a = slot(0, i);
          const b = slot(1, i);
          const moving = slide > 0 && slide < 1;
          return <RepoCard key={r.name} x={lerp(slide, a.x, b.x)} y={a.y} color={r.color} label={r.short} pin={!moving} />;
        })}
      </Board>
      <Sequence from={at(T_SLIDE)} durationInFrames={at(T_SLID - T_SLIDE)}>
        <SpeedLines x={WALL.x + 20} y={WALL.y + 50} width={90} height={170} direction={1} />
      </Sequence>

      {REPOS.map((r, i) => (
        <React.Fragment key={r.name}>
          <WorkingRobot i={i} />
          <Bench i={i} />
          <BenchSign i={i} />
          <RobotEffects i={i} />
          <ProgressBar i={i} />
        </React.Fragment>
      ))}

      <Sprite src="characters/continuo/wave.png" cx={whale.cx} baseY={whale.baseY} height={130} flip squash={false} />
    </AbsoluteFill>
  );
};

// 工房ごとの進み具合の棒。3本が同時に伸び、3軒が並んで進んでいることを示す。色はそのリポジトリの色
const ProgressBar: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const rate = [1, 0.85, 0.95][i];
  const fill = interpolate(f, [0, at(3)], [0.12, 0.12 + 0.8 * rate], clamp);
  const w = 170;
  return (
    <div
      style={{
        position: "absolute",
        left: BOOTH_X[i] - w / 2,
        top: 492,
        width: w,
        height: 22,
        background: "#FFFDF7",
        border: `4px solid ${theme.color.ink}`,
        borderRadius: 11,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: `${fill * 100}%`, height: "100%", background: REPOS[i].color }} />
    </div>
  );
};

// 効果音。at は動画の頭からの秒で、各場面の動きの時刻に合わせる
const SFX: { name: string; at: number; volume: number }[] = [
  ...PLACE_AT.map((t) => ({ name: "splat", at: S("line_up").from + t + PLACE_DUR, volume: 0.7 })), // カードを貼る
  ...CARD_AT.flatMap((t, i) => [
    { name: "swish", at: S("dispatch").from + t, volume: 0.45 }, // カンバンから跳ぶ
    { name: "spout", at: S("dispatch").from + t + HOP - 0.05, volume: 0.55 }, // 潮で飛ばす
    { name: "pop", at: S("dispatch").from + landAt(i), volume: 0.5 }, // 看板が掛かり、Claude Code が出る
  ]),
  { name: "typing", at: S("parallel").from, volume: 0.35 }, // 3体が作る
  { name: "swish", at: S("parallel").from + T_SLIDE, volume: 0.6 }, // そろって In Progress へ
  { name: "sparkle", at: S("parallel").from + T_SLID, volume: 0.5 },
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const OneKanban: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence from={sec(S("line_up").from)} durationInFrames={sec(3)}>
      <LineUpScene />
    </Sequence>
    <Sequence from={sec(S("dispatch").from)} durationInFrames={sec(5)}>
      <DispatchScene />
    </Sequence>
    <Sequence from={sec(S("parallel").from)} durationInFrames={sec(3)}>
      <ParallelScene />
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
      <EndCard lines={[script.end.slice(0, 8), script.end.slice(8)]} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={680} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
