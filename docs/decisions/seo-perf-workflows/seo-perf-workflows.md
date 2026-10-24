# SEO・パフォーマンス・ワークフロー整備の判断ログ

ユーザーの依頼（2026-10-24）で、unlibra.com・docs.unlibra.com の5リポジトリをまとめて見直した。親が直接実装し、レビューは省いた。build、lint、format:check、`npm test`、`npx playwright test` で確かめた。この文書は unlibra.com の変更を記録する（ほかのリポジトリの変更は、それぞれのコミットにある）。

## SP-1 計測の方法

- Lighthouse 13.5.0（Chromium 156 ヘッドレス）で、モバイルの既定とデスクトップ（`--preset=desktop`）の両方を各ページ3回測り、中央値を取った。PageSpeed Insights の API はキーなしの割り当てが 0 で使えなかった。
- 変更前後は、`main` と作業ブランチをそれぞれビルドし、ローカルの HTTP/2 サーバー（gzip あり）で配信して比べた。`wrangler dev` と `vitepress preview` は HTTP/1.1 で、同じオリジンのフォント24個が接続6本の待ち行列になり、本番（HTTP/2）より遅く出るため使わなかった。
- シミュレーションのスロットリング（Lighthouse の既定）と、実際に回線を絞る DevTools のスロットリングの両方で測った。

本番のトップページ（変更前）：Performance 62、FCP 5.7 秒、LCP 7.1 秒、転送 1,027 KB。

トップページ（ローカル、HTTP/2。変更後は SP-2 と SP-7 の両方を含む）：

| 計測                                          | 変更前         | 変更後         |
| --------------------------------------------- | -------------- | -------------- |
| モバイル、シミュレーション：Performance / LCP | 79 / 4.1 秒    | 95 / 2.4 秒    |
| モバイル、DevTools：Performance / LCP         | 75 / 6.5 秒    | 98 / 2.0 秒    |
| デスクトップ、シミュレーション：FCP / LCP     | 0.69 / 0.77 秒 | 0.49 / 0.49 秒 |
| 転送量                                        | 979 KB         | 444 KB         |

デスクトップの Performance は変更前から 99〜100 で、差はほとんどない。

## SP-2 作品カードの画像

- LCP の要素は SPOTLIGHT のカード（`FeaturedCard`）の写真で、`loading="lazy"` だった。`loading="eager"` と `fetchpriority="high"` にした。注目の作品はひとつだけ（`featured: true`）。
- 1200px の画像が 348〜600px で表示されていた。`FeaturedCard` と `FrameCard` に `widths={[400, 600, 800, 1200]}` と、表示の幅に合わせた `sizes` を付け、srcset を出す。詳細のダイアログの画像は開くまで読まないので、そのままにした。

## SP-3 トップページの構造化データ

トップページに `WebSite` の JSON-LD を足した。作者は `Person`「unlibra」で、`sameAs` は GitHub と BOOTH（`site.links`）。説明文（`messages.site.description`）は meta にあるので入れていない（入れると本文の文字に「アバター」が入り、ui-revise4 2 のテストに反する）。

## SP-4 Dependabot

`.github/dependabot.yml` を足した（npm と github-actions、週1回、minor と patch はまとめて1つのプルリクエスト、公開から7日待つ `cooldown`）。

低リスクの更新は `.github/workflows/dependabot-auto-merge.yml` が auto-merge を有効にし、必須のチェック `test` が通るとマージされる（ユーザーの決定、2026-10-24。リポジトリの「Allow auto-merge」も親が有効にした）。低リスクとは、PR のすべての依存が patch か minor の更新で、0.x の minor でなく、プレリリースでなく、メンテナーが変わっていないもの。読めない値は低リスクとみなさない。マージされた更新は、ほかの push と同じく Workers Builds が本番にデプロイする。

ワークフローの規則（I5）は SP-8 のとおり変えた。

## SP-5 本番の定期チェック

`.github/workflows/production-check.yml` を足した。毎日 06:17（JST）に `node scripts/check-prod.mjs https://unlibra.com` を行い、失敗すると GitHub がメールで知らせる。I5 の規則を満たす（読むだけ、secrets なし、公式の actions をコミットで固定）。`npm ci` は要らない（`src/config/site.ts` の型は Node が取り除く）。

要確認：Cloudflare の Bot Fight Mode が GitHub のランナーからのリクエストを止めると、このチェックが失敗しうる（docs/deploy.md 4章）。

## SP-6 見送ったもの（案）

- CSP：`_headers` に Content-Security-Policy がない。インラインのスクリプト（テーマの切り替え）と Cloudflare が差し込むスクリプト（Web Analytics、ボット対策）があるので、まず Report-Only で試すのがよい（案）。
- Lighthouse の Best Practices が 81 なのは、Cloudflare が差し込む `/cdn-cgi/challenge-platform/` のスクリプトの非推奨 API の警告による。サイトのコードではない。

## SP-7 Noto Sans JP をサイトの文字だけに削る（ユーザーの決定）

ビルドのたびに `scripts/noto-sans-jp-subset.mjs`（Astro のインテグレーション、`astro:build:done`）が削る。内容が変わっても、次のビルドで自動で追従する。

- `dist/` の HTML と JavaScript のすべての文字（島が後から出す文言を含む）と、印字できる ASCII を集める。
- Fontsource の分割ファイルのうち、集めた文字を含むものを、その文字だけに削って `dist/_astro/` に書く（名前に内容のハッシュ。`/_astro/*` は immutable のキャッシュ）。
- 各ページの `<head>` の最後に、削ったファイルの `@font-face` を足す（`<style data-noto-sans-jp-subset>`）。記述子とメトリクスの上書き（`METRIC_OVERRIDES`、`astro.config.mjs` と共有）は Fontsource の規則と同じで、`unicode-range` は各ファイルが持つ文字だけ。
- Fontsource の規則はスタイルシートに残す。同じファミリーの面は後に定義したものから調べる（CSS Fonts 4、4.5）ので、集めた文字は削ったファイルで、それ以外の文字（ツールに落としたファイルの名前など）は従来どおり Fontsource のファイルで表示する。
- 削ったファイルは名前のテーブル（著作権、OFL の説明と URL、ID 13・14）を残す。パッケージは従来どおり `/third-party-licenses.txt` に載る（元のファイルも `dist/` に出るため）。

結果：サイト全体で 40 ファイル、881 KB が 210 KB（536字）。ブラウザで数えたフォントの読み込みは、トップページが 23 ファイル 492 KB から 23 ファイル 171 KB、プライバシーポリシーが 195 KB、元のファイルの読み込みは 0。クレジットのページだけは、元の latin-ext（8 KB）も読む。Noto Sans JP に「ł」（Paweł Kuna）の字形がなく、ブラウザが両方の面を試してからシステムのフォントで表示するため（変更前も同じ）。

テスト：`tests/noto-sans-jp-subset.test.js`（ページごとに、Noto Sans JP が持つ文字がすべて削ったファイルの範囲にあること、`<head>` の最後でスタイルシートの後にあること、記述子とメトリクス、ファイルの字形と名前のテーブル）。

## SP-8 ワークフローの規則（I5）を変えた（ユーザーの決定）

I5 は `docs/decisions/tests/plan.md` のブロック4の条件で、push と pull request のたびに動くテストのワークフローについて書かれていた（シークレットを使わない、権限は読み取りだけ、外部の Action は公式の `actions/*` を SHA で固定）。理由は書かれていないが、すべてのブランチとプルリクエストで動くワークフローに、書き込みの権限やシークレットを渡さないための条件と読める。テスト（`tests/workflow.test.js`）は、これを `.github/workflows/` のすべてのファイルに当てていた。

変えた後の規則：

- すべてのワークフロー：`permissions` を一度だけ書く。Action は `actions/*` と `dependabot/*` だけで、コミットの SHA で固定する。
- 書き込むワークフローはファイル名で列挙する（`WRITERS`、今は `dependabot-auto-merge.yml` だけ）。ほかは従来どおり、読み取りだけでシークレットを使わない。新しいワークフローは読み取りだけから始まる。
- `dependabot-auto-merge.yml`：`on: pull_request` だけ（`pull_request_target` と `workflow_run` は使わない）、権限は `contents: write` と `pull-requests: write`、Dependabot のプルリクエストでだけ動く、シークレットは `GITHUB_TOKEN` だけ、プルリクエストのコードをチェックアウトしない。

## SP-9 移行の後片付けのテストを消した（ユーザーの決定）

移行の後に残りがないことだけを確かめるテスト（9件と、2件のテストの一部）を消した。一覧は docs/decisions/tests/tests.md の TS-12。単体テストは 264 件から 255 件になった。

本番確認の `x-vercel-id` の検査も消した（ユーザーの決定）。

版を固定して確かめていたもの（Tabler Icons、`PREBUNDLED`）は SP-10 のとおり変えた。

## SP-10 クレジットとライセンスの表記を版から切り離した（ユーザーの決定）

- クレジットのページ：見出し「その他の素材・ライセンス」を「グラフィック素材」に変え、載せるのは LICENSE の2章の素材（Tabler Icons と DiceBear）だけにした。フォントは載せない（`/third-party-licenses.txt` に、ビルドから自動で載る）。`src/config/credits.ts` の `fonts` と、そのテストを消した。
- Tabler Icons：版を書かない（LICENSE、クレジット、アイコンのコメント）。MIT は版の表記を求めず、コピーした分のライセンスは変わらない。`@tabler/icons` と `@tabler/icons-react` は更新しない（`.github/dependabot.yml` の `ignore`）。いつの間にか絵柄が変わるのを避けるため。テストは、`LICENSES/Tabler-MIT.txt` と著作権の行がパッケージのものと一致すること、コピーしたアイコンがパッケージと同じであることを確かめる。
- `PREBUNDLED`（svgo と JSZip）：同梱するパッケージを手で書くのをやめ、依存関係（間接のもの、すべての版）から集める（`bundledDependencies`）。手で書くのは、バンドルに入らない依存（svgo の `commander`・`picocolors`、JSZip の `readable-stream`）だけで、その依存の依存も除く。版が上がっても、増えた依存は自動で載る。バンドルにない依存が載ることはありうるが、害はない（FX-8 と同じ考え）。除いた依存が、のちにバンドルに入るようになっても気づけない（限界）。変更の時点で、集めた一覧は手で書いた一覧と同じだった。
- テストの版の固定（jszip と react の版、css-tree と mdn-data の版、svgo の版）は、入っている版から読むようにした。
- `LICENSE_NOTES` と `LICENSE_FALLBACKS` のキーから版を外した（ユーザーの決定）。`LICENSE_FALLBACKS` の項目は、文の元にした `license` と `author` を持ち、入っている package.json と違えばビルドを止める（版が上がっても、この2つが同じなら文はそのまま正しい）。`LICENSE_NOTES` の LINE Seed JP の注記（フォントの著作権表示は「© LY Corporation」）は、テストが、配信するフォントと、入っているパッケージのフォントの両方で確かめる

## SP-11 ロゴのフォントをビルドのたびに作る（ユーザーの決定）

- `src/assets/fonts/line-seed-jp-unlibra-700.woff2`（LINE Seed JP Bold の「unlibra」の7文字）をリポジトリから消し、`.gitignore` に入れた。`scripts/subset-brand-font.mjs` が Astro のインテグレーションとして、ビルド（と開発サーバー）の始まり（`astro:config:setup`）に、入っているパッケージから作る。`scripts/generate-icons.mjs` も同じ関数で作ってから使う。`npm run generate:brand-font` は消した。
- 残す文字はページから集めず、固定の `BRAND_FONT_TEXT`（"unlibra"）のまま。このフォントで表示する文字をページから見分けるのは手間に見合わない。
- ライセンスの一覧には、従来どおり `DERIVED_ASSETS`（作るファイルのパスとパッケージの対応）で載る。パッケージの版が上がると、作るファイルも一覧の版も追従する。
- 変更の時点で、作ったファイルはコミットしてあったものとバイト単位で同じだった。

## SP-12 クレジットのライセンスを全文へのリンクにした（ユーザーの決定）

クレジットのグラフィック素材から「参照先」（素材のサイトの URL）を消し、ライセンスの名前（MIT License など）を、このリポジトリの `LICENSES/` にある全文（GitHub の main）へのリンクにした。リンク先のファイルは LICENSE の2章の「The full text is in」と同じで、テストが一致とファイルの存在を確かめる。

## SP-13 最小限の CSP を入れた（ユーザーの決定）

SP-6 で見送った CSP のうち、スクリプトとスタイルに関わらない3つだけを `public/_headers` の `/*` に足した：`frame-ancestors 'none'`（`X-Frame-Options: DENY` と同じ。古いブラウザのため X-Frame-Options も残す）、`object-src 'none'`（サイトに `<object>`・`<embed>` はない）、`base-uri 'self'`（`<base>` はない）。インラインのスクリプトや Cloudflare が差し込むスクリプトには影響しない。本番の定期チェック（`check-prod.mjs`）が `_headers` のとおりに送られているかを毎日確かめる。

docs.unlibra.com（GitHub Pages）は Cloudflare を通らず GitHub から直接配信されていて、ヘッダーを足せない。`<meta>` の CSP では `frame-ancestors` が効かないため、入れていない。

## SP-14 ページが待つスタイルシートからフォントの定義を外した（ユーザーの決定）

PageSpeed Insights（本番、モバイル 90）で、全ページが待つスタイルシート（`BaseLayout.*.css`、gzip で 70 KB）が「レンダリングをブロックしているリクエスト」に挙がり、LCP の 2.7 秒のうち 1.66 秒が描画の遅れだった。中身の 9 割近くがフォントの定義だった。

- Geist Mono：4 KB 未満のファイルが base64 でスタイルシートに埋め込まれていた（gzip で約 28 KB。使うのは寄付とパスワード生成のページだけ）。`astro.config.mjs` の `vite.build.assetsInlineLimit` で、フォントのファイルは埋め込まない。`scripts/third-party-licenses.mjs` が同じ設定を上書きしていた（派生ファイルを埋め込まないため）ので、プロジェクトの設定に判断を渡すようにした。
- Noto Sans JP の Fontsource の定義（124 件、gzip で約 32 KB）：SP-7 の削ったファイルがページの文字をすべて持つので、予備でしかない。`scripts/noto-sans-jp-subset.mjs` がビルドの後にスタイルシートから外して `_astro/noto-sans-jp-fallback.<hash>.css` に書き、各ページの `<head>` で、削ったファイルの定義の前に `media="print"`（読み込んだら `all`）でリンクする（描画を待たない。JavaScript がないときは `<noscript>` の通常のリンク）。文書の中で前にあるので、両方にある文字は削ったファイルが使われる。
- 結果：ページが待つスタイルシートは gzip で 70 KB から 10 KB。ブラウザで数えたフォントの読み込みは変わらない（トップページで元のファイル 0、クレジットだけ latin-ext、Geist Mono は使う2ページだけ）。Lighthouse（ローカル、HTTP/2、モバイル、3回の中央値）：DevTools のスロットリングで FCP 2.02 秒 → 1.62 秒、LCP 2.02 秒 → 1.68 秒、Performance 97 → 99。シミュレーションでは FCP 2.26 秒 → 1.82 秒、LCP 2.26 秒 → 2.49 秒（レンダリングをブロックする推定の遅れは 450 ms → 0）。
- 見送り：「以前の JavaScript」（10 KB）と「キャッシュ期間」（4 KB）は Cloudflare Web Analytics のスクリプトで、サイトのコードは挙がっていない。
- 注意：Astro の増分ビルドのキャッシュは、関数の設定（`assetsInlineLimit`）の変更では無効にならない。手元で設定を変えたら `dist/` と `node_modules/.astro` を消してからビルドする（CI は毎回まっさら）。

## SP-15 予備のスタイルシートは読み込みの後に取りに行く（ユーザーの決定）

SP-14 の後、Lighthouse のシミュレーションで LCP が毎回伸びていた（2.26 秒 → 2.49 秒）。シミュレーションは、LCP の描画より前に始まったリクエストを優先度に関係なく LCP に要るものとして数えるため、ページの頭で始まる予備のスタイルシート（31 KB、`media="print"`）が加わっていた。実際のブラウザでも、優先度は最も低いが回線を分け合い、LCP の画像は約 40 ms 遅れていた。

予備のスタイルシートは、`load` イベントの後に、スクリプトがその場所（削ったファイルの規則の前）にリンクを足して読む。JavaScript がないときは `<noscript>` の通常のリンク。予備は想定外の文字のためだけなので、ページの文字の見た目は変わらない。

Lighthouse（ローカル、HTTP/2、モバイル、5回の中央値。SP-14 の形との比較）：シミュレーションで LCP 2.49 秒 → 2.11 秒（FCP 1.82 秒 → 1.89 秒）、Performance 96 → 98。DevTools のスロットリングで LCP 1.69 秒 → 1.60 秒。テスト：`tests/e2e/fonts.spec.js`（読み込みの後に取りに行くこと、削ったファイルの規則より前にあること、ない文字で Fontsource のファイルを読むこと）。

## SP-16 ロゴタイプを SVG にした（ユーザーの決定）

ロゴタイプ「unlibra」は LINE Seed JP Bold の7文字のサブセット（`font-display: swap`、先読みなし）で表示していて、フォントが届く前に一瞬 Noto Sans JP で出ることがあった。ロゴは別の書体で見せたくないので、フォントをやめて文字の輪郭の SVG にした。

- `scripts/generate-logotype.mjs`（`npm run generate:logotype`）が、`@fontsource/line-seed-jp` から HarfBuzz（`harfbuzzjs`）で「unlibra」を組み（送りとカーニング）、輪郭を1つの `<path>` にして `src/assets/brand/logotype.svg` に書く。リポジトリに置き、パッケージの更新には追従しない（ロゴは変えない）。テストは、フォントから描き直したものがこのファイルと同じであることを確かめる。
- 大きさは em で、フォントの ascender と descender の高さ（1.1em）、`vertical-align` で descender の分だけ下げてベースラインにのせる。同じ大きさの文字と同じ場所を占める。色は `currentColor`。Tailwind の preflight は svg を block にするので `inline` を付ける。
- `src/components/layout/Logotype.astro` が `role="img"` と `aria-label="unlibra"` を足して埋め込む（ヘッダー、モバイルのメニュー、フッター）。ホームへのリンクの名前は「unlibra」のまま。
- 消したもの：`scripts/subset-brand-font.mjs`（ビルドのたびに作るサブセット、SP-11）、`global.css` の `@font-face` と `--font-brand`、`DERIVED_ASSETS` と `LICENSE_NOTES` の LINE Seed JP の項目（配信しなくなったので、サードパーティライセンス一覧からも外れる）。LICENSE の4章は、ロゴタイプの SVG が LINE Seed JP（SIL OFL 1.1）の輪郭であることを書く。
- 見た目：変更前後の画面（1280px と 375px、ライトとダーク、ヘッダー・フッター・モバイルのメニュー）で、リンクの位置と大きさは同じ（幅は 0.02px 以下の差）。画素の差はアンチエイリアスの範囲。フッターのリンクの hover の下線は、SVG には引かれない（変更前は文字に引かれた）。
- OGP：`scripts/generate-icons.mjs` は OGP 画像（`public/ogp.png`）も作っていたが、今の画像は手で差し替えたもので、スクリプトを走らせると上書きされる（477e92c で一度起き、46ca508 で戻した）。OGP の生成をスクリプトから外し、アイコン（`icon.svg`、`favicon.ico`、`apple-touch-icon.png`）だけを作るようにした。

## SP-17 SVG のファビコンを favicon.svg にした（ユーザーの決定）

`public/icon.svg` は `src/assets/brand/symbol.svg`（ページに埋め込むマーク）に `width`・`height` を足しただけのファビコンで、名前からは分けている理由がわからなかった。ファビコン専用だとわかるように `public/favicon.svg` にした（`BaseLayout.astro` のリンク、`_headers` のキャッシュ、`scripts/generate-icons.mjs`、テスト）。docs.unlibra.com にも同じ `favicon.svg` を置き、docs のサイトのファビコンはそれを指す（`brand/symbol.svg` はナビのロゴとして残す）。

## SP-18 更新したページを IndexNow に知らせる（ユーザーの決定）

IndexNow はキーのファイルを置いているだけで、URL を送ったのは切り替えのときの1回だけだった。Google は IndexNow を使わない（サイトマップで知る）。IndexNow は「内容が変わったときだけ送る。変わっていない URL は送り直さない」とする。

- unlibra.com：`.github/workflows/indexnow.yml`（main への push のたび）。push の前と後のコミットをそれぞれビルドし、`scripts/indexnow.mjs` がサイトマップのページごとに、タイトル、説明文、`<main>` の文章・リンク先・画像（名前と alt）を比べ、変わったページ（サイトマップに増えた・消えたページを含む）だけを選ぶ。HTML 全体で比べないのは、CSS やスクリプトを作り直すとファイル名のハッシュが全ページで変わるため。本番へのデプロイは Workers Builds なので、ビルドに入れた `/commit.txt`（Workers Builds のコミット、なければ git のコミット）が push したコミットかその後のコミットになるまで待ってから送る。変わったページがなければ何もしない。読み取りだけで、シークレットは使わない（キーは公開のもの）。
- Cloudflare の Crawler Hints（キャッシュのミスで送る）は、変わったページだけを送るものではない。ダッシュボードの設定なので、使うかはユーザーが決める。
- 確かめたこと：`submit()` で、今日変わったクレジットのページを1件送り、IndexNow は 200 を返した。ワークフローそのものは main に入ってから初めて動く。
- docs.unlibra.com：i18n-tiny と tkinter-unblur はそれぞれのデプロイのワークフローで、変わった `.md` から URL を決めて送る。docs.unlibra.com のトップと mururu のマニュアルは、unlibra.github.io のワークフローが Pages の公開のあとに、変わった HTML の本文を比べて送る。

追記（ユーザーの決定）：`indexnow.yml` に `paths-ignore` を足し、ページの元にならないファイル（`tests/`、`docs/`、最上位の `*.md`、`.github/`、ESLint・Playwright・Prettier の設定）だけを変えた push では動かない。どれもビルドの入力（`src/`、`public/`、`scripts/`、Astro・npm・TypeScript・Node の設定）に当たらないことを `tests/indexnow.test.js` が確かめる。push の前後を両方ビルドする方式は変えない（1回約 75 秒。ファイルの変更からページを決める対応表は、共有の部品やデータの変更で漏れやすい）。

## SP-19 undici のアラートは wrangler の更新を待つ（ユーザーの決定）

Dependabot のアラート（high、undici 7.29.1。修正は 7.30.1）は、wrangler の miniflare が undici を 7.29.1 に固定していて（最新の miniflare も同じ）、Dependabot では上げられない。開発用の依存で、サイトの配信物には入らない。`package.json` の `overrides` で上げた（#28）が、Dependabot は `overrides` の値を更新しないので、miniflare が新しい undici を求めるようになると上書きが古い版に縛り、手で外すことになる。ユーザーの判断で上書きを取り消し、wrangler（miniflare）の更新を待つ。Dependabot の wrangler の更新で解消する。
