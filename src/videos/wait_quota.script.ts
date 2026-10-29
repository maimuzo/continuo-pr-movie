// 寝て待つ回の台本。秒で書く。中身は docs/spec/detailed_storyboards/wait_quota.md が正
export const script = {
  id: "wait-quota",
  title: "尽きても、勝手に再開",
  end: "尽きたら寝て待つ",
  scenes: [
    { id: "title", from: 0, to: 2, caption: null },
    { id: "work", from: 2, to: 5, caption: "作業の途中で" },
    { id: "empty", from: 5, to: 8, caption: "枠を使い切っても" },
    { id: "wait", from: 8, to: 11, caption: "枠が戻るのを待って" },
    { id: "resume", from: 11, to: 13, caption: "勝手に続きから" },
    { id: "end", from: 13, to: 15, caption: null },
  ],
} as const;
