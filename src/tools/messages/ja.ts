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
    close: "閉じる",
    // Checks of the selected file (src/tools/lib/file.ts). {max}, {width}
    // and {height} are replaced with numbers.
    fileErrors: {
      tooLarge: "ファイルサイズが大きすぎます（最大{max}MB）",
      selectImage: "画像ファイルを選択してください",
      svgOnly: "SVGファイルのみアップロードできます",
      dimensionsTooLarge: "画像サイズが大きすぎます（最大{width}×{height}px）",
      loadFailed: "画像の読み込みに失敗しました",
    },
  },
  tools: {
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
  passwordGenerator: {
    selectCharacterTypes: "文字種を選択してください",
    copyToClipboard: "パスワードをクリップボードにコピー",
    length: "文字数",
    characterTypes: "使用する文字",
    characterTypesHint: "選択した文字種は必ず1文字以上含まれます",
    uppercase: "大文字",
    lowercase: "小文字",
    numbers: "数字",
    symbols: "記号",
    avoidAmbiguous: "紛らわしい文字を除外",
    avoidAmbiguousHint: "0とO、1とlとIなど",
    errors: {
      copyFailed: "コピーに失敗しました",
    },
  },
  faviconGenerator: {
    outputOptions: "出力オプション",
    uploadHint:
      "PNG, JPG, WEBP, SVGなど画像ファイルをアップロードできます (最大10MB)",
    previewPlaceholder: {
      line1: "画像を選択すると",
      line2: "プレビューが表示されます",
    },
    fileFormat: "ファイル形式",
    formatDescriptions: {
      favicon: "従来のブラウザ用",
      "apple-touch-icon": "iOS用 (180×180)",
      "android-icon": "Android/PWA用 (192×192, 512×512)",
    },
    faviconSizes: "favicon.icoに含めるサイズ",
    recommendedSizes: "推奨サイズ",
    otherSizes: "その他サイズ",
    borderRadius: "角丸の調整",
    borderRadiusHint:
      "アイコンの角を丸くします。Apple Touch IconはiOSが自動的に角丸にします。",
    backgroundColorSetting: "背景色の設定",
    backgroundColorHint:
      "透過PNGに背景色を追加します。Apple Touch Iconは常に背景色が適用されます。",
    addBackgroundColor: "背景色を追加する",
    selectBackgroundColor: "背景色を選択",
    backgroundColorCode: "背景色のカラーコード",
    errors: {
      imageLoadFailed: "画像の読み込みに失敗しました",
      selectImage: "画像ファイルを選択してください",
      selectOutputFormat: "少なくとも1つの出力形式を選択してください",
      selectSize:
        "favicon.icoを選択した場合、少なくとも1つのサイズを選択してください",
      generateFailed: "ファビコンの生成に失敗しました",
    },
  },
  svgOptimizer: {
    uploadHint: "SVGファイルをアップロードできます (最大10MB)",
    previewPlaceholder: {
      line1: "SVGファイルを選択すると",
      line2: "プレビューが表示されます",
    },
    original: "元のファイル",
    optimized: "最適化後",
    optimizedPreviewAlt: "最適化後プレビュー",
    compressionRatio: "圧縮率",
    preset: "プリセット",
    safe: "推奨",
    "svgo-default": "標準圧縮",
    maximum: "最大圧縮",
    precisionSettings: "精度設定",
    precisionHint:
      "数値の精度を調整します。値が低いほど圧縮率が高くなりますが、精度が低下します。",
    floatPrecision: "小数点以下の桁数",
    transformPrecision: "transform属性の精度",
    options: "最適化オプション",
    groups: {
      cleanup: "クリーンアップ",
      optimization: "最適化",
      structural: "構造変更",
      advanced: "高度な設定",
      dangerous: "危険な設定",
      dangerousDescription:
        "セキュリティリスクがあります。信頼できるSVGファイルのみ使用してください。",
    },
    errors: {
      svgLoadFailed: "SVGファイルの読み込みに失敗しました",
      selectSvg: "SVGファイルを選択してください",
      optimizeFailed: "SVGの最適化に失敗しました",
    },
  },
} as const;
