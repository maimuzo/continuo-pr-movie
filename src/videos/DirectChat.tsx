import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { CARD_SIZE, IssueCard } from "../components/IssueCard";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { sec } from "../theme";
import { script } from "./direct_chat.script";
import { EndCardDC, TitleCardDC } from "./direct_chat/Cards";
import { cardSlot, DIRECT_CHAT, IN_PROGRESS, Kanban6 } from "./direct_chat/Kanban6";
import { BubbleKind, CommentCard, CommentPile, PaneScreen, PILE_COLORS, SpeechBubble } from "./direct_chat/Props";

// Direct Chat の回。ふだんは issue のコメントで会話し、込み入ったらカードを Direct Chat へ動かして Claude Code と直接話す。
// continuo は指示を出さない（Claude Code を起動して見届けるだけ）ので、コンティは横で見守る役にする。
// 座標はすべて 1080×1080 の画面の座標。各カットの中の時刻は、そのカットの頭からの秒で書く。中身は docs/spec/detailed_storyboards/direct_chat.md

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const DEV_COLOR = PILE_COLORS[0];
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s);
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const EP = (name: string) => `ep/direct_chat/${name}.png`;

const Workshop: React.FC = () => <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />;
const Corner: React.FC = () => <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />;

// ---- 作業台のカット（コメントで会話する）----
// 左に作業台と、その奥で作る Claude Code。右に、膝のノートパソコンでコメントを書く開発者。上の真ん中でコンティが見守る
const BENCH = { x: 20, y: 640, width: 600 };
const CC = { cx: 320, baseY: 850, height: 440 };
const DEV = { cx: 850, baseY: 905, height: 500 };
const LAPTOP = { x: 700, y: 640 }; // 開発者のノートパソコンの画面のあたり
const CC_HEAD = { x: 330, y: 470 };
const KONTI_WATCH = { cx: 560, baseY: 300, height: 150 };
const PILE_AT = { x: 600, y: 450, scale: 1.1 };
const FLY = 0.45; // コメントが届くまでの秒

type Flight = { t: number; from: "dev" | "cc" };
const flightPath = (from: "dev" | "cc") => (from === "dev" ? [LAPTOP, CC_HEAD] : [CC_HEAD, LAPTOP]);

// 飛んでいくコメント。送った人の手もとから相手へ弧を描いて飛び、届くと小さくなって消える
const FlyingComment: React.FC<{ fl: Flight }> = ({ fl }) => {
  const f = useCurrentFrame();
  if (f < at(fl.t) || f > at(fl.t + FLY + 0.15)) return null;
  const [a, b] = flightPath(fl.from);
  const t = interpolate(f, [at(fl.t), at(fl.t + FLY)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const gone = interpolate(f, [at(fl.t + FLY), at(fl.t + FLY + 0.15)], [1, 0], clamp);
  return (
    <CommentCard
      x={lerp(t, a.x, b.x)}
      y={lerp(t, a.y, b.y) - Math.sin(t * Math.PI) * 150}
      color={fl.from === "dev" ? DEV_COLOR : TERRACOTTA}
      scale={lerp(Math.sin(t * Math.PI), 0.9, 1.45) * gone}
      rotate={(fl.from === "dev" ? -1 : 1) * lerp(t, 12, -6)}
    />
  );
};

const DeskCut: React.FC<{ flights: Flight[]; dev: "laptop" | "tangle"; devHop?: number; pile?: { tangle: number; shown: number }; nameTag?: boolean }> = ({
  flights,
  dev,
  devHop = 0,
  pile,
  nameTag,
}) => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 1.7) * 4;
  return (
    <AbsoluteFill>
      <Workshop />
      <Sprite src="characters/claude_code/work.png" cx={CC.cx + shake} baseY={CC.baseY + Math.abs(Math.sin(f * 0.9)) * -6} height={CC.height} rotate={shake / 3} squash={false} />
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BENCH.x, top: BENCH.y, width: BENCH.width }} />
      <SpeedLines x={CC.cx - 280} y={CC.baseY - 300} width={90} height={100} direction={-1} />

      <Sprite src="characters/continuo/wave.png" cx={KONTI_WATCH.cx} baseY={KONTI_WATCH.baseY + Math.sin(f / 8) * 6} height={KONTI_WATCH.height} squash={false} />

      <Sprite src={EP(dev === "laptop" ? "dev_laptop" : "dev_tangle")} cx={DEV.cx} baseY={DEV.baseY + devHop} height={DEV.height} />
      {dev === "tangle" ? <Sweat x={DEV.cx + 110} y={DEV.baseY - DEV.height + 70} scale={0.9} /> : null}

      {pile ? <CommentPile x={PILE_AT.x} y={PILE_AT.y} tangle={pile.tangle} shown={pile.shown} scale={PILE_AT.scale} /> : null}
      {flights.map((fl, i) => (
        <FlyingComment key={i} fl={fl} />
      ))}

      {nameTag ? (
        <Sequence from={at(0.15)} durationInFrames={at(1.6)}>
          <NameTag cx={CC.cx} tipY={CC.baseY - CC.height - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.6)} fontSize={40} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <DeskCut flights={[]} dev="laptop" />
  </AbsoluteFill>
);

// 場面2（2〜4.5秒）：コメントが2往復する
const COMMENTS: Flight[] = [
  { t: 0.3, from: "dev" },
  { t: 0.85, from: "cc" },
  { t: 1.4, from: "dev" },
  { t: 1.95, from: "cc" },
];
const CommentScene: React.FC = () => {
  const f = useCurrentFrame();
  // コメントを送るたびに開発者が小さく弾む
  const hop = COMMENTS.filter((c) => c.from === "dev").reduce((acc, c) => acc + interpolate(f, [at(c.t), at(c.t + 0.07), at(c.t + 0.2)], [0, -12, 0], clamp), 0);
  return <DeskCut flights={COMMENTS} dev="laptop" devHop={hop} nameTag />;
};

// 場面3の前半（4.5〜5.6秒）：コメントが次々に降って山になり、糸が絡まる。開発者が頭を抱える
const T_PILE_STEP = 0.12; // コメントが1つ降る間隔
const T_TANGLE = 0.45; // 糸が絡み始める
const T_HEAD = 0.55; // 頭を抱える
const TangleScene: React.FC = () => {
  const f = useCurrentFrame();
  const shown = interpolate(f, [0, at(T_PILE_STEP * 6)], [0, 6], clamp);
  const tangle = interpolate(f, [at(T_TANGLE), at(T_TANGLE + 0.4)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  return <DeskCut flights={[]} dev={f < at(T_HEAD) ? "laptop" : "tangle"} pile={{ tangle, shown }} />;
};

// ---- カンバンの壁のカット ----
// 6列のカンバンを 0.8倍で右寄りに掛ける。開発者はカードの左の縁に手を当てて、カードと一緒に横へ歩く。
// カットの頭から開発者はカードの前に立っている（左から歩いて入ると、体が画面の左の端で切れるため）
const K = { x: 270, y: 394, scale: 0.8 };
const slotX = (col: number) => K.x + cardSlot(col).x * K.scale;
const CARD_Y = K.y + cardSlot(0).y * K.scale;
const DRAG = { height: 460, handDX: 202, handDY: 271 }; // dev_drag.png の手の先は、足もとの中心から (+202, -271)
const devAt = (cardX: number) => ({ cx: cardX + 15 - DRAG.handDX, baseY: CARD_Y + (CARD_SIZE.h * K.scale) / 2 + DRAG.handDY });
const KONTI_TOP = { cx: 230, baseY: 300, height: 170 };
const KONTI_ASIDE = { cx: 140, baseY: 770, height: 130 };

const Board: React.FC<{ cardX: number; pin: boolean; highlight?: number; glow?: number }> = ({ cardX, pin, highlight, glow }) => (
  <Kanban6 x={K.x} y={K.y} scale={K.scale} highlight={highlight} glow={glow}>
    <IssueCard x={(cardX - K.x) / K.scale} y={cardSlot(0).y} pin={pin} />
  </Kanban6>
);

const Konti: React.FC<{ aside: number }> = ({ aside }) => {
  const f = useCurrentFrame();
  return (
    <Sprite
      src="characters/continuo/wave.png"
      cx={lerp(aside, KONTI_TOP.cx, KONTI_ASIDE.cx)}
      baseY={lerp(aside, KONTI_TOP.baseY, KONTI_ASIDE.baseY) + Math.sin(f / 7) * 5}
      height={lerp(aside, KONTI_TOP.height, KONTI_ASIDE.height)}
      squash={false}
    />
  );
};

// 場面3の後半（5.6〜7秒）：開発者がカードを Direct Chat へ動かす。コンティは脇のクッションへ下がる
const T_GRAB = 0.2;
const T_LAND = 1.0; // カードが Direct Chat に着く
const T_ASIDE = 0.7;
const MoveScene: React.FC = () => {
  const f = useCurrentFrame();
  const drag = interpolate(f, [at(T_GRAB), at(T_LAND)], [0, 1], { ...clamp, easing: ease });
  const cardX = lerp(drag, slotX(IN_PROGRESS), slotX(DIRECT_CHAT));
  const dev = devAt(cardX);
  const bob = f >= at(T_GRAB) && f < at(T_LAND) ? -Math.abs(Math.sin(f * 0.6)) * 10 : 0;
  const glow = interpolate(f, [at(T_LAND), at(T_LAND + 0.12), at(T_LAND + 0.4)], [0, 1, 0], clamp);
  const aside = interpolate(f, [at(T_ASIDE), at(T_ASIDE + 0.55)], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <Corner />
      <Board cardX={cardX} pin={f < at(T_GRAB) || f >= at(T_LAND)} highlight={DIRECT_CHAT} glow={glow} />
      {/* コンティは開発者の奥を通る */}
      <Konti aside={aside} />
      <Sprite src={EP("dev_drag")} cx={dev.cx} baseY={dev.baseY + bob} height={DRAG.height} />
      <Sequence from={at(T_GRAB)} durationInFrames={at(T_LAND - T_GRAB)}>
        <SpeedLines x={dev.cx - 260} y={dev.baseY - 330} width={150} height={150} direction={1} />
      </Sequence>
      <Sequence from={at(T_LAND)} durationInFrames={at(0.4)}>
        <Sparkle x={slotX(DIRECT_CHAT) + 60} y={CARD_Y - 100} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- 作業台のカット・話す（7〜10.5秒）----
// 壁の大きな画面（pane）を真ん中の上に。左に Claude Code、右に椅子ごと寄ってきた開発者。2人で画面を指さして話す。
// 画面の下で、絡まっていたコメントの山が、話が進むたびにほどけていく
const SCREEN = { x: 360, y: 90, w: 360, h: 250 };
const CC_TALK = { cx: 330, baseY: 890, height: 500 };
const DEV_TALK = { cx: 810, baseY: 905, height: 540 };
const CHAT_PILE = { x: 540, y: 445, scale: 0.75 };
const T_ROLL = 0.5; // 椅子ごと寄ってくる
const TALK: { t: number; who: "cc" | "dev"; kind: BubbleKind }[] = [
  { t: 0.7, who: "dev", kind: "question" },
  { t: 1.3, who: "cc", kind: "idea" },
  { t: 1.9, who: "dev", kind: "code" },
  { t: 2.5, who: "cc", kind: "check" },
  { t: 3.0, who: "dev", kind: "star" },
];

const ChatScene: React.FC = () => {
  const f = useCurrentFrame();
  const roll = interpolate(f, [0, at(T_ROLL)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) });
  const devCx = lerp(roll, 1350, DEV_TALK.cx);
  const last = (who: "cc" | "dev") => [...TALK].reverse().find((s) => s.who === who && f >= at(s.t));
  const ccSay = last("cc");
  const devSay = last("dev");
  const talked = TALK.filter((s) => f >= at(s.t)).length;
  const lines = interpolate(f, [at(0.6), at(3.0)], [1, 6], clamp);
  // 話すたびに糸が少しずつほどけ、4つ目の話（チェック）でほどけきる
  const tangle = TALK.slice(0, 4).reduce((acc, s) => acc - interpolate(f, [at(s.t), at(s.t + 0.3)], [0, 0.25], { ...clamp, easing: ease }), 1);
  const nod = (who: "cc" | "dev") => {
    const s = last(who);
    return s ? interpolate(f, [at(s.t), at(s.t + 0.08), at(s.t + 0.25)], [0, -16, 0], clamp) : 0;
  };

  return (
    <AbsoluteFill>
      <Workshop />
      <PaneScreen x={SCREEN.x} y={SCREEN.y} w={SCREEN.w} h={SCREEN.h} lines={lines} done={talked >= 4} />
      <CommentPile x={CHAT_PILE.x} y={CHAT_PILE.y} tangle={Math.max(0, tangle)} scale={CHAT_PILE.scale} />
      <Sequence from={at(2.8)} durationInFrames={at(0.6)}>
        <Sparkle x={CHAT_PILE.x + 70} y={CHAT_PILE.y - 90} />
      </Sequence>

      {/* コンティは左下のクッションのそばで見守る */}
      <Sprite src="characters/continuo/wave.png" cx={95} baseY={800 + Math.sin(f / 8) * 4} height={90} squash={false} />

      <Sprite src={EP("cc_point")} cx={CC_TALK.cx} baseY={CC_TALK.baseY + nod("cc")} height={CC_TALK.height} squash={false} />
      <Sprite src={EP("dev_point")} cx={devCx} baseY={DEV_TALK.baseY + nod("dev")} height={DEV_TALK.height} squash={false} />
      <Sequence durationInFrames={at(T_ROLL)}>
        <SpeedLines x={880} y={560} width={200} height={200} direction={-1} />
      </Sequence>

      {ccSay ? <SpeechBubble x={40} y={130} w={260} h={170} tail={{ x: 290, y: 380 }} kind={ccSay.kind} stepFrame={at(ccSay.t)} /> : null}
      {devSay ? <SpeechBubble x={780} y={120} w={260} h={170} tail={{ x: 800, y: 370 }} kind={devSay.kind} stepFrame={at(devSay.t)} /> : null}
      <Sequence from={at(2.5)} durationInFrames={at(0.6)}>
        <Sparkle x={SCREEN.x + SCREEN.w - 60} y={SCREEN.y - 30} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- カンバンの壁・戻す（10.5〜11.4秒）----
// 開発者がカードを Direct Chat から In Progress へ引き戻す。コンティはクッションから上へ戻って見守る
const T_BACK = 0.5; // カードが In Progress に着く
const BackScene: React.FC = () => {
  const f = useCurrentFrame();
  const drag = interpolate(f, [at(0.05), at(T_BACK)], [0, 1], { ...clamp, easing: ease });
  const cardX = lerp(drag, slotX(DIRECT_CHAT), slotX(IN_PROGRESS));
  const dev = devAt(cardX);
  const bob = f < at(T_BACK) ? -Math.abs(Math.sin(f * 0.6)) * 10 : 0;
  const glow = interpolate(f, [at(T_BACK), at(T_BACK + 0.1), at(T_BACK + 0.35)], [0, 1, 0], clamp);
  const aside = interpolate(f, [at(0.35), at(0.85)], [1, 0], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <Corner />
      <Board cardX={cardX} pin={f >= at(T_BACK)} highlight={IN_PROGRESS} glow={glow} />
      {/* コンティは開発者の奥を通る */}
      <Konti aside={aside} />
      <Sprite src={EP("dev_drag")} cx={dev.cx} baseY={dev.baseY + bob} height={DRAG.height} />
      <Sequence durationInFrames={at(T_BACK)}>
        <SpeedLines x={dev.cx + 210} y={dev.baseY - 330} width={150} height={150} direction={-1} />
      </Sequence>
      <Sequence from={at(T_BACK)} durationInFrames={at(0.4)}>
        <Sparkle x={slotX(IN_PROGRESS) + 60} y={CARD_Y - 100} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- 作業台・またコメントで（11.4〜13秒）----
// 席へ戻った開発者のノートパソコンに Claude Code からコメントが1つ届き、開発者が2回頷く
const T_REPLY = 0.3;
const T_NOD = T_REPLY + FLY + 0.1;
const AgainScene: React.FC = () => {
  const f = useCurrentFrame();
  const nod = [0, 0.28].reduce((acc, d) => acc + interpolate(f, [at(T_NOD + d), at(T_NOD + d + 0.1), at(T_NOD + d + 0.24)], [0, 18, 0], clamp), 0);
  return (
    <>
      <DeskCut flights={[{ t: T_REPLY, from: "cc" }]} dev="laptop" devHop={nod} />
      <Sequence from={at(T_NOD)} durationInFrames={at(0.6)}>
        <Sparkle x={LAPTOP.x - 30} y={LAPTOP.y - 120} />
      </Sequence>
    </>
  );
};

// カットの切り替え（動画の頭からの秒）
const CUT = {
  comment: S("comment").from,
  tangle: S("tangle").from,
  move: S("tangle").from + 1.1,
  chat: S("chat").from,
  back: S("back").from,
  again: S("back").from + 0.9,
  end: S("end").from,
};

// 効果音。at は動画の頭からの秒で、各カットの動きの時刻に合わせる
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "typing", at: CUT.comment + 0.05, volume: 0.35 }, // コメントを書く
  ...COMMENTS.map((c) => ({ name: "swish", at: CUT.comment + c.t, volume: 0.35 })), // コメントが飛ぶ
  ...COMMENTS.map((c) => ({ name: "pop", at: CUT.comment + c.t + FLY, volume: 0.4 })), // コメントが届く
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ name: "pop", at: CUT.tangle + i * T_PILE_STEP, volume: 0.3 })), // コメントが積み上がる
  { name: "splat", at: CUT.tangle + T_HEAD, volume: 0.5 }, // 頭を抱える
  { name: "swish", at: CUT.move + T_GRAB, volume: 0.6 }, // カードを動かす
  { name: "splat", at: CUT.move + T_LAND, volume: 0.7 }, // Direct Chat に着く
  { name: "swish", at: CUT.chat, volume: 0.5 }, // 椅子ごと寄る
  ...TALK.map((s) => ({ name: "pop", at: CUT.chat + s.t, volume: 0.35 })), // 吹き出しが進む
  { name: "sparkle", at: CUT.chat + 2.8, volume: 0.5 }, // 山がほどけきる
  { name: "swish", at: CUT.back + 0.05, volume: 0.5 }, // カードを戻す
  { name: "splat", at: CUT.back + T_BACK, volume: 0.6 }, // In Progress に着く
  { name: "swish", at: CUT.again + T_REPLY, volume: 0.35 }, // コメントが飛ぶ
  { name: "pop", at: CUT.again + T_REPLY + FLY, volume: 0.45 }, // コメントが届く
  { name: "sparkle", at: CUT.again + T_NOD, volume: 0.45 }, // 頷く
  { name: "pop", at: CUT.end, volume: 0.6 }, // 締めの字
];

const span = (a: number, b: number) => ({ from: sec(a), durationInFrames: sec(b) - sec(a) });

export const DirectChat: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence {...span(0, CUT.comment)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence {...span(CUT.comment, CUT.tangle)}>
      <CommentScene />
    </Sequence>
    <Sequence {...span(CUT.tangle, CUT.move)}>
      <TangleScene />
    </Sequence>
    <Sequence {...span(CUT.move, CUT.chat)}>
      <MoveScene />
    </Sequence>
    <Sequence {...span(CUT.chat, CUT.back)}>
      <ChatScene />
    </Sequence>
    <Sequence {...span(CUT.back, CUT.again)}>
      <BackScene />
    </Sequence>
    <Sequence {...span(CUT.again, CUT.end)}>
      <AgainScene />
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
    <Sequence from={sec(CUT.end)}>
      <EndCardDC lines={["話したいときは、", "直接"]} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
