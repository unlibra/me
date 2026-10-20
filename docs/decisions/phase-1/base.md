# Phase 1 判断ログ（base）

## B-1 `@astrojs/react` は 4 系を入れる

- 決めたこと：`@astrojs/react@^4`（導入時 4.4.2）と React 19 を入れる。`@types/react` と `@types/react-dom` は `astro add react` と同じく `dependencies` に置く
- 根拠：現行の Astro は 5.16。`@astrojs/react` の 5 系以降は Astro 6 以降向け（5.0.0 の開発依存が `astro@6.0.0`）で、4 系の最終版が Astro 5 向け
- 他の選択肢：Astro ごと 6 系以降に上げる。Phase 1 の範囲を超えるので取らなかった
- 戻すときの作業：Astro を上げるときに `@astrojs/react` も合わせて上げる
- 追記（スコープ astro-upgrade）：Astro を 7.4.1 に上げたので、`@astrojs/react` を `^7.1.0` に上げた。7.1.0 は Astro 7 と同じ Vite 8 に依存し、Node の要件（`>=22.22.0`）も Astro 7 と同じ。React 19 と `@types/react` の置き場所は変えていない。新しく増えた任意の peer 依存 `oxc-transform-react` は入れていない

## B-2 `compatibility_date` は workerd のバージョンが示す日付にする

- 決めたこと：`wrangler.jsonc` の `compatibility_date` を `2026-10-19` にした。導入した wrangler 4.151.3 が使う workerd 1.20261019.1 の日付で、この workerd が受け付ける最新の日付。テストは「workerd の日付以前であること」を確かめる（一致は求めない。wrangler を上げただけで落ちないようにするため）
- 根拠：workerd のバージョン `1.YYYYMMDD.x` がサポートする最新の互換日付を表す。`wrangler dev` で警告が出ないことも確認した
- 他の選択肢：作業日（2026-10-21）にする。workerd がまだ対応していない日付になる
- 戻すときの作業：日付を1行変える

## B-3 `vercel.json` のキャッシュ設定はすべて `_headers` に移す

- 決めたこと：受け入れ条件 A8 にある6つのセキュリティヘッダーと `/_astro/*` の immutable に加えて、`/icon.svg`・`/ogp.png`（`s-maxage=86400`）と `/robots.txt`・`/sitemap-index.xml`・`/sitemap-0.xml`（`s-maxage=3600`）の `Cache-Control` も同じ値で移した。`/sitemap.xml` は静的ファイルを削除したので外した
- 根拠：計画の「セキュリティヘッダーとキャッシュ設定を移す」をそのまま読んだ。`_headers` はパターンにまとめ書きができないので1パスずつ書いた
- 他の選択肢：A8 にある `/_astro/*` だけ移す
- 戻すときの作業：`public/_headers` の該当ブロックを消す

## B-4 テストの文字列検査から `tests/` と `package-lock.json` を外す

- 決めたこと：A4（`vercel`）と A5（ミラー用の環境変数名）のソース検査は、git 管理下のファイル（未追跡で ignore されていないものを含む）から `docs/`、`tests/`、`package-lock.json`、画像を除いて行う
- 根拠：`tests/` は検査する文字列そのものを書く必要がある。`package-lock.json` には、Astro の依存 `unstorage` の任意の peer 依存として `@vercel/blob`・`@vercel/functions`・`@vercel/kv` が載る（インストールはされない）。自分のコードでは消せない
- 他の選択肢：テスト内で文字列を分割して書き、`tests/` も検査対象にする。読みにくくなるので取らなかった
- 戻すときの作業：テストの除外条件を変える

## B-5 テストの実行コマンドを `node --test "tests/**/*.test.js"` にする

- 決めたこと：計画の `node --test tests/` ではなく、glob を渡す
- 根拠：Node 24 の `node --test` はディレクトリを引数に取らず、`tests/` をモジュールとして読もうとして失敗する（`Cannot find module ...\tests`）
- 他の選択肢：引数なしの `node --test`（既定の探索パターン）。対象が暗黙になるので取らなかった
- 戻すときの作業：`package.json` の `test` を1行変える
