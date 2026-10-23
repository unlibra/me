# 追加作業の実装計画：ユーザー確認後の修正

ユーザーが `docs/decisions/user-review.md` の質問に答えた（2026-10-21）。そのうち実装が要るものをここで行う。

## 参照する文書

- 設計書：`docs/replace-plan.md`（3.4、3.7）
- 前提の判断：`docs/decisions/phase-4/parent.md`（P4-1、P4-2）、`docs/decisions/phase-4/tools.md`（T-18、T-24）、`docs/decisions/phase-5/license.md`

## スコープ

分割しない。スコープは `fixes` の1つで、ブランチ `feat/site-replacement` に直接コミットする。3つのブロックに分ける。

### ブロック1：SVG Optimizer の不具合修正（T-18）

- ユーザーの判断：直す（P4-2 の「機能を変えない」の例外）
- `buildSvgoConfig` で、スイッチで無効にしたプラグインが実際に実行されないようにする（`{ name, active: false }` に頼らない）
- 受け入れ条件：
  - H1：無効にしたプラグインが実行されないことを確かめるテスト。修正前に落ちることを確かめる（例：「おすすめ」プリセットで `<title>` と `width`/`height` が残る、`keepScripts` / `keepStyleElement` で `<script>` / `<style>` が残る）
  - H2：`tests/fixtures/svg-optimizer/expected.json` を作り直す。作り直した理由と、liblab の出力と変わる点を判断ログに書く

### ブロック2：TW Palette Generator の不具合修正（T-24）

- ユーザーの判断：直す
- 「調整をリセット」で、`#` を補った値を BASE に入れる
- 受け入れ条件：
  - H3：`#` なしの入力でリセットしたとき、BASE と履歴の `baseColor` に `#` が付くことを確かめるテスト。修正前に落ちることを確かめる

### ブロック3：同梱ライブラリのライセンス表示

- ユーザーの判断：対応する（`user-review.md` の質問5）
- ビルド時に、クライアントの JS に実際に同梱された npm パッケージを集め、それぞれのライセンス全文と著作権表示をまとめた `dist/third-party-licenses.txt` を出力する
- 新しい依存はできるだけ増やさない。Vite（Rolldown）のプラグインとして、出力されたチャンクのモジュール ID からパッケージを割り出す方式を第一案とする。既製のパッケージを使う場合は、そのライセンスと保守状況を判断ログに書く
- 同梱した JS から一覧ファイルの場所が分かるようにする（例：各チャンクの先頭に一覧ファイルの URL を書いたコメントを残す）。フッターなど画面にリンクを出す場合は、文言を仮の文面として判断ログに残す
- 受け入れ条件：
  - H4：一覧ファイルが `dist/` に出力され、同梱した MIT などのパッケージ（少なくとも react、react-dom、@headlessui/react、@heroicons/react、svgo、jszip）のライセンス全文と著作権表示を含む
  - H5：同梱していないパッケージ（devDependencies のビルド用ツールなど）が入っていない
  - H6：ライセンスファイルが見つからないパッケージがあればビルドを失敗させるか、テストで検出する（黙って抜け落ちないこと）
  - H7：`LICENSE` 第4節（npm パッケージ）に、配布物では一覧ファイルで表示している旨を足す

## 共通

- すべてのブロックで build、lint、format:check、test を通す。既存のテストは弱めない
- 判断ログ：`docs/decisions/fixes/fixes.md`
- 実行方法とログの扱いは `docs/decisions/phase-1/plan.md` の「実行方法」と同じ
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない
