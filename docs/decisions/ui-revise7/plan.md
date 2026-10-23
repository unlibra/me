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

## 追加の指示（2026-10-23、ユーザー承認済み）

5 の行の高さと 4 の対象外を、次のとおり改める。ブロック2で 6・7、ブロック3で 8・9 を進める。

6. **行の高さの規則（サイト全体）：** 行の高さは「その文字の役割に当たる DADS の倍率 × 文字の大きさ」以上で、最も小さい4の倍数にする。例：16px の本文は 1.7 → 28px、24px の見出しは 1.5 → 36px、28px は 1.5 → 44px、36px は 1.4 → 52px、20px は 1.5 → 32px、等幅 16px は 1.5 → 24px。14px の補足の文字は、1行のラベルなら DADS の Dense（1.3 → 20px）、複数行なら 1.7（→ 24px）。**例外：カードの見出し（18px）は今の 28px のまま**（ユーザー承認）。5 のトップページ以外のページにも、この規則を当てる
7. **トップページ、ヘッダー、フッター、ダイアログ（ユーザー承認済み）：**
   - ヒーローの見出し：28px のまま、行の高さ 44px
   - セクションの見出し：24px、行の高さ 36px
   - 大きいカード（SPOTLIGHT）の見出し：36px、行の高さ 52px
   - カードの見出し：変えない（18px / 28px）
   - カードの説明文：16px、行の高さ 28px（説明文が幅 1280px で3行以内の E2E は残す）
   - カードのリンク：14px → 16px。矢印も文字に合わせて 16px にし、上下中央を保つ
   - 「SPOTLIGHT」のラベル：変えない（14px）
   - ヘッダーのメニュー、言語とテーマの切り替え（モバイルのメニューを含む）：14px → 16px
   - 作品の詳細のダイアログ：本文 14px → 16px（行の高さは 6 の規則）、見出しは 20px のまま行の高さ 32px
   - フッター：変えない（14px）
   - R4 は、この 7 に置き換える
8. **アイコンを Lucide に統一する。** Heroicons（`@heroicons/react` と、`src/components/icons/` の Heroicons から写した部品）をすべて Lucide の対応するアイコンに置き換え、`@heroicons/react` の依存をなくす。Lucide の版は今の `lucide-static` と同じ 1.52.0 に揃えて固定する（React で使うなら `lucide-react` の同じ版。`src/tools/**` と `src/components/ui/**` の MIT 側から All rights reserved 側を import しない規則は守る）。見た目の大きさは今と揃える（テーマ切り替えの太陽と月は線画になる。ユーザー了承済み）。LICENSE 第2節、`LICENSES/`、クレジットのページ、`/third-party-licenses.txt` から Heroicons を消す。置き換えの対応表（Heroicons → Lucide）を判断ログに書く
   8'. **（2026-10-23 改訂、8 を置き換える）アイコンを Tabler Icons 3.49.0 に統一する。** Lucide の一部が Feather 由来（MIT、別の帰属）でクレジットが減らないため、ユーザーが見本（Heroicons・Lucide・Tabler の比較）を見て Tabler を選んだ。Heroicons と Lucide をすべて Tabler（outline、線の太さは既定の 2）に置き換え、`@heroicons/react` と `lucide-static` の依存をなくす。
   - 版は 3.49.0 に固定する。React（`src/tools/**`、`src/components/ui/**`）は `@tabler/icons-react@3.49.0`、Astro の部品は `@tabler/icons@3.49.0` から写して出典のコメントを付ける（今の Lucide の写し方と同じ形）。MIT 側から All rights reserved 側を import しない規則は守る
   - 対応表（用途：Heroicons/Lucide → Tabler）：メニュー bars-3 → menu-2、言語 globe-alt → world、ダーク moon → moon、ライト sun → sun、閉じる x-mark → x、パンくず chevron-right → chevron-right、開閉 chevron-down → chevron-down、ファイルを追加 document-plus → file-plus、成功 check-circle → circle-check、エラー exclamation-circle → alert-circle、警告 exclamation-triangle → alert-triangle、情報 information-circle → info-circle、画像 photo → photo、追加 plus → plus、安全 shield-check → shield-check、再生成 arrow-path → refresh、コピー clipboard-document → clipboard、コピー済み clipboard-document-check → clipboard-check、削除 trash → trash、カードの矢印 Lucide move-up-right → arrow-up-right、BOOTH Lucide box → box。ここにないアイコンがあれば、同じ考え方で選び判断ログに書く
   - 見た目の大きさのクラスは今のまま（矢印は文字と同じ 16px で上下中央、BOOTH は 18px）。塗りの版（太陽と月、警告、開閉）も outline にする
   - LICENSE 第2節、`LICENSES/`、クレジットのページ、`/third-party-licenses.txt`、関連するテストから Heroicons と Lucide（と Feather の検査）を消し、Tabler Icons（MIT License, Copyright (c) 2020-2026 Paweł Kuna）を足す。全文はパッケージの LICENSE をそのまま `LICENSES/` に置く
9. **ムルルの権利表記を `©Lethal Cats`（©のあとにスペースなし。作者の指定どおり）にする**（クレジットのページ）

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
