# 判断ログ：remove-tw-palette

計画：`docs/decisions/remove-tw-palette/plan.md`

## R-1 プライバシーポリシーのローカルストレージの説明（未反映・ユーザーの確認待ち）

- 確かめたこと：パレットの履歴（`tw-palette-history`）を消したあと、`localStorage` を使うのは表示テーマの選択（`src/config/theme.ts` のキー、`src/scripts/theme.ts`、`BaseLayout.astro`）だけ。`sessionStorage`、IndexedDB、Cookie は使っていない。ほかの3ツールは何も保存しない
- 現在の文面（`src/pages/privacy.md` 2.3）：「表示テーマ（ライト／ダーク）の選択や一部ツール機能の設定の保持など、利便性向上を目的として、…」。「一部ツール機能の設定の保持」が事実と合わなくなった
- 仮の文面（案）：「当サイトでは、表示テーマ（ライト／ダーク）の選択を保持するため、お客様のブラウザにデータを保存する仕組み「ローカルストレージ」を使用しています。」（2段落目は変えない）
- 他の選択肢：現行のまま（将来ツールが設定を保存する余地を残す。ただし今は事実と違う）
- 戻すとき：`privacy.md` の1文を戻すだけ
- 状態：`privacy.md` は変えていない。ユーザーの確認を親に依頼する

## R-2 撤去で直した既存テスト（計画の受け入れ条件による一覧）

ツールの一覧・件数から TW Palette Generator を外しただけで、ほかの検査は弱めていない。

- `tests/build.test.js`：サイトマップの URL の一覧
- `tests/layout.test.js`：ビルドされたページの一覧
- `tests/tools.test.js`：`TOOLS`、ツールのページ数（8 → 6、テスト名の eight → six）、Tabler のラッパーを使うファイル数の自己点検（7 → 6）。パレットの履歴のキーのテスト（「the palette history is stored under the former tool's localStorage key」）は対象がなくなったので削除
- `tests/portfolio.test.js`：`TOOLS`、旧ツールサイトの名前と説明の表、カードの要約の表、ページ数の自己点検（11 → 9）、カード数（13 → 12）、アクション数（14 → 13）
- `tests/redirects.test.js`：`TOOLS`
- `tests/license.test.js`：`WITHOUT_COMMENT` を空に、第2節の LICENSES の一覧から `tailwindcss-MIT.txt` を外し、逐語コピーの検査から tailwindcss の組を外した（テスト名も Tabler だけに）
- `tests/credits.test.js`：第2節の出典数の自己点検（3 → 2）
- `tests/e2e/site.spec.js`：`TOOLS`、テーマ切替の色の対象から `/en/lab/tw-palette-generator` の入力欄を外した、旧URLのブラウザでの転送の例を `/lab/en/svg-optimizer/` に変えた
- `tests/e2e/consistency.spec.js`、`tests/e2e/typography.spec.js`：`TOOLS`、アイコンの検査のページ一覧
- `tests/e2e/works.spec.js`：カード数（13 → 12）、アクション数（14 → 13、2か所）、カードと画像の数（26 → 24）、要約の数（8 → 7）、Apps のアクション（4 → 3）

削除したテスト：`tests/tw-palette-generator.test.js`、`tests/spec/tw-palette-generator.test.js`、`tests/e2e/tw-palette-generator.spec.js`、`tests/helpers/palette-cases.js`、フィクスチャ `tests/fixtures/tw-palette-generator/`。

追加したテスト：`tests/redirects.test.js` と `tests/e2e/site.spec.js` の旧URLが404になる検査、`tests/tools.test.js` のビルドの出力に痕跡が残っていない検査。

## R-3 このツールだけが使っていた共通部品の扱い

- 決めたこと：`src/components/ui/icons.tsx` の `IconTrash` はパレットだけが使っていたので消した。`src/tools/messages/index.ts` の `formatMessage` の再エクスポートは、今はどこからも使われていないが、ツールの文言の入口として残した。`src/tools/styles.css` は Tailwind v3 の既定値を戻す共通の規則でパレット専用のものがないので変えていない
- 根拠：計画「このツールだけが使うものを消す。ほかのツールが使う共通部品は残す」
- 他の選択肢：`IconTrash` を残す／再エクスポートも消す
- 戻すとき：`icons.tsx` に2行を戻す

## R-4 DESIGN.md のフォーカスの例外

- 決めたこと：5.4 の「パレットの色の見本のように輪郭線が見えにくいものは、拡大して示します。」を消した。拡大でフォーカスを示す要素がほかにないため
- 他の選択肢：例を差し替えて規則として残す（該当する要素が今はない）
- 戻すとき：1文を戻す

## R-5 docs/deploy.md の範囲

- 決めたこと：パレットに関わる行だけを直し（ページ一覧、ツール数、旧URLの表に `/lab/ja/tw-palette-generator` → 404 の行を追加）、ほかの古い記述（`/lab` が 200、`/lab/ja` → `/lab` など、一覧ページ廃止前の内容）は直していない。スコープ外のため
- 戻すとき：該当行を戻す
