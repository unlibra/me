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
- Block 1 のレビューの指摘で追加：`tsconfig.json` に `"baseUrl": "."` があり、`src/config/site` のような書き方でもリポジトリのファイルに解決されていた。これをルールが素通ししていたので、次の2つを行った（親の指示）
  - `tsconfig.json` から `baseUrl` を外した。`@/*` の `paths` は tsconfig からの相対で解決されるので、ビルドと型チェックはそのまま通る。`src/config/site` 形式の import は、型チェック（ts(2307)）とビルド（Rolldown が解決できない）の両方で失敗するようになったことを、一時的なページで確かめた
  - ルール側でも、指定子の先頭がリポジトリ直下に実在するディレクトリ（`src` など）なら、パッケージではなくローカルのパスとして判定する
  - あわせて、型の位置の `import("…").T`（`TSImportType`）と `import x = require("…")`（`TSImportEqualsDeclaration`）も検査の対象にした（レビューの推奨）
- 戻すときの作業（追加分）：`tsconfig.json` に `baseUrl` を戻す。ルールの該当の分岐を消す
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

liblab のまま残した、最終UIチェックで見てほしい点：

- トーストの閉じるボタンの読み上げラベルは、英語ページでも「閉じる」（liblab と同じ固定の文字列）
- スライダー（`src/components/ui/slider.tsx`）にラベルを渡さないときの読み上げラベルの既定値は、英語ページでも「値を調整」（liblab と同じ固定の文字列）
- Block 2 で移したツールにも、言語に関係なく同じ文字列のものがある（いずれも liblab のまま）
  - SVG最適化：ファイルの検証エラー（「SVGファイルのみアップロードできます」「ファイルサイズが大きすぎます（最大10MB）」）と最適化の失敗（「SVGの最適化に失敗しました」）は日本語のみ。プレビュー画像の `alt` は「最適化後プレビュー」。プリセットのボタンの読み上げラベルは「Select preset: {プリセット名}」
  - パスワードジェネレーター：文字種のボタンの読み上げラベルは英語のみ（「Toggle uppercase」など）
- Block 3 の Favicon ジェネレーターも同様（liblab のまま）：画像の検証エラー（「画像ファイルを選択してください」「画像サイズが大きすぎます（最大4096×4096px）」「ファイルサイズが大きすぎます（最大10MB）」「画像の読み込みに失敗しました」）は日本語のみ。プレビュー画像の `alt` は「プレビュー」。出力形式とサイズのボタンの読み上げラベルは英語のみ（「Select favicon.ico」「Deselect 16x16」など）

## T-14 ツール本体の置き方（Block 2 以降）

- 決めたこと：ツールごとに `src/tools/{tool}/` を作り、island の入口（`{tool}.tsx` の default export。`ToolRoot` で包む）、画面の部品、ロジック（`password.ts`、`svgo.ts` など）を置く。複数のツールで使うロジックは `src/tools/lib/`（`file.ts`）に置く。`ToolPage.astro` が、ツールの ID に応じて island を1つだけ `client:load` で出す（Astro は island のコンポーネントを静的に参照する必要があるので、ツールごとに条件分岐を書く）
- liblab のコードからの変更は、Next.js と Tailwind v3 に依存する部分と、文言の参照（T-2）、Prettier の整形だけ。`svgo.ts` の `any[]` は lint（`no-explicit-any`）を通すため `Array<Record<string, unknown>>` にし、返すときに SVGO の型に変換する。中身は変えていない。使っていない文言のキー（SVG最適化の `custom`、`selectPreset`）は移していない
- 根拠：liblab の `client` コンポーネントはページを開いた直後から動いていたので `client:load` にした
- 戻すときの作業：—（構成の選択のみ）

## T-15 svgo は liblab と同じ 4 系の最新（4.1.0）を入れ、出力が同じことを確かめた

- 決めたこと：`svgo` は `npm install svgo@^4.0.0`（liblab の `package.json` と同じ範囲）で入れ、`package.json` には `"svgo": "^4.1.0"` として記録された（liblab の lock は 4.0.0）。liblab のソース（`svgo.ts` と `svgo-presets.ts` を作業用の場所に写したもの）を svgo 4.0.0 で動かした出力を、`tests/fixtures/svg-optimizer/expected.json` に保存し、移植後のコードと 4.1.0 で同じ出力になることをテストで確かめる
- 根拠：計画の E6（移植前と同じ結果）。版を 4.0.0 に固定するより、liblab の宣言した範囲の中で新しい版を使い、結果が変わっていないことをテストで守るほうがよい。版を上げて出力が変わったら、テストが落ちて気づける
- 他の選択肢：`svgo` を 4.0.0 に固定する
- 戻すときの作業：`package.json` の版を変える

## T-16 E6 の単体テストは `node:test` で書いた（Vitest は入れていない）

- 決めたこと：パスワード生成と SVG 最適化のロジックは、パスエイリアスを使う import がなく（型だけの import は Node の型の除去で消える）、Node から `.ts` をそのまま読み込める。そのため Vitest は入れず、既存と同じ `node:test` で `tests/password-generator.test.js`、`tests/svg-optimizer.test.js` を書いた
  - パスワード生成：長さ、選んだ文字種だけを使うこと、選んだ文字種がすべて1文字以上入ること（長さが文字種の数より短いときは、どの文字も別の文字種から選ばれること）、紛らわしい文字の除外、文字種なしで空文字。加えて、`crypto.getRandomValues` を決まった数列を返すものに差し替え、liblab のソースを同じ数列で動かした結果と一致することを確かめる
  - SVG最適化：2つの SVG（エディタの書き出しを模したものと、アイコン）×4つのオプション（3つのプリセットとカスタム）の出力が liblab と同じこと、プリセットの値、精度のオプションが SVGO の設定に渡ること、壊れた SVG で「SVGの最適化に失敗しました」のエラーになること
- 根拠：計画の「`node:test` で書けなければ Vitest」。Block 3・4 のロジック（canvas を使う favicon 生成、色の計算）で書けなくなったら、そのときに検討する
- 戻すときの作業：—

## T-17 ビルド時のチャンクサイズの警告は残す

- 決めたこと：svgo のチャンク（約 550KB）で Vite のチャンクサイズの警告が出る。`chunkSizeWarningLimit` は変えない
- 根拠：svgo は liblab と同じく、最適化するときに初めて読み込む（動的 import）ので、ページの表示には影響しない。上限を上げると、ほかの大きなチャンクにも気づけなくなる
- 戻すときの作業：—

## T-18 SVG最適化の一部のオプションが効かない（liblab からの既存の不具合。直していない）

- 見つけたこと：`buildSvgoConfig` は、プリセット外のプラグイン9つ（`removeViewBox`、`convertStyleToAttrs`、`cleanupListOfValues`、`removeTitle`、`removeDesc`、`removeDimensions`、`removeRasterImages`、`removeScripts`、`removeStyleElement`）を、オフのとき `{ name, active: false }` として渡している。svgo 4 は `active` を読まないので、これらはオプションに関係なく常に動く。たとえば「推奨」プリセット（`removeTitle: false`、`removeDimensions: false`）でも `<title>` と `width`・`height` が消え、「危険な設定」の `keepScripts`・`keepStyleElement` をオンにしても `<script>`・`<style>` は消える（`expected.json` の出力で確認できる。svgo 4.0.0 でも同じ）
- 決めたこと：P4-2（機能を変えない）に従い、そのまま移した。テストの期待値も liblab の出力のまま
- 直すときの作業：オフのプラグインを `plugins` に入れないようにする（数行）。生成結果が変わるので `expected.json` を作り直す。直すかどうかは親に判断を仰ぐ

## T-19 Favicon ジェネレーターの単体テストは、記録用の偽の canvas を使って `node:test` で書いた

- 決めたこと：Vitest や jsdom は入れず、`node:test` で書いた。Node には `<canvas>` がない（jsdom も、ネイティブの `canvas` パッケージを足さないと描画できない）ので、`tests/helpers/fake-canvas.js` に、2D コンテキストへの呼び出しとプロパティの設定をすべて記録し、`toBlob` でその記録を JSON として返す偽の canvas を置いた。liblab のソース（`favicon.ts`、`image.ts`、`favicon-presets.ts` を作業用の場所に写したもの）を同じ偽の canvas と同じケースで動かした結果を `tests/fixtures/favicon-generator/expected.json` に保存し、移植後のコードの結果がバイト単位で一致することを確かめる
  - ケース：3つの画像の形（横長・縦長・正方形）× 3つの出力形式 × 4つのオプション（既定、角丸 25%、円形と背景色、背景色のみ）と、`processImage` を直接呼ぶ5つのケース（縦横比の維持、ピクセル指定の角丸など）
  - 加えて、ICO のヘッダーとディレクトリの構造（256 を 0 と書く、各 PNG の位置と長さ）、apple-touch-icon が常に白背景で角丸なしになること、複数ファイルを ZIP にまとめること（`jszip` で読み戻す）を確かめる
- 根拠：計画の「`node:test` で書けなければ Vitest」。偽の canvas で比べると、描画の手順（切り抜きの位置、角丸の形、背景色の塗り方）が liblab と同じことを、ロジックを書き換えずに確かめられる。実際のピクセルの描画結果は E7 の手動確認で見る
- そのために変えたこと：`favicon.ts` から `image.ts` への import を、Node から直接読めるように拡張子付きの相対パス（`../lib/image.ts`）にした（`allowImportingTsExtensions` は Astro の tsconfig で有効）
- 未検証：`loadImageFromFile`（SVG の寸法の読み取りを含む）と `getHeicSupport` は単体テストがない（DOM の `Image`・`DOMParser` が要る）。SVG の寸法の読み取りは E7 で確かめた
- 他の選択肢：Vitest と `canvas`（ネイティブの依存）を入れて実際に描画する。描画の部分を純粋な関数に分ける（liblab のコードを組み替えることになる）
- 戻すときの作業：テストと補助のファイルを消す

## T-20 Favicon ジェネレーターの移植で外したもの・変えたもの

- 決めたこと：
  - `image.ts` から、イロマイドだけが使っていた `processImageForCheki` を外した
  - 使っていない文言のキー（`toggleFormat`、`toggleSize`、`select`、`deselect`）は移していない。ボタンの読み上げラベルは liblab でも固定の英語（T-13）
  - `image.ts` の使っていない引数 `match` を `_match` にした（`astro check` のヒントを消すため。動作は同じ）
  - 受け付けるファイル形式の文字列を、2か所で同じ式を書いていたのを1つの変数にまとめた（値は同じ）
  - `jszip` を依存に足した（liblab と同じ `^3.10.x`。ZIP を作るときに初めて読み込む）
- 戻すときの作業：—

## 手動確認の記録（E7）

`astro preview` をブラウザペインで開き、DOM の計測と JS での操作（必要なところはスクリーンショット）で確かめた。ファイルの選択は `DataTransfer` で `<input type="file">` に入れ、ドラッグ&ドロップは `dragenter` と `drop` のイベントを送って確かめた。ダウンロードは `<a>` のクリックを横取りして、渡された Blob の中身を調べた（ブラウザのダウンロードフォルダーに保存されることは見ていない）。本番ビルドは `console` を消すので、コンソールにエラーが出ないことの確認は弱い。

### Block 2：パスワードジェネレーター、SVG最適化

- パスワードジェネレーター（日・英）：開いた直後にパスワードが出る。文字数のスライダー（32 にした）で長さが変わる。文字種の切り替えが効き、全部オフにすると案内文が出て「再生成」と「コピー」が押せなくなる。「再生成」で別のパスワードになる。紛らわしい文字の除外をオフにすると、それらの文字が出ることがある。「コピー」は（クリップボードを差し替えて）パスワードが渡され、「Copied!」のトーストが出る
- SVG最適化（日・英）：ファイルを選ぶとプレビューの画像とサイズ・圧縮率が出る。「ダウンロード」で `{名前}-optimized.svg` が渡され、中身は「最大圧縮」の設定（小数1桁）になっている。スイッチを手で変えるとプリセットの選択が外れる。ドラッグ中にオーバーレイが出て、PNG を落とすと「対応していないファイル形式です。」のトースト、SVG を落とすと読み込まれる。幅 375px でオプションの折りたたみが開く
- 共通：幅 375px（ダーク）と 1280px（ライト）で横スクロールが出ない。ダークの配色、スライダーの溝の色がテーマに追従する

### Block 3：Favicon ジェネレーター

- 日本語（1280px、ライト）：PNG（300×200）を選ぶと 200×200 のプレビューが出る。既定（favicon.ico、16・32）で「ダウンロード」すると `favicon.ico` が1つ渡され、中身は2枚の PNG（16・32）を持つ ICO。Apple Touch Icon と Android Icon と 48 を足すと `favicons.zip` が渡され、中に `favicon.ico`、`apple-touch-icon.png`、`icon-192.png`、`icon-512.png` がある。角丸 100% でプレビューの角が透明になり、背景色（#00ff00）を足すと角丸 0% で角が背景色と画像の重なった色になる。出力形式を全部外すと「ダウンロード」が押せない（サイズの欄も消える）。favicon.ico だけ選んでサイズを全部外すと、サイズを選ぶよう促すトーストが出る
- 英語（375px、ダーク）：`viewBox` だけの SVG（120×60）を選ぶと、60×60 のプレビューになる（liblab と同じ計算）。幅 5000px の画像は「画像サイズが大きすぎます（最大4096×4096px）」、テキストファイルは「画像ファイルを選択してください」のトーストになる（どちらも liblab と同じく日本語のみ。T-13）。SVG をドラッグ&ドロップで読み込み、「Download」で `favicon.ico` が渡される。オプションを開いても横スクロールが出ない。文言は英語
