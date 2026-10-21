# UI の見直し（2回目）の判断ログ（ui-revise2）

計画：`ui-revise2/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。作業中に親から届いたユーザーの判断（2026-10-22）も反映した：サイト名を「unlibra」に統一（計画の4の差し替え）、ヒーローのサブタイトルは暫定で「昼はカフェ、夜はバー。」（計画の5の差し替え）。

## UR2-1 カテゴリの ID（アンカー）を名前に合わせて変えた

- 決めたこと：`categories` を `keyboards`・`libraries`・`apps`・`vr-3d` にした（アンカーは `/#keyboards` など、`categoryHref` がそのまま作る）。VR & 3D のサブ分類の型と文言のキーも `Vr3dSubcategory`・`vr3dSubcategories` に改名した（値の `avatar`・`asset`・`unity-tool` と表示は同じ）。`_redirects` の一覧のURLの転送先を `/#web` から `/#apps` にした
- 根拠：計画の6「アンカー名もカテゴリ名に合わせて変えてよい」。ID とアンカーを1つにしておけば、対応表がいらない
- 影響：前のアンカー（`/#web`・`/#keyboard`・`/#software`・`/#vrchat`）を外から直接開くと、ページの先頭に着く（フラグメントはサーバーで転送できない）。`docs/replace-plan.md` の `/#web` の記述は、編集してよい範囲の外なので直していない（親に返す）
- 他の選択肢：ID は前のまま、アンカーだけ変える。アンカーも前のまま
- 戻すときの作業：`works.ts` の `categories` と各作品の `category`、`cards.ts`、`layout.ts` のキー、`_redirects`、テストの ID を前の値に戻す

## UR2-2 カテゴリ名は日本語のページでも英語の Title Case

- 決めたこと：`layoutMessages` の `header.categories` を、日英とも「DIY Keyboards」「Libraries」「Apps」「VR & 3D」にした。トップの見出し、ヘッダー、モバイルメニューに出る
- 根拠：計画の6「表記は先頭大文字（Title Case）」。日本語の訳語は、フッターの説明文（計画の7）の中でだけ使う
- 戻すときの作業：`layout.ts` の `ja.header.categories` を日本語に変える

## UR2-3 ヘッダー：WEBツールのポップオーバーを外し、使わなくなった部品を消した

- 決めたこと：4カテゴリとも同じ形のリンクにした。モバイルメニューも、ホームと4カテゴリのリンクだけ（ツールの一覧と見出しを外した）。`header.allWebTools` の文言、ヘッダーのポップオーバーのスクリプト、使わなくなった `ChevronDownIcon.astro`（と `LICENSE` の行）を消した。`popover.ts` はテーマと言語の切替が使うので残した
- 根拠：計画の1
- 影響：ヘッダーからツールのページへのリンクがなくなった。ツールへの入口は、トップの Apps の詳細（UR2-10）
- 戻すときの作業：前のコミットの `Header.astro`・`MobileMenu.astro`・`ChevronDownIcon.astro` を戻す

## UR2-4 フッターの Links のグループを、中央の列の右半分に置いた

- 決めたこと：中央の列（`2fr`。中は `sm:grid-cols-2`）の中で、Links を2つ目の枠（`md:col-start-2`）に置いた。右の列の Support の隣になる。`md` 未満（1列、または中だけ2列）は今までどおり左
- 根拠：計画の2「右に寄せる」。liblab では中央の列に TOYS と TOOLS の2グループが並んでいた。1グループだけ左半分にあると、左の列（ロゴ）に寄って見える
- 他の選択肢：中央の列の中で右端に寄せる（`justify-self-end`）。中央の列をなくして Links を Support の左に詰める
- 戻すときの作業：`Footer.astro` の `md:col-start-2` を外す

## UR2-5 LINE Seed JP：太さ 700 だけ、すべての文字の範囲を読み込む

- 決めたこと：`@fontsource/line-seed-jp/700.css` を `BaseLayout.astro` で読み込み、`--font-brand`（`"LINE Seed JP", "Noto Sans JP Variable", sans-serif`）と `font-brand` のクラスを作った。使うのはヘッダーのサイト名とヒーローの名前の2か所だけ。2か所の太さを `font-semibold`（600）から `font-bold`（700）にした
- 根拠：LINE Seed JP には 100・400・700・800 しかない（600 を指定すると 700 が選ばれるか合成される）。文字の範囲は、名前が日本語になっても効くように、日本語を含むすべての範囲（`700.css`）にした。ブラウザは `unicode-range` で、使う文字の範囲のファイルだけを取りに行く（今は latin の1ファイル）
- 影響：`dist/_astro/` に LINE Seed JP のファイルが 237 個（約 5.0 MB）増える。配信されるのは使う範囲だけ
- 未決（親に返す）：モバイルメニューのパネルの上とフッターのロゴの横にもサイト名がある。計画の「2か所」に従い、この2つは本文のフォント（Noto Sans JP）のまま
- 他の選択肢：latin の範囲だけ読み込む（`latin-700.css`。ファイルは減るが、日本語の名前にすると Noto Sans JP に落ちる）
- 戻すときの作業：`BaseLayout.astro` の import、`global.css` の `--font-brand`、2か所の `font-brand font-bold` を消し、`package.json` から外す

## UR2-6 サイト名を「unlibra」に統一（ユーザーの判断、2026-10-22）

- 決めたこと：`site.title` を `"unlibra"` にした。ヘッダー、モバイルメニュー、フッターのロゴの横、`<title>`（トップは「unlibra」、ほかは「{ページ名} - unlibra」）、`og:title`・`og:site_name`・`twitter:title` がこれを使う。OGP 画像は `scripts/generate-icons.mjs` の文字を「unlibra」にして作り直した（フォントは前と同じ Noto Sans JP。`favicon.ico`・`apple-touch-icon.png`・`icon.svg` は変わらないことを `git status` で確かめた）。ドメイン（`site.url`、canonical、hreflang、リンク、`_redirects`、check-prod、`LICENSE`）は `unlibra.com` のまま
- 未決（親に返す）：プライバシーポリシーの meta description「unlibra.com のプライバシーポリシーです。…」は、ドメインとしての表記ともサイト名とも読めるので変えていない。README の見出し（`# unlibra.com`）はリポジトリの説明なので変えていない
- 戻すときの作業：`site.title` と `generate-icons.mjs` の文字を戻し、`npm run generate:icons` を実行する

## UR2-7 カードの形：Apps と Libraries は旧ツールサイトのカード、DIY Keyboards と VR & 3D は 4:3 の枠

- 決めたこと：
  - カテゴリごとの形を `src/config/cards.ts` の `cardStyles` に置いた（`tool` か `frame`）。`works.ts` は画像を import するので、テストから読めるように別のファイルにした
  - `tool`（`ToolCard.astro`）：liblab の `tool-card.tsx` の形（`p-4`、枠なし、ホバーで背景、円のアイコン `size-10`・名前・要約）。並びも liblab と同じ（1列、`lg` で2列、`gap-3`）。年は出さない（liblab のカードにない。詳細に出る）。ツールのアイコンは liblab の tools と同じ `bg-logo-medium/70` の円。npm と PyPI のロゴは、画像が白地の 16:9 なので、白い円（`ring-1` で縁取り）に切り抜いて置いた（`scale-[2.25]`）
  - `frame`（`FrameCard.astro`）：モックアップの案2（4:3 の写真、名前と年、サブ分類、要約）。並びは今までどおり（`sm` で2列、`lg` で3列、`gap-6`）
- 根拠：計画の3の1・2
- 他の選択肢：Libraries の円にも色を付ける（ロゴの白地で隠れる）。npm・PyPI の正方形のロゴを新しく作る（他社のロゴのファイルが増える）
- 戻すときの作業：`cards.ts` の `cardStyles` を変える。カードの部品は `src/components/works/`

## UR2-8 大きなカード：`featured: true` の作品を、その位置で横幅いっぱいにする

- 決めたこと：`Work` に `featured?: true` を足し、fosty natural に付けた。カードの種類は `cardKind(work)`（`featured` なら `featured`、ほかはカテゴリの形）で決まり、`WorkList.astro` はこれだけを見る。大きなカード（`FeaturedCard.astro`）はグリッドの `col-span-full` で、データの並びの位置に出る（先頭に移さない）。どのカテゴリでも使える（Apps・Libraries ではアイコンを大きく出す）
- 根拠：計画の3の3「任意の作品を大きなカードにできる」。位置を動かさないので、並びはデータの順だけで決まる
- 影響：途中の作品を大きくすると、その前の行に空きが出ることがある
- 他の選択肢：大きなカードをカテゴリの先頭に集める。`grid-flow-dense` で空きを詰める（並びが変わる）
- 戻すときの作業：`featured` を外す（データ）。仕組みごと戻すなら `cards.ts` の `cardKind` と `FeaturedCard.astro` を消す

## UR2-9 クリックで詳細を出すことを分かりやすくした（計画の3の4）

- 決めたこと：モックアップから次のように変えた
  - すべてのカードの最後に「詳しく見る ›」（色はブランドの青、シェブロンはホバーで右に動く）を出す。スクリーンリーダーには読ませない（`aria-hidden`。ボタンの名前は作品名で、`aria-haspopup="dialog"` が詳細を開くことを伝える）
  - ホバーとキーボードのフォーカスで、カードが少し浮き上がり（`-translate-y-0.5`）、影が付く。枠のあるカードは枠の色が濃くなり、写真は少し拡大する。`prefers-reduced-motion` では動かさない
  - カード全体がクリックでき、どこでも指のカーソルになる（作品名のボタンの `::after` がカードを覆う。フォーカスの輪もカード全体に出る）
- 根拠：計画の3の4の例（浮き上がり、アイコン、「詳しく見る」）を全部入れた
- 他の選択肢：「詳しく見る」をホバーのときだけ出す（タッチの端末で見えない）。展開のアイコン（⤢ など）だけにする
- 戻すときの作業：`MoreLabel.astro` を外し、`card-classes.ts` の `liftOnHover` を空にする

## UR2-10 詳細のダイアログ：作品ごとの `<dialog>` を HTML に置いた

- 決めたこと：
  - モックアップの「`<template>` を1つの `<dialog>` に複製する」形をやめ、作品ごとの `<dialog id="work-{id}">` をセクションの中に置いた。ボタンの `aria-controls` で結ぶ。名前は見出し（`aria-labelledby`）
  - 開く：クリックと Enter（ネイティブのボタン）。閉じる：Esc（ネイティブ）、閉じるボタン（`aria-label`「閉じる」）、背景のクリック。閉じるとフォーカスは開いたボタンに戻る（ブラウザの挙動）。開いている間はページをスクロールさせない
  - 中身：画像（写真のカテゴリは写真、ほかはアイコン）、作品名、年、サブ分類、説明文、リンク
  - カードからリンク（作品への直接のリンク、ドキュメントのリンク）をなくし、ダイアログの中に移した。リンクの名前は `work-links.ts` がカテゴリとURLから決める（Apps「ツールを開く」、npm「npm で見る」、PyPI「PyPI で見る」、BOOTH「BOOTH で見る」、ドキュメント「ドキュメント」）。決まっていない組み合わせ（自作キーボードにリンク、未知のホストなど）はビルドを止める
- 根拠：ダイアログの中身が最初から HTML にあるので、ツールのページへのリンクがクローラーから見える（`<template>` の中のリンクは文書の一部にならない）。複製のスクリプトもいらない
- 影響：ツールのページへの内部リンクは、トップの閉じたダイアログの中だけになる（UR2-3）。サイトマップには載っている
- 他の選択肢：モックアップどおり `<template>` から複製する。カードに直接のリンクも残す
- 戻すときの作業：`WorkDialog.astro`・`work-links.ts` を差し替える

## UR2-11 変えていないもの（親に返す）

- `messages.site.description`（トップの meta description）：「自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを掲載しています。」のまま。カテゴリ名を出す場所とも読めるが、文面は計画にないため
- プライバシーポリシーの「最終更新日：2025年12月6日」：お問い合わせ先を変えたが、日付は変えていない
- 作品カードの外の「BOOTH ショップ」（VR & 3D の見出しの横）と、詳細の「ドキュメント」：計画の8はフッターの Links だけなので、そのまま

## UR2-12 LINE Seed JP のライセンス（L5）

- 確かめたこと：`@fontsource/line-seed-jp` 5.3.2 は npm のパッケージで、`license` は `OFL-1.1`。ビルドの出力（`dist/_astro/` のフォント）から `scripts/third-party-licenses.mjs` が拾い、`/third-party-licenses.txt` に「@fontsource/line-seed-jp 5.3.2 (OFL-1.1)」と全文が載る。`LICENSE` の第4節（ビルドの出力に入る npm のパッケージ、フォントを含む）の範囲に入る。`tests/third-party-licenses.test.js` の H4/H5 の一覧に足した
- 気づいたこと（親に返す）：パッケージの `LICENSE` ファイルの著作権者の行は「Google Inc.」（Fontsource の Google Fonts 用のひな形）だが、フォントの中の著作権表示（name テーブルの ID 0）は「© LY Corporation」。一覧にはパッケージの `LICENSE` がそのまま載るので、著作権者は「Google Inc.」と表示される。OFL の条件（著作権表示とライセンスを添える）は、フォントのファイル自体に表示が入っているので満たしていると考えるが、一覧の表示を直すか（注記を足すなど）は判断してほしい

## 直した既存のテストと理由（L1）

| テスト                                                                                                  | 直した内容と理由                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.test.js` の `ui-revise 4: the header links to the category sections of the top page`            | `ui-revise2 1, 6: the header links to the category sections, without menus` に置き換えた。WEBツールのメニューがなくなり（指示1）、カテゴリの ID と名前が変わった（指示6）           |
| `layout.test.js` の `C4: every page has the common header`                                              | サイト名の確認を `>unlibra.com<` から `data-site-name>unlibra<` にした（サイト名。ドメインではない。ユーザーの判断）                                                                |
| `portfolio.test.js` の `D2: the top page has the four category sections in order`                       | セクションの ID と見出しを新しい名前にした（指示6）。前の名前と ID が残っていないことも見るようにした                                                                               |
| `portfolio.test.js` の `D2: the header links to each category section`                                  | WEBツールのボタンとメニューの1行目の確認を外し、4つのリンクにした（指示1・6）                                                                                                       |
| `portfolio.test.js` の `ui-revise 1: the hero has ...`                                                  | プロフィール文をサブタイトル「昼はカフェ、夜はバー。」にし、名前に `font-brand` があることを見る（指示4・5、ユーザーの判断）                                                        |
| `portfolio.test.js` の `D3`（2つ）                                                                      | セクションを `#apps` にした。ツールへのリンクはカードではなく詳細のダイアログの中を見る（指示3の4）                                                                                 |
| `portfolio.test.js` の `D4`（2つ）                                                                      | セクションを `#vr-3d` にした。BOOTH へのリンクはダイアログの中を見る。見出しの横のショップのリンクは、カードとダイアログの外で見る（指示3の4・6）                                   |
| `tools.test.js` の `tool pages use the tool's name and description as title and description`            | `<title>` の末尾を「 - unlibra.com」から「 - unlibra」にした（サイト名。ユーザーの判断）                                                                                            |
| `tools.test.js` の `E8: every page's header links to the tools in the page's language`                  | ヘッダーにツールのリンクがなくなったので、「どのページのヘッダーにもツールのリンクがない」「トップ（日本語）の main が日本語のツールのページに1つずつリンクする」を見るテストにした |
| `redirects.test.js`（`EXPECTED` など）                                                                  | 一覧のURLの転送先を `/#web` から `/#apps` にした（UR2-1）                                                                                                                           |
| `third-party-licenses.test.js` の `H4/H5: the list has exactly the packages the build output ships`     | `@fontsource/line-seed-jp` を足した（指示4）                                                                                                                                        |
| `tests/types/works.ts`                                                                                  | カテゴリの値を新しい ID にした（UR2-1）。型の検査の中身は同じ                                                                                                                       |
| `header.spec.js` の `desktop › ...`・`mobile › the menu opens, links to sections and tools, and closes` | WEBツールのメニューのテストを「カテゴリはリンクだけで、開くメニューがない」にし、モバイルメニューからツールのリンクを外した。見出しの名前を新しい名前にした（指示1・6）             |
| `site.spec.js` の `the tool list URLs land on the web tools section`                                    | `the tool list URLs land on the apps section` にし、転送先を `/#apps`、見出しを「Apps」にした（UR2-1）                                                                              |

`build.test.js` の `unlibra\.com/ja` などはサイトマップのURL（ドメイン）なので変えていない。

## 新しい文言（すべて仮の文面、L4）

| 場所                                      | 文言                                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| カードの最後（すべてのカード）            | 詳しく見る                                                                    |
| 詳細の閉じるボタン（aria-label）          | 閉じる                                                                        |
| 詳細のリンク（Apps）                      | ツールを開く                                                                  |
| 詳細のリンク（npm・PyPI・BOOTH）          | npm で見る / PyPI で見る / BOOTH で見る                                       |
| 詳細のドキュメントのリンク                | ドキュメント（既存の `messages.links.docs`）                                  |
| ヒーローのサブタイトル                    | 昼はカフェ、夜はバー。（ユーザーの判断、暫定）                                |
| カードの一行の要約（`works[id].summary`） | モックアップの `data.ts` の文面をそのまま使った（14件。`src/messages/ja.ts`） |

カテゴリ名（指示6）、フッターの説明文（指示7）、フッターの Links の表記（指示8）は計画の文面どおり。
