# UI の見直し（5回目）の判断ログ（ui-revise5）

計画：`ui-revise5/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。

## UR5-1 ヒーローのボタン（パターン A）と Lucide のライセンス

- 決めたこと：
  - GitHub のマークは見本ブランチ（`mock/hero-buttons-latest`）の `GitHubIcon.astro` をそのまま持ってきて、テスト用に `data-icon="github"` だけ足した。LICENSE 第3節の記述と、`license.test.js` の第3節のテストも見本ブランチのものを持ってきた
  - BOOTH は Lucide の `shopping-bag` を `ShoppingBagIcon.astro` に写した。出どころは npm の `lucide-static`。版は、公開から2週間以上たっている `1.52.0`（2026-10-04 公開）にし、devDependencies に `"1.52.0"`（`^` なし）で固定した。最新は 1.61.0（2026-10-21）
  - `lucide-static` の LICENSE は、Lucide の ISC に加えて、Feather 由来のアイコンの MIT（Copyright (c) 2013-present Cole Bemis）を含む。`shopping-bag` は Feather 由来の一覧に入っているので、ファイル全体をそのまま `LICENSES/Lucide-ISC.txt` に写した（ファイル名は計画どおり ISC）。LICENSE 第2節とアイコンのコメントにも、ISC と Feather の MIT の両方を書いた
  - アイコンは HTML に入ってサイトから配られるので、`scripts/third-party-licenses.mjs` の `OUTSIDE_MODULE_GRAPH` に `lucide-static` を足し、`/third-party-licenses.txt` にも載るようにした（Heroicons は `@heroicons/react` がツールのページの JS に入るので、もともと載っている）
  - ボタンの形（文字だけのボタン、`gap-1`、アイコン `size-4`）は見本の A と同じ。アイコンは文字の前
- 根拠：ISC も MIT も、配る複製に著作権表示と許諾の文を含めることを求めている
- 他の選択肢：`lucide-static` を入れずに SVG だけ写す（ライセンスの全文が元のファイルと同じかをテストで確かめられない）。`/third-party-licenses.txt` には載せない（リポジトリの LICENSE だけで示す）
- 戻すときの作業：`OUTSIDE_MODULE_GRAPH` の1行と、テストの期待値（`third-party-licenses.test.js` の一覧、H5、「hand-listed packages」）を戻す。アイコンを差し替えるときは、`ShoppingBagIcon.astro` を写し直し、LICENSE と `license.test.js` の版とファイル名を直す

## UR5-2 カードのリンクの形：全部を操作のリンクとして出し、1番目を「主」にする

- 決めたこと：
  - リンクのある作品は、リンクを全部カードに出す（Apps は「アプリを開く」の1つ、Libraries は「npm / PyPI」と「ドキュメント」、VR & 3D は「BOOTH で見る」と「ドキュメント」）。前回までの「行き先が2つ以上のときだけ出す」はやめた（指示9で Apps にもリンクを出すため）
  - 並びは主のリンク、ドキュメントの順（指示10）。カードのクリック（タイトルの `<a>` の `::after`）は1番目と同じ行き先
  - 1番目の操作のリンクに `data-work-action="primary"`、2番目以降に `"secondary"` を付けた。1番目はカードのホバーで下線が付く（`group-hover:underline`）。ただし、ポインターが2番目以降のリンクの上にあるときは、1番目の下線を消す（`group-has-[[data-work-action=secondary]:hover]:no-underline`）。そのときクリックで開くのは2番目のほうなので、1番目に下線が残ると行き先を取り違えるため
  - DIY Keyboards の「詳しく見る」も同じクラス（`primaryLink`）にした（今までどおりカードのホバーで下線）
  - キーボードでタイトルにフォーカスがあるときは、1番目に下線を付けていない（背景の色は今までどおり変わる）
  - 矢印は、自分のホバーで右上に動くのを続けた。カードのホバーでは動かない（タイトルの矢印をやめたので、カードのホバーで動く矢印はなくなった）
- 他の選択肢：2番目にポインターがあっても1番目の下線を残す（指示の文面どおりだが、行き先と見た目がずれる）。1番目の矢印もカードのホバーで動かす
- 戻すときの作業：`card-classes.ts` の `primaryLink` から `group-has-…` を消す。行き先が1つのときに出さないなら `work-links.ts` の `cardTarget` を戻す

## UR5-3 矢印の大きさと揃え

- 決めたこと：操作のリンクの矢印を `size-4` から `size-3.5`（14px、文字の大きさ `text-sm` と同じ）にした。上下の揃えは今までの `inline-flex items-center` のまま。E2E で、12個のリンクで矢印の箱が 14×14px であり、矢印の中心と文字の行の中心の差が 0.5px 以内であることを確かめた
- 戻すときの作業：`actionArrow` の大きさを戻す

## UR5-4 404：惑星と文字をひとまとまりにして、真ん中より少し上に置く

- 決めたこと：
  - 縦積みの画面では、惑星だけを画面の真ん中に置いて文字をその下にぶら下げる作り（`absolute`）をやめ、惑星・見出し・ボタンを1つのまとまり（縦の flex）にして、まとまりを画面の真ん中に置いた。そのうえで、下の余白を最大 `8dvh` 足して、少し上に寄せた（`padding-bottom: min(8dvh, max(0px, 100dvh - 惑星 - 9.25rem))`。まとまりと上下 1rem の余白が収まる範囲でだけ足す）
  - 惑星の大きさの式は変えていない（短い辺の 40〜50% のテストのため）
  - 横並びの画面（低くて横長）は今までどおり真ん中で、上には寄せない
  - 375×667 で惑星の中心は 333px から約 249px に、1280×800 で 400px から約 310px に上がる
- 根拠：「全体的に上へ」「下に寄りすぎている」。まとまりを真ん中にしただけでも上がるが、目で見たときの中心は幾何の中心より少し上のため、少し持ち上げた
- 他の選択肢：まとまりをちょうど真ん中に置く（持ち上げない）。もっと上（たとえば画面の上から 1/3）に置く
- 戻すときの作業：`404.astro` の `--lift` と `padding-bottom` を消す（ちょうど真ん中になる）。前の形に戻すなら `.caption` を `absolute` に戻す

## UR5-5 DIY Keyboards のセクションを 24px 下げる方法

- 決めたこと：セクションを包む `div` に `pt-6`（24px）を足した。マージン（`mt-6`）だと、ヒーローの `mb-12` / `sm:mb-16` と相殺されて下がらないため。ヒーローの下端からセクションの上端まで、幅 640px 未満で 72px、以上で 88px になる。ヘッダーの「DIY Keyboards」のリンクで飛んだときの位置は変わらない（セクションの上端に `scroll-mt-4`）
- 戻すときの作業：`index.astro` の `pt-6` を消す

## UR5-6 「SPOTLIGHT」の見た目と、見出しの大きさ

- 決めたこと：以前の年と同じ位置・色（`text-sm`、`text-gray-500` / `dark:text-gray-400`）に、`font-semibold` と `tracking-widest` を足した。ふつうの `<p>` で、読み上げにも出る。見出しは幅にかかわらず `text-4xl`（36px）にした（前は `text-2xl sm:text-3xl`）
- 他の選択肢：ブランドの色にする。読み上げから隠す
- 戻すときの作業：`FeaturedCard.astro` の `<p data-work-spotlight>` と見出しのクラスを戻す

## UR5-7 アイコンの形と枠

- 決めたこと：Apps のアイコンの背景を `rounded-full`（円）にした。Libraries のロゴの背景は角丸（`rounded-card`）のまま、`ring-1`（枠）を消した。Apps には枠がもともとなかった。ライトのテーマでは、Libraries のロゴの白い背景がカードの白と区切れなくなる（指示どおり）
- 戻すときの作業：`WorkIcon.astro` のクラスを戻す

## UR5-8 見本ページ（ブランチ `mock/ui-revise5` だけ）

- 決めたこと：
  - プレビュー用の worktree（`%TEMP%\claude\me-preview`）で、`ef5b443` からローカルブランチ `mock/ui-revise5` を作り、コミット `f0b95aa`・`b94a0cf` に置いた（push していない）。`noindex` とサイトマップからの除外は、前回の見本（`mock/hero-buttons-latest`）の `BaseLayout.astro`・`astro.config.mjs` の変更をそのまま持ってきた
  - `/mock/booth-icons`：4つのアイコン（`handbag`、`shopping-bag`（本番の今）、`package`、`box`）ごとに、トップのヒーロー（波の背景、見出し、GitHub と BOOTH のボタン）をライトとダークで横に並べた（幅が狭いときは縦）。ライトとダークを同時に見せるため、パネルは `dark:` を使わず、それぞれの配色のクラスを直接書いた。ボタンの形と大きさは本番と同じ。3つのアイコンは `lucide-static` 1.52.0 から写し、LICENSE 第2節の Lucide の一覧に足した（見本のブランチだけ）
  - `/mock/featured-cards`：fosty natural で、参考（本番の今の形＝1 から枠線を消したもの）と、1〜5 の案を縦に並べた。1：枠線あり（12 の前）、2：枠線なし＋細い斜線の網掛け、3：写真を全面に敷いて下から暗くし、白い文字を重ねる、4：ブランドの淡い色（ダークは一段明るい灰色）の面の内側に写真を角丸で置く、5：写真の右下に文字の面をずらして重ねる（幅が狭いときは写真の下に食い込ませる）。どの案も見出し `text-4xl`、「SPOTLIGHT」、カードのホバーで「詳しく見る」に下線（本番の `primaryLink`）。タイトルは本番と同じくカード全体を覆うボタンだが、詳細は開かない。5 だけは、クリックできる範囲が文字の面だけになる（見本の注記に書いた）
  - 確かめたこと：worktree でビルドし（ポート 8790 の親のサーバーはそのまま）、`http://localhost:8790/mock/booth-icons`・`/mock/featured-cards` を幅 375px と 1280px、ライトとダークで撮って目で見た（3 の案が 375px で文字が写真からはみ出していたので、幅が狭いときは高さを `min-h-112` にして直した）。lint と format:check は通る。`npm test` は、見本のページが増えたことで、ページの一覧・canonical・サイト名のテスト3つが落ちる（前回の見本と同じ。本番のテストは変えていない）。Lucide のテストは、見本のブランチでアイコンが4つになるよう直した
- 戻すときの作業：ブランチ `mock/ui-revise5` を消す。ユーザーが `shopping-bag` 以外を選んだら、そのアイコンのファイルを本番に持ってきて、`index.astro`・LICENSE・テストを直す

## UR5-9 ユーザーの判断を受けた追加（レビュー後、2026-10-23）

ユーザーの判断：BOOTH は Lucide の `box`、大サイズのカードは見本の案4を薄いグレーで、2番目のリンクにポインターがあるとき1番目の下線を消す動き（UR5-2）と 404 の位置（UR5-4）はそのまま、リンクの矢印を動かさず下線にアニメーション、矢印を Lucide の `move-up-right`、ヒーローの見出しを 28px。

- アイコン：`ShoppingBagIcon.astro` と、使わなくなった Heroicons の `ArrowUpRightIcon.astro` を消し、Lucide の `box`（`BoxIcon.astro`）と `move-up-right`（`MoveUpRightIcon.astro`）を `lucide-static` 1.52.0 から写した。どちらも Feather 由来の一覧に入っていない（ISC だけ）ので、LICENSE 第2節とアイコンのコメントから Feather（MIT、Cole Bemis）の記述を外した。`LICENSES/Lucide-ISC.txt` はパッケージのファイルの全文のまま（Feather の部分も含む）。Heroicons はほかのアイコン（Bars3、Globe、Moon、Sun、XMark、Breadcrumb）で使っているので、第2節の Heroicons の項は残し、`ArrowUpRightIcon.astro` の行だけ消した。`/third-party-licenses.txt` の `@heroicons/react` は、ツールのページの JS に入っているので変わらない。`OUTSIDE_MODULE_GRAPH` の `lucide-static` の説明を2つのアイコンに直した
- 下線のアニメーション：カードのリンク（操作のリンクと「詳しく見る」）の文字を `<span data-link-text>` で包み、下線を `text-decoration` ではなく、文字の色の 1px の背景（`bg-linear-to-r from-current to-current`、左下に置き、幅 0% → 100%）にした。幅の変化に 200ms の `ease-out` のトランジションを付け、`prefers-reduced-motion: reduce` ではトランジションをなくした（下線はすぐに出る）。下線を付ける条件は前と同じ（操作のリンクは自分のホバー、1番目はカードのホバーでも、2番目以降にポインターがあるときは1番目に付けない）。矢印の動き（`translate`）はやめた。下線は文字の箱の下端（行の高さ 20px の下）にあり、`text-decoration` の下線よりやや下になる
  - 対象はカードのリンクだけにした。ヒーローの GitHub・BOOTH のボタン、フッター、ヘッダーのリンクは今までどおり `hover:underline`（指示の「リンクの矢印」「カードのホバーで1番目のリンクに付く下線」をカードのリンクのことと解釈した）
- 大サイズのカード（案4、薄いグレー）：カードを薄いグレーの面にし（`p-4 sm:p-6`、`gap-6`）、写真をその内側に角丸で置いた（見本の案4の形）。色はライトが `gray-50`、ホバーとタイトルのフォーカスで `gray-100`。ダークがページ（`atom-one-dark`、#282c34）より一段明るい `atom-one-dark-light`（#333842）、ホバーでさらに一段明るい `atom-one-dark-lighter`（#3d4148）。トランジションはほかのカードと同じ `transition-colors`（150ms）
  - ライトを `gray-100`（ホバー `gray-200`）にしなかった理由：リンクの色（`logo-dark`、#1a7ba0）と「SPOTLIGHT」（`gray-500`）のコントラストが `gray-100` で 4.35・4.39、`gray-200` で 3.87・3.91 になり、ふだんの状態で 4.5:1 を下回るため。`gray-50` では 4.5:1 以上で、ホバーの `gray-100` はほかのカードのホバーと同じ色（同じ 4.35）
  - ダークの見え方：一段明るい灰色の面がページの暗い背景から浮いて見え、写真の周りの余白が額縁のように見える。案4の見本のダークと同じ色。リンク（`logo-light`）は面の上で 6.69、ホバーで 5.83。「SPOTLIGHT」と要約（`gray-400`）は面の上で 4.52、ホバーの間だけ 3.94 になる（ほかのカードのホバーでも同じ `gray-400` が #333842 の上で 4.52）
  - 写真の枠は白（ダークは `atom-one-dark`）にした。写真のない作品（アイコン）が大サイズになったとき、アイコンが面の色に溶けないため
- ヒーローの見出し：`text-[1.75rem]/9`（28px、行の高さ 36px）。Tailwind の既定の大きさに 28px がないため任意の値にした。375px でも1行に収まる
- 他の選択肢：ライトの面を `gray-100` にする（ふだんのコントラストが 4.5:1 を下回る）。下線を `text-decoration` のまま `text-underline-offset` などで動かす（伸びる動きは作れない）。ヒーローのボタンにも同じ下線のアニメーションを付ける
- 戻すときの作業：アイコンは `git show ef5b443:<path>` で戻す（LICENSE とテストも）。下線は `card-classes.ts` の `linkText`・`actionText`・`primaryText` を `hover:underline` に戻し、`CardLinks.astro`・`MoreLabel.astro` の `<span>` を外す。大サイズのカードは `FeaturedCard.astro` と `featuredSurface` を戻す。見出しは `text-2xl` に戻す

## 直した既存のテストと理由（P1）

| テスト                                                                                                                                                                   | 直した内容と理由                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `portfolio.test.js` の `ui-revise3 1, ui-revise4 1: the hero has ...`                                                                                                    | ボタンが斜め矢印付きであることの確認を、GitHub のマーク・Lucide の `shopping-bag`（パッケージのファイルとパスが同じ）が文字の前にあり、矢印がないことに変えた（指示1）                                                                                                                         |
| `portfolio.test.js` の `ui-revise3 (user), ui-revise4 2: the BOOTH product ...`                                                                                          | 操作のリンクがないことの確認を、「BOOTH で見る」「ドキュメント」の順にあることに変えた（指示5）                                                                                                                                                                                                |
| `portfolio.test.js` の `ui-revise2 3: Apps and Libraries use the tool card, ...`                                                                                         | アイコンの背景の角丸を、Apps は `rounded-full` にした（指示6）                                                                                                                                                                                                                                 |
| `portfolio.test.js` の `ui-revise4 2: a card goes to its place directly; actions only where there are two places`                                                        | `ui-revise4 2, ui-revise5 9, 10, 11: a card goes to its first link; every link is an action, the first one first` にした。タイトルの行き先が1番目のリンク、全カードにリンクの行、順番と文言（指示9〜11）                                                                                       |
| `portfolio.test.js` の `ui-revise4 2: the links have the up-right arrow, ...`                                                                                            | タイトルに矢印がないこと、操作のリンクの矢印が `size-3.5` であることを足し、数を 8+6 から 12 にした（指示2・8）                                                                                                                                                                                |
| `portfolio.test.js` の `ui-revise3 3: the photo cards and the list items share the ... classes`                                                                          | アイコンの背景の角丸を、Apps は `rounded-full` にした（指示6）                                                                                                                                                                                                                                 |
| `portfolio.test.js` の `D5: the three documentation links point to docs.unlibra.com`                                                                                     | ムルル対応ツールのドキュメントを足して4つにし、カードに2回（タイトルと操作）から1回（操作）にした（指示5・10）                                                                                                                                                                                 |
| `tools.test.js` の `E8: the tools are linked from the top page in Japanese, not from the header`                                                                         | トップからツールのページへのリンクを1つから2つ（タイトルと「アプリを開く」）にした（指示9）                                                                                                                                                                                                    |
| `license.test.js` の `F2: listed third-party files exist and start with their attribution`                                                                               | 第三者の出典の一覧に `LICENSES/Lucide-ISC.txt` を足した（指示1）                                                                                                                                                                                                                               |
| `third-party-licenses.test.js` の `H4/H5: the list has exactly the packages ...`、`H5: no build-only package ...`、`the reasons for the hand-listed packages still hold` | `lucide-static` を一覧と `OUTSIDE_MODULE_GRAPH` に足し、H5 の対象から外した。アイコンがトップの HTML にあることを確かめるようにした（UR5-1）                                                                                                                                                   |
| `works.spec.js` の `{light,dark}: the photo cards and the list items share ...`                                                                                          | Apps のアイコンの角丸を「円」にした（指示6）                                                                                                                                                                                                                                                   |
| `works.spec.js` の `ui-revise4 2: the links' up-right arrow moves on hover: ...`                                                                                         | `ui-revise5 11: the card's hover underlines its first link only; ...` にした。タイトルの矢印がないこと、カードのホバーで1番目だけに下線、2番目のホバーでは1番目の下線が消えること（指示2・11）                                                                                                 |
| `works.spec.js` の `ui-revise4 2: a click on a card goes to its place; an action goes to its own`                                                                        | 操作のリンクを 6 から 12 にし、カードのクリックが1番目（npm、PyPI、BOOTH、アプリ）に飛ぶこと、「アプリを開く」とムルル対応ツールのドキュメントを足した（指示5・9〜11）                                                                                                                         |
| `works.spec.js` の `ui-revise3 1, ui-revise4 1: the hero › {375,1280}px: ...`                                                                                            | 斜め矢印が2つあることの確認を、矢印がなく、16px の GitHub のマークと `shopping-bag` が文字の前にあることに変えた（指示1）                                                                                                                                                                      |
| `not-found.spec.js` の `{幅}×{高さ}, {light,dark}: a missing path returns 404 ...`（縦積みの7通り）                                                                      | 惑星の中心が画面の真ん中にあることの確認を、惑星と文字のまとまりの中心が真ん中か少し上（高さの 40% 以上）にあり、惑星の中心が前より文字の高さの半分以上高く、上下に 16px 以上の余白があることに変えた（指示4）。そのほか（重ならない、はみ出さない、スクロールしない、惑星の大きさ）はそのまま |
| `tests/types/works.ts`                                                                                                                                                   | VR & 3D の作品がドキュメントを持てる例を足した（指示5）                                                                                                                                                                                                                                        |

足したテスト：`portfolio.test.js` の `ui-revise5 11: the first link of every card is underlined on the card's hover`、`ui-revise5 6, 7, 12: no card and no icon has a border or ring; ...`、`ui-revise5 13: the large card has SPOTLIGHT ...`、`ui-revise5 3: the works are 24px further below the hero ...`。`license.test.js` の `ui-revise5 1: section 3 names the GitHub mark ...`、`ui-revise5 1: the Lucide icon is from the pinned lucide-static ...`。`works.spec.js` の `ui-revise5 8: the actions' arrow is 14px ...` と、`ui-revise5: the cards and the sections`（375・1280px、ライト・ダークで、枠なし、Apps のアイコンが円、SPOTLIGHT と 36px の見出し、セクションが 24px 下、横スクロールなし）。

UR5-9 で直したテスト（ユーザーの判断による仕様の変更）：

- `portfolio.test.js`：ヒーローの見出しの大きさを `text-2xl` から `text-[1.75rem]/9` に、BOOTH のアイコンを `shopping-bag` から `box`（パッケージのファイルとパスが同じ）にした。矢印の確認を Lucide の `move-up-right`（パッケージのファイルとパスが同じ、Heroicons の矢印がなく `ArrowUpRightIcon.astro` もない）にした。全カードのホバーのテストは、大サイズのカードだけ `featuredSurface` を見るようにした。「詳しく見る」の形を `<span data-link-text>` 入りにした。`ui-revise5 11: the first link of every card is underlined ...` を `ui-revise5 5, 11: the links' text has the growing underline; ...`（下線の背景、`motion-reduce:transition-none`、1番目だけカードのホバーで伸びる、`underline` と `translate` がない）に置き換えた。`ui-revise5 (design 4): the large card is a light gray surface ...` を足した
- `license.test.js`：Lucide のテストを、`box` と `move-up-right` の2つが固定した版から写したもので、どちらも Feather 由来でなく、LICENSE 第2節とコメントに Feather の記述がないことを見るようにした
- `third-party-licenses.test.js`：トップの HTML に `box` と `move-up-right` があることを見るようにした
- `works.spec.js`：全カードのホバーのテストで、大サイズのカードの色をライト `gray-50` → `gray-100`、ダーク #333842 → #3d4148 にした。ホバーの下線のテストを、背景の幅（0% → 100%）で見て、矢印が動かないことを見るようにした。`ui-revise5 5: the underline grows from the left (prefers-reduced-motion: {no-preference,reduce})` を足した（トランジションが `background-size` の 0.2s で、ホバーの直後に動いていること、reduce ではトランジションがないこと）。矢印のテストに `data-icon="move-up-right"` を足した。ヒーローのテストを 28px と `box` にした

## 新しい文言（すべて仮の文面、P5）

| 場所                                                                  | 文言                                                                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Apps のカードのリンク                                                 | アプリを開く                                                                                               |
| 大サイズのカードの見出しの上                                          | SPOTLIGHT                                                                                                  |
| 見本 /mock/booth-icons の title・description（見本のブランチだけ）    | BOOTH のアイコンの比較 - unlibra ／ ヒーローの BOOTH のボタンに使う Lucide のアイコン4種を並べた見本です。 |
| 見本 /mock/featured-cards の title・description（見本のブランチだけ） | 大サイズのカードの比較 - unlibra ／ 大サイズのカードのデザインの5つの案を並べた見本です。                  |
| 見本の各案の見出しと説明（見本のブランチだけ）                        | UR5-8 のとおり（ページの中に書いた）                                                                       |

「ツールを使う」はなくなった（`messages.workDetails.useTool` を `openApp` に置き換えた）。「BOOTH で見る」「ドキュメント」は既存の文言で、VR & 3D のカードに出るようになった。
