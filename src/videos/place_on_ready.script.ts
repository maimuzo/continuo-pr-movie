// 置くだけの回の台本。秒で書く。中身は docs/spec/detailed_storyboards/place_on_ready.md が正
export const script = {
  id: "place-on-ready",
  title: "置くだけで、始まる",
  end: "置くだけ",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "throw", from: 2, to: 5, caption: "issue を書いて、Ready へ" },
    { id: "pick", from: 5, to: 8, caption: "continuo が拾って" },
    { id: "start", from: 8, to: 11, caption: "Claude Code が作業開始" },
    { id: "coffee", from: 11, to: 13, caption: "あなたは、コーヒーでも" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
