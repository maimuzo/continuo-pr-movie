import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Caption } from "../components/Caption";
import { CrumpleMarks, Exclamation, Sparkle, SpeedLines } from "../components/Effects";
import { NameTag } from "../components/NameTag";
import { Sprite } from "../components/Sprite";
import { TitleCard } from "../components/TitleCard";
import { WorktreeSign } from "../components/WorktreeSign";
import { sec, theme } from "../theme";
import { EndCard } from "./what_is_continuo/EndCard";
import { MINI, MiniCardState, MiniKanban, miniSlot } from "./what_is_continuo/MiniKanban";
import { script } from "./what_is_continuo.script";

// continuo とはの回。主役は herdr の端末の画面で、画面のほとんどを使う。カンバンは右上の小窓。
// 場面を割らず、1枚の herdr の画面の上で、カードの動きと pane の動き（開く・帯の色が変わる・畳まれる）を同じ瞬間に起こす。
// そのため、画面はすべて「動画の頭からの秒 t」の関数として描く（Screen）。座標は 1080×1080 の画面の座標

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const TERRACOTTA = "#D97757";
const MONO = "Menlo, Monaco, 'Courier New', monospace";
const lerp = (u: number, a: number, b: number) => a + (b - a) * u;
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease });
const pulse = (t: number, at: number, len = 0.6) => interpolate(t, [at, at + 0.1, at + len], [0, 1, 0], clamp);
const S = (id: (typeof script.scenes)[number]["id"]) => script.scenes.find((s) => s.id === id)!;

// ---- 時刻（動画の頭からの秒）----
// 30秒の版。カードの動きと pane の動きを1つずつ読み取れるように、出来事の間を 0.5〜1秒あける
const T = {
  typeHerdr: 2.25, // 真っ黒な画面に `$ herdr` を打つ
  enterHerdr: 2.85,
  open: 3.0, // herdr の画面が開く
  sign: 3.15, // 看板が光る
  kanbanIn: 3.6, // 小窓が右から入る
  typeCont: 4.0, // 左の pane で `$ continuo` を打つ
  enterCont: 4.55,
  wake: 4.75, // コンティが目を開ける
  badge: 5.15, // 「symphony の仕様で実装」の札
  gaze: 5.45, // 小窓への点線の視線
  dev: 6.0, // 開発者が小窓の横に出る
  aOpen: 7.5, // #12 が In Progress に着く = pane A が開く
  bOpen: 9.8, // #15 が In Progress に着く = pane B が開く
  aStop: 11.6, // pane A の Claude Code が手を止める
  aBlocked: 12.5, // #12 が Blocked に着く = pane A の帯が黄色
  comment: 13.2, // 開発者がコメントを書く
  aReady: 14.9, // 開発者が #12 を Ready へ戻す
  aResume: 15.8, // コンティが拾い直して In Progress に着く = 帯の色が戻り、続きを始める
  prRaise: 17.6, // pane B の Claude Code が PR の紙を掲げる
  bReview: 18.7, // #15 が In Review に着く = pane B の帯が青
  waitReview: 19.9, // pane B に「レビュー待ち」の行が出て、PR の紙をもう一度掲げる
  check: 21.3, // 開発者が #15 の結果を見る
  bDone: 22.5, // #15 が Done に着く = pane B が畳まれる
  rewatch: 23.3, // コンティが小窓を見張り直す
  cOpen: 25.3, // #18 が In Progress に着く = 空いた場所に pane C が開く
};
const MOVE = 0.3; // カードが列から列へ動く時間

// カードの行き先。at は着く時刻。最初の1つは上から落ちてきて貼り付く
type Stop = { at: number; col: number; row: number };
const CARD12: Stop[] = [
  { at: 6.5, col: 0, row: 0 },
  { at: T.aOpen, col: 1, row: 0 },
  { at: T.aBlocked, col: 2, row: 0 },
  { at: T.aReady, col: 0, row: 0 },
  { at: T.aResume, col: 1, row: 0 }, // コンティが拾い直す
];
const CARD15: Stop[] = [
  { at: 9.0, col: 0, row: 0 },
  { at: T.bOpen, col: 1, row: 1 },
  { at: T.bReview, col: 3, row: 0 },
  { at: T.bDone, col: 4, row: 0 },
];
const CARD18: Stop[] = [
  { at: 24.5, col: 0, row: 0 },
  { at: T.cOpen, col: 1, row: 1 },
];
const TAG12 = theme.color.cardTag;
const TAG15 = "#3E9A5A";
const TAG18 = "#8E5BB5";
// 誰がカードを動かすか。コンティが動かすときは視線が光り、開発者が動かすときは手を伸ばす
const KONTI_MOVES = [T.aOpen, T.bOpen, T.aBlocked, T.aResume, T.bReview, T.cOpen].map((a) => a - MOVE);

const cardAt = (stops: Stop[], t: number, label: string, tag: string): MiniCardState | null => {
  const first = stops[0];
  if (t < first.at - 0.2) return null;
  const s0 = miniSlot(first.col, first.row);
  if (t < first.at) {
    const u = ramp(t, first.at - 0.2, first.at);
    return { label, tag, x: s0.x, y: s0.y - (1 - u) * 70, lift: (1 - u) * 20 };
  }
  let cur = first;
  for (let i = 1; i < stops.length; i++) {
    const nx = stops[i];
    if (t < nx.at - MOVE) break;
    const a = miniSlot(cur.col, cur.row);
    const b = miniSlot(nx.col, nx.row);
    if (t < nx.at) {
      const u = ramp(t, nx.at - MOVE, nx.at);
      return { label, tag, x: lerp(u, a.x, b.x), y: lerp(u, a.y, b.y) - Math.sin(u * Math.PI) * 26, lift: Math.sin(u * Math.PI) * 14 };
    }
    cur = nx;
  }
  const p = miniSlot(cur.col, cur.row);
  const squash = interpolate(t, [cur.at, cur.at + 0.06, cur.at + 0.2], [0, 1, 0], clamp);
  return { label, tag, x: p.x, y: p.y, squash };
};

// 移る先の列の見出しを光らせる
const columnGlow = (t: number) => {
  const g = [0, 0, 0, 0, 0];
  for (const s of [...CARD12, ...CARD15, ...CARD18]) g[s.col] = Math.max(g[s.col], pulse(t, s.at));
  return g;
};

// ---- herdr の画面の割り付け ----
const WIN = { x: 16, y: 16, w: 1048, h: 1048 };
const HEADER_B = 136; // 上の帯の下の端
const TABS_B = 190; // タブの帯の下の端
const PANE_TOP = 230; // pane の帯の上の端（小窓の下の端 222 より下）
const BAND = 40; // pane の帯の高さ
const KONTI_PANE = { x: WIN.x, w: 340 };
const RIGHT = { x: WIN.x + 340, w: WIN.x + WIN.w - (WIN.x + 340) };
const CC_H = 330;
const CC_BASE = 872;

// pane A・B・C の左端と幅。A は開くと右の場所を全部使い、B が開くと半分ずつに分け、B が畳まれると A がまた全部を使う。
// そのあと C が、B のいた場所にまた開く（B と C が同時に開いていることは無い）
const paneGeom = (t: number) => {
  const openA = ramp(t, T.aOpen, T.aOpen + 0.3);
  const shareB = ramp(t, T.bOpen, T.bOpen + 0.3) * (1 - ramp(t, T.bDone, T.bDone + 0.4));
  const shareC = ramp(t, T.cOpen, T.cOpen + 0.3);
  const wB = (RIGHT.w / 2) * shareB;
  const wC = (RIGHT.w / 2) * shareC;
  const wA = (RIGHT.w - wB - wC) * openA;
  return { a: { x: RIGHT.x, w: wA }, b: { x: RIGHT.x + wA, w: wB }, c: { x: RIGHT.x + wA + wB, w: wC } };
};

const ccAPose = (t: number) =>
  t < T.aOpen + 0.35 ? "characters/claude_code/wake.png" : t < T.aStop || t >= T.aResume ? "characters/claude_code/work.png" : "ep/blocked/cc_confused.png";
const ccCPose = (t: number) => (t < T.cOpen + 0.35 ? "characters/claude_code/wake.png" : "characters/claude_code/work.png");
const ccBPose = (t: number) =>
  t < T.bOpen + 0.35 ? "characters/claude_code/wake.png" : t < T.prRaise ? "characters/claude_code/work.png" : "ep/what_is_continuo/cc_pr.png";

const devPose = (t: number) => {
  const drag = [
    [6.05, 6.65],
    [8.5, 9.15],
    [14.4, 15.05],
    [22.0, 22.65],
    [24.0, 24.65],
  ];
  if (drag.some(([a, b]) => t >= a && t < b)) return { src: "ep/direct_chat/dev_drag.png", flip: false };
  if (t >= T.comment - 0.1 && t < 14.4) return { src: "ep/direct_chat/dev_laptop.png", flip: false };
  // #15 の結果を、小窓を指さして見る（絵は左を指すので裏返す）
  if (t >= T.check - 0.1 && t < 22.0) return { src: "ep/direct_chat/dev_point.png", flip: true };
  return { src: "ep/visible_workshop/dev_watch.png", flip: false };
};
const DEV = { cx: 494, baseY: 226, height: 186 };

// コンティ（右向き）。目は絵の右寄り
const KONTI = { cx: 186, baseY: 720 };
const konti = (t: number) => {
  if (t < T.wake) return { src: "characters/continuo/sleep.png", cx: KONTI.cx, baseY: KONTI.baseY + Math.sin(t * 3) * 3, height: 140, rotate: 0 };
  if (t < T.wake + 0.4) {
    const u = interpolate(t, [T.wake, T.wake + 0.2, T.wake + 0.4], [0, 1, 0.4], clamp);
    return { src: "characters/continuo/leap.png", cx: KONTI.cx, baseY: KONTI.baseY - u * 40, height: 290, rotate: 0 };
  }
  // カードを動かすとき、畳むときは、ヒレを振るように体を傾ける
  const nudge = Math.max(...KONTI_MOVES.map((m) => interpolate(t, [m, m + 0.15, m + MOVE + 0.1], [0, 1, 0], clamp)), interpolate(t, [T.bDone, T.bDone + 0.15, T.bDone + 0.5], [0, 1.4, 0], clamp));
  return { src: "characters/continuo/wave.png", cx: KONTI.cx + nudge * 14, baseY: KONTI.baseY - 10 + Math.sin(t * 4.4) * 5, height: 190, rotate: -nudge * 10 };
};
const GAZE_FROM = { x: KONTI.cx + 78, y: KONTI.baseY - 120 };
const GAZE_TO = { x: MINI.x + 40, y: MINI.y + MINI.h - 10 };

// 色を割合で混ぜる
const mix = (a: string, b: string, u: number) => (u <= 0 ? a : u >= 1 ? b : `color-mix(in srgb, ${b} ${Math.round(u * 100)}%, ${a})`);
const BAND_NORMAL = "#55606C";
const BAND_BLOCKED = "#F2C14E";
const BAND_REVIEW = "#AFC8EE";

// ---- 部品 ----
const Pane: React.FC<{ x: number; w: number; band: string; bandInk: string; title: string; children?: React.ReactNode; badge?: React.ReactNode }> = ({ x, w, band, bandInk, title, children, badge }) => {
  if (w < 1) return null;
  return (
    <div style={{ position: "absolute", left: x, top: PANE_TOP, width: w, height: WIN.y + WIN.h - PANE_TOP, overflow: "hidden", borderLeft: `4px solid #8A7F74`, boxSizing: "border-box", background: "#1F1B18" }}>
      <div
        style={{
          height: BAND,
          background: band,
          borderBottom: `3px solid ${theme.color.ink}`,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 22,
          lineHeight: `${BAND}px`,
          color: bandInk,
          paddingLeft: 14,
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {badge}
      {children}
    </div>
  );
};

// 流れる数行の字。読ませるのではなく、動いている気配を出す
const LOG_A = ["› read issue #12", "› plan: 3 steps", "› edit src/api.ts", "› run tests", "✓ 18 passed", "› edit src/ui.tsx", "› git commit", "› run tests"];
const LOG_C = ["› read issue #18", "› edit src/db.ts", "› run tests", "✓ 7 passed", "› edit docs/", "› git commit"];
const LOG_B = ["› read issue #15", "› edit README.md", "› edit src/cli.ts", "✓ lint ok", "› run tests", "✓ 42 passed", "› git push", "› gh pr create"];
const Log: React.FC<{ lines: string[]; scroll: number; extra?: React.ReactNode }> = ({ lines, scroll, extra }) => {
  const step = 30;
  const first = Math.floor(scroll / step);
  return (
    <div style={{ position: "absolute", left: 16, top: BAND + 12, width: 600 }}>
      <div style={{ position: "relative", height: 6 * step, overflow: "hidden" }}>
      {Array.from({ length: 7 }, (_, i) => {
        const n = first + i;
        return (
          <div key={n} style={{ position: "absolute", top: i * step - (scroll % step), fontFamily: MONO, fontSize: 21, color: lines[n % lines.length].startsWith("✓") ? "#9FD59A" : "#CFC6BA", opacity: 0.75, whiteSpace: "nowrap" }}>
            {lines[n % lines.length]}
          </div>
        );
      })}
      </div>
      {extra}
    </div>
  );
};

const Prompt: React.FC<{ text: string; typed: number; size: number; cursor: boolean }> = ({ text, typed, size, cursor }) => (
  <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: size, color: "#F3E9DA", whiteSpace: "pre" }}>
    <span style={{ color: "#9FD59A" }}>$ </span>
    {text.slice(0, Math.round(typed * text.length))}
    {cursor ? <span style={{ display: "inline-block", width: size * 0.55, height: size * 0.95, background: "#F3E9DA", verticalAlign: "-10%", marginLeft: 2 }} /> : null}
  </span>
);

// Claude Code の pane の中身：流れる字、足もとの worktree の看板、作業する Claude Code
const CcPaneBody: React.FC<{ t: number; w: number; openAt: number; pose: string; tag: string; lines: string[]; running: boolean; blocked?: number; resumed?: boolean; review?: boolean }> = ({
  t,
  w,
  openAt,
  pose,
  tag,
  lines,
  running,
  blocked = 0,
  resumed = false,
  review = false,
}) => {
  const c = w / 2;
  const since = t - openAt;
  const scroll = running ? since * 60 : 0;
  const signDrop = interpolate(since, [0.15, 0.4], [-260, 0], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  const rise = interpolate(since, [0.1, 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.8)) });
  const working = pose.endsWith("work.png");
  const shake = working ? Math.sin(t * 30 * 1.7) * 5 : 0;
  const isPr = pose.endsWith("cc_pr.png");
  const prHop = isPr ? interpolate(t - T.prRaise, [0, 0.12, 0.3], [0, -40, 0], clamp) + interpolate(t - T.waitReview, [0, 0.12, 0.3], [0, -30, 0], clamp) : 0;
  return (
    <>
      <Log
        lines={lines}
        scroll={scroll}
        extra={
          blocked > 0 ? (
            <div style={{ position: "absolute", left: 0, top: 6 * 30 + 4, fontFamily: MONO, fontWeight: 700, fontSize: 22, color: BAND_BLOCKED, opacity: blocked }}>? waiting for answer</div>
          ) : review ? (
            <div style={{ position: "absolute", left: 0, top: 6 * 30 + 4, fontFamily: MONO, fontWeight: 700, fontSize: 22, color: BAND_REVIEW }}>› waiting for review</div>
          ) : resumed ? (
            <div style={{ position: "absolute", left: 0, top: 6 * 30 + 4, fontFamily: MONO, fontWeight: 700, fontSize: 22, color: "#9FD59A" }}>› read comment ✓</div>
          ) : null
        }
      />
      <div style={{ position: "absolute", left: c - 175, top: 800 - PANE_TOP + signDrop, transform: "scale(0.8)", transformOrigin: "0 0" }}>
        <WorktreeSign x={0} y={0} tagColor={tag} />
      </div>
      <Sprite
        src={pose}
        cx={c + 48 + shake}
        baseY={CC_BASE - PANE_TOP + lerp(rise, CC_H + 40, 0) + prHop + (working ? -Math.abs(Math.sin(t * 27)) * 6 : 0)}
        height={isPr ? CC_H + 30 : CC_H}
        rotate={working ? shake / 3 : 0}
        squash={false}
      />
    </>
  );
};

// ---- herdr の画面全体（時刻 t の様子）----
const Screen: React.FC<{ t: number }> = ({ t }) => {
  const open = ramp(t, T.open, T.open + 0.22);
  const signGlow = Math.max(pulse(t, T.sign, 0.8), 0.35);
  const g = paneGeom(t);
  const k = konti(t);
  const aBlocked = ramp(t, T.aBlocked, T.aBlocked + 0.08) * (1 - ramp(t, T.aResume, T.aResume + 0.08));
  const dev = devPose(t);
  const bReview = ramp(t, T.bReview, T.bReview + 0.08);
  const kanbanX = interpolate(t, [T.kanbanIn, T.kanbanIn + 0.3], [560, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const badge = interpolate(t, [T.badge, T.badge + 0.15, T.badge + 0.3], [0, 1.2, 1], clamp);
  // 視線：伸びてから、カードを動かすとき・見張り直すときに明るくなる
  const gazeLen = ramp(t, T.gaze, T.gaze + 0.3);
  const gazeBright = Math.max(0.45, ...KONTI_MOVES.map((m) => pulse(t, m, 0.5)), pulse(t, T.rewatch, 0.8), pulse(t, T.gaze + 0.3, 0.5));
  const cards = [cardAt(CARD12, t, "#12", TAG12), cardAt(CARD15, t, "#15", TAG15), cardAt(CARD18, t, "#18", TAG18)].filter((c): c is MiniCardState => c !== null);
  const commentO = interpolate(t, [T.comment, T.comment + 0.1, 14.5, 14.65], [0, 1, 1, 0], clamp);
  const commentLines = ramp(t, T.comment + 0.05, T.comment + 1.0);
  // 開発者が #15 の結果を見て「よし」と確かめる印
  const checkO = interpolate(t, [T.check, T.check + 0.12, 21.95, 22.05], [0, 1, 1, 0], clamp);
  const checkS = interpolate(t, [T.check, T.check + 0.08, T.check + 0.18], [0, 1.3, 1], clamp);
  // continuo の pane の字。下のコンティに重ならないように、新しい5行だけを出す
  const kontiLog = (
    [
      [T.wake + 0.3, "› watch Projects", undefined],
      [T.aOpen, "› start #12", undefined],
      [T.bOpen, "› start #15", undefined],
      [T.aBlocked, "› #12 Blocked", BAND_BLOCKED],
      [T.aResume, "› resume #12", undefined],
      [T.bReview, "› #15 In Review", BAND_REVIEW],
      [T.bDone + 0.3, "› close #15 pane", undefined],
      [T.cOpen, "› start #18", undefined],
    ] as [number, string, string | undefined][]
  )
    .filter(([at]) => t > at)
    .slice(-5);

  return (
    <AbsoluteFill style={{ background: "#0E0C0B" }}>
      {/* 真っ黒な画面で `$ herdr` を打つ */}
      {open < 1 ? (
        <div style={{ position: "absolute", left: 110, top: 470, opacity: 1 - open }}>
          <Prompt text="herdr" typed={ramp(t, T.typeHerdr, T.enterHerdr - 0.05)} size={84} cursor={Math.floor(t * 4) % 2 === 0 || t > T.typeHerdr} />
        </div>
      ) : null}

      {open > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: open, transform: `scale(${lerp(open, 0.94, 1)})` }}>
          {/* herdr の窓 */}
          <div style={{ position: "absolute", left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, background: "#14110F", border: `6px solid ${theme.color.ink}`, borderRadius: 18, boxSizing: "border-box", overflow: "hidden" }}>
            {/* 上の帯と看板 */}
            <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: HEADER_B - WIN.y, background: "#2E2823", borderBottom: `4px solid ${theme.color.ink}` }}>
              {["#E0554A", "#F2C14E", "#7DBA6A"].map((c, i) => (
                <div key={c} style={{ position: "absolute", left: 22 + i * 28, top: 50, width: 20, height: 20, borderRadius: 10, background: c, border: `3px solid ${theme.color.ink}` }} />
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 112,
                  top: 10,
                  height: 96,
                  padding: "0 26px",
                  background: "#1A1512",
                  border: `5px solid ${mix("#8C5A33", theme.color.accent, signGlow)}`,
                  borderRadius: 16,
                  boxShadow: `0 0 ${Math.round(signGlow * 40)}px ${theme.color.accent}`,
                  fontFamily: MONO,
                  fontWeight: 800,
                  fontSize: 78,
                  lineHeight: "86px",
                  color: mix("#E8A46A", "#FFE2B8", signGlow),
                  textShadow: `0 0 ${Math.round(signGlow * 26)}px ${theme.color.accent}`,
                  letterSpacing: 2,
                }}
              >
                herdr
              </div>
            </div>
            {/* タブの帯 */}
            <div style={{ position: "absolute", left: 0, top: HEADER_B - WIN.y, width: WIN.w, height: TABS_B - HEADER_B, background: "#231E1A", borderBottom: `3px solid #5A5048` }}>
              {[
                ["1 continuo", true],
                ["2 shell", false],
              ].map(([name, active], i) => (
                <div
                  key={String(name)}
                  style={{
                    position: "absolute",
                    left: 16 + i * 186,
                    top: 8,
                    width: 176,
                    height: TABS_B - HEADER_B - 12,
                    background: active ? "#4A4038" : "#2E2823",
                    border: `3px solid ${active ? theme.color.accent : "#5A5048"}`,
                    borderRadius: 8,
                    boxSizing: "border-box",
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: `${TABS_B - HEADER_B - 18}px`,
                    textAlign: "center",
                    color: active ? "#F3E9DA" : "#9B9087",
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
            {/* pane の並ぶ場所。窓の中の座標に直す */}
            <div style={{ position: "absolute", left: -WIN.x - 6, top: -WIN.y - 6 }}>
              <div style={{ position: "absolute", left: WIN.x, top: TABS_B, width: WIN.w, height: PANE_TOP - TABS_B, background: "#1A1613" }} />
              <Pane
                x={KONTI_PANE.x}
                w={KONTI_PANE.w}
                band="#3B4F7A"
                bandInk="#F3E9DA"
                title="continuo"
                badge={
                  <div
                    style={{
                      position: "absolute",
                      left: 12,
                      top: BAND + 8,
                      transform: `scale(${badge})`,
                      transformOrigin: "0 0",
                      padding: "3px 12px",
                      background: "#F7E2B8",
                      border: `3px solid ${theme.color.ink}`,
                      borderRadius: 999,
                      fontFamily: theme.fontFamily,
                      fontWeight: 800,
                      fontSize: 22,
                      color: theme.color.ink,
                      whiteSpace: "nowrap",
                    }}
                  >
                    symphony の仕様で実装
                  </div>
                }
              >
                <div style={{ position: "absolute", left: 16, top: BAND + 64 }}>
                  <Prompt text="continuo" typed={ramp(t, T.typeCont, T.enterCont - 0.05)} size={26} cursor={t < T.enterCont} />
                </div>
                <div style={{ position: "absolute", left: 16, top: BAND + 104, fontFamily: MONO, fontSize: 20, color: "#CFC6BA", opacity: 0.75, lineHeight: "30px" }}>
                  {kontiLog.map(([, text, color]) => (
                    <div key={text} style={{ color }}>
                      {text}
                    </div>
                  ))}
                </div>
                <Sprite src={k.src} cx={k.cx - KONTI_PANE.x} baseY={k.baseY - PANE_TOP} height={k.height} rotate={k.rotate} flip squash={false} />
              </Pane>
              <Pane
                x={g.a.x}
                w={g.a.w}
                band={mix(BAND_NORMAL, BAND_BLOCKED, aBlocked)}
                bandInk={aBlocked > 0.5 ? theme.color.ink : "#F3E9DA"}
                title="Claude Code: issue #12"
              >
                <CcPaneBody t={t} w={g.a.w} openAt={T.aOpen} pose={ccAPose(t)} tag={TAG12} lines={LOG_A} running={t < T.aStop || t >= T.aResume} blocked={aBlocked} resumed={t >= T.aResume && t < T.aResume + 1.6} />
              </Pane>
              <Pane x={g.b.x} w={g.b.w} band={mix(BAND_NORMAL, BAND_REVIEW, bReview)} bandInk={bReview > 0.5 ? theme.color.ink : "#F3E9DA"} title="Claude Code: issue #15">
                <CcPaneBody t={t} w={g.b.w} openAt={T.bOpen} pose={ccBPose(t)} tag={TAG15} lines={LOG_B} running={t < T.prRaise} review={t >= T.waitReview} />
              </Pane>
              <Pane x={g.c.x} w={g.c.w} band={BAND_NORMAL} bandInk="#F3E9DA" title="Claude Code: issue #18">
                <CcPaneBody t={t} w={g.c.w} openAt={T.cOpen} pose={ccCPose(t)} tag={TAG18} lines={LOG_C} running />
              </Pane>
            </div>
          </div>

          {/* コンティから小窓への点線の視線 */}
          {gazeLen > 0 ? (
            <svg style={{ position: "absolute", inset: 0 }} width={1080} height={1080}>
              <line
                x1={GAZE_FROM.x}
                y1={GAZE_FROM.y}
                x2={lerp(gazeLen, GAZE_FROM.x, GAZE_TO.x)}
                y2={lerp(gazeLen, GAZE_FROM.y, GAZE_TO.y)}
                stroke={theme.color.highlight}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray="2 22"
                strokeDashoffset={-t * 60}
                opacity={gazeBright}
              />
            </svg>
          ) : null}

          {/* 開発者は小窓の横にいて、pane を覗き込みには行かない */}
          {t >= T.dev ? <Sprite src={dev.src} flip={dev.flip} cx={DEV.cx} baseY={DEV.baseY + interpolate(t, [T.dev, T.dev + 0.2], [200, 0], clamp)} height={DEV.height} squash={false} /> : null}

          {/* カンバンの小窓 */}
          {t >= T.kanbanIn ? (
            <MiniKanban glow={columnGlow(t)} cards={cards} offsetX={kanbanX}>
              {commentO > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: miniSlot(2, 1).x - 3,
                    top: miniSlot(2, 1).y,
                    width: 88,
                    height: 44,
                    opacity: commentO,
                    background: "#FFFFFF",
                    border: `4px solid ${theme.color.ink}`,
                    borderRadius: 12,
                    boxSizing: "border-box",
                    padding: "7px 8px",
                  }}
                >
                  <div style={{ width: 62 * Math.min(1, commentLines * 2), height: 7, background: "#C9C2B6", borderRadius: 4 }} />
                  <div style={{ width: 44 * Math.max(0, commentLines * 2 - 1), height: 7, background: "#C9C2B6", borderRadius: 4, marginTop: 8 }} />
                  <div style={{ position: "absolute", left: 16, top: -16, width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `14px solid ${theme.color.ink}` }} />
                </div>
              ) : null}
              {checkO > 0 ? (
                <div style={{ position: "absolute", left: miniSlot(3, 0).x + 52, top: miniSlot(3, 0).y - 22, opacity: checkO, transform: `scale(${checkS})`, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 46, color: "#7DBA6A", WebkitTextStroke: `8px ${theme.color.ink}`, paintOrder: "stroke fill" }}>
                  ✓
                </div>
              ) : null}
            </MiniKanban>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// 「？」。Claude Code が手を止めたときに頭の横に浮かべる
const Question: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, 4, 8], [0, 1.3, 1], clamp);
  return (
    <div style={{ position: "absolute", left: x, top: y + Math.sin(f / 5) * 5, transform: `scale(${s})`, fontFamily: theme.fontFamily, fontWeight: 800, fontSize: 120, color: BAND_BLOCKED, WebkitTextStroke: `10px ${theme.color.ink}`, paintOrder: "stroke fill" }}>
      ?
    </div>
  );
};

// Sequence の中で、動画の頭からの秒に直して描く
const Live: React.FC<{ offset: number }> = ({ offset }) => {
  const f = useCurrentFrame();
  return <Screen t={offset + f / theme.fps} />;
};

// 効果音。at は動画の頭からの秒で、Screen の動きの時刻に合わせる
const SFX: { name: string; at: number; volume: number }[] = [
  { name: "typing", at: T.typeHerdr, volume: 0.35 }, // `$ herdr`
  { name: "enter", at: T.enterHerdr, volume: 0.6 },
  { name: "whoosh", at: T.open, volume: 0.45 }, // herdr の画面が開く
  { name: "sparkle", at: T.sign, volume: 0.45 }, // 看板が光る
  { name: "typing", at: T.typeCont, volume: 0.3 }, // `$ continuo`
  { name: "enter", at: T.enterCont, volume: 0.45 },
  { name: "spout", at: T.wake, volume: 0.55 }, // コンティが目を開ける
  { name: "pop", at: T.badge, volume: 0.35 }, // symphony の札
  { name: "splat", at: CARD12[0].at, volume: 0.6 }, // #12 が Ready に
  { name: "swish", at: T.aOpen - MOVE, volume: 0.5 }, // #12 を In Progress へ
  { name: "whoosh", at: T.aOpen, volume: 0.5 }, // pane A が開く
  { name: "splat", at: CARD15[0].at, volume: 0.5 }, // #15 が Ready に
  { name: "swish", at: T.bOpen - MOVE, volume: 0.45 }, // #15 を In Progress へ
  { name: "whoosh", at: T.bOpen, volume: 0.5 }, // pane B が開く
  { name: "blocked_huh", at: T.aStop, volume: 0.6 }, // 手を止める
  { name: "swish", at: T.aBlocked - MOVE, volume: 0.5 }, // #12 を Blocked へ
  { name: "pop", at: T.aBlocked, volume: 0.45 }, // 帯が黄色に
  { name: "typing", at: T.comment, volume: 0.35 }, // コメントを書く
  { name: "swish", at: T.aReady - MOVE, volume: 0.5 }, // Ready へ戻す
  { name: "swish", at: T.aResume - MOVE, volume: 0.45 }, // コンティが拾い直す
  { name: "sparkle", at: T.aResume, volume: 0.45 }, // 帯の色が戻り、続きを始める
  { name: "sparkle", at: T.prRaise, volume: 0.55 }, // PR の紙を掲げる
  { name: "swish", at: T.bReview - MOVE, volume: 0.5 }, // In Review へ
  { name: "pop", at: T.bReview, volume: 0.45 }, // 帯が青に
  { name: "pop", at: T.waitReview, volume: 0.35 }, // レビュー待ちの行
  { name: "pop", at: T.check, volume: 0.4 }, // 開発者が結果を確かめる
  { name: "swish", at: T.bDone - MOVE, volume: 0.5 }, // 開発者が Done へ
  { name: "whoosh", at: T.bDone, volume: 0.55 }, // pane が畳まれる
  { name: "spout", at: T.rewatch, volume: 0.4 }, // 見張り直す
  { name: "splat", at: CARD18[0].at, volume: 0.5 }, // #18 が Ready に
  { name: "swish", at: T.cOpen - MOVE, volume: 0.45 }, // #18 を In Progress へ
  { name: "whoosh", at: T.cOpen, volume: 0.5 }, // pane C が開く
  { name: "pop", at: S("end").from, volume: 0.6 }, // 締めの字
];

// 字幕は1行に収める。和文を1字、英数字と空白を0.55字と数え、幅 990px に入る大きさにする（上限は共通の 64px）
const captionSize = (text: string) => {
  const em = [...text].reduce((n, c) => n + (/[ -~]/.test(c) ? 0.55 : 1), 0);
  return Math.min(64, Math.floor(990 / em));
};

// 締めの文言は台本のまま。「、」の後ろで2行に割る
const END_LINES: [string, string] = [script.end.slice(0, script.end.indexOf("、") + 1), script.end.slice(script.end.indexOf("、") + 1)];

export const WhatIsContinuo: React.FC = () => {
  // 効果を置く位置は、そのときの pane の割り付けから決める
  const gStop = paneGeom(T.aStop);
  const gPr = paneGeom(T.prRaise);
  const gFold = paneGeom(T.bDone);
  const ccTop = CC_BASE - CC_H;
  return (
    <AbsoluteFill style={{ background: "#0E0C0B", overflow: "hidden" }}>
      {/* タイトルの後ろは、pane が2つ開いた herdr の画面をぼかして映す */}
      <Sequence durationInFrames={sec(2)}>
        <AbsoluteFill style={{ filter: "blur(10px)" }}>
          <Screen t={10.6} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={sec(2)} durationInFrames={sec(S("end").from - 2)}>
        <Live offset={2} />
      </Sequence>

      {/* 効果（Sequence の頭からのフレームで動く部品） */}
      <Sequence from={sec(T.sign)} durationInFrames={sec(0.7)}>
        <Sparkle x={420} y={10} />
      </Sequence>
      <Sequence from={sec(T.wake)} durationInFrames={sec(0.6)}>
        <Exclamation x={KONTI.cx + 70} y={430} />
      </Sequence>
      <Sequence from={sec(T.aStop)} durationInFrames={sec(T.aResume - T.aStop)}>
        <Question x={gStop.a.x + gStop.a.w / 2 + 130} y={ccTop - 40} />
      </Sequence>
      <Sequence from={sec(T.prRaise)} durationInFrames={sec(0.8)}>
        <Sparkle x={gPr.b.x + gPr.b.w / 2 - 80} y={ccTop - 120} />
        <Sparkle x={gPr.b.x + gPr.b.w / 2 + 140} y={ccTop - 60} />
      </Sequence>
      <Sequence from={sec(T.bDone)} durationInFrames={sec(0.45)}>
        <SpeedLines x={gFold.b.x + 40} y={560} width={260} height={160} direction={1} />
        <CrumpleMarks x={gFold.b.x + gFold.b.w / 2 - 40} y={PANE_TOP + 60} />
      </Sequence>
      <Sequence from={sec(T.rewatch)} durationInFrames={sec(0.6)}>
        <Exclamation x={KONTI.cx + 70} y={430} />
      </Sequence>

      {/* 名前の札。Claude Code が pane に初めて出たときから */}
      <Sequence from={sec(T.aOpen + 0.15)} durationInFrames={sec(1.4)}>
        <NameTagFollow pane="a" from={T.aOpen + 0.15} />
      </Sequence>
      <Sequence from={sec(T.bOpen + 0.15)} durationInFrames={sec(1.4)}>
        <NameTagFollow pane="b" from={T.bOpen + 0.15} />
      </Sequence>
      <Sequence from={sec(T.cOpen + 0.15)} durationInFrames={sec(1.4)}>
        <NameTagFollow pane="c" from={T.cOpen + 0.15} />
      </Sequence>
      <Sequence from={sec(T.aResume)} durationInFrames={sec(0.7)}>
        <Sparkle x={gStop.a.x + gStop.a.w / 2 + 150} y={ccTop - 40} />
      </Sequence>
      <Sequence from={sec(T.check)} durationInFrames={sec(0.7)}>
        <Sparkle x={MINI.x + 330} y={MINI.y - 20} />
      </Sequence>

      {script.scenes.map((s) =>
        s.caption ? (
          <Sequence key={s.id} from={sec(s.from) + 4} durationInFrames={sec(s.to - s.from) - 4}>
            <Caption text={s.caption} size={captionSize(s.caption)} />
          </Sequence>
        ) : null,
      )}

      <Sequence durationInFrames={sec(2)}>
        <TitleCard text={script.title} outFrom={sec(1.7)} />
      </Sequence>
      <Sequence from={sec(S("end").from)}>
        <EndCard lines={END_LINES} sprite="characters/continuo/wave.png" spriteWidth={300} spriteTop={720} />
      </Sequence>

      {SFX.map((e, i) => (
        <Sequence key={i} from={sec(e.at)} durationInFrames={sec(1.2)}>
          <Audio src={staticFile(`sfx/${e.name}.wav`)} volume={e.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// pane の幅が変わっても、札が Claude Code の頭の上についていくようにする
const NameTagFollow: React.FC<{ pane: "a" | "b" | "c"; from: number }> = ({ pane, from }) => {
  const f = useCurrentFrame();
  const g = paneGeom(from + f / theme.fps)[pane];
  return <NameTag cx={g.x + g.w / 2 + 48} tipY={CC_BASE - CC_H - 6} name="Claude Code" color={TERRACOTTA} durationInFrames={sec(1.4)} fontSize={36} />;
};
