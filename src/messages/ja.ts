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
    useTool: "ツールを使う",
    viewOnBooth: "BOOTH で見る",
    npm: "npm",
    pypi: "PyPI",
  },
  /**
   * Each work's title and the one-line summary for its card (provisional,
   * except the Apps', which are the former tool site's cards' texts). The
   * works whose cards open their details (DIY Keyboards) have the
   * description shown there.
   */
  works: {
    "tkinter-unblur": {
      title: "tkinter-unblur",
      summary:
        "高 DPI の Windows で Tkinter がぼやける問題を import 一行で解決",
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
      summary: "依存ゼロ・型安全・最小構成の Next.js 向け i18n",
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      summary: "依存ゼロ・型安全・最小構成の Astro 向け i18n",
    },
    // The Apps: the former tool site's card texts (the tool's name, and its
    // description without the line breaks, as its card showed it).
    "tw-palette-generator": {
      title: "TWパレットジェネレーター",
      summary:
        "指定した色から、TailwindCSSに最適化されたカラーパレットを自動生成。コーポレートカラーやブランドカラーをベースに、50〜950まで統一感のある配色を無料で作成できます。",
    },
    "favicon-generator": {
      title: "Faviconジェネレーター",
      summary:
        "無料のFavicon一括生成ツール。PNG、JPEG、SVGなどの画像をアップロードするだけで、Webサイトに必要な全サイズのFaviconとApple Touch Iconを自動生成。角丸加工や背景色の設定もブラウザ上で簡単に完了します。",
    },
    "svg-optimizer": {
      title: "SVG最適化",
      summary:
        "無料のSVG最適化・圧縮ツール。品質を保ったままファイルサイズを削減し、Webサイトの読み込み速度を改善。ブラウザ上で完結するため、セキュアで高速に最適化できます。",
    },
    "password-generator": {
      title: "パスワードジェネレーター",
      summary:
        "無料の強力なパスワード生成ツール。文字数、大文字・小文字・数字・記号を自由に組み合わせて、セキュアなパスワードを作成。紛らわしい文字の除外にも対応し、ブラウザ完結で安全です。",
    },
    "mururu-blink-lipsync": {
      title: "【ムルル対応】まばたき＆リップシンク追加ツール",
      summary: "ムルルにまばたきとリップシンクを追加する Unity ツール",
    },
  },
} as const;
