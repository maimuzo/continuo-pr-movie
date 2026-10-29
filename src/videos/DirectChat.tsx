import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Exclamation, Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { CARD_SIZE, IssueCard } from "../components/IssueCard";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { sec } from "../theme";
import { script } from "./direct_chat.script";
import { EndCardDC, TitleCardDC } from "./direct_chat/Cards";
import { cardSlot, DIRECT_CHAT, IN_PROGRESS, Kanban6 } from "./direct_chat/Kanban6";
import { BubbleKind, InstructionSlip, PaneScreen, SlipKind, SoundArcs, SpeechBubble, ZipMark } from "./direct_chat/Props";

// Direct Chat の回。作業台・カンバンの壁・作業台（話す）・カンバンの壁（戻す）の順にカットを割る。
// 座標はすべて 1080×1080 の画面の座標。各場面の中の時刻は、その場面の頭からの秒で書く。中身は docs/spec/detailed_storyboards/direct_chat.md

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s);
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const EP = (name: string) => `ep/direct_chat/${name}.png`;

const Workshop: React.FC = () => <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />;
const Corner: React.FC = () => <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />;

// ---- 作業台のカット（タイトルの後ろ・2〜5秒）----
const BENCH = { x: 400, y: 640, width: 640 };
const CC = { cx: 720, baseY: 860, height: 470 };
const SHOUT = { cx: 260, baseY: 520, height: 230 };
const BELL = { x: 467, y: 400 }; // メガホンの口（konti_megaphone.png の右端）
const CC_HEAD = { x: 700, y: 500 };

const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <Workshop />
    <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BENCH.x, top: BENCH.y, width: BENCH.width }} />
  </AbsoluteFill>
);

// 場面2：コンティがメガホンで次々に指示を飛ばし、Claude Code がせっせと作る
const SHOUTS: { t: number; kind: SlipKind }[] = [
  { t: 0.3, kind: "arrow" },
  { t: 0.9, kind: "plus" },
  { t: 1.5, kind: "lines" },
  { t: 2.1, kind: "check" },
];
const FLY = 0.5; // 紙が Claude Code に届くまでの秒

const OrderScene: React.FC = () => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 1.7) * 5;
  // 叫ぶたびに少し前へ乗り出す
  const lean = SHOUTS.reduce((acc, s) => acc + interpolate(f, [at(s.t), at(s.t + 0.06), at(s.t + 0.3)], [0, 1, 0], clamp), 0);
  return (
    <AbsoluteFill>
      <Workshop />
      <Sprite src="characters/claude_code/work.png" cx={CC.cx + shake} baseY={CC.baseY + Math.abs(Math.sin(f * 0.9)) * -6} height={CC.height} rotate={shake / 3} squash={false} />
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BENCH.x, top: BENCH.y, width: BENCH.width }} />
      <Sweat x={CC.cx + 150} y={CC.baseY - CC.height + 90} scale={0.8} />
      <SpeedLines x={CC.cx - 300} y={CC.baseY - 300} width={100} height={100} direction={-1} />
      <SpeedLines x={CC.cx + 200} y={CC.baseY - 300} width={100} height={100} direction={1} />

      <Sprite src={EP("konti_megaphone")} cx={SHOUT.cx + lean * 20} baseY={SHOUT.baseY + Math.sin(f / 7) * 6} height={SHOUT.height} rotate={-lean * 4} squash={false} />

      {SHOUTS.map((s, i) => {
        const t = interpolate(f, [at(s.t), at(s.t + FLY)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
        const gone = interpolate(f, [at(s.t + FLY), at(s.t + FLY + 0.15)], [1, 0], clamp);
        if (f < at(s.t) || f > at(s.t + FLY + 0.15)) return null;
        return (
          <React.Fragment key={i}>
            <InstructionSlip
              x={lerp(t, BELL.x, CC_HEAD.x)}
              y={lerp(t, BELL.y, CC_HEAD.y) - Math.sin(t * Math.PI) * 110}
              kind={s.kind}
              scale={lerp(t, 0.6, 1.1) * gone}
              rotate={lerp(t, -20, 10)}
            />
          </React.Fragment>
        );
      })}
      {SHOUTS.map((s, i) => (
        <Sequence key={i} from={at(s.t)} durationInFrames={at(0.4)}>
          <SoundArcs x={BELL.x - 10} y={BELL.y} />
        </Sequence>
      ))}

      {/* 初めて出た Claude Code に名前の札 */}
      <Sequence from={at(0.15)} durationInFrames={at(1.6)}>
        <NameTag cx={CC.cx} tipY={CC.baseY - CC.height - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.6)} fontSize={40} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- カンバンの壁のカット（5〜8秒・12〜13秒）----
// 6列のカンバンを 0.8倍で右寄りに掛ける。開発者はカードの左の縁に手を当てて、カードと一緒に横へ歩く
const K = { x: 270, y: 394, scale: 0.8 };
const slotX = (col: number) => K.x + cardSlot(col).x * K.scale;
const CARD_Y = K.y + cardSlot(0).y * K.scale;
const DRAG = { height: 460, handDX: 202, handDY: 271 }; // dev_drag.png の手の先は、足もとの中心から (+202, -271)
const devAt = (cardX: number) => ({ cx: cardX + 15 - DRAG.handDX, baseY: CARD_Y + (CARD_SIZE.h * K.scale) / 2 + DRAG.handDY });
const KONTI_TOP = { cx: 250, baseY: 290, height: 200 };
const KONTI_ASIDE = { cx: 130, baseY: 760, height: 150 };
const MEGA_FLOOR = { x: 230, y: 840, height: 90 }; // 床に置いたメガホンの真ん中

const Board: React.FC<{ cardX: number; pin: boolean; highlight?: number; glow?: number }> = ({ cardX, pin, highlight, glow }) => (
  <Kanban6 x={K.x} y={K.y} scale={K.scale} highlight={highlight} glow={glow}>
    <IssueCard x={(cardX - K.x) / K.scale} y={cardSlot(0).y} pin={pin} />
  </Kanban6>
);

const FloorMegaphone: React.FC<{ y?: number; rotate?: number }> = ({ y = MEGA_FLOOR.y, rotate = 0 }) => (
  <Sprite src={EP("megaphone")} cx={MEGA_FLOOR.x} baseY={y + MEGA_FLOOR.height / 2} height={MEGA_FLOOR.height} rotate={rotate} squash={false} />
);

// 場面3：開発者がカードを Direct Chat へ動かす。コンティはメガホンを置き、口にチャックをして脇へ下がる
const T_IN = 0.4; // 開発者が左から入りきる
const T_GRAB = 0.5;
const T_LAND = 1.5; // カードが Direct Chat に着く
const T_DROP = 1.8; // メガホンを放す
const T_FLOOR = 2.05; // メガホンが床に着く
const T_ZIP = 2.2; // 口にチャック
const T_ASIDE = 2.35;

const MoveScene: React.FC = () => {
  const f = useCurrentFrame();
  const drag = interpolate(f, [at(T_GRAB), at(T_LAND)], [0, 1], { ...clamp, easing: ease });
  const cardX = lerp(drag, slotX(IN_PROGRESS), slotX(DIRECT_CHAT));
  const dev = devAt(cardX);
  const walkIn = interpolate(f, [0, at(T_IN)], [-330, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const walking = f < at(T_LAND);
  const bob = walking ? -Math.abs(Math.sin(f * 0.6)) * 10 : 0;
  const glow = interpolate(f, [at(T_LAND), at(T_LAND + 0.12), at(T_LAND + 0.5)], [0, 1, 0], clamp);
  // メガホン：コンティのヒレから真下へ落ちて、床で小さく跳ねる
  const fall = interpolate(f, [at(T_DROP), at(T_FLOOR)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const bounce = interpolate(f, [at(T_FLOOR), at(T_FLOOR + 0.08), at(T_FLOOR + 0.16)], [0, -18, 0], clamp);
  const megaFrom = { x: KONTI_TOP.cx + 150, y: KONTI_TOP.baseY - 90 };
  // 脇へ下がる：上の宙から、左下のクッションのそばへ
  const aside = interpolate(f, [at(T_ASIDE), at(T_ASIDE + 0.5)], [0, 1], { ...clamp, easing: ease });
  const kontiCx = lerp(aside, KONTI_TOP.cx, KONTI_ASIDE.cx);
  const kontiBase = lerp(aside, KONTI_TOP.baseY, KONTI_ASIDE.baseY) + Math.sin(f / 7) * 5;
  const kontiH = lerp(aside, KONTI_TOP.height, KONTI_ASIDE.height);

  return (
    <AbsoluteFill>
      <Corner />
      <Board cardX={cardX} pin={f < at(T_GRAB) || f >= at(T_LAND)} highlight={DIRECT_CHAT} glow={glow} />

      <Sprite src={EP("dev_drag")} cx={dev.cx + walkIn} baseY={dev.baseY + bob} height={DRAG.height} squash={false} />
      <Sequence durationInFrames={at(T_IN)}>
        <SpeedLines x={0} y={500} width={200} height={160} direction={1} />
      </Sequence>
      <Sequence from={at(T_GRAB)} durationInFrames={at(T_LAND - T_GRAB)}>
        <SpeedLines x={dev.cx - 260} y={dev.baseY - 330} width={150} height={150} direction={1} />
      </Sequence>
      <Sequence from={at(T_LAND)} durationInFrames={at(0.6)}>
        <Sparkle x={slotX(DIRECT_CHAT) + 60} y={CARD_Y - 100} />
      </Sequence>

      {/* コンティ：メガホンを持つ → 放す → チャック → 脇へ */}
      {f < at(T_DROP) ? (
        <Sprite src={EP("konti_megaphone")} cx={KONTI_TOP.cx} baseY={KONTI_TOP.baseY + Math.sin(f / 7) * 5} height={KONTI_TOP.height} squash={false} />
      ) : f < at(T_ZIP) ? (
        <Sprite src="characters/continuo/wave.png" cx={KONTI_TOP.cx - 30} baseY={KONTI_TOP.baseY + Math.sin(f / 7) * 5} height={KONTI_TOP.height * 0.95} flip />
      ) : (
        <Sprite src={EP("konti_zip")} cx={kontiCx} baseY={kontiBase} height={kontiH} />
      )}
      <Sequence from={at(T_LAND + 0.05)} durationInFrames={at(0.5)}>
        <Exclamation x={KONTI_TOP.cx + 120} y={40} />
      </Sequence>
      <Sequence from={at(T_ZIP)} durationInFrames={at(0.6)}>
        <ZipMark x={KONTI_TOP.cx - 20} y={KONTI_TOP.baseY - 70} />
      </Sequence>

      {f >= at(T_DROP) && f < at(T_FLOOR) ? (
        <Sprite src={EP("megaphone")} cx={lerp(fall, megaFrom.x, MEGA_FLOOR.x)} baseY={lerp(fall, megaFrom.y, MEGA_FLOOR.y) + MEGA_FLOOR.height / 2} height={MEGA_FLOOR.height} rotate={fall * -25} squash={false} />
      ) : null}
      {f >= at(T_FLOOR) ? <FloorMegaphone y={MEGA_FLOOR.y + bounce} /> : null}
    </AbsoluteFill>
  );
};

// ---- 作業台のカット・話す（8〜12秒）----
// 壁の大きな画面（pane）を真ん中の上に。左に Claude Code、右に椅子ごと寄ってきた開発者。2人で画面を指さして話す
const SCREEN = { x: 360, y: 100, w: 360, h: 270 };
const CC_TALK = { cx: 340, baseY: 880, height: 500 };
const DEV_TALK = { cx: 800, baseY: 900, height: 540 };
const QUIET = { cx: 95, baseY: 760, height: 105 };
const T_ROLL = 0.5; // 椅子ごと寄ってくる
const TALK: { t: number; who: "cc" | "dev"; kind: BubbleKind }[] = [
  { t: 0.7, who: "dev", kind: "question" },
  { t: 1.3, who: "cc", kind: "idea" },
  { t: 1.9, who: "dev", kind: "code" },
  { t: 2.5, who: "cc", kind: "check" },
  { t: 3.1, who: "dev", kind: "star" },
];

const ChatScene: React.FC = () => {
  const f = useCurrentFrame();
  const roll = interpolate(f, [0, at(T_ROLL)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  const devCx = lerp(roll, 1350, DEV_TALK.cx);
  const last = (who: "cc" | "dev") => [...TALK].reverse().find((s) => s.who === who && f >= at(s.t));
  const ccSay = last("cc");
  const devSay = last("dev");
  const talked = TALK.filter((s) => f >= at(s.t)).length;
  const lines = interpolate(f, [at(0.6), at(3.2)], [1, 6], clamp);
  const nod = (who: "cc" | "dev") => {
    const s = last(who);
    return s ? interpolate(f, [at(s.t), at(s.t + 0.08), at(s.t + 0.25)], [0, -16, 0], clamp) : 0;
  };

  return (
    <AbsoluteFill>
      <Workshop />
      <PaneScreen x={SCREEN.x} y={SCREEN.y} w={SCREEN.w} h={SCREEN.h} lines={lines} done={talked >= 4} />

      {/* 口にチャックをしたコンティと、置いたメガホンは左下の隅 */}
      <Sprite src={EP("megaphone")} cx={90} baseY={870} height={70} squash={false} />
      <Sprite src={EP("konti_zip")} cx={QUIET.cx} baseY={QUIET.baseY + Math.sin(f / 8) * 4} height={QUIET.height} squash={false} />

      <Sprite src={EP("cc_point")} cx={CC_TALK.cx} baseY={CC_TALK.baseY + nod("cc")} height={CC_TALK.height} squash={false} />
      <Sprite src={EP("dev_point")} cx={devCx} baseY={DEV_TALK.baseY + nod("dev")} height={DEV_TALK.height} squash={false} />
      <Sequence durationInFrames={at(T_ROLL)}>
        <SpeedLines x={880} y={560} width={200} height={200} direction={-1} />
      </Sequence>

      {ccSay ? <SpeechBubble x={40} y={150} w={260} h={170} tail={{ x: 290, y: 390 }} kind={ccSay.kind} stepFrame={at(ccSay.t)} /> : null}
      {devSay ? <SpeechBubble x={780} y={130} w={260} h={170} tail={{ x: 800, y: 370 }} kind={devSay.kind} stepFrame={at(devSay.t)} /> : null}
      <Sequence from={at(2.5)} durationInFrames={at(0.6)}>
        <Sparkle x={SCREEN.x + SCREEN.w - 60} y={SCREEN.y - 30} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- カンバンの壁・戻す（12〜13秒）----
// 開発者がカードを Direct Chat から In Progress へ引き戻すと、コンティがチャックを外してメガホンを拾い直す
const T_BACK = 0.45; // カードが In Progress に着く
const T_PICK = 0.5; // コンティがメガホンを拾う

const BackScene: React.FC = () => {
  const f = useCurrentFrame();
  const drag = interpolate(f, [at(0.03), at(T_BACK)], [0, 1], { ...clamp, easing: ease });
  const cardX = lerp(drag, slotX(DIRECT_CHAT), slotX(IN_PROGRESS));
  const dev = devAt(cardX);
  const bob = f < at(T_BACK) ? -Math.abs(Math.sin(f * 0.6)) * 10 : 0;
  const glow = interpolate(f, [at(T_BACK), at(T_BACK + 0.1), at(T_BACK + 0.4)], [0, 1, 0], clamp);
  const rise = interpolate(f, [at(T_PICK), at(T_PICK + 0.2)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <AbsoluteFill>
      <Corner />
      <Board cardX={cardX} pin={f >= at(T_BACK)} highlight={IN_PROGRESS} glow={glow} />
      <Sprite src={EP("dev_drag")} cx={dev.cx} baseY={dev.baseY + bob} height={DRAG.height} squash={false} />
      <Sequence durationInFrames={at(T_BACK)}>
        <SpeedLines x={dev.cx + 210} y={dev.baseY - 330} width={150} height={150} direction={-1} />
      </Sequence>
      {/* コンティは開発者の足もとの手前にいる */}
      {f < at(T_PICK) ? (
        <>
          <FloorMegaphone />
          <Sprite src={EP("konti_zip")} cx={KONTI_ASIDE.cx} baseY={KONTI_ASIDE.baseY + Math.sin(f / 7) * 5} height={KONTI_ASIDE.height} squash={false} />
        </>
      ) : (
        <Sprite src={EP("konti_cheer")} cx={175} baseY={lerp(rise, 900, 850)} height={210} />
      )}
      <Sequence from={at(T_PICK)} durationInFrames={at(0.5)}>
        <Sparkle x={290} y={600} />
        <Sparkle x={20} y={650} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 効果音。at は動画の頭からの秒で、各場面の動きの時刻に合わせる
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "typing", at: S("order").from + 0.1, volume: 0.3 }, // Claude Code が作る
  ...SHOUTS.map((s) => ({ name: "direct_chat_blare", at: S("order").from + s.t, volume: 0.35 })), // メガホンで指示
  { name: "whoosh", at: S("move").from, volume: 0.35 }, // 開発者が入ってくる
  { name: "swish", at: S("move").from + T_GRAB, volume: 0.6 }, // カードを動かす
  { name: "splat", at: S("move").from + T_LAND, volume: 0.7 }, // Direct Chat に着く
  { name: "pop", at: S("move").from + T_FLOOR, volume: 0.5 }, // メガホンを床に置く
  { name: "direct_chat_zip", at: S("move").from + T_ZIP, volume: 0.6 }, // 口にチャック
  { name: "swish", at: S("chat").from, volume: 0.5 }, // 椅子ごと寄る
  ...TALK.map((s) => ({ name: "pop", at: S("chat").from + s.t, volume: 0.35 })), // 吹き出しが進む
  { name: "swish", at: S("back").from, volume: 0.5 }, // カードを戻す
  { name: "splat", at: S("back").from + T_BACK, volume: 0.6 }, // In Progress に着く
  { name: "spout", at: S("back").from + T_PICK, volume: 0.6 }, // コンティがメガホンを拾い直す
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const DirectChat: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence from={sec(S("order").from)} durationInFrames={sec(3)}>
      <OrderScene />
    </Sequence>
    <Sequence from={sec(S("move").from)} durationInFrames={sec(3)}>
      <MoveScene />
    </Sequence>
    <Sequence from={sec(S("chat").from)} durationInFrames={sec(4)}>
      <ChatScene />
    </Sequence>
    <Sequence from={sec(S("back").from)} durationInFrames={sec(1)}>
      <BackScene />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(2)}>
      <TitleCardDC text={script.title} outFrom={sec(1.7)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <EndCardDC lines={["話したいときは、", "直接"]} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

