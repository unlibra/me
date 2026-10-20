# ユーザーに確認してもらう事項

ユーザー不在の間（2026-10-21〜）に進めた作業について、あとでまとめて確認してもらう事項を集める。影響の大きい順に並べる。

## 1. 判断が必要な質問

1. **ツールのアイコンのライセンス**：liblab から持ってきた4ツールのアイコン（`src/assets/tools/`）を、MIT（ツールのコードと同じ）にするか All rights reserved にするか。設計書 3.7 はコードと UI 部品だけを MIT と決めていて、画像素材は決まっていない。いまは狭いほう（All rights reserved）にしてある（`phase-5/parent.md` の P5-1）

2. **SVG Optimizer の liblab から引き継いだ不具合を直すか**：いくつかのスイッチが効いていない。liblab は9つのプラグインを `{ name, active: false }` で無効にしようとしているが、svgo 4 は `active` を無視するため、スイッチに関係なく常に実行される。ユーザーから見えるのは次の現象で、本番の liblab も同じ挙動になっている
   - 「おすすめ」プリセットでも `<title>` と `width`/`height` が消える
   - `<script>`・`<style>` を残すスイッチを入れても消える
   - 対象の9つ：removeViewBox、convertStyleToAttrs、cleanupListOfValues、removeTitle、removeDesc、removeDimensions、removeRasterImages、removeScripts、removeStyleElement
   - レビュワーが svgo 4.1.0 のソースと実際の出力で、この主張が正しいことを確かめた。なお `removeViewBox` も常に動くが、後から動く `removeDimensions` が viewBox を作り直すため、出力には viewBox が残る
   - いまは「機能を変えない」方針（P4-2）でそのまま移植してある。直す場合は、無効にしたプラグインを設定から外す数行の修正と、テストの期待値の作り直しで済む（`phase-4/tools.md` の T-18）

3. **TW Palette Generator の liblab から引き継いだ不具合を直すか**：「調整をリセット」を押すと、入力欄の文字をそのまま BASE に入れる。`#` なしで色コードを入力した場合（例：`3ba0be`）、BASE と履歴に保存される `baseColor` から `#` が抜ける。ほかの経路ではすべて `#` が付く。レビュワーがブラウザで確かめたところ、`#` のない値は CSS として無効なので、リセットしたのに BASE の色見本が調整後の色のまま残る（見本の名前と履歴にも `#` が付かない）。いまは P4-2 に従ってそのまま移植してある。直す場合は1行の修正（`phase-4/tools.md` の T-24）

## 2. 仮で決めて進めたこと

（各フェーズの判断ログのうち、ユーザーが別の選択をしそうなもの）

- **Astro を 5 から 7 に上げた**（ユーザー承認済み）。あわせて ESLint 10、Tailwind 4.3、Vite 8 に上がった（`phase-1/astro-upgrade.md`）
- **末尾スラッシュ付きURLの転送は 307**（一時的）。Workers の仕様で、301 にするには Worker のスクリプトが要る（P1-6）
- **アクセス解析は Cloudflare 側の自動挿入に任せ、コードに計測タグを書いていない**。Workers を独自ドメインで配信したときに効くかは Phase 6 で確認する（P1-1）
- **トップページは1ページで、カテゴリごとのセクション**。作品の詳細ページは作らず、旧ページのタブ切替（JS）はやめた（P3-1）
- **ツール一覧ページ（`/lab`）にはツールのカードだけを置いた**。liblab のトップにあった紹介文と支援セクションは載せていない（P4-3）
- **MIT のコードの置き場所を `src/tools/` と `src/components/ui/` に固定**し、そこから All rights reserved 側を import することを ESLint で禁止した（P4-1）
- **feature ブランチを GitHub に push した**（確認不要の範囲）。me リポジトリは Vercel と連携したままなので、push のたびに Vercel のプレビューデプロイが走る（本番には影響しない）

## 3. 最終UIチェックの項目

`docs/decisions/phase-2/parent.md` の「最終UIチェックで確認してもらう項目」を参照。Phase 3 以降で増えた分はここに追記する。

- Phase 3：`phase-3/portfolio.md` の PF-4（新しい文言、ダミー商品、画面に出る年、外部リンクを新しいタブで開くこと）
- Phase 3：プロフィールから外した表示（所在地「Tokyo, Japan」、`@unlibra`、ウェブサイトのリンク）。X 風の表示の名残として外した（PF-5）。残すかを確認する
- Phase 3：npm と PyPI の作品画像は白地の SVG なので、ダークモードで明るい四角に見える
- Phase 4：`phase-4/tools.md` の T-13（新しい仮の文言：ページタイトル「{ツール名} - unlibra.com」、パンくずと一覧の見出し「ツール / Tools」、一覧ページの meta description など。英語ページでも日本語のまま残る読み上げラベルやエラー文。liblab と同じ挙動）
- Phase 4：ツール一覧ページに紹介文を置くか（P4-3）
- Phase 4：幅 375px で、ヘッダー右側のボタンが左右の余白に約 7px はみ出す（横スクロールは出ない。T-12）

## 4. 判断ログ（フェーズ別）

| Phase | 親                                | スコープ                                                              |
| ----- | --------------------------------- | --------------------------------------------------------------------- |
| 1     | `phase-1/parent.md`（P1-1〜P1-9） | `phase-1/base.md`（B-1〜B-5）、`phase-1/astro-upgrade.md`（U-1〜U-6） |
| 2     | `phase-2/parent.md`（P2-1〜P2-4） | `phase-2/layout.md`（L-1〜L-16）                                      |
| 3     | `phase-3/parent.md`（P3-1〜P3-3） | `phase-3/portfolio.md`（PF-1〜PF-6）                                  |
| 4     | `phase-4/parent.md`（P4-1〜P4-4） | `phase-4/tools.md`（T-1〜T-24、手動確認の記録）                       |
