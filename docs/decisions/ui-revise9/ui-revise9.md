# UI の見直し（9回目）の判断ログ（ui-revise9）

計画：`ui-revise9/plan.md`。ここには、計画とユーザーの指示に書かれていない判断を書く。

## UR9-1 「リンク先も詳細もないカード」の型（指示3）

- 決めたこと：`Work` の DIY Keyboards を2つに分けた。説明（`description`）がメッセージにある作品は今までどおり詳細を開くカード。説明がない作品は `plain: true` を必ず書き、カードはどこにも飛ばない。`plain: true` の作品は `featured`（大きいカード）にできない。どちらの id かはメッセージの型から決まる（`DescribedWorkId`）ので、説明のない作品を詳細のカードにすること、説明のある作品を `plain` にすること、ほかのカテゴリーに `plain` を付けることは型エラーになる（`tests/types/works.ts` で確かめる）
- `cardTarget` は DIY Keyboards なら `plain` で `none`、そうでなければ `details` を返す。ほかのカテゴリーはリンクが型で必須なので、リンクがないときは `details` にせずビルドを止める（今までは「リンクがない→詳細」だった）
- 根拠：計画の「カードの1番目のリンクの規則に例外を作るなら、型とテストで守る」。説明の有無だけで暗黙に決めると、説明を消し忘れた・書き忘れたときに気づけないので、明示のフラグとメッセージの型の両方を合わせる形にした
- 大きいカードを禁じた理由：大きいカードの面（`featuredSurface`）はホバーの色を含んでいて、ホバーなしの版がない。今は使わないので型で禁じ、必要になったら面のクラスを分ける
- 他の選択肢：フラグを置かず説明の有無だけで決める（暗黙）。`kind: "details" | "plain"` のような列挙を DIY Keyboards 全部に書く（今ある3件にも書く必要がある）
- 戻すときの作業：`works.ts` の型の分岐と `plain: true`、`work-links.ts` の `none`、`CardTitle`・`CardLinks`・`FrameCard` の分岐、型テストを消す

## UR9-2 id と画像のリネーム（指示3）

- 決めたこと：作品の id を `botsu` から `prototypes` に、画像を `src/assets/works/botsu.webp` から `prototypes.webp` にリネームした（`git mv`）
- 旧 id へのリンク：id が出るのは `data-work` 属性と、カード・ダイアログの要素の id（`work-botsu`、`work-botsu-open` など、ARIA の参照用）だけ。詳細はスクリプトで開き、URL のハッシュでは開かない（ハッシュを読むコードはない）。サイトマップはトップページだけで、作品のページやアンカーへのリンクはサイト内にもない。したがって旧 id の URL で壊れるものはない（`/#work-botsu` は今までも詳細を開かなかった）
- `portfolio.test.js` で、ページと `src/` のソースに `botsu` と「没キーボード」が残っていないことを見る
- 戻すときの作業：id と画像のファイル名を戻す

## UR9-3 prototypes のカードの見た目（指示3、親の解釈）

- 決めたこと：見出し（h3）の中はただのテキスト（`<span>`）にし、ボタンもリンクも置かない。カードの下のリンクの行（`data-work-links`）ごと描かない。フレームのカードのホバー（`cardHover`。キーボードのフォーカスのときの背景も含む）を付けない。カーソルは既定のまま
- カードの `group relative` などのレイアウトのクラスは他のカードと同じにした（行の高さと並びが揃う）。カードの下に「詳しく見る」の行がない分、同じ行のほかのカードより中身が短いが、カードの高さは行で揃う
- 戻すときの作業：上の UR9-1 と同じ

## UR9-4 文面（指示1・2・4）

- 文面はユーザー指定のとおり。詳細の文は全文の差し替えなので、前の文にあった「（非売品）」「終売。」「USB Type-C」はなくなった
- 指示1は i18n-tiny の3件とも「1KB未満のi18nライブラリです。」にした（「i18n」の前後の空白もなくした。例文のとおり）

## UR9-5 仕様が変わって合わせた既存テスト（Q1）

| テスト                                                                                       | 前                                                   | 後                                                                                          |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `portfolio.test.js`「ui-revise8 4: Libraries has @i18n-tiny/react」                          | 説明文が「…i18n ライブラリです。必要な機能だけを…」  | 「…1KB未満のi18nライブラリです。」                                                          |
| `portfolio.test.js`「every card has the same hover」                                         | すべてのカードにホバー                               | prototypes を除く。prototypes にはホバーのクラスがないことを見る                            |
| `portfolio.test.js`「the DIY Keyboards cards open their details; the other cards have none」 | DIY Keyboards の4枚すべてに詳細                      | prototypes を除く3枚に詳細。prototypes はボタン・「詳しく見る」・ダイアログがないことを見る |
| `portfolio.test.js`「the links' text has the growing underline」                             | どのカードにも1番目のリンクがある                    | prototypes には「詳しく見る」もアクションもないことを見る                                   |
| `works.spec.js`「a click anywhere on a card opens its details」                              | 詳細に「fosty natural の兄弟モデル」                 | 「fosty naturalのアナザーカラー。」                                                         |
| `works.spec.js`「Enter on the focused title opens the details」                              | 没キーボードのカードで確かめる                       | mira zero のカードで確かめる                                                                |
| `works.spec.js`「every card is clickable as a whole」                                        | 13枚すべて。ダイアログと DIY Keyboards のボタンは4つ | prototypes を除く（下の新しいテストで見る）。ダイアログとボタンは3つ                        |
| `works.spec.js`「the featured card spans the width」                                         | 3枚の並びに `botsu`                                  | `prototypes`                                                                                |
| `works.spec.js` の `SAMPLES`（ホバー、スタイル、下線のテスト）                               | フレームのカードの見本が `botsu`                     | `mira-zero`（prototypes はホバーもリンクもないため）                                        |
| `works.spec.js`「every card's text is at least 4.5:1」                                       | どのカードも文字が3つ以上（見出し・説明文・リンク）  | prototypes は2つ以上（リンクがない）                                                        |

追加したテスト：`portfolio.test.js` の「ui-revise9 1, 2, 4」（i18n-tiny と DIY Keyboards の説明文、詳細の文と改行）と「ui-revise9 3」（prototypes のカードにリンク・ボタン・「詳しく見る」・ダイアログ・ホバーがないこと、旧名が残っていないこと）、`works.spec.js` の「ui-revise9 3」（リンクもボタンもフォーカスできる要素もないこと、カーソルが pointer でなくホバーで背景が変わらないこと、クリックしても URL もダイアログもタブも変わらないこと）、`tests/types/works.ts` の `plain` の型テスト。

## UR9-6 ユーザーの確認（2026-10-23）

- UR9-4 の「（非売品）」「終売。」「USB Type-C」が詳細の文からなくなったことは、ユーザーの意図どおり（確認済み）
