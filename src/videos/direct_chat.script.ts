// Direct Chat の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/direct_chat.md が正
export const script = {
  id: "direct-chat",
  title: "話したいときは、直接",
  end: "話したいときは、直接",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "order", from: 2, to: 5, caption: "ふだんは continuo が指示" },
    { id: "move", from: 5, to: 8, caption: "Direct Chat に動かすと" },
    { id: "chat", from: 8, to: 12, caption: "Claude Code と直接話せる" },
    { id: "back", from: 12, to: 13, caption: "戻せば、また continuo が" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
