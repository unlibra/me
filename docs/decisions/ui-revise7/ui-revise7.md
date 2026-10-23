# UI の見直し（7回目）の判断ログ（ui-revise7）

計画：`ui-revise7/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。

## UR7-1 写真の切り抜きを中央にする仕組み

- 決めたこと：`Work.imagePosition` と `cards.ts` の `photoPosition` を消し、写真の `<img>`（`FrameCard`、`FeaturedCard`、`WorkDialog`）に `object-center` を直接書いた。型のテスト（`tests/types/works.ts`）に、`imagePosition` を書くと型エラーになることを足した。アイコン（`WorkIcon`、`scale-[2.25] object-cover`）は写真ではないので `object-center` を足していない（`object-cover` の既定の位置は中央で、見た目は変わらない）
- テストでは、`src/` とビルドした HTML に `object-top`・`object-bottom`・`object-left`・`object-right` がないことを見る。ビルドした CSS は見ない。Tailwind が `docs/` の文書に書かれたクラス名からも CSS を作るため（計画の本文に `object-top` がある）で、使う要素がなければ害はない
- 他の選択肢：`photoPosition` を残して常に `object-center` を返す（仕組みを外す指示と合わない）
- 戻すときの作業：上の3つのコンポーネント、`works.ts`、`cards.ts` を戻し、テストを戻す

## UR7-2 ヒーローのリンクのアイコンの大きさ

- 決めたこと：文字を `text-sm`（14px）から `text-base`（16px、行の高さ 24px）にし、アイコンを 16px から 18px（`size-4.5`）にした。14px の文字に 16px のアイコンだった比（約 1.14）を保つ大きさ
- E2E では、アイコンが 18px で、文字の行と縦の中心が 1px 以内でそろい、ボタンが1行であることを見る
- 他の選択肢：アイコンを 16px のまま（文字より小さく見える）、20px（`size-5`、比が大きくなる）
- 戻すときの作業：`src/pages/index.astro` のクラス2つと、テストの期待値を戻す

## UR7-3 Geist Mono への置き換え

- 決めたこと：
  - `@fontsource/geist-mono@^5.3.0`（OFL-1.1）を `dependencies` に入れ、`@fontsource/roboto-mono` を消した。読み込むのは使っている太さの 400 と 500（`font-medium`）の、立体（`normal`）だけ。今まで Roboto Mono で読み込んでいたものと同じ
  - クレジットのフォントの一覧は「Geist Mono」、著作者は「The Geist Project Authors」（フォントのパッケージの LICENSE とフォントファイルの著作権表示の名義）、参照先は npm パッケージの `homepage`（`https://fontsource.org/fonts/geist-mono`）。UR6-2 と同じ決め方
  - LICENSE 第4節と `LICENSES/` には Roboto Mono の名前がなく（第4節はフォントをまとめて「npm packages ... including fonts」としている。`LICENSES/OFL-1.1.txt` は LINE Seed JP の切り出したフォントのためのもの）、変えるところはなかった。`/third-party-licenses.txt` はビルド時にパッケージから作られるので、Geist Mono に置き換わる
- 既存のテスト `build.test.js` の A4（ビルドの出力とソースに「Vercel」がないこと）が、`/third-party-licenses.txt` で落ちた。Geist Mono の著作権表示（`Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font.git)`）がリポジトリの URL を含むため。著作権表示は改変せずに載せる必要があるので、`/third-party-licenses.txt` の中のこの URL だけを許すようにした（`scripts/check-prod.mjs` の `x-vercel-id` と同じ形）。A4 の目的（Vercel の設定やホスティングへの参照が残っていないこと）は保たれる
- 他の選択肢：A4 を変えずに、別のフォントを選ぶ（ユーザーの指示と合わない）。許可を `/third-party-licenses.txt` 全体にする（広すぎる）
- 戻すときの作業：`package.json`、`package-lock.json`、`BaseLayout.astro` の import、`global.css` の `--font-mono`、`credits.ts` を戻し、A4 の許可と `third-party-licenses.test.js` の一覧、追加したテストを戻す

## UR7-4 行の高さの決め方（指示6）

- 決めたこと：
  - Tailwind の既定の行の高さを、見出しとして使う大きさだけ変えた（`global.css` の `@theme`）：`text-xl` 28px → 32px、`text-2xl` 32px → 36px、`text-4xl` 40px → 52px。`text-sm`（20px）、`text-base`（24px）、`text-lg`（28px）は Tailwind のままで規則を満たす。既定の値は1行のラベルと見出しの値で、読ませる文には使う場所で `leading-7`（16px → 28px）、`leading-6`（14px → 24px）を付ける
  - `text-xl` のロゴタイプ（ヘッダー、モバイルのメニュー、フッターの「unlibra」）は見出しではなく1行のラベル（Dense 1.3 → 28px）として、`text-xl/7` で 28px のままにした。既定の 32px のままだとフッターとモバイルのメニューが 4px 高くなり、ユーザーが承認した「フッター：変えない」と合わないため（ブロック2のレビューの推奨1）。E2E で、ヘッダー、フッター、モバイルのメニューのロゴタイプが 20px/28px で、箱の高さが 28px であることを確かめる
  - Markdown のページ（`MarkdownLayout` の `.prose`）は CSS で、h1 32/48、h2 24/36、h3 20/32、段落と箇条書き 16/28 にした（今まで段落は `1.75`、ほかは継承の 1.5。h3 が 30px、箇条書きが 24px だった）
  - 14px の文字は、1行のラベル（フッターのリンクとグループ名、SPOTLIGHT、色の名前など）は 20px、複数行になりうる注記（ツールの説明の補足、フッターの説明文）は `leading-6`（24px）にした
- E2E（`tests/e2e/typography.spec.js`）は、見えている文字すべてについて、役割をページから読み取って規則を確かめる。見出し（h1〜h6）は 1.5（36px 以上は 1.4）、等幅は 1.5、2行以上の文は 1.7 で、いずれも「最も小さい4の倍数」と一致すること。1行のラベルは 1.3 以上で4の倍数であること（1行に収まった段落は 28px のままでよいので「以上」）。14px の見出し（フッターのグループ名）はラベルとして扱う。どれも 14px 以上、等幅は 14〜16px。入力欄（`input`、`select`、`textarea`）の値も1行のラベルとして見る（レビューの推奨2）。対象は、ツールの4ページ（日英）、SVG 最適化と Favicon でファイルを読み込んだ後、`/credits`、`/privacy`、404、トップページ、作品のダイアログ、テーマと言語のメニュー、モバイルのメニュー。幅は 375px と 1280px
- 他の選択肢：既定を変えずに、すべての見出しに `leading-*` を書く（書き漏れが起きやすい）。読ませる文を既定にして、ラベルに `leading-6` を書く（ラベルのほうが多い）
- 戻すときの作業：`global.css` の3行を消し、`leading-6`／`leading-7` と `.prose` の `line-height` を戻す

## UR7-5 トップページ以外のページで変えた文字（指示5）

- 決めたこと：本文と UI の文字（ツールの見出し、ラベル、ボタン、トグル、スライダーのラベルと値、トースト、パンくず、SVG 最適化の結果のサイズの表）は 16px にした。14px のままにしたのは補足の文字で、注記（プライバシーの注意、プレビューの案内、履歴が空の案内、ヒント）、短いラベル（Favicon の「推奨サイズ」「その他のサイズ」、TW Palette の色の名前）、等幅のコードの値（シェード番号、BASE、Tailwind の設定のコード）。12px（`text-xs`）だったものは 14px にした
- パスワードの表示（等幅 18px）は 16px にした。指示5の「等幅は 14〜16px」に合わせた。行の高さは 1.5 で 24px
- パンくずの `leading-none`（行の高さ 16px）を外した（24px）。`truncate` で文字の下が切れないことは画面で確かめた
- 404 のボタンを 16px にしたので、見出しとボタンの下の文字のかたまりが 116px から 124px になった。惑星の大きさと持ち上げの計算（`--planet`、`--lift`）の定数を、同じ考え方で 16.5rem → 17.5rem、9.25rem → 9.75rem にした（既存の E2E の配置の検査が通ることで確かめた）
- TW Palette の「生成されたパレット」のラベル（BASE、50〜950）は、640px 未満で縦書き（下から読む。上のシェード番号の回転したラベルと同じ向き）にした。14px の等幅では、375px で12列の幅（約 25px）に「BASE」（約 34px）が入らず、番号どうしも詰まったため。縦書きは `writing-mode: vertical-rl` と 180° の回転で、ラベルの箱そのものが縦長になるので、回転（`rotate`）と違って重ならない。12px だった今までも、計算上は「BASE」（約 29px）が列に収まっていなかった
- 他の選択肢：補足の文字も 16px にする（指示5は 14px を許している）。TW Palette のラベルを 640px 未満で隠す、または「BASE」を短くする（文言の変更になる）
- 戻すときの作業：下の表の「前」に戻す

## UR7-6 トップページ、ヘッダー、フッター、ダイアログ（指示7）

- 指示7のとおりにした。カードのリンクの矢印は 14px から 16px（`size-4`）にした。フッターの説明文（14px、複数行）だけ、指示6の規則で `leading-6`（20px → 24px）にした。フッターの文字の大きさは変えていない
- 戻すときの作業：下の表の「前」に戻す

## UR7-7 変えた箇所の一覧（指示5〜7）

| 場所                                                                                                     | 前                            | 後                                                       |
| -------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| `global.css` の既定：`text-xl`／`text-2xl`／`text-4xl` の行の高さ                                        | 28px／32px／40px              | 32px／36px／52px                                         |
| ヒーローの見出し（28px）の行の高さ                                                                       | 36px                          | 44px                                                     |
| セクションの見出し（24px）                                                                               | 24/32                         | 24/36                                                    |
| 大きいカードの見出し（36px）                                                                             | 36/40                         | 36/52                                                    |
| カードの説明文                                                                                           | 16/24                         | 16/28                                                    |
| カードのリンクと矢印                                                                                     | 14/20、矢印 14px              | 16/24、矢印 16px                                         |
| ヘッダーのメニュー、言語のボタンの文字、言語とテーマのメニュー、モバイルのメニューの項目                 | 14/20                         | 16/24                                                    |
| ロゴタイプ（ヘッダー、モバイルのメニュー、フッター。20px）                                               | 20/28                         | 20/28（変えない）                                        |
| ダイアログの見出し（20px）                                                                               | 20/28                         | 20/32                                                    |
| ダイアログの本文                                                                                         | 14/22.75（`leading-relaxed`） | 16/28                                                    |
| フッターの説明文                                                                                         | 14/20                         | 14/24                                                    |
| `.prose` の h1／h2／h3                                                                                   | 32/48、24/36、20/30           | 32/48、24/36、20/32                                      |
| `.prose` の段落／箇条書き                                                                                | 16/28、16/24                  | 16/28、16/28                                             |
| ツールのページの見出し（24px）                                                                           | 24/32                         | 24/36                                                    |
| ツールのページの説明文                                                                                   | 16/24                         | 16/28                                                    |
| パンくず                                                                                                 | 14/14（`leading-none`）       | 16/24                                                    |
| ツールの節の見出し（h6）、ラベル、ボタン、トグル、スライダーのラベルと値、トースト、SVG 最適化の結果の表 | 14/20                         | 16/24                                                    |
| ツールのヒント、注記（`text-xs` だったもの）                                                             | 12/16                         | 14/24                                                    |
| ツールの注記（プライバシー、プレビューの案内、履歴が空の案内）                                           | 14/20                         | 14/24                                                    |
| Favicon の「推奨サイズ」「その他のサイズ」、TW Palette の色の名前                                        | 12/16                         | 14/20                                                    |
| TW Palette のシェード番号、BASE、Tailwind の設定のコード（等幅）                                         | 12/16                         | 14/24（生成されたパレットのラベルは 640px 未満で縦書き） |
| パスワードの表示（等幅）                                                                                 | 18/28                         | 16/24                                                    |
| 404 の見出し／ボタン                                                                                     | 24/32、14/20                  | 24/36、16/24                                             |
| ドロップのオーバーレイの文字（20px）                                                                     | 20/28                         | 20/32                                                    |

## 直した既存のテストと理由（R1）

| テスト                                                                                               | 直した内容と理由                                                                                                      |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `portfolio.test.js` の `ui-revise3 (user), ui-revise4 2, ui-revise5 5: the BOOTH product`            | 画像の高さを 1200 から 900 に（指示1）、`object-top` を `object-center` に（指示2）。名前に `ui-revise7 1 2` を足した |
| `portfolio.test.js` の `ui-revise3 1, ui-revise4 1, ui-revise5 1: the hero ...`                      | 文字が `text-base` で `text-sm` でないことを足した（指示4）                                                           |
| `works.spec.js` の `ui-revise3 1, ui-revise4 1, ui-revise5 1: the hero`                              | アイコンの大きさを 16px から 18px に（UR7-2）。文字が 16px、アイコンと文字の縦の中心、1行であることを足した           |
| `third-party-licenses.test.js` の `H4/H5: the list has exactly the packages ...`                     | `@fontsource/roboto-mono` を `@fontsource/geist-mono` に（指示3）                                                     |
| `build.test.js` の `A4: no Vercel references in build output and source`                             | UR7-3                                                                                                                 |
| `portfolio.test.js` の `ui-revise3 1, ...: the hero has the h1 ...`                                  | 見出しのクラスを `text-[1.75rem]/9` から `text-[1.75rem]/11` に（指示7）                                              |
| `portfolio.test.js` の `ui-revise4 2, ui-revise5 2, 6: the actions have Lucide's up-right arrow ...` | 矢印の大きさを `size-3.5` から `size-4` に（指示7）                                                                   |
| `works.spec.js` の `ui-revise5 6, 8: the actions' arrow is ... 14px ...`                             | 文字と矢印を 14px から 16px に（指示7）。名前に `ui-revise7 7` を足した                                               |
| `works.spec.js` の `light/dark: the photo cards and the list items share ...`                        | 説明文の行の高さを 24px から 28px に（指示7）                                                                         |
| `portfolio.test.js` の `ui-revise7 2`（レビューの任意の指摘）                                        | 任意値（`object-[...]`）と `object-position` も検出するようにした                                                     |
