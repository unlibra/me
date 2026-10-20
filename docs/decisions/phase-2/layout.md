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

## L-8 ヘッダーとフッターは `BaseLayout` が出す

- 決めたこと：`BaseLayout` が `Header`・本文・`Footer` を縦に並べて出す。各ページはヘッダーとフッターを自分で置かない。旧トップページのヘッダーバー（サイト名の `h1`）とフッター、`MarkdownLayout` 独自のフッターは消した。トップページの `h1` は、見出しの構造を保つため `sr-only` で残した
- 根拠：ページごとに置くと付け忘れが起こりうる。ヘッダーとフッターのないページは今のところ想定していない
- 他の選択肢：ページごとに `Header`・`Footer` を置く
- 戻すときの作業：`BaseLayout.astro` から2つを外し、各ページに置く

## L-9 ヘッダー・フッターの文言とフッターの並び

- 決めたこと：
  - liblab から引き継いだ文言：「テーマを切り替え / Toggle theme」「ライト・ダーク・システム」「寄付・支援 / Donate & Support」「プライバシーポリシー / Privacy Policy (Japanese)」「Support」「Language」
  - 新しく決めた文言：「ツール / Tools」「言語を切り替え / Change language」
  - フッターの説明文（仮）：ja「unlibra の制作物をまとめたサイトです。自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを掲載しています。」、en「A collection of works by unlibra: custom keyboards, software, web tools, and VRChat items.」
  - 並びは liblab と同じで、左にロゴ・説明文・GitHub、右に「Support」の見出しと「寄付・支援」「プライバシーポリシー」、下に「© 2025 unlibra」。著作権表示とリンク先は `src/config/site.ts` の定数に置いた
- 根拠：計画の仮方針（P2-1、P2-2）に沿い、文言はできるだけ liblab のものを使った。説明文は設計書 3.6 の作品カテゴリを並べた仮の文で、UIの最終チェックで差し替える前提
- 他の選択肢：liblab の `site.description` を流用する（ツールサイトの説明なので合わない）
- 戻すときの作業：`src/messages/layout.ts` の値を書き換える

## L-10 ポップオーバーの操作方式

- 決めたこと：テーマ切替と言語切替は、ボタン（`aria-expanded`・`aria-controls`）とパネルの組み合わせ（disclosure パターン）にした。開くと選択中の項目（なければ先頭）にフォーカスが移る。上下の矢印キー、Home・End で項目間を移動できる。Escape で閉じてボタンにフォーカスを戻す。外側をクリックするか、フォーカスが外に出ると閉じる。テーマの選択肢は `aria-pressed` で選択中を示す。ボタンの太陽と月のアイコンは CSS（`dark:` の有無）で切り替え、JS を待たずに正しいほうを表示する
- 根拠：liblab が使っていた headlessui の Popover と同じ操作感にした。`role="menu"` にすると、矢印キー以外の操作（Tab での移動）に制約が増える。HTML の `popover` 属性は、ボタンの下に位置を合わせるのに anchor positioning が要り、対応ブラウザがまだ限られる
- 他の選択肢：`role="menu"` と `menuitemradio`。`popover` 属性
- 戻すときの作業：`src/scripts/popover.ts` と2つのコンポーネントを直す

## L-11 システム設定とほかのタブへの追従

- 決めたこと：設定が「システム」のとき、表示中に OS のテーマが変わったら追従する。ほかのタブでテーマを変えたら（`storage` イベント）、開いているタブにも反映する。保存に失敗しても、選んだテーマはそのページには適用する
- 根拠：liblab の next-themes と同じ挙動。OS への追従は Block 1 のレビューで推奨された
- 戻すときの作業：`src/scripts/theme.ts` の `watchPreference` を呼ばないようにする

## L-12 アイコンの出どころ

- 決めたこと：太陽・月・地球のアイコンは Heroicons v2.2.0（MIT、Copyright (c) Tailwind Labs, Inc.）の SVG パスを `src/components/icons/` に写し、各ファイルの先頭に出典とライセンスを書いた。GitHub のアイコンは liblab の `github-icon.tsx` と同じパス（GitHub のマーク）
- 根拠：liblab は `@heroicons/react` を使っていたが、React に依存させないため、パスだけを写した。依存を増やさずに済む。MIT の著作権表示は、写した部分に添えて残す
- 他の選択肢：`heroicons` パッケージを依存に加えて SVG を読み込む
- 戻すときの作業：アイコンのファイルを差し替える。Phase 5 で `LICENSE` を書くとき、このアイコンの扱いも確認する

## L-13 文言のキーが ja と en で揃っていることの検査

- 決めたこと：`SameStructure` 型（liblab の `type-utils.ts` と同じもの）で en の型を ja から作る。この型がキーの不足・余分・文字列以外の値を拒むことを、`tests/types/layout-messages.ts` の `@ts-expect-error` で確かめる（`astro check` の対象）。加えて `node:test` から `src/messages/layout.ts` を読み込み（Node の型ストリップ）、実際の値のキーが一致することも確かめる
- 根拠：C8 は型での保証を求めている。`@ts-expect-error` は、印を付けた行がエラーでなくなると型チェック自体が失敗するので、型の保証が弱まったときに気づける
- 戻すときの作業：テストのファイルを消す
