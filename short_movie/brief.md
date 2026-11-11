# 製品の情報と方針（continuo の機能紹介動画）

**言いたいこと。**continuo の機能紹介動画を、X に投稿する 1080×1080・30fps の短い動画で作る。12本は作り終えていて、この版で2本を足す（続きもの）。

## どこから読んだか

- 製品: https://github.com/maimuzo/continuo（commit `5c216802993262d0c59ef01ea3e5fbd24e87710a`、2026-11-06 に読んだ）
- 読んだもの: README.ja.md・docs/FAQ.md（「共有している WORKFLOW.md の値を、自分だけ上書きしたい」「1週間のマージンを、リセットの直前だけ小さくしたい」）・maimuzo/continuo#324・#325 と、それを入れた pull request maimuzo/continuo#326・#327
- 既存の12本の方針: このリポジトリの issue #1（制作方針と、ここまでに決めたこと）と [docs/plans/production_design.md](docs/plans/production_design.md)

## 製品の一言

continuo は、GitHub のカンバン（Projects）を見張り、`Ready` に置かれた issue ごとに worktree を用意して Claude Code を起動し、pull request まで見届ける道具。

## 紹介する機能（1本に1機能）

既存の12本は [concept.md](concept.md) の「回の一覧」にある。この版で足すのは次の2本。

| 回の id | 呼び名 | 機能 | 訴求点（誰の、どんな困りごとを、どう片付けるか） | `concept-work` へ渡す概要 |
| --- | --- | --- | --- | --- |
| `weekly-margin-by-days` | どの日も自分の分が残る回 | 1週間のレートリミットのマージンを、リセットまでの残り日数ごとに決める（`weekly_margin_percent_by_days_until_reset`。maimuzo/continuo#324） | continuo 以外にも Claude Code などを使うのに、週の途中で continuo が枠を使い切ると、残りの日に AI を使えなくなる。一定のマージンでそれを防ごうと大きくすると、リセット直前に枠を余らせる。残り日数ごとにマージンを決められるので、どの日も自分の分を余裕を持って残しつつ、リセット直前の日は余りを continuo が使い切れる | リセットまでの残り日数ごとにマージンを決められる。どの日も自分が Claude Code などを使う分を余裕を持って残せて、リセット直前の日は余った枠を continuo が使い切る |
| `workflow-local` | 自分の分だけ上書きの回 | WORKFLOW.md の隣に置いた WORKFLOW.local.md で、書いたキーと本文だけを自分用に上書きする（maimuzo/continuo#325） | チームで1枚の WORKFLOW.md を共有すると、リセットの時刻が人それぞれなのに、自分のマージンだけを変えられない（書き換えるとチーム全員の値が変わる）。隣に WORKFLOW.local.md を置けば、書いた行だけが自分の機械で効き、チームの WORKFLOW.md には触らない | チームで共有する WORKFLOW.md はそのまま。隣に置いた WORKFLOW.local.md に書いた行だけが、自分の機械で上書きされる。リセットの時刻が違う自分の都合に合わせて、マージンを自分だけ変えられる |

- 1本目の訴求点は、人間の直し（https://github.com/maimuzo/continuo-pr-movie/issues/6#issuecomment-6685291200 ）を反映した案で、コンテの確認で確かめてもらう。2本目は人間が了承した案。
- 2本目のコンテの注意: WORKFLOW.local.md でマージンを上書きするときは、1本目の日ごとの表も含めて自分の値になるように描く（FAQ「1週間のマージンを、リセットの直前だけ小さくしたい」の最後から2つ目の箇条）。上書きした機械は入札の判定の条件も変わる（FAQ「共有している WORKFLOW.md の値を、自分だけ上書きしたい」）ので、入札に影響しないとは描かない。

## 方針（既存の12本と同じ）

| 項目 | 決まり |
| --- | --- |
| 尺 | 15秒（タイトル2秒 → 本編11秒 → 締め2秒）。continuo とはの回とセットアップの回だけ30秒 |
| 本数 | 14本（既存12本と、この版の2本） |
| 投稿先 | X |
| 見せ方 | デフォルメした画面と、コミカルな動き。無音でも伝わるよう字幕を焼き込む。1本で「困った → continuo が片付ける」を1往復 |
| 締め | 締めの字幕の下に、小さく「continuo」と `github.com/maimuzo/continuo` |
| キャラクター | コンティ（クジラ。continuo）・丸いロボットの色違い2体（Claude Code と Codex）・開発者ほか（[characters.md](characters.md)） |
| 画面 | 1080×1080・30fps に固定（土台がこの大きさで作ってある。X のタイムラインで縦にも横にも大きく映る） |
| 色 | [theme.json](theme.json) の7色は short-movie の既定と同じで、既存の12本の色。カンバン・カードの5色を足した12色は `videos/_shared/theme.ts` |

## 費用の条件

無料の範囲だけを使う。Codex は定額プランの枠、Nano Banana はブラウザの Gemini アプリ。`claude -p` と Gemini の API・CLI は使わない。

## Remotion のライセンス

個人と従業員3人以下の会社などは無料。それ以外の会社で使う場合は、Remotion の会社向けライセンスの確認が要る。
