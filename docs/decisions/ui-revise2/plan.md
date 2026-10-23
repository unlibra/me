# UI の見直し（2回目、ユーザーの指示、2026-10-22）

## 参照する文書

- 1回目の見直し：`docs/decisions/ui-revise/plan.md` と判断ログ `ui-revise.md`
- カードのモックアップ：コミット `0d8aa49`（プレビュー用の worktree のローカルブランチ `mock/cards-latest`。同じリポジトリなので `git show 0d8aa49:src/pages/mock/cards-1.astro` などで読める）。`src/components/mock/` と `src/pages/mock/` に案1〜3の実装がある。モックアップのファイル自体はこのブランチに持ち込まない

## ユーザーの指示

1. **ヘッダーの WEBツール（新名称 Apps）の展開（ポップオーバー）は不要。** ほかのカテゴリと同じく、トップのセクションへのリンクだけにする。モバイルメニューも同じ
2. **フッターの Links のグループを右に寄せる**
3. **作品カードのデザインを次の組み合わせにする**
   1. **Apps（旧 WEBツール）と Libraries（旧 ソフトウェア）：** 旧 liblab のツールカード（`liblab/frontend/src/app/[locale]/(default)/_components/tool-card.tsx`、色付きの円に乗せたアイコン＋名前＋説明）の形。モックアップの案1の WEBツールのカードが参考
   2. **VR & 3D（旧 VRChat）と DIY Keyboards（旧 自作キーボード）：** 共通の枠（モックアップの案2。画像の枠は 4:3）
   3. **大きなカード：** 任意の作品を大きなカード（モックアップの案3の、横幅いっぱいで画像と要約を横に並べる形）にできるようにする。作品データの項目（例：`featured: true`）で指定する。今回は DIY Keyboards の1件目（fosty natural）に適用する
   4. **クリックで詳細を出す UI を採用する。** ただし今のモックアップは、クリックすると詳細が出ることが分かりにくいので改善する（例：カードにホバーしたときの浮き上がり、詳細を開くことを示すアイコンや「詳しく見る」の表示）。どう改善したかを判断ログに書く。カードに出す一行の要約は新しいデータ項目として持つ（文面は仮。モックアップの `src/components/mock/data.ts` の文面を使ってよい）
4. **ヘッダーのサイト名と、ヒーローの名前の2か所に LINE Seed JP を使う**（`@fontsource/line-seed-jp`、OFL-1.1。必要な太さだけ）。名前の文字列は親がユーザーと相談中なので、今の文字列（ヘッダー「unlibra.com」、ヒーロー「unlibra」）のままにする
5. **ヒーローのサブタイトル：** 親がユーザーと相談中。仮で「Keyboards, libraries, apps, and VR & 3D.」にする
6. **カテゴリ名の変更：** 自作キーボード → DIY Keyboards、ソフトウェア → Libraries、WEBツール → Apps、VRChat → VR & 3D。表記は先頭大文字（Title Case）。ヘッダー、モバイルメニュー、セクションの見出しなど、カテゴリ名を出すすべての場所。VR & 3D の中のサブ分類（アバター / アセット / Unityツール）はそのまま。ページ内のアンカー名もカテゴリ名に合わせて変えてよい（例：`#keyboards`、`#libraries`、`#apps`、`#vr-3d`）。その場合は `_redirects` の `/#web` などの転送先も合わせる
7. **フッターの説明文：** 日本語は「unlibra の制作物をまとめたサイトです。自作キーボード、ライブラリ、アプリ、VR & 3D の作品を掲載しています。」英語は「A collection of works by unlibra: DIY keyboards, libraries, apps, and VR & 3D works.」（親の仮の文面。ユーザーの指示「DIY Keyboards は自作キーボード、Libraries はライブラリ、Apps はアプリ、VR & 3D はそのまま」に沿う）
8. **フッターの Links の表記：** ドキュメント → Docs、BOOTH ショップ → BOOTH（日英とも）
9. **プライバシーポリシーのお問い合わせ先：** `https://github.com/unlibra` を `https://github.com/unlibra/community` に変える（`src/pages/privacy.md` の「8. お問い合わせ」）

## 受け入れ条件

- L1：build、lint、format:check、`npm test`、`npm run test:e2e` が通る。今回の指示で仕様が変わった既存テストは新しい仕様に合わせ、直したテストと理由を判断ログに一覧で書く。それ以外は弱めない
- L2：1〜9 のそれぞれを確かめるテストがある。大きなカードは、データの指定で付け外しできることをテストする。詳細を開く UI は、クリックと Enter で開き、Esc と背景のクリックで閉じ、開くことを示す表示があることを E2E で確かめる
- L3：ライトとダーク、幅 375px と 1280px で崩れない（E2E の横スクロールの検査を含む）
- L4：新しい文言（一行の要約、「詳しく見る」などの表示）を、仮の文面として判断ログに一覧で書く
- L5：LINE Seed JP を `LICENSE` の第4節（npm パッケージ）の範囲で扱えるか、`third-party-licenses.txt` に載るかを確かめる

## 共通

- スコープは `ui-revise2` の1つ。ブランチ `feat/site-replacement` に直接コミットする。ブロックの分け方は任せる
- 判断ログ：`docs/decisions/ui-revise2/ui-revise2.md`
- 実行方法は `docs/decisions/phase-1/plan.md` の「実行方法」と同じ。ポート 8790 のプレビューサーバー（`%TEMP%\claude\me-preview` から起動）は親のものなので触らない
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない

## 追加の決定（2026-10-22、ユーザー）

- 4：サイト名は「unlibra」に統一する。ヘッダー、ヒーロー、フッター、ブラウザのタブのタイトル（トップは「unlibra」、ほかは「{ページ名} - unlibra」）、OGP の site_name・og:title、Twitter カード、OGP 画像の文字。ドメイン（URL、canonical、リンク先、`site.url` など）は `unlibra.com` のまま
- 5：ヒーローのサブタイトルは、暫定で「昼はカフェ、夜はバー。」
- 4（更新、2026-10-22）：ロゴタイプとして使われている「unlibra」は、すべて LINE Seed JP にする（ヘッダー、ヒーロー、モバイルメニュー、フッターのロゴ横など）。本文中の「unlibra」は対象外。フォントは7文字（u n l i b r a）だけに絞ったファイルを使う
