# Phase 4 判断ログ（tools）

## T-1 ツールページは Astro 側でパンくず・見出し・説明文を出し、island はツール本体だけにする

- 決めたこと：`src/components/lab/ToolPage.astro` が、`BaseLayout`、パンくず、`h1`（ツール名）、説明文、`WebApplication` の JSON-LD を静的な HTML で出す。React の island はその下のツール本体だけにする。ツールごとの幅（`max-w-screen-sm` など）は liblab の各ページと同じ値を `ToolPage.astro` に持つ
- 根拠：liblab ではパンくずと見出しもクライアントコンポーネントの中にあったが、どちらも操作がなく、JS なしで出せる。ファイルを扱うツールのドロップ受付（`FullPageDropZone`）はツール本体だけを包むことになるが、ドラッグ中は画面全体を覆うオーバーレイ（`fixed inset-0`）の上にドロップされるので、受け付ける範囲は変わらない
- 他の選択肢：liblab と同じく、パンくずと見出しも island に含める（ツールページの文言を React に渡し、SSR で出す）
- 戻すときの作業：`ToolPage.astro` の見出しを各ツールのコンポーネントに移す

## T-2 island から文言を引く仕組み

- 決めたこと：ツールの文言は `src/tools/messages/{ja,en}.ts` に置き、`ToolMessages`（`SameStructure`）で en が ja と同じキーを持つことを型で保証する。island のルート（`ToolRoot`）が `locale` を props で受け取り、React の context（`I18nProvider`、`useMessages()`）で下の部品に渡す。liblab の `t("common.copy")` は `messages.common.copy` のようなオブジェクトの参照に書き換える。トーストも island ごとに `ToolRoot` が用意する
- 根拠：Astro の island はそれぞれ別の React ルートなので、liblab の `@i18n-tiny/next` の Provider のように全ページで1つの context を共有できない。オブジェクトの参照にすると、キーの打ち間違いが型エラーになる。`SameStructure` は Phase 2 の `src/messages/types.ts` と同じものを MIT 側に複製した（MIT 側から All rights reserved 側を import しないため。P4-1）
- 移した文言は、4ツールが実際に使うキーだけにした。`common` のうち `home`（パンくずを T-3 のとおり変えたため不要）、`reset`、`processing`、`analyzing`、`networkError`、`imageProcessingOnlyNotice`、`error`、`theme*` と、`site`、`about`、`supportSection`、`categories`、`aria`、`footer`、`iromide` は移していない
- 使わなくなった `@i18n-tiny/astro` は依存から外した（計画のやること5）
- 他の選択肢：`@i18n-tiny/astro` などのライブラリを使う。各部品に文言を props で渡す
- 戻すときの作業：`src/tools/i18n.tsx` と各部品の文言の参照を書き換える

## T-3 パンくずの先頭は「ツール / Tools」で、ツール一覧を指す

- 決めたこと：パンくずは「ツール（`/lab`）› ツール名」（英語は「Tools（`/en/lab`）› ツール名」）。「ツール / Tools」はヘッダーのリンクと同じ文言（`layout.ts` の `header.tools`）。構造化データ（`BreadcrumbList`）も同じ2段にする。`aria-label="Breadcrumb"` は liblab のまま
- 根拠：liblab のパンくずは「ホーム › ツール名」で、ホームは liblab のトップ（＝ツール一覧）だった。新しいサイトのホームはポートフォリオ（`/`）なので、「ホーム」のまま一覧を指すと名前と行き先が食い違う
- 他の選択肢：「ホーム（`/`）› ツール › ツール名」の3段にする。英語ページの「Home」は日本語のみのトップを指すことになる
- 戻すときの作業：`ToolPage.astro` の `items` を変える

## T-4 MIT 側の import の制限は、パスを解決する自前の ESLint ルールで行う

- 決めたこと：`eslint.config.js` に `local/license-boundary` ルールを置き、`src/tools/**` と `src/components/ui/**` のファイル（`.astro` の `<script>` を含む）で、import・export from・動的 import の行き先を解決し、MIT のディレクトリの外のファイルならエラーにする。`@/`、`/src/...`、相対パスを解決の対象とし、パッケージ（`react`、`astro:assets` など）は許す。動的 import の引数が文字列リテラルでないときもエラーにする（行き先を確かめられないため）
- 根拠：計画の受け入れ条件 E4。`no-restricted-imports` は import の文字列だけを見るので、`../../config/site` のような相対パスを、深さに応じて正しく止められない。`eslint-plugin-import-x` の `no-restricted-paths` はパスの解決に別のリゾルバーの依存が要る。自前のルールなら依存が増えない
- 対象外：CSS の `@import`、`import.meta.glob`。いまの MIT 側のコードには、MIT の外を指すものはない
- 他の選択肢：`eslint-plugin-import-x` と `eslint-import-resolver-typescript` を足す
- 戻すときの作業：`eslint.config.js` のルールと `tests/tools.test.js` の E4 を消す

## T-5 Tailwind v3 前提の部分の移し方

- 決めたこと：
  - v3 の既定に頼っていた、ボタンの指カーソルとプレースホルダーの色（gray-400）を、v4 の移行ガイドにある互換の CSS で戻す。この CSS は `src/tools/styles.css` に置き、`global.css` から読み込む（サイト全体に効くが、ポートフォリオ側のボタンはもともと `cursor-pointer` を付けている）
  - クラス名は v4 の名前に合わせる（`outline-none` → `outline-hidden`、`backdrop-blur` → `backdrop-blur-sm` など）。`max-w-screen-*` は v4 でも使える
  - `Slider` の styled-jsx（Next.js の機能）は、`slider.css` に移し、`ui-slider` クラスで範囲を絞る
  - `CheckerboardPreview` が使っていた `next-themes` の `resolvedTheme` は、`<html>` の `dark` クラスを見るフック（`useIsDark`）に置き換える。`Slider` が持っていた同じ処理もこのフックにまとめた
  - liblab の独自ユーティリティ `drag-none`、アニメーション `fadeIn`、`@tailwindcss/container-queries` は、4ツールのどれも使っていなかったので移していない（イロマイドだけが使っていた）
- 根拠：計画のやること6。互換の CSS をツール側のファイルに置くと、MIT 側を切り出したときにツールに必要なスタイルも一緒に持ち出せる
- 他の選択肢：ツールのボタン1つずつに `cursor-pointer` を足す
- 戻すときの作業：`src/tools/styles.css` と `global.css` の1行を消す

## T-6 ツール一覧ページとカード（仮のデザイン）

- 決めたこと：
  - 見出しの `h1` は「ツール / Tools」（ヘッダーの文言）。その下に liblab のトップページのツールカードと同じ見た目のカードを、`lg` 以上で2列に並べる。カードの名前は `h2`
  - カードの説明は、計画の「短い説明」に合わせて liblab の `shortDescription`（ヘッダーのポップオーバーで使っていた文）を使う。liblab のカードは長い説明文（`description`）を出していた
  - アイコンは装飾として `alt=""` にした（liblab はツール名を `alt` に入れていたが、すぐ隣に同じ名前がある。Phase 3 の PF-3 と同じ扱い）
  - liblab のトップにあった `WebSite` の JSON-LD は出さない（サイトは unlibra.com 全体になったため）
- 根拠：P4-3（カードだけを置く）。UIの最終チェックで変わる前提
- 他の選択肢：カードに `description` を出す
- 戻すときの作業：`ToolCard.astro` と `ToolList.astro` を直す

## T-7 ページタイトルは「{ツール名} - unlibra.com」

- 決めたこと：ツールページの title は「ツール名 - unlibra.com」、一覧は「ツール - unlibra.com」（英語は「Tools - unlibra.com」）。description は liblab と同じく、説明文の改行を取り除いたもの
- 根拠：liblab の title は「ツール名 | Lib Lab」だった。サイト名の部分は、既存のプライバシーポリシー・404 の書き方（「… - unlibra.com」）に合わせた
- 戻すときの作業：`ToolPage.astro` と `ToolList.astro` の1行ずつ

## T-8 フッターのツールの列

- 決めたこと：フッターを3列（ロゴと説明 / Tools / Support）にし、真ん中に4ツールへのリンクを並べる。見出しは liblab のフッターのカテゴリ名と同じ「Tools」（日英とも。「Support」と同じく英語の見出し）で、`layout.ts` の `footer.tools` に足した。リンク先とツール名は表示中のページの言語に合わせる。ポートフォリオのページ（日本語）では `/lab/{tool}`
- 根拠：Phase 2 で Phase 4 に回した「ツール一覧の列」。liblab のフッターは同じ位置にカテゴリごとのツールの列を持っていた
- 戻すときの作業：`Footer.astro` の列と `layout.ts` の1行を消す

## T-9 既存のテストの期待値を、英語のツールページに合わせて変えた

- 決めたこと：
  - `build.test.js` の A3（ロケール付きのページがない）：`dist/en/` がないことを確かめていたのを、「`dist/ja/` がなく、`dist/en/` の中は `lab/` だけ」に変えた。サイトマップも、`/en` は `/en/lab` 以下だけを許す
  - 同じく A6（サイトマップ）：トップと privacy に、ツールの10ページを足した
  - `layout.test.js`：ページの一覧に10ページを足し、`lang` とヘッダーのツールへのリンク・テーマ切替の読み上げラベルを、ページの言語に応じて確かめるようにした。「別言語版のないページに言語切替がない」は、対象を別言語版のない3ページ（トップ、privacy、404）に絞った。ツールページの言語切替と hreflang は `tools.test.js` の E2 で確かめる
- 根拠：A3 は Phase 1 で、ポートフォリオのロケール付きページ（`/en` など）をなくしたことを確かめるテストだった。設計書 3.2 で `/en/lab` は英語のツールページとして決まっているので、意図（ポートフォリオに英語版がない）を保ったまま範囲を絞った。検査を弱めたつもりはないが、親に確認してほしい
- 戻すときの作業：テストの差分を戻す

## T-10 サイトマップに hreflang の対応は書かない

- 決めたこと：`@astrojs/sitemap` の `i18n` オプションは使わず、ツールのページを普通の URL として載せる（何もしなくても全ページが載る）
- 根拠：hreflang は各ページの `<head>` に出しているので、検索エンジンにはそれで伝わる。設計書と計画はサイトマップの hreflang を求めていない
- 他の選択肢：`i18n` オプションで `xhtml:link` を出す（liblab のサイトマップは出していた）
- 戻すときの作業：`astro.config.mjs` の `sitemap()` に `i18n` を渡し、A6 を直す

## T-11 `toolPath` に言語を必須で渡し、ツールのアイコンを `src/config/tools.ts` にまとめる

- 決めたこと：`toolPath(id)` を `toolPath(id, lang)` に変えた（言語を省略できない）。ツールのアイコンの import を `works.ts` から `src/config/tools.ts` の `toolIcons` に移し、作品データと一覧のカードの両方から使う
- 根拠：英語のパスを作る必要ができた。省略時に日本語にする既定値は、英語ページで付け忘れても気づけない
- 戻すときの作業：2ファイルを直す

## T-12 ヘッダーの「ツール」のリンクを折り返さない

- 決めたこと：ヘッダーの「ツール」リンクに `whitespace-nowrap` を足した
- 根拠：言語切替のボタンが増えるツールページで、幅 375px のとき「ツール」が2行に折れていた。折り返しを止めても横にはみ出さないことを確かめた（右端のボタン群がヘッダーの内側の余白に 7px ほど入る）
- 戻すときの作業：クラスを1つ消す

## T-13 画面に出す新しい文言（仮）

最終UIチェックの項目に加えてもらう。

- 一覧ページの meta description（ja）：「その色も、そのアイコンも、思い通りに。Favicon生成、カラーパレット作成、SVG最適化など、Web・アプリ開発者のための無料ツールセット。アカウント登録不要、すぐに使えます。」（liblab の `site.description` の改行を除いたもの）
- 一覧ページの meta description（en）："Craft your perfect colors and icons. A free toolkit for web and app developers, including favicon generation, color palette creation, SVG optimization, and more. No account needed, start creating instantly."（liblab の文の「Lib Lab offers a free toolkit」を「A free toolkit」に変えた）
- ページタイトル「ツール - unlibra.com」「Tools - unlibra.com」「{ツール名} - unlibra.com」（T-7）
- パンくずの先頭「ツール / Tools」（T-3）、一覧ページの見出し「ツール / Tools」（T-6）

流用したもの（仮扱いにしない）：ツールの名前・説明文・短い説明（liblab の `tools`）、ツール本体の文言（liblab の `common` と各ツールの文言）、フッターの見出し「Tools」（liblab の `categories.tools`）

liblab のまま残した、最終UIチェックで見てほしい点：トーストの閉じるボタンの読み上げラベルは、英語ページでも「閉じる」（liblab と同じ固定の文字列）
