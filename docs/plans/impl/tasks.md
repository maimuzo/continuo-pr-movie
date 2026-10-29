# タスク進行管理

設計は [docs/plans/production_design.md](../production_design.md)、何を映すかは [docs/spec/storyboard.md](../../spec/storyboard.md) にある。

## ステータス凡例

- `[ ]` 未着手
- `[>]` 進行中
- `[x]` 完了
- `[-]` スキップ

---

## Phase 0: 道具を確かめる（試作）

- [x] 001 - Codex の画像生成を `codex exec` から呼び、緑背景の PNG を1枚作る。呼び方と出力の置き場所を設計の2節に書き足す
- [x] 002 - 緑抜き（ffmpeg の `colorkey` と Pillow）を 001 の絵で試し、ふちの残り方を確かめる
- [ ] 003 - `scripts/ingest.py`（`assets/inbox/` の画像を保存の順に依頼書と突き合わせて名前を付ける）を作る
- [x] 004 - Remotion の雛形と Agent Skills を入れ、空の Composition を1本 MP4 に書き出す
- [ ] 005 - X の動画の上限と、OpenAI・Google の生成物の利用条件を確かめ、設計の10節と13節に書き足す

## Phase 1: キャラクターと絵柄を決める

- [x] 009 - キャラクター設定書（[docs/spec/characters.md](../../spec/characters.md)）を書く
- [x] 010 - 設定画を描き、人間が選ぶ（ゲンさんだけ、チームで入札の回のコンテが決まるまで保留）
- [x] 011 - 案を並べた比較画像を作り、人間へ見せる

## --- CHECKPOINT: 人間確認（絵柄の選択） ---

## Phase 2: 共通の土台と最初の1本

- [x] 020 - `src/theme.ts`（色・書体・尺）と `TitleCard` / `EndCard` / `Caption` を作る
- [x] 021 - `Kanban` / `IssueCard` / `Effects` を作る
- [x] 019 - 置くだけの回の詳しいコンテ（[docs/spec/detailed_storyboards/place_on_ready.md](../../spec/detailed_storyboards/place_on_ready.md)）を書き、人間の確認を取る
- [x] 022 - 最初の1本（置くだけの回）の台本・絵の一覧・依頼書を作り、ポーズ違いを揃える
- [>] 023 - 最初の1本を組み立て、自己点検（設計の7節）を通し、MP4 を書き出す

## --- CHECKPOINT: 人間確認（最初の1本の直し） ---

## Phase 3: 役を決め直してコンテを作り直す（2026-10-29 に人間が決めた）

- [x] 040 - 役を決める。continuo はクジラのコンティ、Claude Code と Codex は丸いロボットの色違い2体
- [x] 041 - コンティのアイコンを描き、人間が形を選ぶ（横向きの全身）
- [x] 042 - コンティの全身の設定画を描き、`assets/ref/continuo.png` に置く
- [x] 043 - Claude Code と Codex の色を決め、丸いロボットの色違い2枚を作る（テラコッタと青紫）
- [x] 044 - 10本のコンテを新しい役で作り直す（Claude Code が Codex に頼む場面を入れる）

## --- CHECKPOINT: 人間確認（コンテ・キャラクターの絵） ---

## Phase 4: 全回の絵コンテ

- [ ] 050 - 10本それぞれの、場面ごとの見本の静止画（絵コンテ）を Codex で描く
- [ ] 051 - 絵コンテとコンテを、文脈を持たない subagent に突き合わせさせ、構成の問題を直す

## --- CHECKPOINT: 人間確認（絵コンテ） ---

## Phase 5: 全回の MP4

- [ ] 060 - 10本のポーズの絵・背景・画面の部品を揃え、組み立てる
- [ ] 061 - 10本を MP4 に書き出し、自己点検（設計の9節）を通す
- [ ] 062 - 投稿文の下書きを揃える

## --- CHECKPOINT: 人間確認（投稿してよいか） ---
