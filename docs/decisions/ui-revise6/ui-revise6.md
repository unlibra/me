# UI の見直し（6回目）の判断ログ（ui-revise6）

計画：`ui-revise6/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。

## UR6-1 フッター：「INFORMATION」のグループ

- 決めたこと：見出しの文言のキーを `footer.support` から `footer.information`（日英とも「Information」。表示は今までどおり CSS の `uppercase` で「INFORMATION」）にし、グループの目印も `data-footer-support` から `data-footer-information` にした。並びは「寄付・支援」「プライバシーポリシー」「クレジット」。クレジットは同じタブで開く（プライバシーポリシーと同じ）。英語のリンクは「Credits (Japanese)」（「Privacy Policy (Japanese)」に合わせた）
- 根拠：計画の3。中身が支援だけではなくなったので、名前を中身に合わせた
- 他の選択肢：キーと目印は `support` のまま、文言だけ変える（差分は小さいが、名前と中身がずれる）
- 戻すときの作業：`layout.ts` のキー、`Footer.astro`、テスト（`layout.test.js`、`works.spec.js` の目印）を戻す

## UR6-2 クレジットのページの作り

- 決めたこと：
  - `src/pages/credits.astro` を、プライバシーポリシーと同じ `MarkdownLayout`（BaseLayout、canonical、`prose` の見た目）で作った。Markdown ではなく `.astro` にしたのは、素材の一覧を `src/config/credits.ts` のデータから出すため
  - 見出し「クレジット」は `h1` にした。プライバシーポリシーは題を `h2`（`## プライバシーポリシー`）で書いているが、ページの題としては `h1` が正しいので、こちらは合わせていない。その下に `h2`「キャラクター」「その他の素材・ライセンス」、素材ごとに `h3`（素材名）と「著作者／ライセンス／参照先」の箇条書き
  - 素材の一覧は `LICENSE` 第2節の4つの出どころを、その順で載せた。素材名は第2節の見出しの `(` より前をそのまま使った（英語のまま。例：`DiceBear "Shapes" and "Planets"`、`Tailwind CSS v3 color palette`）。著作者は第2節の Copyright の名義。DiceBear は第2節に名義がない（CC0）ので、SVG のメタデータの `dc:creator`（「DiceBear」）にした。ライセンスは第2節の表記（`MIT License`、`ISC License`、`CC0 1.0 Universal`）。参照先は見出しの URL
  - フォントは素材の後に同じ形で3つ（Noto Sans JP、LINE Seed JP、Roboto Mono）。著作者はフォントファイルの著作権表示（name ID 0）の名義：Noto Sans JP は「Adobe」（ファイルの表示は `(c) 2014-2021 Adobe ..., with Reserved Font Name 'Source'`。Noto Sans CJK が Source Han Sans と同じ元であるため。Google の名前は出していない）、LINE Seed JP は「LY Corporation」、Roboto Mono は「The Roboto Mono Project Authors」。ライセンスは3つとも「SIL Open Font License 1.1」。参照先は npm パッケージの `homepage`（Fontsource のページ）
  - 最後に「このほか、当サイトが配信しているライブラリなどのライセンスと著作権表示は、同梱ライブラリのライセンス一覧に掲載しています。」として `/third-party-licenses.txt` にリンクした
  - 参照先のリンクは新しいタブで開く（`rel="noopener noreferrer"`）。375px で URL がはみ出さないよう `break-all` を付けた
  - LICENSE 第3節（BOOTH の画像の他の作者の素材、他社のロゴ）は、計画の内容に入っていないので載せていない
- 根拠：計画の4。素材名とライセンスの表記を LICENSE と同じ文字列にしておくと、テストで食い違いを機械的に見つけられる
- 他の選択肢：素材名を日本語にする（例「Tailwind CSS v3 のカラーパレット」。テストで LICENSE と突き合わせる対応表が別に要る）。ページを LICENSE からビルド時に組み立てる（計画は「LICENSE を正として内容を作り、食い違いをテストで検出」）。フォントの著作者を「Google」にする（ファイルの表示と違う）。参照先を公式のページ（Google Fonts、seed.line.me）にする（テストで確かめる元がない）
- 戻すときの作業：`src/pages/credits.astro`、`src/config/credits.ts`、`tests/credits.test.js` を消し、`paths.credits` とフッターのリンク、既存テストの追加分（UR6-4 の表）を戻す

## UR6-3 クレジットと LICENSE の突き合わせのテスト（`tests/credits.test.js`）

- 決めたこと：
  - LICENSE 第2節を出どころごとに読み、素材名・URL・ライセンスの並びが `materials` と一致すること、著作者が Copyright の名義（ないときは SVG の `dc:creator`）と一致することを見る。LICENSE に出どころを1つ足した文字列で、一致しなくなることも確かめる（検出できることの確認）
  - フォントは、`package.json` の `@fontsource` / `@fontsource-variable` のパッケージの集合が `fonts` と一致すること、ライセンスが `OFL-1.1`、参照先がパッケージの `homepage`、著作者がフォントファイルの name ID 0 に含まれること、ファミリー名が素材名で始まることを見る（可変フォントの Noto Sans JP のファミリー名は「Noto Sans JP Thin」）
  - ビルドしたページで、見出し、説明、キャラクター、素材とフォントの各項目、一覧へのリンク、`lang="ja"`、canonical、サイトマップ、meta description を見る
- 既存のテスト `license.test.js` の F2（帰属表示のあるファイルは LICENSE に載っていること）は、ライセンス名や Copyright を含むファイルを素材として数える。`src/config/credits.ts` と `tests/credits.test.js` は素材を含まずライセンスを名指しするだけなので、`license.test.js` 自身と同じく対象から外した（`NAMES_LICENSES`）
- 他の選択肢：F2 に引っかからないよう文字列を分けて書く（検査をすり抜ける書き方になる）
- 戻すときの作業：`tests/credits.test.js` を消し、`license.test.js` の `NAMES_LICENSES` を元の1ファイルの除外に戻す

## UR6-4 カードの説明文の長さ

- 決めたこと：幅 1280px（Libraries と Apps は2列、説明文の幅は 504px、16px）で2行になる長さにした。Apps は旧ツールサイトの説明文から「無料の」などの宣伝の言葉を落として要約し、表記（英数字の前後に空きを入れない）は旧文面に合わせた。Libraries は今の文面に、何のためのものか（Python ライブラリ、多言語化）を足した。E2E は2行以上3行以下を見る（計画の「3行以内」に、「足りないものは補う」の下限を足した）
- 根拠：計画の2
- 他の選択肢：CSS で行数を切る（`line-clamp`。文が途中で切れる）
- 戻すときの作業：`src/messages/ja.ts` の文面を戻す（旧文面は下の表）

## 直した既存のテストと理由（Q1）

| テスト                                                                                        | 直した内容と理由                                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.test.js` の `the build has the pages this test suite expects`                         | `credits/index.html` を足した（指示4）                                                                                                               |
| `layout.test.js` の `singleLanguagePages`                                                     | クレジットを足した（日本語だけのページ）                                                                                                             |
| `layout.test.js` の `C7: ... do not load the React runtime`                                   | クレジットも対象にした                                                                                                                               |
| `layout.test.js` の `C4: every page has the common footer with the required links`            | `/credits` を足した（指示3）                                                                                                                         |
| `layout.test.js` の `ui-revise4 3: the footer is a grid ...`                                  | 目印を `data-footer-information` にした（UR6-1）                                                                                                     |
| `layout.test.js` の `ui-revise2 8, ui-revise3 2: the footer's description and link labels`    | 日英の説明文を新しい文面にした（指示1）。名前を `ui-revise2 8, ui-revise6 1` にした                                                                  |
| `build.test.js` の A2、A6（サイトマップ）                                                     | `credits/index.html` と `/credits` を足した（指示4）                                                                                                 |
| `portfolio.test.js` の `ui-revise3 2: the top page's description is the footer's description` | 新しい説明文にした（指示1）                                                                                                                          |
| `portfolio.test.js` の `ui-revise4 2: the Apps cards have the former tool site's card texts`  | 名前は旧ツールサイトのまま、説明文は旧文面より短いことを見るようにした（指示2。行数は E2E）                                                          |
| `portfolio.test.js` の `ui-revise4 2: VR & 3D has the real product only ...`                  | ページ全体に「アバター」がないことを見ていたが、新しいフッターの説明文（ユーザーの文面）に「VRアバター」が入ったので、フッターを除いて見るようにした |
| `license.test.js` の F2                                                                       | UR6-3                                                                                                                                                |
| `works.spec.js` の `ui-revise4 3: the footer's grid`（2件）                                   | 目印を `data-footer-information` にした（UR6-1）                                                                                                     |
| `site.spec.js` の `PAGES` と `the Japanese-only pages have no language switch`                | `/credits` を足した                                                                                                                                  |

## 新しい文言（すべて仮の文面、Q4）

フッターの説明文（日英）は計画のユーザーの文面どおり。トップの meta description は今までどおりフッターの日本語の説明文を参照する。

| 場所                           | 文面                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| フッターの見出し               | Information（表示は INFORMATION。日英とも）                                                                                |
| フッターのクレジットへのリンク | クレジット ／ Credits (Japanese)                                                                                           |
| クレジットの title             | クレジット - unlibra                                                                                                       |
| クレジットの meta description  | unlibra のクレジットです。当サイトで使用しているキャラクターや素材等の権利表記を掲載しています。                           |
| クレジットの項目の見出し       | 著作者：／ライセンス：／参照先：                                                                                           |
| クレジットの末尾               | このほか、当サイトが配信しているライブラリなどのライセンスと著作権表示は、同梱ライブラリのライセンス一覧に掲載しています。 |

クレジットの見出し・説明・キャラクター・「その他の素材・ライセンス」の説明は計画の文面どおり。

### カードの説明文（旧文面と新しい文面）

| 作品                     | 旧文面                                                                                                                                                                                                | 新しい文面（仮）                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| tkinter-unblur           | 高 DPI の Windows で Tkinter がぼやける問題を import 一行で解決                                                                                                                                       | 高 DPI の Windows で Tkinter のアプリがぼやけて表示される問題を、import を一行足すだけで解決する Python ライブラリです。   |
| @i18n-tiny/next          | 依存ゼロ・型安全・最小構成の Next.js 向け i18n                                                                                                                                                        | 依存ゼロ・型安全・最小構成で、Next.js のアプリを多言語化できる i18n ライブラリです。必要な機能だけを小さくまとめています。 |
| @i18n-tiny/astro         | 依存ゼロ・型安全・最小構成の Astro 向け i18n                                                                                                                                                          | 依存ゼロ・型安全・最小構成で、Astro のサイトを多言語化できる i18n ライブラリです。必要な機能だけを小さくまとめています。   |
| TWパレットジェネレーター | 指定した色から、TailwindCSSに最適化されたカラーパレットを自動生成。コーポレートカラーやブランドカラーをベースに、50〜950まで統一感のある配色を無料で作成できます。                                    | 指定した色から、TailwindCSSに最適化された50〜950のカラーパレットを自動生成。統一感のある配色を作れます。                   |
| Faviconジェネレーター    | 無料のFavicon一括生成ツール。PNG、JPEG、SVGなどの画像をアップロードするだけで、Webサイトに必要な全サイズのFaviconとApple Touch Iconを自動生成。角丸加工や背景色の設定もブラウザ上で簡単に完了します。 | 画像から、Webサイトに必要な全サイズのFaviconとApple Touch Iconを一括生成。角丸や背景色も設定できます。                     |
| SVG最適化                | 無料のSVG最適化・圧縮ツール。品質を保ったままファイルサイズを削減し、Webサイトの読み込み速度を改善。ブラウザ上で完結するため、セキュアで高速に最適化できます。                                        | 品質を保ったままSVGのファイルサイズを削減し、Webサイトの読み込みを速くします。ブラウザ上で完結するので安全です。           |
| パスワードジェネレーター | 無料の強力なパスワード生成ツール。文字数、大文字・小文字・数字・記号を自由に組み合わせて、セキュアなパスワードを作成。紛らわしい文字の除外にも対応し、ブラウザ完結で安全です。                        | 文字数や文字の種類を選んで、強力なパスワードを生成。紛らわしい文字の除外にも対応し、ブラウザ上で安全に作成できます。       |

Libraries の新しい文面の「必要な機能だけを小さくまとめています」は「最小構成」の言い換えで、ドキュメントで確かめた内容ではない。
