# Phase 5 判断ログ（license）

## LI-1 `LICENSE` と README の文面は仮のもの

- 決めたこと：`LICENSE` と `README.md` の文面は、ユーザーに見せて確認してもらう前提の仮のものとして書いた。とくに `LICENSE` の「閲覧はできるが、許可なく複製・改変・再配布・その他の利用はできない」の言い回し、各節の構成、第三者の素材の書き方は、確認で変わりうる
- 根拠：ライセンスの文面は利用者から見える挙動で、後から変えにくい（一度公開した許諾は取り消せない）
- 他の選択肢：なし（確認を経ずに確定させない）
- 戻すときの作業：確認の結果に合わせて文面を直す。テスト（`tests/license.test.js`）は節の番号（`1.`〜`4.`）、`  - パス` の列挙の形、`The full text is in LICENSES/...` の行を読んでいるので、構成を変えるときはテストも合わせる

## LI-2 全体の著作権表示に年（2025）を入れる

- 決めたこと：`LICENSE` の1行目は `Copyright (c) 2025 unlibra. All rights reserved.` とした
- 根拠：設計書 3.7 は `Copyright (c) unlibra. All rights reserved.`（年なし）だが、Phase 5 の計画は年ありの文面を指定している。フッターの「© 2025 unlibra」、`LICENSES/MIT.txt` の `Copyright (c) 2025 unlibra` とも揃う
- 他の選択肢：設計書どおり年なし
- 戻すときの作業：1行目から年を消し、テストの期待値を直す

## LI-3 旧版で MIT として公開済みの分について（文面は足していない。親の判断が要る）

- 決めたこと：`LICENSE` には、旧版の MIT について何も書いていない
- 調べたこと：
  - `LICENSE` は `ec8784c`（2025-11-29、Initial commit）で `Copyright (c) 2025 unlibra` の MIT として作られ、翌日の `a83cad7` で著作権者の欄が `[Your Name]`（テンプレートのまま）に変わった。`origin/main` の `LICENSE` も `[Your Name]` の MIT のまま
  - つまり、これまで GitHub で公開されたリポジトリの中身（当時の X オマージュのサイトのコード）は、MIT で配布された状態にある
- 考え：
  - MIT の許諾は取り消せないので、旧版のコミットを MIT として受け取った人は、その版を MIT で使い続けられる。新しい `LICENSE` はこのコミット以降の版にだけ効く。何も書かなくても法的な扱いは変わらない
  - 書く場合の案：`LICENSE` の末尾に「このリポジトリの以前の版（コミット `<hash>` まで）は MIT License で公開されていた。その版の許諾はそのまま有効」と一文入れる。読み手の誤解（旧版も All rights reserved になったと思う、あるいは今の版も MIT だと思う）を防げる
  - 書かない場合の利点：文面が短く、旧版の X オマージュのコードに読み手の注意を向けない
  - `[Your Name]` のまま公開されていた点は、著作権者の名前が欠けているだけで、許諾そのものは成立していると考えられる（要確認。法的な判断はしていない）
- 親に判断してほしいこと：一文入れるか、入れるなら境目をどのコミット（`main` に入るマージコミットなど）で示すか。ユーザーに確認する事項と考える
- 戻すときの作業：入れる場合は `LICENSE` に一文足す

## LI-4 DiceBear の素材（CC0 1.0）を第三者の素材として載せる（P5-1 の前提と食い違う。親の判断が要る）

- 見つけたこと：
  - `src/assets/tools/` の4つのツールのアイコンは、SVG の中に RDF のメタデータを持っており、DiceBear の "Shapes" スタイルで生成したもの（`dc:creator` が DiceBear、`dcterms:license` が CC0 1.0）だった
  - `src/components/Avatar.astro`（トップページのプロフィール画像）は、`05b80c3` で `public/icon.svg` として入った DiceBear の "Thumbs"（CC0 1.0、同じくメタデータで確認）と同じ図形で、`30d3ab8` で Astro コンポーネントにしたときにメタデータが落ちていた
- 決めたこと：計画の「ほかに第三者のコードがあれば同じ形で載せる」に従い、上の5ファイルを `LICENSE` の第2節に DiceBear（CC0 1.0）として列挙し、`LICENSES/CC0-1.0.txt` に CC0 1.0 の legal code を置いた。`Avatar.astro` の先頭に出典のコメントを足した
- P5-1 との関係：P5-1 は、ツールのアイコンを「liblab から持ってきたもの」として All rights reserved 側に置くと決めている。アイコンが DiceBear の CC0 の生成物なので、unlibra が All rights reserved を主張できる素材ではない可能性が高い。MIT に入れたわけではないので、P5-1 の懸念（MIT で公開すると戻せない）には触れていない。ただし「All rights reserved のまま」とは文面が違う
- 根拠：CC0 の素材に All rights reserved と書くと、権利のないものに権利を主張する表示になる。CC0 は出典の表示を求めないが、出典を書いておけば読み手が扱いを判断できる
- 他の選択肢：
  - P5-1 の文面どおり、ツールのアイコンには何も書かない（全体の All rights reserved に含まれる）
  - アイコンとアバターを自作のものに差し替える（設計の変更になる）
- 親に判断してほしいこと：この扱いでよいか。P5-1 でユーザーに確認する予定の「ツールのアイコンを MIT にするか」は、この事実を添えて聞き直す必要があると考える
- 戻すときの作業：`LICENSE` の DiceBear の段落と `LICENSES/CC0-1.0.txt` を消し、`tests/license.test.js` の期待するライセンスファイルの一覧から外す。出典の検査（漏れなく列挙されていること）が SVG のメタデータを拾うので、P5-1 の文面どおりにするなら、検査の対象からツールのアイコンを外す理由をテストに書く

## LI-5 他の作者の素材が写った BOOTH 商品画像の置き場所

- 決めたこと：`src/assets/works/third-party/` に置くことにし、`LICENSE` の第3節に「このディレクトリの画像はどのライセンスの対象にもならない」と書いた。ディレクトリはまだ作っていない（ダミー画像しかないため）
- 根拠：画像ごとに「他の作者の素材が写っているか」を読み手に判断させる書き方より、ディレクトリで分けるほうが範囲がはっきりする（P4-1 の MIT のディレクトリと同じ考え方）
- 他の選択肢：BOOTH の商品画像をすべて `src/assets/works/booth/` に置き、その中で他の作者の素材が写っているものを対象外とする
- 戻すときの作業：`LICENSE` の第3節のパスと、テストの期待値を直す

## LI-6 他のサービスのロゴは商標として対象外と書く

- 決めたこと：`LICENSE` の第3節に「GitHub のマーク（`src/components/icons/GitHubIcon.astro`）など、他のサービスのロゴは各社の商標で、この LICENSE の対象ではない」と書いた
- 根拠：GitHub のマークは L-12 のとおり GitHub のロゴのパスで、全体の All rights reserved に含めると unlibra のものとして扱う表示になる。計画の第三者の欄は「ライセンスの全文を `LICENSES/` に置く」形で、ライセンスで配布されていないロゴはその形に乗らない
- 未確認：`src/components/SponsorButton.astro` の SVG は、リンク先から見て ofuse のロゴと思われるが、確かめていない。文面は「such as」で個別に挙げていない
- 他の選択肢：ロゴについては何も書かない
- 戻すときの作業：第3節の段落を消す

## LI-7 All rights reserved の文面に GitHub の利用規約の例外を入れる

- 決めたこと：「閲覧以外は許可しない」の文に「GitHub の利用規約が公開リポジトリについて認める範囲を除く」と添えた
- 根拠：公開リポジトリでは、GitHub の利用規約により他の利用者が閲覧とフォークをできる。これを除かないと、`LICENSE` の文面と実際の扱いが食い違う。All rights reserved のリポジトリでよく使われる書き方
- 他の選択肢：例外を書かない
- 戻すときの作業：その句を消す

## LI-8 ライセンスの全文の出どころと、テストでの確かめ方

- 決めたこと：
  - `LICENSES/Heroicons-MIT.txt` は `node_modules/@heroicons/react/LICENSE`（v2.2.0）から、`LICENSES/tailwindcss-MIT.txt` は `node_modules/tailwindcss/LICENSE`（v4.3.3）から写した。色の値の出どころは 3.4.18 だが、手元に 3.4.18 はない。v4.3.3 の `LICENSE` は Heroicons と1字も違わず、3.4.18 も同じ文面と考えているが未確認
  - `LICENSES/CC0-1.0.txt` は `node_modules/@speed-highlight/core/LICENSE` から写した。もう1つの写し（`prettier-plugin-tailwindcss` 同梱）と本文が一致すること、文字数が 7048 バイトで、SHA-256（`a2010f34…0499`）が CC0 1.0 の `legalcode.txt` の値として記憶しているものと一致することを確かめた（creativecommons.org の原本との照合はしていない）
  - テストでは、MIT の原文をテストの中に定数で持ち、3つの MIT のファイルの本文（著作権表示の行を除く）と比べる。Heroicons と tailwindcss は、さらに依存パッケージの `LICENSE` と完全に一致することを確かめる。CC0 は SHA-256 で比べる（`@speed-highlight/core` は間接依存で、なくなるとテストが壊れるため）
- 根拠：ライセンスの全文は1字でも違うと意味がない。手で打たずに、配布物から写す
- 他の選択肢：creativecommons.org から legal code を取得する（ダウンロードになるので、手元の写しで済ませた）
- 戻すときの作業：なし

## LI-9 MIT のディレクトリ内の第三者の素材

- 決めたこと：`src/components/ui/Breadcrumb.astro`（区切りの矢印が Heroicons）と `src/tools/tw-palette-generator/tailwind-colors.ts`（色の値が tailwindcss）は MIT のディレクトリの中にあるが、第2節にも列挙した。第1節に「このディレクトリ内の第三者の素材は、その作者のライセンスのまま」、第2節に「同じファイルの他の部分は、この LICENSE の残りに従う」と書いた
- 根拠：どちらも MIT なので実害はないが、著作権者が違う。unlibra の MIT の範囲に入れて書くと、Tailwind Labs の著作権表示が落ちる
- 他の選択肢：MIT のディレクトリの中は第2節に書かない
- 戻すときの作業：第2節から2ファイルを外し、出典の検査の対象から MIT のディレクトリを外す

## LI-10 `package-lock.json` の更新

- 決めたこと：`package.json` に `license` を足したのに合わせて、`npm install --package-lock-only --offline` で `package-lock.json` のルートの `license` を更新した（1行の追加のみ）
- 根拠：`npm ci` は `package.json` と lock の食い違いを見ないが、次に誰かが `npm install` したときに差分が出るのを避ける。計画の「触ってよい範囲」には `package-lock.json` が書かれていないが、Phase 1 の計画で `package.json` と組で扱うことになっている
- 他の選択肢：lock は触らない
- 戻すときの作業：その1行を消す
