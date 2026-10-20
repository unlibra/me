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
  },
  tools: {
    "tw-palette-generator": {
      name: "TW Palette Generator",
      description:
        "Generate a complete Tailwind CSS color palette from any base color. Easily create harmonious, production-ready color scales (50-950) that align perfectly with your brand, all for free.",
      shortDescription: "Create Tailwind CSS color palettes from a single hue.",
    },
    "favicon-generator": {
      name: "Favicon Generator",
      description:
        "Instantly create all the favicons your website needs! This free tool generates multi-platform favicons and Apple Touch Icons from your PNG, JPEG, or SVG images. Easily customize rounded corners and background colors, all within your browser.",
      shortDescription: "Turn any image into a complete favicon set.",
    },
    "svg-optimizer": {
      name: "SVG Optimizer",
      description:
        "Boost your website's performance with our free SVG Optimizer. Reduce file sizes, maintain visual quality, and speed up load times. All optimizations are performed securely and rapidly directly in your browser.",
      shortDescription: "Streamline and compress your SVG files.",
    },
    "password-generator": {
      name: "Password Generator",
      description:
        "Generate robust, secure passwords with our free online tool. Customize length, include/exclude uppercase, lowercase, numbers, and symbols. We even offer an option to avoid ambiguous characters (like '0' and 'O'). All generation happens securely in your browser.",
      shortDescription: "Quick and secure password generation.",
    },
  },
};

export default en;
