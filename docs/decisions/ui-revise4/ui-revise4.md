# UI の見直し（4回目）の判断ログ（ui-revise4）

計画：`ui-revise4/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。

## UR4-1 カードの行き先の決め方と、リンクのカードの形

- 決めたこと：
  - カードの行き先は `work-links.ts` の `cardTarget` が、作品のリンク（`linksOf`：ドキュメント、続いて主のリンク）から決める。リンクがなければ詳細（DIY Keyboards）、あれば先頭のリンク（Libraries はドキュメント、Apps はツールのページ、VR & 3D は BOOTH の商品）。操作のリンクは、行き先が2つ以上あるときだけ、全部（Libraries は「ドキュメント」「npm」または「PyPI」）を出す。カードのタイトルのリンクと「ドキュメント」の操作は同じ行き先になる（計画どおり）
  - `Work` の型を、カテゴリごとにリンクの有無を決める形にした。DIY Keyboards はリンクもドキュメントも持てない。Libraries・Apps・VR & 3D はリンクが必須。リンクのないリンクのカードや、リンクのある詳細のカードは型で作れない（`tests/types/works.ts`）
  - リンクのカードは、タイトルを `<a>`（`OpenLink.astro`）にし、詳細のボタンと同じく `::after` でカード全体を覆う。外部のリンクは新しいタブ、ツールのページは同じタブ。名前はタイトルだけ
  - リンクのカードには、タイトルの後ろに斜め矢印（↗、`text-gray-500`）を付けた。カードのホバーで右上に少し動く。Apps と VR & 3D は操作のリンクを出さないので、これがないとリンクだと分かる手がかりがなくなるため
  - 詳細のダイアログは、詳細を開くカード（DIY Keyboards）の分だけ作る。リンクの一覧は消した（DIY Keyboards はリンクを持たない）
- 他の選択肢：タイトルに矢印を付けず、Apps と VR & 3D にも「ツールを使う ↗」などを、リンクではない飾りの文字として出す（「詳しく見る」と同じ扱い）
- 戻すときの作業：`OpenLink.astro` の矢印を消す。詳細に戻すなら `CardTitle.astro` で `OpenDetails` に戻し、`WorkDialog` にリンクを戻す

## UR4-2 データの整理：年、サブ分類、詳細の説明文、`thirdPartyImage`

- 決めたこと：
  - 年（`year`）を `Work` の型とデータから消した（表示しないため）。実際の商品の年（2026、親の仮）も消えた
  - VR & 3D のサブ分類（`subcategory`、`vr3dSubcategories`、文言の「アバター」「アセット」「Unityツール」、`data-subcategory`）を、型・データ・文言から消した。商品が1つになり、表示もしないため
  - ダミーの商品3件と、その画像 `src/assets/works/dummy.svg`、文言を消した
  - 詳細を開かなくなった作品（Libraries、Apps、VR & 3D）の説明文（`description`）を `messages.works` から消した。詳細のダイアログは、説明文のない作品ではビルドを止める。消えた文面（Libraries の説明、実際の商品の説明「ムルルに、まばたき機能と…」）は git の履歴（`540c9ab` 以前）にある
  - 写真の拡大をやめたので、`thirdPartyImage` と `photoHover` を消した。画像を `src/assets/works/third-party/` に置くこと（LICENSE 第3節）と、上を基準に切り抜くこと（`imagePosition: "top"`）は残した
- 他の選択肢：型とデータは残し、表示だけやめる
- 戻すときの作業：`works.ts`・`ja.ts`・`tests/types/works.ts` を `540c9ab` から戻し、表示する部品に足す

## UR4-3 ホバーの統一で、写真のカードの枠の色の変化もやめた

- 決めたこと：全カードのホバーを `card-classes.ts` の `cardHover`（liblab の `transition-colors`、`hover:bg-gray-100`、`dark:hover:bg-atom-one-dark-light`、タイトルにキーボードのフォーカスがあるときも同じ背景）の1つにした。写真のカードの浮き上がり・影・画像の拡大に加えて、ホバーで枠の色が濃くなる変化（`hover:border-gray-300`）もやめた。枠そのものは残した。キーボードのフォーカスの条件は、ボタンとリンクの両方に効くよう `has-[h3_:focus-visible]`（タイトルの中のフォーカス）にした
- 根拠：計画の「背景色が変わる動きに揃える」。E2E で、ホバーの前後で枠の色・影・位置・画像の拡大が変わらないことを確かめる
- 戻すときの作業：`FrameCard`・`FeaturedCard` に `hover:border-*` を戻す

## UR4-4 リンクのアイコン

- 決めたこと：Heroicons v2.2.0 の `arrow-up-right`（24 outline）を `src/components/icons/ArrowUpRightIcon.astro` に置き、LICENSE 第2節の Heroicons の一覧に足した。使わなくなった `ChevronRightIcon.astro` は消し、一覧からも外した。操作のリンクの矢印は自分のホバーで、タイトルの矢印はカードのホバーで右上に動く（前のシェブロンが右に動いていたのと同じ考え）。「詳しく見る」は詳細を開くボタンの一部なので矢印を付けない。ホバーで下線が付くのは今までどおり
- 戻すときの作業：アイコンの部品と LICENSE の行を戻す

## UR4-5 ヒーロー：テキストボタンの形（本番は仮に B）

- 決めたこと：ボタンを、背景と枠のない文字だけのボタンにした（`inline-flex`、`px-3 py-2`、`text-sm font-semibold`、文字色は見出しと同じ `gray-900` / `white`、ホバーで下線、フォーカスは今までどおり `sky-500` の輪）。間隔は `gap-4` から `gap-2`（ボタンの内側に余白ができたため）。本番は計画どおり仮に B（文字＋斜め矢印 ↗、カードのリンクと同じ `ArrowUpRightIcon`）。見本ページの A・C も同じ形で、アイコンだけが違う（UR4-7）。シンボルを消したあとの見出しの下の余白（`mb-8`）は変えていない
- 根拠：「テキストボタン」を、前の丸いピル（白の半透明の背景と枠）をやめて文字とアイコンだけにする、と解釈した
- 他の選択肢：ピルの形のまま中身だけ A・B・C にする
- 戻すときの作業：`index.astro` のボタンのクラスを戻す。ユーザーが A か C を選んだら、アイコンを差し替える（A は GitHub のマークを戻すので、LICENSE 第3節も UR4-7 のとおりに直す）

## UR4-6 フッター：4列のグリッド

- 決めたこと：`md` 以上を `md:grid-cols-4` にし、ブランドと説明文の列を `md:col-span-2`、Links と残りのグループ（支援・プライバシーポリシー）を1列ずつにした。Links の右寄せ（`md:justify-self-end`、UR3-2）はやめ、セルの中は左寄せ。`md` 未満は liblab と同じ1列（`grid-cols-1 gap-8`）で、ブランド、Links、支援の順に積む。列の間隔（`lg:gap-12`）は今までどおり
- 根拠：計画の3。4つの等しい列にブランドが2列分を占めるので、ブランドの幅は2列と間隔1つ分になる（`2fr_1fr_1fr` の3列とは、間隔の分だけ幅が違う）
- 戻すときの作業：`Footer.astro` のクラスを戻す

## UR4-7 見本ページ `/mock/hero-buttons`（ブランチ `mock/hero-buttons` だけ）

- 決めたこと：
  - プレビュー用の worktree（`%TEMP%\claude\me-preview`）で、`577cef0` からローカルブランチ `mock/hero-buttons` を作り、コミット `9dea31a`・`7dc9338` に置いた（push していない）。本番のブランチには入れていない
  - ページは、トップのヒーロー（波の背景、見出し、ボタン）を枠に入れて A・B・C の順に縦に3つ並べたもの。ボタンの形は本番（UR4-5）と同じで、アイコンだけが違う。A は GitHub が公式のマーク（`17d3061` で消した `GitHubIcon.astro` を戻した）、BOOTH は Heroicons の `building-storefront`。B は `arrow-up-right`、C は `link`。アイコンはどれも `size-4`。見出しは `h1` ではなく `p` にした（1ページに見出しの `h1` が3つになるため）
  - `noindex`：`BaseLayout` に `noindex` を足し、このページだけ `<meta name="robots" content="noindex">` を出す。`canonical` はなし。`astro.config.mjs` の sitemap で `/mock/` を除いた
  - ライセンス：`GitHubIcon.astro` を LICENSE 第3節（他のサービスのロゴ）に名前で書き、ファイルの先頭にも GitHub, Inc. の商標であることを書いた。`LinkIcon.astro`・`BuildingStorefrontIcon.astro` は第2節の Heroicons の一覧に足した。`license.test.js` に、第3節に GitHub のマークの名前があり、他の節にないことを見るテストを足した
  - 確かめたこと：worktree でビルドし（ポート 8790 の親のサーバーはそのまま）、`http://localhost:8790/mock/hero-buttons` を幅 375px と 1280px、ライトとダークで撮って、3つの案が並び、横のスクロールがないことを目で確かめた。`npm test` は、見本ページが増えたことで、ページの一覧（`the build has the pages this test suite expects`）と、全ページの canonical・サイト名のテスト（`C2`、`ui-revise2 4: the site name ...`）の3つが落ちる。見本のブランチにしかないページのため、本番のテストは変えていない。lint と format:check は通る
- 戻すときの作業：ブランチ `mock/hero-buttons` を消す。ユーザーが A を選んだ場合は、このブランチの `GitHubIcon.astro`・`BuildingStorefrontIcon.astro` と LICENSE・テストの変更を本番に持ってくる

## 直した既存のテストと理由（N1）

| テスト                                                                                                                                                                       | 直した内容と理由                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `portfolio.test.js` の `D3: the apps section's details link to the four tools under /lab`                                                                                    | `D3, ui-revise4 2: each app card links to its tool, in the same tab` にした（詳細をやめた。指示2の2）                                                                                                                                |
| `portfolio.test.js` の `D4: the VR & 3D section has the real product first, then one dummy work per subcategory, ...`                                                        | `ui-revise4 2: VR & 3D has the real product only, without subcategories or dummies` にした（指示2の4・2の5）                                                                                                                         |
| `portfolio.test.js` の `ui-revise3 (user): the BOOTH product: its card, details, link and image`                                                                             | 詳細・年・サブ分類の確認を外し、カードが BOOTH の商品に新しいタブで直接飛ぶこと、操作のリンクがないことを見るようにした（指示2の2〜2の4）                                                                                            |
| `portfolio.test.js` の `ui-revise3 (parent): only the images with other creators' material are not zoomed on hover`                                                          | `ui-revise4 2: every card has the same hover; no photo zooms and no card lifts` に置き換えた（どの写真も拡大しない。指示2の1）                                                                                                       |
| `portfolio.test.js` の `D4: only VR & 3D works have a subcategory`                                                                                                           | 消した。サブ分類がないことは上の VR & 3D のテストで見る（指示2の4）                                                                                                                                                                  |
| `portfolio.test.js` の `ui-revise2 3: Apps and Libraries use the tool card, ...`                                                                                             | 写真のカードの `<time>` の確認を外した（指示2の3）                                                                                                                                                                                   |
| `portfolio.test.js` の `ui-revise2 3: every card shows its one-line summary and opens its details`                                                                           | `ui-revise2 3, ui-revise4 2: the DIY Keyboards cards open their details; the other cards have none` にした。詳細を開くのは DIY Keyboards だけ、作品の数は 15 から 12（指示2の2・2の5）。浮き上がりの確認は上のホバーのテストに移した |
| `portfolio.test.js` の `ui-revise3 (parent): the card and the details have the same links, labels and order`                                                                 | 消した。詳細にリンクがなくなった（DIY Keyboards の詳細にリンクがないことは上のテストで見る）                                                                                                                                         |
| `portfolio.test.js` の `ui-revise2 3: the details link to where each work is published` と `ui-revise3 3: every card shows the title, the summary, the year and its actions` | `ui-revise4 2: a card goes to its place directly; actions only where there are two places` と `ui-revise4 3: no card and no details show a year` にした（指示2の2・2の3）                                                            |
| `portfolio.test.js` の `ui-revise3 3: the photo cards and the list items share ...`                                                                                          | 「詳しく見る」の確認を、それがあるカードだけにした（指示2の2）                                                                                                                                                                       |
| `portfolio.test.js` の `ui-revise3 3: the list items take the former tool site's card hover, without the lift`                                                               | ホバーの確認を全カードのテストに移し、余白とアイコンの色だけを見るようにした（指示2の1）                                                                                                                                             |
| `portfolio.test.js` の `D5: the three documentation links point to docs.unlibra.com`                                                                                         | ドキュメントのリンクがカードに2つ（タイトルと操作）、詳細に0になった（指示2の2）                                                                                                                                                     |
| `tools.test.js` の `E8: the tools are linked from the top page in Japanese, not from the header`                                                                             | トップから日本語のツールのページへのリンクを2つから1つ（カードのタイトル）にした（指示2の2）                                                                                                                                         |
| `tests/types/works.ts`                                                                                                                                                       | 年とサブ分類の型のテストを、「年・サブ分類を持てない」「リンクのカードはリンクが必須、DIY Keyboards はリンクを持てない」に置き換えた（UR4-1・UR4-2）                                                                                 |
| `works.spec.js` の `Enter on the focused title opens the details; ...`                                                                                                       | Apps（SVG最適化）から DIY Keyboards（没キーボード）にし、詳細のリンクの確認を外した（指示2の2）                                                                                                                                      |
| `works.spec.js` の `every card says it opens details; the photo cards lift on hover`                                                                                         | `ui-revise4 2: every card is clickable as a whole; only DIY Keyboards say 詳しく見る` にした（指示2の1・2の2）                                                                                                                       |
| `works.spec.js` の `{375,1280}px, {light,dark}: no horizontal scroll, with and without a dialog`                                                                             | 詳細を開く作品を `@i18n-tiny/next` から `mira zero` にした（指示2の2）                                                                                                                                                               |
| `works.spec.js` の `{light,dark}: the list items fade in the former tool site's background ...`                                                                              | 全カード（大きなカード、写真のカード、VR & 3D、Libraries、Apps）で、同じトランジションと背景になり、位置・影・枠の色・画像が変わらないことを見るようにした（指示2の1）                                                               |
| `works.spec.js` の `{light,dark}: the photo cards and the list items share ...`                                                                                              | リンクの見た目を「詳しく見る」と操作のリンクのすべてで比べるようにした（「詳しく見る」は DIY Keyboards だけになった）                                                                                                                |
| `works.spec.js` の `the links move their chevron on hover: ...`                                                                                                              | 斜め矢印（`data-icon="arrow-up-right"`）が動くことを見るようにした（指示2の6）                                                                                                                                                       |
| `works.spec.js` の `an action goes to its place directly; elsewhere the card opens the details`                                                                              | `ui-revise4 2: a click on a card goes to its place; an action goes to its own` にした。操作のリンクは 14 から 6、カードのクリックでドキュメント・BOOTH（新しいタブ）とツールのページ（同じタブ）に飛ぶ（指示2の2）                   |
| `works.spec.js` の `ui-revise3 (parent): an image with other creators' material is not zoomed on hover; ...`                                                                 | 消した。どの写真も拡大しないことは上のホバーのテストで見る（指示2の1）                                                                                                                                                               |
| `portfolio.test.js` の `ui-revise3 1: the hero has the symbol, the h1 in the body font and the GitHub and BOOTH buttons`                                                     | `ui-revise3 1, ui-revise4 1: ... without the symbol` にした。シンボルがないこと、`h1` の大きさが `text-2xl` だけであること、ボタンが斜め矢印付きで背景と枠がないことを見る（指示1）                                                  |
| `layout.test.js` の `ui-revise3 2: the footer's Links group is at the right end of the center column`                                                                        | `ui-revise4 3: the footer is a grid of four columns, 2:1:1, with the cells left-aligned` に置き換えた（指示3）                                                                                                                       |
| `works.spec.js` の `ui-revise3 2: the footer's Links group is at the right end of the center column`                                                                         | `ui-revise4 3: the footer's grid` の2つ（1280px で4つの等しい列にブランドが2列・Links と支援が1列ずつで左寄せ、375px で1列に積む）に置き換えた（指示3）                                                                              |
| `works.spec.js` の `ui-revise3 1: the hero › {375,1280}px: ...`                                                                                                              | シンボルがないこと、`h1` が 24px であること、ボタンに背景・影がなく矢印があることを足した（指示1）                                                                                                                                   |
| `header.spec.js` の `brand symbol › /: the circle and the mark swap colors in dark mode`                                                                                     | トップのシンボルの数を4から3にした（ヒーローのシンボルを消した。指示1の1）                                                                                                                                                           |

## 新しい文言（すべて仮の文面、N5）

| 場所                                           | 文言                                                                                                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Apps のカードの要約                            | liblab のツールカードの説明文（`tools.{id}.description` の改行を除いたもの）をそのまま使った。新しい文面ではない |
| 見本ページの title（`mock/hero-buttons` だけ） | ヒーローのボタンの比較 - unlibra                                                                                 |
| 見本ページの description                       | ヒーローの GitHub と BOOTH のボタンの3つの案を並べた見本です。                                                   |
| 見本ページの各案の見出し                       | A：ロゴ＋テキスト / B：テキスト＋斜め矢印（↗） / C：テキスト＋リンクのアイコン                                   |
| 見本ページの注記                               | A の BOOTH は公式ロゴではなく、Heroicons の「building-storefront」（お店）です。                                 |

カードとヒーローのボタンの文言（「詳しく見る」「ドキュメント」「npm」「PyPI」「GitHub」「BOOTH」）は既存のもの。「ツールを使う」「BOOTH で見る」はカードと詳細から出なくなった（文言の定義は `work-links.ts` の名前の表に残っている）。
