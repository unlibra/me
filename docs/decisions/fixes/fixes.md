# 追加作業の判断ログ（fixes）

## FX-1 SVG 最適化：オフにしたスイッチのプラグインを動かさない（T-18 の修正）と、範囲の広げ方

- 決めたこと：
  - T-18 の9つ（`removeViewBox`、`convertStyleToAttrs`、`cleanupListOfValues`、`removeTitle`、`removeDesc`、`removeDimensions`、`removeRasterImages`、`removeScripts`、`removeStyleElement`）は、オフのとき `plugins` に入れない
  - 計画に挙がっていないが、同じ不具合を持つスイッチも直した
    - `cleanupNumericValues` と `convertTransform`：`preset-default` の `overrides` に精度の値を常に渡していたので、スイッチをオフにしても動いていた。オフのときは `false` を渡す
    - `removeDesc`：`preset-default` にも含まれていて（svgo 4）、オフでもそちらで動いていた（空の `<desc>` と、`Created with` / `Created using` で始まる `<desc>` を消す）。オフのときは `overrides` でも `false` にする
- 根拠：計画の「スイッチで無効にしたプラグインが実際に実行されないようにする」。画面のスイッチ（`svgo-options.ts`）にある項目で、オフにしても動くものを残すと同じ不具合が残る
- 利用者から見える変化：「おすすめ」プリセット（`removeDesc: false`）では、エディターが入れた `Created with ...` の `<desc>` も残るようになる。精度のスイッチをオフにすると数値の丸めが止まる
- 他の選択肢：計画に挙がった9つだけ直す。`removeDesc` は `preset-default` 側は動かしたままにする（オフでもエディターの `<desc>` は消える）
- 戻すときの作業：`buildSvgoConfig` の `overrides` の3行を元に戻し、テストの該当箇所を消す
- 見つけたが直していないこと：`removeDesc` をオンにしても、既定の引数（`removeAny: false`）のままなので、空でもエディターのものでもない `<desc>` は消えない（「SVGO 既定」「最大圧縮」でも `editor.svg` の `<desc>` が残る）。プリセットのコメント（`SVGO removes by default`）と食い違うが、「オフが効かない」不具合ではないので触っていない。直すなら `removeAny: true` を渡すかを決める必要がある（利用者から見える挙動）

## FX-2 `tests/fixtures/svg-optimizer/expected.json` の作り直し

- 決めたこと：修正後のコード（svgo 4.1.0）で同じ8ケース（2つの SVG × 4つの設定）を出力し直して保存した。テストの見出しとコメントも、liblab の出力と一致を見るものから、期待する出力と一致を見るものに改めた。作り直しに使ったスクリプトはリポジトリに入れていない（テストの `cases` と同じ設定で `optimizeSvg` を呼び、`JSON.stringify(out, null, 2)` で書き出しただけ）
- 理由：T-18 を直すと出力が変わるため（計画の H2）
- liblab の出力と変わる点：
  - `editor.svg`「おすすめ」：`<title>`、`width`・`height`（`120.000mm` は svgo が px の `453.543` に直す）、`<image>`（と、それが使う `xmlns:xlink`）が残る
  - `editor.svg`「SVGO 既定」：`width`・`height`、`<image>` が残る（`removeDimensions`・`removeRasterImages` がオフ）
  - `editor.svg` の独自設定（`keepScripts`・`keepStyleElement` オン）：`<script>` が残る。`<script>` があると svgo は ID の整理と使っていない定義の削除を控えるので、`id`（`svg8`、`grad` など）と使っていないグラデーションも残る。`<style>` は `preset-default` の `inlineStyles` が属性に移してから消すので、この入力では残らない（移せない `@media` を含む `<style>` が残ることは、別のテストで確かめた）。`<image>`、`width`・`height` も残る
  - `icon.svg`「おすすめ」：`<title>`、`width`・`height` が残り、`viewBox` の位置が入力のままになる（前は `removeViewBox` が `viewBox` を消し、続く `removeDimensions` が `width`・`height` から `viewBox` を作り直して末尾に足していた。スイッチを1つずつオンにした出力で確かめた）
  - `icon.svg`「SVGO 既定」：`width`・`height` が残り、`viewBox` が消える（`removeDimensions` がオフで、`removeViewBox` がオン。svgo の `removeViewBox` は `width`・`height` と同じ大きさの `viewBox` を消す）
  - `icon.svg` の独自設定：`width`・`height` が残る
  - 「最大圧縮」は2つとも変わらない（すべてのスイッチがオンのため）
- 他の選択肢：作り直しのスクリプトを `scripts/` に置く（期待値の出どころが追える代わりに、テストの対象のコードで期待値を作る形がはっきり残る）
- 戻すときの作業：`expected.json` を前のコミットのものに戻す（FX-1 も戻す場合）

## FX-3 TW パレット：リセットの状態を React の外の関数に出して、単体テストで確かめる（T-24 の修正）

- 決めたこと：
  - 「調整をリセット」で BASE に入れる値を、`#` を補った入力（`normalizedInputColor` と同じ）にした
  - テストのために、`src/tools/tw-palette-generator/adjustments.ts` を新しく作り、入力の正規化（`normalizeInputColor`）、リセット後の状態（`getResetState`）、履歴の1件の作り方（`createHistoryItem`）と、履歴の型を移した。コンポーネントはそれを呼ぶだけにした。先に不具合のまま関数を出してテストが落ちることを確かめてから直した
  - 履歴の `id` と `timestamp` は、前は `Date.now()` を2回呼んでいたが、1回の値を両方に使うようにした（前は1ミリ秒ずれることがあった）
- 根拠：既存のテストは `node:test` で、DOM もコンポーネントを描画する仕組みもない（`.tsx` は Node から直接読めない）。jsdom や Testing Library を足すより、状態の計算を純粋な関数に出すほうが依存が増えない
- 手で確かめたこと：`astro preview` をブラウザペインで開き、入力欄に `3ba0be` と書いて「調整をリセット」を押すと BASE が `#3BA0BE`（読み上げラベル）、色見本の背景が `rgb(59, 160, 190)` になり、「ヒストリーに保存」で `localStorage` に `baseColor: "#3ba0be"` が入ることを見た。確認後に `tw-palette-history` を元の `[]` に戻した
- 見つけたが直していないこと：スライダーを動かしたときに `adjustColor` が `null` を返すと、BASE に入力欄の文字列がそのまま入る（`adjustedColor || inputColor`）。`null` になるのは入力が色として読めないときだけで、そのときはパレットも作られない
- 他の選択肢：jsdom などを足してコンポーネントを描画して確かめる。`handleReset` の1行だけ直して、テストは手での確認だけにする
- 戻すときの作業：`adjustments.ts` の中身をコンポーネントに戻し、テストを消す

## FX-4 同梱ライブラリのライセンス一覧の作り方（新しい依存は足していない）

- 決めたこと：
  - 既製のパッケージは使わず、`scripts/third-party-licenses.mjs` に Astro のインテグレーションを書いた。中で Vite のプラグインを足し、ビルドの出力からパッケージを集めて、`astro:build:done` で `dist/third-party-licenses.txt` を書く。`astro.config.mjs` の `integrations` に足した
  - 集める範囲：
    - JS：クライアントのビルド（環境名 `client`）の各チャンクの `moduleIds` のうち、`node_modules` の中のもの
    - フォントなどのファイル：すべての環境の出力ファイル（asset）の `originalFileNames` のうち、`node_modules` の中のもの。フォント（`@fontsource-variable/noto-sans-jp`、`@fontsource/roboto-mono`）は prerender の環境から出てくる。`LICENSE` 第4節の「フォントを含む」に合わせて入れた（計画は「クライアントの JS」と書いているので、範囲を広げたことになる）
    - prerender の環境の JS は `dist/` に残らない（サーバー側で HTML を作るだけ）ので数えない
  - 一覧の形：先頭にパッケージ名・版・ライセンス（`package.json` の `license`）の一覧、その後にパッケージごとの区切りと、`LICENSE*`・`LICENCE*`・`COPYING*`・`NOTICE*` の全文。英語で書いた（`LICENSE` と同じ言語）
  - 同梱した JS には、Rolldown の `postBanner`（圧縮の後に足す）で `/*! Third-party licenses: https://unlibra.com/third-party-licenses.txt */` を各チャンクの先頭に入れた。動的 import を持つチャンクでは、Vite が `__vite__mapDeps` の1行をその前に足すので2行目になる。URL は `config.site` から作る
  - 画面（フッターなど）にはリンクを出していない。文言を新しく決めることになるため
- 根拠：計画の第一案（Vite のプラグインでチャンクのモジュール ID から割り出す）。依存を増やさない
- 他の選択肢：`rollup-plugin-license` などの既製のプラグイン（依存が増える。prebundle の中身が見えない点は同じ）。フッターにリンクを出す
- 戻すときの作業：`astro.config.mjs` から1行と import を消し、`scripts/third-party-licenses.mjs`、`tests/third-party-licenses.test.js` を消し、`LICENSE` 第4節の段落を消す

## FX-5 モジュール ID から見えないコードを手で挙げた（親に確認してほしい）

- 見つけたこと：計画の方式（モジュール ID）では、次のコードが見えない
  - svgo の `dist/svgo.browser.js` と JSZip の `dist/jszip.min.js` は、それぞれのパッケージが自分で作った1ファイルのバンドルで、中に他のパッケージを含む。モジュール ID は svgo・jszip の1ファイルとしか出ない
    - svgo 4.1.0：`css-select`、`css-what`、`boolbase`、`nth-check`、`domhandler`、`domelementtype`、`domutils`、`dom-serializer`、`entities`、`css-tree`（3.2.1 と、`csso` の下の 2.2.1 の2つの版）、`mdn-data`（`css-tree` の構文データの元。2.27.1 と 2.0.28）、`source-map-js`、`csso`、`sax`。svgo の依存のうち、バンドルに入っていないのは `commander`・`picocolors`（Node 用）。各パッケージの特徴的な関数名や文字列（`SelectorType`、`nthCheck`、`isDocument`・`hasChildren`、`getOuterHTML`、`xmlReplacer`、`SourceMapGenerator`、`SAXParser`、CSS のプロパティの構文表など）がバンドルにあることで判断した。ソースからの対応づけはしていない（svgo のバンドルの設定は npm の配布物に入っていない）
    - JSZip 3.10.2：`pako`、`lie`、`immediate`、`setimmediate`。`dist/jszip.js`（圧縮前の同じバンドル）のモジュール表で確かめた。`readable-stream` はブラウザ向けには使わない（`stream` を空にしている）ので入っていない
  - Astro の島の読み込み用のスクリプト（`astro-island`）は、HTML に直接書き込まれる（ツールのページ）
  - Tailwind CSS の基本のスタイル（preflight）と生成したクラスは、`@tailwindcss/vite` が CSS に書き出すので、モジュールとして出てこない
- 決めたこと：
  - svgo と JSZip は `PREBUNDLED` に、版と、中に含むパッケージを手で書いた。入っている版が書いた版と違うとビルドを止める（上げたら中身を確かめ直す）。含むパッケージも `名前@版` で書き、ディレクトリは依存関係をたどって探す（`entities` は `dom-serializer` の下、`css-tree@2.2.1` と `mdn-data@2.0.28` は `csso` の下にある）。同じ名前の別の版も別の項目として一覧に載る（FX-8）
  - Astro と Tailwind CSS は `OUTSIDE_MODULE_GRAPH` に理由と一緒に書き、常に一覧に入れる。テストで理由がまだ成り立つこと（HTML に `astro-island` の定義、CSS に preflight の一節）を確かめる
- 限界：今後、別の自前バンドルのパッケージが増えても、自動では気づけない。テストの「一覧のパッケージが期待どおり」で、依存の変化に気づいたときに見直す運用になる
- 親に確認してほしいこと：手で挙げる方式でよいか。とくに、バンドルの中身の判断が文字列の有無によること
- 他の選択肢：svgo と JSZip の含むパッケージは一覧に入れない（計画の方式どおり。各パッケージの著作権表示が落ちる）。依存の全体を入れる（実際には入っていないパッケージも並ぶ）
- 戻すときの作業：`PREBUNDLED`・`OUTSIDE_MODULE_GRAPH` の項目を消し、テストの期待するパッケージの一覧を直す

## FX-6 ライセンスファイルのないパッケージ（boolbase）のライセンス文

- 見つけたこと：svgo のバンドルに含まれる `boolbase` 1.0.0 は、パッケージにライセンスファイルがなく、`package.json` に `"license": "ISC"` と `"author": "Felix Boehm <me@feedic.com>"` があるだけ
- 決めたこと：`LICENSE_FALLBACKS` に `boolbase@1.0.0` の文として、ISC License の定型文に `package.json` の作者名を入れたものを書いた。一覧の boolbase の項目には、「パッケージにライセンスファイルがないので、`package.json` の `license` と `author` から ISC の定型文を作った」という注記（`Note:`）を出す（レビューの推奨による）。キーに版を含めたので、版が変わるとビルドが止まる。ライセンスファイルもこの表の項目もないパッケージがあれば、ビルドを止める（H6）
- 根拠：ISC は著作権表示と許諾の文の同梱を求める。作者名は `package.json` から取ったもので、本人が書いた著作権表示ではない（年もない）
- 他の選択肢：ライセンス文を載せず、名前とライセンス名だけを書く
- 戻すときの作業：`LICENSE_FALLBACKS` の項目を消す（ビルドが止まるので、代わりの扱いを決める必要がある）

## FX-7 `LICENSE` 第4節に足した文（仮）

- 決めたこと：第4節に「このリポジトリから作ったウェブサイトでは、これらのパッケージをライセンス文と著作権表示とともに `/third-party-licenses.txt` に挙げている。一覧はビルド時に `scripts/third-party-licenses.mjs` が作る」という段落を英語で足した
- 根拠：計画の H7。LI-1 と同じく、`LICENSE` の文面はユーザーの確認を経る前提の仮のもの
- 戻すときの作業：その段落を消し、テスト（`tests/third-party-licenses.test.js` の H7）を消す

## FX-8 レビューの指摘で直したこと：同じ名前の別の版、バンドラーのランタイム、vite のライセンス文

- 必須の指摘：svgo のバンドルには `css-tree` が2つの版（svgo の 3.2.1 と、`csso` の下の 2.2.1）で入っていて、2.2.1 とその `mdn-data` 2.0.28 が一覧から漏れていた。`findDependencyDirs` が1つの名前につき1つの版しか拾わなかったため
  - 直したこと：`PREBUNDLED` の含むパッケージを `名前@版` で書き、`findDependencyDirs` は `名前@版` ごとに探すようにした。テストの期待する一覧に2つの版を足し、2つの版が両方載ることを確かめるテストを足した（直す前のビルドで落ちることを確かめた）
- 推奨の指摘（親の判断：載せすぎても害がないので載せる）：クライアントの JS には、Vite の `vite/preload-helper.js` と Rolldown の `rolldown/runtime.js` が仮想モジュール（`�` で始まる ID）として入っている
  - 直したこと：`VIRTUAL_MODULES` に、ID とそのパッケージを書いて一覧に載せる。表にない仮想モジュールや、`node_modules` にもプロジェクトの中にもないモジュールが出てきたらビルドを止める（`packageOfModule`）。テストの H5（ビルド用ツールがないこと）から vite と rolldown を外した。devDependencies、`@tailwindcss/vite`、`@vitejs/plugin-react` などは引き続き確かめる
  - vite の `LICENSE.md` は、Vite のライセンスの後に、Vite の Node.js 用のコードに同梱した依存（`@vercel/detect-agent` など）のライセンスが続く。そのまま載せると、既存のテスト A4（配布物に Vercel の文字列がないこと）に当たった。配るのは Vite 自身のコード（preload-helper）だけなので、`LICENSE_CUTS` で「# Licenses of bundled dependencies」より前（Vite のライセンス）だけを載せ、その旨を注記に出す。区切りの見出しが見つからなければビルドを止める。A4 は変えていない
  - rolldown は `LICENSE`（MIT）だけを載せる。`THIRD-PARTY-LICENSE` はファイル名の形に当たらないので読まない。`runtime.js` は Rolldown 自身のコードと考えた（確かめていない）
- 任意の指摘：SPDX の式がすでに括弧で囲まれているとき（jszip、pako）、先頭の一覧で括弧が二重になっていた。式の全体が1組の括弧で囲まれているときはそのまま出すようにした
- 他の選択肢：vite の `LICENSE.md` を全文載せ、A4 の検査から一覧ファイルを外す（既存のテストを弱めることになる）
- 戻すときの作業：`VIRTUAL_MODULES`・`LICENSE_CUTS` を消し、`packageOfModule` を `packageOfPath` に戻し、テストの期待値を直す
