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

## UR7-8 Tabler Icons への統一（指示8'）

- 決めたこと：
  - `@tabler/icons-react@3.49.0`（`dependencies`）と `@tabler/icons@3.49.0`（`devDependencies`。Astro の部品の写しの出どころ）を固定の版で入れ、`@heroicons/react` と `lucide-static` を消した
  - ツール（`src/tools/**`、`src/components/ui/**`）のアイコンは、`src/components/ui/icons.tsx`（MIT 側）から使う。ここで `@tabler/icons-react` のアイコンを包み、`aria-hidden="true"` を付ける。Heroicons の React 部品は `aria-hidden` を自分で付けていたが、Tabler の部品は付けないため。`@tabler/icons-react` を直接 import するのはこのファイルだけ（テストで確かめる）
  - Astro の部品は、パッケージの `icons/outline/*.svg` を写した（パスと属性はパッケージのまま。Tabler のファイルにある見えない外枠のパス `M0 0h24v24H0z` も含む）。名前を Tabler のアイコン名に合わせた：`Bars3Icon` → `MenuIcon`、`GlobeIcon` → `WorldIcon`、`XMarkIcon` → `XIcon`、`MoveUpRightIcon` → `ArrowUpRightIcon`（`SunIcon`、`MoonIcon`、`BoxIcon` はそのまま）。どれにも `data-icon`（Tabler の名前）を付けた。パンくずの矢印は、今までどおり `Breadcrumb.astro`（MIT 側）の中に写した
  - 大きさのクラスは変えていない。線の太さは既定の 2。`stroke-2` のクラス（Heroicons で線を太くしていたもの）は、同じ値なのでそのまま残した
  - LICENSE 第2節は、Heroicons と Lucide の2つを「Tabler Icons 3.49.0 (https://tabler.io/icons), from the npm package @tabler/icons」の1つにまとめた。対象は写した7つの部品と `Breadcrumb.astro`。`LICENSES/Heroicons-MIT.txt` と `LICENSES/Lucide-ISC.txt` を消し、`LICENSES/Tabler-MIT.txt`（パッケージの LICENSE そのまま。`@tabler/icons-react` も同じ文面）を足した。クレジットのページは、素材名「Tabler Icons 3.49.0」、著作者「Paweł Kuna」、ライセンス「MIT License」、参照先「https://tabler.io/icons」。README のライセンスの説明も合わせた
  - `/third-party-licenses.txt` には、バンドルに入る `@tabler/icons-react` と、HTML に写した `@tabler/icons`（`OUTSIDE_MODULE_GRAPH`。今までの `lucide-static` と同じ扱い）が載る
- 対応表（Heroicons / Lucide → Tabler、すべて outline）：

| 用途                                           | 前                                      | 後              |
| ---------------------------------------------- | --------------------------------------- | --------------- |
| モバイルのメニュー                             | Heroicons bars-3                        | menu-2          |
| 言語                                           | Heroicons globe-alt                     | world           |
| テーマ（ダーク）                               | Heroicons moon（solid）                 | moon            |
| テーマ（ライト）                               | Heroicons sun（solid）                  | sun             |
| 閉じる（メニュー、ダイアログ、トースト、履歴） | Heroicons x-mark                        | x               |
| パンくず                                       | Heroicons chevron-right                 | chevron-right   |
| 開閉（ツールのオプション）                     | Heroicons chevron-down（20 solid）      | chevron-down    |
| ドロップのオーバーレイ                         | Heroicons document-plus                 | file-plus       |
| トースト（成功）                               | Heroicons check-circle（solid）         | circle-check    |
| トースト（エラー）                             | Heroicons exclamation-circle（solid）   | alert-circle    |
| トースト（警告）、SVG の危険なオプション       | Heroicons exclamation-triangle（solid） | alert-triangle  |
| トースト（情報）                               | Heroicons information-circle（solid）   | info-circle     |
| プレビューの案内                               | Heroicons photo                         | photo           |
| 追加（画像を選ぶ、履歴に追加）                 | Heroicons plus                          | plus            |
| プライバシーの注意                             | Heroicons shield-check                  | shield-check    |
| 再生成、リセット                               | Heroicons arrow-path                    | refresh         |
| コピー                                         | Heroicons clipboard-document            | clipboard       |
| コピー済み                                     | Heroicons clipboard-document-check      | clipboard-check |
| 履歴を消す                                     | Heroicons trash                         | trash           |
| カードのリンクの矢印                           | Lucide move-up-right                    | arrow-up-right  |
| ヒーローの BOOTH                               | Lucide box                              | box             |

- 他の選択肢：ツールで `@tabler/icons-react` を直接 import し、使う場所ごとに `aria-hidden` を書く（書き漏れが起きやすい）。Astro の部品の名前を変えない（`XMarkIcon` が Tabler の `x` を描くなど、名前と中身がずれる）
- 戻すときの作業：`package.json`／`package-lock.json`、`src/components/icons/`、`Breadcrumb.astro`、`src/components/ui/icons.tsx` とその使い手、LICENSE 第2節、`LICENSES/`、`credits.ts`、README、`scripts/third-party-licenses.mjs` の `OUTSIDE_MODULE_GRAPH`、下の表のテストを戻す

## 直した既存のテストと理由（R1）

| テスト                                                                                                               | 直した内容と理由                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio.test.js` の `ui-revise3 (user), ui-revise4 2, ui-revise5 5: the BOOTH product`                            | 画像の高さを 1200 から 900 に（指示1）、`object-top` を `object-center` に（指示2）。名前に `ui-revise7 1 2` を足した                                                                           |
| `portfolio.test.js` の `ui-revise3 1, ui-revise4 1, ui-revise5 1: the hero ...`                                      | 文字が `text-base` で `text-sm` でないことを足した（指示4）                                                                                                                                     |
| `works.spec.js` の `ui-revise3 1, ui-revise4 1, ui-revise5 1: the hero`                                              | アイコンの大きさを 16px から 18px に（UR7-2）。文字が 16px、アイコンと文字の縦の中心、1行であることを足した                                                                                     |
| `third-party-licenses.test.js` の `H4/H5: the list has exactly the packages ...`                                     | `@fontsource/roboto-mono` を `@fontsource/geist-mono` に（指示3）                                                                                                                               |
| `build.test.js` の `A4: no Vercel references in build output and source`                                             | UR7-3                                                                                                                                                                                           |
| `portfolio.test.js` の `ui-revise3 1, ...: the hero has the h1 ...`                                                  | 見出しのクラスを `text-[1.75rem]/9` から `text-[1.75rem]/11` に（指示7）                                                                                                                        |
| `portfolio.test.js` の `ui-revise4 2, ui-revise5 2, 6: the actions have Lucide's up-right arrow ...`                 | 矢印の大きさを `size-3.5` から `size-4` に（指示7）                                                                                                                                             |
| `works.spec.js` の `ui-revise5 6, 8: the actions' arrow is ... 14px ...`                                             | 文字と矢印を 14px から 16px に（指示7）。名前に `ui-revise7 7` を足した                                                                                                                         |
| `works.spec.js` の `light/dark: the photo cards and the list items share ...`                                        | 説明文の行の高さを 24px から 28px に（指示7）                                                                                                                                                   |
| `portfolio.test.js` の `ui-revise7 2`（レビューの任意の指摘）                                                        | 任意値（`object-[...]`）と `object-position` も検出するようにした                                                                                                                               |
| `credits.test.js` の `ui-revise6 4, ui-revise7 9: the credits page has ... the character`                            | 権利表記を `© Lethal Cats` から `©Lethal Cats` に（指示9）。© のあとにスペースがないことを足した                                                                                                |
| `credits.test.js` の `licenseSources` と `the credited materials are the sources of section 2`                       | Copyright の年を範囲（`2020-2026`）でも読めるようにした。出どころの数の自己検査を4から3に（Heroicons と Lucide が Tabler Icons の1つになったため。UR7-8）                                       |
| `license.test.js` の F2（ライセンスファイルの一覧）と F3（`Heroicons and tailwindcss licenses are copied verbatim`） | Heroicons と Lucide のファイルを `LICENSES/Tabler-MIT.txt` に。F3 は Tabler と tailwindcss の LICENSE がパッケージと同じであることを見る（UR7-8）                                               |
| `license.test.js` の `ui-revise5 1, 6: the Lucide icons are from the pinned lucide-static ...`                       | `ui-revise7 8': the icons are Tabler Icons 3.49.0 ...` に置き換えた。版の固定、写した部品のパスがパッケージと同じこと、Heroicons・Lucide・Feather が LICENSE と `src/` に残っていないことを見る |
| `third-party-licenses.test.js` の H4、H4/H5、H5、`the reasons for the hand-listed packages still hold`               | `@heroicons/react` と `lucide-static` を `@tabler/icons-react` と `@tabler/icons` に。HTML に写したアイコンが各ページにあることを見る（UR7-8）                                                  |
| `portfolio.test.js` のヒーローと、カードのリンクの矢印のテスト                                                       | Lucide の box と move-up-right を、Tabler の box と arrow-up-right に。前の矢印（Heroicons、Lucide）とシェブロン（Heroicons、Tabler）がないことを見る                                           |
| `works.spec.js` の矢印の `data-icon`                                                                                 | `move-up-right` を `arrow-up-right` に                                                                                                                                                          |
