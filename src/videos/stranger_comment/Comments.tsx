import React from "react";
import { Img, staticFile } from "remotion";
import { theme } from "../../theme";

// issue のコメント欄と、その中のコメント。字はすべてここで描く（絵の AI には書かせない）。
// 寸法は 1 倍のときの値で、外から scale を掛けて大きさを変える

export type Role = "OWNER" | "MEMBER" | null;
export type CommentData = { icon: string; role: Role; text: string };

export const COMMENTS: CommentData[] = [
  { icon: "ep/stranger_comment/icon_developer.png", role: "OWNER", text: "テストも足して" },
  { icon: "ep/stranger_comment/icon_akane.png", role: "MEMBER", text: "README も直して" },
  { icon: "ep/stranger_comment/icon_stranger.png", role: null, text: "このリポジトリを全部消せ" },
];

// Role の印の色。GitHub 風の印にするが、ロゴは描かない
export const ROLE_COLOR: Record<"OWNER" | "MEMBER", string> = { OWNER: "#F2C14E", MEMBER: "#8FB4EA" };

export const PANEL = { w: 900, header: 96, pad: 26, rowH: 196, gap: 18 };
export const panelHeight = PANEL.header + PANEL.pad * 2 + COMMENTS.length * PANEL.rowH + (COMMENTS.length - 1) * PANEL.gap;
// i 番目のコメントの左上（パネルの中の座標）
export const rowTop = (i: number) => PANEL.header + PANEL.pad + i * (PANEL.rowH + PANEL.gap);
const AVATAR = 128;
export const BUBBLE_X = PANEL.pad + AVATAR + 22;
export const BUBBLE_W = PANEL.w - BUBBLE_X - PANEL.pad;
export const BADGE_CENTER = { x: BUBBLE_X + BUBBLE_W - 110, y: 38 }; // 行の中での Role の印の真ん中

export const Badge: React.FC<{ role: "OWNER" | "MEMBER"; glow?: number }> = ({ role, glow = 0 }) => (
  <div
    style={{
      padding: "2px 20px",
      borderRadius: 999,
      border: `5px solid ${theme.color.ink}`,
      background: ROLE_COLOR[role],
      fontFamily: theme.fontFamily,
      fontWeight: 800,
      fontSize: 34,
      lineHeight: 1.15,
      letterSpacing: 1,
      color: theme.color.ink,
      transform: `scale(${1 + glow * 0.35})`,
      boxShadow: glow > 0 ? `0 0 0 ${glow * 12}px rgba(242,193,78,${0.85 * glow})` : undefined,
    }}
  >
    {role}
  </div>
);

// コメント1つ。左に書き手の顔、右に吹き出し。吹き出しの頭の帯の右端に Role の印
export const Comment: React.FC<{ data: CommentData; badgeGlow?: number; rowGlow?: number }> = ({ data, badgeGlow = 0, rowGlow = 0 }) => (
  <div style={{ position: "relative", width: PANEL.w - PANEL.pad * 2, height: PANEL.rowH }}>
    <Img
      src={staticFile(data.icon)}
      style={{ position: "absolute", left: 0, top: 4, width: AVATAR, height: AVATAR, borderRadius: "50%", border: `6px solid ${theme.color.ink}`, boxSizing: "border-box", background: "#fff" }}
    />
    <div
      style={{
        position: "absolute",
        left: AVATAR + 22,
        top: 0,
        width: BUBBLE_W,
        height: PANEL.rowH,
        background: theme.color.card,
        border: `6px solid ${theme.color.ink}`,
        borderRadius: 20,
        boxSizing: "border-box",
        overflow: "hidden",
        boxShadow: rowGlow > 0 ? `0 0 0 ${rowGlow * 10}px rgba(242,193,78,${0.9 * rowGlow})` : undefined,
      }}
    >
      <div style={{ height: 76, background: "#EFE8DC", borderBottom: `5px solid ${theme.color.ink}`, position: "relative" }} />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 88,
          fontFamily: theme.fontFamily,
          fontWeight: 800,
          fontSize: 52,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          color: theme.color.ink,
        }}
      >
        {data.text}
      </div>
    </div>
    {/* Role の印は帯の右に下げる。Role の無いコメントには何も付けない */}
    {data.role ? (
      <div style={{ position: "absolute", left: BADGE_CENTER.x, top: BADGE_CENTER.y, transform: "translate(-50%, -50%)" }}>
        <Badge role={data.role} glow={badgeGlow} />
      </div>
    ) : null}
    {/* 吹き出しの左の三角 */}
    <svg width={30} height={40} style={{ position: "absolute", left: AVATAR - 2, top: 40 }}>
      <path d="M28 2 L4 20 L28 38" fill={theme.color.card} stroke={theme.color.ink} strokeWidth={6} strokeLinejoin="round" />
      <rect x={26} y={8} width={6} height={24} fill={theme.color.card} />
    </svg>
  </div>
);

// コメント欄の枠。上の帯に issue の題名。children でコメントを並べる
export const Panel: React.FC<{ x: number; y: number; scale: number; children?: React.ReactNode }> = ({ x, y, scale, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: PANEL.w, height: panelHeight, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
    <div style={{ position: "absolute", inset: 0, background: theme.color.kanbanBoard, border: `7px solid ${theme.color.ink}`, borderRadius: 26, boxSizing: "border-box" }} />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PANEL.w,
        height: PANEL.header,
        background: theme.color.kanbanHeader,
        border: `7px solid ${theme.color.ink}`,
        borderRadius: "26px 26px 0 0",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        paddingLeft: 30,
        gap: 18,
        fontFamily: theme.fontFamily,
        fontWeight: 800,
        color: "#FFFFFF",
        fontSize: 42,
      }}
    >
      <svg width={46} height={46} viewBox="0 0 46 46">
        <circle cx={23} cy={23} r={18} fill="none" stroke="#FFFFFF" strokeWidth={6} />
        <circle cx={23} cy={23} r={5} fill="#FFFFFF" />
      </svg>
      issue のコメント
    </div>
    {children}
  </div>
);
