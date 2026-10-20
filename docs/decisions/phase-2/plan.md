# Phase 2 実装計画：デザイン

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`
- フェーズ全体に効く制約：3.1（フレームワークと配信）、3.2（URL）、3.3（多言語）、3.5（デザイン）、3.7（著作権表示）
- このフェーズの範囲：5章の「2. デザイン」
- 前フェーズの判断：`docs/decisions/phase-1/parent.md` の P1-6（全ページに canonical を出す）

## 前提

- Phase 1 で Astro 7 に更新済み
- デザインのベースは liblab（`C:\Users\User\Projects\unlibra\liblab\frontend`）。読むだけで、liblab のリポジトリは変更しない。主な参照先：
  - `src/components/layout/header.tsx`、`footer.tsx`、`theme-toggle.tsx`、`language-switcher.tsx`
  - `tailwind.config.ts`（色トークン）
  - `src/app/[locale]/layout.tsx`（body の配色、フォント変数）
- ロゴシンボル：`C:\Users\User\Projects\unlibra\unlibra.github.io\brand\symbol.svg`（コピーして使う。元ファイルは変更しない）
- トップページの中身（作品一覧など）の作り直しは Phase 3。このフェーズでは、既存の中身を新しい共通レイアウトに載せ替えるだけでよい。X 風の部品やトークンが残っていても、Phase 3 で消すので構わない

## 親が決めた仮のデザイン方針

ユーザーは「UIデザインは最後にまとめてチェックする」と言っている。それまでは以下の仮の方針で作る。根拠と戻し方は `parent.md` の P2-1〜P2-4。

- ヘッダー：左にロゴシンボルとサイト名「unlibra.com」。右に「ツール」へのリンク（日本語ページは `/lab`、英語ページは `/en/lab`）、GitHub へのアイコンリンク、テーマ切替。言語切替は、ページが別言語版を持つときだけ出す（Phase 4 のツールページ用）。項目が少ないのでハンバーガーメニューは作らない
- フッター：ロゴとサイト名、短い説明文、リンク（GitHub、支援＝ofuse、プライバシーポリシー）、著作権表示「© 2025 unlibra」。ツールの一覧の列は Phase 4 で足す
- 色：liblab の色トークン（`atom-one-dark`、`logo`）とライト・ダークの配色をそのまま使う
- サイト名の文字のフォントは本文と同じ Noto Sans JP（LINE Seed JP は未決のため使わない）

## スコープ

分割しない。スコープは `layout` の1つで、ブランチ `feat/site-replacement` に直接コミットする。

### layout

**触ってよい範囲**：`src/`、`public/`、`tests/`、`scripts/`（新規）、`package.json`、`package-lock.json`、`astro.config.mjs`。`docs/replace-plan.md` と `docs/decisions/phase-2/parent.md` は除く。

**やること**

1. **色とテーマの土台**：liblab の色トークンを `src/styles/global.css` の Tailwind v4 `@theme` に移す。ダークモードは `.dark` クラス方式（`@custom-variant dark`）
2. **共通レイアウト** `BaseLayout`：`<html lang>`、title、description、canonical、OGP、Twitter カード、favicon、テーマの初期化スクリプト、共通 CSS を出す。プロパティで言語（ja / en）と、別言語版のURL（hreflang 用、任意）を受け取る
   - canonical と og:url は `https://unlibra.com` + パス（末尾スラッシュなし、トップは `https://unlibra.com`）
   - 404 ページには canonical を出さない
3. **テーマ切替**：ライト / ダーク / システムの3択（liblab と同じ）。選択は `localStorage` に保存し、既定はシステム。ページ描画前に `<head>` 内のインラインスクリプトでクラスを付け、ちらつきを防ぐ。`localStorage` が使えない環境でも例外で止まらないこと。切替 UI は React を使わず、Astro コンポーネントと素の JS で作る（ポートフォリオのページに React を読み込ませないため）。ポップオーバーはキーボードで操作でき、Escape と外側クリックで閉じる
4. **ヘッダーとフッター**：上の仮方針どおり。日本語版と英語版の文言を持ち、ja と en で同じキーを持つことを型で保証する
5. **フォント**：`@fontsource-variable/noto-sans-jp` を本文に、`@fontsource/roboto-mono` を等幅に使う（等幅は Phase 4 のツールで使う。liblab と同じ）。`@fontsource/ibm-plex-sans-jp` は削除する
6. **ロゴと各種アイコン**：`symbol.svg` を `src/assets/brand/symbol.svg` にコピーし、ヘッダーとフッターで使う。`public/icon.svg` を新しいシンボルに置き換え、`favicon.ico`（32px を含む）と `apple-touch-icon.png`（180px）を作る。OGP 画像 `public/ogp.png`（1200×630）を新しいシンボルで作り直す。生成は `scripts/` に置くスクリプトで行い、生成物をコミットする。画像処理に `sharp` を使う場合は devDependencies に明示的に追加する。古い `assets/ogp-frame.png` は使わなくなるので削除する
7. **既存ページの載せ替え**：`/`、`/privacy`（`MarkdownLayout` は `BaseLayout` を使う形にする）、`/404` を `BaseLayout` とヘッダー・フッターに載せ替える

**受け入れ条件**

- C1：`npm run build`、`npm run lint`、`npm run format:check`、`npm test` が通る
- C2：404 以外のすべての HTML に canonical がちょうど1つあり、値が `https://unlibra.com` + パス（末尾スラッシュなし）。og:url も同じ値。404 には canonical がない
- C3：すべての HTML の `<head>` に、テーマ初期化のインラインスクリプトがスタイルシートより前にある
- C4：`/`、`/privacy`、`/404` にヘッダーとフッターがあり、フッターに「© 2025 unlibra」、GitHub・ofuse・`/privacy` へのリンクがある
- C5：`dist/` に `icon.svg`、`favicon.ico`、`apple-touch-icon.png`、`ogp.png` があり、HTML から参照されている。`ogp.png` は 1200×630。`icon.svg` は新しいシンボル
- C6：本文のフォントが Noto Sans JP で、そのフォントファイルが `dist/` に含まれる。IBM Plex の参照が残っていない
- C7：`/` と `/privacy` の HTML が React のランタイムを読み込んでいない
- C8：ヘッダー・フッターの文言は ja と en で同じキーを持つ（型チェックで保証。`astro check` が通ること）
- C9（手動）：ライト / ダーク / システムの切替がページ遷移後も保持される、ちらつかない、`localStorage` を無効にしても表示が崩れない。手で確かめて報告する。見た目の最終確認は親がブラウザで行う

**モデル**：標準、推論レベルは親と同じ

**判断ログ**：`docs/decisions/phase-2/layout.md`

## テスト

- Phase 1 と同じく `node:test` で `tests/` に書く。ビルド結果（`dist/`）を検証する結合テスト
- ブロックごとに全体（build、lint、format:check、test）を回す
- 実行方法とログの扱いは `docs/decisions/phase-1/plan.md` の「実行方法」と同じ

## 共有ファイル

`package.json`、`package-lock.json`、`src/styles/global.css` は、このスコープだけが触る。

## 判断ログ

- 置き場所：`docs/decisions/phase-2/`
- 親用：`parent.md`
- スコープ `layout` 用：`layout.md`

## コミット

- コミットメッセージは英語で、既存の履歴の書き方に合わせる
- `Co-Authored-By` のフッターは付けない
