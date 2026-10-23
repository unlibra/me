# UI の見直し（12回目）の判断ログ

## UR12-1 折りたたみの見出しは、ボタンの外側を h2 で包む

- 決めたこと：Favicon ジェネレーターと SVG 最適化ツールの折りたたみ（Headless UI の DisclosureButton）の見出しは、`<h2><DisclosureButton><span>…</span></DisclosureButton></h2>` にした。計画の 5 は「DisclosureButton の中の見出しも同じ」で、h6 を中に置いたまま h2 に替える形にも読める
- 根拠：ボタンの中の見出しは、ボタンの子が支援技術に見えない（presentational children）ため見出しとして伝わらず、HTML でもボタンの中に見出しは置けない。WAI-ARIA APG のアコーディオンの形（見出しがボタンを包む）にした。見た目は変わらない（文字は `span` に 16px/24px/600）
- 他の選択肢：ボタンの中に h2 を置く（h6 を h2 に替えるだけ）
- 戻すとき：2ファイルの該当箇所で、h2 をボタンの中に戻す。テスト `consistency.spec.js` の「exposed as h2」を消す

## UR12-2 クレジットとプライバシーの余白は、本文の外側に置く

- 決めたこと：外側の箱に `px-4 pt-8 pb-12 sm:px-6 lg:px-8`、本文（`main.prose`）に `mx-auto max-w-3xl`。本文の幅は最大 768px（前は `max-w-3xl` の内側に `px-4` で 736px）
- 根拠：計画の「本文の幅 `max-w-3xl` は保つ」を、本文そのものの幅と読んだ。余白を `max-w-3xl` の内側に置くと、1024px 以上で本文が 704px に狭まる
- 他の選択肢：`max-w-3xl` の箱の内側に余白を置く（本文 704px）
- 戻すとき：`MarkdownLayout.astro` の2つの class を入れ替え、テストの幅の期待値を変える

## UR12-3 404 ページの h1 は変えない

- 決めたこと：404 の h1（24px/36px/600）はそのまま。全ページの h1 のテストも 404 を除いた（太さ 700 の検査には 404 を含む）
- 根拠：計画の背景の h1 の一覧（トップ、ツール、クレジットとプライバシー）に 404 がない。404 は惑星と見出しとボタンの高さ（36 + 24 + 40px）で配置を計算しており、大きさを変えると配置も変わる
- 他の選択肢：404 も 28px/44px にする（`not-found` の配置の計算と E2E の見直しが要る）
- 戻すとき（28px にするとき）：`404.astro` の h1 の class、配置の CSS とコメント、テストの対象に 404 を足す。**親に判断を依頼している**

## UR12-4 仕様が変わった既存テスト

- `tests/portfolio.test.js`「ui-revise5 (design 4)」：大カードの class の期待値 `gap-6` を `gap-4`・`md:gap-6` に
- `tests/portfolio.test.js`「ui-revise5 13」：見出しの大きさの class を `text-4xl` から `text-2xl`・`md:text-4xl` に
- `tests/e2e/works.spec.js`「ui-revise5: the cards and the sections」：大カードの見出しの大きさを、768px 未満で 24px、以上で 36px に
