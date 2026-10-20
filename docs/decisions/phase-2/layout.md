# Phase 2 判断ログ（layout）

## L-1 canonical の有無を `BaseLayout` の必須プロパティにし、URL はページのパスから作る

- 決めたこと：`BaseLayout` に `canonical: boolean` を必須で渡す。`true` のとき、canonical と og:url の値は `Astro.url.pathname` から作る（末尾スラッシュを落とし、トップは `https://unlibra.com`）。404 は `canonical={false}` を渡し、canonical と一緒に og:url も出さない。別言語版は `alternatePath`（`/` で始まるパス、任意）で受け取り、あるときだけ hreflang の ja・en・x-default（= ja）を出す
- 根拠：パスを各ページに手で書かせると、実際の URL と食い違う余地が残る。省略時に canonical を出す既定値にすると、404 で渡し忘れても気づけない。og:url は「このページの正規の URL」なので、canonical を出さない 404 では出さないほうが一貫する
- 他の選択肢：`noCanonical?: boolean` のような省略可能なフラグにする。404 でも og:url だけは出す
- 戻すときの作業：`BaseLayout.astro` のプロパティと、3ページの呼び出しを直す

## L-2 プライバシーポリシーに meta description を足し、Markdown のページでは title と description を必須にする

- 決めたこと：`privacy.md` の frontmatter に `description`（「unlibra.com のプライバシーポリシーです。収集する情報とその利用目的、取り扱いについて説明します。」）を足した。`MarkdownLayout` は frontmatter に `title` と `description` がないとビルドを失敗させる（以前の title の既定値「プライバシーポリシー」はやめた）。404 の description は見出しと同じ「ページが見つかりません / Page not found」にした
- 根拠：計画で `BaseLayout` が description と OGP を出すことになっており、プライバシーポリシーには description がなかった。空の description を出すより、内容を短く言う文を置くほうがよい。文面は仮で、UIの最終チェックで変えてよい
- 他の選択肢：description を省略可能にし、ないページでは出さない
- 戻すときの作業：frontmatter の1行と `MarkdownLayout.astro` の検査を消す

## L-3 旧トップページの X 風トークンをライト・ダークに追従させる

- 決めたこと：トップページの中身が使う `base-primary`・`base-secondary` を、ライトでは白と `#e5e7eb`、ダーク（`.dark`）では以前と同じ `#282c34`・`#333842` にした。タブの選択中の文字色（スクリプトが付ける `text-white`）を `text-gray-900 dark:text-white` に、共有ボタンの枠とホバー色をライト用に変えた
- 根拠：トップページの中身は Phase 3 で作り直すが、Phase 2 の完了条件は「全ページ共通のレイアウトがライト・ダーク両方で表示される」。白い背景に以前のダーク用の枠線と白文字が残ると、ライトで読めない箇所が出る。トークンの値を変えるだけで、マークアップはほぼ触らずに済む
- 他の選択肢：トップページの中身はダーク前提のまま残す
- 戻すときの作業：Phase 3 でトークンごと消す

## L-4 テーマの保存キーを `theme` にし、値を next-themes と同じにする

- 決めたこと：`localStorage` のキーは `theme`、値は `light` / `dark` / `system`。それ以外の値や値なしはシステムに従う
- 根拠：liblab は `unlibra.com/lab` として同じオリジンで配信され、next-themes が同じキーと値で保存していた。揃えておけば、liblab で選んだテーマが新しいサイトでもそのまま効く
- 他の選択肢：新しいキー名にする
- 戻すときの作業：`src/config/theme.ts` の定数を変える

## L-5 Roboto Mono は 400 と 500 だけ読み込む

- 決めたこと：`@fontsource/roboto-mono` の 400 と 500 の CSS だけを読み込む
- 根拠：liblab で `font-mono` と組み合わせている太さは標準と `font-medium` だけだった。`@font-face` を読むだけでは、使わないページでフォントファイルはダウンロードされない
- 他の選択肢：全ウェイトを読み込む。Phase 4 で必要になったら足す
- 戻すときの作業：`BaseLayout.astro` の import を足す

## L-6 その他、設計書にない小さな追加

- 決めたこと：`og:image:width`・`og:image:height`（1200・630）を出す。`color-scheme` をテーマに合わせて `light` / `dark` にする（スクロールバーやフォーム部品の配色が合う。next-themes も同じことをする）
- 戻すときの作業：`BaseLayout.astro` の2行と `global.css` の `color-scheme` を消す

## L-7 IBM Plex が残っていないかの検査から README.md を外す

- 決めたこと：受け入れ条件 C6（IBM Plex の参照が残っていない）のソース検査で、`README.md` を対象から外した
- 根拠：README は技術スタックの説明として IBM Plex Sans JP を挙げているが、このスコープで触ってよい範囲の外で、書き換えは Phase 5 で行う
- 戻すときの作業：Phase 5 で README を書き換えたら、テストの除外を1行消す
