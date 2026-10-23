# リリース前の最終レビューの修正（2026-10-23、ユーザーの指示）

ユーザーの指示：全コードをレビューし、影響度の大きいものと、修正コストが小さく影響範囲が狭いものを直す。指摘が出なくなるまで繰り返す。

## 参照する文書

- 設計書：`docs/replace-plan.md`（ライセンスの境界：`src/tools/**` と `src/components/ui/**` は MIT 側で、All rights reserved 側を import しない）
- 文字の大きさと行の高さの規則：`docs/decisions/ui-revise7/plan.md` の 6

## 1回目の指摘（すべて直す）

1. **`src/tools/lib/image.ts` の SVG の width/height の除去が `stroke-width` を壊す。** 正規表現に左の境界がなく、ルートの `<svg>` の `stroke-width="2"` から `width="2"` を消して `stroke-` が残り、XML が壊れて読み込みに失敗する（Tabler などのアイコンの SVG で必ず起きる）。属性名の前が空白であることを条件にする（または DOMParser で属性を設定して直列化する）。`stroke-width` などを持つ SVG が読み込めることを単体テストで確かめる
2. **`src/components/ui/full-page-drop-zone.tsx` のドラッグの数え方が合わない。** dragenter はファイル以外のドラッグと input の上を数えないのに、dragleave は常に減らすので、数が負になりオーバーレイが消えなくなる。enter と leave で同じ条件を使い、0 未満にならないようにする（またはドラッグの終わり・ウィンドウの外への移動で必ず消す）。テキストのドラッグや input の上を通ったあとでも、ファイルのドラッグを取り消せばオーバーレイが消えることを E2E で確かめる
3. **`src/tools/favicon-generator/favicon-generator.tsx` のプレビューの更新に取り消しがない。** 古い processImage が新しいものより後に終わると古いプレビューが残り、その object URL が解放されない。SVG Optimizer と同じく `cancelled` の旗を使い、取り消された結果は捨てて URL を解放する
4. **英語のツールのページに日本語が出る（と、日本語のページに英語の aria-label が出る）。** `src/tools/lib/file.ts` の検証のメッセージ、トーストの閉じるボタン「閉じる」、プレビューの alt（「プレビュー」「最適化後プレビュー」）、スライダーの既定の aria-label（「値を調整」「色相を調整」など）、パレットの「〜をコピー」、TogglePill の「Toggle uppercase」、プリセットの「Select preset: …」、Favicon のサイズの「Select/Deselect …」、パンくずの `aria-label="Breadcrumb"`、`svgo.ts` の throw の文言（画面には出ないなら対象外でよい）。ツールのメッセージ（`src/tools/messages/ja.ts` と `en.ts`、型で同じ形）に足して、言語に合わせて出す。パンくずの aria-label は `src/messages/layout.ts` に足す。MIT 側から All rights reserved 側を import しない。日英で正しい文言が出ることをテストで確かめる。新しい英語・日本語の文言は判断ログに一覧で書く（仮の文面）
5. **`tw-palette-generator.tsx` の handleCopyAsTailwind が clipboard.writeText を待たない。** 失敗しても成功のトーストが出る。await して失敗時はエラーのトーストを出す（色のコピーと同じ形）
6. **`tw-palette-generator.tsx` のパレットの履歴を検証せずに読む。** 形の合わない項目があると描画で落ち、ツールが消える。読み込み時に形（id、baseColor、palette の各シェードが文字列）を確かめ、合わない項目は捨てる。純粋な関数にして単体テストで確かめる（`adjustments.ts` など React のないファイル）
7. **`src/layouts/MarkdownLayout.astro` のリンクの色がコントラスト不足。** ライトの #3ba0be は白に対して約 3.0:1、ダークのホバー #1a7ba0 は約 3.0:1。ライトは `card-link`（#19779b）系、ダークは `logo-light`（#5bc5dc）系など、4.5:1 以上の色にする（ホバーも）。既存のコントラストのテストがあればそれに足す
8. **`src/pages/privacy.md`：「当サイトはオープンソースであり」は事実と違う**（サイトは All rights reserved。ツールと UI 部品だけ MIT）。「ソースコードは GitHub で公開されているため、誰でもデータの取り扱いを確認できます」など、事実に合う文にする（仮の文面として判断ログに書く）。あわせて見出しの「## プライバシーポリシー」を h1（`#`）にする。最終更新日を 2026年10月23日 にする
9. **TW Palette のグレースケールの色のボタンにフォーカスの表示がない。** 有彩色のボタンと同じ `focus-visible:scale-110` を付ける
10. **トーストがスクリーンリーダーに読まれない。** コンテナに live region（`role="status"` と `aria-live="polite"`、エラーは `role="alert"` など）を付ける

## 受け入れ条件

- build、lint、format:check、`npm test`、`npm run test:e2e` が通る。仕様が変わった既存テストは合わせ、判断ログに一覧で書く。それ以外は弱めない
- 1〜10 のそれぞれを確かめるテストがある（見た目だけのもの、9 と 7 はクラスや計算したコントラストで確かめてよい）
- ライトとダーク、幅 375px と 1280px で崩れない

## 進め方

- スコープは1つ（`final-review`）、ブランチ `feat/site-replacement` で直列。モデルは標準
- Node は PATH に `C:\Users\User\AppData\Roaming\fnm\node-versions\v24.22.0\installation` を足す。PowerShell 5.1 の Get-Content / Set-Content で日本語のファイルを書かない
- ポート 8790 は使わない
- 判断ログ：`docs/decisions/final-review/final-review.md`
- workers.dev へのデプロイ、push はしない（親がする）
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない
