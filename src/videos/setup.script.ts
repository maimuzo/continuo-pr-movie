// セットアップの回の台本。秒で書く。この回だけ尺は30秒。中身は docs/spec/detailed_storyboards/setup.md が正
// captionSize は字幕の字の大きさ。1行に収まる中で、いちばん大きくする
export const script = {
  id: "setup",
  title: "セットアップ",
  end: ["あとは", "Ready に置くだけ"], // 締め「あとは Ready に置くだけ」を2行に分けたもの
  scenes: [
    { id: "title", from: 0, to: 2, caption: null, captionSize: 0 },
    { id: "deps", from: 2, to: 8, caption: "依存物を入れる", captionSize: 64 },
    { id: "install", from: 8, to: 11, caption: "continuo をネットワークインストール", captionSize: 54 },
    { id: "config", from: 11, to: 18, caption: "設定する", captionSize: 64 },
    { id: "check", from: 18, to: 23, caption: "確かめる", captionSize: 64 },
    { id: "start", from: 23, to: 27, caption: "起動", captionSize: 64 },
    { id: "end", from: 27, to: 30, caption: null, captionSize: 0 },
  ],
  // 端末に打つコマンド。continuo の README の「Install」と「Use」の段のとおり
  cmd: {
    brew: "brew install git gh ghq",
    apt: "sudo apt install git gh",
    herdr: "curl -fsSL https://herdr.dev/install.sh | sh",
    claude: "curl -fsSL https://claude.ai/install.sh | bash",
    ghAuth: "gh auth login -s project",
    continuo: "curl -fsSL https://raw.githubusercontent.com/maimuzo/continuo/main/install.sh | sh",
    init: "continuo init",
    setup: "continuo setup",
    trust: "continuo trust",
    keychain: "continuo allow-keychain-access",
    doctor: "continuo doctor",
    run: "continuo --port 8080",
  },
} as const;
