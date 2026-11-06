import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { ConcentrationLines, CrumpleMarks, Exclamation, Sparkle, SpeedLines, Steam, Sweat } from "../components/Effects";
import { EndCard } from "../components/EndCard";
import { Inset } from "../components/Inset";
import { CARD_SIZE, IssueCard } from "../components/IssueCard";
import { cardSlot, Kanban } from "../components/Kanban";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { WorktreeSign } from "../components/WorktreeSign";
import { sec, theme } from "../theme";
import { script } from "./place_on_ready.script";

// 置くだけの回。場面ごとにカットを割る（机・カンバンの壁・作業台）。
// 部屋を横に振る作りだと、正方形の画面にカンバンが収まらず端で切れるため、場面ごとに構図を決める。
// 座標はすべて 1080×1080 の画面の座標。各場面の中の時刻は、その場面の頭からの秒で書く

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s); // 場面の中の秒をフレームにする
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

// ---- 机のカット（タイトル・カードを放る・コーヒー）----
// 机の上のノートパソコンは左。開発者はその右に座って左を向き、背中側の壁にカンバンがある
const DESK_KANBAN = { x: 440, y: 30, scale: 0.9 };
const DEV = { cx: 610, baseY: 835, height: 545 };
// 書きかけの issue を、ノートパソコンの画面の上に浮かべる
const DRAFT = { x: 150, y: 300 };

const deskSlot = (col: number) => ({
  x: DESK_KANBAN.x + cardSlot(col).x * DESK_KANBAN.scale,
  y: DESK_KANBAN.y + cardSlot(col).y * DESK_KANBAN.scale,
});

const DeskBackground: React.FC = () => (
  <Img src={staticFile("backgrounds/desk.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080 }} />
);

// 机のカットのカンバン。card は貼ってあるカードの列（無ければ空）
const DeskKanban: React.FC<{ card?: number; children?: React.ReactNode; highlight?: number; glow?: number }> = ({ card, children, highlight, glow }) => (
  <Kanban x={DESK_KANBAN.x} y={DESK_KANBAN.y} scale={DESK_KANBAN.scale} highlight={highlight} glow={glow}>
    {card !== undefined ? <IssueCard x={cardSlot(card).x} y={cardSlot(card).y} pin /> : null}
    {children}
  </Kanban>
);

// 場面1（タイトルの後ろ）：机のカットを引きで、ぼかして映す
const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <DeskBackground />
    <DeskKanban />
  </AbsoluteFill>
);

// 場面2（2〜5秒）：ノートパソコンで issue を書き、振り向かずに Enter を押す。
// 画面から issue が紙飛行機になって飛び出し、背中側のカンバンの Ready で開いてカードになる
const T_WRITE_END = 1.2; // 書き終わる
const T_ENTER = 1.45; // Enter を押す
const T_FOLD = 1.6; // 画面の上の issue が紙飛行機に折れる
const T_HIT = 2.5; // Ready に届いて開き、貼り付く
const T_SIP = 1.85; // 押したあとは、振り向かずにコーヒーを飲む
const PLANE_FROM = { x: DRAFT.x + 95, y: DRAFT.y + 40 }; // 書きかけの issue の真ん中

const ThrowScene: React.FC = () => {
  const f = useCurrentFrame();
  const target = deskSlot(0);
  // 書きかけのカード：画面の上で行が伸び、Enter を押すと縮んで紙飛行機に変わる
  const written = interpolate(f, [at(0.15), at(T_WRITE_END)], [0, 1], clamp);
  const fold = interpolate(f, [at(T_ENTER), at(T_FOLD)], [0, 1], { ...clamp, easing: ease });
  // 紙飛行機：開発者の頭の上を越える弧を描いて Ready 列へ。後ろに点線の軌跡を残す
  const t = interpolate(f, [at(T_FOLD), at(T_HIT)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const planeAt = (u: number) => ({
    x: lerp(u, PLANE_FROM.x, target.x + 50),
    y: lerp(u, PLANE_FROM.y, target.y + 30) - Math.sin(u * Math.PI) * 120,
  });
  const plane = planeAt(t);
  const ahead = planeAt(Math.min(1, t + 0.02));
  const heading = (Math.atan2(ahead.y - plane.y, ahead.x - plane.x) * 180) / Math.PI;
  // 届いた瞬間：開いて横に潰れてから戻る
  const squash = interpolate(f, [at(T_HIT), at(T_HIT + 0.08), at(T_HIT + 0.25)], [1, 0.6, 0], clamp);
  const readyGlow = interpolate(f, [at(T_HIT), at(T_HIT + 0.1), at(T_HIT + 0.4)], [0, 1, 0], clamp);
  const stuck = f >= at(T_HIT);

  return (
    <AbsoluteFill>
      <DeskBackground />
      <DeskKanban highlight={0} glow={readyGlow}>
        {stuck ? <IssueCard x={cardSlot(0).x} y={cardSlot(0).y} squash={squash} pin={squash < 0.3} /> : null}
      </DeskKanban>

      {/* 開発者：打つ → Enter → 振り向かずにコーヒー */}
      {f < at(T_SIP) ? <Sprite src="characters/developer/typing.png" cx={DEV.cx} baseY={DEV.baseY} height={DEV.height} squash={false} /> : null}
      {f >= at(T_SIP) ? (
        <Sprite src="characters/developer/sip_coffee.png" cx={DEV.cx + 20} baseY={DEV.baseY + 30} height={DEV.height + 20} squash={false} />
      ) : null}
      {/* Enter を「ターン」と押した印 */}
      <Sequence from={at(T_ENTER)} durationInFrames={at(0.35)}>
        <EnterKey x={DEV.cx - 300} y={DEV.baseY - 330} />
      </Sequence>

      {/* 書きかけの issue。ノートパソコンの上に浮かべ、書いている最中だと分かるように大きめに出す */}
      {f < at(T_FOLD) ? (
        <IssueCard x={DRAFT.x + fold * 60} y={DRAFT.y + fold * 30} scale={lerp(fold, 1.5, 0.4)} written={written} />
      ) : null}
      <Sequence from={at(0.1)} durationInFrames={at(T_WRITE_END - 0.1)}>
        <SpeedLines x={DRAFT.x - 40} y={DRAFT.y + 140} width={150} height={80} direction={-1} />
      </Sequence>

      {/* 紙飛行機と軌跡 */}
      {f >= at(T_FOLD) && f < at(T_HIT) ? (
        <>
          <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1080}>
            {Array.from({ length: 10 }, (_, i) => {
              const p = planeAt((t * i) / 10);
              return <circle key={i} cx={p.x} cy={p.y} r={6} fill={theme.color.ink} opacity={0.45} />;
            })}
          </svg>
          <PaperPlane x={plane.x} y={plane.y} rotate={heading} />
        </>
      ) : null}
      {/* 届いた瞬間の「ぺたっ」 */}
      <Sequence from={at(T_HIT)} durationInFrames={at(0.45)}>
        <CrumpleMarks x={target.x - 10} y={target.y - 60} />
        <ImpactBurst x={target.x + (CARD_SIZE.w * DESK_KANBAN.scale) / 2} y={target.y + (CARD_SIZE.h * DESK_KANBAN.scale) / 2} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 紙飛行機。(x, y) が機体の真ん中で、rotate は進む向き（右向きが 0 度）
const PaperPlane: React.FC<{ x: number; y: number; rotate: number }> = ({ x, y, rotate }) => (
  <svg width={180} height={110} viewBox="0 0 130 80" style={{ position: "absolute", left: x - 90, top: y - 55, transform: `rotate(${rotate}deg)` }}>
    <path d="M125 40 L5 8 L35 40 Z" fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M125 40 L35 40 L5 72 Z" fill="#E8E1D3" stroke={theme.color.ink} strokeWidth={5} strokeLinejoin="round" />
    <path d="M125 40 L35 40" stroke={theme.color.ink} strokeWidth={4} />
  </svg>
);

// Enter キーを押した印。キーの形と、押した勢いの短い線
const EnterKey: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const press = interpolate(f, [0, 3, 8], [1.15, 0.92, 1], clamp);
  const o = interpolate(f, [0, 2, 10], [0, 1, 0], clamp);
  return (
    <svg width={170} height={120} style={{ position: "absolute", left: x, top: y, opacity: o, transform: `scale(${press})` }}>
      <rect x={40} y={35} width={90} height={55} rx={12} fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={6} />
      <path d="M108 50 V68 H68 M78 58 L68 68 L78 78" fill="none" stroke={theme.color.ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={20 + i * 40} y1={20} x2={30 + i * 40} y2={5} stroke={theme.color.highlight} strokeWidth={7} strokeLinecap="round" />
      ))}
    </svg>
  );
};

// 貼り付いたときに、カードのまわりへ放射状に出る短い線
const ImpactBurst: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [0, 6], [0.6, 1.2], clamp);
  const o = interpolate(f, [0, 2, 12], [0, 1, 0], clamp);
  return (
    <svg style={{ position: "absolute", left: x - 150, top: y - 150, opacity: o }} width={300} height={300}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r1 = 80 * grow;
        const r2 = 125 * grow;
        return (
          <line key={i} x1={150 + Math.cos(a) * r1} y1={150 + Math.sin(a) * r1} x2={150 + Math.cos(a) * r2} y2={150 + Math.sin(a) * r2} stroke={theme.color.highlight} strokeWidth={9} strokeLinecap="round" />
        );
      })}
    </svg>
  );
};

// ---- カンバンの壁のカット（5〜8秒）----
// カンバンを大きく映し、左下の隅のクッションでコンティが眠っている
const WALL_KANBAN = { x: 320, y: 70, scale: 1.1 };
const NAP = { cx: 175, baseY: 770 }; // クッションの上
const WHALE_H = 215;
const WAVE_ASPECT = 729 / 556; // wave.png の幅÷高さ

const PickScene: React.FC = () => {
  const f = useCurrentFrame();
  const k = WALL_KANBAN;
  const slot = (col: number) => ({ x: k.x + cardSlot(col).x * k.scale, y: k.y + cardSlot(col).y * k.scale });
  const ready = slot(0);
  const prog = slot(1);
  // 0.5秒：カードの「ぺた」が聞こえる。0.8秒：目を開けて跳ねる
  const T_WAKE = 0.8;
  const T_SWIM = 1.5;
  const T_GRAB = 1.95;
  const T_MOVED = 2.5;
  const leap = interpolate(f, [at(T_WAKE), at(T_WAKE + 0.35), at(T_SWIM)], [0, 1, 0.85], { ...clamp, easing: Easing.out(Easing.quad) });
  const move = interpolate(f, [at(T_GRAB), at(T_MOVED)], [0, 1], { ...clamp, easing: ease });
  const card = { x: lerp(move, ready.x, prog.x), y: ready.y };
  // コンティはカードの左下に浮かび、右向き（裏返し）で前ヒレの先をカードの左下の角に当てる。
  // wave.png を裏返すと、前ヒレの先は絵の右端、下から 4割の高さにある
  const cardH = CARD_SIZE.h * k.scale;
  const grabSpot = { cx: card.x + 10 - (WHALE_H * WAVE_ASPECT) / 2, baseY: card.y + cardH - 10 + WHALE_H * 0.4 };
  const swim = interpolate(f, [at(T_SWIM), at(T_GRAB)], [0, 1], { ...clamp, easing: ease });
  const whaleCx = f < at(T_GRAB) ? lerp(swim, NAP.cx + 20, grabSpot.cx) : grabSpot.cx;
  const whaleBase = (f < at(T_GRAB) ? lerp(swim, 560, grabSpot.baseY) : grabSpot.baseY) + Math.sin(f / 7) * 5;
  const glow = interpolate(f, [at(T_MOVED), at(T_MOVED + 0.12), at(T_MOVED + 0.5)], [0, 1, 0], clamp);

  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/corner.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <Kanban x={k.x} y={k.y} scale={k.scale} highlight={1} glow={glow}>
        <IssueCard x={cardSlot(0).x + (card.x - ready.x) / k.scale} y={cardSlot(0).y} pin={f < at(T_GRAB) || f >= at(T_MOVED)} />
      </Kanban>
      {/* 「ぺた」の音を表す線 */}
      <Sequence from={at(0.3)} durationInFrames={at(0.5)}>
        <CrumpleMarks x={ready.x + 20} y={ready.y - 70} />
      </Sequence>

      {f < at(T_WAKE) ? <Sprite src="characters/continuo/sleep.png" cx={NAP.cx} baseY={NAP.baseY + Math.sin(f / 10) * 4} height={190} squash={false} /> : null}
      {f >= at(T_WAKE) && f < at(T_SWIM) ? (
        <Sprite src="characters/continuo/leap.png" cx={NAP.cx + 20} baseY={lerp(leap, NAP.baseY, 560)} height={360} />
      ) : null}
      {f >= at(T_SWIM) ? <Sprite src="characters/continuo/wave.png" cx={whaleCx} baseY={whaleBase} height={WHALE_H} flip squash={false} /> : null}

      <Sequence from={at(T_WAKE)} durationInFrames={at(0.6)}>
        <ConcentrationLines cx={NAP.cx + 20} cy={600} size={900} />
        <Exclamation x={NAP.cx + 140} y={330} />
      </Sequence>
      <Sequence from={at(T_SWIM)} durationInFrames={at(0.45)}>
        <SpeedLines x={0} y={380} width={200} height={140} direction={1} />
      </Sequence>
      <Sequence from={at(T_GRAB)} durationInFrames={at(T_MOVED - T_GRAB)}>
        <SpeedLines x={grabSpot.cx - 330} y={grabSpot.baseY - 200} width={180} height={140} direction={1} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- 作業台のカット（8〜11秒）----
// 作業台を手前に置き、その奥に Claude Code が立つ。コンティは左から来てカードを渡す
const BENCH = { x: 210, y: 560, width: 720 };
const CC = { cx: 735, height: 500 };
const CC_BASE_UP = 800; // 作業台の後ろから上半身が出る高さ
const SIGN = { x: 395, y: 745 };
const SIGN_SCALE = 1.5;

const StartScene: React.FC = () => {
  const f = useCurrentFrame();
  const T_SIGN = 0.35;
  const T_CC = 0.6;
  const T_PASS = 1.15;
  const T_GOT = 1.55;
  const T_INTO_SIGN = 1.7;
  const T_FIST = 1.85;
  const T_WORK = 2.45;
  // コンティ：左の外からカードを持って浮かんで来る
  const comeIn = interpolate(f, [0, at(0.4)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const whale = { cx: lerp(comeIn, -150, 250), baseY: 560 + Math.sin(f / 7) * 6 };
  const fin = { x: whale.cx + 105, y: whale.baseY - 150 };
  // Claude Code：作業台の後ろから跳ねて出る
  const rise = interpolate(f, [at(T_CC), at(T_CC + 0.25)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const ccBase = lerp(rise, CC_BASE_UP + CC.height, CC_BASE_UP);
  const hop = interpolate(f, [at(T_FIST), at(T_FIST + 0.12), at(T_FIST + 0.3)], [0, -45, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const working = f >= at(T_WORK);
  const shake = working ? Math.sin(f * 1.7) * 5 : 0;
  // カード：ヒレの先 → Claude Code の手 → 看板の札へ吸い込まれる
  const pass = interpolate(f, [at(T_PASS), at(T_GOT)], [0, 1], { ...clamp, easing: ease });
  const intoSign = interpolate(f, [at(T_INTO_SIGN), at(T_INTO_SIGN + 0.3)], [0, 1], { ...clamp, easing: ease });
  const ccHands = { x: CC.cx - 200, y: CC_BASE_UP - 230 };
  const signTag = { x: SIGN.x + 52 * SIGN_SCALE, y: SIGN.y + 66 * SIGN_SCALE };
  const cardPos = {
    x: lerp(intoSign, lerp(pass, fin.x, ccHands.x), signTag.x),
    y: lerp(intoSign, lerp(pass, fin.y, ccHands.y), signTag.y) - Math.sin(intoSign * Math.PI) * 90,
  };
  const signDrop = interpolate(f, [at(T_SIGN), at(T_SIGN + 0.2)], [-300, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const ccSrc = f < at(T_FIST) ? "receive" : f < at(T_WORK) ? "fist" : "work";

  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />

      {/* Claude Code は作業台の奥 */}
      {f >= at(T_CC) ? (
        <Sprite
          src={`characters/claude_code/${ccSrc}.png`}
          cx={CC.cx + shake}
          baseY={ccBase + hop + (working ? Math.abs(Math.sin(f * 0.9)) * -6 : 0)}
          height={CC.height}
          rotate={working ? shake / 3 : 0}
          squash={ccSrc !== "work"}
        />
      ) : null}
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: BENCH.x, top: BENCH.y, width: BENCH.width }} />

      {/* 看板は作業台の前の板に、上から落ちて掛かる */}
      {f >= at(T_SIGN) ? (
        <div style={{ position: "absolute", left: SIGN.x, top: SIGN.y + signDrop, transform: `scale(${SIGN_SCALE})`, transformOrigin: "0 0" }}>
          <WorktreeSign x={0} y={0} />
        </div>
      ) : null}
      <Sequence from={at(T_SIGN + 0.15)} durationInFrames={at(0.6)}>
        <Sparkle x={SIGN.x - 60} y={SIGN.y - 50} />
      </Sequence>

      {/* コンティ（右向き） */}
      <Sprite src="characters/continuo/wave.png" cx={whale.cx} baseY={whale.baseY} height={WHALE_H} flip squash={false} />
      <Sequence durationInFrames={at(0.4)}>
        <SpeedLines x={0} y={380} width={220} height={140} direction={1} />
      </Sequence>

      {/* 渡すカード */}
      {f < at(T_INTO_SIGN + 0.3) ? (
        <div style={{ opacity: interpolate(intoSign, [0.8, 1], [1, 0], clamp) }}>
          <IssueCard x={cardPos.x} y={cardPos.y} scale={lerp(intoSign, 1, 0.35)} />
        </div>
      ) : null}

      {/* 気合 */}
      <Sequence from={at(T_FIST)} durationInFrames={at(0.6)}>
        <Sparkle x={CC.cx + 170} y={CC_BASE_UP - CC.height - 10} />
        <Sparkle x={CC.cx - 260} y={CC_BASE_UP - CC.height + 60} />
        <Exclamation x={CC.cx + 200} y={CC_BASE_UP - CC.height + 70} />
      </Sequence>
      {/* 作る */}
      <Sequence from={at(T_WORK)}>
        <Sweat x={CC.cx + 150} y={CC_BASE_UP - CC.height + 80} scale={0.9} />
        <SpeedLines x={CC.cx - 330} y={CC_BASE_UP - 330} width={110} height={110} direction={-1} />
        <SpeedLines x={CC.cx + 230} y={CC_BASE_UP - 330} width={110} height={110} direction={1} />
      </Sequence>

      {/* 名前の札は最前面に。Claude Code が初めて出たときから 1.5秒 */}
      <Sequence from={at(T_CC + 0.1)} durationInFrames={at(1.5)}>
        <NameTag cx={CC.cx} tipY={CC_BASE_UP - CC.height - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.5)} fontSize={40} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- 机のカットに戻る（11〜13秒）----
const CoffeeScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <DeskBackground />
      <DeskKanban card={1} />
      <Sprite src="characters/developer/sip_coffee.png" cx={DEV.cx + 20} baseY={DEV.baseY + 30} height={DEV.height + 20} squash={false} />
      <Steam x={DEV.cx - 150} y={DEV.baseY - 560} />
      {/* 働く Claude Code と、横でヒレを振るコンティの小窓 */}
      <Sequence from={at(0.15)}>
        <Inset x={20} y={20} width={405} height={330}>
          <InsetWork />
        </Inset>
      </Sequence>
    </AbsoluteFill>
  );
};

const InsetWork: React.FC = () => {
  const f = useCurrentFrame();
  const shake = Math.sin(f * 1.7) * 5;
  const fin = Math.sin(f / 3) * 8;
  return (
    <>
      <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", left: -140, top: -260, width: 680 }} />
      <Sprite src="characters/claude_code/work.png" cx={262 + shake} baseY={292} height={235} squash={false} rotate={shake / 3} />
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: 70, top: 200, width: 330 }} />
      <Sweat x={335} y={70} scale={0.7} />
      <SpeedLines x={135} y={110} width={60} height={60} direction={-1} />
      <Sprite src="characters/continuo/wave.png" cx={88} baseY={190 + Math.sin(f / 7) * 5} height={115} squash={false} flip rotate={fin} />
    </>
  );
};

// 効果音。音は scripts/make_sfx.py で合成した public/sfx/*.wav。at は動画の頭からの秒で、各場面の動きの時刻に合わせる。
// 無音で見ても意味が通る作りは変えず、音を出して見る人へのおまけとして鳴らす
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "typing", at: S("throw").from + 0.15, volume: 0.35 }, // issue を書く
  { name: "enter", at: S("throw").from + T_ENTER, volume: 0.7 }, // Enter
  { name: "whoosh", at: S("throw").from + T_FOLD, volume: 0.5 }, // 紙飛行機が飛ぶ
  { name: "splat", at: S("throw").from + T_HIT, volume: 0.8 }, // Ready に貼り付く
  { name: "spout", at: S("pick").from + 0.8, volume: 0.6 }, // コンティが跳ね起きて潮を吹く
  { name: "swish", at: S("pick").from + 1.95, volume: 0.6 }, // カードを In Progress へ
  { name: "pop", at: S("start").from + 0.35, volume: 0.4 }, // worktree の看板が立つ
  { name: "sparkle", at: S("start").from + 1.85, volume: 0.5 }, // Claude Code が拳を握る
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const PlaceOnReady: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    <Sequence from={sec(S("throw").from)} durationInFrames={sec(3)}>
      <ThrowScene />
    </Sequence>
    <Sequence from={sec(S("pick").from)} durationInFrames={sec(3)}>
      <PickScene />
    </Sequence>
    <Sequence from={sec(S("start").from)} durationInFrames={sec(3)}>
      <StartScene />
    </Sequence>
    <Sequence from={sec(S("coffee").from)} durationInFrames={sec(2)}>
      <CoffeeScene />
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
      <EndCard text={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={680} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
