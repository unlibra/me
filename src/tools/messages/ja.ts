// Japanese texts of the web tools. English versions in ./en.ts must have
// exactly the same keys (checked by the `ToolMessages` type).
export default {
  common: {
    selectImage: "画像を選択",
    download: "ダウンロード",
    copy: "コピー",
    copied: "コピーしました",
    regenerate: "再生成",
    preview: "プレビュー",
    privacyNotice: "画像はサーバーに送信されず、ブラウザで安全に実行されます。",
    dragDropAnywhere: "または画面のどこにでもドラッグ&ドロップ",
    unsupportedFileType: "対応していないファイル形式です。",
    fileValidationError: "ファイルの検証中にエラーが発生しました。",
    dropToUpload: "ドロップして画像をアップロード",
  },
  tools: {
    "tw-palette-generator": {
      name: "TWパレットジェネレーター",
      description:
        "指定した色から、TailwindCSSに最適化されたカラーパレットを自動生成。\nコーポレートカラーやブランドカラーをベースに、50〜950まで統一感のある配色を無料で作成できます。",
      shortDescription: "選んだ色からカラーパレットを生成",
    },
    "favicon-generator": {
      name: "Faviconジェネレーター",
      description:
        "無料のFavicon一括生成ツール。PNG、JPEG、SVGなどの画像をアップロードするだけで、Webサイトに必要な全サイズのFaviconとApple Touch Iconを自動生成。\n角丸加工や背景色の設定もブラウザ上で簡単に完了します。",
      shortDescription: "画像からfaviconファイルを生成",
    },
    "svg-optimizer": {
      name: "SVG最適化",
      description:
        "無料のSVG最適化・圧縮ツール。品質を保ったままファイルサイズを削減し、Webサイトの読み込み速度を改善。\nブラウザ上で完結するため、セキュアで高速に最適化できます。",
      shortDescription: "SVGファイルを最適化・圧縮",
    },
    "password-generator": {
      name: "パスワードジェネレーター",
      description:
        "無料の強力なパスワード生成ツール。文字数、大文字・小文字・数字・記号を自由に組み合わせて、セキュアなパスワードを作成。\n紛らわしい文字の除外にも対応し、ブラウザ完結で安全です。",
      shortDescription: "シンプルなパスワードジェネレーター",
    },
  },
} as const;
