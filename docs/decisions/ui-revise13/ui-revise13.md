# UI の見直し（13回目）の判断ログ

## UR13-1 Markdown のページのリンクのホバーの色もトークンにする

- 決めたこと：ホバーの色 #005d91 と #a5def5 を、`link-hover` と `link-dark-hover` のトークンにした。Markdown のページのリンクは4つとも `var(--color-…)` で書く（`link`、`link-hover`、`primary-light`、`link-dark-hover`）
- 根拠：計画の「Markdown のページのリンクの色を、直書きの値ではなくトークンで書く」を、ホバーの色にも当てはめた。トークンは計画に名前がないので実装で決めた
- 他の選択肢：ホバーの2色だけ直書きのまま残す
- 戻すとき：`global.css` の2行を消し、`MarkdownLayout.astro` のホバーの2か所を値に戻す。`tests/build.test.js`「ui-revise13 1, 2」と DESIGN.md の表を直す

## UR13-2 キャッチコピーの色のトークン名と、見出しの分け方

- 決めたこと：トークン名は `catch-day`（#ce5a00）と `catch-night`（#e7d9a8）。見出しは `messages.hero.title` から「昼」と「夜」の位置で4つに分け、「昼」を `text-catch-day dark:text-inherit`、「夜」を `dark:text-catch-night` の `span`（`data-catch-copy="day"`／`"night"`）で包む。文言から「昼」「…。」「夜」の形が見つからないときは、ビルドをエラーで止める
- 根拠：計画の例の名前をそのまま使った。文言は `messages` に1つのまま保ち、文言が変わって色の位置が合わなくなったら気づけるようにした。`span` に ARIA は付けず、読み上げは元の文字列のまま
- 他の選択肢：`messages` の文言を部品に分けて持つ。`index.astro` に文字を直書きする
- 戻すとき：`index.astro` の `catchCopy` の部分を消して `{messages.hero.title}` に戻す

## UR13-3 背景がグラデーションのところのコントラストは、画面を撮って測る

- 決めたこと：キャッチコピーの「昼」「夜」とヒーローの背景のコントラストは、見出しの文字を透明にしてから、その1文字の箱（行の高さ 44px × 文字幅）を撮り、箱の中のすべての画素について比を出して、いちばん低い値が 3:1 以上であることを確かめる（`tests/e2e/colors.spec.js`）。幅 375px と 1280px の両方で測る
- 根拠：背景はグラデーションと波の SVG が重なり、ヘッダーの高さや幅で文字の位置の色が変わる。計算で再現するより、実際に描かれた色を測るほうが確かで、行の箱全体の最小値を使えば文字のどの部分でも守れる
- 他の選択肢：グラデーションの式から文字の位置の色を計算する
- 戻すとき：テストの測り方の部分だけを書き換える

## UR13-4 リンクのコントラストのテストの形

- 決めたこと：リンクの色は実際のページで測る（カードは先頭のカードの `[data-link-text]` を、静止時とカードのホバー時に。Markdown は `/privacy` のリンクを、静止時とホバー時に）。背景は計画の6色（ライト：white、gray-50、gray-100、ダーク：#282c34、#333842、#2e323b）をブラウザで sRGB にしたもの。すべての組み合わせで 4.5:1 以上を確かめ、色がトークンの値であることも確かめる
- 根拠：計画が背景を指定しているので、その色との組み合わせを全部確かめた。実際の背景の上での比は、既存のテスト（`works.spec.js` の ui-revise5 (parent)、`site.spec.js` の final-review 7）が今も測っている
- 他の選択肢：実際にそれぞれの背景の上にあるリンクだけを測る
- 戻すとき：`tests/e2e/colors.spec.js` の該当テストを直す

## UR13-5 `logo-` と `card-link` が残っていないことのテストの範囲

- 決めたこと：既存のテスト（A4、A5）と同じく、ソースは git の管理下で `docs/` と `tests/` を除いたファイル、ビルドの出力は `dist/` のテキストのファイルを調べる。名前は `logo-light|medium|dark|accent` と `card-link` に限る
- 根拠：`docs/` には過去の計画と判断ログがあり、当時の名前をそのまま残している。`tests/` はこのテスト自身が名前を書く。`logo-` だけで探すと、無関係な名前（例：ファイル名）に当たるおそれがある
- 他の選択肢：`docs/` の過去の文書も書き換える
- 戻すとき：`tests/build.test.js`「ui-revise13 1」の範囲を変える

## UR13-6 仕様が変わった既存テスト

- `tests/portfolio.test.js`「ui-revise3 3」：Apps のアイコンの丸の class を `bg-logo-medium/70` から `bg-primary/70` に
- `tests/portfolio.test.js`「ui-revise3 1, ui-revise4 1, ui-revise5 1, ui-revise7 4」：見出しの中に `span` が入ったので、見出しの文字をタグを除いて比べるように
