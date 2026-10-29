import React from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { Exclamation, Sparkle, SpeedLines, Sweat } from "../components/Effects";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { sec, theme } from "../theme";
import { EndCard } from "./visible_workshop/EndCard";
import { script } from "./visible_workshop.script";

// 見える工房の回。場面ごとにカットを割る（黒い箱の部屋・左右に割った黒い箱と工房・工房の中）。
// 座標はすべて 1080×1080 の画面の座標。各場面の中の時刻は、その場面の頭からの秒で書く。
// Codex に頼むのは Claude Code で、コンティは工房の外にいる（storyboard.md の注記）

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const PERIWINKLE = "#7A9DFF";
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;
const at = (s: number) => sec(s);
const lerp = (t: number, a: number, b: number) => a + (b - a) * t;
const EP = (name: string) => `ep/visible_workshop/${name}.png`;
const WHALE_H = 150;

// ---- 共通の部品 ----

// 工房の外の壁と床。縮めて使う場面があるので、画面の外まで広く塗る
const Room: React.FC<{ floorY?: number }> = ({ floorY = 720 }) => (
  <svg style={{ position: "absolute", left: -1200, top: -1200 }} width={3480} height={3480}>
    <rect x={0} y={0} width={3480} height={1200 + floorY} fill="#F3E3C8" />
    <rect x={0} y={1200 + floorY - 26} width={3480} height={26} fill="#B8743F" stroke={theme.color.ink} strokeWidth={4} />
    <rect x={0} y={1200 + floorY} width={3480} height={3480} fill="#D9A066" />
    {[70, 160, 270].map((d) => (
      <line key={d} x1={0} y1={1200 + floorY + d} x2={3480} y2={1200 + floorY + d} stroke="#B8743F" strokeWidth={4} />
    ))}
  </svg>
);

// ガラス張りの工房（herdr の pane）。中に children を置き、手前に濃い枠と薄い水色の板と光の筋を重ねる
const GlassWorkshop: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; bgLeft?: number; bgTop?: number; bgWidth?: number }> = ({
  x,
  y,
  w,
  h,
  children,
  bgLeft = -120,
  bgTop = -180,
  bgWidth = 940,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#EADBC4" }}>
      <Img src={staticFile("backgrounds/workshop.png")} style={{ position: "absolute", left: bgLeft, top: bgTop, width: bgWidth }} />
      {children}
      <div style={{ position: "absolute", inset: 0, background: "rgba(170, 215, 255, 0.16)" }} />
      <svg style={{ position: "absolute", inset: 0 }} width={w} height={h}>
        {[0.18, 0.27, 0.68].map((p, i) => (
          <polygon
            key={i}
            points={`${w * p},0 ${w * p + (i === 1 ? 30 : 70)},0 ${w * p + (i === 1 ? 30 : 70) - h * 0.55},${h} ${w * p - h * 0.55},${h}`}
            fill="#FFFFFF"
            opacity={0.28}
          />
        ))}
      </svg>
    </div>
    {/* 枠。上の梁を太くする。縦の桟はキャラクターに重なるので入れない */}
    <div style={{ position: "absolute", inset: 0, border: `14px solid #3A3F4A`, borderTopWidth: 24, borderRadius: 6, boxShadow: `0 0 0 4px ${theme.color.ink}` }} />
  </div>
);

// 作業の紙。done で赤い丸が付く
const Paper: React.FC<{ x: number; y: number; scale?: number; done?: number; rotate?: number }> = ({ x, y, scale = 1, done = 0, rotate = 0 }) => (
  <svg width={80} height={100} viewBox="0 0 80 100" style={{ position: "absolute", left: x - 40, top: y - 50, transform: `scale(${scale}) rotate(${rotate}deg)` }}>
    <path d="M6 4 H58 L74 20 V96 H6 Z" fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={5} strokeLinejoin="round" />
    {[32, 46, 60, 74].map((yy, i) => (
      <line key={yy} x1={16} y1={yy} x2={i === 3 ? 44 : 64} y2={yy} stroke="#9AA0A6" strokeWidth={5} strokeLinecap="round" />
    ))}
    <circle cx={52} cy={64} r={22 * done} fill="none" stroke="#D9463E" strokeWidth={7} opacity={done > 0 ? 1 : 0} />
  </svg>
);

// 「？」。出た瞬間に弾む
const Question: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 4, 8], [0, 1.3, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${s}) rotate(${Math.sin(f / 4) * 8}deg)`,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        fontSize: 110,
        color: "#FFFFFF",
        WebkitTextStroke: `14px ${theme.color.ink}`,
        paintOrder: "stroke fill",
      }}
    >
      ？
    </div>
  );
};

// 言葉の吹き出し（しっぽは左下）
const SpeechBubble: React.FC<{ x: number; y: number; text: string; fontSize?: number }> = ({ x, y, text, fontSize = 44 }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 4, 8], [0, 1.15, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "10% 100%" }}>
      <div
        style={{
          padding: "8px 24px",
          background: "#FFFFFF",
          border: `5px solid ${theme.color.ink}`,
          borderRadius: 26,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize,
          color: theme.color.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
      <svg width={40} height={28} style={{ position: "absolute", left: 24, top: "100%", marginTop: -5 }}>
        <path d="M2 0 L8 24 L30 0" fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={5} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// 考え事の吹き出し。lines を1文字ずつ出す。(x, y) は雲の左上、尾の小さな丸は右下へ伸ばす
const ThoughtBubble: React.FC<{ x: number; y: number; w: number; h: number; lines: string[]; tail: { x: number; y: number }; fontSize?: number }> = ({ x, y, w, h, lines, tail, fontSize = 40 }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 5, 9], [0, 1.1, 1], clamp);
  const shown = Math.max(0, f - 6); // 1フレームに1文字
  let left = shown;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `scale(${s})`, transformOrigin: "70% 100%" }}>
      <svg style={{ position: "absolute", left: -20, top: -20, overflow: "visible" }} width={w + 40} height={h + 40}>
        {[
          [0.2, 0.35, 0.22],
          [0.45, 0.22, 0.26],
          [0.75, 0.32, 0.24],
          [0.82, 0.68, 0.22],
          [0.5, 0.78, 0.26],
          [0.18, 0.68, 0.22],
          [0.5, 0.5, 0.36],
        ].map(([cx, cy, r], i) => (
          <ellipse key={i} cx={20 + w * cx} cy={20 + h * cy} rx={w * r} ry={h * r * 1.25} fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={6} />
        ))}
        {[
          [0.2, 0.35, 0.22],
          [0.45, 0.22, 0.26],
          [0.75, 0.32, 0.24],
          [0.82, 0.68, 0.22],
          [0.5, 0.78, 0.26],
          [0.18, 0.68, 0.22],
          [0.5, 0.5, 0.36],
        ].map(([cx, cy, r], i) => (
          <ellipse key={`f${i}`} cx={20 + w * cx} cy={20 + h * cy} rx={w * r - 3} ry={h * r * 1.25 - 3} fill="#FFFFFF" />
        ))}
        <circle cx={20 + tail.x - x - 22} cy={20 + tail.y - y - 26} r={14} fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={5} />
        <circle cx={20 + tail.x - x} cy={20 + tail.y - y} r={8} fill="#FFFFFF" stroke={theme.color.ink} strokeWidth={4} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.3,
          color: theme.color.ink,
        }}
      >
        {lines.map((l) => {
          const n = Math.max(0, Math.min(l.length, left));
          left -= l.length;
          return (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l.slice(0, n)}
              <span style={{ opacity: 0 }}>{l.slice(n)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ハイタッチの瞬間に、手のまわりへ放射状に出る短い線
const ClapBurst: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const grow = interpolate(f, [0, 6], [0.6, 1.2], clamp);
  const o = interpolate(f, [0, 2, 14], [0, 1, 0], clamp);
  return (
    <svg style={{ position: "absolute", left: x - 150, top: y - 150, opacity: o }} width={300} height={300}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={150 + Math.cos(a) * 70 * grow}
            y1={150 + Math.sin(a) * 70 * grow}
            x2={150 + Math.cos(a) * 118 * grow}
            y2={150 + Math.sin(a) * 118 * grow}
            stroke={theme.color.highlight}
            strokeWidth={9}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

// 看板。(cx, bottomY) は板の下の辺の中央。下へ2本の脚を伸ばして、箱や工房の上に立てる。
// 字は字幕と同じくらいはっきり読める大きさにする。pop なら出た瞬間に下から起き上がる
const SIGN_FONT = 52;
const SIGN_LEG = 40;
const Signboard: React.FC<{ cx: number; bottomY: number; text: string; board: string; textColor: string; textStroke?: string; pop?: boolean }> = ({
  cx,
  bottomY,
  text,
  board,
  textColor,
  textStroke,
  pop = true,
}) => {
  const f = useCurrentFrame();
  const up = pop ? interpolate(f, [0, 5, 9], [0, 1.12, 1], clamp) : 1;
  return (
    <div style={{ position: "absolute", left: cx, top: bottomY, transform: `translate(-50%, -100%) scaleY(${up})`, transformOrigin: "50% 100%" }}>
      {/* 脚。板の下から、立てる先の上の面まで */}
      {[0.22, 0.78].map((p) => (
        <div
          key={p}
          style={{ position: "absolute", left: `${p * 100}%`, top: "100%", width: 14, height: SIGN_LEG, marginLeft: -7, background: "#8A5A30", border: `4px solid ${theme.color.ink}`, borderTop: "none" }}
        />
      ))}
      <div
        style={{
          padding: "6px 18px 10px",
          background: board,
          border: `6px solid ${theme.color.ink}`,
          borderRadius: 14,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: SIGN_FONT,
          lineHeight: 1.2,
          color: textColor,
          whiteSpace: "nowrap",
          WebkitTextStroke: textStroke ? `10px ${textStroke}` : undefined,
          paintOrder: "stroke fill",
          boxShadow: `0 6px 0 rgba(0,0,0,0.18)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---- 黒い箱と工房の大きさ ----
// 黒い箱の正面と、右の continuo の工房（ガラスの枠の外側）を同じ大きさにする（人間の指摘）
const FLOOR = 780;
const BOX_W = 380;
const BOX_H = 540;
const BOX_TOP = FLOOR - BOX_H; // 240
const SIGN_BOTTOM = BOX_TOP - SIGN_LEG; // 看板の脚の先が箱の上の面に乗る

// ---- 場面2（2〜5.5秒）：黒い箱の部屋。5.5秒からは左半分へ寄り、9秒まで映し続ける ----
const BOX = { x: 560, y: BOX_TOP, w: BOX_W, h: BOX_H };
const DEV_BOX = { cx: 260, baseY: 920, height: 560 };
const BOX_SCENE_LEN = 3.5; // 場面2だけの長さ。この後は左半分に寄る
const PAN_X = 80 - BOX.x; // 左半分に寄ったときの、箱の正面の左端が 80 になる

const BlackBox: React.FC = () => {
  const f = useCurrentFrame();
  const shaking = f >= at(0.1);
  const jx = shaking ? Math.sin(f * 2.3) * 6 : 0;
  const jy = shaking ? -Math.abs(Math.sin(f * 1.9)) * 8 : 0;
  const rot = shaking ? Math.sin(f * 1.6) * 1.6 : 0;
  const { x, y, w, h } = BOX;
  const d = 40; // 奥行き
  return (
    <>
      {/* 床の影 */}
      <svg style={{ position: "absolute", left: x - 30, top: y + h - 20 }} width={w + d + 60} height={60}>
        <ellipse cx={(w + d + 60) / 2} cy={30} rx={(w + d) / 2 + 10} ry={18} fill="#000000" opacity={0.18} />
      </svg>
      {/* 煙。0.5秒ごとに1つ、箱の上の左右の端から吹き、上りながら膨らんで薄れる。看板の後ろを通る */}
      {Array.from({ length: 13 }, (_, i) => {
        const born = at(0.25 + i * 0.5);
        const t = (f - born) / at(1.4);
        if (t < 0 || t > 1) return null;
        const side = i % 2 === 0 ? -1 : 1;
        const px = x + w / 2 + side * (w / 2 - 20 + t * 60) + Math.sin(t * 5 + i) * 14;
        const py = y - d - 10 - t * 230;
        const r = 30 + t * 40;
        return (
          <svg key={i} style={{ position: "absolute", left: px - r * 1.6, top: py - r * 1.4, opacity: 1 - t }} width={r * 3.2} height={r * 2.8}>
            {[
              [0.35, 0.55, 0.42],
              [0.62, 0.45, 0.5],
              [0.5, 0.7, 0.38],
            ].map(([cx, cy, rr], k) => (
              <circle key={k} cx={r * 3.2 * cx} cy={r * 2.8 * cy} r={r * rr * 1.6} fill="#A9A9AE" stroke="#6E6E74" strokeWidth={5} />
            ))}
          </svg>
        );
      })}
      <svg
        style={{ position: "absolute", left: x, top: y - d, transform: `translate(${jx}px, ${jy}px) rotate(${rot}deg)`, transformOrigin: "50% 100%" }}
        width={w + d + 10}
        height={h + d + 10}
      >
        <path d={`M5 ${d + 5} L${d + 5} 5 H${w + d + 5} L${w + 5} ${d + 5} Z`} fill="#45454D" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
        <path d={`M${w + 5} ${d + 5} L${w + d + 5} 5 V${h + 5} L${w + 5} ${h + d + 5} Z`} fill="#1E1E22" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
        <rect x={5} y={d + 5} width={w} height={h} fill="#2C2C31" stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
      </svg>
      {/* ガタガタの線 */}
      {shaking
        ? [-1, 1].map((side) => (
            <svg
              key={side}
              style={{ position: "absolute", left: side < 0 ? x - 75 : x + w + d + 10, top: y + 160, opacity: Math.sin(f * 0.9 + side) > -0.3 ? 1 : 0 }}
              width={70}
              height={140}
            >
              {[0, 1].map((i) => (
                <path
                  key={i}
                  d={side < 0 ? `M${50 - i * 22} ${20 + i * 25} Q${30 - i * 22} ${50 + i * 25} ${50 - i * 22} ${80 + i * 25}` : `M${20 + i * 22} ${20 + i * 25} Q${40 + i * 22} ${50 + i * 25} ${20 + i * 22} ${80 + i * 25}`}
                  fill="none"
                  stroke={theme.color.ink}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          ))
        : null}
      {/* 箱の上の看板。箱が何を指すかが最初のコマから分かるよう、場面の頭から立てておく */}
      <Signboard cx={x + w / 2} bottomY={SIGN_BOTTOM + jy * 0.5} text="他のフレームワーク" board="#D9D5CC" textColor={theme.color.ink} pop={false} />
    </>
  );
};

// 場面2から場面3の終わり（2〜9秒）まで続けて映す。5.5秒で左へ寄って、箱が左半分に収まる
const BoxScene: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = Math.sin(f / 14) * 3.5; // 首をかしげて、ゆっくり左右に傾く
  const pan = interpolate(f, [at(BOX_SCENE_LEN), at(BOX_SCENE_LEN + SPLIT_T)], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${PAN_X * pan}px)` }}>
        <Room floorY={FLOOR} />
        <Sprite src={EP("dev_puzzled")} cx={DEV_BOX.cx} baseY={DEV_BOX.baseY} height={DEV_BOX.height} rotate={tilt} squash={false} />
        <BlackBox />
        <Sequence from={at(0.6)} durationInFrames={at(1.1)}>
          <Question x={DEV_BOX.cx + 100} y={250} />
        </Sequence>
        <Sequence from={at(2.0)} durationInFrames={at(BOX_SCENE_LEN - 2.0)}>
          <Question x={DEV_BOX.cx + 130} y={230} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", inset: 0, background: `rgba(40, 36, 40, ${0.22 * pan})` }} />
    </AbsoluteFill>
  );
};

// ---- 場面3（5.5〜9秒）：右半分に continuo の工房が滑り込む ----
const SPLIT = 540; // 左右の半分
const SPLIT_T = 0.4; // 割り終わる
const GLASS3 = { x: 660 - SPLIT, y: BOX_TOP, w: BOX_W, h: BOX_H }; // 右半分の中の座標。画面では x=660〜1040
const CC3 = { cx: 190, baseY: 430, height: 270 }; // 工房の中の座標
const WHALE3 = { cx: 618 - SPLIT, baseY: 770, height: 120 };

const GlassScene: React.FC = () => {
  const f = useCurrentFrame();
  const split = interpolate(f, [0, at(SPLIT_T)], [0, 1], { ...clamp, easing: ease });
  const rightX = lerp(split, 1080, SPLIT);
  const shake = Math.sin(f * 1.7) * 4;
  const offer = interpolate(f, [at(1.4), at(1.6)], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const ccTop = GLASS3.y + CC3.baseY - CC3.height;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: rightX, top: 0, width: 1080 - SPLIT, height: 1080, overflow: "hidden" }}>
        <Room floorY={FLOOR} />
        <GlassWorkshop x={GLASS3.x} y={GLASS3.y} w={GLASS3.w} h={GLASS3.h} bgLeft={-170} bgTop={-90} bgWidth={720}>
          <Sprite src="characters/claude_code/work.png" cx={CC3.cx + shake} baseY={CC3.baseY + Math.abs(Math.sin(f * 0.9)) * -5} height={CC3.height} rotate={shake / 3} squash={false} />
          <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: 20, top: 365, width: 340 }} />
          <Sweat x={CC3.cx + 85} y={CC3.baseY - CC3.height + 35} scale={0.6} />
        </GlassWorkshop>
        {/* 工房の上の看板 */}
        <Sequence from={at(0.45)}>
          <Signboard cx={GLASS3.x + GLASS3.w / 2} bottomY={SIGN_BOTTOM} text="continuo" board={theme.color.accent} textColor="#FFFFFF" textStroke={theme.color.ink} />
        </Sequence>
        {/* コンティは工房の外。右向きに浮かび、ヒレを前へ出して「どうぞ」 */}
        <Sprite
          src="characters/continuo/wave.png"
          cx={WHALE3.cx + offer * 10}
          baseY={WHALE3.baseY + Math.sin(f / 7) * 6}
          height={WHALE3.height}
          flip
          rotate={-offer * 10}
          squash={false}
        />
        <Sequence from={at(1.4)}>
          <SpeechBubble x={WHALE3.cx - 70} y={WHALE3.baseY - WHALE3.height - 100} text="どうぞ" fontSize={40} />
        </Sequence>
        <Sequence from={at(1.45)} durationInFrames={at(0.6)}>
          <Sparkle x={WHALE3.cx + 60} y={WHALE3.baseY - 110} />
        </Sequence>
        {/* 考え事の吹き出し（工房の中） */}
        <Sequence from={at(1.95)}>
          <ThoughtBubble x={GLASS3.x + 30} y={GLASS3.y + 25} w={320} h={100} fontSize={34} lines={["テストを書いて…", "ここを直そう"]} tail={{ x: GLASS3.x + CC3.cx + 72, y: ccTop + 10 }} />
        </Sequence>
        <Sequence from={at(0.45)} durationInFrames={at(1.5)}>
          <NameTag cx={GLASS3.x + CC3.cx} tipY={ccTop - 8} name="Claude Code" color={TERRACOTTA} durationInFrames={at(1.5)} fontSize={38} />
        </Sequence>
      </div>

      {/* 仕切り */}
      <div style={{ position: "absolute", left: rightX - 7, top: 0, width: 14, height: 1080, background: theme.color.ink }} />
    </AbsoluteFill>
  );
};

// ---- 場面4（9〜13秒）：工房の中で Claude Code が Codex に頼む ----
const GLASS4 = { x: 360, y: 90, w: 700, h: 770 };
const CC4 = { cx: 535, baseY: 690, height: 380 };
const CX4 = { cx: 885, baseY: 690, height: 380 };
const HF = { height: 400, baseY: 690, handX: 0.9, handY: 0.4, aspect: 1002 / 1276 }; // ハイタッチの絵
const HF_W = HF.height * HF.aspect;
const CLAP = { x: 710, y: HF.baseY - HF.height + HF.height * HF.handY };
const DEV4 = { cx: 175, baseY: 905, height: 520 };
const T_PASS = 0.4;
const T_GOT = 1.0;
const T_WORK = 1.1;
const T_DONE = 2.1;
const T_BACK = 2.25;
const T_BACK_END = 2.7;
const T_HF = 2.8;
const T_CLAP = 3.0;
const TAG_TIP = 262;

const ReceiveHand = (cx: number, baseY: number, height: number, toRight: boolean) => {
  const w = height * (899 / 1211);
  return { x: cx - w / 2 + (toRight ? 0.87 : 0.13) * w, y: baseY - height + 0.6 * height };
};

const HandoffScene: React.FC = () => {
  const f = useCurrentFrame();
  const ccHand = ReceiveHand(CC4.cx, CC4.baseY, CC4.height, true);
  const cxHand = ReceiveHand(CX4.cx, CX4.baseY, CX4.height, false);
  const desk = { x: CX4.cx, y: GLASS4.y + 560 };
  // 紙：Claude Code の手 → Codex の手 → Codex の台の上 → Claude Code の手
  const go = interpolate(f, [at(T_PASS), at(T_GOT)], [0, 1], { ...clamp, easing: ease });
  const back = interpolate(f, [at(T_BACK), at(T_BACK_END)], [0, 1], { ...clamp, easing: ease });
  const working = f >= at(T_WORK) && f < at(T_DONE + 0.1);
  let paper = { x: lerp(go, ccHand.x, cxHand.x), y: lerp(go, ccHand.y, cxHand.y) - Math.sin(go * Math.PI) * 90 };
  if (f >= at(T_WORK)) paper = { x: desk.x, y: desk.y };
  if (f >= at(T_BACK)) paper = { x: lerp(back, desk.x, ccHand.x), y: lerp(back, desk.y, ccHand.y) - Math.sin(back * Math.PI) * 110 };
  const done = interpolate(f, [at(T_DONE), at(T_DONE + 0.15)], [0, 1], clamp);
  const hf = f >= at(T_HF);
  const meet = interpolate(f, [at(T_HF), at(T_CLAP)], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const ccHfCx = lerp(meet, CC4.cx - 30, CLAP.x - (HF.handX - 0.5) * HF_W);
  const cxHfCx = lerp(meet, CX4.cx + 30, CLAP.x + (HF.handX - 0.5) * HF_W);
  const shake = working ? Math.sin(f * 1.7) * 5 : 0;
  const ccCx = hf ? ccHfCx : CC4.cx;
  const cxCx = hf ? cxHfCx : CX4.cx + shake;
  const local = (p: { cx: number; baseY: number }) => ({ cx: p.cx - GLASS4.x, baseY: p.baseY - GLASS4.y });

  return (
    <AbsoluteFill>
      <Room floorY={700} />
      <GlassWorkshop x={GLASS4.x} y={GLASS4.y} w={GLASS4.w} h={GLASS4.h} bgLeft={-110} bgTop={-150} bgWidth={940}>
        {/* Claude Code（左の台） */}
        {hf ? (
          <Sprite src={EP("cc_highfive")} cx={local({ cx: ccCx, baseY: 0 }).cx} baseY={HF.baseY - GLASS4.y} height={HF.height} />
        ) : (
          <Sprite src="characters/claude_code/receive.png" cx={local(CC4).cx} baseY={local(CC4).baseY} height={CC4.height} flip squash={f > 3} />
        )}
        {/* Codex（右の台） */}
        {hf ? (
          <Sprite src={EP("codex_highfive")} cx={local({ cx: cxCx, baseY: 0 }).cx} baseY={HF.baseY - GLASS4.y} height={HF.height} flip />
        ) : working ? (
          <Sprite src={EP("codex_work")} cx={local({ cx: cxCx, baseY: 0 }).cx} baseY={CX4.baseY - GLASS4.y + Math.abs(Math.sin(f * 0.9)) * -6} height={CX4.height} rotate={shake / 3} squash={false} />
        ) : (
          <Sprite src={EP("codex_receive")} cx={local(CX4).cx} baseY={local(CX4).baseY} height={CX4.height} />
        )}
        <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: 10, top: 545, width: 330 }} />
        <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: 360, top: 545, width: 330 }} />
        {working ? (
          <>
            <Sweat x={CX4.cx - GLASS4.x + 120} y={CX4.baseY - GLASS4.y - CX4.height + 60} scale={0.8} />
            <SpeedLines x={CX4.cx - GLASS4.x - 250} y={CX4.baseY - GLASS4.y - 240} width={90} height={90} direction={-1} />
          </>
        ) : null}
      </GlassWorkshop>

      {/* 紙（ガラスの手前に出して、よく見えるようにする） */}
      {!hf || f < at(T_HF + 0.1) ? <Paper x={paper.x} y={paper.y} done={done} rotate={working ? 0 : Math.sin(f / 3) * 6} /> : null}
      <Sequence from={at(T_DONE)} durationInFrames={at(0.6)}>
        <Sparkle x={desk.x + 20} y={desk.y - 120} />
      </Sequence>
      <Sequence from={at(T_PASS)} durationInFrames={at(T_GOT - T_PASS)}>
        <SpeedLines x={ccHand.x - 40} y={ccHand.y - 150} width={110} height={90} direction={1} />
      </Sequence>

      {/* ハイタッチ */}
      <Sequence from={at(T_CLAP)} durationInFrames={at(0.5)}>
        <ClapBurst x={CLAP.x} y={CLAP.y} />
        <Sparkle x={CLAP.x - 45} y={CLAP.y - 190} />
      </Sequence>

      {/* 工房の外：一歩離れて笑顔で見る開発者と、その上のコンティ */}
      <Sprite src={EP("dev_watch")} cx={DEV4.cx} baseY={DEV4.baseY} height={DEV4.height} squash={false} />
      <Sprite src="characters/continuo/wave.png" cx={205} baseY={330 + Math.sin(f / 7) * 6} height={WHALE_H} flip squash={false} />
      <Sequence from={at(T_CLAP)} durationInFrames={at(0.6)}>
        <Exclamation x={DEV4.cx + 110} y={DEV4.baseY - DEV4.height - 30} />
      </Sequence>

      {/* 2体が並ぶ間は、2体とも名前の札を出す（人間の指示） */}
      <Sequence from={at(0.1)}>
        <NameTag cx={ccCx} tipY={TAG_TIP} name="Claude Code" color={TERRACOTTA} durationInFrames={at(3.9)} fontSize={38} />
      </Sequence>
      <Sequence from={at(0.1)}>
        <NameTag cx={cxCx - shake} tipY={TAG_TIP} name="Codex" color={PERIWINKLE} durationInFrames={at(3.9)} fontSize={38} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- タイトルの後ろ：ガラスの工房を、キャラクター無しでぼかして映す ----
const TitleBackdrop: React.FC = () => (
  <AbsoluteFill style={{ filter: "blur(10px)" }}>
    <Room floorY={700} />
    <GlassWorkshop x={GLASS4.x} y={GLASS4.y} w={GLASS4.w} h={GLASS4.h} bgLeft={-110} bgTop={-150} bgWidth={940}>
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: 10, top: 545, width: 330 }} />
      <Img src={staticFile("props/bench.png")} style={{ position: "absolute", left: 360, top: 545, width: 330 }} />
    </GlassWorkshop>
  </AbsoluteFill>
);

// 効果音。at は動画の頭からの秒で、各場面の動きの時刻に合わせる
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "visible_workshop_rattle", at: S("box").from + 0.1, volume: 0.6 }, // 黒い箱がガタガタ
  { name: "pop", at: S("box").from + 0.6, volume: 0.35 }, // 「？」
  { name: "visible_workshop_rattle", at: S("box").from + 1.3, volume: 0.5 },
  { name: "pop", at: S("box").from + 2.0, volume: 0.35 }, // 2つ目の「？」
  { name: "visible_workshop_rattle", at: S("box").from + 2.5, volume: 0.45 },
  { name: "whoosh", at: S("glass").from, volume: 0.5 }, // 画面が左右に割れる
  { name: "pop", at: S("glass").from + 0.45, volume: 0.45 }, // 「continuo」の看板が立つ
  { name: "sparkle", at: S("glass").from + 1.45, volume: 0.45 }, // コンティの「どうぞ」
  { name: "typing", at: S("glass").from + 2.0, volume: 0.35 }, // 吹き出しに考えが出る
  { name: "swish", at: S("handoff").from + T_PASS, volume: 0.6 }, // 紙を Codex へ
  { name: "typing", at: S("handoff").from + T_WORK, volume: 0.35 }, // Codex が仕上げる
  { name: "sparkle", at: S("handoff").from + T_DONE, volume: 0.45 }, // 仕上がり
  { name: "swish", at: S("handoff").from + T_BACK, volume: 0.6 }, // 紙を返す
  { name: "visible_workshop_clap", at: S("handoff").from + T_CLAP, volume: 0.8 }, // ハイタッチ
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

const len = (id: (typeof script.scenes)[number]["id"]) => sec(S(id).to - S(id).from);

export const VisibleWorkshop: React.FC = () => (
  <AbsoluteFill style={{ background: "#F3E3C8", overflow: "hidden" }}>
    <Sequence durationInFrames={sec(2)}>
      <TitleBackdrop />
    </Sequence>
    {/* 黒い箱は、場面3の間も左半分に映し続ける */}
    <Sequence from={sec(S("box").from)} durationInFrames={len("box") + len("glass")}>
      <BoxScene />
    </Sequence>
    <Sequence from={sec(S("glass").from)} durationInFrames={len("glass")}>
      <GlassScene />
    </Sequence>
    <Sequence from={sec(S("handoff").from)} durationInFrames={len("handoff")}>
      <HandoffScene />
    </Sequence>

    {script.scenes.map((s) =>
      s.caption ? (
        <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
          <Caption text={s.caption} size={s.captionSize} />
        </Sequence>
      ) : null,
    )}

    <Sequence durationInFrames={sec(2)}>
      <TitleCard text={script.title} outFrom={sec(1.7)} />
    </Sequence>
    <Sequence from={sec(S("end").from)}>
      <EndCard lines={[...script.end]} fontSize={116} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={700} />
    </Sequence>

    {SFX.map((e, i) => (
      <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
        <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
