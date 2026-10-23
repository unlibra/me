import type ja from "./ja";
import type { SameStructure } from "./types";

/** Texts of the web tools: the keys of the Japanese messages, as strings. */
export type ToolMessages = SameStructure<typeof ja>;

const en: ToolMessages = {
  common: {
    selectImage: "Select an Image",
    download: "Download",
    copy: "Copy",
    copied: "Copied!",
    regenerate: "Regenerate",
    preview: "Preview",
    privacyNotice:
      "Images are processed securely in your browser and never sent to our servers.",
    dragDropAnywhere: "Or drag and drop anywhere on the screen.",
    unsupportedFileType: "Unsupported file type.",
    fileValidationError: "File validation failed.",
    dropToUpload: "Drop to upload your image.",
    close: "Close",
    fileErrors: {
      tooLarge: "The file is too large (max {max}MB).",
      selectImage: "Please select an image file.",
      svgOnly: "Only SVG files can be uploaded.",
      dimensionsTooLarge: "The image is too large (max {width}×{height}px).",
      loadFailed: "Failed to load the image.",
    },
  },
  tools: {
    "favicon-generator": {
      name: "Favicon Generator",
      description:
        "Instantly create all the favicons your website needs! This free tool generates multi-platform favicons and Apple Touch Icons from your PNG, JPEG, or SVG images. Easily customize rounded corners and background colors, all within your browser.",
    },
    "svg-optimizer": {
      name: "SVG Optimizer",
      description:
        "Boost your website's performance with our free SVG Optimizer. Reduce file sizes, maintain visual quality, and speed up load times. All optimizations are performed securely and rapidly directly in your browser.",
    },
    "password-generator": {
      name: "Password Generator",
      description:
        "Generate robust, secure passwords with our free online tool. Customize length, include/exclude uppercase, lowercase, numbers, and symbols. We even offer an option to avoid ambiguous characters (like '0' and 'O'). All generation happens securely in your browser.",
    },
  },
  passwordGenerator: {
    selectCharacterTypes: "Select Character Types",
    copyToClipboard: "Copy Password to Clipboard",
    length: "Length",
    characterTypes: "Character Types",
    characterTypesHint:
      "Selected character types will each include at least one character.",
    uppercase: "Uppercase",
    lowercase: "Lowercase",
    numbers: "Numbers",
    symbols: "Symbols",
    avoidAmbiguous: "Exclude Ambiguous Characters",
    avoidAmbiguousHint: "e.g., 0 and O, 1 and l and I",
    errors: {
      copyFailed: "Failed to copy.",
    },
  },
  faviconGenerator: {
    outputOptions: "Output Options",
    uploadHint: "Upload PNG, JPG, WEBP, SVG, or other image files (max 10MB).",
    previewPlaceholder: {
      line1: "Select an image to",
      line2: "see a preview.",
    },
    fileFormat: "Output File Format",
    formatDescriptions: {
      favicon: "For traditional browsers.",
      "apple-touch-icon": "For iOS (180x180 px).",
      "android-icon": "For Android/PWAs (192x192, 512x512 px).",
    },
    faviconSizes: "Sizes to include in favicon.ico",
    recommendedSizes: "Recommended Sizes",
    otherSizes: "Other Sizes",
    borderRadius: "Adjust Corner Radius",
    borderRadiusHint:
      "Rounds the corners of your icon. iOS automatically applies rounded corners to Apple Touch Icons.",
    backgroundColorSetting: "Background Color Settings",
    backgroundColorHint:
      "Adds a background color to transparent PNGs. A background color is always applied to Apple Touch Icons.",
    addBackgroundColor: "Add Background Color",
    selectBackgroundColor: "Select Background Color",
    backgroundColorCode: "Background Color Code",
    errors: {
      imageLoadFailed: "Failed to load image.",
      selectImage: "Please select an image file.",
      selectOutputFormat: "Please select at least one output format.",
      selectSize:
        "If favicon.ico is selected, please choose at least one size.",
      generateFailed: "Failed to generate favicon.",
    },
  },
  svgOptimizer: {
    uploadHint: "Upload SVG files (max 10MB).",
    previewPlaceholder: {
      line1: "Select an SVG file to",
      line2: "see a preview.",
    },
    original: "Original",
    optimized: "Optimized",
    optimizedPreviewAlt: "Optimized preview",
    compressionRatio: "Compression Ratio",
    preset: "Preset",
    safe: "Recommended",
    "svgo-default": "Standard Compression",
    maximum: "Maximum Compression",
    precisionSettings: "Precision Settings",
    precisionHint:
      "Adjust the numeric precision. Lower values increase compression but reduce accuracy.",
    floatPrecision: "Floating Point Precision",
    transformPrecision: "Transform Attribute Precision",
    options: "Optimization Options",
    groups: {
      cleanup: "Cleanup",
      optimization: "Optimization",
      structural: "Structural Changes",
      advanced: "Advanced Settings",
      dangerous: "Dangerous Settings",
      dangerousDescription:
        "Security risks are present. Only use with trusted SVG files.",
    },
    errors: {
      svgLoadFailed: "Failed to load SVG file.",
      selectSvg: "Please select an SVG file.",
      optimizeFailed: "Failed to optimize SVG.",
    },
  },
};

export default en;
