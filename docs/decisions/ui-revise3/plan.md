# UI の見直し（3回目、ユーザーの指示、2026-10-22）

## 参照する文書

- 1・2回目の見直しの計画と判断ログ：`docs/decisions/ui-revise/`、`docs/decisions/ui-revise2/`
- liblab のソース（読むだけ）：`C:\Users\User\Projects\unlibra\liblab\frontend`。特に `src/app/[locale]/(default)/_components/tool-card.tsx` と、それを並べている `page.tsx`
- `docs/decisions/user-review.md` の8章（workers.dev で見つかった `_redirects` の不具合）

## ユーザーの指示

### 1. ヒーロー

1. メインテキスト（今の「unlibra」のロゴタイプ）を「昼はカフェ。夜はバー。」にする。フォントは本文と同じ（Noto Sans JP）。これをページの `h1` にする。シンボルは残す
2. サブテキスト（今の「昼はカフェ、夜はバー。」）は廃止する
3. テキストの下に GitHub と BOOTH へのリンクボタンを置く（リンク先は `site.links` の値）

ロゴタイプの「unlibra」は、ヘッダー、モバイルメニュー、フッターの3か所に残る（LINE Seed JP のまま）。

### 2. フッター

1. 説明文を「個人開発のプロダクトを掲載しているサイトです。昼は本業のビルダー、夜は自作キーボード、ライブラリ、アプリ、VR & 3Dなどの個人開発をしています。」にする（日本語。英語のページの説明文は親の仮の文面「A site that collects my personal products. By day a builder at my job; by night I make DIY keyboards, libraries, apps, VR & 3D and more.」にし、判断ログに仮の文面として書く）。トップの meta description もこれに合わせる
2. Links のグループを、今よりさらに右に詰める（右端に揃える）

### 3. カード

1. VR & 3D の見出しの右にある BOOTH ショップへのリンクを削除する
2. Apps と Libraries の UI を、liblab のツールカードに完全に合わせる。ホバーのアニメーション、文字の大きさ・太さ・色、余白、アイコンの背景を含めて
3. そのうえで、次の「カードエリアの改善」（ユーザーの文章を要約したもの）を行う

#### カードエリアの改善

- **評価：** DIY Keyboards と VR & 3D は、写真を大きく見せる今の形でよい（キーボードの先頭を大きなカードにしている点も含めて）。Libraries と Apps は、文字が小さく余白が広いため、作品一覧ではなく補足情報に見える。上下の写真のカードと比べて重要度まで低く見えるのが課題
- **共通化するルール**（ルールだけを揃える。画像の有無、画像の比率、カードの枠の有無、アイコンの大きさまでは揃えない。コンポーネントは写真のカードとリスト型の2種類のままでよい）：

  | 要素           | 共通ルール                                           |
  | -------------- | ---------------------------------------------------- |
  | タイトル       | フォントの太さと文字色を統一                         |
  | 説明文         | 文字の大きさ、行間、色を統一                         |
  | 詳細へのリンク | リンクの色、矢印、ホバーの表現を統一                 |
  | 余白           | 8px を基準にした間隔                                 |
  | 角丸           | 写真のカードとアイコンの背景で、共通のトークンを使う |
  | 操作           | カードもリスト項目も、全体をクリックできる           |
  | フォーカス     | キーボード操作のときのフォーカスの表示を統一         |

- **Libraries と Apps の調整：** タイトルと説明文の文字を少し大きくし、アイコンと文章の間隔を調整して、行全体が1つの作品として見えるようにする
- **見せる情報を揃える：** 4カテゴリとも、タイトル、一行の要約、年、操作を見せる（親の判断：年は Libraries と Apps にも出す）
- **操作を明示する：** 「詳しく見る」だけに頼らず、作品の種類に応じた操作をカードに出し、直接飛べるようにする。Apps は「ツールを使う」、Libraries は「ドキュメント」と「npm」または「PyPI」、VR & 3D は「BOOTH で見る」。DIY Keyboards はリンク先がないので「詳しく見る」だけ。カード全体のクリックは今までどおり詳細（dialog）を開き、操作のリンクはそれより手前に置いて直接飛べるようにする。新しい文言は仮の文面として判断ログに書く

### 4. `_redirects` の不具合（親から）

`docs/decisions/user-review.md` の8章のとおり、本番の Workers（workers.dev）では、末尾スラッシュ付きの旧ツールURL（`/lab/ja/favicon-generator/` など）が1回の 301 で新URLに届かず、`/lab/favicon-generator/`（末尾スラッシュ付き）へ転送される。`wrangler dev` では1回で届くので、本番と `wrangler dev` で `_redirects` の評価が違う。原因を公式ドキュメントで調べて直す。

- 確かめ方：公開中の `https://unlibra-com.not-inbox.workers.dev` に `wrangler deploy` で出し直し（ユーザーの承認済みの公開範囲。`wrangler.jsonc` は変えない）、`npm run check:prod -- https://unlibra-com.not-inbox.workers.dev` で失敗が0件になることを確かめる（Web Analytics の警告は想定どおり）
- `wrangler dev` と本番の違いで E2E が見逃したことを、判断ログに書く。可能なら、本番と同じ評価順をテストで再現する

## 受け入れ条件

- M1：build、lint、format:check、`npm test`、`npm run test:e2e` が通る。今回の指示で仕様が変わった既存テストは新しい仕様に合わせ、直したテストと理由を判断ログに一覧で書く。それ以外は弱めない
- M2：1〜4のそれぞれを確かめるテストがある。liblab と同じホバーのアニメーションは、計算後のスタイルなどで確かめる。共通化のルール（タイトル・説明文・リンクのスタイルが、写真のカードとリスト型で同じであること）をテストで確かめる
- M3：ライトとダーク、幅 375px と 1280px で崩れない
- M4：workers.dev に出し直し、`check:prod` の失敗が0件
- M5：新しい文言を、仮の文面として判断ログに一覧で書く

## 共通

- スコープは `ui-revise3` の1つ。ブランチ `feat/site-replacement` に直接コミットする
- 判断ログ：`docs/decisions/ui-revise3/ui-revise3.md`
- 実行方法は `docs/decisions/phase-1/plan.md` の「実行方法」と同じ。ポート 8790 のプレビューサーバー（`%TEMP%\claude\me-preview`）は親のものなので触らない
- workers.dev へのデプロイは、リポジトリの作業ツリーから `npx wrangler deploy` で行ってよい（コミット済みの状態でビルドしてから）
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない
