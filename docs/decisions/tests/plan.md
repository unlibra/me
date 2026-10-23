# 追加作業の実装計画：テストの拡充と本番確認スクリプト

## 背景

Phase 4 のツールの単体テストは「liblab と同じ出力になること」を確かめる作りで、liblab が元から持っていた不具合（`phase-4/tools.md` の T-18、T-24）を正解として固定していた。ツールの画面操作は手動確認（E7）だけだった。ユーザーは、ツールの挙動をすべて自動テストで確かめることを求めた（2026-10-21）。あわせて、本番切替のあとの確認を機械的に行うスクリプトを用意する。

## 参照する文書

- 設計書：`docs/replace-plan.md`（3.1、3.2、3.4）
- `docs/decisions/phase-4/tools.md`（T-13〜T-24、手動確認の記録 E7）
- `docs/decisions/phase-6/cutover.md` と `docs/deploy.md`（付け替え後の確認項目）
- `docs/decisions/fixes/plan.md`（このスコープより先に完了していること）

## 決まっていること

- E2E テストに Playwright を devDependencies として追加する（ユーザー承認済み）。ブラウザは Chromium だけを使う
- テストは GitHub Actions で回し、デプロイは Workers Builds が行う（ユーザー決定）。Workers Builds では E2E を回さない
- main にブランチ保護をかけ、GitHub Actions のテストが通らないとマージできないようにする（ユーザー承認済み。設定は親が行う）

## スコープ

分割しない。スコープは `tests` の1つで、ブランチ `feat/site-replacement` に直接コミットする。

### ブロック1：仕様のテスト（単体）

- 4ツールの全オプションについて、「あるべき挙動」を確かめるテストを足す。liblab との一致を確かめる既存のテストは残す（移植の検査として）
  - SVG Optimizer：各スイッチとプリセットが、該当するプラグインの実行・不実行と出力に反映される
  - Favicon Generator：各出力形式・サイズ・角丸・背景色の組み合わせが、出力のファイル構成と寸法に反映される
  - Password Generator：長さ、各文字種、紛らわしい文字の除外の組み合わせ
  - TW Palette Generator：入力の形式（`#` の有無、大文字小文字、3桁）、各スライダー、リセット、履歴の保存と読み込み
- 受け入れ条件：
  - I1：各ツールのオプションごとに、仕様を確かめるテストがある。テストの一覧を判断ログに表で残す

### ブロック2：E2E テスト（Playwright）

- `npm run test:e2e` で、ビルド結果をローカルで配信して Playwright を実行する。配信は `wrangler dev`（本番と同じ Workers の配信）を第一案とする
- 4ツールの主な操作を、日英の両方で自動化する。Phase 4 の E7 の手動確認の項目をすべて置き換えること
  - ファイルの投入（選択とドラッグ&ドロップ）、不正なファイルのエラー、ダウンロードの中身
  - スイッチ・プリセット・スライダーの操作が結果に反映されること
  - コピー（クリップボード）、トースト
  - TW Palette Generator の履歴（`localStorage`）の保存・削除・liblab 形式の読み込み
- サイト全体：テーマ切替（ライト / ダーク / システム、ページ遷移後の保持）、言語切替、幅 375px と 1280px で横スクロールが出ないこと、旧URLの301（`_redirects`）
- 受け入れ条件：
  - I2：`npm run test:e2e` が通る。Phase 4 の E7 の項目と、テストの対応表を判断ログに残す
  - I3：テスト用のサーバーとブラウザのプロセスが、テストの終了後に残らない

### ブロック3：本番確認スクリプト

- `npm run check:prod -- <base URL>` で、指定した URL のサイトを検査するスクリプト（`scripts/` に置く）。`workers.dev` の URL にも、本番の `https://unlibra.com` にも使える
- 検査項目：
  - 全ページ（サイトマップに載っているもの）が 200
  - 旧URLの 301 と転送先（`_redirects` の全行）
  - `_headers` のヘッダー
  - `robots.txt`、`sitemap-index.xml`
  - `x-vercel-id` が付いていない（Vercel から配信されていない）
  - Cloudflare Web Analytics の計測タグが HTML に挿入されているか（結果を表示する。挿入されていなくても失敗にはせず、警告にする。P1-1）
- 受け入れ条件：
  - I4：ローカルの `wrangler dev` に対して `check:prod` を実行し、計測タグ以外がすべて通る

### ブロック4：GitHub Actions のワークフロー

- `.github/workflows/` に、push と pull request で動くワークフローを足す。内容は `npm ci`、build、lint、format:check、`npm test`、`npm run test:e2e`
- Node は `.node-version` から読む。Playwright のブラウザは Chromium だけを入れる。E2E が落ちたときに原因を追えるよう、Playwright のレポートや記録を成果物（artifact）として残す
- Cloudflare の API トークンなど、シークレットは使わない。ワークフローの権限（`permissions`）は読み取りだけに絞る。使う外部の Action は公式（`actions/*`）に限り、バージョンはコミットの SHA で固定する
- ブランチ保護で必須にするチェックの名前が分かるよう、ジョブ名を判断ログに書く
- 受け入れ条件：
  - I5：ワークフローの YAML が上の条件を満たす。push 後に GitHub 上で実行が通ることは、親が確かめる

## 共通

- build、lint、format:check、test を通す。既存のテストは弱めない
- 判断ログ：`docs/decisions/tests/tests.md`
- 実行方法とログの扱いは `docs/decisions/phase-1/plan.md` の「実行方法」と同じ
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない

## 親の記録：ブランチ保護（2026-10-21、ユーザー承認済み）

GitHub Actions の `Test` ワークフローが GitHub 上で通ったこと（run 39572302668、Linux で E2E を含めて成功）を確かめてから、main にブランチ保護をかけた。

- 必須のステータスチェック：`test`（GitHub Actions のアプリ、app_id 15368 に限定。同名のチェックを別のアプリが出しても通らない）
- `strict`（マージ前にブランチを最新にすること）：オフ
- force-push と削除：禁止
- 管理者への適用（`enforce_admins`）：オフ。リポジトリの管理者は緊急時に保護を迂回できる
- PR のレビュー必須：なし（一人で開発しているため）
