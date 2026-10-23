# 本番切替の手順書

`unlibra.com` の配信を Vercel から Cloudflare Workers（静的配信）に切り替えるための手順。ユーザーがダッシュボードで実行する。

- 手順は Cloudflare の公式ドキュメント（2026-10-21 に参照）で確かめた内容だけを書いた。確かめられなかった箇所は「要確認」と書いた
- 「戻せる」「戻せない」は各手順の見出しに書いた
- 「案」と書いたものは未決で、実行前にユーザーが選ぶ

参照した公式ドキュメント：

- Workers Builds：<https://developers.cloudflare.com/workers/ci-cd/builds/>、[Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)、[Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
- Static Assets の [Redirects](https://developers.cloudflare.com/workers/static-assets/redirects/)、[HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- Web Analytics の [Get started](https://developers.cloudflare.com/web-analytics/get-started/)、[FAQ](https://developers.cloudflare.com/web-analytics/faq/)

## 0. 前提と、始める前に決めること

### 現状（2026-10-21 時点）

- `unlibra.com` は Cloudflare のプロキシ経由で Vercel から配信されている（レスポンスに `x-vercel-id` が付く）
- `/lab/*` は me の main ブランチの `vercel.json` から liblab の Vercel プロジェクトへ rewrite されている
- me の main ブランチはまだ旧サイト。新サイトはブランチ `feat/site-replacement` にある
- Worker の名前は `wrangler.jsonc` の `name` の `unlibra-com`

### 決めること：main へのマージと Vercel の自動デプロイの順序

Vercel の me プロジェクトは main への push で本番にデプロイしている（と考えられる。要確認）。新サイトを main にマージすると、Vercel が新サイトを本番にデプロイし、`vercel.json` が消えるので `/lab/*` の rewrite もなくなる。ドメインを付け替える前にこれが起きると、本番の `/lab/*` が壊れる。

また、Workers Builds を Wrangler の設定ファイルがないブランチ（今の main）につなぐと、自動設定が走ってプルリクエストが作られる（公式 [Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) の「Automatic configuration for new projects」）。

次のどちらかを選ぶ（どちらも案）。

- 案A：Workers Builds の本番ブランチを最初は `feat/site-replacement` にする。ドメインを付け替えて確認が済んでから main にマージし、本番ブランチを `main` に変える。Vercel の me プロジェクトに main のマージが届いても、そのときにはドメインが Workers に移っているので、訪問者には影響しない
- 案B：先に Vercel の me プロジェクトの Git 連携による自動デプロイを止め、main にマージしてから、Workers Builds の本番ブランチを `main` にする。Vercel 側の止め方は Vercel のドキュメントで確かめる（要確認）

以下の手順は、どちらの案でも「本番ブランチ」と書く。

### 決めること：ドメインの付け替えの方式

Custom Domain（案C）か Route（案R）かを選ぶ。違いは3章の表にある。

### 控えておくもの（戻すときに使う）

- Cloudflare の DNS で、`unlibra.com`（と、あれば `www.unlibra.com`）のレコードの種類・内容・プロキシの状態。スクリーンショットか書き写しで残す。今の種類（CNAME か A か）は要確認
- Vercel の me プロジェクトのドメイン設定。付け替えのあともしばらく消さない（Phase 7 で削除する）

## 1. Worker を作り、Workers Builds を接続する（戻せる）

公式 [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) の「Connecting a GitHub repository」の新しい Worker の手順。

1. Cloudflare のダッシュボードで **Workers & Pages** を開く
2. **Create application** を選ぶ
3. **GitHub** を選ぶ。求められたら GitHub で認証する
4. リポジトリ `me` を選ぶ
5. 設定を次のようにして **Save and Deploy** を選ぶ

| 設定                                  | 値                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Worker の名前                         | `unlibra-com`（`wrangler.jsonc` の `name` と一致しないとビルドが失敗する）                                        |
| Git branch（本番ブランチ）            | 0章で選んだ案による（案A：`feat/site-replacement`、案B：`main`）                                                  |
| Build command                         | `npm run build`                                                                                                   |
| Deploy command                        | `npx wrangler deploy`（既定値。公式 Configuration に「`package.json` で指定した Wrangler の版が使われる」とある） |
| Root directory                        | 空（リポジトリの直下に `wrangler.jsonc` がある）                                                                  |
| Build variables                       | なし（Node の版は `.node-version` で指定している。下の「Node の版」）                                             |
| Preview command（本番以外のブランチ） | 既定値の `npx wrangler preview` のまま。プレビューのビルドを使うかは任意                                          |

画面に出る項目名と並びが上の表と違う場合がある。公式の手順は「Configure your project」としか書いていないので、各項目の画面上の名前は要確認。

### Node の版

- 公式 [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/) の表で、Node.js の版は環境変数 `NODE_VERSION` か、ファイル `.nvmrc`、`.node-version` で指定できると書かれている。既定の版は 24.18.0
- このリポジトリは `.node-version` に `24` を書いている（Phase 1 の判断 P1-9）。Astro 7.4.1 は Node 22.22.0 以上が必要
- 確認：最初のビルドのログで、使われた Node の版が 24 系であることを確かめる。ログのどこに版が出るかは要確認
- 依存のインストールはビルドの前に自動で行われる（同じページの「Skip dependency install」）。どのコマンド（`npm ci` か `npm install`）が使われるかは要確認

### 戻すとき

- Worker を消すか、**Settings** > **Builds** > **Disconnect** で接続を外す
- Workers Builds の接続時に API トークンが自動で作られる（公式 [Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) の「API token」）。Worker を消したあとも残るかは要確認。残っていれば **My Profile** > **API Tokens** で消す

## 2. `workers.dev` の URL で確かめる（戻せる）

デプロイが終わると、Worker は `unlibra-com.<アカウントのサブドメイン>.workers.dev` で公開される（公式 [workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)）。この URL は誰でも見られる。

以下、`$BASE` をこの URL に置き換える。ステータスと行き先は `curl -sI "$BASE/パス"` の `HTTP/` の行と `location:` の行で見る。

### 2.1 全ページが 200 になる

| パス                                                                               |
| ---------------------------------------------------------------------------------- |
| `/`、`/privacy`、`/credits`、`/third-party-licenses.txt`                           |
| `/lab/favicon-generator`、`/lab/svg-optimizer`、`/lab/password-generator`          |
| `/en/lab/favicon-generator`、`/en/lab/svg-optimizer`、`/en/lab/password-generator` |
| `/robots.txt`、`/sitemap-index.xml`、`/sitemap-0.xml`                              |

ブラウザでも開き、3つのツールが日英で動くこと、ライト・ダークの切替が効くことを見る。存在しないパス（例：`/nope`）は 404 になり、自前の404ページが出る。

### 2.2 旧URLが 301 で新URLに転送される

| 旧URL                                                        | ステータス | `location`                                  |
| ------------------------------------------------------------ | ---------- | ------------------------------------------- |
| `/ja`、`/ja/`、`/en`、`/en/`                                 | 301        | `/`                                         |
| `/lab`、`/lab/`、`/en/lab`、`/en/lab/`（ツールの一覧はない） | 301        | `/#apps`                                    |
| `/lab/ja`、`/lab/ja/`、`/lab/en`、`/lab/en/`                 | 301        | `/#apps`                                    |
| `/lab/ja/svg-optimizer`（3ツールとも）                       | 301        | `/lab/svg-optimizer`                        |
| `/lab/ja/svg-optimizer/`                                     | 301        | `/lab/svg-optimizer`                        |
| `/lab/en/favicon-generator`（3ツールとも）                   | 301        | `/en/lab/favicon-generator`                 |
| `/lab/en/iromide`                                            | 301        | `/en/lab/iromide`（その先は 404）           |
| `/lab/ja/tw-palette-generator`                               | 301        | `/lab/tw-palette-generator`（その先は 404） |
| `/sitemap.xml`                                               | 301        | `/sitemap-index.xml`                        |

`/privacy/` のような新URLの末尾スラッシュ付きの形は 307 で末尾スラッシュなしに転送される。これは Workers の `html_handling` の仕様で、想定どおり（Phase 1 の判断 P1-6）。

### 2.3 `_headers` のヘッダーが付く

- `/` のレスポンスに次が付く：`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`X-XSS-Protection: 1; mode=block`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=()`、`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `/_astro/` 以下のファイル（`/` の HTML に出てくるもの）に `Cache-Control: public, max-age=31536000, immutable` が付く
- `/icon.svg`、`/ogp.png`、`/favicon.ico`、`/apple-touch-icon.png` に `Cache-Control: public, max-age=0, s-maxage=86400, stale-while-revalidate=60` が付く
- `/robots.txt`、`/sitemap-index.xml`、`/sitemap-0.xml` に `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=60` が付く

### 2.4 Web Analytics の計測タグ

- このサイトは計測タグをコードに書かず、Cloudflare のプロキシによる自動挿入（automatic setup）に任せる（Phase 1 の判断 P1-1）。自動挿入は「Cloudflare にプロキシされているサイト」が対象（公式 [Get started](https://developers.cloudflare.com/web-analytics/get-started/)）
- `workers.dev` が自動挿入の対象になるかは公式に記載がない（要確認）。ここで `/` の HTML に `static.cloudflareinsights.com/beacon.min.js` が出ていなくても、切替の中止の理由にはしない。4章で独自ドメインで確かめる

### 2.5 付け替える前に、`unlibra.com` のゾーンの設定を確かめる

付け替えの後は、`unlibra.com` のゾーンの設定が Worker のレスポンスに重なる。`_headers` と `robots.txt` の内容と食い違わないか、ダッシュボードで次を見ておく。どれも `workers.dev` の確認（2.1〜2.3）では表に出ない。4章の確認（`npm run check:prod -- https://unlibra.com`）で食い違いが出たら、ここに戻る。

- 管理された robots.txt（公式 [Managed robots.txt](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)）：有効にすると、Cloudflare が AI クローラー向けの `Disallow` を、サイトの `robots.txt` の前に足して返す。公式の手順では **Security Settings** で **Bot traffic** に絞り、**Configure AI bot policies** から設定する。このサイトの `robots.txt` をそのまま返すなら、無効になっていることを確かめる。既定で有効かどうかは公式に記載がない（要確認）
- HSTS と No-Sniff（公式 [HTTP Strict Transport Security](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)）：**Edge Certificates** のページの **HTTP Strict Transport Security (HSTS)** で設定する。有効にすると Cloudflare が `Strict-Transport-Security` を、**No-Sniff Header** を有効にすると `X-Content-Type-Options: nosniff` を付ける。`_headers` も同じヘッダーを付けている（`max-age=63072000; includeSubDomains; preload`、`nosniff`）。両方が付けたときにどちらが残るか、値が違うと重なるかは公式に記載がない（要確認）。有効なら、値が `_headers` と同じであることを確かめる
- ブラウザキャッシュの TTL（公式 [Browser Cache TTL](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)）：**Caching** > **Configuration** の **Browser Cache TTL**。既定は 4 時間で、配信元の `Cache-Control` の値がそれより短いと Cloudflare が書き換える。`_headers` はアイコン・`robots.txt`・サイトマップに `max-age=0` を付けていて、HTML には Workers の静的配信が `max-age=0, must-revalidate` を付ける（`wrangler dev` で見た。本番の Workers でも同じかは要確認）。これらが書き換えられないよう、**Respect Existing Headers** になっていることを確かめる
- ボット対策（公式 [Bot Fight Mode](https://developers.cloudflare.com/bots/get-started/bot-fight-mode/)）：**Security Settings** で **Bot traffic** に絞った **Bot fight mode**。有効だと自動化したリクエストにチャレンジを返すことがあり、`check:prod` の検査が 403 などで失敗しうる。Bot Fight Mode は WAF のルールなどで除外できない（公式）。そのときは一時的に無効にして検査するか、ブラウザで確かめる。ほかのボット対策（Super Bot Fight Mode、WAF のルール）が使われているかも見る。`workers.dev` に効くかは公式に記載がない（要確認）

## 3. 独自ドメインを Vercel から Workers に付け替える

付け替えの方式は未決。次の2つの案から、実行前にユーザーが選ぶ。

| 項目             | 案C：Custom Domain                                                     | 案R：Route                                                                                                          |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 公式の位置づけ   | Worker がサイトの配信元（オリジン）のときに公式が勧める方式            | 公式は、Worker が配信元のときは Custom Domain を使うよう案内している（要約）。配信元の前に Worker を置く用途の方式  |
| DNS レコード     | Vercel を指すレコードを消してから足す（既存の CNAME があると作れない） | Vercel を指すプロキシ済みのレコードを残したまま、Worker のルートを足す                                              |
| つながらない時間 | ある（レコードを消してから Custom Domain が働くまで）                  | 公式の記述からはないと考えられる（要確認）                                                                          |
| 戻し方           | Custom Domain を外し、控えたレコードを作り直す。その間つながらない     | ルートを消す。DNS レコードは残っているので Vercel に戻る（要確認）                                                  |
| 未確認の点       | A レコードの場合に作れるか、証明書の発行にかかる時間                   | Worker のスクリプトを持たない静的配信だけの Worker がルートで動くか。Phase 7 で Vercel を消したあとのレコードの扱い |

公式：[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)、[Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)。

### 3.1 案C：Custom Domain で付け替える

#### 3.1.1 DNS レコードを消す（戻せる。ただし消してから 3.1.2 が済むまでサイトにつながらない）

公式に「既存の CNAME レコードがあるホスト名には Custom Domain を作れない」とある。A レコードの場合に作れるかは記載がない（要確認）。公式の「Migrate from Routes」の手順も、先に DNS レコードを消してから Custom Domain を足す順になっている。

1. 0章で `unlibra.com` の DNS レコードを控えたことを確かめる
2. ゾーン `unlibra.com` の **DNS** > **Records** で、`unlibra.com` を Vercel に向けているレコードを消す

消してから 3.1.2 が終わるまでの間、`unlibra.com` は応答しない。3.1.1 と 3.1.2 は続けて行う。

#### 3.1.2 Custom Domain を足す（戻せる）

1. **Workers & Pages** で Worker `unlibra-com` を選ぶ
2. **Settings** > **Domains & Routes** > **Add** > **Custom Domain** を選ぶ
3. `unlibra.com` を入れて **Add Custom Domain** を選ぶ

Cloudflare が DNS レコードと証明書を作る。証明書が発行されて HTTPS でつながるまでの時間は記載がない（要確認）。

#### 3.1.3 戻すとき（戻せる。ただし Custom Domain を外してから DNS レコードを作り直すまでサイトにつながらない。下の「戻せないもの」も参照）

1. Worker の **Settings** > **Domains & Routes** で Custom Domain `unlibra.com` を外す。手順の画面上の名前は要確認
2. 0章で控えた DNS レコードを、同じ種類・内容・プロキシの状態で作り直す
3. Custom Domain を外しても、そのとき作られた証明書は自動では消えない。不要なら **SSL/TLS** > **Edge Certificates** で消す（公式 Custom Domains の「Certificates」の注意書き。残っていても動作には影響しない）

### 3.2 案R：Route で付け替える

公式 Routes の「Set up a route in the dashboard」の手順。ルートを足すには、対象のホスト名にプロキシした DNS レコードが要る。今の `unlibra.com` のレコードはプロキシされている（0章の現状）。

#### 3.2.1 ルートを足す（戻せる）

1. **Workers & Pages** で Worker `unlibra-com` を選ぶ
2. **Settings** > **Domains & Routes** > **Add** > **Route** を選ぶ
3. ゾーン `unlibra.com` を選び、ルートのパターンに `unlibra.com/*` を入れる
4. **Add route** を選ぶ

静的配信だけの Worker（`wrangler.jsonc` に `main` がない）がルートで全パスを配信できるかは、公式で確かめられなかった（要確認）。足した直後に 4章の確認を行い、期待どおりでなければすぐ 3.2.2 で戻す。

#### 3.2.2 戻すとき（戻せる。下の「戻せないもの」も参照）

1. Worker の **Settings** > **Domains & Routes** でルート `unlibra.com/*` を消す。手順の画面上の名前は要確認

DNS レコードは残しているので、ルートを消すと Vercel からの配信に戻ると考えられる（要確認）。

#### 3.2.3 案R の後に残ること

- Phase 7 で Vercel のプロジェクトを消すと、`unlibra.com` の DNS レコードは存在しない配信元を指したままになる。公式の「Migrate from Routes」は、ルートから Custom Domain に移るときに DNS レコードを消してから Custom Domain を足す手順なので、その時点で案C と同じつながらない時間が生じる。別の方法があるかは要確認

### 3.3 付け替えに関わる要確認の点（両案に共通）

- `www.unlibra.com`：今どう扱われているか（Vercel 側で `unlibra.com` に転送しているか）は要確認。Custom Domain はホスト名が完全に一致したときだけ働くので、`www` は `unlibra.com` の付け替えでは移らない。`www` を `unlibra.com` に転送し続けるなら、公式の「Redirect between www and root domain」の手順（転送ルールと、プロキシした DNS レコード）が要る
- キャッシュ：Cloudflare のキャッシュに Vercel からのレスポンスが残っていて、付け替えのあとも返される可能性があるか、パージが要るかは要確認
- ダッシュボードで足した Custom Domain やルートが、そのあとの Workers Builds の `wrangler deploy`（`wrangler.jsonc` に `routes` がない）で外されないかは要確認。公式の workers.dev のページには、ダッシュボードで `workers.dev` を無効にしても Wrangler の設定に書かないと次のデプロイで有効に戻る、という例がある。付け替えの直後に main へのマージなどでデプロイが走ったら、Custom Domain やルートが残っていることを確かめる
- Vercel の me プロジェクトのドメイン設定に `unlibra.com` が残っていても、DNS が Workers を指していれば訪問者には影響しないと考えられるが、Vercel 側の挙動は要確認
- 戻すには Vercel の me プロジェクトが旧サイトを配信できる状態である必要がある。0章の案A・案B のどちらでも、main にマージしたあとは Vercel の本番が新サイトになっている可能性があるので、戻すときは Vercel 側で旧サイトのデプロイを本番に戻す操作が要る（Vercel 側の手順は要確認）

### 3.4 戻せないもの（両案に共通）

- 301 は恒久的な転送なので、訪問者のブラウザや検索エンジンが記憶する。戻したあとも、一度 `/ja` などにアクセスしたブラウザは新URLに転送され続けることがある。旧URLの多くは新サイトでも同じ内容のページに着くので、影響は旧サイトに戻した場合の `/lab/ja/*` などに限られる
- 検索エンジンのインデックスの更新は、こちらから元に戻せない

## 4. 付け替えのあとの確認（戻せる）

`$BASE` を `https://unlibra.com` にして、2章の 2.1〜2.3 をもう一度行う。加えて次を確かめる。

- レスポンスに `x-vercel-id` が付いていない
- `/lab`、`/lab/svg-optimizer` などが新サイトのページで、liblab の旧ページではない
- Web Analytics：`/` の HTML に `static.cloudflareinsights.com/beacon.min.js` の `<script>` が入っている。入っていなければ、**Web Analytics** で `unlibra.com` のサイトの設定（公式 Get started では **Manage site**。画面上の名前は要確認）を見る。自動挿入が効かない場合は、Phase 1 の判断 P1-1 のとおり、計測用の JS スニペットをレイアウトに埋め込む作業をリポジトリで行う
  - 公式 FAQ によると、HTML に `Cache-Control: public, no-transform` が付いていると自動挿入されない。このサイトの `_headers` は HTML に `no-transform` を付けていない
- **Web Analytics** の画面で計測が始まっている。データが出るまでの時間は、プロキシしているサイトの手順には記載がない（要確認。プロキシしていないサイトの手順には「数分かかることがある」とある）
- `https://unlibra.com/sitemap-index.xml` が 200 で、Search Console などにサイトマップを登録している場合は `/sitemap-index.xml` に登録し直すか検討する

## 5. 新しいデプロイを前の版に戻す（戻せる）

ドメインは Workers のまま、サイトの中身だけを前の版に戻す手順（公式 [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)）。

1. **Workers & Pages** で Worker `unlibra-com` を選び、**Deployments** を開く
2. 戻したい版の右の「…」から **Rollback** を選ぶ

## 6. 切替のあとに残る判断（未決）

- `workers.dev` の URL は切替のあとも公開されたままになる。同じ内容が2つの URL で見えるのを避けるために無効にするかは未決。無効にする場合、ダッシュボードで無効にするだけでは次のデプロイで有効に戻るので、`wrangler.jsonc` に `"workers_dev": false` を書く（公式 workers.dev のページ）
- Vercel の3プロジェクトの削除は Phase 7 で行う
