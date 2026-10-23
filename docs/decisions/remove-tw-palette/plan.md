# TWパレットジェネレーターの廃止（ユーザーの指示、2026-10-23）

## 参照する文書

- 設計書：`docs/replace-plan.md`（3.2 URL、3.4 ツール、3.7 ライセンス）
- デザインの指針：`DESIGN.md`
- 前例：イロマイドの廃止（設計書 3.4、`public/_redirects` の「the removed Iromide is forwarded too and ends in 404」）

## ユーザーの指示

TWパレットジェネレーターを廃止する。ページとリンク、テストコードを撤去する。

## やること

1. **ページとツールの撤去：** `/lab/tw-palette-generator` と `/en/lab/tw-palette-generator` を作らない。`src/tools/tw-palette-generator/` を消す。`src/config/tools.ts`（`toolIds`、アイコン）、`ToolPage.astro`（島と幅）、ツールの文言（`src/tools/messages/ja.ts`・`en.ts` の `tools["tw-palette-generator"]` と `twPaletteGenerator`）、`src/tools/styles.css` など、このツールだけが使うものを消す。ほかのツールが使う共通部品は残す
2. **リンクの撤去：** トップの Apps のカード（`src/config/works.ts`、`src/messages/ja.ts`）。ほかにリンクや言及があれば消す（サイトマップは自動）
3. **古い URL：** 前例（イロマイド）に合わせ、`/lab/tw-palette-generator` などは 404 にする（転送しない）。`public/_redirects` の旧 URL（`/lab/ja/tw-palette-generator/` などの静的な規則）を消し、`/lab/ja/*` → `/lab/:splat` の転送の先で 404 になる形にする。ユーザーが別の扱い（`/#apps` への転送など）を選んだら親が伝える
4. **ライセンスとクレジット：** Tailwind CSS v3 の色の値はこのツールだけが使っている。`LICENSE` 第2節の該当の項目、`LICENSES/tailwindcss-MIT.txt`、クレジットのページの項目を消す（`tailwindcss` のパッケージ自体は CSS の生成に使っているので、`/third-party-licenses.txt` には残る。そこは自動の一覧に従う）。DiceBear の項目の対象ファイルから `src/assets/tools/tw-palette-generator.svg` を外し、ファイルも消す。テストのフィクスチャ（`tests/fixtures/tw-palette-generator/`）も消す
5. **テストの撤去：** このツールだけのテスト（`tests/tw-palette-generator.test.js`、`tests/spec/tw-palette-generator.test.js`、`tests/e2e/tw-palette-generator.spec.js` など）を消す。ほかのテストの中のこのツールの部分（件数、ページの一覧、文字の検査の対象など）は、3つのツールに合わせて直す。弱めるのは撤去した分だけにする
6. **文書：** `docs/replace-plan.md`（残すツールの一覧など）、`docs/deploy.md`、`DESIGN.md`（パレットに触れている箇所）、`README.md` を合わせる。過去の判断ログ（`docs/decisions/` の既存のファイル）は記録なので書き換えない
7. **プライバシーポリシー：** ローカルストレージの説明（「一部ツール機能の設定の保持」）が、パレットの履歴を消したあとも正しいかを確かめる。ほかに保存しているものがなければ、文面の修正を判断ログに仮の文面として書き、親に返す（ユーザーの確認が要る）

## 受け入れ条件

- build、lint、format:check、`npm test`、`npm run test:e2e` が通る。撤去で直した既存テストは判断ログに一覧で書く
- ビルドの出力に `tw-palette` とパレットのツールの文言が残っていない（テストで確かめる）
- 旧 URL（`/lab/tw-palette-generator`、`/en/lab/tw-palette-generator`、`/lab/ja/tw-palette-generator`、`/lab/en/tw-palette-generator` とその末尾スラッシュ付き）が 404 になる（`_redirects` のテストと E2E）
- `LICENSE`、`LICENSES/`、クレジットのページ、`/third-party-licenses.txt` の整合のテストが通る
- 幅 375px と 1280px、ライトとダークで、トップの Apps が崩れない

## 進め方

- スコープは1つ（`remove-tw-palette`）、ブランチ `feat/site-replacement` で直列。モデルは標準
- Node は PATH に `C:\Users\User\AppData\Roaming\fnm\node-versions\v24.22.0\installation` を足す。PowerShell 5.1 の Get-Content / Set-Content で日本語のファイルを書かない
- ポート 8790 は使わない。E2E のあとポート 8788 にサーバーが残っていないことを確かめる
- 判断ログ：`docs/decisions/remove-tw-palette/remove-tw-palette.md`
- workers.dev へのデプロイ、push はしない（親がする）
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない
