# Phase 1 実装計画：基盤

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`
- フェーズ全体に効く制約：3.1（フレームワークと配信）、3.2（URL）、3.3（多言語）
- このフェーズの範囲：5章の「1. 基盤」

## スコープ

分割しない。スコープは `base` の1つで、ブランチ `feat/site-replacement` に直接コミットする。

### base

**触ってよい範囲**：リポジトリ全体。ただし `docs/replace-plan.md` と `docs/decisions/phase-1/parent.md` は除く。README の書き換えは Phase 5 で行うので触らない。

**やること**

1. Vercel 関連の削除：`vercel.json`、`middleware.ts`、`functions/`、`@vercel/analytics`、`src/components/Analytics.astro` とその利用箇所。`tsconfig.json` の `exclude` にある `middleware.ts` も外す
2. ロケール付きページの廃止：`src/pages/[locale]/index.astro` を日本語のみの `src/pages/index.astro` にする。`src/middleware.ts`、`src/i18n.ts`、`src/messages/en.ts`、`src/components/LanguageSwitcher.astro` を削除し、日本語のメッセージは直接読み込む。`@i18n-tiny/astro` は Phase 4 でツールの日英に使うので、依存は `package.json` に残す
3. ミラーサイトの仕組みの廃止：`.env.example` を削除。`src/config/site.ts` と `src/config/profile.ts` の値を定数にし、`site.url` と `site.canonicalUrl` を1つにまとめる。`astro.config.mjs` の `loadEnv` をやめて `site: "https://unlibra.com"` に固定。`src/layouts/MarkdownLayout.astro` のサイト名も定数を使う。`src/pages/robots.txt.ts` は `DISABLE_ROBOTS` の分岐をなくし、Sitemap 行は `@astrojs/sitemap` が出力する `/sitemap-index.xml` を指す
4. `public/sitemap.xml`（静的ファイル版）を削除する
5. `@astrojs/react`、`react`、`react-dom`、`@types/react`、`@types/react-dom` を追加し、`astro.config.mjs` に統合を登録する
6. `wrangler` を devDependencies に追加し、`wrangler.jsonc` を作る
   - `name`: `unlibra-com`
   - `compatibility_date`: 導入した wrangler が受け付ける最新の日付
   - `assets.directory`: `./dist`
   - `assets.html_handling`: `drop-trailing-slash`（設計書 3.1 の末尾スラッシュなし）
   - `assets.not_found_handling`: `404-page`
   - Worker のスクリプト（`main`）は持たない
   - `package.json` に `wrangler dev` を動かすスクリプト（例：`preview:cf`）を追加
7. `src/pages/404.astro` を作る。中身は最小限（「ページが見つかりません / Page not found」とトップへのリンク）。デザインは Phase 2 で整える
8. `public/_headers` に、`vercel.json` にあったセキュリティヘッダーとキャッシュ設定を移す。`Cache-Control` に `no-transform` は付けない（Cloudflare Web Analytics の自動挿入が効かなくなるため。`parent.md` の P1-1 を参照）
9. テストの仕組みを作る（下の「テスト」を参照）

**受け入れ条件**

- A1：`npm run build`、`npm run lint`、`npm run format:check` が通る
- A2：ビルド結果に `index.html`、`404.html`、`privacy` のページ、`robots.txt`、`sitemap-index.xml`、`_headers` がある
- A3：ビルド結果にロケール別のページ（`ja/`、`en/`）がない
- A4：ビルド結果とソース（`docs/` を除く）に `vercel` の文字列が残っていない。`@vercel/analytics` が `package.json` にない
- A5：ビルド結果とソースから、ミラー用の環境変数（`PUBLIC_SITE_URL`、`PUBLIC_SITE_TITLE`、`PUBLIC_PROFILE_NAME`、`PUBLIC_PROFILE_USERNAME`、`DISABLE_ROBOTS`）の参照がなくなっている
- A6：`robots.txt` が全許可で、Sitemap 行が `https://unlibra.com/sitemap-index.xml`
- A7：`index.html` の canonical と og:url が `https://unlibra.com`、hreflang を出していない
- A8：`dist/_headers` に、`vercel.json` にあった6つのセキュリティヘッダーと、`/_astro/*` の immutable キャッシュがある。`no-transform` を含まない
- A9：`wrangler.jsonc` が上の6の設定どおり
- A10：`wrangler dev` で起動したとき、`/` が 200、`/privacy` が 200、存在しないパスが 404 で `404.html` の中身を返す、`/privacy/` が末尾スラッシュなしへリダイレクトされる。これは自動テストにせず、手で確かめて報告する

**モデル**：標準、推論レベルは親と同じ

**判断ログ**：`docs/decisions/phase-1/base.md`

### astro-upgrade（`base` の完了後に追加）

**触ってよい範囲**：`package.json`、`package-lock.json`、`astro.config.mjs`、`tsconfig.json`、`eslint.config.js`、`.prettierrc`、`src/`、`tests/`。Astro の移行ガイドで必要になった変更に限る。

**やること**

1. Astro を 5 系から最新の 7 系に上げる。`@astrojs/react`、`@astrojs/sitemap`、`@astrojs/check`、`eslint-plugin-astro`、`prettier-plugin-astro` など Astro に連動するパッケージも、Astro 7 に対応する版に上げる。公式のアップグレード手順（`npx @astrojs/upgrade` など）があれば使ってよい
2. Astro 6 と 7 の移行ガイドを読み、このリポジトリに当たる破壊的変更に対応する
3. `@astrojs/react` の版を決めた判断ログ B-1 を、更新後の内容に合わせて追記する（元の記録は消さない）

**受け入れ条件**

- U1：`package.json` の `astro` が 7 系で、`npm ls astro` に 7 系以外の Astro が出ない
- U2：`base` の受け入れ条件 A1〜A9 が引き続き満たされる（既存テストをそのまま通す。テストを弱めない）
- U3：Astro 7 の型チェック（`astro check`）が警告なく通る。非推奨 API の警告がビルドに出ない
- U4：A10（`wrangler dev` での確認）を手で再確認して報告する

**モデル**：標準、推論レベルは親と同じ

**判断ログ**：`docs/decisions/phase-1/astro-upgrade.md`（B-1 の追記だけは `base.md` に書く）

## テスト

- 既存のテストはない。依存を増やさないため、Node 標準の `node:test` を使う
- 置き場所は `tests/`。ビルド結果（`dist/`）とリポジトリのファイルを読んで検証するテストを書く
- `package.json` に `"test": "node --test tests/"` を追加する。`dist/` が必要なので、テストの前に `npm run build` を実行する
- テストの層：ビルド結果に対する結合テスト。`wrangler dev` 上の振る舞い（A10）は手動確認
- ブロックごとに全体（build、lint、format:check、test）を回す

## 実行方法

Node は fnm で入れた v24.22.0 を使う。fnm のシェル連携は効かないので、PATH に直接足す。

PowerShell：

```powershell
$env:PATH = "C:\Users\User\AppData\Roaming\fnm\node-versions\v24.22.0\installation;$env:PATH"
```

Git Bash：

```bash
export PATH="/c/Users/User/AppData/Roaming/fnm/node-versions/v24.22.0/installation:$PATH"
```

出力はログファイルに出し、失敗と末尾だけ読む。ログはリポジトリの外（`$env:TEMP\claude\` など）に置く。

```powershell
npm run build *> "$env:TEMP\claude\p1-build.log"; $LASTEXITCODE
npm run lint *> "$env:TEMP\claude\p1-lint.log"; $LASTEXITCODE
npm run format:check *> "$env:TEMP\claude\p1-format.log"; $LASTEXITCODE
npm test *> "$env:TEMP\claude\p1-test.log"; $LASTEXITCODE
```

変更前の状態で、`npm ci`、`npm run build`、`npm run lint` が通ることは確認済み。`format:check` は未確認。変更前から失敗している場合は、その旨を報告し、自分が触ったファイルだけ整形する。

## 共有ファイル

`package.json` と `package-lock.json` は、このスコープだけが触る。依存の追加と削除は npm コマンドで行う。

## 準備

worktree は使わない。`node_modules` は導入済み。

## 判断ログ

- 置き場所：`docs/decisions/phase-1/`
- 親用：`parent.md`
- スコープ `base` 用：`base.md`

## コミット

- コミットメッセージは英語で、既存の履歴の書き方に合わせる
- `Co-Authored-By` のフッターは付けない
