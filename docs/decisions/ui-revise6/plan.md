# UI の見直し（6回目、ユーザーの指示、2026-10-23）

## ユーザーの指示と親の解釈

1. **フッターの説明文を更新する。** 日本語：「個人で制作したプロダクトを紹介するサイトです。昼はビルダー。夜は個人開発。自作キーボード、ライブラリ、アプリ、VRアバターや3Dアセットなど、ジャンルにとらわれず自由にものづくりしています。」（2026-10-23 ユーザーの再修正）英語（ユーザー指定）「A personal site showcasing my projects. A builder by day. An indie maker by night. From DIY keyboards and software libraries to apps, VR avatars, and 3D assets, I create whatever sparks my curiosity.」。トップの meta description もフッターの説明文に合わせる（これまでどおり）
2. **Libraries（3件）と Apps（4件）のカードの説明文を、2行程度にする。** 足りないものは補い、長いものは要約する。幅 1280px のカードで2行前後に収まる長さを目安にする。Apps は以前「liblab と同じ文言」にしたが、今回の指示を優先する。新しい文面は仮の文面として、判断ログに旧文面と並べて一覧で書く（ユーザーが確認する）
3. **フッターの「SUPPORT」の見出しを「INFORMATION」に変え、「クレジット」へのリンクを足す**（日英。英語ページのリンクは、プライバシーポリシーと同じく日本語のページへのリンクであることが分かる表記にする）
4. **クレジットのページ `/credits` を作る**（日本語のみ。プライバシーポリシーと同じ扱い：BaseLayout、canonical、サイトマップに載る）。内容：
   - 見出し「クレジット」と、説明「当サイトで使用しているキャラクターや素材等の権利表記を掲載しています。」
   - 「キャラクター」：「ムルル © Lethal Cats」
   - 「その他の素材・ライセンス」：説明「必要に応じて素材名、著作者、ライセンス、参照先を記載します。」に続けて、`LICENSE` の第2節に載っている第三者の素材を、素材名・著作者・ライセンス・参照先の形で並べる（DiceBear の Shapes と Planets、Lucide、Heroicons、tailwindcss の色の値など。今 `LICENSE` にあるものを正とする）。フォント（Noto Sans JP、LINE Seed JP、Roboto Mono）と、同梱ライブラリの一覧 `/third-party-licenses.txt` へのリンクも載せる
   - 載せる内容が `LICENSE` と食い違わないことをテストで確かめる（LICENSE に第三者の素材を足したのにクレジットのページに載っていない、を検出できる形）

## 受け入れ条件

- Q1：build、lint、format:check、`npm test`、`npm run test:e2e` が通る。仕様が変わった既存テストは合わせ、判断ログに一覧で書く
- Q2：1〜4 を確かめるテストがある。説明文は幅 1280px のカードで3行以内に収まることを E2E で確かめる
- Q3：ライトとダーク、幅 375px と 1280px で崩れない
- Q4：新しい文言（英語の説明文、カードの説明文、クレジットのページ、フッターのリンク）を仮の文面として判断ログに書く

## 共通

- スコープは `ui-revise6`。判断ログ：`docs/decisions/ui-revise6/ui-revise6.md`
- workers.dev へのデプロイはしない（ユーザーの指示があるまで）
- コミットメッセージは英語。`Co-Authored-By` のフッターは付けない
