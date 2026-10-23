# UI の見直し（14回目）の判断ログ

親が直接実装した並び順の変更（2026-10-23、ユーザーの指示）。レビューは省き、親が build、lint、format:check、`npm test`、`npm run test:e2e` で確かめた。

## UR14-1 作品の並び順

- Libraries：tkinter-unblur を1番目にし、残りは今の順（@i18n-tiny/astro、@i18n-tiny/next、@i18n-tiny/react）
- Apps：SVG最適化を1番目にし、残りは今の順（Faviconジェネレーター、パスワードジェネレーター）
- `src/config/tools.ts` の `toolIds`（「表示の順」と注記している）も同じ順にした
- 直したテスト：`portfolio.test.js` の `TOOLS`（表示の順）と「ui-revise8 4」（Libraries の並びと、npm の画像を比べるカードの位置）

## UR14-2 ダークのリンクの色（ユーザーの決定）

ダークのリンクは青系（`primary-light`）のまま（ui-revise13 のとおり）。月色は使わない。

## UR14-3 SVG最適化の名前（ユーザーの決定）

日本語の名前を「SVG最適化」から「SVGオプティマイザー」にした（Faviconジェネレーター、パスワードジェネレーターと形をそろえ、英語版の SVG Optimizer と対応させる）。ページのタイトルに検索語（「SVG圧縮・最適化」）は足さない。検索語は説明文（「無料のSVG最適化・圧縮ツール。…」）にあれば十分というユーザーの判断。変えたのはトップのカードのタイトルと、ツールの名前（見出し、パンくず、`<title>`）。テストの期待値（`portfolio.test.js`、`works.spec.js`）も合わせた。
