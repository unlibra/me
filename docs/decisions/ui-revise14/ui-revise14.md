# UI の見直し（14回目）の判断ログ

親が直接実装した並び順の変更（2026-10-23、ユーザーの指示）。レビューは省き、親が build、lint、format:check、`npm test`、`npm run test:e2e` で確かめた。

## UR14-1 作品の並び順

- Libraries：tkinter-unblur を1番目にし、残りは今の順（@i18n-tiny/astro、@i18n-tiny/next、@i18n-tiny/react）
- Apps：SVG最適化を1番目にし、残りは今の順（Faviconジェネレーター、パスワードジェネレーター）
- `src/config/tools.ts` の `toolIds`（「表示の順」と注記している）も同じ順にした
- 直したテスト：`portfolio.test.js` の `TOOLS`（表示の順）と「ui-revise8 4」（Libraries の並びと、npm の画像を比べるカードの位置）

## UR14-2 ダークのリンクの色（ユーザーの決定）

ダークのリンクは青系（`primary-light`）のまま（ui-revise13 のとおり）。月色は使わない。
