# ユーザーに確認してもらう事項

ユーザー不在の間（2026-10-21〜）に進めた作業について、あとでまとめて確認してもらう事項を集める。影響の大きい順に並べる。

## 1. 判断が必要な質問

1. **ツールのアイコンとアバターは DiceBear の CC0 素材だった。この扱いでよいか**：当初は「アイコンは All rights reserved のままにして、MIT にするかを聞く」予定だった（`phase-5/parent.md` の P5-1）。しかし Phase 5 で、次の素材が DiceBear で生成された CC0 1.0 の素材だと分かった（以前の仮ロゴと同じ）
   - 4ツールのアイコン（`src/assets/tools/`）：SVG に DiceBear「Shapes」の CC0 メタデータがある
   - プロフィールのアバター（`src/components/Avatar.astro`）：DiceBear「Thumbs」
   - CC0 の素材は誰でも自由に使えるので、All rights reserved として転載を止めることはできない。そのため `LICENSE` では第三者の CC0 素材として載せてある（`phase-5/license.md` の LI-4）
   - 設計書 3.7 では「プロフィール写真・独自ロゴ」は転載NGだった。アバターを転載NGにしたい場合は、自作の画像に差し替える必要がある

2. **SVG Optimizer の liblab から引き継いだ不具合を直すか**：いくつかのスイッチが効いていない。liblab は9つのプラグインを `{ name, active: false }` で無効にしようとしているが、svgo 4 は `active` を無視するため、スイッチに関係なく常に実行される。ユーザーから見えるのは次の現象で、本番の liblab も同じ挙動になっている
   - 「おすすめ」プリセットでも `<title>` と `width`/`height` が消える
   - `<script>`・`<style>` を残すスイッチを入れても消える
   - 対象の9つ：removeViewBox、convertStyleToAttrs、cleanupListOfValues、removeTitle、removeDesc、removeDimensions、removeRasterImages、removeScripts、removeStyleElement
   - レビュワーが svgo 4.1.0 のソースと実際の出力で、この主張が正しいことを確かめた。なお `removeViewBox` も常に動くが、後から動く `removeDimensions` が viewBox を作り直すため、出力には viewBox が残る
   - いまは「機能を変えない」方針（P4-2）でそのまま移植してある。直す場合は、無効にしたプラグインを設定から外す数行の修正と、テストの期待値の作り直しで済む（`phase-4/tools.md` の T-18）

3. **TW Palette Generator の liblab から引き継いだ不具合を直すか**：「調整をリセット」を押すと、入力欄の文字をそのまま BASE に入れる。`#` なしで色コードを入力した場合（例：`3ba0be`）、BASE と履歴に保存される `baseColor` から `#` が抜ける。ほかの経路ではすべて `#` が付く。レビュワーがブラウザで確かめたところ、`#` のない値は CSS として無効なので、リセットしたのに BASE の色見本が調整後の色のまま残る（見本の名前と履歴にも `#` が付かない）。いまは P4-2 に従ってそのまま移植してある。直す場合は1行の修正（`phase-4/tools.md` の T-24）
4. **旧版の me で MIT として公開した分に、LICENSE で触れるか**：me リポジトリは最初から MIT だった（初回コミット `ec8784c` で著作権者は unlibra。翌日の `a83cad7` で著作権者が `[Your Name]` に変わり、現在の main もそのまま）。新しい LICENSE に置き換えても、すでに MIT で公開した版は MIT のまま。「〇〇のコミットまでの版は MIT」と一文書き添えるかを決めてほしい。いまは何も書いていない（`phase-5/license.md` の LI-3）
5. **公開するサイトの JS に、同梱したライブラリのライセンス表示を入れるか**：ビルドした `dist/_astro/*.js` には React、Headless UI、Heroicons、svgo、jszip などの MIT のコードがまとめて入っているが、著作権表示とライセンスの文言が1つも残っていない（Phase 5 のレビューで確認）。MIT は「ソフトウェアの複製に著作権表示と許諾の文言を含めること」を求めているので、厳密にはサイトの配布物が条件を満たしていない。リポジトリの `LICENSE` 第4節（npm パッケージはそれぞれのライセンスに従う）は、リポジトリについては正しい。対応の案は、ビルド時に第三者ライセンスの一覧ファイル（例：`/third-party-licenses.txt`）を生成して配信するもので、そのためのビルド用のパッケージを1つ足すことになる。設計書にないリスクなので、対応するかを決めてほしい
6. **本番切替の順序（main へのマージと Vercel の自動デプロイ）**：me の main にマージすると、Vercel の me プロジェクトが新サイトを本番に自動デプロイする可能性が高い（自動デプロイの設定は要確認）。そうなると旧 `vercel.json` の rewrite が消え、ドメインを Workers に付け替える前に本番の `/lab/*` が壊れる。手順書 `docs/deploy.md` の 0 章に2つの案を書いてある
   - 案A：Workers Builds の本番ブランチを最初は `feat/site-replacement` にして付け替え、付け替えのあとで main にマージする
   - 案B：先に Vercel の自動デプロイを止めてから main にマージする
   - あわせて、付け替え後も `*.workers.dev` の URL を公開したままにするか（手順書 6 章）
   - ドメインの付け替え方式：Custom Domain 方式（公式が推奨。DNS レコードを消してから足すまで本番がつながらない時間がある。戻すときも同じ）か、Routes 方式（DNS レコードを残せるが、静的配信だけの Worker で使えるかは公式で未確認）か（`docs/deploy.md` 3章）

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
- Phase 5：`LICENSE` と `README.md` の文面（仮。`phase-5/license.md` の LI-1。LI-5〜LI-7 で、計画になかった一文（他の作者の素材を置く場所、他サービスのロゴは商標、GitHub の規約で認められる閲覧・fork）を足している）

## 4. 判断ログ（フェーズ別）

| Phase | 親                                | スコープ                                                              |
| ----- | --------------------------------- | --------------------------------------------------------------------- |
| 1     | `phase-1/parent.md`（P1-1〜P1-9） | `phase-1/base.md`（B-1〜B-5）、`phase-1/astro-upgrade.md`（U-1〜U-6） |
| 2     | `phase-2/parent.md`（P2-1〜P2-4） | `phase-2/layout.md`（L-1〜L-16）                                      |
| 3     | `phase-3/parent.md`（P3-1〜P3-3） | `phase-3/portfolio.md`（PF-1〜PF-6）                                  |
| 4     | `phase-4/parent.md`（P4-1〜P4-4） | `phase-4/tools.md`（T-1〜T-24、手動確認の記録）                       |
| 5     | `phase-5/parent.md`（P5-1、P5-2） | `phase-5/license.md`（LI-1〜LI-11）                                   |
| 6     | —                                 | `phase-6/cutover.md`（C-1〜C-3、手動確認の記録 G3）                   |

## 5. ユーザーの回答（2026-10-21）

- 質問1：CC0 素材は転載NGの対象外でよい。CC0 素材を使っているページ全体に CC0 が及ぶわけではない（素材そのものだけ）
- 質問2・3：不具合を直す（`fixes/plan.md`）。同じ種類の不具合（スイッチが効かない）が計画外に3つ見つかり、あわせて直した（`fixes/fixes.md` の FX-1）
- 質問4：旧版 MIT の一文は書き加えない（法的な効果は変わらないため）
- 質問5：対応する。`/third-party-licenses.txt` を生成して配信する（`fixes/fixes.md` の FX-4〜FX-6）
- 質問6：一時的に壊れても止まってもよい。手順は「main にマージ → Workers Builds を main に接続 → Custom Domain で付け替え」の単純な形にする。デプロイは Workers Builds（セキュリティ上の推奨）、テストは GitHub Actions、main にブランチ保護をかける
- テスト：仕様のテストと Playwright の E2E を足し、ツールの挙動をすべて自動テストで確かめる（`tests/plan.md`）
- ライセンス変更のコミットが遅かった件：ブランチの先頭に All rights reserved の `LICENSE` を差し込むよう履歴を書き換え、force-push する（ユーザー許可済み）

## 6. 新しく出た確認事項

1. **SVG Optimizer の「説明（desc）を削除」スイッチ**：入れても、エディタが書き出した説明や空の説明しか消えず、ふつうの `<desc>` は残る（svgo の `removeAny: false` の既定のまま。liblab と同じ）。すべての `<desc>` を消すように変えるか（`fixes/fixes.md` の FX-1）
2. **TW Palette Generator のスライダーで色の計算に失敗したとき**：BASE に入力欄の文字がそのまま入る（`#` が付かない場合がある）。直すか（`fixes/fixes.md` の FX-3）
