import { layoutMessages } from "@/messages/layout";

export default {
  site: {
    /** The top page's meta description: the footer's description. */
    description: layoutMessages.ja.footer.description,
  },
  hero: {
    /** The top page's h1. */
    title: "昼はカフェ。夜はバー。",
    /** The link buttons below the title (provisional wording). */
    github: "GitHub",
    booth: "BOOTH",
  },
  categories: layoutMessages.ja.header.categories,
  links: {
    docs: "ドキュメント",
  },
  /** The cards and their detail dialogs (provisional wording). */
  workDetails: {
    /** On the cards that open their details (DIY Keyboards). */
    more: "詳しく見る",
    close: "閉じる",
    /** The links of a work, on its card and in its details. */
    openApp: "アプリを開く",
    viewOnBooth: "BOOTH で見る",
    npm: "npm",
    pypi: "PyPI",
    /** Above the title of a large card (ui-revise5 13). */
    spotlight: "SPOTLIGHT",
  },
  /**
   * Each work's title and the summary for its card (provisional). The
   * summaries of Libraries and Apps are about two lines on a 1280px wide
   * page (ui-revise6 2). The works whose cards open their details (DIY
   * Keyboards) have the description shown there.
   */
  works: {
    "tkinter-unblur": {
      title: "tkinter-unblur",
      summary:
        "高 DPI の Windows で Tkinter のアプリがぼやけて表示される問題を、import を一行足すだけで解決する Python ライブラリです。",
    },
    "mira-zero": {
      title: "mira zero",
      summary: "基板もケースも自作した、40% 左右分割ロープロの初号機",
      description: `40%サイズの左右分割ロープロファイル（Choc V1）キーボード。
基板・ケースともに自作した初号機で、さまざまな技術を試す“プロトタイプ”として制作。終売。`,
    },
    botsu: {
      title: "没キーボード",
      summary: "エンドゲームに行き着くまでに生まれたプロトタイプたち",
      description: `エンドゲームに行き着くまでに量産された、数々のプロトタイプキーボードたち...。`,
    },
    "fosty-natural": {
      title: "fosty natural",
      summary: "HHKB 風の配列を 40% に収めた、白×シルバーのロープロ一体型",
      description: `HHKBを40%に落とし込んだような美しい配列とデザインを持つ、ロープロファイル（Choc V2）キーボード。
アルミ削り出し筐体、無駄のない薄型設計、ガスケットマウントによる心地よい打鍵感、USB Type-C、そして一体型レイアウトによる携帯性と安定性を追求。
白いデスクに映える白×シルバーの配色で、キースイッチまで統一したキメラスイッチを採用。
打鍵感・携帯性・配列・デザインのバランスが理想形となり、自分の“エンドゲーム”と呼べる一台に仕上がっています。（非売品）`,
    },
    "fosty-dark": {
      title: "fosty dark",
      summary: "fosty natural の兄弟機。黒×オレンジのもうひとつのエンドゲーム",
      description: `fosty natural の兄弟モデルとなる40%ロープロ（Choc V2）キーボード。
黒いデスクに映えるブラック×オレンジという配色に合わせ、こちらもキースイッチを特別な構成でカスタム。
「黒も欲しくなった」ことをきっかけに制作した、もうひとつのエンドゲーム（非売品）`,
    },
    "i18n-tiny-next": {
      title: "@i18n-tiny/next",
      summary:
        "依存ゼロ・型安全・最小構成で、Next.js のアプリを多言語化できる i18n ライブラリです。必要な機能だけを小さくまとめています。",
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      summary:
        "依存ゼロ・型安全・最小構成で、Astro のサイトを多言語化できる i18n ライブラリです。必要な機能だけを小さくまとめています。",
    },
    // The Apps: the former tool site's names; the summaries are shortened
    // from its cards' texts (ui-revise6 2).
    "tw-palette-generator": {
      title: "TWパレットジェネレーター",
      summary:
        "指定した色から、TailwindCSSに最適化された50〜950のカラーパレットを自動生成。統一感のある配色を作れます。",
    },
    "favicon-generator": {
      title: "Faviconジェネレーター",
      summary:
        "画像から、Webサイトに必要な全サイズのFaviconとApple Touch Iconを一括生成。角丸や背景色も設定できます。",
    },
    "svg-optimizer": {
      title: "SVG最適化",
      summary:
        "品質を保ったままSVGのファイルサイズを削減し、Webサイトの読み込みを速くします。ブラウザ上で完結するので安全です。",
    },
    "password-generator": {
      title: "パスワードジェネレーター",
      summary:
        "文字数や文字の種類を選んで、強力なパスワードを生成。紛らわしい文字の除外にも対応し、ブラウザ上で安全に作成できます。",
    },
    "mururu-blink-lipsync": {
      title: "【ムルル対応】まばたき＆リップシンク追加ツール",
      summary: "ムルルにまばたきとリップシンクを追加する Unity ツール",
    },
  },
} as const;
