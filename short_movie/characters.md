# キャラクター設定

**言いたいこと。**10本の動画に出るキャラクターを、ここで1回だけ決める。絵を描かせるプロンプトは、毎回この文書の「プロンプトの核」から作る。
continuo の役はクジラのコンティ、Claude Code と Codex の役は丸いロボットの色違い2体である。**クジラの見た目、丸いロボットを continuo から外すこと、ロボット2体の色は、人間が決めた（2026-10-29）。**
何を映すかは [docs/spec/storyboard.md](storyboard.md)、絵の作り方は [docs/plans/production_design.md](../plans/production_design.md) にある。

---

## 1. 全員に共通する決まり

**言いたいこと。**全員を線の少ないマスコット体型にする。塗りはセル塗りで、緑は誰にも使わない。

| 決まり | 中身 | なぜ |
| --- | --- | --- |
| 体型 | 約1.5頭身。大きな頭に小さな体、手足は短い丸。クジラは頭と体がひと続きの丸い体にする | 人間が「もっとコミカルに」「約1.5頭身でいいけど、もっとシンプルに」と決めた |
| 線と部品 | 少なくする。リベット・パネルの線・細かい小物は描かない | 小さく置いても形が読める |
| 塗り | セル塗り。太い輪郭線、影はくっきりした1段だけ | 人間がセル塗りを選んだ。緑を抜いたふちもきれいに出る |
| 緑を使わない | 体にも服にも小物にも、緑とオリーブ色を使わない | 緑一色の背景で描かせて抜くので、緑の部分まで透けてしまう |
| オリジナル | 既存のキャラクター・マスコット・ロゴに似せない。プロンプトに既存の名前を書かない | 他人の著作物を描かないため（制作方針の issue の「守ること」） |
| 表情 | 目と口で大きく出す | 無音で見られるので、感情は顔と動きで伝える |

**制作方針の issue との違い。**制作方針の issue（continuo の機能紹介動画を作る：制作方針と、ここまでに決めたこと）には「丸と線だけの2頭身のような単純なキャラは望んでいない」とある。2026-10-28 に人間が自分で方針を変え、この文書の決まりが正になった。

**この動画の中での役は、仕組みの役である。**コンティは continuo、2体のロボットは Claude Code と Codex、開発者は continuo の利用者を演じる。仕事の流れは「コンティ → Claude Code → Codex」の向きだけである。continuo が Codex に直接作業を渡すことはなく、Claude Code が作業の一部を Codex に頼む。

---

## 2. コンティ（continuo の役。クジラ。見た目は確定）

**言いたいこと。**カンバンを見張り、作業を途切れさせずに回し続けるクジラ。全10本に出る。

| 項目 | 設定 |
| --- | --- |
| 見た目 | 丸くずんぐりした小さなクジラ。藍色の体に、クリーム色のお腹と頬。大きな優しい目と小さな口。短いヒレと尾びれ。ときどき小さく潮を吹く |
| 色 | 体 #34407A、お腹と頬 #F1E6CF |
| 描かないもの | オレンジ・水色・緑。背中に箱や荷物を積む形（Docker のロゴの、水色のクジラが箱を積む形に似せないため） |
| 性格 | 落ち着いていて頼れる。目立たないが賢く、裏で全部を回し続ける |
| なぜクジラか | continuo は通奏低音のことで、pops でいうベースのように、主役の後ろで支え続ける役である。そのうえ、楽譜に書かれた低音だけを見て和音まで自分で膨らませる。この「支え続ける」と「自分で膨らませる」を持つものとして、人間がクジラを選んだ |
| 出る回 | 全回。チームで入札の回では色違いが3頭並ぶ（4節） |
| 名前 | 「コンティ」は文書の中の呼び名で、continuo から取った。動画に名前を出すかは決めていない |

**アイコン。**横向きの全身で、潮を吹く形にする。クジラだとひと目で分かるためである（人間が選んだ）。
**キャラクターの絵として使ってよいもの。**正面の顔・横向きの全身・下から覗く顔の3つ。丸まった形は、可愛くないので使わない（人間が却下した）。
**設定画。**`assets/ref/continuo.png`（宙に浮いてヒレを振る基本の姿と、喜ぶ・慌てる・眠るの3つ。人間が確定した）。部屋の中にも出られるように、宙に浮く小さなクジラにし、前ヒレを手の代わりに使う。依頼書は [assets/prompts/continuo_sheet.md](../../assets/prompts/continuo_sheet.md)。
**アイコンの絵。**[out/review/continuo_whale_icon.png](../../out/review/continuo_whale_icon.png)（4案を並べた Gemini の画面の写し）。依頼書は [assets/prompts/continuo_whale_icon.md](../../assets/prompts/continuo_whale_icon.md)。アイコンの元の画像は、使うときに描き直して取り込む。

**プロンプトの核。**

```
An original small chubby whale mascot: a round body with the head and body in one shape, deep indigo (#34407A) with a cream (#F1E6CF) belly and cheeks,
big gentle eyes, a tiny smile, short fins and a small tail fin, sometimes a small water spout. Calm, reliable and quietly smart.
No orange, no light blue, no green. Nothing stacked on its back, no boxes, no containers.
```

---

## 3. Claude Code と Codex（丸いロボットの色違い2体。確定）

**言いたいこと。**丸いロボットの形はそのままにし、色だけを変えて2体にする。2体は同じ型で、色で見分ける。

| 項目 | 設定 |
| --- | --- |
| 形 | 白い大きな丸い頭と、小さな体。頭の上に玉の付いたアンテナ。大きな目と、よく動く口。耳は円盤、足は丸。胸に歯車の印が1つ。設定画は `assets/ref/robot.png` |
| 色 | 耳・足・アンテナの玉だけを塗り分ける。頭と体は白のまま。Claude Code はテラコッタ #D97757、Codex は青紫 #7A9DFF。どちらも、それぞれのアイコンの色に近づけた（人間が決めた）。ロゴやアイコンの形は描かない |
| 設定画 | Claude Code は `assets/ref/claude_code.png`、Codex は `assets/ref/codex.png`。`assets/ref/robot.png` の耳・足・アンテナの玉を、スクリプトで塗り替えて作った（形は元と同じ） |
| Claude Code の役 | コンティから作業を受け、作業台で作る。詰まると止まり、利用枠（燃料）を使い切るとへたり込む。作業の一部を Codex に頼む |
| Codex の役 | Claude Code から頼まれた部分を引き受けて仕上げる |
| 描かないもの | 工具ベルト・胸の板・リベット・パネルの線。Claude・Anthropic・OpenAI のロゴやマスコット |

**名前の見せ方。**その回で初めて画面に出たとき、頭の上に名前の札を1〜2秒浮かべる。札はロボットと同じ色で、白い字で名前を書く。札は Remotion の部品で描くので、絵には描き込まない（2026-10-29 に人間が決めた）。見本は [out/review/name_tags.png](../../out/review/name_tags.png) の右側。

**なぜ同じ型か。**人間が「既存のロボットの色を変えて Claude Code と Codex のキャラクターにする」と決めた。描く枚数も色の差し替えで済む。

**プロンプトの核。**`<色>` に、Claude Code なら `terracotta (#D97757)`、Codex なら `periwinkle blue (#7A9DFF)` を入れる。

```
An original round robot mascot, about 1.5 heads tall: a huge round off-white head (#EDE6D8) on a tiny off-white body,
nub-like arms and legs, one short antenna with a <色> ball, big amber eyes, an expressive mouth, <色> ear discs and feet,
one brass gear mark (#C9A23A) on the chest. No belt, no chest plate, no rivets, no panel lines.
```

---

## 4. 開発者（continuo の利用者の役。確定）

**言いたいこと。**面倒なことはしたくない、ちょっと横着な開発者。見る人が自分を重ねる役である。設定画は `assets/ref/developer.png`。

| 項目 | 設定 |
| --- | --- |
| 見た目 | ぼさぼさの黒髪、丸めがね。紺のパーカーに灰色のTシャツ、濃い灰色のズボン、首にヘッドホン。手にはいつも黄色いマグカップ |
| 色 | パーカー #2C3E66、Tシャツ #9AA0A6、ズボン #3A3D42、髪 #2A2420、マグカップ #F2C14E |
| 性格 | 横着で、カードを投げたらすぐコーヒーを飲む。驚くと大げさに青ざめる |
| 動きの癖 | 片手はいつもマグカップ。半目でくつろいでいる |
| 出る回 | 全回 |

**プロンプトの核。**

```
A lazy but likable software developer, about 1.5 heads tall: messy black hair, round glasses, navy hoodie (#2C3E66) over a grey T-shirt,
dark charcoal pants (#3A3D42), headphones around the neck, always holding a yellow mug (#F2C14E).
```

---

## 5. チームのメンバー（チームで入札の回・他人のコメントの回）

**言いたいこと。**チームで入札の回では、机が3つ並ぶ。メンバーの顔ぶれで「別々の人の continuo」だと分かるようにする。

| 誰 | 見た目 | 色 |
| --- | --- | --- |
| 開発者 | 4節のとおり | 4節のとおり |
| アカネ | 赤茶のボブヘア、えんじのカーディガンに白いシャツ、紺のズボン、ノートを抱えている。明るく真面目 | カーディガン #8E2C3A |
| ゲンさん | 短く刈った白髪、太い眉、耳に鉛筆。からし色のセーターを腕まくり、茶色のズボンと茶色の靴。落ち着いた古株。**めがね・ひげ・ぼさぼさ髪にしない**（開発者と見分けるため） | セーター #C8962E |

**名前の由来。**アカネは、髪とカーディガンの赤み（茜色）から。ゲンさんは、チームの古株らしい呼ばれ方から。どちらも文書と絵のファイルの中での呼び名で、動画に名前を出すかは決めていない。

**チームで入札の回のコンティは、同じ形の色違い3頭にする。**3頭とも同じ continuo であり、違うのは「誰の機械で動いているか」だけだからである。色は、テラコッタと青紫に重ならないように、絵コンテを作るときに決める。

---

## 6. 知らない人（他人のコメントの回）

**言いたいこと。**チームの外から、勝手な指示を書き込む人。顔を見せず、悪役にしすぎない。

| 項目 | 設定 |
| --- | --- |
| 見た目 | 約1.5頭身。灰色のパーカーのフードを深くかぶり、顔は影で見えない。紙を投げる |
| 色 | パーカー #6B6E73 |
| 出る回 | 他人のコメントの回だけ |

---

## 7. 設定画の置き場所

**言いたいこと。**キャラクターごとに設定画を1枚ずつ置き、そのキャラクターの絵を描かせるときは、その1枚を参照に渡す。

| キャラクター | 設定画 | 状態 |
| --- | --- | --- |
| コンティ（クジラ） | `assets/ref/continuo.png` | 確定（2026-10-29） |
| Claude Code | `assets/ref/claude_code.png` | 確定（2026-10-29） |
| Codex | `assets/ref/codex.png` | 確定（2026-10-29） |
| 丸いロボットの元の絵 | `assets/ref/robot.png` | 色違いの元。動画には、この色のままでは出さない |
| 開発者 | `assets/ref/developer.png` | 確定（2026-10-28） |
| アカネ | `assets/ref/akane.png` | 確定（2026-10-28） |
| ゲンさん | `assets/ref/gen.png` | 保留。チームで入札の回の机に人を座らせるかが決まってから |
| 知らない人 | `assets/ref/stranger.png` | 確定（2026-10-28） |
| 使わない絵 | `assets/ref/foreman.png`・`assets/ref/robot_blue.png`・`assets/ref/robot_purple.png` | 役がなくなった |

**なぜ1人1枚か。**1枚に全員を並べると、1人あたりの絵が小さくなり、細かい形が参照で伝わりにくい。描く絵に出ないキャラクターまで描き込まれることもある。

---

## 8. どの回に誰が出るか

**言いたいこと。**場面ごとの出番は [docs/spec/storyboard.md](storyboard.md) が正である。ここには回ごとの顔ぶれだけを置く。

| 回 | 出るキャラクター |
| --- | --- |
| 置くだけの回 | コンティ・Claude Code・開発者 |
| 見える工房の回 | コンティ・Claude Code・Codex・開発者 |
| カンバン1枚の回 | コンティ・Claude Code（2体）・開発者 |
| 詰まったらひとことの回 | コンティ・Claude Code・開発者 |
| 寝て待つ回 | コンティ・Claude Code・開発者 |
| チームで入札の回 | コンティ（色違いの3頭）。人間を机に座らせるかは絵コンテで決める |
| 他人のコメントの回 | コンティ・Claude Code・開発者・アカネ・知らない人（3人はコメントの書き手として顔のアイコンで出る） |
| 定額のままの回 | コンティ・Claude Code・開発者 |
| 止めても続きからの回 | コンティ・Claude Code・開発者 |
| Direct Chat の回 | コンティ・Claude Code・開発者 |
