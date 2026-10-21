# UI の見直しの判断ログ（ui-revise）

計画：`ui-revise/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。

## UR-1 ヘッダーのカテゴリ：WEBツールだけをポップオーバーにし、ほかの3つはリンクにした

- 決めたこと：ヘッダーの liblab のカテゴリのポップオーバーの位置に、4カテゴリを並べる。WEBツールはポップオーバー（1行目に「WEBツールの一覧」= `/#web`、その下に4ツールの名前と短い説明。liblab と同じ形）。自作キーボード・ソフトウェア・VRChat は、同じ形のボタンのリンク（シェブロンなし）で、トップの各セクション（`/#keyboard` など）へ飛ぶ。英語のツールページでもリンク先は日本語のトップのセクション
- 根拠：指示は「トップの各カテゴリのセクションへのリンクにする」「WEBツールのポップオーバーには4ツールの個別ページへのリンク**も**並べる」。ほかの3つは中身が1項目になるので、開く手間を省いた
- 他の選択肢：4つともポップオーバーにして、1行目をセクションへのリンクにする。ほかの3つのポップオーバーに作品を並べる
- 戻すときの作業：`Header.astro` の3つのリンクを WEB と同じポップオーバーに書き換える

## UR-2 ヘッダーのカテゴリの文字を大文字にしない（モバイルメニューの見出しは liblab どおり大文字）

- 決めたこと：デスクトップのカテゴリのボタンは、liblab の `uppercase` を外した。モバイルメニューのカテゴリの見出し（WEBツールの上の小さい見出し。ほかの3カテゴリはリンクで見出しはない）は、liblab どおり `uppercase` にした（英語ページで「WEB TOOLS」）
- 根拠：デスクトップのボタンは VRChat を含み、英語ページで「VRCHAT」になる（固有名）。モバイルメニューの見出しになるのは WEBツールだけで、大文字にしても固有名は崩れない。見出しを大文字・字間広めにする liblab の見た目に合わせた。日本語にはどちらも効かない（レビューの任意の指摘を受けて見直した）
- 他の選択肢：両方 liblab どおり `uppercase`。両方外す
- 戻すときの作業：`Header.astro` の `menuItem` に `uppercase` を足す。モバイルメニューの見出しの `uppercase` を外す

## UR-3 デスクトップのナビとモバイルメニューの切り替えを `lg`（1024px）にした

- 決めたこと：liblab は `sm`（640px）で切り替えるが、`lg` にした。`lg` 未満はハンバーガーと中央のロゴ（liblab のモバイルの形）
- 根拠：カテゴリが2つから4つに増え、ロゴ（149px）と右側（ツールページで 616px）と余白（48px）で 813px 要る。`md`（768px）でも収まらない（幅 1024px で実測）
- 他の選択肢：`md` にして Language の文字を隠す。カテゴリ名を短くする
- 戻すときの作業：`Header.astro`・`MobileMenu.astro` の `lg:` を別の幅に変える

## UR-4 モバイルメニューをネイティブの `<dialog>` で作った

- 決めたこと：liblab の Headless UI の Dialog の代わりに、`<dialog>` の `showModal()` と少しのスクリプトで作った（スライドインは CSS の `@starting-style`）。中身は、カテゴリのリンク、WEBツールの見出しの下に「WEBツールの一覧」と4ツール（名前と短い説明）。リンク、閉じるボタン、Escape、パネルの外のクリックで閉じる。開いている間はページをスクロールさせない
- 根拠：トップとプライバシーのページに React を読み込まない（Phase 2 の C7）。`<dialog>` はフォーカスの閉じ込めと Escape をブラウザが受け持つ
- 他の選択肢：React の island にする（C7 に反する）
- 戻すときの作業：`MobileMenu.astro` を差し替える

## UR-5 ヘッダーの GitHub ボタンを外した

- 決めたこと：今までのヘッダーにあった GitHub のアイコンボタンを外した。GitHub へのリンクはフッターに2か所（ロゴの下と、新しいリンクのグループ）
- 根拠：指示1「ヘッダーは liblab をほぼそのまま」。liblab のヘッダーに GitHub はない
- 他の選択肢：残す
- 戻すときの作業：`Header.astro` にボタンを戻し、`header.github` の文言を戻す

## UR-6 ヒーロー：アバターは残さない。名前のフォントは本文と同じ

- 決めたこと：ヒーローは liblab と同じ形（波形グラデーション、シンボル `size-16`、見出し、紹介文）。中身は新しいシンボル、「unlibra」（`profile.name`）、プロフィール文（`messages.profile.bio`）。アバター（DiceBear の Thumbs）は外し、`Avatar.astro` を消して `LICENSE` の DiceBear の項から外した（見出しを `"Shapes"` だけにした）
- 根拠：見た目で判断した。liblab のヒーローはロゴ1つで、シンボルとアバターを並べると中心が2つになる。見出しのフォントは、liblab はロゴ用の Outfit だが、設計書 3.5 で本文と同じ Noto Sans JP に決まっている（Phase 2 の計画も「サイト名は本文と同じ」）
- 他の選択肢：シンボルの代わりにアバターを置く。両方置く
- 戻すときの作業：`Avatar.astro` と `LICENSE` の行を前のコミットから戻し、ヒーローに置く

## UR-7 波形のグラデーションを sRGB で補間する

- 決めたこと：`bg-linear-to-b/srgb` を使った
- 根拠：Tailwind v4 のグラデーションは既定で oklab で補間し、v3（liblab）の sRGB と色の途中が変わる。liblab と同じ見た目にするため
- 他の選択肢：既定の oklab
- 戻すときの作業：`/srgb` を外す

## UR-8 トップのページの余白を liblab の `main` に合わせた

- 決めたこと：トップの `main` を liblab のレイアウトの `main` と同じ `pt-8 pb-12`、カテゴリの間を `space-y-12`、見出しを `text-2xl font-semibold`（色は本文と同じ。前は `text-gray-900`）にした。作品カードは見た目を変えていない（`grid` と `gap-6` もそのまま）
- 根拠：指示1「カード以外は liblab をほぼそのまま」
- 戻すときの作業：`index.astro` のクラスを戻す

## UR-9 フッター：liblab の3列の形に戻し、中央の列にリンクのグループを置いた

- 決めたこと：liblab と同じ `md:grid-cols-[1fr_2fr_1fr]`。中央（liblab の TOYS / TOOLS の位置）に「Links」のグループ（GitHub、ドキュメント `https://docs.unlibra.com/`、BOOTH ショップ）。3つとも新しいタブで開く。ロゴの下の GitHub のリンク（liblab にもある）は残したので、GitHub へのリンクが2つある。説明文は liblab と同じく `whitespace-pre-line`
- 根拠：指示6。ロゴの下の GitHub は liblab の形をそのまま残した
- 他の選択肢：ロゴの下の GitHub を消して重複をなくす。今までの `1fr_auto_auto` の形
- 戻すときの作業：`Footer.astro` を直す（ロゴの下の GitHub を消すなら、その `<a>` を消すだけ）

## UR-10 著作権表示の年はビルド時の `new Date()` から取り、関数で組み立てる

- 決めたこと：`src/config/site.ts` に `copyrightNotice(year)` を置いた。2025 なら `© 2025 unlibra`、それより後なら `© 2025–{year} unlibra`（en ダッシュ）。2025 より前や整数でない年は例外。フッターは `new Date().getFullYear()` を渡す（静的ビルドなのでビルド時の年）。`site.copyright` は消した
- 根拠：指示7。年の分岐を単体テストで確かめられるように関数にした
- 戻すときの作業：`site.copyright` の固定の文字列に戻す

## UR-11 ツール一覧の削除に伴う変更

- 決めたこと：
  - `/lab`・`/en/lab` のページ、`ToolList.astro`・`ToolCard.astro`・`src/messages/lab.ts`（一覧の説明文）を消した。`paths.tools` は個別ページの接頭辞として残した（ページはない、とコメントに書いた）
  - `_redirects`：`/lab/ja`・`/lab/ja/`・`/lab/en`・`/lab/en/`・`/lab`・`/lab/`・`/en/lab`・`/en/lab/` を `/#web` へ 301。`wrangler dev` で `Location: /#web` が返ることを確かめた。末尾スラッシュつきの新URLも1回で着くように足した
  - `scripts/check-prod.mjs`：転送先の比較を `pathname` から `pathname + hash` にした（`/#web` を比べるため）
  - `playwright.config.js` の起動待ちの URL を `/lab` から `/` にした
  - README のURLの一覧の `/lab` と `/en/lab` を `/lab/{tool}` と `/en/lab/{tool}` にした
- 根拠：計画の「親の解釈と判断」
- 戻すときの作業：前のコミットのファイルを戻す

## UR-12 新しいアイコン（Heroicons）

- 決めたこと：`ChevronDownIcon.astro`・`Bars3Icon.astro`・`XMarkIcon.astro` を Heroicons v2.2.0（`node_modules/@heroicons/react` の 24 outline と同じパス）から作り、`LICENSE` の Heroicons の項に足した
- 根拠：liblab のヘッダーと同じアイコン。トップで React を読み込まないため、`@heroicons/react` は使わない

## 直した既存のテストと理由（K1）

| テスト                                                                                         | 直した内容と理由                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.test.js` の `the build has the pages this test suite expects`                          | `lab/index.html`・`en/lab/index.html` を外した（一覧ページの削除）                                                                                                                                                                                                   |
| `layout.test.js` の `C4: every page has the common header`                                     | 「ツール」リンクと GitHub ボタンの確認を外した（4の WEBツールのポップオーバーに置き換え、UR-5）。代わりに `ui-revise 1`・`ui-revise 4` のテストを足した                                                                                                              |
| `layout.test.js` の `C4: every page has the common footer with the required links`             | 著作権表示を `© 2025–{ビルドした年} unlibra` にした（指示7）                                                                                                                                                                                                         |
| `tools.test.js` の `E2: the ten tool pages ...`                                                | 8ページにした（一覧ページの削除）                                                                                                                                                                                                                                    |
| `tools.test.js` の `E3: tool pages have WebApplication and BreadcrumbList ...`                 | パンくずの起点を一覧からトップ（`/`、「ホーム」/「Home (Japanese)」）にした                                                                                                                                                                                          |
| `tools.test.js` の `E3: the tool list pages have no island`、`tool list pages show a card ...` | 消して、`ui-revise 2: there are no tool list pages` にした（一覧ページの削除）                                                                                                                                                                                       |
| `tools.test.js` の `E8: every page's footer lists the tools in the page's language`            | フッターの TOOLS がなくなったので、ヘッダー（WEBツールのメニューとモバイルメニュー）がページの言語のツールにリンクすることを見るテストにした（言語の取り違えを見る目的は同じ）                                                                                       |
| `build.test.js` の `A6: sitemap lists ...`                                                     | サイトマップから `/lab`・`/en/lab` を外した                                                                                                                                                                                                                          |
| `build.test.js` の `index.html footer keeps the space between the year and the name`           | 年の範囲（`2025–2026`）も受け付けるようにした（指示7）                                                                                                                                                                                                               |
| `portfolio.test.js` の `D2: the top page links to each category section`                       | トップのカテゴリのボタンからヘッダーのリンクに置き換えた（指示4）。トップにボタンがないことは `ui-revise 4: the category buttons are gone from the top page` で見る                                                                                                  |
| `portfolio.test.js` の `D5: the three documentation links ...`                                 | 対象をページ全体から `main` にした。フッターにドキュメントのトップ（`https://docs.unlibra.com/`）へのリンクが増えたため（指示6）。フッターのリンクは `ui-revise 6` で見る                                                                                            |
| `redirects.test.js` の `EXPECTED`、`one hop`、`destinations exist`、`no redirect shadows`      | 一覧のURLの転送先を `/#web` にし、`/lab`・`/en/lab` を足した。転送先の確認はフラグメントの `id` がトップにあることまで見るようにした。「スプラットの前の部分（`/lab`）が存在する」の確認は、`/lab` がなくなったので外した（ツールごとの確認は残る）                  |
| `site.spec.js`                                                                                 | `PAGES` から一覧を外した。テーマのテストで一覧を開いていた所をトップと英語のツールページにし、配色の確認先の「一覧の説明文」を「作品カードの説明文」と「フッターの背景」にした。言語切替から一覧を外した。`_redirects` の確認で `pathname + hash` を比べるようにした |

## 新しい文言（すべて仮の文面、K4）

| 場所                                         | 日本語                   | 英語                                      |
| -------------------------------------------- | ------------------------ | ----------------------------------------- |
| ヘッダーのカテゴリ（英語のツールページ）     | （トップの見出しと同じ） | Keyboards / Software / Web Tools / VRChat |
| WEBツールのメニューの1行目                   | WEBツールの一覧          | All web tools                             |
| モバイルメニューのボタン（aria-label）       | メニューを開く           | Open menu                                 |
| モバイルメニューの閉じるボタン（aria-label） | メニューを閉じる         | Close menu                                |
| モバイルメニューの名前（aria-label）         | メニュー                 | Menu                                      |
| パンくずの起点                               | ホーム                   | Home (Japanese)                           |
| フッターのリンクのグループの見出し           | Links                    | Links                                     |
| フッターのドキュメントへのリンク             | ドキュメント             | Documentation                             |
| フッターの BOOTH へのリンク                  | BOOTH ショップ           | BOOTH Shop                                |

日本語の「ホーム」は liblab のパンくずと同じ。モバイルメニューのボタンの aria-label は、liblab では日本語のページでも英語（Open menu）だった。

## liblab との見比べ（K3）

liblab の本番（`https://unlibra.com/lab/ja` と `/lab/ja/svg-optimizer`）と新サイト（`wrangler dev` の `/` と `/lab/svg-optimizer`）を、Playwright で幅 1280px と 375px、ライトとダークで撮って並べた（2026-10-21）。ヘッダーの高さと配置、波形のヒーローの形・色・余白、見出し、フッターの配色と列、ツールページのパンくず・見出し・余白は一致した。WEBツールのメニューとモバイルメニューを開いた状態も撮って確かめた。

違いが残る箇所と理由：

| 箇所                           | 違い                                                                                                                                                         | 理由                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ロゴとサイト名                 | Lib Lab のロゴ（Outfit）→ 新しいシンボルと「unlibra.com」（Noto Sans JP）                                                                                    | 指示1。フォントは設計書 3.5（UR-6）                                                                            |
| ダークのロゴ                   | liblab のロゴはダークで灰色になるが、新しいシンボルは同じ色（濃い円）のまま。ダークでは背景に沈む                                                            | `symbol.svg` はブランドの素材でそのまま使っている。ダーク用の色を作るかは親の判断が要る                        |
| 本文のフォント                 | IBM Plex Sans JP → Noto Sans JP                                                                                                                              | 設計書 3.5                                                                                                     |
| ヘッダーのナビ                 | Toys / Tools の2つ → 4カテゴリ。大文字にしない。デスクトップの形は 1024px 以上                                                                               | 指示4、UR-1〜3                                                                                                 |
| ヘッダーの言語切替             | トップとプライバシーにはない                                                                                                                                 | 日本語だけのページ（Phase 2 から）                                                                             |
| ヒーローの中身                 | 3行の紹介文 → 1行のプロフィール文（375px で2行）                                                                                                             | 指示1                                                                                                          |
| 一覧の中身                     | ツールのカード → 作品カード（3列）                                                                                                                           | カードは変えない（計画）                                                                                       |
| ポスト・シェア・チップのボタン | なし                                                                                                                                                         | 指示3                                                                                                          |
| フッターの列                   | TOYS・TOOLS → Links の1グループ。Support はバグ報告・問い合わせがなく2項目                                                                                   | 指示6。Support の項目は今までの me のまま                                                                      |
| 著作権表示                     | `© 2025 unlibra` → `© 2025–2026 unlibra`                                                                                                                     | 指示7                                                                                                          |
| トップ末尾の About の帯        | liblab のトップの末尾にある「About / Portfolio」の帯（右端から中央まで伸びる、左端が丸い灰色の帯。スクロールで入ってきて、ポートフォリオにリンクする）がない | ポートフォリオがこのサイト自身なので、リンク先がない。外してよいか、親がユーザーに確認中（実装は変えていない） |
| ポップオーバーの開閉           | liblab は拡大と透明度のアニメーションがあるが、新サイトはすぐ出る                                                                                            | 既存の言語・テーマの切替と同じ作り（Phase 2）                                                                  |
