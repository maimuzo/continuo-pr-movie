// continuo とはの回の台本。秒で書く（30秒）。中身は docs/spec/detailed_storyboards/what_is_continuo.md が正
export const script = {
  id: "what-is-continuo",
  title: "continuo とは",
  end: "見るのはエージェントでなく、仕事",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "boot", from: 2, to: 6, caption: "herdr の上で continuo が動き" },
    { id: "launch", from: 6, to: 11, caption: "Status を見て、Claude Code を起動" },
    { id: "blocked", from: 11, to: 17, caption: "質問があれば Blocked へ" },
    { id: "review", from: 17, to: 21, caption: "PR ができたら In Review へ" },
    { id: "done", from: 21, to: 27, caption: "終われば Done へ。あとはカードを動かすだけ" },
    { id: "end", from: 27, to: 30, caption: null },
  ],
} as const;
