# 履歴の書き換え（2026-10-21）

## 理由

ライセンスの変更（MIT → All rights reserved ＋ 一部 MIT）を Phase 5 で行ったため、それより前のコミットには旧来の MIT の `LICENSE` が入ったままだった。そのうち一部は GitHub に push 済みだった（feature ブランチ、数時間）。ユーザーの許可を得て、ブランチの先頭に All rights reserved の `LICENSE` を置くコミット（`aa397ee`）を差し込み、後続の全コミットを載せ直して force-push した。

- 書き換え後、ブランチのすべてのコミットの `LICENSE` は `Copyright (c) 2025 unlibra. All rights reserved.` で始まる
- 最終的なファイルの内容は、書き換え前と完全に一致する（`git diff` で差分なし）
- すでに push していた旧コミットの内容を取得した人がいれば、その分は MIT のまま（取り消せない）
- 書き換え前の履歴は、ローカルのタグ `backup/pre-license-rewrite` に残してある（2026-10-23 にユーザーの指示で削除した。書き換え後の作業に問題がなかったため）

## 新旧の SHA の対応

判断ログやレビュー記録に書いた SHA は、書き換え前のもの。次の表で読み替える。

| 旧        | 新        | コミット                                                                 |
| --------- | --------- | ------------------------------------------------------------------------ |
| `1e18800` | `44f922f` | Add site replacement plan                                                |
| `65b278e` | `296824e` | Update replacement plan and add phase 1 implementation plan              |
| `0b56fa9` | `9b4b257` | Replace Vercel setup with Cloudflare Workers static assets               |
| `c2e3685` | `74d3fe4` | Format files with Prettier                                               |
| `309fe3a` | `6649502` | Record phase 1 parent decisions                                          |
| `82a9bb0` | `647cddb` | Mark phase 1 complete in replacement plan                                |
| `d90b536` | `383b0b2` | Add Astro 7 upgrade scope to phase 1 plan                                |
| `117e224` | `5191331` | Upgrade Astro to 7                                                       |
| `28be279` | `e4d122f` | Add phase 2 plan and record phase 1 sitemap decision                     |
| `07435f7` | `463b799` | Pin Node version and mark phase 1 complete                               |
| `fdeaf81` | `55d1055` | Add common base layout with theme init and Noto Sans JP                  |
| `c677ae5` | `d365ef7` | Add header, footer, and theme toggle to the common layout                |
| `105c4a2` | `cd336ac` | Record provisional wording and UI check items for phase 2                |
| `72b0790` | `14a7067` | Generate favicon, touch icon, and OGP image from the brand symbol        |
| `da8cae8` | `326e183` | Add icon designs to phase 2 UI check items                               |
| `3838c4e` | `cbc5934` | Mark phase 2 complete in replacement plan                                |
| `240237a` | `b032968` | Add phase 3 implementation plan                                          |
| `aa343f2` | `073bdf2` | Rebuild the top page as category sections with typed works data          |
| `ecf4f0d` | `49cffaf` | Mention the theme choice in the privacy policy's local storage section   |
| `875236d` | `796b39f` | Add phase 4 plan and user review summary                                 |
| `ae23c89` | `09221e4` | Remove the remaining X-style parts from the top page                     |
| `1a82046` | `2e458b9` | Mark phase 3 complete and collect its UI check items                     |
| `8d0dc9a` | `2f189ca` | Add phase 5 plan draft and update user review summary                    |
| `c311144` | `b0a93b5` | Add tool list pages, tool page template, and shared UI for the web tools |
| `2af5478` | `b2d483f` | Close the baseUrl gap in the license boundary rule                       |
| `2a9d98c` | `362432f` | Record baseUrl removal decision for phase 4                              |
| `18cf1ca` | `a7f8a74` | Port the password generator and SVG optimizer as React islands           |
| `7742436` | `4ce02e3` | Port the favicon generator as a React island                             |
| `a2594ba` | `bb4ca25` | Add SVG optimizer question to user review summary                        |
| `6f1685c` | `da9b434` | Port the Tailwind palette generator as a React island                    |
| `03142bc` | `2e74c05` | Mark phase 4 complete and update user review items                       |
| `7bc357f` | `30ac4f7` | Replace the MIT license with All rights reserved and MIT exceptions      |
| `104699b` | `5510c29` | List the Tailwind color fixture and palette anchors in LICENSE           |
| `ad32cf6` | `3fcf3ff` | Mark phase 5 complete, add phase 6 plan, and update user review          |
| `62ea9f5` | `30fc1a4` | Add redirects from the former URLs and the cutover runbook               |
| `b6edfac` | `8034516` | List the domain cutover methods as options in the runbook                |
| `c34f34e` | `f1a3da3` | Mark phase 6 repository work complete                                    |
| `f17456e` | `4771eb3` | Add plan for fixes decided after user review                             |
| `d12663c` | `3724271` | Make switched-off SVG optimizer plugins actually stay off                |
| `b15112f` | `efdf3d9` | Put the # prefix on BASE when resetting palette adjustments              |
| `e2214a6` | `232407b` | Ship a list of third-party licenses with the site                        |
| `03ce796` | `46f45cd` | List every bundled version and the bundler runtime in the license list   |
| `bdb4e14` | `39bb619` | Include rolldown's THIRD-PARTY-LICENSE in the license list               |
| `e09b4e2` | `d8e8114` | Record user answers and add test expansion plan                          |
