import { loadFont } from "@remotion/google-fonts/MPLUSRounded1c";

// 和文は細かい部分に分けて配られるので、subsets を絞らずに全部読む
const { fontFamily } = loadFont("normal", { weights: ["800"] });

// 10本で共有する色・書体・尺。色はキャラクター設定書（docs/spec/characters.md）に合わせる
export const theme = {
  fontFamily,
  fps: 30,
  size: 1080,
  durationInSeconds: 15,
  color: {
    ink: "#2A2420",
    paper: "#FFFDF7",
    caption: "#FFFFFF",
    captionStroke: "#2A2420",
    accent: "#E8772E",
    kanbanBoard: "#F4EFE6",
    kanbanColumn: "#E6DED0",
    kanbanHeader: "#5B5248",
    highlight: "#F2C14E",
    card: "#FFFFFF",
    cardTag: "#3B6FB6",
    endBackground: "#FFF4E0",
  },
} as const;

export const sec = (s: number) => Math.round(s * theme.fps);
