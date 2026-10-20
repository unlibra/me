// Texts of the header and footer shared by all pages.
import type { Locale } from "@/config/locales";
import type { SameStructure } from "@/messages/types";

const ja = {
  header: {
    tools: "ツール",
    github: "GitHub",
  },
  theme: {
    toggle: "テーマを切り替え",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
  },
  language: {
    toggle: "言語を切り替え",
    label: "Language",
  },
  footer: {
    description:
      "unlibra の制作物をまとめたサイトです。自作キーボード、ソフトウェア、WEBツール、VRChat のアイテムを掲載しています。",
    github: "GitHub",
    support: "Support",
    donate: "寄付・支援",
    privacyPolicy: "プライバシーポリシー",
  },
} as const;

export type LayoutMessages = SameStructure<typeof ja>;

const en: LayoutMessages = {
  header: {
    tools: "Tools",
    github: "GitHub",
  },
  theme: {
    toggle: "Toggle theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  language: {
    toggle: "Change language",
    label: "Language",
  },
  footer: {
    description:
      "A collection of works by unlibra: custom keyboards, software, web tools, and VRChat items.",
    github: "GitHub",
    support: "Support",
    donate: "Donate & Support",
    privacyPolicy: "Privacy Policy (Japanese)",
  },
};

export const layoutMessages: Record<Locale, LayoutMessages> = { ja, en };

/** Language names, each written in its own language. */
export const localeNames = {
  ja: "日本語",
  en: "English",
} as const satisfies Record<Locale, string>;
