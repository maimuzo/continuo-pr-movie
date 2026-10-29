// 止めても続きからの回の台本。秒で書く。中身は docs/spec/detailed_storyboards/resume.md が正
export const script = {
  id: "resume",
  title: "止めても、消えない",
  end: "止めても、消えない",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "stop", from: 2, to: 6, caption: "continuo を止めても" },
    { id: "morning", from: 6, to: 10, caption: "作業台は、そのまま" },
    { id: "go", from: 10, to: 13, caption: "次に起動すれば、続きから" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
