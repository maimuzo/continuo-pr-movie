// Direct Chat の回の台本。秒で書く。中身は docs/spec/detailed_storyboards/direct_chat.md が正。
// 字幕の区切りで場面を分け、場面の中でカットを切り替える
export const script = {
  id: "direct-chat",
  title: "話したいときは、直接",
  end: "話したいときは、直接",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "comment", from: 2, to: 4.5, caption: "ふだんは issue のコメントで会話" },
    { id: "tangle", from: 4.5, to: 7, caption: "込み入ってきたら、Direct Chat へ" },
    { id: "chat", from: 7, to: 10.5, caption: "Claude Code と直接話せる" },
    { id: "back", from: 10.5, to: 13, caption: "戻せば、またコメントで" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
