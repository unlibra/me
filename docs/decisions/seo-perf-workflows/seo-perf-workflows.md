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
