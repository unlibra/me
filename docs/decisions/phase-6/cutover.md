# Phase 6 判断ログ（cutover）

## C-1 末尾スラッシュ付きの旧URLを、個別の行とプレースホルダーの行で扱う

- 決めたこと：設計書 3.2 の表の行に加えて、`/ja/`、`/en/`、`/lab/ja/`、`/lab/en/` の静的な行と、`/lab/ja/:tool/` → `/lab/:tool`、`/lab/en/:tool/` → `/en/lab/:tool` の行を `_redirects` に書く
- 根拠：`wrangler dev` で確かめたところ、`_redirects` の照合は末尾スラッシュを区別する。表の行だけだと、`/ja/` は 404、`/lab/ja/` は `/lab/` へ 301 のあと `/lab` へ 307、`/lab/ja/svg-optimizer/` は `/lab/svg-optimizer/` へ 301 のあと 307 の2回の転送になった。足した行で、どれも 301 の1回で新URLに届く
- 他の選択肢：末尾スラッシュ付きは扱わない（`/ja/` が 404 になる）。2回の転送を受け入れる
- 戻すときの作業：`_redirects` から6行を消し、テストの該当ケースを消す

## C-2 テストは `_redirects` の照合を自前で模して確かめる

- 決めたこと：`tests/redirects.test.js` に、静的な行を先に、動的な行をファイルの順に照合し、最初に一致した行を使う、`*` は貪欲、`:name` はスラッシュを含まない、末尾スラッシュは区別する、という照合を書き、旧URLの行き先と、新サイトのページを潰していないことを確かめる
- 根拠：公式ドキュメント（Static Assets の Redirects）の記述と、`wrangler dev` で観察した挙動（C-1、G3）に合わせた。Workers の実装を Node のテストから呼ぶ方法がない
- 他の選択肢：`wrangler dev` を起動して HTTP で確かめるテスト（プロセスの起動と後始末が要り、`npm test` が重くなる）
- 戻すときの作業：テストファイルの照合の部分を消す

## C-3 手順書では、ドメインの付け替えを Custom Domain で書く

- 決めたこと：`docs/deploy.md` の付け替えは、公式の Custom Domains の手順（既存の DNS レコードを消してから Custom Domain を足す）で書いた。Routes（既存の DNS レコードを残して Worker のルートを足す）は書いていない
- 根拠：公式の Routes のページが、Worker が配信元のときは Custom Domains を使うよう書いている。Custom Domain は既存の CNAME があると作れないと書かれている
- 注意：DNS レコードを消してから Custom Domain を足すまでの間、サイトにつながらない。Routes なら DNS レコードを残せるが、静的配信だけの Worker を Routes で出したときの挙動は公式で確かめていない
- 他の選択肢：Routes で付け替える
- 戻すときの作業：手順書の3章を書き換える

## G3 手動確認の結果（`wrangler dev`、2026-10-21）

`npm run build` のあと `npx wrangler dev --port 8787` で、`curl` でステータスと `Location` を記録した。終わったあと、起動した node.exe、workerd.exe、esbuild.exe を終了させた。

| 旧URL                        | ステータス | 行き先                      | 行き先のステータス |
| ---------------------------- | ---------- | --------------------------- | ------------------ |
| `/ja`                        | 301        | `/`                         | 200                |
| `/en`                        | 301        | `/`                         | 200                |
| `/ja/`                       | 301        | `/`                         | 200                |
| `/en/`                       | 301        | `/`                         | 200                |
| `/lab/ja`                    | 301        | `/lab`                      | 200                |
| `/lab/ja/`                   | 301        | `/lab`                      | 200                |
| `/lab/en`                    | 301        | `/en/lab`                   | 200                |
| `/lab/en/`                   | 301        | `/en/lab`                   | 200                |
| `/lab/ja/svg-optimizer`      | 301        | `/lab/svg-optimizer`        | 200                |
| `/lab/ja/svg-optimizer/`     | 301        | `/lab/svg-optimizer`        | 200                |
| `/lab/en/favicon-generator`  | 301        | `/en/lab/favicon-generator` | 200                |
| `/lab/en/favicon-generator/` | 301        | `/en/lab/favicon-generator` | 200                |
| `/lab/en/iromide`            | 301        | `/en/lab/iromide`           | 404                |
| `/sitemap.xml`               | 301        | `/sitemap-index.xml`        | 200                |

ほかに観察したこと：

- クエリ文字列は引き継がれる（`/lab/ja/svg-optimizer?x=1` → `/lab/svg-optimizer?x=1`、`/ja?x=1` → `/?x=1`）
- `Location` は相対パス（例：`Location: /lab/svg-optimizer`）
- 新サイトのページ（`/`、`/privacy`、`/lab`、`/en/lab`、`/lab/svg-optimizer`、`/en/lab/svg-optimizer`）は 200 のまま。`/privacy/`、`/lab/` は `html_handling` の 307 で末尾スラッシュなしへ（P1-6 のとおり）
- 大文字の `/JA` は 404（照合は大文字小文字を区別する）
- 301 のレスポンスにも `_headers` の `/*` のセキュリティヘッダーが付いていた
