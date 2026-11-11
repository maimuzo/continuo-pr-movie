import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { ConcentrationLines, CrumpleMarks, Exclamation, Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { CARD_SIZE, IssueCard } from "../components/IssueCard";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { sec, theme } from "../theme";
import { EndCard } from "./blocked/EndCard";
import { cardSlot, Kanban } from "./blocked/Kanban";
import { BigQuestion, BumpStars, CommentBubble, Cursor, Fog, FogQuestion, ToyBlock, ToyRoof } from "./blocked/parts";
import { TitleCard } from "./blocked/TitleCard";
import { script } from "./blocked.script";

// 詰まったらひとことの回。工事現場・カンバンの壁・机の3つのカットを場面ごとに切り替える。
// 座標はすべて 1080×1080 の画面の座標。各場面の中の時刻は、その場面の頭からの秒で書く

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s);
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const YELLOW = { color: "#F2C14E", shade: "#D49A2A" };
const CREAM = { color: "#F3E6C8", shade: "#D8C49C" };
const BLUE = { color: "#6E9BD8", shade: "#4C76B0" };

// ---- 工事現場のカット ----
// 背景 ep/blocked/site：道は手前の中央（x 465〜615）から奥へのび、y 455 の赤い壁に突き当たる。
// その手前（y 460〜545）で道が左右に分かれ、右の道の突き当たり（x 905〜1080）に空き地の板がある
const SiteBackground: React.FC = () => <Img src={staticFile("ep/blocked/site.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />;
const WALL_SPOT = { cx: 540, baseY: 552, height: 320 }; // 壁の前で立ち止まる場所
const FOG_L = { x: 190, y: 478, width: 470 };
const FOG_R = { x: 890, y: 478, width: 470 };
// 場面2の頭で組み上げている、道の左わきの積み木の塔（左上の座標）
const TOWER = { x: 290, baseY: 905, w: 120, h: 58 };
// 場面5で組み上げる、右の道の先の家（空き地の板の上）
const LOT = { x: 922, baseY: 528, w: 140, h: 60 };

// 左右の霧。clearRight（0〜1）で右だけが晴れる
const Fogs: React.FC<{ clearRight?: number; marks?: boolean }> = ({ clearRight = 0, marks = true }) => (
  <>
    <Fog {...FOG_L} dir={-1} seed={1} />
    <Fog {...FOG_R} dir={1} seed={3} clear={clearRight} />
    {marks ? <FogQuestion x={FOG_L.x - 30} y={FOG_L.y - 40} /> : null}
    {marks && clearRight < 0.2 ? (
      <div style={{ opacity: 1 - clearRight * 5 }}>
        <FogQuestion x={FOG_R.x + 30} y={FOG_R.y - 40} />
      </div>
    ) : null}
  </>
);

// 道の左わきの塔。積んである2段と、場面2で積む3段目
const Tower: React.FC<{ third: number }> = ({ third }) => (
  <>
    <ToyBlock x={TOWER.x} y={TOWER.baseY - TOWER.h} w={TOWER.w} h={TOWER.h} {...BLUE} />
    <ToyBlock x={TOWER.x} y={TOWER.baseY - TOWER.h * 2 - 4} w={TOWER.w} h={TOWER.h} {...CREAM} />
    <ToyBlock x={TOWER.x} y={TOWER.baseY - TOWER.h * 3 - 8} w={TOWER.w} h={TOWER.h} {...YELLOW} drop={third} />
  </>
);

// 場面1（タイトルの後ろ）：工事現場をぼかして映す
const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <SiteBackground />
    <Tower third={0} />
    <Fogs marks={false} />
  </AbsoluteFill>
);

// 場面2（2〜5秒）：積み木を1個積み、次の部品を抱えて奥へ走る。壁に突き当たり、左右の霧で道が見えず、「？」を浮かべて片手を挙げる
const T_TOSS = 0.42; // 抱えた積み木を塔のてっぺんへ置きに放る
const T_LAND = 0.62; // 塔に積み上がる
const T_RUN = 0.62; // 次の部品を抱えて奥へ走り出す
const T_BUMP = 1.55; // 壁の前で突き当たる
const T_TURN = 1.85; // 振り向いて、困って手を挙げる
const T_ASK = 2.0; // 「？」

const StuckScene: React.FC = () => {
  const f = useCurrentFrame();
  const start = { cx: 610, baseY: 1040, height: 420 };
  // 塔へ積む積み木：手の上から、塔のてっぺんへ弧を描いて飛ぶ
  const toss = interpolate(f, [at(T_TOSS - 0.2), at(T_LAND)], [0, 1], clamp);
  const third = f < at(T_LAND) ? 0 : interpolate(f, [at(T_LAND), at(T_LAND + 0.15)], [0.75, 1], clamp);
  const flyFrom = { x: start.cx - 60, y: start.baseY - start.height - 30 };
  const flyTo = { x: TOWER.x, y: TOWER.baseY - TOWER.h * 3 - 8 };
  // 走る：手前から奥の壁へ。遠くなるほど小さくする
  const run = interpolate(f, [at(T_RUN), at(T_BUMP)], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const runPos = { cx: lerp(run, start.cx - 40, WALL_SPOT.cx), baseY: lerp(run, start.baseY, WALL_SPOT.baseY + 6), height: lerp(run, 400, WALL_SPOT.height) };
  // 突き当たって少し跳ね返る
  const back = interpolate(f, [at(T_BUMP), at(T_BUMP + 0.08), at(T_BUMP + 0.25)], [0, -1, 0], clamp);
  const stride = f >= at(T_RUN) && f < at(T_BUMP) ? Math.abs(Math.sin(f * 0.9)) * -14 : 0;
  const phase = f < at(T_RUN) ? "place" : f < at(T_TURN) ? "back" : "ask";
  const headTop = WALL_SPOT.baseY - WALL_SPOT.height;
  const ccNow = phase === "place" ? { cx: start.cx, baseY: start.baseY, height: start.height } : phase === "back" ? runPos : WALL_SPOT;

  return (
    <AbsoluteFill>
      <SiteBackground />
      <Fogs />
      <Tower third={third} />

      {phase === "place" ? (
        <Sprite src="ep/blocked/cc_place.png" cx={start.cx} baseY={start.baseY} height={start.height} squash={false} />
      ) : null}
      {f >= at(T_TOSS - 0.2) && f < at(T_LAND) ? (
        <ToyBlock
          x={lerp(toss, flyFrom.x, flyTo.x)}
          y={lerp(toss, flyFrom.y, flyTo.y) - Math.sin(toss * Math.PI) * 120}
          w={TOWER.w}
          h={TOWER.h}
          {...YELLOW}
        />
      ) : null}
      <Sequence from={at(T_LAND)} durationInFrames={at(0.45)}>
        <CrumpleMarks x={TOWER.x + 10} y={TOWER.baseY - TOWER.h * 3 - 90} />
      </Sequence>

      {phase === "back" ? (
        <Sprite
          src="ep/blocked/cc_run_back.png"
          cx={runPos.cx}
          baseY={runPos.baseY + stride + back * -18}
          height={runPos.height}
          rotate={f >= at(T_BUMP) ? back * 6 : Math.sin(f * 0.9) * 4}
          squash={false}
        />
      ) : null}
      <Sequence from={at(T_RUN)} durationInFrames={at(0.5)}>
        <SpeedLines x={start.cx - 140} y={start.baseY - 250} width={60} height={160} direction={-1} />
      </Sequence>
      {/* 壁に突き当たる：ゴンの線と星 */}
      <Sequence from={at(T_BUMP)} durationInFrames={at(0.5)}>
        <CrumpleMarks x={WALL_SPOT.cx - 40} y={headTop - 70} />
        <BumpStars x={WALL_SPOT.cx} y={headTop + 20} />
      </Sequence>

      {phase === "ask" ? (
        <Sprite src="ep/blocked/cc_confused.png" cx={WALL_SPOT.cx} baseY={WALL_SPOT.baseY} height={WALL_SPOT.height} />
      ) : null}
      <Sequence from={at(T_ASK)}>
        <BigQuestion x={WALL_SPOT.cx + 125} y={headTop + 40} />
        <Sweat x={WALL_SPOT.cx + 70} y={headTop + 40} scale={0.8} />
      </Sequence>

      {/* 名前の札は最前面に。Claude Code が初めて出たときから 1.5秒、頭の上について動く */}
      <Sequence from={at(0.1)} durationInFrames={at(1.5)}>
        <NameTag cx={ccNow.cx} tipY={ccNow.baseY - ccNow.height - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.5)} fontSize={40} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- カンバンの壁のカット（5〜7秒）----
// カンバンを大きく映す。コンティが In Progress のカードを Blocked へ押し、右下で開発者が見上げて気づく
const WALL_KANBAN = { x: 40, y: 70, scale: 1.2 };
const WHALE_H = 200;
const WAVE_ASPECT = 729 / 556;

const MoveScene: React.FC = () => {
  const f = useCurrentFrame();
  const k = WALL_KANBAN;
  const slot = (col: number) => ({ x: k.x + cardSlot(col).x * k.scale, y: k.y + cardSlot(col).y * k.scale });
  const prog = slot(1);
  const blocked = slot(2);
  const T_GRAB = 0.45;
  const T_MOVED = 0.95;
  const T_DEV = 0.8;
  const T_NOTICE = 1.1;
  const move = interpolate(f, [at(T_GRAB), at(T_MOVED)], [0, 1], { ...clamp, easing: ease });
  const card = { x: lerp(move, prog.x, blocked.x), y: prog.y };
  const cardH = CARD_SIZE.h * k.scale;
  // コンティは右向き（裏返し）で、前ヒレの先をカードの左下の角に当てる
  const grabSpot = { cx: card.x + 10 - (WHALE_H * WAVE_ASPECT) / 2, baseY: card.y + cardH - 10 + WHALE_H * 0.4 };
  const swim = interpolate(f, [0, at(T_GRAB)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const whaleCx = f < at(T_GRAB) ? lerp(swim, -120, grabSpot.cx) : grabSpot.cx;
  const whaleBase = (f < at(T_GRAB) ? lerp(swim, 640, grabSpot.baseY) : grabSpot.baseY) + Math.sin(f / 7) * 5;
  const glow = interpolate(f, [at(T_MOVED), at(T_MOVED + 0.12), at(T_MOVED + 0.6)], [0, 1, 0.35], clamp);
  // 開発者：右の外から入ってきて、カンバンを見上げる
  const devIn = interpolate(f, [at(T_DEV - 0.4), at(T_DEV)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const dev = { cx: lerp(devIn, 1300, 845), baseY: 1060, height: 560 };

  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <Kanban x={k.x} y={k.y} scale={k.scale} highlight={2} glow={glow}>
        <IssueCard x={cardSlot(1).x + (card.x - prog.x) / k.scale} y={cardSlot(1).y} pin={f < at(T_GRAB) || f >= at(T_MOVED)} />
        {/* ほかの列にもカードを置き、本物のカンバンらしくする */}
        <IssueCard x={cardSlot(3).x} y={cardSlot(3).y} pin />
        <IssueCard x={cardSlot(4).x} y={cardSlot(4).y} pin />
        <IssueCard x={cardSlot(4).x} y={cardSlot(4).y + 100} pin />
      </Kanban>
      <Sprite src="characters/continuo/wave.png" cx={whaleCx} baseY={whaleBase} height={WHALE_H} flip squash={false} />
      <Sequence durationInFrames={at(T_GRAB)}>
        <SpeedLines x={0} y={400} width={200} height={140} direction={1} />
      </Sequence>
      <Sequence from={at(T_GRAB)} durationInFrames={at(T_MOVED - T_GRAB)}>
        <SpeedLines x={grabSpot.cx - 320} y={grabSpot.baseY - 190} width={170} height={130} direction={1} />
      </Sequence>
      {/* Blocked に入ったカードを目立たせる赤い輪 */}
      <Sequence from={at(T_MOVED)}>
        <BlockedRing x={blocked.x + (CARD_SIZE.w * k.scale) / 2} y={blocked.y + cardH / 2} />
      </Sequence>

      {/* 開発者は顔を歪めないように、弾みを付けない */}
      <Sprite src="ep/blocked/dev_notice.png" cx={dev.cx} baseY={dev.baseY} height={dev.height} squash={false} />
      <Sequence from={at(T_NOTICE)} durationInFrames={at(0.6)}>
        <ConcentrationLines cx={dev.cx - 60} cy={dev.baseY - 420} size={700} />
      </Sequence>
      <Sequence from={at(T_NOTICE)}>
        <Exclamation x={dev.cx - 300} y={dev.baseY - 640} />
      </Sequence>
    </AbsoluteFill>
  );
};

// Blocked のカードのまわりで脈打つ赤い輪
const BlockedRing: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const s = 1 + (Math.sin(f / 4) + 1) * 0.05;
  const o = interpolate(f, [0, 4], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 105,
        top: y - 68,
        width: 210,
        height: 136,
        borderRadius: 24,
        border: `8px solid #E0554A`,
        opacity: o,
        transform: `scale(${s})`,
      }}
    />
  );
};

// ---- 机のカット（7〜10秒）----
// 左上にノートパソコンの画面を大きく浮かべ、右で開発者が打つ。
// 前半は issue のコメント欄に「右だよ」と書いて送り、後半は画面のカンバンでカードを Blocked から Ready へ引きずって戻す
const PANEL = { x: 20, y: 36, w: 700, h: 540 };
const DEV = { cx: 880, baseY: 880, height: 545 };
const T_TYPE0 = 0.2;
const T_TYPE1 = 0.85;
const T_SEND = 1.05;
const T_BOARD = 1.6; // 画面がカンバンに切り替わる
const T_GRAB_CARD = 2.0;
const T_DROP = 2.5;
const COMMENT = "右だよ";

const CommentScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/desk.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <Sprite src="characters/developer/typing.png" cx={DEV.cx} baseY={DEV.baseY} height={DEV.height} squash={false} />
      <Sequence durationInFrames={at(T_TYPE1)}>
        <SpeedLines x={DEV.cx - 290} y={DEV.baseY - 330} width={110} height={80} direction={-1} />
      </Sequence>
      <ScreenPanel />
    </AbsoluteFill>
  );
};

const ScreenPanel: React.FC = () => {
  const f = useCurrentFrame();
  const board = f >= at(T_BOARD);
  const appear = interpolate(f, [0, at(0.15)], [0.85, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.h,
        background: "#FFFDF7",
        border: `7px solid ${theme.color.ink}`,
        borderRadius: 22,
        overflow: "hidden",
        transform: `scale(${appear})`,
        transformOrigin: "30% 100%",
      }}
    >
      {/* 窓の上の帯 */}
      <div style={{ height: 50, background: "#3E4656", display: "flex", alignItems: "center", padding: "0 18px", gap: 10 }}>
        {["#E0554A", "#F2C14E", "#9AA0A6"].map((c) => (
          <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
        ))}
        <div style={{ marginLeft: 16, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 24, color: "#FFFFFF" }}>{board ? "Projects" : "issue #42"}</div>
      </div>
      {board ? <BoardView /> : <IssueView />}
    </div>
  );
};

// issue の画面。カードが Blocked にあることを示す札と、コメント欄
const IssueView: React.FC = () => {
  const f = useCurrentFrame();
  const typed = Math.floor(interpolate(f, [at(T_TYPE0), at(T_TYPE1)], [0, COMMENT.length], clamp));
  const sent = f >= at(T_SEND);
  const press = f >= at(T_SEND) && f < at(T_SEND + 0.12);
  const postPop = interpolate(f, [at(T_SEND), at(T_SEND + 0.2)], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(2.5)) });
  const caret = Math.floor(f / 8) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 0, top: 50, right: 0, bottom: 0, padding: "20px 28px", fontFamily: theme.fontFamily, fontWeight: 800, color: theme.color.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 38 }}>#42</div>
        <div style={{ width: 200, height: 18, background: "#C9C2B6", borderRadius: 9 }} />
        <div style={{ marginLeft: "auto", padding: "4px 18px", background: "#F08A7E", border: `4px solid ${theme.color.ink}`, borderRadius: 999, fontSize: 28 }}>Blocked</div>
      </div>
      {/* これまでのやりとり（灰色の行） */}
      <div style={{ marginTop: 26, display: "flex", gap: 14 }}>
        <Img src={staticFile("characters/continuo/wave.png")} style={{ width: 70, height: 53 }} />
        <div style={{ flex: 1, padding: "14px 18px", border: `4px solid ${theme.color.ink}`, borderRadius: 16, background: "#FFFFFF" }}>
          <div style={{ width: "80%", height: 12, background: "#C9C2B6", borderRadius: 6 }} />
          <div style={{ width: "55%", height: 12, background: "#C9C2B6", borderRadius: 6, marginTop: 12 }} />
        </div>
      </div>
      {/* 送ったコメント */}
      {sent ? (
        <div style={{ marginTop: 20, display: "flex", gap: 14, transform: `scale(${postPop})`, transformOrigin: "0 50%" }}>
          <div style={{ width: 62, height: 62, borderRadius: 31, background: "#2C3E66", border: `4px solid ${theme.color.ink}`, boxSizing: "border-box" }} />
          <div style={{ padding: "10px 26px", border: `5px solid ${theme.color.ink}`, borderRadius: 18, background: "#FFF1C9", fontSize: 54 }}>{COMMENT}</div>
        </div>
      ) : null}
      {/* コメント欄と送るボタン */}
      <div style={{ position: "absolute", left: 28, right: 28, bottom: 26, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ flex: 1, height: 84, border: `5px solid ${theme.color.ink}`, borderRadius: 16, background: "#FFFFFF", display: "flex", alignItems: "center", padding: "0 22px", fontSize: 54, boxSizing: "border-box" }}>
          {sent ? "" : COMMENT.slice(0, typed)}
          {!sent && caret ? <span style={{ width: 5, height: 52, background: theme.color.ink, marginLeft: 4 }} /> : null}
        </div>
        <div
          style={{
            width: 96,
            height: 84,
            borderRadius: 16,
            background: "#3B6FB6",
            border: `5px solid ${theme.color.ink}`,
            boxSizing: "border-box",
            transform: `scale(${press ? 0.88 : 1})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={44} height={44} viewBox="0 0 24 24">
            <path d="M3 12 L21 4 L15 20 L11 13 Z" fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={2} strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// 画面の中のカンバン。開発者のマウスが、カードを Blocked から Ready へ引きずって戻す
const BOARD = { x: 22, y: 130, scale: 0.785 };
const ARROW_Y = 50 + BOARD.y - 60 + 300 * BOARD.scale + 30; // カンバンのすぐ下
const BoardView: React.FC = () => {
  const f = useCurrentFrame();
  const t0 = at(T_BOARD);
  const local = (s: number) => t0 + at(s - T_BOARD);
  const drag = interpolate(f, [local(T_GRAB_CARD), local(T_DROP)], [0, 1], { ...clamp, easing: ease });
  const from = cardSlot(2);
  const to = cardSlot(0);
  const card = { x: lerp(drag, from.x, to.x), y: lerp(drag, from.y, to.y) - Math.sin(drag * Math.PI) * 30 };
  const glow = interpolate(f, [local(T_DROP), local(T_DROP + 0.1), local(T_DROP + 0.5)], [0, 1, 0.3], clamp);
  const dropSquash = interpolate(f, [local(T_DROP), local(T_DROP + 0.06), local(T_DROP + 0.2)], [0, 0.6, 0], clamp);
  // マウスの矢印：右下から来てカードをつかみ、カードと一緒に Ready へ
  const come = interpolate(f, [local(T_BOARD + 0.05), local(T_GRAB_CARD)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const grip = { x: BOARD.x + (card.x + 85) * BOARD.scale, y: 50 + BOARD.y + (card.y + 50) * BOARD.scale };
  const cursor = f < local(T_GRAB_CARD) ? { x: lerp(come, 560, grip.x), y: lerp(come, 460, grip.y) } : grip;
  const pressed = f >= local(T_GRAB_CARD) && f < local(T_DROP);
  const fadeIn = interpolate(f, [t0, t0 + 5], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fadeIn }}>
      <Kanban x={BOARD.x} y={50 + BOARD.y - 60} scale={BOARD.scale} highlight={0} glow={glow}>
        <IssueCard x={card.x} y={card.y} squash={dropSquash} scale={drag > 0 && drag < 1 ? 1.08 : 1} />
        <IssueCard x={cardSlot(3).x} y={cardSlot(3).y} />
        <IssueCard x={cardSlot(4).x} y={cardSlot(4).y} />
        <IssueCard x={cardSlot(4).x} y={cardSlot(4).y + 100} />
      </Kanban>
      {/* ドラッグの向きを示す矢印 */}
      {pressed ? (
        <svg width={PANEL.w} height={PANEL.h} style={{ position: "absolute", left: 0, top: 0 }}>
          <path
            d={`M${BOARD.x + (from.x + 60) * BOARD.scale} ${ARROW_Y} Q ${BOARD.x + ((from.x + to.x) / 2 + 60) * BOARD.scale} ${ARROW_Y + 50} ${BOARD.x + (to.x + 70) * BOARD.scale} ${ARROW_Y}`}
            fill="none"
            stroke="#3B6FB6"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray="4 22"
          />
          <path d={`M${BOARD.x + (to.x + 70) * BOARD.scale - 6} ${ARROW_Y - 28} L${BOARD.x + (to.x + 70) * BOARD.scale - 4} ${ARROW_Y + 4} L${BOARD.x + (to.x + 70) * BOARD.scale + 28} ${ARROW_Y - 4}`} fill="none" stroke="#3B6FB6" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      <Cursor x={cursor.x} y={cursor.y} press={pressed} scale={1.3} />
      <Sequence from={local(T_DROP)} durationInFrames={at(0.45)}>
        <CrumpleMarks x={BOARD.x + to.x * BOARD.scale - 20} y={50 + BOARD.y - 60 + to.y * BOARD.scale - 70} />
      </Sequence>
    </div>
  );
};

// ---- 工事現場に戻る（10〜13秒）----
// コンティが「右だよ」を届けると右の霧が晴れ、Claude Code は右へ走って、その先の家を組み上げる
const T_DELIVER = 0.75; // 吹き出しが Claude Code に届く
const T_CLEAR = 0.95; // 右の霧が晴れ始める
const T_GO = 1.35; // 右へ走り出す
const T_ARRIVE = 1.95; // 空き地の前に着く
const T_B1 = 2.15;
const T_B2 = 2.4;
const T_ROOF = 2.65;
const BUILD_SPOT = { cx: 830, baseY: 552, height: 300 };

const ResumeScene: React.FC = () => {
  const f = useCurrentFrame();
  const headTop = WALL_SPOT.baseY - WALL_SPOT.height;
  // コンティ：左上から吹き出しを持って来る
  const come = interpolate(f, [0, at(0.5)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const whale = { cx: lerp(come, -160, 250), baseY: 300 + Math.sin(f / 7) * 6 };
  // 吹き出し：コンティの前ヒレの先から、Claude Code の頭の上へ
  const fly = interpolate(f, [at(0.5), at(T_DELIVER)], [0, 1], { ...clamp, easing: ease });
  const bubbleFrom = { x: whale.cx + 190, y: whale.baseY - 150 };
  const bubbleTo = { x: WALL_SPOT.cx, y: headTop - 10 };
  const bubbleScale = f < at(T_DELIVER) ? 1 : interpolate(f, [at(T_DELIVER), at(T_DELIVER + 0.2)], [1, 0], clamp);
  const clear = interpolate(f, [at(T_CLEAR), at(T_CLEAR + 0.6)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const go = interpolate(f, [at(T_GO), at(T_ARRIVE)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const phase = f < at(T_GO) ? "ask" : f < at(T_ARRIVE) ? "run" : "build";
  const runCx = lerp(go, WALL_SPOT.cx, BUILD_SPOT.cx);
  const hop = phase === "build" ? Math.abs(Math.sin((f - at(T_ARRIVE)) * 0.35)) * -10 : 0;
  // 空き地の家：2段と屋根が順に落ちてくる
  const dropAt = (t: number) => interpolate(f, [at(t - 0.2), at(t)], [0, 1], clamp);
  // 積み木は、Claude Code が頭の上に持ち上げた手もとから飛んで積み上がる
  const hands = { x: BUILD_SPOT.cx + 20, y: BUILD_SPOT.baseY - BUILD_SPOT.height + 10 };
  const fromHands = (y: number) => ({ dx: hands.x - LOT.x, dy: hands.y - y });

  return (
    <AbsoluteFill>
      <SiteBackground />
      <Tower third={1} />
      {/* 霧の下から見えてくる家。霧より奥に置く */}
      <ToyBlock x={LOT.x} y={LOT.baseY - LOT.h} w={LOT.w} h={LOT.h} {...CREAM} drop={dropAt(T_B1)} from={fromHands(LOT.baseY - LOT.h)} />
      <ToyBlock x={LOT.x} y={LOT.baseY - LOT.h * 2 - 4} w={LOT.w} h={LOT.h} {...YELLOW} drop={dropAt(T_B2)} from={fromHands(LOT.baseY - LOT.h * 2 - 4)} />
      <ToyRoof x={LOT.x - 8} y={LOT.baseY - LOT.h * 2 - 8} w={LOT.w + 16} h={80} drop={dropAt(T_ROOF)} from={fromHands(LOT.baseY - LOT.h * 2 - 88)} />
      <Fogs clearRight={clear} />

      {phase === "ask" ? (
        <Sprite src="ep/blocked/cc_confused.png" cx={WALL_SPOT.cx} baseY={WALL_SPOT.baseY} height={WALL_SPOT.height} squash={false} />
      ) : null}
      {phase === "run" ? (
        <Sprite src="ep/blocked/cc_carry_side.png" cx={runCx} baseY={WALL_SPOT.baseY + Math.abs(Math.sin(f * 0.9)) * -14} height={BUILD_SPOT.height} rotate={Math.sin(f * 0.9) * 3} />
      ) : null}
      {phase === "build" ? (
        <Sprite src="ep/blocked/cc_place.png" cx={BUILD_SPOT.cx} baseY={BUILD_SPOT.baseY + hop} height={BUILD_SPOT.height} />
      ) : null}

      {/* 「？」は届くまで残し、届いた瞬間に「！」へ変わる */}
      {f < at(T_DELIVER) ? <BigQuestionStill x={WALL_SPOT.cx + 125} y={headTop + 40} /> : null}
      <Sequence from={at(T_DELIVER)} durationInFrames={at(T_GO - T_DELIVER)}>
        <Exclamation x={WALL_SPOT.cx + 110} y={headTop - 60} />
        <Sparkle x={WALL_SPOT.cx - 170} y={headTop - 20} />
      </Sequence>
      <Sequence from={at(T_CLEAR)} durationInFrames={at(0.6)}>
        <SpeedLines x={FOG_R.x - 160} y={FOG_R.y - 60} width={240} height={120} direction={1} />
      </Sequence>
      <Sequence from={at(T_GO)} durationInFrames={at(T_ARRIVE - T_GO)}>
        <SpeedLines x={runCx - 260} y={WALL_SPOT.baseY - 200} width={130} height={120} direction={1} />
      </Sequence>
      {[T_B1, T_B2, T_ROOF].map((t) => (
        <Sequence key={t} from={at(t)} durationInFrames={at(0.4)}>
          <CrumpleMarks x={LOT.x + 20} y={LOT.baseY - LOT.h * 2 - 120} />
        </Sequence>
      ))}
      <Sequence from={at(T_ROOF)}>
        <Sparkle x={LOT.x + 40} y={LOT.baseY - LOT.h * 2 - 160} />
      </Sequence>

      <Sprite src="characters/continuo/wave.png" cx={whale.cx} baseY={whale.baseY} height={WHALE_H} flip squash={false} />
      {f >= at(0.2) && f < at(T_DELIVER + 0.2) ? (
        <CommentBubble x={lerp(fly, bubbleFrom.x, bubbleTo.x)} y={lerp(fly, bubbleFrom.y, bubbleTo.y) - Math.sin(fly * Math.PI) * 60} text={COMMENT} scale={bubbleScale} />
      ) : null}
    </AbsoluteFill>
  );
};

// 場面5の頭で、場面2から続けて残っている「？」。出る弾みは付けない
const BigQuestionStill: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <Sequence from={-30}>
    <BigQuestion x={x} y={y} />
  </Sequence>
);

// 効果音。音は scripts/make_sfx.py と scripts/sfx_blocked.py で合成した public/sfx/*.wav。at は動画の頭からの秒
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "blocked_block", at: S("stuck").from + T_LAND, volume: 0.7 }, // 塔に積み木を積む
  { name: "swish", at: S("stuck").from + T_RUN, volume: 0.4 }, // 奥へ走り出す
  { name: "blocked_bonk", at: S("stuck").from + T_BUMP, volume: 0.8 }, // 壁に突き当たる
  { name: "blocked_huh", at: S("stuck").from + T_ASK, volume: 0.5 }, // 「？」
  { name: "swish", at: S("move").from + 0.45, volume: 0.6 }, // コンティがカードを Blocked へ
  { name: "pop", at: S("move").from + 1.1, volume: 0.5 }, // 開発者が気づく
  { name: "typing", at: S("comment").from + T_TYPE0, volume: 0.35 }, // 「右だよ」を打つ
  { name: "enter", at: S("comment").from + T_SEND, volume: 0.7 }, // 送る
  { name: "swish", at: S("comment").from + T_GRAB_CARD, volume: 0.5 }, // カードを Ready へ引きずる
  { name: "splat", at: S("comment").from + T_DROP, volume: 0.6 }, // Ready に戻る
  { name: "sparkle", at: S("resume").from + T_DELIVER, volume: 0.5 }, // ひとことが届く
  { name: "whoosh", at: S("resume").from + T_CLEAR, volume: 0.5 }, // 右の霧が晴れる
  { name: "blocked_block", at: S("resume").from + T_B1, volume: 0.7 },
  { name: "blocked_block", at: S("resume").from + T_B2, volume: 0.7 },
  { name: "blocked_block", at: S("resume").from + T_ROOF, volume: 0.7 },
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const Blocked: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence from={sec(S("stuck").from)} durationInFrames={sec(3)}>
      <StuckScene />
    </Sequence>
    <Sequence from={sec(S("move").from)} durationInFrames={sec(2)}>
      <MoveScene />
    </Sequence>
    <Sequence from={sec(S("comment").from)} durationInFrames={sec(3)}>
      <CommentScene />
    </Sequence>
    <Sequence from={sec(S("resume").from)} durationInFrames={sec(3)}>
      <ResumeScene />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(2)}>
      <TitleCard text={script.title} outFrom={sec(1.7)} fontSize={92} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <EndCard text={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={680} fontSize={96} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
