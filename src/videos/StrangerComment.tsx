import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { sec, theme } from "../theme";
import { Comment, COMMENTS, Panel, PANEL, rowTop } from "./stranger_comment/Comments";
import { BOX, BoxBack, BoxFront, RuleSheet, SmallSheet } from "./stranger_comment/Props";
import { EndCard2, TitleCard2 } from "./stranger_comment/Titles";
import { script } from "./stranger_comment.script";

// 他人のコメントの回。issue のコメント欄に3つのコメントが並び、Claude Code が立場の札を見て
// チームの2つを「指示」の箱へ、知らない人の1つを「報告として読む」の箱へしまう。
// コメントの文言と札は絵に描かせず、すべて Remotion の字で描く。
// 座標はすべて 1080×1080 の画面の座標。各場面の中の時刻は、その場面の頭からの秒で書く

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s);
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;

// コメント欄の置き場所。場面2では画面いっぱい、場面3からは右上に縮める
const BIG = { x: 90, y: 100, scale: 1 };
const SMALL = { x: 515, y: 28, scale: 0.6 };
// コメントの吹き出しの真ん中（画面の座標）
const rowCenter = (p: { x: number; y: number; scale: number }, i: number) => ({
  x: p.x + (PANEL.pad + (PANEL.w - PANEL.pad * 2) / 2) * p.scale,
  y: p.y + (rowTop(i) + PANEL.rowH / 2) * p.scale,
});

// ---- 場面1・2：コメント欄（0〜6秒）----
// 3つのコメントが上から続けて落ちてきて、コメント欄の行に収まる。札は最初から付いている
const DROP_AT = [0.3, 1.2, 2.1];

const DeskBackground: React.FC = () => (
  <Img src={staticFile("backgrounds/desk.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1080 }} />
);

const FallingComment: React.FC<{ i: number; start: number }> = ({ i, start }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fall = spring({ frame: f - at(start), fps, config: { damping: 11, stiffness: 170 } });
  if (f < at(start)) return null;
  const dy = interpolate(fall, [0, 1], [-(rowTop(i) + 400), 0]);
  const tilt = interpolate(fall, [0, 1], [i % 2 ? 9 : -9, 0]);
  return (
    <div style={{ position: "absolute", left: PANEL.pad, top: rowTop(i) + dy, transform: `rotate(${tilt}deg)` }}>
      <Comment data={COMMENTS[i]} />
    </div>
  );
};

const CommentsScene: React.FC<{ empty?: boolean }> = ({ empty }) => {
  return (
    <AbsoluteFill>
      <DeskBackground />
      <AbsoluteFill style={{ background: "rgba(42,36,32,0.25)" }} />
      <Panel {...BIG}>
        {/* まだ書かれていない行は、点線の枠だけ見せる */}
        {COMMENTS.map((_, i) => (
          <div
            key={i}
            style={{ position: "absolute", left: PANEL.pad, top: rowTop(i), width: PANEL.w - PANEL.pad * 2, height: PANEL.rowH, border: "5px dashed #CBBFAE", borderRadius: 20, boxSizing: "border-box" }}
          />
        ))}
        {empty ? null : COMMENTS.map((_, i) => <FallingComment key={i} i={i} start={DROP_AT[i]} />)}
      </Panel>
      {empty
        ? null
        : DROP_AT.map((t, i) => (
            <Sequence key={i} from={at(t + 0.25)} durationInFrames={at(0.4)}>
              <SpeedLines x={BIG.x + 40} y={BIG.y + rowTop(i) - 20} width={60} height={PANEL.rowH} direction={-1} />
            </Sequence>
          ))}
    </AbsoluteFill>
  );
};

// ---- 場面3・4：作業部屋（6〜13秒）----
const CC = { cx: 300, baseY: 905, height: 430 };
const WHALE = { cx: 150, baseY: 470, h: 150 };
const BOX_RULE = { x: 540, y: 628 };
const BOX_REPORT = { x: 800, y: 628 };
const RULE_SHEET = { x: 30, y: 36, scale: 0.95 };
const CC_HANDS = { x: CC.cx + 40, y: CC.baseY - 150 }; // hold_sheet の紙のあたり
// 知らない人のコメントを止めて見せる場所。「報告として読む」の箱の真上で、Claude Code の顔にも箱にも重ねない
const HOVER = { x: 860, y: 560 };
const CC_EYE = { x: CC.cx + 115, y: CC.baseY - 330 }; // 視線の点線は頭の右上から出す（顔に線を重ねない）

// 場面3の中の秒
const T_PANEL = 0.45; // コメント欄が右上に縮み終わる
const T_CC = 0.15; // Claude Code が下から出る
const T_PASS = 0.7; // 指示書を渡し始める
const T_GOT = 1.0; // 受け取る
const T_READ = [2.0, 2.35, 2.7]; // 1つずつコメントを読み、札を見る
const T_SORT = [2.95, 3.4]; // チームの2つを「指示」の箱へ
const SORT_DUR = 0.5;
// 場面4の中の秒（場面3から続けて数える。場面3は4秒）
const R0 = 4;
const T_GRAB = R0 + 0.15; // 知らない人のコメントを手に取る
const T_HELD = R0 + 0.6; // 箱の上で止まる
const T_DROP = R0 + 0.9; // 「報告として読む」箱へ
const T_IN = R0 + 1.4;
const T_SHRUG = R0 + 1.5;

// コメントを写した紙。from から to へ、arc だけ上に膨らむ弧を描いて飛び、大きさを s0 から s1 へ変える
const Slip: React.FC<{ i: number; from: { x: number; y: number }; to: { x: number; y: number }; t: number; s0: number; s1: number; arc?: number }> = ({ i, from, to, t, s0, s1, arc = 40 }) => {
  const x = lerp(t, from.x, to.x);
  const y = lerp(t, from.y, to.y) - Math.sin(t * Math.PI) * arc;
  const s = lerp(t, s0, s1);
  const w = PANEL.w - PANEL.pad * 2;
  return (
    <div style={{ position: "absolute", left: x - (w * s) / 2, top: y - (PANEL.rowH * s) / 2, transform: `scale(${s}) rotate(${Math.sin(t * Math.PI) * -10}deg)`, transformOrigin: "0 0" }}>
      <Comment data={COMMENTS[i]} />
    </div>
  );
};

const boxMouth = (b: { x: number; y: number }) => ({ x: b.x + BOX.w / 2, y: b.y + BOX.lip + 30 });

const RoomScene: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sh = interpolate(f, [0, at(T_PANEL)], [0, 1], { ...clamp, easing: ease });
  const panel = { x: lerp(sh, BIG.x, SMALL.x), y: lerp(sh, BIG.y, SMALL.y), scale: lerp(sh, BIG.scale, SMALL.scale) };

  // コンティ：左の外から指示書を持って来て、渡したあとはそこに浮かんで見守る
  const comeIn = interpolate(f, [0, at(0.5)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const whale = { cx: lerp(comeIn, -150, WHALE.cx), baseY: WHALE.baseY + Math.sin(f / 7) * 5 };
  const fin = { x: whale.cx + 95, y: whale.baseY - 55 };
  const pass = interpolate(f, [at(T_PASS), at(T_GOT)], [0, 1], { ...clamp, easing: ease });

  // Claude Code：下から跳ねて出る。受け取ってから指示書を持って読む
  const rise = interpolate(f, [at(T_CC), at(T_CC + 0.3)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const ccBase = lerp(rise, CC.baseY + CC.height, CC.baseY);
  const ccSrc = f < at(T_GOT) ? "characters/claude_code/receive.png" : f < at(R0) ? "ep/stranger_comment/hold_sheet.png" : f < at(T_SHRUG) ? "characters/claude_code/receive.png" : "ep/stranger_comment/shrug.png";
  const ccFlip = f >= at(R0) && f < at(T_SHRUG);
  const shrugBob = f >= at(T_SHRUG) ? interpolate(f, [at(T_SHRUG), at(T_SHRUG + 0.15), at(T_SHRUG + 0.35)], [0, -18, 0], clamp) : 0;

  // 箱は、コメント欄が縮み終わってから床に置く（縮む途中の大きな欄と重ねない）
  const boxPop = spring({ frame: f - at(T_PANEL - 0.05), fps, config: { damping: 24, stiffness: 240 } }); // 弾みすぎると字が画面の端から出る
  const sheetPop = spring({ frame: f - at(T_GOT), fps, config: { damping: 11, stiffness: 200 } });

  // 読む：見ている行が光る。札の付いた行は札も膨らむ
  const readGlow = (i: number) => interpolate(f, [at(T_READ[i]), at(T_READ[i] + 0.1), at(T_READ[i] + 0.45)], [0, 1, 0], clamp);
  const sortT = (k: number) => interpolate(f, [at(T_SORT[k]), at(T_SORT[k] + SORT_DUR)], [0, 1], { ...clamp, easing: ease });
  const ruleGlow = Math.max(...T_SORT.map((t) => interpolate(f, [at(t + SORT_DUR), at(t + SORT_DUR + 0.1), at(t + SORT_DUR + 0.45)], [0, 1, 0], clamp)));
  const reportGlow = interpolate(f, [at(T_IN), at(T_IN + 0.1), at(T_IN + 0.5)], [0, 1, 0], clamp);
  const grab = interpolate(f, [at(T_GRAB), at(T_HELD)], [0, 1], { ...clamp, easing: ease });
  const drop = interpolate(f, [at(T_DROP), at(T_IN)], [0, 1], { ...clamp, easing: ease });
  const reading = f >= at(T_READ[0] - 0.1) && f < at(T_READ[2] + 0.45);
  const lookAt = reading ? rowCenter(SMALL, f < at(T_READ[1]) ? 0 : f < at(T_READ[2]) ? 1 : 2) : null;

  return (
    <AbsoluteFill>
      <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", width: 1080, height: 1080 }} />
      <Panel {...panel}>
        {COMMENTS.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: PANEL.pad, top: rowTop(i) }}>
            <Comment data={c} rowGlow={readGlow(i)} badgeGlow={c.role ? readGlow(i) : 0} />
          </div>
        ))}
      </Panel>

      <div style={{ position: "absolute", inset: 0, transform: `scale(${boxPop})`, transformOrigin: "790px 750px" }}>
        <BoxBack x={BOX_RULE.x} y={BOX_RULE.y} />
        <BoxBack x={BOX_REPORT.x} y={BOX_REPORT.y} />
      </div>

      {f >= at(T_CC) ? <Sprite src={ccSrc} cx={CC.cx} baseY={ccBase + shrugBob} height={CC.height} flip={ccFlip} squash={f >= at(T_GOT)} /> : null}
      <Sprite src="characters/continuo/wave.png" cx={whale.cx} baseY={whale.baseY} height={WHALE.h} flip squash={false} />
      <Sequence durationInFrames={at(0.5)}>
        <SpeedLines x={0} y={WHALE.baseY - 140} width={150} height={120} direction={1} />
      </Sequence>

      {/* 渡す指示書（小さく畳んだ紙） */}
      {f < at(T_GOT) ? <SmallSheet x={lerp(pass, fin.x, CC_HANDS.x)} y={lerp(pass, fin.y, CC_HANDS.y) - Math.sin(pass * Math.PI) * 20} rotate={lerp(pass, -10, 0)} /> : null}

      {/* 読んでいる視線。目から、いま読んでいるコメントへ点線 */}
      {lookAt ? (
        <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1080}>
          <line x1={CC_EYE.x} y1={CC_EYE.y} x2={lookAt.x - 150} y2={lookAt.y + 10} stroke={theme.color.highlight} strokeWidth={9} strokeDasharray="4 22" strokeLinecap="round" />
        </svg>
      ) : null}

      {/* チームの2つを「指示」の箱へ */}
      {T_SORT.map((t, k) =>
        f >= at(t) && f < at(t + SORT_DUR) ? <Slip key={k} i={k} from={rowCenter(SMALL, k)} to={boxMouth(BOX_RULE)} t={sortT(k)} s0={SMALL.scale} s1={0.22} /> : null,
      )}
      {/* 知らない人の1つは、箱の上でいったん止めてから「報告として読む」の箱へ。Claude Code は手で箱を指す */}
      {f >= at(T_GRAB) && f < at(T_DROP) ? <Slip i={2} from={rowCenter(SMALL, 2)} to={HOVER} t={grab} s0={SMALL.scale} s1={0.4} arc={20} /> : null}
      {f >= at(T_DROP) && f < at(T_IN) ? <Slip i={2} from={HOVER} to={boxMouth(BOX_REPORT)} t={drop} s0={0.4} s1={0.22} arc={30} /> : null}

      <div style={{ position: "absolute", inset: 0, transform: `scale(${boxPop})`, transformOrigin: "790px 750px" }}>
        <BoxFront x={BOX_RULE.x} y={BOX_RULE.y} mark="check" label="指示" glow={ruleGlow} />
        <BoxFront x={BOX_REPORT.x} y={BOX_REPORT.y} mark="eye" label="報告として読む" glow={reportGlow} />
      </div>

      {/* 指示書の中身。受け取った瞬間に左上へ大きく開き、最後まで残す */}
      {f >= at(T_GOT) ? (
        <div style={{ position: "absolute", inset: 0, transform: `scale(${sheetPop})`, transformOrigin: `${RULE_SHEET.x + 200}px ${RULE_SHEET.y + 120}px` }}>
          <RuleSheet {...RULE_SHEET} />
        </div>
      ) : null}
      <Sequence from={at(T_GOT)} durationInFrames={at(0.6)}>
        <Sparkle x={RULE_SHEET.x + 380} y={RULE_SHEET.y - 10} />
      </Sequence>
      {T_SORT.map((t, k) => (
        <Sequence key={k} from={at(t + SORT_DUR)} durationInFrames={at(0.6)}>
          <Sparkle x={BOX_RULE.x + 150} y={BOX_RULE.y - 40} />
        </Sequence>
      ))}

      {/* 肩をすくめる */}
      <Sequence from={at(T_SHRUG + 0.1)}>
        <Sweat x={CC.cx + 130} y={CC.baseY - CC.height + 40} scale={0.8} />
      </Sequence>

      {/* 名前の札は最前面に。Claude Code が初めて出たときから 1.5秒。左のコンティが指示書を渡す手もとを隠さないよう、頭の右寄りに立てる */}
      <Sequence from={at(T_CC + 0.15)} durationInFrames={at(1.5)}>
        <NameTag cx={CC.cx + 80} tipY={CC.baseY - CC.height - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.5)} fontSize={40} />
      </Sequence>
    </AbsoluteFill>
  );
};

// 効果音。at は動画の頭からの秒で、各場面の動きの時刻に合わせる
const C0 = S("comments").from;
const R = S("rule").from;
const SFX: { name: string; at: number; volume: number }[] = [
  ...DROP_AT.map((t) => ({ name: "pop", at: C0 + t + 0.2, volume: 0.55 })), // コメントが落ちて収まる
  { name: "whoosh", at: R, volume: 0.45 }, // コメント欄が縮み、コンティが来る
  { name: "sparkle", at: R + T_GOT, volume: 0.45 }, // 指示書が開く
  { name: "swish", at: R + T_SORT[0], volume: 0.55 }, // 1つ目を箱へ
  { name: "stranger_comment_drop", at: R + T_SORT[0] + SORT_DUR, volume: 0.6 },
  { name: "swish", at: R + T_SORT[1], volume: 0.55 }, // 2つ目を箱へ
  { name: "stranger_comment_drop", at: R + T_SORT[1] + SORT_DUR, volume: 0.6 },
  { name: "swish", at: R + T_GRAB, volume: 0.45 }, // 知らない人のコメントを手に取る
  { name: "stranger_comment_drop", at: R + T_IN, volume: 0.6 }, // 「報告として読む」箱へ
  { name: "stranger_comment_shrug", at: R + T_SHRUG, volume: 0.6 }, // 肩をすくめる
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

export const StrangerComment: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <AbsoluteFill style={{ filter: "blur(10px)" }}>
        <CommentsScene empty />
      </AbsoluteFill>
    </Sequence>
    <Sequence from={sec(C0)} durationInFrames={sec(4)}>
      <CommentsScene />
    </Sequence>
    <Sequence from={sec(R)} durationInFrames={sec(7)}>
      <RoomScene />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(2)}>
      <TitleCard2 text={script.title} outFrom={sec(1.7)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <EndCard2 text={script.end} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
