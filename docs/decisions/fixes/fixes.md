# 追加作業の判断ログ（fixes）

## FX-1 SVG 最適化：オフにしたスイッチのプラグインを動かさない（T-18 の修正）と、範囲の広げ方

- 決めたこと：
  - T-18 の9つ（`removeViewBox`、`convertStyleToAttrs`、`cleanupListOfValues`、`removeTitle`、`removeDesc`、`removeDimensions`、`removeRasterImages`、`removeScripts`、`removeStyleElement`）は、オフのとき `plugins` に入れない
  - 計画に挙がっていないが、同じ不具合を持つスイッチも直した
    - `cleanupNumericValues` と `convertTransform`：`preset-default` の `overrides` に精度の値を常に渡していたので、スイッチをオフにしても動いていた。オフのときは `false` を渡す
    - `removeDesc`：`preset-default` にも含まれていて（svgo 4）、オフでもそちらで動いていた（空の `<desc>` と、`Created with` / `Created using` で始まる `<desc>` を消す）。オフのときは `overrides` でも `false` にする
- 根拠：計画の「スイッチで無効にしたプラグインが実際に実行されないようにする」。画面のスイッチ（`svgo-options.ts`）にある項目で、オフにしても動くものを残すと同じ不具合が残る
- 利用者から見える変化：「おすすめ」プリセット（`removeDesc: false`）では、エディターが入れた `Created with ...` の `<desc>` も残るようになる。精度のスイッチをオフにすると数値の丸めが止まる
- 他の選択肢：計画に挙がった9つだけ直す。`removeDesc` は `preset-default` 側は動かしたままにする（オフでもエディターの `<desc>` は消える）
- 戻すときの作業：`buildSvgoConfig` の `overrides` の3行を元に戻し、テストの該当箇所を消す
- 見つけたが直していないこと：`removeDesc` をオンにしても、既定の引数（`removeAny: false`）のままなので、空でもエディターのものでもない `<desc>` は消えない（「SVGO 既定」「最大圧縮」でも `editor.svg` の `<desc>` が残る）。プリセットのコメント（`SVGO removes by default`）と食い違うが、「オフが効かない」不具合ではないので触っていない。直すなら `removeAny: true` を渡すかを決める必要がある（利用者から見える挙動）

## FX-2 `tests/fixtures/svg-optimizer/expected.json` の作り直し

- 決めたこと：修正後のコード（svgo 4.1.0）で同じ8ケース（2つの SVG × 4つの設定）を出力し直して保存した。テストの見出しとコメントも、liblab の出力と一致を見るものから、期待する出力と一致を見るものに改めた。作り直しに使ったスクリプトはリポジトリに入れていない（テストの `cases` と同じ設定で `optimizeSvg` を呼び、`JSON.stringify(out, null, 2)` で書き出しただけ）
- 理由：T-18 を直すと出力が変わるため（計画の H2）
- liblab の出力と変わる点：
  - `editor.svg`「おすすめ」：`<title>`、`width`・`height`（`120.000mm` は svgo が px の `453.543` に直す）、`<image>`（と、それが使う `xmlns:xlink`）が残る
  - `editor.svg`「SVGO 既定」：`width`・`height`、`<image>` が残る（`removeDimensions`・`removeRasterImages` がオフ）
  - `editor.svg` の独自設定（`keepScripts`・`keepStyleElement` オン）：`<script>` が残る。`<script>` があると svgo は ID の整理と使っていない定義の削除を控えるので、`id`（`svg8`、`grad` など）と使っていないグラデーションも残る。`<style>` は `preset-default` の `inlineStyles` が属性に移してから消すので、この入力では残らない（移せない `@media` を含む `<style>` が残ることは、別のテストで確かめた）。`<image>`、`width`・`height` も残る
  - `icon.svg`「おすすめ」：`<title>`、`width`・`height` が残り、`viewBox` の位置が入力のままになる（前は `removeViewBox` が `viewBox` を消し、続く `removeDimensions` が `width`・`height` から `viewBox` を作り直して末尾に足していた。スイッチを1つずつオンにした出力で確かめた）
  - `icon.svg`「SVGO 既定」：`width`・`height` が残り、`viewBox` が消える（`removeDimensions` がオフで、`removeViewBox` がオン。svgo の `removeViewBox` は `width`・`height` と同じ大きさの `viewBox` を消す）
  - `icon.svg` の独自設定：`width`・`height` が残る
  - 「最大圧縮」は2つとも変わらない（すべてのスイッチがオンのため）
- 他の選択肢：作り直しのスクリプトを `scripts/` に置く（期待値の出どころが追える代わりに、テストの対象のコードで期待値を作る形がはっきり残る）
- 戻すときの作業：`expected.json` を前のコミットのものに戻す（FX-1 も戻す場合）
