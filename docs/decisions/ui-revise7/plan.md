# UI の見直し（7回目、ユーザーの指示、2026-10-23）

## 参照する文書

- 設計書とフェーズ計画：`docs/replace-plan.md`（ライセンスの境界、第三者の素材の扱い）
- 前回までの計画と判断ログ：`docs/decisions/ui-revise*/`
- フォントサイズのガイドライン：デジタル庁デザインシステム（DADS）のタイポグラフィ https://design.digital.go.jp/dads/foundations/typography/ （v2.18.2 で確認）

## ユーザーの指示と親の解釈

1. **ムルルの画像の差し替えを取り込む。** 作業ツリーの `src/assets/works/third-party/mururu-blink-lipsync.webp`（1200×900）はユーザーが差し替えたもの。規約は確認済みで、画像の中のクレジットは不要（ユーザー確認済み）。この画像をコミットし、テストの期待する寸法を合わせる
2. **画像の切り抜きを、すべて中央で合わせる。** `Work.imagePosition`（`"top"`）と `cards.ts` の `photoPosition` をやめ、すべての写真を `object-center` にする（ui-revise3 で入れた仕組みを外す。ほかに上や下を基準に切り抜いている画像があれば同じく中央にする）
3. **等幅フォントを Geist Mono にする**（Roboto Mono を置き換える）。`@fontsource/geist-mono`（なければ親に返す）。使っている太さだけ読み込む。LICENSE 第4節、`LICENSES/`、クレジットのページのフォントの一覧、`/third-party-licenses.txt` を合わせる。Roboto Mono の依存は消す
4. **ヒーローの GitHub と BOOTH のリンクの文字を 16px にする**（今は `text-sm`）。アイコンの大きさは文字に合わせて調整してよい（崩れないこと）
5. **トップページ以外のページのフォントサイズを DADS に合わせる**（ユーザーの指示で、確認なしで変えてよい）。対象：ツールのページ（`/lab/*` と英語版）、`/credits`、`/privacy`、404。
   - 本文・UI の文字は 16px 以上を基準にする。14px は補足の文字（注記、短いラベル、等幅のコードの値）に限る。14px 未満（`text-xs` など）は使わない
   - 読ませる本文（プライバシーポリシー、クレジットの説明など）は行の高さ 1.7（DADS の Std-16N-170）。見出しは DADS の Std の行の高さ（20〜32px は 1.5、36px は 1.4）
   - 等幅は 14〜16px、行の高さ 1.5（DADS の Mono）
   - **対象外：** ヘッダー、フッター、トップページ、作品の詳細のダイアログ。これらはトップページに出るので、ユーザーの承認を待つ（親が別に案を出している）。`src/components/ui/` など共有の部品をトップページでも使っているときは、トップページの見た目が変わらないようにする
   - 変えた箇所を、判断ログに一覧（場所、前、後）で書く

## 受け入れ条件

- R1：build、lint、format:check、`npm test`、`npm run test:e2e` が通る。仕様が変わった既存テストは合わせ、判断ログに一覧で書く。それ以外は弱めない
- R2：1〜5 を確かめるテストがある（画像の寸法、`object-top` がどこにもないこと、等幅のフォントが Geist Mono であること、ヒーローのリンクが 16px、対象のページに 14px 未満の文字がないこと など）
- R3：ライトとダーク、幅 375px と 1280px で崩れない（特にツールのページ。TW Palette の回転したラベルなど）
- R4：トップページ、ヘッダー、フッター、ダイアログのフォントサイズは、4 のヒーローのリンク以外変わらない

## 進め方

- スコープは1つ（`ui-revise7`）、ブランチ `feat/site-replacement` で直列に進める。モデルは標準、推論レベルは親と同じ
- ブロックごとに全体のテストを回す（`npm test` と `npm run test:e2e`）。出力は失敗と要約だけ読む
- Node は PATH に `C:\Users\User\AppData\Roaming\fnm\node-versions\v24.22.0\installation` を足す。PowerShell 5.1 の Get-Content / Set-Content で日本語のファイルを書かない
- ポート 8790 は親のプレビューサーバー。止めない
- 判断ログ：`docs/decisions/ui-revise7/ui-revise7.md`
- workers.dev へのデプロイはしない。push はしない（親がする）
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない
