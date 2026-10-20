# Phase 5 実装計画：ライセンス

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`
- フェーズ全体に効く制約：3.7（ライセンスと著作権表示）
- このフェーズの範囲：5章の「5. ライセンス」
- 前フェーズからの申し送り：`docs/decisions/phase-2/parent.md`（Heroicons）、`docs/decisions/phase-3/parent.md` の P3-2（ツールのアイコン）、`docs/decisions/phase-4/parent.md` の P4-1（MIT 側のディレクトリ）
- 親の判断：`docs/decisions/phase-5/parent.md`

## スコープ

分割しない。スコープは `license` の1つで、ブランチ `feat/site-replacement` に直接コミットする。

### license

**触ってよい範囲**：`LICENSE`、`LICENSES/`（新規）、`README.md`、`package.json`、`tests/`。ソースコードのファイル先頭のコメントに出典を足す場合は `src/` も可。

**やること**

1. **`LICENSE`**：英語で書く。構成は次のとおり
   - 全体：`Copyright (c) 2025 unlibra. All rights reserved.` 許諾をしないこと（閲覧以外の複製・改変・再配布の権利を与えないこと）を短く書く
   - 例外1（MIT）：`src/tools/` と `src/components/ui/` 以下。全文は `LICENSES/MIT.txt`
   - 例外2（第三者）：Heroicons（MIT、Tailwind Labs）から写したアイコン。対象のファイルを列挙し、全文は `LICENSES/Heroicons-MIT.txt`。ほかに第三者のコードがあれば同じ形で載せる
   - 対象外：BOOTH 商品画像のうち、他の作者の素材が写っているもの（設計書 3.7）。現時点ではダミーしかないが、置き場所を決めて一文入れる
   - ビルド成果物に含まれる npm パッケージ（フォントを含む）は、それぞれのライセンスに従う旨
2. **`LICENSES/MIT.txt`**：MIT の原文。著作権表示は `Copyright (c) 2025 unlibra`
3. **`LICENSES/Heroicons-MIT.txt`**：Heroicons の MIT 原文（著作権表示を含む。`node_modules/@heroicons/react/LICENSE` などから正確に写す）
4. **`package.json`**：`"license": "SEE LICENSE IN LICENSE"`
5. **`README.md`**：X オマージュ時代の内容を、新しいサイトの説明に書き換える。技術構成（Astro 7、Tailwind CSS v4、React island、Cloudflare Workers の静的配信）、開発コマンド（`dev`、`build`、`test`、`preview:cf`、`generate:icons` など実在するもの）、ライセンスの節（`LICENSE` への案内と範囲の要約）。IBM Plex の記述を消す（Phase 2 の L-7 で README を検査対象から外した件を戻す）

**受け入れ条件**

- F1：`npm run build`、`npm run lint`、`npm run format:check`、`npm test` が通る
- F2：`LICENSE` が、全体の All rights reserved、MIT の2ディレクトリ、第三者（Heroicons）の対象ファイル、対象外の画像に触れている。テストで、`LICENSE` に書かれた MIT のディレクトリが実在すること、Heroicons として列挙したファイルが実在し、そのファイルの先頭に出典のコメントがあること、出典のコメントがあるファイルが漏れなく列挙されていることを確かめる
- F3：`LICENSES/MIT.txt` と `LICENSES/Heroicons-MIT.txt` が MIT の原文と一致する（著作権表示の行を除く）
- F4：`package.json` の `license` が `SEE LICENSE IN LICENSE`
- F5：README に IBM Plex、X オマージュ、Vercel、Cloudflare Pages の記述が残っていない。Phase 2 の C6 のテストから README の除外を外す

**モデル**：軽量（文書と設定の更新が中心）。ただし `LICENSE` の文面は標準とし、レビューは標準で行う

**判断ログ**：`docs/decisions/phase-5/license.md`

## テスト・実行方法

`docs/decisions/phase-1/plan.md` の「実行方法」と同じ。

## コミット

- コミットメッセージは英語で、既存の履歴の書き方に合わせる
- `Co-Authored-By` のフッターは付けない
