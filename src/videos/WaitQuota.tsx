import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { ConcentrationLines, Exclamation, SnotBubble, Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { WaitEndCard } from "./wait_quota/WaitEndCard";
import { Inset } from "../components/Inset";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { sec, theme } from "../theme";
import { script } from "./wait_quota.script";
import { AlarmClock, FuelGauge, WallClock, Zzz } from "./wait_quota/Gauges";

// 寝て待つ回。作業台のカット（作業する・続きから）と、部屋の隅のカット（へたり込む・寝て待つ・起きる）を切り替える。
// 燃料計の残りと時計の時刻は、カットをまたいでつながるように、動画の頭からの秒の関数で決める。
// 座標はすべて 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const FPS = theme.fps;

// ---- 動画の頭からの秒で決める時刻 ----
const T_EMPTY = 5.35; // 燃料計が空になる
const T_SLUMP = 5.55; // Claude Code が座り込む
const T_FAST = 8.1; // 時計が早回しになる
const T_RESET = 9.6; // 区切りの時刻に針が届き、ベルが鳴る
const T_FULL = 9.95; // 燃料計が満タンに戻りきる
const T_LEAP = 11.0; // コンティが潮を吹いて飛び起きる
const T_NUDGE = 11.45; // コンティが Claude Code を起こす
const T_BACK = 12.05; // 作業台へ戻って続きを始める

// 燃料計の残り（0〜1）
const fuelAt = (t: number) => {
  if (t < 5) return interpolate(t, [2, 5], [1, 0.15], { ...clamp, easing: Easing.in(Easing.quad) });
  if (t < T_RESET) return interpolate(t, [5, T_EMPTY], [0.15, 0], clamp);
  if (t < T_BACK) return interpolate(t, [T_RESET, T_FULL], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  return interpolate(t, [T_BACK, 13], [1, 0.93], clamp);
};
// 時計の時刻（9時から。区切りは12時）。経った分を返す
const minutesAt = (t: number) => {
  if (t < T_FAST) return interpolate(t, [5, T_FAST], [0, 6], clamp);
  if (t < T_RESET) return lerp(interpolate(t, [T_FAST, T_RESET], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }), 6, 180);
  return 180 + (t - T_RESET) * 2;
};
const clockAt = (t: number) => {
  const m = minutesAt(t);
  return { hour: 9 + m / 60, minute: m % 60 };
};

// ---- 作業台のカット ----
const BENCH = { x: 210, y: 560, width: 720 };
const CC = { cx: 735, height: 500, baseY: 800 };

const Workshop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>
    <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
    {children}
    <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BENCH.x, top: BENCH.y, width: BENCH.width }} />
  </>
);

// 働く Claude Code。speed が大きいほど激しく揺れる
const WorkingCC: React.FC<{ f: number; speed: number }> = ({ f, speed }) => {
  const shake = Math.sin(f * speed) * (3 + speed * 2.5);
  return (
    <Sprite
      src="characters/claude_code/work.png"
      cx={CC.cx + shake}
      baseY={CC.baseY - Math.abs(Math.sin(f * speed * 0.55)) * 8}
      height={CC.height}
      rotate={shake / 3}
      squash={false}
    />
  );
};

// 場面1（タイトルの後ろ）：作業台のカットをぼかして映す
const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <Workshop />
  </AbsoluteFill>
);

// 場面2（2〜5秒）：Claude Code が猛烈に作業し、頭の上の燃料計がみるみる減る
const WorkScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = S("work").from + f / FPS;
  // だんだん激しくなる
  const speed = interpolate(t, [2, 5], [1.4, 2.6], clamp);
  // 名前の札が出ているあいだは燃料計をその上に置き、札が消えたら頭のすぐ上へ下ろす
  const gaugeY = interpolate(f, [sec(1.55), sec(1.85)], [128, 235], { ...clamp, easing: ease });
  const level = fuelAt(t);
  // 減るたびに一瞬ふるえる
  const jolt = Math.floor(f / 9) % 2 === 0 ? 0 : Math.sin(f * 3) * 3;
  return (
    <AbsoluteFill>
      <Workshop>
        <WorkingCC f={f} speed={speed} />
      </Workshop>
      <Sweat x={CC.cx + 150} y={CC.baseY - CC.height + 80} scale={0.9} />
      <Sequence from={sec(1.2)}>
        <Sweat x={CC.cx - 200} y={CC.baseY - CC.height + 120} scale={0.75} />
      </Sequence>
      <SpeedLines x={CC.cx - 340} y={CC.baseY - 330} width={120} height={120} direction={-1} />
      <SpeedLines x={CC.cx + 230} y={CC.baseY - 330} width={120} height={120} direction={1} />
      <FuelGauge cx={CC.cx + jolt} cy={gaugeY} level={level} frame={f} />
      {/* 減った分が、こぼれるように落ちる黄色の粒 */}
      {Array.from({ length: 6 }, (_, i) => {
        const p = ((f + i * 7) % 26) / 26;
        const x = CC.cx - 70 + level * 150 + ((i * 37) % 40);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: gaugeY + 30 + p * 70,
              width: 14,
              height: 14,
              borderRadius: 7,
              background: theme.color.highlight,
              border: `3px solid ${theme.color.ink}`,
              opacity: (1 - p) * (level > 0.16 ? 1 : 0),
            }}
          />
        );
      })}
      {/* 名前の札は最前面に。Claude Code が初めて出たときから 1.5秒 */}
      <Sequence from={sec(0.1)} durationInFrames={sec(1.5)}>
        <NameTag cx={CC.cx} tipY={CC.baseY - CC.height - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(1.5)} fontSize={40} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- 部屋の隅のカット（5〜12秒）----
// 左下のクッションでコンティが目覚まし時計を抱えて眠り、その右の床に Claude Code が座り込む。右上の壁に時計
const NAP = { cx: 180, baseY: 790, height: 235 };
const ALARM = { cx: 275, cy: 735, r: 58 };
const FLOOR = { cx: 620, baseY: 885 };
const SLUMP_H = 440;
const STAND_H = 480;
const WALL = { cx: 850, cy: 205, r: 118 };

const CornerScene: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame();
  const t = offset + f / FPS;
  const { hour, minute } = clockAt(t);
  const level = fuelAt(t);
  const ringing = t >= T_RESET && t < T_RESET + 1.0;
  const asleep = t < T_LEAP;
  const fast = interpolate(t, [T_FAST, T_FAST + 0.3, T_RESET - 0.1, T_RESET], [0, 1, 1, 0], clamp);
  const flash = interpolate(t, [T_RESET, T_RESET + 0.1, T_RESET + 0.6], [0, 1, 0], clamp);
  // 夜の暗さ：空になってから濃くなり、ベルが鳴ると朝になって消える
  const night = interpolate(t, [T_EMPTY, T_EMPTY + 0.5, T_RESET, T_RESET + 0.6], [0, 1, 1, 0], clamp);

  // Claude Code：立って作業の続き → 空になって座り込む → 起こされて驚く
  const standing = t < T_SLUMP;
  const woke = t >= T_NUDGE;
  const ccSrc = woke ? "characters/claude_code/wake.png" : standing ? "characters/claude_code/work.png" : "ep/wait_quota/cc_slump.png";
  const ccH = woke ? 470 : standing ? STAND_H : SLUMP_H;
  const slumpBounce = interpolate(t, [T_SLUMP, T_SLUMP + 0.08, T_SLUMP + 0.2], [0, 18, 0], clamp);
  const standShake = standing ? Math.sin(f * 0.9) * interpolate(t, [5, T_EMPTY], [6, 0], clamp) : 0;
  const wakeHop = interpolate(t, [T_NUDGE, T_NUDGE + 0.12, T_NUDGE + 0.3], [0, -40, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const gaugeY = FLOOR.baseY - ccH - 60 + slumpBounce * 0.5 + wakeHop;

  // コンティ：眠る → 飛び起きて潮を吹く → 浮かんで Claude Code の横へ
  const leap = interpolate(t, [T_LEAP, T_LEAP + 0.3, T_NUDGE - 0.05], [0, 1, 0.8], { ...clamp, easing: Easing.out(Easing.quad) });
  const swim = interpolate(t, [T_NUDGE - 0.15, T_NUDGE + 0.1], [0, 1], { ...clamp, easing: ease });

  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <WallClock cx={WALL.cx} cy={WALL.cy} r={WALL.r} hour={hour} minute={minute} mark={12} blur={fast} flash={flash} />
      {/* 早回しのしるし */}
      {fast > 0 ? (
        <svg width={150} height={90} style={{ position: "absolute", left: WALL.cx - 75, top: WALL.cy + WALL.r + 22, opacity: fast }}>
          {[0, 1].map((i) => {
            const x0 = 18 + i * 58 + ((f % 6) < 3 ? 0 : 6);
            return <path key={i} d={`M${x0} 10 L${x0 + 50} 45 L${x0} 80 Z`} fill={theme.color.highlight} stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />;
          })}
        </svg>
      ) : null}

      {/* Claude Code */}
      <Sprite src={ccSrc} cx={FLOOR.cx + standShake} baseY={FLOOR.baseY + slumpBounce + wakeHop} height={ccH} squash={!standing} />
      <FuelGauge cx={FLOOR.cx} cy={gaugeY} level={level} alarm={level <= 0.001} frame={f} />

      {/* コンティ */}
      {asleep ? (
        <>
          <Sprite src="characters/continuo/sleep.png" cx={NAP.cx} baseY={NAP.baseY + Math.sin(f / 10) * 4} height={NAP.height} squash={false} />
          <AlarmClock cx={ALARM.cx} cy={ALARM.cy + Math.sin(f / 10) * 4} r={ALARM.r} hour={hour} minute={minute} ring={ringing} frame={f} />
          <SnotBubble x={NAP.cx + 75} y={NAP.baseY - NAP.height - 10} />
          <Zzz x={NAP.cx - 30} y={NAP.baseY - NAP.height - 80} frame={f} />
        </>
      ) : t < T_NUDGE - 0.15 ? (
        <Sprite src="characters/continuo/leap.png" cx={NAP.cx + 30} baseY={lerp(leap, NAP.baseY, 640)} height={380} />
      ) : (
        <Sprite
          src="characters/continuo/wave.png"
          cx={lerp(swim, NAP.cx + 30, FLOOR.cx - 270)}
          baseY={lerp(swim, 560, 600) + Math.sin(f / 7) * 5}
          height={210}
          flip
          squash={false}
          rotate={Math.sin(f / 2.5) * 6}
        />
      )}
      {/* 空になった瞬間：がっくりの線 */}
      {t >= T_SLUMP && t < T_SLUMP + 0.5 ? (
        <svg width={260} height={120} style={{ position: "absolute", left: FLOOR.cx - 130, top: FLOOR.baseY - 70 }}>
          {[-1, 1].map((s) => (
            <path key={s} d={`M${130 + s * 120} 90 q ${-s * 20} -30 ${-s * 50} -30`} fill="none" stroke={theme.color.ink} strokeWidth={6} strokeLinecap="round" />
          ))}
        </svg>
      ) : null}

      {/* 夜の暗さ。キャラクターと時計も含めて全体に薄くかける */}
      <AbsoluteFill style={{ background: "rgba(24, 32, 86, 0.38)", opacity: night }} />
      {/* 暗いあいだも燃料計と時計は読めるように、明るい輪郭の上にもう一度描く */}
      {night > 0 ? (
        <div style={{ opacity: night }}>
          <WallClock cx={WALL.cx} cy={WALL.cy} r={WALL.r} hour={hour} minute={minute} mark={12} blur={fast} flash={flash} />
          <FuelGauge cx={FLOOR.cx} cy={gaugeY} level={level} alarm={level <= 0.001} frame={f} />
        </div>
      ) : null}

      {/* ベル：燃料計が満タンに戻る */}
      {t >= T_RESET && t < T_RESET + 0.8 ? (
        <Sequence from={sec(T_RESET - offset)}>
          <ConcentrationLines cx={FLOOR.cx} cy={gaugeY} size={700} />
          <Sparkle x={FLOOR.cx + 110} y={gaugeY - 90} />
          <Sparkle x={FLOOR.cx - 190} y={gaugeY - 60} />
          <Sparkle x={WALL.cx - 170} y={WALL.cy - 120} />
        </Sequence>
      ) : null}
      {/* 飛び起きる */}
      {t >= T_LEAP && t < T_LEAP + 0.6 ? (
        <Sequence from={sec(T_LEAP - offset)}>
          <ConcentrationLines cx={NAP.cx + 30} cy={560} size={900} />
          <Exclamation x={NAP.cx + 140} y={300} />
        </Sequence>
      ) : null}
      {t >= T_NUDGE && t < T_NUDGE + 0.6 ? (
        <Sequence from={sec(T_NUDGE - offset)}>
          <Exclamation x={FLOOR.cx + 130} y={FLOOR.baseY - 560} />
          <SpeedLines x={FLOOR.cx - 520} y={480} width={180} height={140} direction={1} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- 作業台に戻って、続きから（12.05〜13秒）----
const BackScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = T_BACK + f / FPS;
  const comeIn = interpolate(f, [0, sec(0.3)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill>
      <Workshop>
        <WorkingCC f={f} speed={1.6} />
      </Workshop>
      <FuelGauge cx={CC.cx} cy={235} level={fuelAt(t)} frame={f} />
      <Sparkle x={CC.cx + 150} y={CC.baseY - CC.height - 20} />
      <SpeedLines x={CC.cx - 340} y={CC.baseY - 330} width={120} height={120} direction={-1} />
      <Sprite src="characters/continuo/wave.png" cx={lerp(comeIn, 60, 250)} baseY={600 + Math.sin(f / 7) * 6} height={200} flip squash={false} rotate={Math.sin(f / 3) * 7} />
    </AbsoluteFill>
  );
};

// 開発者は自分の席で寝ている小窓
const InsetDeveloper: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Img src={staticFile("backgrounds/desk.png")} style={{ position: "absolute", left: -10, top: -260, width: 760 }} />
      <Sprite src="ep/wait_quota/dev_sleep.png" cx={250} baseY={318 + Math.sin(f / 12) * 2} height={300} flip squash={false} />
      <Zzz x={290} y={70} frame={f} size={36} />
    </>
  );
};

// 効果音。音は public/sfx/*.wav（共通の音）と public/sfx/wait_quota_*.wav（scripts/sfx_wait_quota.py で合成）。
// at は動画の頭からの秒で、各場面の動きの時刻に合わせる。無音でも意味が通る作りは変えない
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "typing", at: S("work").from + 0.1, volume: 0.35 }, // 猛烈に作業する
  { name: "typing", at: S("work").from + 1.3, volume: 0.35 },
  { name: "wait_quota_empty", at: T_EMPTY - 0.1, volume: 0.6 }, // 燃料計が空になる
  { name: "splat", at: T_SLUMP, volume: 0.5 }, // 座り込む
  { name: "wait_quota_tick", at: T_FAST - 0.4, volume: 0.45 }, // 時計の早回し
  { name: "wait_quota_bell", at: T_RESET, volume: 0.45 }, // ベル
  { name: "wait_quota_charge", at: T_RESET + 0.05, volume: 0.6 }, // 燃料計が満タンへ戻る
  { name: "spout", at: T_LEAP, volume: 0.6 }, // コンティが潮を吹いて飛び起きる
  { name: "pop", at: T_NUDGE, volume: 0.5 }, // Claude Code を起こす
  { name: "sparkle", at: T_BACK, volume: 0.45 }, // 続きを始める
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const WaitQuota: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence from={sec(S("work").from)} durationInFrames={sec(3)}>
      <WorkScene />
    </Sequence>
    <Sequence from={sec(S("empty").from)} durationInFrames={sec(T_BACK) - sec(S("empty").from)}>
      <CornerScene offset={S("empty").from} />
    </Sequence>
    <Sequence from={sec(T_BACK)} durationInFrames={sec(S("end").from) - sec(T_BACK)}>
      <BackScene />
    </Sequence>
    {/* 開発者は寝ている。11.3秒から締めまで、左上の小窓 */}
    <Sequence from={sec(11.3)} durationInFrames={sec(S("end").from) - sec(11.3)}>
      <Inset x={24} y={24} width={400} height={330}>
        <InsetDeveloper />
      </Inset>
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
      <WaitEndCard text={script.end} sprite="characters/continuo/sleep.png" spriteWidth={330} spriteTop={690} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(2.4)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
