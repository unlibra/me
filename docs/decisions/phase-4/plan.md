# Phase 4 実装計画：ツール移植

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`
- フェーズ全体に効く制約：3.1（フレームワークと配信）、3.2（URL）、3.3（多言語）、3.4（WEBツール）、3.7（ライセンス）
- このフェーズの範囲：5章の「4. ツール移植」
- 前フェーズの判断：`docs/decisions/phase-2/parent.md`、`docs/decisions/phase-3/parent.md`、親の `docs/decisions/phase-4/parent.md`

## 前提

- 移植元：`C:\Users\User\Projects\unlibra\liblab\frontend`（Next.js 16、Tailwind v3）。読むだけで、liblab のリポジトリは変更しない
- 移植するツール：`tw-palette-generator`、`favicon-generator`、`svg-optimizer`、`password-generator`。イロマイド（`iromide`）と、それだけが使うコード（`lib/api/`、`lib/utils/cheki.ts`、`components/ui/spinner.tsx`、`x-share-button.tsx`、`share-button.tsx` など）は移植しない
- ツールの機能・挙動・生成結果は変えない。変えてよいのは、フレームワークの違い（Next.js → Astro + React island）と Tailwind v3 → v4 に伴う書き換えだけ
- `BaseLayout`、ヘッダー、フッター、言語切替、テーマ切替は Phase 2 で完成している。Phase 3 でツールのアイコンが `src/assets/tools/` に置かれている

## ディレクトリとライセンスの境界（親の判断 P4-1）

設計書 3.7 で、WEBツールの実装コードと共通UI部品は MIT、それ以外は All rights reserved と決まっている。Phase 5 でこの境界を `LICENSE` に書くので、このフェーズで置き場所を次のように固定する。

- MIT 側：`src/tools/**`（ツールのロジック、React コンポーネント、ツールの文言）と `src/components/ui/**`（共通UI部品）
- All rights reserved 側：それ以外（ページ、レイアウト、ポートフォリオ）
- MIT 側のコードは、All rights reserved 側のファイルを import してはいけない（MIT として切り出したときに単体で成り立つようにするため）。逆向き（ページが MIT 側を import する）はよい。この制約を ESLint のルール（`no-restricted-imports` など）で強制する
- ツールのアイコン（Phase 3 で `src/assets/tools/` に置いたもの）は、どちらのライセンスにするか未決（Phase 3 の P3-2、Phase 5 で決める）。それまでは All rights reserved 側として扱い、MIT 側のコードからは参照しない。アイコンが要る箇所（ツールページの見出し、一覧のカード、フッター）は Astro のページ側で描画する

## スコープ

分割しない。スコープは `tools` の1つで、ブランチ `feat/site-replacement` に直接コミットする。ブロックの目安は次のとおり（子が調整してよい）。

1. 土台：ツール用の文言（ja/en）と、React island から文言を引く仕組み、共通UI部品、トースト、パンくず、ツールページのテンプレート、ツール一覧ページ（`/lab`、`/en/lab`）、フッターのツール一覧の列、ESLint の境界ルール
2. Password Generator と SVG Optimizer
3. Favicon Generator
4. TW Palette Generator

### tools

**触ってよい範囲**：`src/`、`tests/`、`package.json`、`package-lock.json`、`eslint.config.js`、`astro.config.mjs`。`docs/replace-plan.md` と `docs/decisions/phase-4/parent.md` は除く。

**やること**

1. **ページ**：`/lab`（日本語）、`/en/lab`（英語）のツール一覧と、`/lab/{tool}`、`/en/lab/{tool}` の4ツールのページ。すべて `BaseLayout` を使い、`lang`、canonical、hreflang（ja / en / x-default=ja）を出す。英語ページの言語切替は日本語版へ、日本語ページは英語版へ
2. **ツール一覧ページ**：ツールのカード（アイコン、名前、短い説明）を並べる。見た目は liblab のトップページのツールカードに合わせた仮のデザイン。liblab のトップにあった紹介文・支援セクションは載せない（新しい文言を増やさないため）
3. **ツールページ**：liblab と同じく、パンくず、ツール本体（React island、`client:load` など）、構造化データ（`WebApplication` の JSON-LD）。title と description は liblab の文言を使う
4. **文言**：liblab の `src/messages/{ja,en}/` からツールに要る分を `src/tools/` 以下に移す。ja と en が同じキーを持つことを型で保証する（Phase 2 の `SameStructure` と同じ方式。ただし MIT 側から All rights reserved 側を import しないので、型は MIT 側に置く）
5. **依存**：`@headlessui/react`、`@heroicons/react`、`jszip`、`svgo` など、移植したコードが使うものを追加する。`next`、`next-themes`、`@i18n-tiny/next` は入れない。`@i18n-tiny/astro` を使わなくなる場合は依存から外してよい
6. **Tailwind v4 への書き換え**：v3 から名前が変わったクラス、`@tailwindcss/container-queries`（v4 は標準で対応）、liblab の独自ユーティリティ（`drag-none` など）を v4 の書き方に移す
7. **フッター**：Phase 2 の計画で Phase 4 に回した「ツール一覧の列」を足す。リンク先は表示中のページの言語に合わせる
8. **ローカルストレージ**：TW Palette Generator の履歴（`tw-palette-history`）は liblab と同じキーで保存する（同じオリジンなので履歴が引き継がれる）

**受け入れ条件**

- E1：`npm run build`、`npm run lint`、`npm run format:check`、`npm test` が通る
- E2：`dist/` に10ページ（`/lab`、`/en/lab`、4ツール×日英）があり、それぞれ `lang` が正しく、canonical が自分自身、hreflang が日英の対応ページと x-default（日本語版）を指す
- E3：ツールページに、そのツールの island と JSON-LD（`WebApplication`）がある。ポートフォリオのページ（`/`、`/privacy`）は引き続き React を読み込まない
- E4：MIT 側（`src/tools/**`、`src/components/ui/**`）から All rights reserved 側のファイルを import すると lint が落ちる（実際に落ちることをテストか手で確かめる）
- E5：ツールの文言の ja / en が同じキーを持つ（型で保証）
- E6：各ツールのロジック（パスワード生成、SVG 最適化、favicon 生成、パレット生成）に、移植前と同じ結果になることを確かめる単体テストがある。乱数を使うものは、条件（長さ、文字種、紛らわしい文字の除外）を確かめる
- E7（手動）：ブラウザで4ツールを日英両方で操作し、liblab と同じように動くことを確かめる。ファイルを扱うツールは、実際にファイルを入れて結果をダウンロードできること。ライト・ダーク、幅 375px と 1280px で崩れないこと
- E8：フッターにツール一覧の列があり、日本語ページでは `/lab/{tool}`、英語ページでは `/en/lab/{tool}` を指す

**モデル**：標準、推論レベルは親と同じ

**判断ログ**：`docs/decisions/phase-4/tools.md`

## テスト

- ビルド結果の結合テストは、これまでと同じく `node:test` で `tests/` に書く
- ツールのロジックの単体テスト（E6）は TypeScript とパスエイリアスを扱う必要がある。`node:test` で書けなければ Vitest を devDependencies に追加してよい（判断ログ P1-5 で Phase 4 に持ち越した件）。その場合 `npm test` から両方が走るようにする
- 既存のテストは弱めない
- ブロックごとに全体（build、lint、format:check、test）を回す
- 実行方法とログの扱いは `docs/decisions/phase-1/plan.md` の「実行方法」と同じ。サーバーを起動したら、終わったら必ずプロセス（node.exe を含む）を終了させる

## 共有ファイル

`package.json`、`package-lock.json`、`src/styles/global.css`、`eslint.config.js`、`src/components/layout/Footer.astro` は、このスコープだけが触る。

## 判断ログ

- 置き場所：`docs/decisions/phase-4/`
- 親用：`parent.md`
- スコープ `tools` 用：`tools.md`

## コミット

- コミットメッセージは英語で、既存の履歴の書き方に合わせる
- `Co-Authored-By` のフッターは付けない
- liblab から移したファイルは、どの元ファイルから移したかが分かるように、コミットメッセージかファイル先頭のコメントに書く
