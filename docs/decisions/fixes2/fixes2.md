# 追加作業の判断ログ（fixes2）

計画：`fixes2/plan.md`。A〜I はユーザーが判断済み。ここには、その実装で人が別の選択をしたかもしれない判断を書く。

## F2-1 SVG Optimizer：「小数点以下の桁数」を渡すプラグインの範囲（B）

- 決めたこと：`floatPrecision` を、`cleanupNumericValues` に加えて、`convertPathData`・`cleanupListOfValues`（`x`・`y`・`points`・`viewBox` など）と、パスデータを書き出す `mergePaths`（つないだパス）・`convertShapeToPath`（図形から作ったパス）にも、プラグインごとの引数で渡す。それぞれのスイッチがオフのときは今までどおり渡さない（オフのまま）
- 根拠：`mergePaths` は既定の3桁でパスを書き直すので、`convertPathData` だけに渡すと、つないだパスが3桁に戻る（`mergePaths` に渡さない設定で `floatPrecision` 5 の出力が3桁になることを確かめた）。`convertShapeToPath` は、渡さないと丸めずにパスを書く。`convertPathData` がオンなら後で丸め直されるので出力は同じだが、`convertPathData` だけをオフにしたとき、図形から作ったパスが丸められずに残る（`1.123456` のまま）。渡すと、そのときも指定の桁になる（利用者から見える変化はこの組み合わせのときだけ）。svgo の設定全体の `floatPrecision`（全プラグインに効く）は、`convertTransform` の `floatPrecision`（今は `transformPrecision` を渡している）まで上書きするので使わなかった
- 他の選択肢：svgo の設定全体の `floatPrecision` を使い、`convertTransform` だけ後から上書きする。`convertPathData`・`cleanupListOfValues` の2つだけに渡す
- 戻すときの作業：`buildSvgoConfig` の該当の4か所を元に戻し、`expected.json` を前のコミットのものに戻す

## F2-2 SVG Optimizer：「変形の精度」を角度に効かせる方法（D）

- 決めたこと：`convertTransform` の `degPrecision` に `transformPrecision` と同じ値を渡す。`rotate` と `skewX`・`skewY` の角度が対象になる。svgo は `degPrecision` が 1 未満のとき角度を整数に丸めるので、0 のときは整数になる（`translate` と同じ）
- 根拠：計画の D。svgo が既定で角度を抑える式（`floatPrecision` と行列の桁数 - 2 の小さいほう）は、画面のスライダーの説明と合わない
- 他の選択肢：角度用のスライダーを別に足す（画面が変わる）
- 戻すときの作業：`degPrecision` の1行を消し、`expected.json` を前のコミットのものに戻す

## F2-3 SVG Optimizer：SVG 2 の `href` の画像を消すプラグイン（C）

- 決めたこと：svgo の `removeRasterImages`（`xlink:href` を見る）はそのまま残し、同じスイッチで、`href` を同じ正規表現（`/(\.|image\/)(jpe?g|png|gif)/`）で見る自前のプラグイン `removeRasterImagesHref` を後ろに足す。`svgo.ts` の中に置いた
- 根拠：svgo のプラグインと同じ判定にそろえると、`xlink:href` と `href` のどちらで書いても同じ画像が消える。svgo のプラグインを残すので、svgo の更新で `href` に対応しても二重に消すだけで害はない
- 他の選択肢：svgo のプラグインを自前の1つで置き換える（`xlink:href` と `href` の両方を見る）。正規表現をデータURLの MIME 型や拡張子の末尾に限るよう厳しくする（svgo と判定がずれる）
- 戻すときの作業：`removeRasterImagesHref` とその行を消す

## F2-4 `tests/fixtures/svg-optimizer/expected.json` の作り直し（J3）

- 決めたこと：修正後のコードで、同じ8ケース（2つの SVG × 4つの設定）を出力し直して保存した（FX-2 と同じ手順。スクリプトはリポジトリに入れていない）。テストの先頭のコメントに、作り直した理由を足した
- 変わった点（`icon.svg` は4つとも変わらない）：
  - `editor.svg`「おすすめ」：楕円の `rotate(45.123 100 60)` が `rotate(45.12346 100 60)` になる（D。`transformPrecision` が 5）
  - `editor.svg`「標準圧縮」：`<desc>A drawing used to test the optimizer.</desc>` が消える（A）。`rotate` は「おすすめ」と同じ（D）
  - `editor.svg`「最大圧縮」：`<desc>` が消える（A）。パスの座標が1桁になる（B。例：`M10.123 50.988h20.433V70.11Z` が `M10.1 51h20.5v19Z`）
  - `editor.svg` の独自設定（`floatPrecision` 0）：パスの座標が整数になる（B。例：`M90.5 10.25h20.25l-10.625 19.813z` が `M91 10h20l-11 20z`）
- 戻すときの作業：`expected.json` を前のコミットのものに戻す（A・B・D も戻す場合）

## F2-5 「標準圧縮」プリセットのコメント（H）

- 決めたこと：`svgo-presets.ts` の「SVGO's actual default preset」「SVGO removes by default」を消し、「標準圧縮」（ID `svgo-default` は前のツールから引き継いだもの）で、svgo 4 の `preset-default` とは違う（`<title>`・`viewBox`・ふつうの `<desc>` を残し、属性を並べ替える）と書いた。ID と画面の名前、中身は変えていない。仕様のテストのコメントも同じ内容に直した。テスト名はもともと「standard preset」で、「SVGO default」と呼ぶものはなかった
- 根拠：計画の H
- 戻すときの作業：コメントを戻す
