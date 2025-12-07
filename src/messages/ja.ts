export default {
  site: {
    description:
      "Xオマージュのポートフォリオサイトです。趣味で開発したWebサービスやアプリ、ライブラリ、自作キーボードなどを掲載しています。",
  },
  profile: {
    bio: `Xオマージュのポートフォリオサイトです
趣味で開発したWebサービスやアプリ、ライブラリ、自作キーボードなどを掲載しています`,
    parodyLabel: "パロディサイト",
    updated: "Updated",
  },
  categories: {
    all: "All",
    web: "Web",
    software: "Software",
    keyboard: "Keyboard",
  },
  works: {
    "8px-app": {
      title: "8px app",
      description: `Tailwindと相性の良いカラーパレット生成を中心に、Favicon作成やSVG最適化など、Web・アプリ開発者が日常的に使うツールをまとめたユーティリティアプリ。
「自分が本当に欲しい機能を一つに集約する」という発想から生まれ、直感的で扱いやすい操作性を重視して設計しています。`,
    },
    "tkinter-unblur": {
      title: "tkinter-unblur",
      description:
        `Windowsの高DPI環境でTkinterアプリがぼやけてしまう問題を、importを書き換えるだけという究極にシンプルなAPIで解決するライブラリ。
複雑な設定不要で、既存コードに最小限の変更で組み込める点を重視して作りました。`,
    },
    "mira-zero": {
      title: "mira zero",
      description: `40%サイズの左右分割ロープロファイル（Choc V1）キーボード。
基板・ケースともに自作した初号機で、さまざまな技術を試す“プロトタイプ”として制作。終売。`,
    },
    "botsu": {
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
    iromide: {
      title: "推し色生成 イロマイド",
      description: `画像から推しのイメージカラーを抽出し、本物のチェキと同じ比率でレイアウトされたオリジナルチェキを生成できるWebサービス。
カラーパレット抽出アルゴリズムを調整し、ワンポイントになりがちな推し色がしっかり拾われるよう最適化しているのが特徴。
8px.app から利用可能。`,
    },
    "i18n-tiny-next": {
      title: "@i18n-tiny/next",
      description:
        `依存なし・型安全・シンプル構造を追求した、Next.js向けの最小構成i18nライブラリ。
翻訳ファイルを用意してdefine関数を呼ぶだけで、Server ComponentsとClient Componentsの両方で即座に利用可能。
messages.site.titleやt("site.title")などのパスがすべて型付きで自動サジェストされ、タイポの心配がありません。
generateStaticParamsなどのSSG設定もシンプルに記述でき、ページごとに設定を繰り返す必要なし。
middleware / proxyもcreate関数一つで完結し、プレフィックスの有無や自動言語検出など柔軟な構成に対応します。`,
    },
    "i18n-tiny-astro": {
      title: "@i18n-tiny/astro",
      description:
        `依存ゼロ・型安全・最小構成のAstro向けi18nライブラリ。
SSGとSSRの両方に対応。define関数一つで設定が完了し、messages.common.titleなどのキーパスがすべて自動補完されます。
getStaticPathsでのロケール設定も最小限の記述で済み、ページごとに繰り返し書く必要はありません。
middleware.create()でルーティング設定も完結し、プレフィックスの有無や自動言語検出など柔軟な構成に対応します。`,
    },
  },
  footer: {
    endOfTimeline: "ここで終わりです",
    privacyPolicy: "プライバシーポリシー",
  },
  pinned: "固定",
};
