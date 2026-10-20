import type { Category, VrchatSubcategory } from "@/config/works";

export default {
  site: {
    description:
      "unlibra のポートフォリオです。自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを掲載しています。",
  },
  profile: {
    bio: "自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを作っています。",
  },
  categoryNav: "作品カテゴリ",
  categories: {
    keyboard: "自作キーボード",
    software: "ソフトウェア",
    web: "WEBツール",
    vrchat: "VRChat",
  } satisfies Record<Category, string>,
  vrchatSubcategories: {
    avatar: "アバター",
    asset: "アセット",
    "unity-tool": "Unityツール",
  } satisfies Record<VrchatSubcategory, string>,
  links: {
    docs: "ドキュメント",
    shop: "BOOTH ショップ",
  },
  works: {
    "tkinter-unblur": {
      title: "tkinter-unblur",
      description: `Windowsの高DPI環境でTkinterアプリがぼやけてしまう問題を、importを書き換えるだけという究極にシンプルなAPIで解決するライブラリ。
複雑な設定不要で、既存コードに最小限の変更で組み込める点を重視して作りました。`,
    },
    "mira-zero": {
      title: "mira zero",
      description: `40%サイズの左右分割ロープロファイル（Choc V1）キーボード。
基板・ケースともに自作した初号機で、さまざまな技術を試す“プロトタイプ”として制作。終売。`,
    },
    botsu: {
      title: "没キーボード",
      description: `エンドゲームに行き着くまでに量産された、数々のプロトタイプキーボードたち...。`,
    },
    "fosty-natural": {
      title: "fosty natural",
      description: `HHKBを40%に落とし込んだような美しい配列とデザインを持つ、ロープロファイル（Choc V2）キーボード。
アルミ削り出し筐体、無駄のない薄型設計、ガスケットマウントによる心地よい打鍵感、USB Type-C、そして一体型レイアウトによる携帯性と安定性を追求。
白いデスクに映える白×シルバーの配色で、キースイッチまで統一したキメラスイッチを採用。
打鍵感・携帯性・配列・デザインのバランスが理想形となり、自分の“エンドゲーム”と呼べる一台に仕上がっています。（非売品）`,
    },
    "fosty-dark": {
      title: "fosty dark",
      description: `fosty natural の兄弟モデルとなる40%ロープロ（Choc V2）キーボード。
黒いデスクに映えるブラック×オレンジという配色に合わせ、こちらもキースイッチを特別な構成でカスタム。
「黒も欲しくなった」ことをきっかけに制作した、もうひとつのエンドゲーム（非売品）`,
    },
    "i18n-tiny-next": {
      title: "@i18n-tiny/next",
      description: `依存なし・型安全・シンプル構造を追求した、Next.js向けの最小構成i18nライブラリ。
翻訳ファイルを用意してdefine関数を呼ぶだけで、Server ComponentsとClient Componentsの両方で即座に利用可能。
messages.site.titleやt("site.title")などのパスがすべて型付きで自動サジェストされ、タイポの心配がありません。
generateStaticParamsなどのSSG設定もシンプルに記述でき、ページごとに設定を繰り返す必要なし。
middleware / proxyもcreate関数一つで完結し、プレフィックスの有無や自動言語検出など柔軟な構成に対応します。`,
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      description: `依存ゼロ・型安全・最小構成のAstro向けi18nライブラリ。
SSGとSSRの両方に対応。define関数一つで設定が完了し、messages.common.titleなどのキーパスがすべて自動補完されます。
getStaticPathsでのロケール設定も最小限の記述で済み、ページごとに繰り返し書く必要はありません。
middleware.create()でルーティング設定も完結し、プレフィックスの有無や自動言語検出など柔軟な構成に対応します。`,
    },
    "tw-palette-generator": {
      title: "TWパレットジェネレーター",
      description:
        "指定した色から、TailwindCSSに最適化されたカラーパレットを自動生成。\nコーポレートカラーやブランドカラーをベースに、50〜950まで統一感のある配色を無料で作成できます。",
    },
    "favicon-generator": {
      title: "Faviconジェネレーター",
      description:
        "無料のFavicon一括生成ツール。PNG、JPEG、SVGなどの画像をアップロードするだけで、Webサイトに必要な全サイズのFaviconとApple Touch Iconを自動生成。\n角丸加工や背景色の設定もブラウザ上で簡単に完了します。",
    },
    "svg-optimizer": {
      title: "SVG最適化",
      description:
        "無料のSVG最適化・圧縮ツール。品質を保ったままファイルサイズを削減し、Webサイトの読み込み速度を改善。\nブラウザ上で完結するため、セキュアで高速に最適化できます。",
    },
    "password-generator": {
      title: "パスワードジェネレーター",
      description:
        "無料の強力なパスワード生成ツール。文字数、大文字・小文字・数字・記号を自由に組み合わせて、セキュアなパスワードを作成。\n紛らわしい文字の除外にも対応し、ブラウザ完結で安全です。",
    },
    "dummy-avatar": {
      title: "ダミーのアバター",
      description: "ダミーの商品です。BOOTH で販売中のアバターに差し替えます。",
    },
    "dummy-asset": {
      title: "ダミーのアセット",
      description: "ダミーの商品です。BOOTH で販売中のアセットに差し替えます。",
    },
    "dummy-unity-tool": {
      title: "ダミーのUnityツール",
      description:
        "ダミーの商品です。BOOTH で販売中のUnityツールに差し替えます。",
    },
  },
} as const;
