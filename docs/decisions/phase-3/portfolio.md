# Phase 3 判断ログ（portfolio）

## PF-1 作品データの型

- 決めたこと：`Work` を `category` で分ける判別共用体にした。`vrchat` 以外は `subcategory?: never`、`vrchat` は `subcategory: VrchatSubcategory`（必須）。ドキュメントの URL は `docs?: \`https://docs.unlibra.com/${string}\`` 型で持ち、ほかのホストを書くと型エラーになる。作品の `id` は `src/messages/ja.ts` の `works` のキーに限る（タイトルと説明文のない作品を作れない）。`link` は `/` で始まるサイト内のパスか `https://` の URL。カテゴリとサブ分類の表示順は `works.ts` の定数の並び順で決め、`ja.ts` のラベルは `satisfies Record<Category, string>` で全カテゴリを持つことを型で確かめる
- 根拠：計画の「型で保証する」と、safe-by-construction の方針。ドキュメントのホストを型にしておくと、旧ホストへの書き戻しをビルドで止められる
- 他の選択肢：`subcategory` を省略可能な1つの型にし、実行時に検査する。ドキュメントの URL を `string` にする
- 戻すときの作業：`src/config/works.ts` の型と `tests/types/works.ts` を直す

## PF-2 ツールの ID とパスを `src/config/tools.ts` に置く

- 決めたこと：4ツールの ID（`toolIds`）と、ID から `/lab/{tool}` を作る `toolPath` を `src/config/tools.ts` に置き、作品データから使う
- 根拠：Phase 4 のツールページでも同じ ID を使う。作品データに `/lab/...` を直接書くと、ツールにない ID を書いても気づけない
- 他の選択肢：作品データにパスを文字列で書く
- 戻すときの作業：作品データの `link` を文字列に戻し、ファイルを消す

## PF-3 トップページとカードの構成（仮のデザイン）

- 決めたこと：
  - 上から、プロフィール（アバター、名前の `h1`、プロフィール文、GitHub と支援のボタン）、カテゴリへのページ内リンク（`nav`）、カテゴリごとの `section`（`h2` と、1〜3列のカードのグリッド）。VRChat の見出しの横にショップへのリンクを置く
  - カードは、画像（16:9）、タイトル（`h3`）、年（`time`）、VRChat ならサブ分類のラベル、説明文、ドキュメントへのリンク。リンク先のある作品は、タイトルのリンクをカード全体に広げて（`::after`）カードのどこを押しても開く。ドキュメントのリンクはその上に重ねて別に押せる
  - 外部リンク（npm、PyPI、BOOTH、ドキュメント）は新しいタブで開き、サイト内の `/lab/{tool}` は同じタブで開く
  - WEBツールの画像は正方形のアイコンなので、liblab のツールカードと同じく、色付きの円（`bg-logo-medium/70`）に入れて中央に置く。アイコンは抽象的な図形なので `alt=""`。ほかの作品の画像は以前と同じく `alt` にタイトルを入れる
  - 旧ページの `h1`（sr-only のサイト名）をやめ、プロフィールの名前を見える `h1` にした
  - 作品の並びはカテゴリごとにまとめ、カテゴリ内は旧データの並び順を保った。WEBツールの年は旧 liblab の作品と同じ 2025、ダミーの年は 2026
- 根拠：計画の仮方針（liblab のトップページの雰囲気）。カード全体を押せるのは liblab のツールカードと同じ操作感。最終UIチェックで変わる前提
- 他の選択肢：カードを liblab と同じアイコンと文字だけの小さい形にする。画像にもリンクを付ける
- 戻すときの作業：`src/pages/index.astro` と `src/components/WorkCard.astro` を直す

## PF-4 画面に出す新しい文言（仮）

最終UIチェックの項目に加えてもらう。

- ページの meta description：「unlibra のポートフォリオです。自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを掲載しています。」
- プロフィール文：「自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを作っています。」
- VRChat の見出しの横のリンク：「BOOTH ショップ」
- ダミー作品のタイトル：「ダミーのアバター」「ダミーのアセット」「ダミーのUnityツール」
- ダミー作品の説明文：「ダミーの商品です。BOOTH で販売中の{アバター／アセット／Unityツール}に差し替えます。」
- ダミー画像（`src/assets/works/dummy.svg`）：灰色の地に対角線と「DUMMY」の文字
- 画面に出る年：WEBツール4つは 2025、ダミー作品3つは 2026（PF-3。`src/config/works.ts` の `year`）
- 外部リンク（npm、PyPI、BOOTH、ドキュメント）を新しいタブで開くこと（PF-3。サイト内の `/lab/{tool}` は同じタブ）

流用したもの（仮扱いにしない）：カテゴリ名とサブ分類名（設計書 3.6）、カテゴリのページ内リンクの読み上げラベル「作品カテゴリ」（旧ページのタブの `aria-label`）、ドキュメントへのリンクの文字「ドキュメント」（旧説明文の「ドキュメント: 」）、ツールの名前と説明文（liblab の `tools.ts`）、GitHub ボタンの「GitHub」（`layout.ts`）、支援ボタンの「スポンサー」（既存の `SponsorButton`）

- 戻すときの作業：`src/messages/ja.ts` の値を書き換える。年は `works.ts`、リンクの開き方は `WorkCard.astro` と `index.astro` を直す

## PF-5 プロフィールから所在地と @ユーザー名を外す

- 決めたこと：プロフィールに出すのは、計画の「アバター、名前、プロフィール文、GitHub と支援へのリンク」だけにした。旧ページにあった所在地（Tokyo, Japan）、`@unlibra`、ウェブサイトのリンクは出さない。`src/config/profile.ts` は `name` だけにし、使わなくなった `username`・`location`・`website`・`sponsor` を消した（GitHub と支援の URL は `site.links` にある）
- 根拠：`@ユーザー名` は X のプロフィールの形で、所在地はアイコンと一緒に X 風のメタ情報の行に並んでいた。ウェブサイトのリンクは GitHub と同じ URL だった
- 他の選択肢：所在地をプロフィール文の下に残す
- 戻すときの作業：`profile.ts` に値を戻し、`index.astro` に表示を足す

## PF-6 X 風の残りの削除で消したもの

- 決めたこと：アイコン `ShareIcon`・`ParodyIcon`・`PinIcon`・`CalendarIcon`・`LocationIcon`・`LinkIcon`、旧アイコン `src/assets/icon.svg`、`global.css` のトークン（`base-*`、`accent-*`、`text-x-*`）と `.pinned-label` のルールを消した。`global.css` の色トークンの出典コメント「Colors from liblab」は、受け入れ条件 D6（`src/` に `liblab` を残さない）に合わせて「Colors carried over from the former tool site's Tailwind config」に書き換えた。`Avatar` と `SponsorButton` はプロフィールで使うので残した
- 根拠：計画のやること5。`LinkIcon` は旧カードのリンク表示にだけ使っていた
- 戻すときの作業：git の履歴から戻す
