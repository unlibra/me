# Phase 6 実装計画：切替（コードの部分）

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`
- フェーズ全体に効く制約：3.1（フレームワークと配信）、3.2（URL と旧URLからの301）
- このフェーズの範囲：5章の「6. 切替」のうち、リポジトリの中で完結する部分
- 前フェーズからの申し送り：`docs/decisions/phase-1/parent.md` の P1-1（Web Analytics の自動挿入の確認）、P1-4（`/sitemap.xml` の301）、P1-9（Workers Builds が `.node-version` を読むかの確認）

## このフェーズでやらないこと

外部サービスの操作はすべてユーザーの確認が要るので、このフェーズでは行わない。対象は、Cloudflare での Worker の作成と Workers Builds の接続、独自ドメインの付け替え、Vercel の設定変更、本番へのデプロイ。代わりに、ユーザーが実行するための手順書を書く。

## スコープ

分割しない。スコープは `cutover` の1つで、ブランチ `feat/site-replacement` に直接コミットする。

### cutover

**触ってよい範囲**：`public/_redirects`（新規）、`tests/`、`docs/deploy.md`（新規）。`wrangler.jsonc` は、リダイレクトに必要な設定がある場合だけ触ってよい。

**やること**

1. **`public/_redirects`**：設計書 3.2 の旧URLから新URLへの301を書く。加えて P1-4 の `/sitemap.xml` → `/sitemap-index.xml`（301）。旧URLの末尾スラッシュ付きの形（`/ja/`、`/lab/ja/` など）も、新URLに1回で届くように扱う
2. **テスト**：`_redirects` を読み、次を確かめる
   - 設計書 3.2 の表の旧URLがすべて含まれていて、行き先が表どおりで、ステータスが 301
   - 行き先のパスが `dist/` に実在するページか、一括ルール（`:splat`）の行き先の土台（`/lab`、`/en/lab`）が実在する
   - 新サイトに実在するページのパスを、リダイレクトの元にしていない（実在のページを潰さない）
3. **手動確認**：`wrangler dev`（`npm run preview:cf`）で、旧URLの代表（`/ja`、`/en`、`/ja/`、`/lab/ja`、`/lab/ja/svg-optimizer`、`/lab/en/favicon-generator`、`/lab/en/iromide`、`/sitemap.xml`）にアクセスし、ステータスと行き先を記録する。`/lab/en/iromide` は `/en/lab/iromide` へ301のあと404になること（設計書 3.2）
4. **手順書 `docs/deploy.md`**（日本語）：ユーザーが本番切替のときに使う手順。少なくとも次を含める
   - Cloudflare での Worker の作成と Workers Builds の接続（ビルドコマンド、デプロイコマンド、Node のバージョンが `.node-version` から読まれるかの確認）
   - プレビュー用URL（`*.workers.dev`）での確認項目（全ページ、旧URLの301、`_headers` のヘッダー、Web Analytics の計測タグが挿入されるか）
   - 独自ドメイン `unlibra.com` を Vercel から Workers に付け替える手順と、戻すときの手順
   - 付け替え後の確認項目
   - 各手順の、元に戻せる／戻せないの区別
   - 手順は Cloudflare の公式ドキュメントで確かめた内容だけを書き、確かめられなかった箇所は「要確認」と明記する

**受け入れ条件**

- G1：`npm run build`、`npm run lint`、`npm run format:check`、`npm test` が通る
- G2：上の2のテストがある
- G3：上の3の手動確認の結果が、判断ログに記録されている
- G4：`docs/deploy.md` があり、上の4の項目を含む

**モデル**：標準、推論レベルは親と同じ

**判断ログ**：`docs/decisions/phase-6/cutover.md`

## テスト・実行方法

`docs/decisions/phase-1/plan.md` の「実行方法」と同じ。`wrangler dev` を起動したら、終わったら必ずプロセス（node.exe、workerd.exe、esbuild.exe を含む）を終了させる。

## コミット

- コミットメッセージは英語で、既存の履歴の書き方に合わせる
- `Co-Authored-By` のフッターは付けない
