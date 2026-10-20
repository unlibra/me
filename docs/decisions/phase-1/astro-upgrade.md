# Phase 1 判断ログ（astro-upgrade）

## U-1 `compressHTML` は Astro 7 の既定（`"jsx"`）のままにし、必要な空白を明示する

- 決めたこと：`compressHTML` を設定せず、Astro 7 の既定 `"jsx"` を使う。要素や式のあいだの改行が消える影響を、ビルド結果の表示テキストを更新前と比べて調べた。見た目が変わるのはフッターの `© 2026 unlibra` が `© 2026unlibra` になる1か所だけだったので、年と名前を同じ行に書いて空白を残した。ほかの差分は flex コンテナ内の要素間の空白で、表示には影響しない。回帰テストを足した
- 根拠：Astro 7 の移行ガイドは `{" "}` を足すか `compressHTML: true` にするかの2案を示している。更新後の `prettier-plugin-astro` 1 系は `"jsx"` の空白の扱いを前提に整形し、`<a>` の中身を別の行に分ける。`true` に戻すと、整形した箇所でリンクの前後に空白が入る
- 他の選択肢：`compressHTML: true` にして Astro 5 の挙動に戻す
- 戻すときの作業：`astro.config.mjs` に `compressHTML: true` を足し、`prettier-plugin-astro` の整形結果を見直す

## U-2 `vite.esbuild.drop` を Rolldown の minify 設定に置き換える

- 決めたこと：`vite.esbuild.drop: ["console", "debugger"]` を `vite.build.rolldownOptions.output.minify.compress.{dropConsole, dropDebugger}` に置き換えた
- 根拠：Vite 8 は `esbuild` の設定を非推奨にしている。`oxc` の設定と両方あると `esbuild` 側を無視するという警告がビルドに出て、`console` が消えなくなっていた。Vite の移行ガイドが示す置き換え先を使った。ページのスクリプトに `console.log` と `debugger` を一時的に入れてビルドし、新しい設定では両方が消え、`false` にすると残ることを確かめた
- 他の選択肢：`drop` の設定ごとやめる。今のソースには `console` がないが、元の意図（本番に `console` を残さない）が失われる
- 戻すときの作業：`astro.config.mjs` の `build` ブロックを消す

## U-3 ESLint を 10 系に上げる

- 決めたこと：`eslint-plugin-astro` を 3 系に上げた。この版が peer 依存に `eslint >=10` を求めるので、`eslint` を 9 系から 10 系に上げた。`typescript-eslint` と `@typescript-eslint/parser` も 8.72 に上げた（3 系が `>=8.61.0` を求める）
- 根拠：`eslint-plugin-astro` 3 系の構文解析器（`astro-eslint-parser` 3 系）は、Astro 7 と同じ Rust 版コンパイラ（`@astrojs/compiler-rs`）を使う。1 系は Astro 5 までの Go 版コンパイラを使う。`eslint.config.js` はもとから flat config なので、変更は要らなかった
- 他の選択肢：`eslint-plugin-astro` を 1 系のまま残す（ESLint 9 で動くが、構文の解釈が Astro 7 とずれる可能性がある）
- 戻すときの作業：`npm install -D eslint@^9 eslint-plugin-astro@^1` を実行する

## U-4 Tailwind を 4.3 に上げ、Vite を1つにまとめる

- 決めたこと：`tailwindcss` と `@tailwindcss/vite` を 4.3.3 に上げた。そのあと `npm dedupe` を実行し、`@tailwindcss/vite` と `vitefu` の peer 依存の Vite を Astro と同じ 8.3.4 にまとめた
- 根拠：Astro を上げただけでは、ルートの `vite` が 7.2.6 のまま残り、`@tailwindcss/vite` がそれを参照していた。`@tailwindcss/vite` 4.3.3 の peer 依存には Vite 8 が含まれる。Vite が1つになったので、`astro.config.mjs` の型の食い違いを抑えるための `@ts-expect-error` も不要になった（残すと `astro check` が「未使用」のエラーを出す）
- 他の選択肢：`vite` を直接の依存に加えて版を固定する
- 戻すときの作業：Tailwind の版を戻す

## U-5 `prettier-plugin-astro` 1 系の整形結果を受け入れる

- 決めたこと：`prettier-plugin-astro` を 0.14 から 1.1 に上げた。これによって `format:check` が落ちるようになった `src/` の7ファイルを整形し直した（`Avatar.astro`、`SponsorButton.astro`、`LocationIcon.astro`、`PinIcon.astro`、`MarkdownLayout.astro`、`404.astro`、`index.astro`）。内容は変えていない
- 根拠：1 系は Astro 7 の Rust 版コンパイラで構文を解析する。整形後のビルド結果について、表示テキストを更新前と比べた（U-1 を参照）
- 他の選択肢：0.14 系のまま残す（0.14 系は Astro 5 までの Go 版コンパイラで構文を解析する）
- 戻すときの作業：プラグインの版を戻して整形し直す

## U-6 sitemap のトップページの URL は末尾の `/` 付きを受け入れる（親の判断）

- 決めたこと：`sitemap-0.xml` のトップページが `https://unlibra.com/` になるのを受け入れ、テスト「A6: sitemap lists the top page and privacy only」の期待値を `https://unlibra.com` から `https://unlibra.com/` に変えた。canonical と og:url（`https://unlibra.com`）は変えない
- 根拠：`@astrojs/sitemap` 3.7.4 が、`trailingSlash: "never"` のときにトップページの末尾の `/` を消す処理を、不具合の修正として取り除いた（CHANGELOG の 3.7.4）。上流の仕様が変わったので期待値を合わせたのであり、テストを弱めたのではない。検査する内容（トップページと privacy の2件だけが載ること）は変わっていない。オリジンだけの URL は `/` があってもなくても同じリソースを指す（どちらもリクエストのパスは `/`）。3.6.0 は Astro 6 で廃止された API を使っているので残せない。中の `sitemap` ライブラリが URL を正規化し直すので、`serialize` オプションでは元に戻せない
- 他の選択肢：ビルドの後に sitemap を書き換える自前の統合を足す（上流が消した処理を作り直すことになる）。canonical と og:url を `/` 付きに揃える（A7 が変わる）
- 戻すときの作業：テストの期待値を1行戻し、ビルドの後に sitemap を書き換える処理を足す
