# リリース前の最終レビューの修正の判断ログ

計画：`docs/decisions/final-review/plan.md`（1回目の指摘 1〜10）。

## FR-1 新しい文言（仮の文面）

ツールのメッセージ（`src/tools/messages/ja.ts` / `en.ts`）と `src/messages/layout.ts` に足した文言。`{max}`・`{width}`・`{height}`・`{color}` は `formatMessage`（`src/tools/messages/format.ts`）で値に置き換える。値のない置き場所があれば例外にする（「{max}」のまま画面に出ないように）。

| キー                                                      | 日本語                                             | 英語                                             |
| --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| `common.close`（トーストの閉じるボタン）                  | 閉じる                                             | Close                                            |
| `common.fileErrors.tooLarge`                              | ファイルサイズが大きすぎます（最大{max}MB）        | The file is too large (max {max}MB).             |
| `common.fileErrors.selectImage`                           | 画像ファイルを選択してください                     | Please select an image file.                     |
| `common.fileErrors.svgOnly`                               | SVGファイルのみアップロードできます                | Only SVG files can be uploaded.                  |
| `common.fileErrors.dimensionsTooLarge`                    | 画像サイズが大きすぎます（最大{width}×{height}px） | The image is too large (max {width}×{height}px). |
| `common.fileErrors.loadFailed`                            | 画像の読み込みに失敗しました                       | Failed to load the image.                        |
| `twPaletteGenerator.copyColor`（色のボタンの aria-label） | {color} をコピー                                   | Copy {color}                                     |
| `svgOptimizer.optimizedPreviewAlt`                        | 最適化後プレビュー                                 | Optimized preview                                |
| `layout.breadcrumb.label`（パンくずの aria-label）        | パンくずリスト                                     | Breadcrumb                                       |

- 日本語は、これまで固定で出ていた文言をそのまま使った。英語は新しい文面
- Favicon のプレビューの alt は、既存の `common.preview`（プレビュー / Preview）を使った
- `src/tools/lib/file.ts` の到達しない文言「サポートされていない画像形式です」は消した（型の検査はいつもエラーの文言を返していた）

## FR-2 名前を付け替えるのではなく、見えている文字を名前にした（計画からの逸脱）

計画は TogglePill の「Toggle uppercase」、プリセットの「Select preset: …」、Favicon のサイズの「Select/Deselect …」を、メッセージに足して言語に合わせて出すとしていた。これらは aria-label を外し、ボタンの見えている文字（「大文字」「推奨」「16×16」など、すでに言語に合っている）を名前にした。

- 根拠：見えている文字と名前が違うと、音声操作で押せない（WCAG 2.5.3 Label in Name）。また `aria-pressed` があるので、「Deselect」「Toggle」のように状態や操作を名前に入れると、「Deselect 16x16、押されている」と二重に読まれる。外せば、訳す文言も増えない
- `TogglePill` の `ariaLabel` は使うところがなくなったので消した（名前はいつも見えている文字）
- 他に考えたもの：計画どおり「大文字を切り替え」「16×16 を選択／選択解除」などの文言を足す
- 戻すとき：3つの部品に aria-label を戻し、文言を足し、E2E の名前を戻す

## FR-3 スライダーの名前を必須にした

- `Slider`（`src/components/ui/slider.tsx`）は、見える `label` か `ariaLabel` のどちらかを型で必須にし、既定の「値を調整」を消した。Favicon の角丸のスライダーは、上の見出しと同じ `faviconGenerator.borderRadius`（角丸の調整 / Adjust Corner Radius）を名前にした
- TW Palette の色相・明度・彩度のスライダーは `label` を必須にし、既定の「色相を調整」などを消した（どれもいつも label が渡されている）
- 根拠：既定の文言は1つの言語に固定され、名前を渡し忘れても気づけない。型で必須にすれば渡し忘れがビルドで止まる
- 戻すとき：型を optional に戻し、既定の文言をメッセージから取る

## FR-4 ドロップのオーバーレイ（指摘 2）

- dragenter と dragleave に同じ条件（ファイルのドラッグで、input の上でない）を使い、数は 0 未満にしない。あわせて、ページの中で始まったドラッグの終わり（dragend）で必ず消す
- 「input の上は数えない」は、元の dragenter の条件（`INPUT` と range）を input 全体にまとめたもの。input の子孫はないので、元と同じ範囲
- ウィンドウの外への移動は relatedTarget で判定しなかった（Chrome と Safari で値が違い、誤って消えるおそれがある）。enter と leave の数が合えば、外へ出たときに 0 になる

## FR-5 パレットの履歴の検証（指摘 6）

- `parsePaletteHistory`（`adjustments.ts`）は、計画の id・baseColor・palette の各シェードに加えて、`timestamp` が数であることも確かめる。型 `PaletteHistoryItem` の項目すべてを確かめるため（旧ツールも今のツールも必ず保存している）
- 形の合わない項目を捨てた履歴は、次の保存で localStorage にも書き戻される（今までどおり、読み込んだ履歴をそのまま保存する動き）
- 色の値が色として正しいか（`#rrggbb` か）は確かめない。文字列なら描画は落ちない（React が style に入れるだけ）

## FR-6 トーストの live region（指摘 10）

- いつもページにある live region を2つ置いた。エラーは `role="alert"`（`aria-live="assertive"`）、それ以外は `role="status"`（`aria-live="polite"`）。トーストごとに role を付けると、要素ごと入れたときに読まれないスクリーンリーダーがあるため
- そのため、エラーのトーストはほかのトーストより下にまとまって出る（以前は出た順）。両方あるときだけ間を 8px 空ける
- E2E の `toast()` が使う `div.pointer-events-none.fixed` のコンテナはそのまま

## FR-7 リンクの色（指摘 7）

- ライト：通常 #19779b（card-link、白に 5.1:1）、ホバー #135d79（7.3:1）
- ダーク：通常 #5bc5dc（logo-light、atom-one-dark に 7.0:1）、ホバー #a5e1ee（9.7:1）。ホバーは明るくする（暗い背景では暗くすると下がるため）
- ホバーの2色は新しい色。テーマの変数にはしなかった（MarkdownLayout だけで使う）

## FR-8 プライバシーポリシー（指摘 8、仮の文面）

- 「当サイトはオープンソースであり、GitHubでコードが公開されているため、誰でもデータの取り扱いを確認できます。」を「当サイトのソースコードはGitHubで公開されているため、誰でもデータの取り扱いを確認できます。」にした
- 見出し「プライバシーポリシー」を h1 に、最終更新日を 2026年10月23日 にした

## FR-9 対象外にしたもの

- `src/tools/svg-optimizer/svgo.ts` の throw の文言「SVGの最適化に失敗しました」：画面には出ない（呼び出し側は `svgOptimizer.errors.optimizeFailed` を出し、例外はコンソールにだけ出る）ので、計画どおり対象外。`tests/svg-optimizer.test.js` がこの文言を確かめている
- TW Palette の Tailwind 設定のコピーの失敗は、色のコピーと同じ `colorCodeCopyFailed` を出す（元のコードと同じ）。英語は「Failed to copy color code.」で、設定のコピーには少し合わない。新しい文言は足していない

## FR-10 仕様が変わって合わせた既存テスト

- `tests/tools.test.js`「E3: tool pages have WebApplication and BreadcrumbList structured data」：パンくずの aria-label を言語ごとの文言にした
- `tests/portfolio.test.js`「ui-revise2 (parent): the privacy policy names the site and its update date」：最終更新日を 2026年10月23日 にした
- `tests/e2e/favicon-generator.spec.js`：出力形式とサイズのボタンを見えている文字で探す（「16x16」→「16×16」）。プレビューの alt、角丸のスライダーの名前、検証のエラーの文言を、その言語のメッセージから取る
- `tests/e2e/password-generator.spec.js`：文字種のボタンを見えている文字（`m.uppercase` など）で探す
- `tests/e2e/svg-optimizer.spec.js`：プリセットのボタンを見えている文字で、プレビューの alt と「SVGファイルのみ」の文言をメッセージから取る
- `tests/e2e/tw-palette-generator.spec.js`：色のボタンの名前を `copyColor` の文面から作り、色のコードを名前から正規表現で取り出す（英語は「Copy BASE #…」で、空白で区切った2つ目が色ではなくなった）

## FR-11 2回目のレビューの指摘（親が直接修正）

- Tailwind 設定のコピーに失敗したときの文言を、色のコピーの失敗の文言から専用の `configCopyFailed` に替えた（ja「Tailwind設定のコピーに失敗しました」、en「Failed to copy Tailwind config.」、仮の文面）。`tw-palette-generator.spec.js`「final-review 5」の期待値も合わせた
- `src/config/site.ts` の BOOTH のリンクの注記「provisional」を、本番のショップであること（設計書 3.6）に直した
- FR-2 の逸脱（TogglePill などの aria-label を外し、見えている文字を名前にした）は親が認めた（WCAG 2.5.3）
- 3回目のレビュー（この修正の差分）で指摘はなかった
